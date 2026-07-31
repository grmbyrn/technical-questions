---
slug: react-core-model
order: 10
number: '11'
group: FRAMEWORKS
title: React — Core Model
status: answered
---

## What is React, and what are its benefits? (M)

It is a library for building user interfaces out of components, where you describe what the UI should look like for a given state and React works out the DOM operations needed to get there. The mental model is `UI = f(state)` — you never write "add a row to the table", you change the array and re-render.

The benefits follow from that. Declarative code is easier to reason about because there is only one place the UI is defined, rather than an initial render plus a scattering of imperative updates that have to stay in agreement with it. Components compose, so the same reuse and encapsulation arguments as any other module system apply, with the addition that markup, behaviour and often styling live together. And because the rendering model is separated from the host, the same component model drives the DOM, native views and static HTML on a server.

The honest caveats are that it is a library rather than a framework, so routing, data fetching and forms are decisions you have to make yourself, and that the ecosystem churns. What I would actually claim for it is that it is a well-understood default with an enormous hiring pool and an escape hatch for every case where the declarative model does not fit.

## What’s the difference between a React Node, a React Element and a Component? (M)

A component is a function that takes props and returns something renderable. It is the thing you write and the thing you name; it is not a UI object in itself, it is a recipe for one.

An element is what calling that function or writing that tag produces — a plain immutable object, roughly `{ type, key, ref, props }`. `<Button primary />` does not run `Button`; it creates an element that records "render a Button with these props" and hands it to React, which decides when and whether to call it. That indirection is what lets React diff, defer and discard work.

A node is the wider set of everything React can render in a slot: an element, a string, a number, `null`, `undefined`, a boolean, or an array of nodes. It is the type you reach for when typing `children`, because `ReactNode` accepts all of them, whereas `ReactElement` accepts only the object form.

```
function Button(props) { … }        // component

const el = <Button primary />;      // element:
// { type: Button, props: { primary: true }, key: null, … }

// all valid nodes:
'hello'   42   null   false   el   [el, 'x']
```

## What is JSX, and how does it work? (M)

JSX is syntax sugar for creating elements — an XML-ish expression syntax that a compiler turns into ordinary function calls before the browser ever sees it. It is not part of JavaScript and no engine implements it; Babel, `tsc`, esbuild and swc all transform it.

The rules that matter come from it being an expression. Lowercase tags are treated as host elements and compile to the string `'div'`; capitalised or dotted tags compile to the identifier, which is why a component must start with a capital letter or it will silently become an unknown HTML tag. Attributes become props, so they follow JavaScript naming (`className`, `htmlFor`, `onClick`), and everything in braces is a plain expression, which is why you use `&&`, ternaries and `.map()` rather than template directives.

It is worth saying you do not need it — `createElement` calls work fine and some codebases use `h` directly — but it stays close to the markup it produces, which is most of its value.

### What does JSX compile down to?

With the classic transform, `React.createElement(type, props, ...children)`. With the automatic transform introduced in React 17, `jsx(type, props, key)` imported from `react/jsx-runtime`, with `jsxs` for the static-children case and `jsxDEV` in development, which carries the source location used in warnings.

```
<Button primary onClick={fn}>Save</Button>

// classic
React.createElement(Button, { primary: true, onClick: fn }, 'Save');

// automatic
import { jsx as _jsx } from 'react/jsx-runtime';
_jsx(Button, { primary: true, onClick: fn, children: 'Save' });
```

Note that `children` moves into the props object in the new form, and that `key` is passed separately rather than living in props — which is why reading `props.key` has never worked.

### Why did the transform change in React 17?

Three reasons. It removed the requirement to have `React` in scope in every file, which was a constant source of confusing errors and a lint rule that existed only to work around the compiler. It let the runtime be smaller and faster, because `jsx` can assume a shape that `createElement` — a public API anyone may call by hand — cannot. And it gave the team room to make the element object cheaper, since the factory is now an implementation detail rather than something user code calls directly.

The practical consequence is `"jsx": "react-jsx"` in tsconfig and no more unused-React imports. React 17 itself shipped no new features for application authors; that transform and the change to attaching events at the root container rather than `document` were essentially the whole release.

## What’s the difference between state and props? (E)

Props are the arguments passed into a component by its parent. They are read-only from the inside — a component must never write to its own props — and they change only when the parent re-renders with different values.

State is data the component owns and can change. It is created inside the component, survives across renders, is private to that instance, and updating it is what tells React to re-render.

The dividing question is who owns the value. If the parent needs to know about it or two siblings need to agree on it, it is state in a common ancestor passed down as props; if only this component cares, it is local state. Everything else — the "lift state up" advice, controlled components, one-way data flow — is a consequence of answering that question.

## Explain one-way data flow and its benefits. (M)

Data moves down the tree as props, and changes move up as callbacks. A child never reaches into a parent or a sibling to change anything; it calls a function it was given, and the owner of the state decides what to do.

The benefit is that for any piece of rendered output there is exactly one place it could have come from, and for any incorrect value there is a single path to walk back up. With two-way binding you get the convenience of writing less wiring, and the cost of any bound view being able to write to the model, which turns "why is this field wrong" into a search across everything that touches it.

It also makes the render function honest. Because output depends only on props and state, the same inputs give the same output, which is what makes components independently testable, memoisable and safe to re-render.

The tradeoff is the wiring — prop drilling through layers that do not care about the value. Context, composition through `children`, and external stores all exist to shorten that path without giving up the direction.

## What is the virtual DOM, how does it work, and what are its benefits and downsides? (M)

It is a tree of plain JavaScript objects describing what the UI should look like. On a render React builds a new tree, compares it against the previous one, computes the minimal set of changes, and applies only those to the real DOM in a single commit.

The benefit is that it decouples "describe the whole UI for this state" from "perform the specific mutations". You write the former, which is far easier to get right, and the library derives the latter. It also gives React a place to batch — many state updates in one tick produce one diff and one commit — and a representation that is not tied to the DOM at all, which is how React Native and server rendering share the same component model.

The downsides are real. Diffing is work the browser did not have to do; for a very hot path — a canvas-style animation, a huge table updating at high frequency — hand-written DOM updates will beat it. It also costs memory for the retained tree and adds a layer between your code and the platform, so DOM details you care about need refs and effects. Svelte and Solid make the opposite trade and compile to direct updates.

### Is the virtual DOM faster than direct DOM manipulation? Defend your answer.

No, and React's own docs have never claimed it is. Direct DOM manipulation is the thing the virtual DOM eventually does; adding a diff in front cannot make it faster in principle.

What it is faster than is *naive* DOM manipulation — re-rendering a region by rebuilding its markup, or updating imperatively from many places without knowing what is already correct. It also avoids the accidental performance traps that hand-written code falls into: it batches, so you get one layout rather than one per update, and it writes only changed attributes rather than reassigning `innerHTML` and destroying element state.

The real claim is different: it is fast *enough* while being much easier to keep correct, and it makes performance predictable — you optimise by rendering less, not by auditing every mutation site. Where that is not enough, the escape hatches are memoisation, virtualising long lists, and dropping to a ref for the genuinely hot path.

## What is reconciliation? (M)

It is the algorithm that compares the newly rendered element tree against the previous one and decides what to do with each position: update it in place, move it, unmount it, or create a new one. The output is a list of effects the commit phase applies to the DOM.

A naive tree diff is O(n³), which is unusable, so React uses a heuristic O(n) pass built on two assumptions about how UIs actually change. It walks the trees together, level by level, and never tries to match a node at one depth against a node at another.

The practical upshot for a developer is that reconciliation is *identity* matching, not content matching. Whether state is preserved depends on whether React considers the element to be the same one as last time — which is decided by position, type and key, not by what the props say.

### What are the two assumptions the diffing heuristic relies on?

First, two elements of different types produce different trees — so if the type at a position changed, React does not diff further, it tears the old subtree down and builds the new one.

Second, the developer can hint at which children are stable across renders using the `key` prop — so within a list, React matches by key rather than by index, and can move a node instead of rebuilding it.

Both are approximations. A component genuinely could produce a near-identical tree under a different type, and React will throw away the DOM and state anyway. The heuristics are chosen because they are cheap and they match how real interfaces change, not because they are always optimal.

## Why does the diffing algorithm assume different element types produce different trees? (M)

Because checking the alternative is not worth it. To reuse a subtree across a type change React would have to prove the two trees are compatible, which is the expensive general tree-matching problem it is trying to avoid — and the payoff is tiny, because in real code a `<div>` becoming a `<span>`, or `LoggedOut` becoming `LoggedIn`, almost always means the content is genuinely different.

There is also a correctness argument. Component state is keyed to the component that owns it, and reusing a `Counter`'s state for a `Timer` because they happen to sit at the same position would be worse than resetting it. Tearing down on type change makes unmount and mount predictable: effects clean up, refs detach, state goes.

The consequence you have to design around is that this makes the *type identity* matter, not just the type name. Defining a component inside another component's body creates a new function on every render, so the type differs every time and the entire subtree unmounts and remounts each render — losing state, refocusing inputs and re-running effects. That is why components are defined at module scope.

## What is React Fiber, and how is it an improvement over the previous approach? (H)

Fiber is the reconciler rewritten in React 16 around an explicit data structure instead of the call stack. Each element gets a fiber node — a mutable object holding the type, props, state, and pointers to child, sibling and return — so the work-in-progress tree is something React holds in memory and can traverse iteratively.

The old stack reconciler recursed. Once it started rendering a tree, the browser could not get control back until the recursion finished, because the progress lived in the JavaScript call stack and there is no way to pause that. A large update meant a long task, a dropped frame and an unresponsive page.

With fibers, React can process one unit of work, check whether it has run out of time, and yield to the browser, resuming where it left off. It can also assign priority — an update from a keystroke jumps ahead of one from a background fetch — and it can start work, abandon it and throw the partial tree away, because that tree is not committed until the whole render finishes. Rendering became interruptible; committing stayed synchronous and atomic, so the user never sees a half-updated screen.

Fiber is infrastructure rather than a feature. Concurrent rendering, `useTransition`, `useDeferredValue`, Suspense and streaming SSR are all things it made expressible.

### What does interruptible rendering enable that a synchronous stack reconciler could not?

Keeping the app responsive during a large render. The classic case is a search field over a big list: with synchronous rendering the keystroke and the list update are the same blocking task, so the input lags behind your typing. With concurrent rendering, marking the list update as a transition lets React render the input immediately and work on the list in the background — and if you type again, throw that partial work away and start over rather than finishing a render nobody will see.

It also enables Suspense as more than a loading flag. React can render a subtree, find that it suspends, and keep the current UI on screen while the data arrives, rather than committing a fallback immediately — which is what `useTransition` does to avoid flashing spinners on navigation.

The cost is that a render can now happen more than once for the same update, and a component's body can run without ever being committed. That is exactly why side effects belong in effects rather than in the render body, and why StrictMode double-invokes to surface components that break the rule.

## What is the purpose of the key prop, and what are the consequences of using array indices as keys? (M)

`key` gives an element a stable identity within its list of siblings. Without it, React matches children by position, so it assumes the third item this render is the same component instance as the third item last render. With it, React matches by key — so it can tell that an item moved rather than changed, and reuse the DOM node and the component's state.

Index keys give React exactly the information it already had. `key={i}` says "the item at position 2 is the item at position 2", so as far as reconciliation is concerned there is no key at all. That is fine when position genuinely is identity, and wrong the moment the list reorders, or an item is inserted or removed anywhere other than the end.

When it is wrong, the symptom is state attached to the wrong row: the DOM node is reused for a different item, so uncontrolled input values, focus, scroll position, CSS transitions and any local state in the row component stay behind while the props move on.

### Show a concrete bug caused by index keys.

```
// list: ['Alice', 'Bob', 'Carol']
{items.map((name, i) => <Row key={i} name={name} />)}

function Row({ name }) {
  return (
    <li>
      {name} <input defaultValue="" placeholder="note" />
    </li>
  );
}
```

Type "call back" into Alice's note, then delete Alice. The array becomes `['Bob', 'Carol']`, so key `0` now holds Bob. React sees the same key at the same position with a changed `name` prop, updates the text, and leaves the input alone — because `defaultValue` is only read on mount. Bob is now showing Alice's note, and Carol's has silently become Bob's.

With `key={name}` (or an id), React sees key `Alice` gone, unmounts that row and its input, and Bob and Carol keep their own DOM nodes. Same bug class covers checkboxes in a sortable table, focus jumping to the wrong field after a delete, and animations playing on the wrong element.

### When are index keys actually fine?

When the list is static — it never reorders, items are never inserted or removed except at the end, and it is not filtered or sorted. A fixed set of tabs, a paginated page of results that is replaced wholesale, a rendered breakdown of a constant array.

They are also acceptable when the rows genuinely hold no state and no DOM identity — pure text, no inputs, no focus, no animation. Nothing can attach to the wrong row if nothing is attached at all. I still avoid it, because "this list is static" is a property that stops being true in a later commit without anyone noticing.

What is not a fix is `key={Math.random()}` or a key generated during render. That gives every item a new identity on every render, so React unmounts and remounts the entire list every time — worse than index keys in both correctness and cost.

## What does re-rendering mean, and what causes a component to re-render? (H)

Re-rendering means React calls the component function again to get a new element tree, then diffs it. It does not mean touching the DOM — most renders result in no DOM changes at all. Conflating the two is what makes people believe renders are inherently expensive.

A component re-renders when its own state changes (via a `useState` setter or `useReducer` dispatch, where the new value fails an `Object.is` comparison with the old), when a context it consumes gets a new value, when its parent re-renders, or when it is forced to by `useSyncExternalStore` reporting a changed snapshot. That is the whole list — notably, props changing is not itself a trigger, because props only change if the parent rendered.

A render leads to a commit only if the diff found work. So the cost model is: render is JavaScript (cheap unless the component is doing something expensive or the tree is large), commit is DOM (expensive), and effects run after the commit. Optimising means cutting renders you do not need — with memoisation, better state placement, or composition — not avoiding state.

### Does a parent re-render always re-render its children?

Yes, by default. When a parent renders, it produces new elements for its children, and React renders each of them, regardless of whether their props are equal. It has no way to know a component is pure without being told.

The exceptions are `React.memo`, which does a shallow prop comparison and skips the re-render if nothing changed, and the case where a child element was created *outside* the parent — most commonly passed in as `children` from further up. That element object is the same reference as last time, so React bails out of re-rendering it, which is why `<Layout>{expensiveTree}</Layout>` does not re-render `expensiveTree` when `Layout`'s state changes.

Worth adding that the React Compiler changes the default answer here — it memoises components and values automatically at build time, so the manual `memo`/`useMemo`/`useCallback` layer becomes largely unnecessary in codebases using it.

### Why does passing an inline object or arrow function defeat React.memo?

Because `memo` compares props shallowly with `Object.is`, and an object or function literal in JSX is a new reference on every render. `{}` is never `Object.is` equal to another `{}`, so the comparison fails, and the memoised child re-renders exactly as it would have without `memo`.

```
// memo is useless here — style and onClick are new every render
<MemoButton style={{ margin: 4 }} onClick={() => save(id)} />

// stable references
const style = { margin: 4 };                                  // module scope
const onClick = useCallback(() => save(id), [id]);            // in component
```

The fix is to make the reference stable — hoist constants out of the component, wrap callbacks in `useCallback`, wrap derived objects in `useMemo` — or to change the shape so the child takes primitives instead. The failure mode to watch for is doing half of it: one unstable prop is enough to make `memo` pure overhead, so `memo` is only worth adding when every prop is stable, which is a whole-chain property rather than a local one.

## Why does React recommend against mutating state? (H)

Because React decides whether to re-render by comparing the new state to the old one by reference. Mutating an object or array in place means the reference is unchanged, so the comparison says nothing happened and the update is dropped — the classic `items.push(x); setItems(items)` that renders nothing.

Beyond that, immutability is what makes several other things work. `memo`, `useMemo` and `useEffect` deps all compare references, so mutation makes them silently miss changes. Concurrent rendering can render the same component twice with the same state, so a render that mutates shared data corrupts it. And keeping previous values intact is what makes undo, time-travel debugging and cheap change detection possible at all.

There is also the ordinary argument: mutable state shared between components produces action at a distance, where a value changes because something else you were not looking at wrote to it.

```
// dropped — same reference
items.push(next);
setItems(items);

// new reference — renders
setItems(prev => [...prev, next]);
setUser(prev => ({ ...prev, name }));
```

Deep updates get verbose, which is what Immer is for — `useImmer` or `produce` lets you write mutating syntax against a draft and get a new immutable tree out.

### What comparison does React actually perform, and why does mutation defeat it?

`Object.is`, which is `===` with two corrections: `NaN` is equal to itself, and `+0` and `-0` are distinct. It is applied to the state value in `useState`/`useReducer`, to each prop in `memo`'s default comparison, and to each entry in a dependency array.

For objects and arrays, `Object.is` compares identity, not contents. Mutating in place changes contents while preserving identity, so every one of those checks reports "unchanged". React bails out of the re-render, `memo` skips the child, the effect does not re-run.

The subtlety worth mentioning is that bailing out is not always complete: if you call a setter with the same value, React may still re-render that component once before deciding to stop, so relying on the bail-out for correctness is a mistake. And the comparison is shallow everywhere it appears — a new top-level object with the same nested references satisfies `Object.is` at the top and fails it for anything comparing a nested field, which is why partial-copy updates are a common source of stale UI.

## What’s the difference between controlled and uncontrolled components? (M)

A controlled input takes its value from React state and reports every change back through `onChange`, so the state is the single source of truth and the DOM only reflects it. An uncontrolled input keeps its own value in the DOM, seeded optionally with `defaultValue`, and you read it when you need it — usually via a ref or from the form's submit event.

Controlled is the default recommendation because it makes the value available for anything you want to do while the user types: validation, formatting, enabling a button, syncing two fields, driving a filtered list. It also makes the component's output a function of state in the usual way.

```
// controlled
const [email, setEmail] = useState('');
<input value={email} onChange={e => setEmail(e.target.value)} />

// uncontrolled
const ref = useRef(null);
<input defaultValue="" ref={ref} />       // read ref.current.value on submit
```

The one thing not to do is mix them — passing `value` without `onChange` gives a read-only input and a warning, and switching a component from uncontrolled to controlled mid-life (because `value` started as `undefined`) is a common source of that warning in real code.

### When is uncontrolled the better choice?

When you only need the value at submit time. A large form where every keystroke re-renders the whole tree is a real cost, and the controlled version buys you nothing if there is no per-keystroke behaviour. React Hook Form is built on exactly this observation — keep the values in the DOM, subscribe only what needs to react.

It is also the only option for `<input type="file">`, whose value cannot be set programmatically, and it is the pragmatic choice when integrating a non-React widget that owns its own DOM, or when you are wrapping a native form and want the browser's built-in validation and `FormData` behaviour.

The current React answer for the simple case is a form action plus `FormData`, which is uncontrolled by design — you get the values on submit without holding a state variable per field.

## What are React Fragments for? (M)

Returning multiple elements from a component without adding a wrapper node to the DOM. Before them, the only way to satisfy "one root element" was a `<div>`, which polluted the tree and — more importantly — broke layouts where the parent's CSS expects specific children: grid and flex items, `<tr>` inside a `<table>`, `<li>` inside a `<ul>`, `<option>` inside a `<select>`.

The short form is `<>…</>`. The long form, `<React.Fragment key={id}>`, is needed when you render a list of fragments, because the shorthand cannot take a key — mapping rows that each produce two `<td>`s is the usual case.

```
function Row({ item }) {
  return (
    <>
      <td>{item.name}</td>
      <td>{item.price}</td>
    </>
  );
}

{pairs.map(p => (
  <React.Fragment key={p.id}>
    <dt>{p.term}</dt>
    <dd>{p.def}</dd>
  </React.Fragment>
))}
```

They also cost less than a wrapper element — no DOM node, no styles to reason about, nothing for the accessibility tree to ignore.

## What is forwardRef() used for? (M)

Letting a parent get a ref to a DOM node inside a child component. `ref` was not a normal prop — React consumed it — so passing `ref` to a function component did nothing and warned. `forwardRef` wrapped the component so it received `(props, ref)` and could attach that ref to whatever element it chose.

The reason to want it is the same set of imperative escapes that always need a node: focusing an input, measuring an element, scrolling something into view, playing a video, integrating a third-party library. A design-system `<Input>` that cannot be focused by its consumer is not usable in a form library.

```
const Input = forwardRef(function Input({ label, ...rest }, ref) {
  return (
    <label>
      {label}
      <input ref={ref} {...rest} />
    </label>
  );
});
```

The related API is `useImperativeHandle`, which lets the child expose a curated object — `{ focus, scrollIntoView }` — instead of the raw node, so consumers cannot reach into the DOM arbitrarily.

### What changed about ref handling in React 19?

`ref` became an ordinary prop on function components. You destructure it like anything else, and `forwardRef` is no longer needed — it still works, but it is deprecated and a codemod exists to unwrap it.

```
function Input({ label, ref, ...rest }) {   // React 19 — no forwardRef
  return <input ref={ref} {...rest} />;
}
```

Two related changes landed alongside it. A ref callback can now return a cleanup function, which runs on detach — previously React called the callback with `null` on unmount, and that pattern is now discouraged. And `ref` being a normal prop means it can be spread, forwarded through wrappers and typed without the `ForwardRefExoticComponent` machinery, which removes a long-standing wart from typed component libraries.

## What are React Portals used for? (M)

Rendering a subtree into a different DOM node while keeping it in the same place in the React tree. `createPortal(children, domNode)` returns something you render normally; the elements appear inside `domNode` in the document, but as far as React is concerned they are still children of the component that rendered them.

The reason is CSS. Modals, dropdowns, tooltips and toasts need to escape an ancestor's `overflow: hidden`, `transform`, `filter`, or stacking context — any of which will clip or mis-layer a fixed-position element no matter what `z-index` you give it. Moving the node to `document.body` sidesteps all of it.

```
function Modal({ children, onClose }) {
  return createPortal(
    <div className="backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true">{children}</div>
    </div>,
    document.body,
  );
}
```

What a portal does not give you for free is accessibility: focus trapping, restoring focus on close, `Escape` handling and inert-ing the background are all still your job, which is why the honest answer for a real dialog is a library — or `<dialog>`, which handles the top layer natively and removes most of the reason to portal in the first place.

### Does an event fired inside a portal bubble to the React parent or the DOM parent?

To the React parent. React's synthetic events propagate along the React tree, not the DOM tree, so a click inside a portal rendered from deep in your component tree fires the `onClick` handlers of its React ancestors even though the node lives on `document.body`.

That is usually what you want — a portal keeps working with context, and handlers on the logical parent still fire. It is occasionally surprising: a click inside a modal will trigger an `onClick` on the component that rendered the modal, so an "click outside to close" handler placed on a React ancestor will fire for clicks inside the portal.

Native listeners behave the other way. `document.body.addEventListener('click', …)` sees it as a click on body, because in the DOM that is where it happened. Mixing the two — a native outside-click listener plus portalled content — is exactly where this bites, and the fix is to check containment against the portal node rather than the React parent.

## How do you reset a component’s state? (M)

Change its `key`. React treats a different key at the same position as a different component instance, so it unmounts the old one — running cleanup, dropping state and refs — and mounts a fresh one with initial state. One line, no reset logic to maintain.

```
<ProfileForm key={userId} user={user} />
```

The alternatives, in the order I would consider them: lift the state to a parent that already changes when the reset should happen, so it is naturally fresh; pass the value down as a prop and stop storing it at all; or, if you need partial rather than total reset, an explicit `reset()` in an event handler that sets the specific fields back.

The thing I would not reach for is an effect that watches a prop and calls setters. It is the option that most often gets written first and it is the worst of the three.

### Why is changing the key often better than an effect that resets state?

Because the effect version renders twice, and the first render shows the stale state. React renders with the old values, commits them to the screen, then runs the effect, sets state, and renders again — so the user can see the previous user's data in the form for a frame, and any effect depending on that state fires with the wrong value first.

It is also more code that can go wrong: the dep array has to be exactly right, and the "did this prop change" comparison is duplicating what React already does with keys. The old workaround — storing the previous prop in state and comparing during render — is better than the effect but still machinery.

The key version resets *during* the render that changes the identity. Nothing stale is ever committed, there is no second render, and the intent reads directly: this is a different form now. The React docs make exactly this case, and they use it as the leading example of an effect you do not need.

## What are error boundaries for? (M)

Catching errors thrown during rendering, in lifecycle methods, and in constructors anywhere below them in the tree, so that one broken component degrades to a fallback instead of unmounting the whole app. Since React 16, an uncaught render error unmounts the entire tree — a blank page — on the reasoning that a corrupted UI is worse than no UI. Boundaries are how you scope that.

They are still class components, because the API is `static getDerivedStateFromError` (return the fallback state) and `componentDidCatch` (side effects — log to Sentry). There is no hook equivalent; in practice everyone uses `react-error-boundary`, which wraps it and adds a `resetKeys`/`onReset` story so the user can retry without a full reload.

Placement is the design decision. One at the root stops a white screen; one per independent region — a widget, a route, a dashboard panel — keeps the rest of the page usable, which is the point. I generally do both.

React 19 added `onCaughtError` and `onUncaughtError` options on `createRoot`, which give you a single place to report errors rather than doing it in every boundary.

### What kinds of errors do they not catch?

Anything that does not happen during React's own rendering: event handlers, `setTimeout` and other async callbacks, errors thrown inside promises, server-side rendering, and errors thrown in the boundary itself.

The reason is that a boundary catches by wrapping the render call — it works the way `try/catch` works, and by the time a click handler or a resolved promise runs, that call has long returned. There is no stack for it to sit on.

So in practice you need three things, not one: boundaries for render errors, ordinary `try/catch` in handlers and async functions (a data library like TanStack Query turns fetch failures into an error *state*, which then renders and can hit a boundary), and `window.onerror`/`unhandledrejection` reporting for everything that escapes both.

## What is React strict mode, and what are its benefits? (M)

`<StrictMode>` is a development-only wrapper that makes React deliberately stress components to surface bugs that would otherwise only appear under concurrent rendering, or intermittently in production. It renders nothing and has no effect in a production build.

Concretely, in development it double-invokes component bodies, initialisers and updater functions, which exposes any side effect or mutation that has snuck into render. It mounts, unmounts and remounts every component once on mount — running effects, cleaning them up, and running them again — which exposes effects that do not clean up after themselves properly. And it warns about deprecated APIs like string refs and legacy context.

The benefit is that these are exactly the bugs that are hardest to find later: an effect that subscribes without unsubscribing leaks slowly, a render that mutates a module-level array works until something renders twice. StrictMode turns them into something you see on the first page load rather than in an incident.

The double-invocation is the part people fight, and the answer is almost always that the code has a real problem. The exception is genuinely non-idempotent work in an effect — a fetch that also writes an analytics event, say — where the honest fix is moving the non-idempotent part out of the effect rather than turning StrictMode off.
