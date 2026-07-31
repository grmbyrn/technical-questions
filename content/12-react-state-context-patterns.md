---
slug: react-state-context-patterns
order: 12
number: '11c'
group: FRAMEWORKS
title: React — State, Context & Patterns
status: answered
---

## What are the pitfalls of using Context, and how do you optimise it to avoid unnecessary re-renders? (M)

The main one is that Context has no selector. A consumer subscribes to the whole value, so any change to it re-renders every component calling `useContext`, however little of it they actually read. That makes it a poor fit for state that changes frequently or holds unrelated concerns in one object.

The second is that it is easy to reach for too early. Context solves prop drilling; it is not a state manager, it has no caching, no devtools, no middleware, and — importantly — putting a value in Context does not make it global state, it just changes how it is delivered. A lot of Context usage in real codebases would have been better as composition, or as a query library, or as three props.

Third, provider placement matters and is easy to get wrong: a provider at the app root whose value changes on every keystroke re-renders the entire tree, and a provider that recreates its value object each render does the same even when nothing meaningful changed.

The optimisations are: memoise the value, split one context into several by update frequency, split state from dispatch, put the provider as low in the tree as it can go, and wrap the expensive consumers in `memo`. If you have done all that and still have a problem, the honest answer is that the state wants an external store with `useSyncExternalStore` selectors — that is what Zustand, Jotai and Redux give you and Context does not.

### Why does every consumer re-render when one field of the value object changes?

Because the subscription is to the context, not to a path inside it. React compares the new provider value with the old one using `Object.is` and, if it differs, schedules a re-render for every fiber that read that context — there is no comparison of what each consumer used, because React has no idea what it used.

And with an object value, changing one field means creating a new object, which is a new reference, which always differs. So `{ user, theme, cart }` re-renders the theme consumers when the cart changes, and re-renders everything if the provider creates that object inline each render even when all three fields are identical.

```
// every consumer re-renders on every provider render
<AppContext.Provider value={{ user, theme, cart }}>

// stable unless one of the three actually changes
const value = useMemo(() => ({ user, theme, cart }), [user, theme, cart]);
<AppContext.Provider value={value}>
```

Note that `memo` on the consumer does not help — a context change bypasses the props comparison. `memo` only protects a component from its parent re-rendering, not from a context it reads.

### How does splitting the context, or memoising the value, help?

Memoising fixes the false positives. `useMemo` on the value object means the reference only changes when one of its parts genuinely changed, so a provider re-rendering for an unrelated reason no longer cascades. It is the minimum bar, and it needs to go all the way down — a memoised object containing a fresh callback is not stable.

Splitting fixes the true positives, which is the bigger win. If theme and cart live in separate contexts, a cart change cannot reach a theme consumer at all, because it is not subscribed. The version of this I use most is separating state from dispatch: the dispatch context's value is a stable function that never changes, so components that only trigger updates never re-render when the state moves.

```
const StateCtx    = createContext(null);
const DispatchCtx = createContext(null);

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <DispatchCtx.Provider value={dispatch}>       {/* never changes */}
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}
```

The other structural trick is passing `children` through the provider component rather than nesting the tree inside it, so the subtree element is created by the parent and does not re-render when the provider's own state changes.

## How do you decide between React state, context and an external state manager? (M)

I start with the narrowest option and widen only when something forces it. Local `useState` for anything one component owns. Lift it to the nearest common ancestor when two components need to agree. Context when the same value is needed by many components at different depths and passing it through would mean threading a prop through layers that do not care. An external store when the state is genuinely global, changes often, or needs features Context does not have.

The question that resolves most cases is what *kind* of state it is. Server data — anything fetched — is not really application state; it is a cache of something that lives elsewhere, and it wants a query library that handles staleness, dedupe, retries and revalidation. URL state — filters, tabs, pagination, the selected item — belongs in the URL, so it survives refresh and can be shared. Form state wants a form library. What is left after removing those three is usually a small amount of genuine UI state, and it is often fine in `useState`.

Context is right for low-frequency, widely-read values: theme, locale, the authenticated user, a feature-flag set. It is wrong for high-frequency values, because of the re-render behaviour, and it is wrong as a way to avoid thinking about where state should live.

An external store earns its place when you need selector-based subscriptions so components only re-render for the slice they read, when the state is updated from outside React, when you want devtools and a serialisable action history, or when the state graph is genuinely complex — a collaborative editor, an interactive canvas, a large dashboard. Zustand for most of that, Redux Toolkit if the team already knows it and wants the structure, Jotai if the state decomposes naturally into small atoms.

## What is the Flux pattern, and what are its benefits? (M)

Flux is Facebook's architecture for unidirectional data flow at the application level: a view dispatches an *action*, a *dispatcher* routes it to *stores*, stores update their own state and emit a change, and views re-render from the stores. The critical rule is that nothing writes to a store directly — the only way to change anything is to dispatch a described action.

The benefit is that it makes state changes traceable. Every mutation has a name and a payload, they are processed one at a time in a single place, and you can log the whole sequence. When something is wrong on screen you replay the action log instead of guessing which of forty components wrote to the model. The problem it was invented for was exactly this: Facebook's notification count getting out of sync because too many places could write to it.

The other benefit is that it makes the update logic testable in isolation. A reducer is a pure function of state and action, so testing "what happens when the user removes the last item from the cart" is a function call rather than a rendered tree.

Redux is Flux with the dispatcher removed and a single store made of pure reducers, and `useReducer` is the same shape scoped to a component. Both inherit the same tradeoff — indirection and boilerplate in exchange for a state model you can reason about — which is why the pattern is worth reaching for when the state is complex and worth avoiding when it is not.

## Explain the composition pattern. (M)

Building behaviour by passing components into other components rather than by inheritance or configuration props. A component that needs to be flexible takes `children`, or takes elements as props, and renders them into slots — it decides *where* things go and the caller decides *what* they are.

The alternative it replaces is the component with a growing prop surface: `<Dialog title showCloseButton icon footerButtons variant hasHeader />`, where every new requirement adds a prop and a branch. With composition the same component takes `<Dialog.Header>`, `<Dialog.Body>` and `<Dialog.Footer>` and stops needing to know what is inside them.

```
// configuration — every variation is a new prop
<Card title="Sales" icon={<Chart />} footer="Updated 5m ago" collapsible />

// composition — the card owns layout, the caller owns content
<Card>
  <Card.Header><Chart /> Sales</Card.Header>
  <Card.Body>{…}</Card.Body>
  <Card.Footer>Updated 5m ago</Card.Footer>
</Card>
```

React has no component inheritance and the docs recommend against trying to simulate it — composition plus props covers everything inheritance would, without the coupling. The same idea covers `children` as a slot, render props, specialised components wrapping generic ones, and the compound component pattern below.

### How does passing children solve prop drilling without Context?

Because the element is *created* where the data already is, and passed down as an opaque value. The intermediate components never see the data — they receive a rendered element and put it somewhere — so there is nothing to thread through them.

```
// drilling: every layer has to know about user
<Page user={user}><Sidebar user={user}><Profile user={user} /></Sidebar></Page>

// composition: Page and Sidebar know nothing about user
<Page>
  <Sidebar>
    <Profile user={user} />
  </Sidebar>
</Page>
```

This is worth knowing because it removes a lot of the cases people reach for Context to solve. Context is for when the consumer's position is not known to the owner of the data — deep, dynamic, or many unrelated places. When the tree is static and you are just passing through two or three layers, inverting it with `children` is simpler and keeps the data flow visible.

The performance side effect is useful too: an element passed as `children` was created by the parent, so it is the same reference when the intermediate component re-renders, and React skips re-rendering it. That is the cheapest re-render optimisation there is and it costs no memoisation.

## Explain the presentational versus container component pattern. (M)

The split is between components that know *how things look* and components that know *how things work*. A presentational component takes props and renders markup — no data fetching, no store access, ideally no state beyond UI concerns. A container fetches the data, holds the state, and renders the presentational one with the results.

The benefits were real: the presentational component is trivially testable and reusable, it drops into Storybook without mocking anything, and designers or a design system can own it without touching business logic. The container is where all the coupling to your app lives, so swapping a REST call for GraphQL touches one file.

```
function UserListContainer() {
  const { data, isLoading, error } = useUsers();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <UserList users={data} onSelect={select} />;
}

function UserList({ users, onSelect }) {   // pure, no idea where users came from
  return <ul>{users.map(u => <li key={u.id} onClick={() => onSelect(u.id)}>{u.name}</li>)}</ul>;
}
```

The honest framing is that Dan Abramov, who popularised it, later added a note saying he no longer recommends it as a rule, because hooks let you extract the logic without extracting a component. The *separation* still matters; enforcing it as two files for every feature produces a lot of pass-through components that exist only to satisfy the pattern.

Where I still use it deliberately: at the boundary of a design system, where the presentational half is a shared package, and around anything I want to render in isolation for tests or visual review.

## What are higher-order components, and what are render props for? (M)

Both are pre-hooks answers to the same question: how do you share stateful logic between components without copying it?

A higher-order component is a function that takes a component and returns a wrapped one with extra props injected — `withRouter(Component)`, `connect(mapState)(Component)`. The logic lives in the wrapper, the wrapped component just receives props.

A render prop is a component that owns some state and calls a function you give it with that state, letting you decide what to render — `<Mouse render={({x, y}) => …} />`, or the same thing with `children` as the function. React Router's old `<Route render={…}>` and Downshift are the canonical examples.

```
// HOC
const EnhancedList = withData('/api/users')(UserList);

// render prop
<DataFetcher url="/api/users">
  {({ data, loading }) => loading ? <Spinner /> : <UserList users={data} />}
</DataFetcher>
```

They still show up — HOCs for cross-cutting concerns that genuinely wrap a component, like `memo`, `forwardRef` or an error boundary wrapper, and render props where the *rendering* is what varies, which is why headless UI libraries still use them for things like virtualised list rows.

### What do custom hooks do better than both?

They share logic without touching the tree. An HOC adds a component layer per concern — five HOCs is five extra fibers, five sets of props to forward, and a debugging experience of `withRouter(withTheme(connect(Foo)))` in the component stack. Render props avoid the wrapper but produce the same nesting in JSX, the "callback pyramid" you get when three of them compose.

They also fix the naming problems. HOCs inject props into a namespace you do not control, so two of them can collide silently, and you cannot tell from reading a component's body where a prop came from. A hook returns values you name yourself at the call site: `const { data } = useUsers()` says exactly what it is and where it came from.

And they compose linearly. Calling four hooks in a row is four lines with no indentation, each one able to use the results of the previous, which neither of the other patterns can do without nesting.

What hooks do *not* replace is anything that needs to wrap the rendered output — error boundaries, providers, portals, `memo`. Those are still components, and an HOC is a reasonable way to apply them.

## Explain the compound component pattern. (H)

A set of components designed to be used together, where a parent owns the shared state and the children read it implicitly rather than through props. `<Select>` with `<Select.Option>`, `<Tabs>` with `<Tab>` and `<TabPanel>`, `<Accordion>` with `<Accordion.Item>` — the API mirrors `<select>`/`<option>` in HTML.

The reason to use it is flexibility of layout without a prop explosion. The consumer arranges the pieces however they like — wrapping them, reordering them, putting a heading between them — and the parent still coordinates which one is active, because the coordination goes through context rather than through structure.

```
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="profile">…</Tabs.Panel>
  <Tabs.Panel value="billing">…</Tabs.Panel>
</Tabs>
```

It is the pattern every serious component library uses — Radix, Headless UI, Reach — because it is the only one that lets the library own behaviour and accessibility while the application owns markup and styling completely.

The costs are a larger API surface to document, the risk of a child being used outside its parent (which you guard against by throwing a clear error from the context hook), and the fact that the pieces are not independently usable by design.

### How do the pieces communicate without prop drilling?

Through a context created by the parent and consumed by the children. The parent holds the state — which tab is selected, whether the accordion item is open, the registered options — puts it and its updaters into a provider, and the children call a hook to read it. The consumer never sees any of that; they just nest the components.

```
const TabsCtx = createContext(null);

function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
}

function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  const ctx = useMemo(() => ({ value, setValue }), [value]);
  return <TabsCtx.Provider value={ctx}>{children}</TabsCtx.Provider>;
}

function Trigger({ value: own, children }) {
  const { value, setValue } = useTabs();
  return (
    <button role="tab" aria-selected={value === own} onClick={() => setValue(own)}>
      {children}
    </button>
  );
}
```

The throwing hook is the part worth pointing out — it turns "used outside its parent" from a confusing null-destructuring crash into a message naming the mistake.

The older implementation used `React.Children.map` plus `cloneElement` to inject props into direct children. That works but is fragile: it only reaches one level, so wrapping a child in a `<div>` breaks it, and it silently passes props to anything it finds. Context has no such limit, which is why every current library uses it.

## What are some React anti-patterns? (M)

The ones I actually see, roughly in order of how much damage they do:

**Effects doing work that is not synchronisation.** Deriving state from props in an effect instead of computing it during render, resetting state with an effect instead of a `key`, submitting data in an effect that watches a flag, and chains of effects that each trigger the next. All of them cause extra renders, stale intermediate frames, and a data flow you cannot follow.

**Duplicated state.** Copying props into state so the two drift apart, storing something derivable (`total` alongside `items`), or keeping the same data in a store and in a component. There should be one source of truth and everything else computed from it.

**Index keys on dynamic lists**, and its cousin `key={Math.random()}` — the first attaches state to the wrong row, the second remounts everything on every render.

**Mutating state.** `items.push(x)` then `setItems(items)` renders nothing, and the same mutation silently breaks `memo`, `useMemo` and effect deps everywhere downstream.

**Defining components inside components.** The function is a new type each render, so React unmounts and remounts the whole subtree — losing state, blurring inputs, re-running effects — and it is invisible in review.

**Wrong dependency arrays with an eslint-disable above them.** Almost every stale closure bug arrives this way.

**Context as a state manager** for high-frequency data, and its opposite, prop drilling ten layers when passing `children` would have solved it.

**Premature memoisation** — `useCallback` and `memo` everywhere with no measurement, adding dependency arrays that can be wrong in exchange for skipping work that was cheaper than the comparison.

**Giant components.** Four hundred lines with twelve `useState` calls and business logic inline. Not a React-specific sin, but hooks make the fix easy enough that there is no excuse: extract the logic into custom hooks and split by responsibility.

**Direct DOM manipulation** with `document.querySelector` inside a component, instead of a ref — it works until React re-renders and overwrites it.
