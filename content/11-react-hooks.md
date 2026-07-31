---
slug: react-hooks
order: 11
number: '11b'
group: FRAMEWORKS
title: React — Hooks
status: answered
---

## What are the benefits of hooks, and what are the rules of hooks? (M)

Hooks let a function component hold state and subscribe to the outside world, and — more importantly — let you extract stateful logic into a plain function that other components can call. Before them, the only way to share stateful behaviour was to share *structure*: higher-order components and render props, both of which wrap the tree, so a component with five concerns ended up five levels deep in providers that exist only to pass data down.

The other win is that lifecycle methods split code by *when it runs* rather than by what it is about. Subscribing in `componentDidMount`, updating in `componentDidUpdate` and unsubscribing in `componentWillUnmount` puts one concern in three places, and three concerns in each place. An effect with its own cleanup keeps the whole thing together.

The rules are two. Only call hooks at the top level — never inside a condition, loop, nested function or after an early return. And only call them from a React function component or from another hook. Both are enforced by `eslint-plugin-react-hooks`, which is not optional in any codebase I have worked in.

## Why can you not call hooks conditionally — what actually breaks internally? (H)

Because React does not know the names of your hooks. State is stored as an ordered linked list on the component's fiber, and each hook call consumes the next entry as the component renders. The association is purely positional.

If a hook call is skipped on a later render, everything after it shifts by one. The `useState` that was reading slot 1 now reads slot 0, so your `name` state comes back holding a `count`, an effect gets compared against another effect's dependency array and either re-runs or fails to, and a `useRef` returns someone else's box. React detects the common shape of this and throws "Rendered fewer hooks than expected", but the mode where the counts match and the types line up is a silent wrong-value bug.

```
// broken — the hook list changes shape between renders
if (user) {
  const [name, setName] = useState(user.name);
}

// fine — the condition is inside, the call is unconditional
const [name, setName] = useState(user?.name ?? '');
```

The fix when you genuinely need conditional behaviour is to make the *hook* unconditional and the *logic* conditional — pass `null` to a query hook to disable it, return early from inside an effect, or split into two components so the branch happens above the hooks rather than among them.

### How does React associate a hook call with its stored state?

By call order within a single component instance. Each fiber has a `memoizedState` pointer to a linked list of hook objects; on a render React resets a cursor to the head and each hook call advances it by one. First call gets the first node, second gets the second, and so on.

On the initial mount, React is building that list — each call appends a node. On updates it is walking the existing list, which is why the count and order have to match. There is no key, no name, nothing derived from the variable you assign to; renaming `count` to `total` changes nothing, and swapping the order of two `useState` calls swaps their values.

That design is a deliberate tradeoff: it makes hooks essentially free at runtime (an array walk, no map lookups or string keys) at the cost of a rule the developer has to follow. The lint rule exists to make that cost near zero.

## What happens when the useState setter is called, and why is it described as asynchronous? (M)

The setter does not assign anything. It enqueues an update on the component's fiber and schedules a re-render. React then processes the queue, computes the next state, compares it to the current one with `Object.is`, and if it differs, re-renders the component — at which point `useState` returns the new value.

"Asynchronous" is slightly the wrong word — it is not a promise, and within the same tick React will usually have re-rendered before the next paint. What it really means is *deferred and batched*: several setter calls in the same event handler produce one re-render, not one each, and the value you are holding in the current scope never changes.

```
const [count, setCount] = useState(0);

function onClick() {
  setCount(count + 1);
  setCount(count + 1);
  console.log(count);   // 0
}
// count is 1 after this handler, not 2
```

The batching is the point. It means React does not lay out and paint between two related updates, so you never see an intermediate frame where half the state has changed.

### Why does logging state immediately after setting it show the old value?

Because `count` is a `const` in that render's scope. Every render is a separate invocation of the function with its own local variables closed over by its own handlers, and the setter does not — cannot — reach back and reassign a `const` in a frame that has already run. It queues work for the *next* render, which will produce a new `count`.

That is the whole "renders are snapshots" idea, and it is worth stating plainly in an interview: the value is not stale in the sense of being wrong, it is the correct value for the render you are currently in.

If you need the computed value inside the handler, compute it yourself (`const next = count + 1; setCount(next); log(next)`). If you need to react to the committed state, that is what an effect with the state in its deps is for. Reading it out of a ref is a third option but usually a sign the state should have been a ref in the first place.

## What is the purpose of the updater (callback) form of a state setter? (M)

It lets you compute the next state from the latest queued state rather than from the value captured in the current render's closure. `setCount(c => c + 1)` queues a function; React applies each queued function in order to the result of the previous one when it processes the queue.

That matters any time an update depends on the previous value and there is a chance the closed-over value is not current: multiple updates in one handler, updates from an interval or event listener registered once, or an update firing after an `await`.

It also removes the state from a `useCallback`'s dependency array, because the callback no longer reads it — which is what keeps a memoised handler stable across renders instead of being recreated every time the value changes.

```
setCount(c => c + 1);
setItems(prev => [...prev, item]);
setFlags(prev => ({ ...prev, [key]: !prev[key] }));
```

The one caveat is that under StrictMode the updater is invoked twice in development, so it has to be pure — no logging, no mutation of the previous value, no fetch.

### Show a bug that only the updater form fixes.

```
// only ever increments to 1
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []);   // count is 0 forever inside this closure
```

The effect runs once, so the interval callback closes over the first render's `count`, which is `0`. Every tick computes `0 + 1` and sets `1`, React sees the state is already `1` and bails out, and the counter freezes.

Adding `count` to the deps "fixes" it by tearing down and recreating the interval every second, which drifts the timer and re-subscribes constantly. The updater form fixes it properly:

```
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

The same shape appears with any long-lived subscription — a WebSocket message handler, a `keydown` listener attached on mount, a debounced callback — and with rapid successive updates in one handler, where `setCount(count + 1)` twice yields 1 and `setCount(c => c + 1)` twice yields 2.

## What does the useEffect dependency array control? (M)

It controls whether the effect re-runs after a given commit. React compares each entry against the previous render's array with `Object.is`; if any differs, it runs the previous effect's cleanup and then the effect again. If all are equal, it skips both.

The array is not a filter you choose for convenience — it is a declaration of everything the effect body reads from the render scope: props, state, context values, and anything derived from them. Leaving something out does not stop the effect using it; it just means the effect keeps using a stale copy.

The corollary is that if the correct dependency array causes a loop or a re-subscribe you do not want, the answer is to change the effect — move the value into a ref, use the updater form, memoise the object, or delete the effect entirely — not to lie in the array. `exhaustive-deps` is a lint rule I leave on as an error.

### What happens with an empty array, and with no array at all?

`[]` means nothing the effect depends on ever changes, so it runs after the first commit and its cleanup runs at unmount. That is the mount/unmount pair — subscribing to something global, setting up an observer, registering a listener on `window`. Under StrictMode in development, React deliberately runs mount → cleanup → mount to check the cleanup is symmetric.

No array at all means the effect runs after *every* commit, with cleanup before each subsequent run. Occasionally that is what you want — syncing something to the DOM on any change — but far more often it is an oversight, and if the effect sets state it is an infinite loop.

The distinction people get wrong is treating `[]` as "componentDidMount". It is not a lifecycle marker; it is a claim that the effect reads nothing reactive. When that claim is false — which is most of the time it is written — you have a stale-closure bug waiting.

### Why does an object or function in the deps cause an infinite loop?

Because objects, arrays and functions created during render are new references every render, and `Object.is` compares references. So the dep always looks changed, the effect always re-runs, and if the effect sets state, that render creates another new reference, and around it goes.

```
// new object every render → effect every render → setState → render → …
const options = { userId, includeArchived };
useEffect(() => { fetchData(options).then(setData) }, [options]);
```

The fixes, roughly in order of preference: depend on the primitives instead (`[userId, includeArchived]`), construct the object inside the effect, hoist it to module scope if it is constant, or wrap it in `useMemo`/`useCallback` if it genuinely has to be shared — which only works if *its* deps are stable too, so it is a chain you have to check all the way up.

The same trap applies to a function passed in as a prop: unless the parent memoised it, every parent render gives the child a new function, and the child's effect re-runs. That is one of the more common causes of a fetch firing in a loop.

## What’s the difference between useEffect and useLayoutEffect? (M)

Timing. `useLayoutEffect` fires synchronously after React has mutated the DOM but *before* the browser paints; `useEffect` fires asynchronously after the paint. Both run after the commit and both have the same signature and cleanup semantics.

The consequence is that a state update inside `useLayoutEffect` causes React to re-render and re-commit before anything reaches the screen, so the user never sees the intermediate state. The same update in `useEffect` means the first version is painted, then replaced — a visible flicker.

The other consequence is that `useLayoutEffect` blocks paint, so anything slow in it delays the frame directly. That is why `useEffect` is the default: it keeps rendering off the critical path.

`useLayoutEffect` also does not run during server rendering, which produces the familiar SSR warning. `useInsertionEffect` sits one step earlier again and exists specifically for CSS-in-JS libraries injecting style rules.

### When is useLayoutEffect genuinely necessary, and what does it cost?

When you need to measure the DOM and then change it based on the measurement, in the same frame. Positioning a tooltip or popover against its trigger, measuring text to decide whether to show a "read more", auto-sizing a textarea, restoring scroll position, and any "flip" animation that reads a first layout and applies a transform before paint.

The test is whether a wrong first paint would be visible. Measuring purely to *report* — logging an element's size, telling a parent about a resize — can stay in `useEffect`.

The cost is that it is synchronous work inside the commit, so it is not interruptible and it delays the frame. Do it in a component that renders often, or do something expensive in it, and you are adding directly to time-to-paint. The pattern is to keep the body to a measurement and a state set, and to prefer a platform API where one exists — `ResizeObserver`, `IntersectionObserver`, or CSS anchor positioning for the popover case — since those do the work off the render path entirely.

## When should logic go in useEffect versus an event handler? (M)

The question is what caused the work. If it happened *because the user did something*, it belongs in the handler. If it is *synchronising with something outside React* that has to stay in agreement with the current props and state, it belongs in an effect.

So: submitting a form, sending an analytics event for a click, showing a toast after a save, navigating after an action — handler. Subscribing to a store or a WebSocket, attaching a `window` listener, setting up an observer, controlling a non-React widget, starting an animation on an element — effect.

The framing I find most useful from the React docs is that effects are for escaping React, not for reacting to state. Anything that can be computed during render should be computed during render; anything that happens in response to an interaction should happen where the interaction is handled. What is left over is genuinely small.

The practical reason to care is that effects run after paint, cannot see which interaction caused them, and re-run whenever their deps change — so putting user-initiated work in one gives you a delay, a lost cause, and duplicate firing when an unrelated dependency changes.

### Give an example of an effect that should not have been an effect.

Derived state is the big one:

```
// unnecessary — an extra render and a value that can go stale
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(`${first} ${last}`) }, [first, last]);

// just compute it
const fullName = `${first} ${last}`;
```

The effect version renders once with the old value, commits it, then sets state and renders again. If the calculation is genuinely expensive, `useMemo` — still during render, still no extra commit.

The other frequent one is doing a POST in an effect that watches a flag:

```
// fires on remount, on any unrelated re-run, and cannot be cancelled sensibly
useEffect(() => { if (submitted) sendOrder(form) }, [submitted]);

// belongs in the handler
function onSubmit() { sendOrder(form) }
```

The rest of the list is the same shape: resetting state when a prop changes (use `key`), notifying a parent about a state change (call the callback in the handler that changed it), chains of effects that each trigger the next (compute it all in one place), and initialising state from props (initialiser argument, or lift the state).

## Why does my effect run twice in development, and is that a bug? (M)

It is StrictMode, in development only. React mounts the component, runs its effects, runs all the cleanups, and runs the effects again — deliberately, on every mount. Production builds run them once.

It is not a bug in React, and in almost every case where it causes a visible problem it has found a bug in the effect. The two symptoms are duplicated requests, which means the effect has no cancellation, and duplicated subscriptions or listeners, which means the cleanup is missing or asymmetric. Both would eventually happen in production anyway — on a remount, on a fast route change, or under concurrent rendering — just less reliably.

The thing not to do is disable StrictMode or add a `didRun` ref to suppress the second call. The ref version papers over the symptom and breaks the genuine remount case. The fix is a correct cleanup: abort the request, unsubscribe the listener, clear the timer.

If the double request is coming from data fetching specifically, the real answer is that fetching in an effect is the wrong layer — a query library dedupes identical in-flight requests and the problem disappears.

### What is StrictMode trying to surface by doing this?

That your effect is *resilient to being remounted*, because React reserves the right to unmount and remount a component while preserving its state — that is what makes Offscreen/Activity components and back-forward restoration possible, and it is how concurrent rendering can discard and redo work.

The invariant it is checking is that running the effect, cleaning up, and running it again leaves the system in the same state as running it once. If it does not, the effect is leaking something: a listener still attached, a subscription still live, a timer still ticking, a request whose response will land on an unmounted component.

Same reasoning behind the other StrictMode behaviours: double-invoking render bodies and state updaters checks that they are pure, since concurrent rendering may call them more than once for a single update. All of them convert "works today, fails intermittently later" into "fails immediately in dev".

## How would you handle a race condition in an async effect? (H)

The problem is that two requests fired from the same effect can resolve out of order — the user types `a`, then `ab`, and the response for `a` arrives second, so the UI shows results for the wrong query. Nothing about `await` guarantees ordering.

The fix is to make each effect run responsible for invalidating itself. Every run gets a flag or an `AbortController` in its closure, the cleanup marks it as superseded, and the response handler checks before touching state. React runs the cleanup for the previous run before starting the next, so exactly one run is ever live.

```
useEffect(() => {
  let ignore = false;

  (async () => {
    const res = await fetch(`/api/search?q=${query}`);
    const data = await res.json();
    if (!ignore) setResults(data);
  })();

  return () => { ignore = true };
}, [query]);
```

The alternative to writing this in every component is not to write it at all — TanStack Query, SWR or a router loader handle ordering, caching, dedupe and cancellation as part of what they do, and that is what I would reach for in a real application.

### Write the cleanup for it. Would AbortController or an ignore flag be better here?

```
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(err => { if (err.name !== 'AbortError') setError(err) });

  return () => controller.abort();
}, [query]);
```

`AbortController` is the better default because it does strictly more: it prevents the stale `setState` *and* cancels the in-flight request, so a fast typist is not holding six open connections and the browser's per-host connection limit is not being spent on responses nobody will read. It also propagates — you can pass the same signal into several requests, and it is what `fetch`, `axios` and most modern clients already accept.

The ignore flag is the right tool when the work cannot be cancelled: a promise from a library with no signal support, a `Promise.all` over cached values, an IndexedDB read. It is also marginally simpler to reason about, and it avoids the one gotcha of abort — you must filter `AbortError` out of your error handling, or every navigation shows an error state.

In practice I use both together: abort for the network, and the ignore flag if there is post-processing after the await that could still land late.

## How do you prevent stale closures in hooks? (H)

A stale closure is a function that captured values from an earlier render and outlives it — an interval, an event listener, a debounced callback, or anything stored in a ref. It reads whatever was current when it was created, which is usually not what you want.

The tools, in the order I try them: use the updater form of a setter so you never need to read the current state; put the value in the dependency array and let the effect re-create the closure; move the changing value into a ref that the long-lived function reads at call time; and, for callbacks specifically, keep the latest function in a ref and call through a stable wrapper — the "latest ref" pattern that `useEffectEvent` is being standardised to replace.

```
// latest-ref pattern for a callback that must be stable but current
const savedRef = useRef(onTick);
useEffect(() => { savedRef.current = onTick });

useEffect(() => {
  const id = setInterval(() => savedRef.current(), delay);
  return () => clearInterval(id);
}, [delay]);
```

The prevention that matters more than any of these is the lint rule. Almost every stale closure I have seen in real code arrived with a manually trimmed dependency array and an `eslint-disable` above it.

### Why does a setInterval inside an effect often log stale state?

Because the effect with `[]` deps runs once, and the callback passed to `setInterval` is created in that first render's scope. It closes over that render's `count`, `props` and everything else, and it keeps that copy for its entire life — the interval is not re-created when the component re-renders, so nothing ever updates what it can see.

Every subsequent render creates new variables in a new scope, and the interval callback is not part of any of them. So it logs `0` on tick one, tick two and tick one hundred, while the screen shows the real value.

The three exits: use `setCount(c => c + 1)` so the callback does not need to read state at all; add the value to the deps and accept the interval being torn down and re-created on each change, which is usually wrong for a timer because it resets the schedule; or keep the interval in one place and read the value through a ref you update on every render, which is the pattern above.

## When should you use useRef? (M)

When you need a value that survives re-renders but should not cause them. It returns a stable mutable box — the same object every render — with a `current` property you can read and write at any time.

The two situations that come up are holding a DOM node so you can call an imperative API on it, and holding a mutable value that is not rendered: a timer id, a previous value, a WebSocket instance, an "is first render" flag, the latest callback, an accumulated scroll offset.

```
const inputRef = useRef(null);
const timerRef = useRef(null);

useEffect(() => { inputRef.current?.focus() }, []);

function start() {
  timerRef.current = setInterval(tick, 1000);
}
```

The rule that goes with it is not to read or write `ref.current` during render — it makes the render impure and breaks under concurrent rendering. Refs are for effects, handlers and callbacks. The exception React documents is lazy initialisation, and even there `useState`'s initialiser is usually the better tool.

### What are the two distinct uses, and why does changing a ref not re-render?

The two are: a reference to a DOM node (passed as `ref={…}`, populated by React on commit and set back to `null` on unmount), and an instance variable — mutable per-component storage that is not part of the rendered output.

They feel unrelated but are the same primitive. React needs somewhere to put the node; that place is a plain object it hands you, and once you have such an object there is nothing stopping you putting anything else in it.

Changing it does not re-render because the setter *is* the re-render. `useState` returns a function that enqueues an update and schedules work; a ref returns an object, and assigning to a property of an object is just an assignment — React is not involved and has no way to know it happened, short of watching every object in the program.

That is the whole selection criterion. If the UI must reflect the value, it is state; if the value is bookkeeping the UI does not read, it is a ref. The failure mode to watch for is a value stored in a ref *and* rendered, which shows a stale value until some other update happens to trigger a render.

## When should you use useCallback, and when useMemo? (M)

`useMemo` caches a value, `useCallback` caches a function — `useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)`. Both recompute only when a dependency changes.

There are three reasons to use either, and only three. The result is a prop to a `memo`-wrapped child, so an unstable reference would defeat the memoisation. The result goes into another hook's dependency array — an effect, a memo, a callback — so an unstable reference re-runs it. Or the computation itself is genuinely expensive: parsing, sorting or filtering thousands of items, not `a + b`.

```
const sorted   = useMemo(() => rows.sort(byName), [rows]);        // expensive
const onSelect = useCallback((id) => select(id), [select]);       // stable prop
```

Outside those, they are noise. Every `useMemo` adds a dependency array to maintain, a closure to allocate, and a comparison to run, in exchange for skipping work that was probably cheaper than the comparison.

The forward-looking answer is that the React Compiler memoises automatically and correctly at build time, which removes most manual use of both — and it is worth saying so, because "memoise everything by hand" is a habit worth un-learning rather than doubling down on.

### When is memoising actively harmful?

When the memo can never hit. Wrapping a value whose deps change every render means you pay for the comparison and the allocation and always recompute — strictly worse than not memoising. The commonest version is memoising against a dep that is itself a fresh object each render, which is a whole chain nobody checks.

It is also harmful when it is incomplete. `memo` on a child plus `useCallback` on one of its four props, where the other three are inline objects, means you have added machinery to every render and skipped nothing.

Then there is the maintenance cost, which is the one that actually bites: a wrong dependency array is a correctness bug, not a performance bug, and manual memoisation is how you get wrong dependency arrays. Every `useCallback` is another list that has to stay in sync with the closure body forever.

And memoised values are retained, so caching large derived structures keeps them alive for the life of the component. On a long list of components that is real memory.

## What’s the difference between useMemo and React.memo? (M)

`useMemo` is a hook called *inside* a component that caches a computed value between renders of that component. `React.memo` is a higher-order component that wraps a component and skips re-rendering it when its props are shallowly equal to last time.

So one prevents re-computation, the other prevents re-rendering. They are frequently used together — `useMemo` in the parent to keep an object prop stable, so that `memo` on the child can actually bail out — but they solve different halves of the problem.

```
const Row = React.memo(function Row({ item, onSelect }) { … });

function List({ items }) {
  const sorted   = useMemo(() => [...items].sort(byName), [items]);
  const onSelect = useCallback(id => setSelected(id), []);
  return sorted.map(i => <Row key={i.id} item={i} onSelect={onSelect} />);
}
```

The one thing to know about `memo` specifically is that its default comparison is shallow, it takes an optional second argument for a custom comparator (use sparingly — it is easy to make it lie), and it compares props only, so a `memo`'d component still re-renders when its own state or a context it consumes changes.

## When should you use useReducer instead of useState? (M)

When the next state depends on the current state in more than a trivial way, when several pieces of state change together, or when the same transitions are triggered from a lot of places. At that point a reducer turns scattered setter calls into a single named list of transitions you can read in one place.

The specific signals I look for: three or four `useState` calls that are always updated in the same handler; a setter call sequence duplicated across components; state where certain combinations are invalid and the rules for avoiding them live in the handlers; a component where the handlers are mostly state-shuffling rather than anything else.

```
function reducer(state, action) {
  switch (action.type) {
    case 'submit':  return { ...state, status: 'saving', error: null };
    case 'success': return { status: 'idle', error: null, saved: true };
    case 'fail':    return { ...state, status: 'idle', error: action.error };
    default:        return state;
  }
}

const [state, dispatch] = useReducer(reducer, initial);
```

The secondary benefits are that `dispatch` is stable, so it never needs to be in a dependency array or wrapped in `useCallback`; the reducer is a pure function you can unit test without rendering anything; and the action log is a description of what happened, which is far easier to debug than a stack of setter calls.

Where I would stay with `useState` is anything independent and simple — a boolean for an open drawer, a string for an input. A reducer for those is ceremony. And where the state is really a small number of distinct modes with different data, I would model it as a discriminated union first, whichever hook holds it.

## When should you use useId? (M)

When you need a unique, stable identifier to wire up related DOM elements — an input to its `<label>`, a control to its `aria-describedby` error message, a trigger to its `aria-controls` panel — in a component that may be rendered more than once on a page.

The reason it exists rather than a counter or a random string is server rendering. The id has to match between the server HTML and the client hydration, or React reports a mismatch; `useId` generates values from the component's position in the tree, so both sides agree. A module-level counter does not survive that, and `Math.random()` certainly does not.

```
function Field({ label, error, ...rest }) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
      {error && <p id={`${id}-err`}>{error}</p>}
    </>
  );
}
```

The idiom for several ids in one component is one `useId` call with suffixes, as above, rather than several calls. And it is explicitly not for list keys — those need to come from the data.

## What problems do useTransition and useDeferredValue solve? (H)

Both address the same problem: one state update causes a render that is expensive enough to block the interaction that triggered it. Typing into a filter that drives a 5,000-row table means every keystroke is a long task, and the input visibly lags.

They solve it by splitting the update into two priorities. The urgent part — the input's own value — renders immediately and paints. The expensive part is marked as non-urgent, so React renders it in the background, keeps the old UI on screen meanwhile, and can abandon that work if another keystroke arrives before it finishes.

The key point is that this is not debouncing. Debouncing delays *starting* the work by a fixed time; a transition starts it immediately and lets React interrupt it. So the result appears as soon as the machine can produce it rather than after an arbitrary timeout, and a fast device feels instant.

They also work with Suspense: an update inside a transition does not replace already-visible content with a fallback, which is what stops a route change from flashing a spinner over a page that was perfectly fine.

### What is the difference between the two, and when do you pick each?

`useTransition` wraps the *update*: you call `startTransition(() => setQuery(value))`, so you must own the setter. It gives you an `isPending` boolean, which is how you show a subtle "updating" state without unmounting the current content.

`useDeferredValue` wraps the *value*: you take a value you were given and produce a lagging copy of it, `const deferred = useDeferredValue(query)`. You do not need access to the setter, which makes it the right tool when the value arrives as a prop or from a hook you do not control.

So the rule is: if you control the state update, `useTransition`. If you only have the value, `useDeferredValue`. Both want the expensive subtree wrapped in `memo`, otherwise it re-renders on the urgent pass anyway and the whole exercise is wasted.

```
// I own the setter
const [isPending, startTransition] = useTransition();
function onChange(e) {
  setText(e.target.value);                              // urgent
  startTransition(() => setQuery(e.target.value));      // deferred
}

// I only have the value
const deferredQuery = useDeferredValue(query);
<Results query={deferredQuery} />        // Results is memo'd
```

`useDeferredValue` also compares against the previous value, so you can detect staleness (`query !== deferredQuery`) and dim the results, which is its equivalent of `isPending`.

## How does automatic batching work in React 18? (H)

Batching means React groups multiple state updates into a single re-render instead of re-rendering after each one. In React 18, `createRoot` extends that to every context — timeouts, promises, native event handlers, intervals — where before it only applied inside React's own synthetic event handlers.

Mechanically, React marks updates with a lane and schedules the render as a microtask rather than performing it synchronously, so all the updates queued in the same tick land in one render pass. Three setters in a `.then()` now produce one render and one commit, not three.

```
async function save() {
  const res = await api.save(form);
  setSaving(false);        //
  setResult(res);          //  React 18: one re-render
  setError(null);          //  React 17: three
}
```

The benefit is fewer renders and, more importantly, no intermediate states being committed — you cannot paint a frame where `saving` is false but `result` is not yet set. The escape hatch is `flushSync(() => setX(v))`, which forces a synchronous render and commit; it is for the rare case where you must measure the DOM immediately after an update, and it opts out of all the benefits.

### What was not batched before 18?

Anything outside a React event handler. Updates inside `setTimeout`/`setInterval`, inside promise callbacks and `async` functions after an `await`, inside native `addEventListener` handlers, and inside subscriptions from outside libraries all rendered one at a time.

The reason was implementation rather than design: batching was tied to React's synthetic event system, which wrapped handler invocation and flushed at the end. Nothing wrapped a `setTimeout` callback, so each setter fell through to a synchronous render.

The practical consequence of the change is mostly invisible improvement, with two things to watch for on upgrade. Code that read the DOM between two setters in an async function may now see them applied together, and code that (incorrectly) relied on a render happening between updates needs `flushSync`. Note also that batching applies per tick, so two updates separated by an `await` are still two renders — the await yields.

## Implement a custom hook: useDebounce, usePrevious, or useFetch with cleanup. (M)

```
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => { ref.current = value });
  return ref.current;      // previous render's value
}

function useFetch(url, options) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    fetch(url, { ...options, signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setState({ status: 'success', data, error: null }))
      .catch(error => {
        if (error.name === 'AbortError') return;
        setState({ status: 'error', data: null, error });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}
```

Points I would make about them. `useDebounce` works because the cleanup cancels the pending timeout on every change, so only the last one survives — the whole hook is four lines because React's effect cleanup already is a cancellation mechanism. `usePrevious` writes in an effect rather than during render, because writing a ref during render is impure. And `useFetch` returns a status union rather than three independent booleans, so there is no way to represent "loading and errored" — the same reasoning as any discriminated union.

I would also be honest that `useFetch` is the version you write to demonstrate the mechanics, not the one to ship. It has no cache, no dedupe, no retry, no revalidation, and refetches on every mount; `options` is deliberately not in the deps because an inline object would loop, which is a lie the real libraries do not have to tell. In an application this is TanStack Query or a router loader.

### How do you cancel the in-flight request when the component unmounts?

Return a cleanup from the effect that aborts it. React runs that cleanup on unmount, and also before every re-run of the effect, which covers the race-condition case at the same time.

`AbortController` is the mechanism — create one per effect run, pass `controller.signal` into `fetch`, and call `controller.abort()` in the cleanup. The request is genuinely cancelled at the network layer, and the promise rejects with an `AbortError` that you have to filter out of your error handling, or an unmount will look like a failure.

If the work cannot be aborted — a library without signal support, a non-network promise — the fallback is an `ignore` flag set in the cleanup and checked before every `setState`. That does not stop the work, but it stops the stale write.

Worth adding that setting state after unmount is no longer the warning it used to be; React removed that message in 18 because it produced far more false positives than real leaks. The reason to cancel is still good — wasted bandwidth, wasted work, and stale responses overwriting fresh ones — it is just not something React will tell you about any more.
