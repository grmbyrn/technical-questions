---
slug: node-js-backend
order: 27
number: '25'
group: BACKEND & DATA
title: Node.js / Backend
status: answered
---

## How does the Node.js event loop work, and what are its phases? (H)

Node's event loop is libuv's. The single-threaded idea is the same as the browser — one call stack, callbacks queued by the host — but the loop is split into named phases that run in a fixed order, and each phase has its own queue.

The phases, in order:

- **timers** — callbacks whose `setTimeout` or `setInterval` deadline has passed.
- **pending callbacks** — a handful of deferred system-level callbacks, mostly TCP errors.
- **idle, prepare** — internal to libuv.
- **poll** — the important one. Node runs I/O callbacks here, and blocks here waiting for new I/O when there is nothing else to do.
- **check** — `setImmediate` callbacks.
- **close callbacks** — `'close'` events, such as `socket.on('close')`.

Then it starts again. Between every phase, and between individual callbacks within a phase, the microtask queues drain: `process.nextTick` first, then promise callbacks.

Poll is where an idle process spends its time. If there is no work and no timer due, it sits blocked on `epoll`/`kqueue` rather than spinning, which is why an idle Node process uses no CPU.

### Where do I/O callbacks, timers and close handlers each run?

`fs.readFile` completions and socket data land in **poll**. `setTimeout`/`setInterval` fire in **timers**. Stream and socket `'close'` events run in **close callbacks**. `setImmediate` runs in **check**, which sits immediately after poll — that placement is the whole point of it: it means "after the current I/O callback finishes, before any timers".

### How does it differ from the browser event loop?

The browser spec has one task queue, one microtask queue, and a rendering opportunity between tasks. Node has multiple phases, no rendering step at all, and an extra microtask queue with higher priority than promises — `process.nextTick`.

The practical difference is ordering guarantees. At the top level of a Node program, `setTimeout(fn, 0)` versus `setImmediate(fn)` is genuinely nondeterministic: whether the 1ms timer has already expired by the time the loop reaches the timers phase depends on how long process startup took. Inside an I/O callback it is deterministic — `setImmediate` always wins, because you are in poll and check is the next phase.

## What’s the difference between process.nextTick, setImmediate and setTimeout(fn, 0)? (H)

`process.nextTick` is not part of the loop at all. Its queue is drained after the current operation completes, before the loop moves on — and it drains completely, including anything added while draining. That makes it the highest priority thing in Node and also the easiest way to starve the loop: a recursively self-scheduling `nextTick` locks the process up permanently, because no phase ever gets a turn.

`setImmediate` runs in the check phase, once per loop iteration. Recursive `setImmediate` is safe — each one waits for the next turn, so I/O still gets served.

`setTimeout(fn, 0)` is clamped to 1ms and runs in the timers phase.

The rule of thumb: use `setImmediate` when you mean "later, after I/O"; use `nextTick` only for things that must happen before anything else, like emitting an error after the caller has had a chance to attach a listener; don't use `setTimeout(fn, 0)` for either.

### Which runs first inside an I/O callback, and why is the answer different at the top level?

Inside an I/O callback the order is: `nextTick`, then promise callbacks, then `setImmediate`, then `setTimeout`. That is fixed, because you are executing in the poll phase and check comes next, while timers only come round on the following iteration.

```js
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate")); // always first
});
```

At the top level the loop has not started yet. By the time it reaches the timers phase, the 1ms timer may or may not have expired depending on how long the process took to boot, so the order flips between runs on the same machine. If an interview answer depends on that ordering, the honest answer is "it's nondeterministic, don't rely on it".

## How does Node handle concurrency if it is single-threaded? (M)

Your JavaScript runs on one thread, but the I/O does not happen on it. Node hands work to the kernel — `epoll` on Linux, `kqueue` on BSD/macOS, IOCP on Windows — which is genuinely asynchronous for sockets, and the thread only ever runs your callbacks when results come back.

That is why Node handles ten thousand mostly-idle connections cheaply: an idle connection is a file descriptor the kernel is watching, not a thread with a stack. The trade is that the model only works while every callback is short. One synchronous 500ms loop blocks every other in-flight request, so the cost of blocking is paid by all concurrent users, not just the one who triggered it.

### What is the thread pool actually used for?

libuv keeps a small pool — four threads by default, tunable with `UV_THREADPOOL_SIZE` — for operations where the OS has no usable async interface:

- file system calls (`fs.*`)
- DNS resolution via `dns.lookup`, which calls `getaddrinfo` (`dns.resolve` uses the network and does not)
- some crypto and compression: `pbkdf2`, `bcrypt`, `scrypt`, `zlib`

Network I/O does **not** use the pool. The consequence people hit in production is bcrypt: five concurrent logins with a default pool of four means the fifth waits for a thread, and heavy `fs` traffic competes with password hashing for the same four slots.

## How do you handle CPU-intensive tasks without blocking the event loop? (M)

In rough order of how much machinery they need:

1. **Do less.** Cache the result, precompute it, or push the work into the database or a library with a native async implementation.
2. **Chunk and yield.** Break the loop into batches and `await new Promise(r => setImmediate(r))` between them, so I/O callbacks get served. Crude, but fine for a one-off report.
3. **Worker threads.** A pool of `worker_threads` running the CPU work off the main loop, communicating by message passing. Right for image processing, parsing, crypto, anything measured in tens of milliseconds.
4. **A separate process or service.** Push a job onto a queue (BullMQ, SQS) and let a dedicated worker fleet handle it, returning a job id immediately. Right when the work is measured in seconds, needs retries, or should scale independently of the API.

The thing to say alongside the options is how you would know: measure event loop lag with `perf_hooks`' `monitorEventLoopDelay` and alarm on p99. Blocking shows up as latency on endpoints that have nothing to do with the slow one, which is what makes it hard to diagnose without that metric.

## What’s the difference between Cluster and Worker Threads? (M)

`cluster` forks whole processes. Each has its own V8 heap, its own event loop and its own memory, and the primary hands out incoming connections between them. It exists to use all the cores for I/O-bound work — one Node process can only ever saturate one core.

`worker_threads` creates threads inside one process. Each still gets its own V8 isolate and event loop, so there is no shared mutable JS state and no data races on your objects, but they share the process, and communication between them is much cheaper. It exists for CPU-bound work.

### Which shares memory, and when does that matter?

Worker threads. Two forms of it matter: an `ArrayBuffer` can be **transferred** through `postMessage` in constant time rather than copied, and a `SharedArrayBuffer` is genuinely visible to both sides at once (with `Atomics` for coordination). If you are moving megabytes of pixel or audio data around, that is the difference between viable and not.

With `cluster`, everything crossing a process boundary is serialised, and any shared state has to live somewhere external — Redis for sessions, the database for everything else. That constraint is actually a benefit: it forces the app to be stateless, which is what you need to scale horizontally anyway.

In practice a lot of production deployments skip `cluster` and run one container per core, letting Kubernetes do the process supervision and load spreading. A crashed process is then the platform's problem rather than something your primary process has to manage.

## What is backpressure in streams, and what are the four stream types? (H)

The four types:

- **Readable** — a source you consume: `fs.createReadStream`, an HTTP request on the server.
- **Writable** — a sink you write to: a file write stream, an HTTP response.
- **Duplex** — both, with the two sides independent: a TCP socket.
- **Transform** — a duplex where the output is a function of the input: `zlib.createGzip()`, a cipher, a CSV parser.

Backpressure is the mechanism by which a slow consumer tells a fast producer to slow down. `writable.write()` returns `false` once the internal buffer has passed `highWaterMark` (16KB by default for byte streams). A well-behaved producer stops writing at that point and waits for the `'drain'` event before resuming.

### What happens if a fast producer outpaces a slow consumer?

If you honour the signal, the readable side is paused, the data sits in the kernel socket buffer or on disk, and your process memory stays flat.

If you ignore it — keep calling `write()` even though it returned `false` — the data queues in the writable's internal buffer, which is unbounded. Memory climbs for as long as the mismatch lasts and the process is eventually OOM-killed. The classic version is streaming a large file to a client on a slow connection while pushing chunks in a `data` handler: the disk reads at hundreds of MB/s, the client accepts a few hundred KB/s, and the difference accumulates in your heap.

This is the main reason to use `pipe`/`pipeline` rather than writing the loop by hand — they implement the pause-and-drain dance correctly.

## What’s the difference between pipe() and pipeline()? (M)

`pipe()` connects a readable to a writable and handles backpressure. That is all it does.

`pipeline()` does the same and additionally propagates errors and destroys **every** stream in the chain when any one of them fails or when the whole thing finishes. The promise version reads naturally with async/await:

```js
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

await pipeline(
  fs.createReadStream(src),
  createGzip(),
  fs.createWriteStream(dest)
); // any failure rejects, and all three are destroyed
```

### What does pipe leak on error?

If the destination errors, `pipe` unpipes the source but does not destroy it. The source stays open holding its file descriptor or socket, and its own `'error'` event has no listener — which for streams means an uncaught exception that takes the process down. In a three-stage chain, one failure leaves the other two dangling.

Under load that is a file-descriptor leak, and you eventually get `EMFILE: too many open files` on an unrelated request, which is a miserable thing to debug. `pipeline` exists precisely because getting this right by hand takes more error handling than the pipe itself.

## How do you prevent memory leaks in Node? (H)

A leak in Node is never memory that JavaScript forgot to free — it is memory the garbage collector *cannot* free, because something still reachable from a root is holding a reference to it. In a long-lived server process that is almost always something global holding on to something per-request.

So prevention is mostly about bounding lifetimes: give every cache a size cap or a TTL, remove every listener you add, clear every timer, release every handle you check out, and be suspicious of any module-level collection that only ever grows. Reviewing for "what is the maximum size this can reach?" catches most of them before they ship.

### What are the usual culprits, and how would you find one in production?

The usual culprits are all variations on the same shape:

- **Listeners** added to a long-lived emitter inside a request handler and never removed. The `MaxListenersExceededWarning` in the logs is Node telling you exactly this.
- **Unbounded caches** — a module-level `Map` keyed by user or request id with no eviction. Use an LRU with a size cap, or Redis with a TTL.
- **Timers and intervals** that are never cleared, each holding its closure alive.
- **Closures captured by something global** — pushing request context onto an array for "debugging" is the classic.
- **Unclosed handles**: streams, database clients checked out of a pool and never released.

Finding one in production: watch `heapUsed` and RSS over time. A leak is a sawtooth whose troughs trend upwards — the heap does not return to baseline after a major GC. Flat-but-high is not a leak; V8 does not hand memory back to the OS eagerly.

Once you believe it is real, take two heap snapshots several minutes apart under load, load them into Chrome DevTools and use the comparison view sorted by retained size. That tells you which constructor keeps growing; the retainer path tells you who is holding it, which is the actual answer. Take snapshots from a canary instance, not the whole fleet — snapshotting pauses the process and roughly doubles memory while it runs. `--heapsnapshot-on-near-heap-limit` is a good safety net for leaks you can't reproduce.

## What’s the difference between operational and programmer errors? (M)

**Operational errors** are expected failures of a correct program: a request timed out, the database refused a connection, the file was not found, the user sent invalid input. They are part of normal operation and you handle them — retry with backoff, fall back to a cache, return a 4xx or 503.

**Programmer errors** are bugs: reading a property of `undefined`, calling something that is not a function, passing the wrong type. You cannot meaningfully handle these, because you do not know what invariant has already been broken. You fix them.

The reason the distinction matters is that it tells you what to do with the error. Retrying an operational error is sensible; retrying a `TypeError` just runs the bug again.

### Should you ever keep the process alive after an uncaught exception?

No. By the time `uncaughtException` fires, an arbitrary stack has been abandoned mid-operation — possibly with a transaction open, a lock held, or a data structure half-updated. Continuing to serve traffic from that state produces corruption that is far worse than a restart.

The correct handler logs the error with full stack, flushes logs and metrics, and exits non-zero, letting the supervisor — Kubernetes, systemd, pm2 — start a clean process. The only legitimate work in between is a bounded graceful shutdown: stop accepting new connections, give in-flight requests a couple of seconds, then exit regardless on a hard timeout.

The same applies to `unhandledRejection`, which is fatal by default from Node 15 onwards for exactly this reason.

## What are the differences between CommonJS and ES modules in Node? (M)

- **Loading.** `require` is synchronous and can be called anywhere, including conditionally inside a function. `import` is static, hoisted, and resolved before any of the module body executes — which is what makes tree-shaking and cycle analysis possible.
- **Bindings.** CJS gives you a copy of whatever `module.exports` pointed at when you required it. ESM exports are live bindings, so if the exporting module reassigns a `let`, importers see the new value.
- **Async.** ESM evaluation can be asynchronous, so top-level `await` works. CJS has no equivalent.
- **Globals.** `__dirname`, `__filename`, `require` and `module` do not exist in ESM. You get `import.meta.url`, `import.meta.dirname` on modern Node, and `createRequire` if you truly need `require`.
- **Resolution.** ESM requires the full file extension and honours `"type": "module"` in package.json (or the `.mjs`/`.cjs` extensions).
- **Interop.** ESM can import CJS — `module.exports` arrives as the default export, with named exports detected best-effort by static analysis. CJS cannot `require` an ESM module; it has to use dynamic `await import()`. Node 22+ can require synchronous ESM, which softens this, but the asymmetry is still the thing that bites in mixed codebases.
- **Cycles.** With CJS you get a partially-populated object back and it often silently half-works. With ESM you get a `ReferenceError` from the temporal dead zone, which is at least loud.

## How would you scale a Node application? (M)

Vertically before horizontally, because most Node apps are slow for reasons that adding instances will not fix.

**First, make one instance efficient.** Profile it. Get synchronous work off the event loop, fix N+1 queries, add indexes, add a cache for the expensive reads, and check you are not blocking on JSON serialisation of enormous payloads. Then use all the cores — one process per core via `cluster` or one container per core.

**Then scale out.** That requires the app to be stateless: no in-memory sessions, no in-memory rate-limit counters, no local upload directory. Push that state to Redis or object storage, then run N instances behind a load balancer and autoscale on a signal that reflects reality — p95 latency or event loop lag, not just CPU, since a Node process waiting on I/O looks idle.

**Then the parts that are not the app.** The database is usually the real ceiling: read replicas, and connection pooling that accounts for the pool being per-instance — twenty instances with a pool of ten is two hundred Postgres connections, which is why PgBouncer exists. Move anything slow off the request path onto a queue so requests return immediately. Put a CDN in front of static assets and cacheable responses so most traffic never reaches Node at all.

## What is AsyncLocalStorage used for? (H)

It keeps a value scoped to an asynchronous call chain — effectively thread-local storage for an async context. You run some work inside `als.run(store, fn)`, and anything called from within it can retrieve that store with `als.getStore()`, no matter how deep the call stack or how many `await`s later.

It exists because the alternative is threading a context object through every function signature in the codebase, from the HTTP handler down to the database layer, purely so the logger can print a request id.

### How does it let you carry a request ID through an async call chain?

Middleware generates the id and starts a context; everything downstream reads it implicitly.

```js
const als = new AsyncLocalStorage();

app.use((req, res, next) => {
  als.run({ requestId: req.get("x-request-id") ?? randomUUID() }, next);
});

// twelve stack frames and three awaits later
logger.info({ requestId: als.getStore()?.requestId }, "query finished");
```

It works because Node's `async_hooks` machinery propagates the context whenever an async resource is created — promises, timers, sockets — so the continuation after each `await` inherits it automatically.

Two things to know: there is a measurable (small) overhead on async operations, and you can lose the context by crossing a boundary created *outside* the `run` — an `EventEmitter` listener registered at startup, or a callback stashed in a module-level queue, runs in whatever context created the emitter, not the one that triggered it. It is the mechanism behind request-scoped logging and tracing in every serious Node observability library.

## How do you implement graceful shutdown on SIGTERM? (M)

On `SIGTERM` — which is what an orchestrator sends before it kills you — you stop taking new work, finish what you have, release everything, and exit.

```js
process.on("SIGTERM", async () => {
  isShuttingDown = true;            // /ready starts failing
  await delay(5000);                // let the load balancer notice
  server.close();                   // stop accepting connections
  await drainInFlight();
  await Promise.all([db.end(), redis.quit(), logger.flush()]);
  process.exit(0);
});
setTimeout(() => process.exit(1), 30_000).unref(); // hard stop
```

### What has to happen in order, and what is the failure mode if you skip it?

1. **Fail the readiness probe first, and wait.** Load balancers find out you are going away on their own schedule, and they keep routing until then. Skipping this delay is the single most common cause of 502s during a deploy — the app closed its listener while traffic was still being sent to it.
2. **Stop accepting new connections** with `server.close()`. Note that it will not fire its callback while keep-alive sockets are idle-but-open, so you need `server.closeIdleConnections()` or a keep-alive timeout, otherwise "graceful" means "hangs for 65 seconds".
3. **Let in-flight requests finish**, with a cap. Skip it and users mid-request get a connection reset.
4. **Drain background work.** Tell the queue consumer to stop claiming jobs and let the current ones finish or return to the queue. Skip it and jobs are lost or half-applied.
5. **Close dependencies** — database pool, Redis, and flush logs and metrics. Skip it and the database is left waiting for transactions to time out server-side, and your last (most useful) logs never leave the process.
6. **Exit, with a hard timeout** shorter than the orchestrator's grace period. Skip that and one stuck connection means Kubernetes `SIGKILL`s you at 30 seconds anyway, in the middle of everything.

## What’s the difference between Express and Fastify? (M)

Express is the default and the reason for the ecosystem: minimal, unopinionated, with middleware for everything. Its router is a linear array of layers walked per request, it has no built-in validation or serialisation, and until v5 it did not handle rejected promises from async handlers.

Fastify is faster, and it is worth knowing where the speed comes from: a radix-tree router rather than a linear scan, and — the big one — schema-based JSON serialisation. If you declare a response schema, Fastify compiles a serialiser for exactly that shape, which is several times quicker than generic `JSON.stringify`, and serialisation is often the hottest thing in a JSON API. It also gives you JSON Schema request validation, an encapsulated plugin system with proper scoping and lifecycle hooks, native async/await support, and much better TypeScript inference.

The honest framing for an interview: raw framework throughput rarely decides anything when a request spends 40ms in Postgres. Choose Fastify for a new service because of the schema-driven validation and serialisation and the plugin encapsulation, not the benchmark. Stay with Express when the middleware ecosystem, existing code and team familiarity are worth more than any of that.
