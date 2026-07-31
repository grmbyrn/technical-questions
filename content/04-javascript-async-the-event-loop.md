---
slug: javascript-async-the-event-loop
order: 4
number: "5"
group: CORE JAVASCRIPT
title: JavaScript — Async & the Event Loop
status: answered
---

## What is the event loop, and what’s the difference between the call stack and the task queue? (H)

JavaScript runs on a single thread with one call stack. The stack is where function frames go — push on call, pop on return — and only one thing runs at a time.

Anything asynchronous is not done by JavaScript itself. A timer, a fetch, a click listener is handed to the host — the browser or Node — which does the work elsewhere and puts a callback into a queue when it is finished.

The event loop is the part that connects them. Its job is: when the call stack is empty, drain the microtask queue completely, then take one task from the task queue and run it, then drain microtasks again, and repeat. Between iterations the browser gets a chance to render.

So the queue never interrupts running code. A callback only runs once the stack has fully unwound, which is why setTimeout with a delay of zero does not fire immediately.

### Where does rendering fit into the loop?

Rendering happens between tasks, not during them. After a task finishes and the microtask queue is drained, the browser can paint if it is due a frame — roughly every 16 milliseconds at 60 frames per second.

requestAnimationFrame callbacks are the hook into that: they run just before paint, which is why they are the right place for visual updates and setTimeout is not.

### What happens to the UI if a task takes 500ms?

Everything stops. No painting, no scroll response, no click handling — the events queue up but nothing processes them, because the stack is still busy. That is the beach ball, and it is exactly what Interaction to Next Paint measures.

The fixes are to break the work into chunks that yield back to the loop, move it to a Web Worker, or do less of it. Yielding with setTimeout in a loop is the crude version; scheduler.yield and requestIdleCallback are the more modern ones.

## What is the microtask queue, and how does it differ from the task queue? (M)

They are two separate queues with different priorities. Tasks — sometimes called macrotasks — are things like setTimeout, setInterval, I/O and DOM events. Microtasks are promise callbacks, queueMicrotask and MutationObserver.

The difference that matters is drainage. After each task, the entire microtask queue is emptied before the next task runs, including any microtasks added while draining. Tasks are taken one at a time.

So microtasks always run before the next timer, no matter what delay you gave it.

### Order the output of a snippet mixing setTimeout, Promise.then and synchronous logs.

```
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));
console.log('5');
```

Output is 1, 5, 3, 4, 2. The synchronous logs run first because they are on the stack. Then the stack empties and microtasks drain in the order they were queued, so 3 then 4. The timer is a task, so it goes last even at zero delay.

### What happens if a microtask schedules another microtask, forever?

The page locks up permanently. Because the queue is drained completely before anything else can happen, an endlessly self-scheduling microtask starves the loop — no rendering, no timers, no input, and no recovery.

An endlessly self-scheduling setTimeout is different: each one is a separate task, so the browser gets a turn in between and the page stays responsive. That contrast is the cleanest way to show you understand the priority difference.

## What’s the difference between synchronous and asynchronous functions? (M)

A synchronous function runs to completion and blocks everything after it until it returns. An asynchronous function starts something and returns immediately, with the result arriving later through a callback, a promise or an await.

The thing worth saying out loud is that async does not mean parallel. It is still one thread — the work is being done elsewhere, by the host or the operating system, and your callback is queued to run later on the same thread. Actual parallelism in the browser means Web Workers.

## What is a callback function in the context of async operations? (E)

A function you hand to an asynchronous operation so it can call you back when the work is done. It is the oldest pattern for this in JavaScript — the Node convention was error-first, with the error as the first argument and the result second.

### What is callback hell, and what problems does it cause beyond readability?

Nesting callbacks inside callbacks for sequential work, so the code drifts rightwards and the order of operations gets hard to follow.

The deeper problems are about correctness. Error handling has to be repeated at every level and is easy to forget, since an error in one callback does not propagate to the outer ones. There is no natural way to run things concurrently and wait for all of them. And a badly written callback API might call you twice, or call you synchronously sometimes and asynchronously other times, which promises rule out by design.

## What are the different states of a Promise? (E)

Pending, fulfilled or rejected. Fulfilled and rejected together are described as settled.

One nuance worth knowing: resolved is not the same as fulfilled. A promise resolved with another promise is still pending — it has locked onto that promise and will follow whatever it does.

### Can a settled promise change state?

No. Once it settles the state and value are fixed forever, and any further calls to resolve or reject are ignored. That immutability is a real advantage over callbacks, where nothing stops an API calling you twice.

It also means a promise's value can be consumed any number of times — attaching a then to an already-settled promise still fires, on the next microtask tick.

## What are the pros and cons of Promises versus callbacks? (M)

Promises give you composition and error propagation. A rejection travels down the chain to the nearest catch instead of needing handling at every level, they guarantee the callback fires once and always asynchronously, and combinators like all and allSettled make concurrency straightforward.

The costs are that they add a microtask tick of indirection, an unhandled rejection can go silent if you forget a catch, and they cannot be cancelled — you need AbortController for that. Callbacks are still fine for simple event-style APIs, which is why addEventListener never became promise-based.

## What do async and await actually do, and does await block the thread? (M)

async marks a function as returning a promise, and await pauses that one function until a promise settles. Nothing else is blocked — the function suspends, control goes back to the event loop, and the rest of the program carries on. When the promise settles, the remainder of the function is queued as a microtask.

So await is not a blocking sleep. It is syntax over the same promise machinery: the code after an await is really the body of a .then, written so it reads top to bottom.

The one place it does hold things up is inside the function itself. Two awaits in sequence run in sequence, which is right when the second needs the first and wasteful when it does not.

```js
async function load() {
  const user = await getUser(); // suspends here
  const posts = await getPosts(user); // needs user, so sequential is correct
  return posts;
}
console.log("runs before either of those resolve");
```

### What does an async function return if you return a plain value from it?

A promise resolved with that value. An async function always returns a promise and you cannot opt out, so returning 1 gives you a promise for 1, and throwing inside gives you a rejected promise rather than a synchronous exception.

That is also why returning a promise from an async function does not double-wrap it — the return value is resolved first, so you get one promise that settles when the inner one does.

### What is top-level await, and where can you use it?

Awaiting outside any function, at the top level of a module. It works in ES modules only, not in CommonJS or a classic script, because the module system can make a module's evaluation asynchronous and hold its importers until it finishes.

The cost is exactly that: it delays every module that imports yours. Good for a config load or a database connection that everything needs anyway, bad for anything on a hot path.

## How do you run async operations in parallel rather than one after another? (H)

Start the work before you await it. A promise begins executing the moment it is created, so if you create them all first and then await them together they overlap. Promise.all is the usual way to say that.

The rule of thumb: await sequentially only when a later call needs the result of an earlier one. Otherwise you are turning parallel network time into a sum.

```js
// sequential — 2 x latency
const a = await getA();
const b = await getB();

// parallel — 1 x latency
const [a, b] = await Promise.all([getA(), getB()]);
```

### Why does awaiting inside a for loop serialise the work?

Because each iteration suspends the function until that iteration's promise settles, and only then does the loop advance. Ten requests at 200ms each become two seconds instead of 200ms.

The fix is to map to promises and await them together — await Promise.all(items.map(fetchOne)). Where it is not a mistake is when the server would rate-limit you or each call depends on the last; then a sequential loop is a deliberate choice rather than an accident, and worth a comment saying so.

### What do you get back from array.map(async x => …), and how do you fix it?

An array of promises, not values, because an async callback returns a promise and map does not await anything. People log it and see three Promise objects.

Wrap it: await Promise.all(items.map(async (x) => …)). forEach is the nastier version of the same trap — it ignores the returned promise entirely, so the loop finishes instantly, nothing waits, and any error inside becomes an unhandled rejection. Use for...of when you want it sequential and map plus Promise.all when you do not.

## How do you handle errors in async/await compared with .then and .catch? (M)

await turns a rejection into a thrown exception, so an ordinary try/catch works, and it covers the synchronous code in the block as well as the async calls. That is the real readability win over chaining, where you have to think about where in the chain the .catch sits and what it swallows.

The two compose either way — you can await a promise that has its own .catch. What I try to avoid is catching at every level just to log and rethrow; one place that can actually do something about the failure is usually enough.

```js
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.status); // fetch does not reject on 404
  return await res.json();
} catch (err) {
  report(err);
  return null;
}
```

Note the return await inside the try. A bare return hands the promise back before the catch is in scope, so a rejection from json() escapes the block you wrote to catch it.

### Why does try/catch not catch an error from a promise you did not await?

Because the try block has already finished by the time the promise rejects. try/catch is synchronous — it catches what throws while control is inside it — and an un-awaited promise settles on a later turn, after the block has exited.

It is the same reason a throw inside a setTimeout callback cannot be caught from outside: the callback runs later, on a fresh stack.

### What happens to an unhandled rejection in the browser and in Node?

In the browser it fires an unhandledrejection event on window and logs to the console, and the page keeps running. Listening for that event and forwarding it to your error tracker is worth doing, because these are otherwise invisible.

In Node it has been fatal by default since v15 — the process exits non-zero. So the identical bug is a console warning on the client and a crashed server on the backend.

## What does .then() return, and how does chaining actually work? (M)

.then returns a new promise, which is the whole reason chaining works. Each link takes the previous value and produces the next promise, so a chain is a pipeline rather than a stack of nested callbacks.

How that new promise settles depends on what the handler does: return a value and it resolves with that value, throw and it rejects, return a promise and the outer one waits for it and adopts its result. That last rule is what keeps chains flat.

```js
fetch(url)
  .then((res) => res.json()) // returns a promise, the chain waits
  .then((data) => data.items) // plain value, passed along
  .catch(() => []); // recovers — the chain continues resolved
```

### What is the difference between returning a value and returning a promise inside a .then?

From the outside, nothing — that is the point. Both give the next link a value to work with. The difference is timing: a returned promise is adopted, so the next .then does not run until it settles.

Forgetting the return is the classic bug. Call an async function inside a .then without returning it and the chain does not wait for it, so the next step runs against data that has not arrived, and any rejection is unhandled.

### What does .finally() receive, and can it change the result?

It receives nothing — no value, no error — because it is for cleanup that does not care which way things went, like hiding a spinner. Whatever the chain settled with passes straight through it.

It can still change the outcome in one direction: if it throws, or returns a promise that rejects, that replaces the original result. A plain value returned from it is ignored.

## How would you turn a callback-based API into one that returns a promise? (M)

Wrap the call in a new Promise and settle it from the callback. The job is bridging one convention to the other, so the wrapper should be thin, and the original function should be called exactly once.

Node's util.promisify does this for anything following the error-first convention, and most built-ins now ship a promise version — fs/promises, timers/promises — so hand-rolling is mostly for older or non-standard APIs.

```js
const readFile = (path) =>
  new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });
```

Two things to watch. The executor runs synchronously, and anything it throws becomes a rejection, so do not put unrelated work in there. And only the first settle counts — later resolve or reject calls are silently ignored, which hides bugs in callbacks that can fire more than once.

### How would you implement Promise.all yourself?

Return a new promise, collect results by index, count how many have settled, and resolve when the count reaches the input length. Results have to be assigned by index rather than pushed, because they finish out of order.

```js
function all(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let settled = 0;
    if (promises.length === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then((value) => {
        results[i] = value;
        if (++settled === promises.length) resolve(results);
      }, reject);
    });
  });
}
```

Promise.resolve(p) matters because the input is allowed to contain plain values. The empty array has to resolve immediately or it hangs forever. And reject is passed straight through as the rejection handler, since the first rejection settles the whole thing and later ones are ignored.

## What’s the difference between Promise.all, Promise.allSettled and Promise.race? (M)

all waits for every promise to fulfil and gives you an array of results in input order, but rejects immediately if any single one rejects. allSettled always fulfils, giving an array of objects describing each outcome as fulfilled with a value or rejected with a reason. race settles as soon as the first one settles, whichever way it goes.

So all when you need everything and a single failure makes the whole thing pointless, allSettled when you want to report partial success, and race for timeouts — racing real work against a timer.

```
const results = await Promise.allSettled(urls.map(fetchOne));
const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
```

### What happens to the other promises when Promise.all rejects?

Nothing. They keep running to completion — the combinator just stops caring about them. There is no cancellation in the promise model, so a fetch already in flight still finishes and still uses bandwidth.

If you actually need them stopped, you pass an AbortController signal to each request and abort it in the failure path.

### When would you reach for Promise.any?

When you want the first success and do not care about failures — querying several mirrors or CDNs and taking whichever answers first. It ignores rejections until every one has rejected, at which point it rejects with an AggregateError holding all the reasons.

That is the difference from race, which settles on the first result even if that result is a rejection.

## How can you test asynchronous code? (E)

Make the test itself async and await the thing, or return the promise so the runner waits for it. For rejections, assert with rejects rather than a try/catch that can silently pass when nothing throws.

For timers, use the framework's fake timers so you can advance time instantly instead of really waiting. And for anything UI-driven, use a polling helper like waitFor or findBy rather than a fixed sleep — an arbitrary setTimeout in a test is the single most common source of flakiness.

```
await expect(loadUser('missing')).rejects.toThrow(NotFoundError);

vi.useFakeTimers();
vi.advanceTimersByTime(500);
```

## What are debouncing and throttling, and how do they differ? (E)

Both limit how often a function runs, but on different rules. Debounce waits for a pause — it resets the timer on every call and only fires once things have been quiet for the delay. Throttle guarantees a maximum rate, firing at most once per interval no matter how many calls arrive.

The way I remember it: debounce is do it when they stop, throttle is do it at most every N milliseconds.

### Which would you use for a search input, and which for a scroll handler?

Debounce the search input — you want the request sent once the user has stopped typing, not on every keystroke. Around 300 milliseconds is the usual starting point.

Throttle the scroll handler, because you want regular updates while scrolling rather than nothing until it stops. For anything that touches layout or paint, requestAnimationFrame is often better than a throttle, since it syncs to the frame rate instead of an arbitrary interval.

### Write debounce from scratch, including a cancel method.

```
function debounce(fn, wait) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => clearTimeout(timer);
  debounced.flush = function (...args) {
    clearTimeout(timer);
    fn.apply(this, args);
  };
  return debounced;
}
```

Two details worth mentioning as you write it: using a regular function rather than an arrow so this is forwarded correctly, and the cancel method, which is what you call on unmount so a pending timer does not fire against a component that no longer exists.

## How does garbage collection work in JavaScript? (H)

Automatically, based on reachability. The collector starts from a set of roots — the global object, the current stack, closures in scope — and marks everything it can reach. Anything unmarked is unreachable and gets swept. That is mark and sweep.

Reachability rather than reference counting is the important part, because reference counting cannot free two objects that point at each other but which nothing else points to. Mark and sweep handles that naturally, since neither is reachable from a root.

V8 also splits the heap by age: most objects die young, so a cheap frequent collector handles the young space and a more expensive one runs occasionally over the old space.

### What is mark-and-sweep, and why does reference counting struggle with cycles?

### What are the common sources of memory leaks in a browser app?

Detached DOM nodes — you remove an element from the document but a variable, closure or array still references it, so the whole subtree stays alive. Timers and intervals that are never cleared, and event listeners on long-lived objects like window that are never removed.

Caches that only ever grow, which is what WeakMap and WeakSet are for, since they do not keep their keys alive. And closures holding onto more than they need — a handler that captures a large object just to read one field off it.

In React specifically it is almost always a missing cleanup return from useEffect. To find one, take heap snapshots before and after repeating an action and compare retained size.

## What are Web Workers used for? (M)

Running JavaScript on a genuinely separate thread, so heavy work does not block the UI. Anything CPU-bound is a candidate: parsing a large file, image processing, encryption, big data transforms, running a syntax highlighter or a diff.

### What can a worker not access, and how do you get data in and out of one?

It has no DOM — no document, no window, no direct access to the page. It gets its own global, self, and can use fetch, XMLHttpRequest, IndexedDB, WebSockets and importScripts.

Communication is by postMessage, and the data is structured-cloned rather than shared, so both sides get independent copies. For large binary payloads you can transfer an ArrayBuffer instead, which moves ownership with no copy and leaves the sender's reference detached — much faster, but you cannot use it afterwards. SharedArrayBuffer allows real shared memory, but needs specific cross-origin isolation headers.

## What are Proxies used for? (M)

A Proxy wraps an object and lets you intercept the fundamental operations on it — property reads, writes, has, delete, function calls — through handler traps. Reflect gives you the default behaviour so you can add to it rather than reimplement it.

In application code you would reach for one for validation, logging, or building an API where properties are computed rather than stored. Most of the time you meet Proxies through a framework rather than writing them yourself.

```
const safe = new Proxy(target, {
  get(obj, key, recv) {
    if (!(key in obj)) throw new ReferenceError(`no ${String(key)}`);
    return Reflect.get(obj, key, recv);
  }
});
```

### How do frameworks use Proxies for reactivity?

Vue 3 is the clearest example. reactive() returns a Proxy, and the get trap records which effect is currently running as a dependency of that property, while the set trap re-runs whatever effects depended on it.

That is why Vue 3 can detect adding a new property or mutating an array by index, and Vue 2 could not — Object.defineProperty had to walk the object up front and convert known keys, so anything added later was invisible. The tradeoff is that Proxies cannot be polyfilled, which is what dropped old browser support.

## What are JavaScript polyfills for? (M)

Providing an implementation of a feature the runtime does not have, so your code can use the modern API everywhere. Typically it checks whether the thing exists and only defines it if not.

In practice you rarely write them by hand — core-js supplies them and a browserslist config decides which ones actually ship, so modern browsers do not pay for old ones.

### What’s the difference between a polyfill and a transpiler?

A transpiler rewrites syntax the engine cannot parse — arrow functions, optional chaining, class fields — into an older equivalent at build time. A polyfill supplies a missing runtime API, like Promise, Array.prototype.flat or fetch, at execution time.

The distinction is syntax versus library. Babel does the first, core-js does the second, and you usually need both, because no amount of rewriting syntax will conjure up a method the browser has never heard of.
