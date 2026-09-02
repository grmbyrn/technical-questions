---
slug: express
order: 28
number: '26'
group: BACKEND & DATA
title: Express
status: answered
---

## What is middleware, and what does the (req, res, next) signature mean? (M)

Middleware is a function that sits in the request pipeline with access to the request object, the response object, and a handle to the next function in the chain. Express keeps an ordered stack of these layers and walks it for every incoming request.

`req` is the incoming request — URL, headers, body once parsed, and whatever earlier middleware attached to it. `res` is the response you build up and send. `next` is the continuation: calling it passes control to the next matching layer, and calling `next(err)` skips the rest of the normal stack and jumps straight to error-handling middleware.

Every middleware must do exactly one of two things: send a response and end the cycle, or call `next()`. Route handlers are just middleware that happen to be the last link.

```js
app.use((req, res, next) => {
  req.startedAt = Date.now();
  res.on("finish", () => log(req.method, req.path, Date.now() - req.startedAt));
  next();
});
```

### What happens if you never call next and never send a response?

The request hangs. Express has no timeout of its own, so the socket stays open until the client, or a proxy in front of you, gives up — which might be 60 seconds later, or never for a patient client.

That is worse than an error, because it is silent. The hanging requests hold sockets, and hold every object reachable from that request's closures, so under load you lose concurrency and grow memory with nothing in the logs to explain it. The usual cause is a conditional where one branch responds and the other quietly falls off the end of the function.

## Why does middleware execution order matter? (M)

Because the stack is ordered and Express walks it top to bottom: a middleware only affects routes registered *after* it. That gives a required ordering:

1. Security and infrastructure first — `helmet`, `cors`, request id, logging — so they apply to everything including 404s.
2. Body parsers before any handler that reads `req.body`.
3. Static file serving early, so asset requests short-circuit before touching your app logic.
4. Authentication and authorisation before the routes they protect.
5. Routes.
6. A catch-all 404 after all routes.
7. Error-handling middleware last of all.

The reason this catches people out is that getting it wrong usually fails silently rather than loudly. Register `helmet` after your routes and every response simply lacks security headers, with no error anywhere. Put `express.json()` after a POST handler and `req.body` is `undefined`, which looks like a client bug. Put the 404 handler before a router and that router becomes unreachable.

## How does routing work, and what is express.Router() for? (E)

A route is a method, a path pattern, and one or more handlers: `app.get("/users/:id", handler)`. Express matches layers in registration order and the first one that sends a response wins, so ordering matters here too — `/users/me` has to be registered before `/users/:id`, otherwise `:id` matches and you spend twenty minutes looking up a user called "me".

`express.Router()` is a mini-application: its own isolated stack of middleware and routes, which you mount somewhere with `app.use()`.

```js
// routes/users.js
const router = express.Router();
router.use(requireAuth);              // scoped to this router only
router.get("/", listUsers);
router.get("/:id", getUser);
export default router;

// app.js
app.use("/api/users", usersRouter);
```

It buys three things: modularity, so each resource lives in its own file instead of one enormous `app.js`; a mount prefix defined in exactly one place, so versioning the API is a one-line change; and middleware scoped to a subtree rather than applied globally, which is how you apply auth to `/api/admin` without touching `/api/public`.

## How does error-handling middleware work, and where does it go? (M)

It is a middleware with four parameters — `(err, req, res, next)` — and it goes last, after every route and router, because errors travel forward through the stack like everything else.

It runs when something calls `next(err)`, or when a handler throws synchronously (Express catches sync throws itself and routes them here). Inside it you log the error, map it to a status code and a safe response body, and stop.

```js
app.use((err, req, res, _next) => {
  logger.error({ err, requestId: req.id }, "request failed");
  const status = err.statusCode ?? 500;
  res.status(status).json({
    error: status >= 500 ? "Internal Server Error" : err.message,
  });
});
```

Two details worth mentioning: never leak stack traces or internal messages for 500s in production — map unknown errors to a generic message and keep the detail in the logs. And if `res.headersSent` is true, you cannot send a second response; delegate to `next(err)` and let Express's default handler close the connection.

The clean pattern is a typed `AppError` with a `statusCode`, thrown from anywhere in the service layer, so the handler needs almost no branching.

### Why does it need four arguments?

Purely arity detection. Express keeps error handlers in the same array of layers as normal middleware and distinguishes them by checking `fn.length === 4`. Declare three parameters and it is treated as ordinary middleware that never runs on errors; declare four and it only runs on errors.

So the fourth parameter must be *declared* even when unused — which is why you often see it named `_next` to keep the linter quiet. Losing it is a common bug: the handler stops firing, errors fall through to Express's default handler, and you get an HTML stack trace instead of your JSON error shape.

## What does app.use do? (E)

It mounts middleware onto the application stack, optionally under a path prefix.

With no path, the middleware runs for every request: `app.use(express.json())`. With a path, it runs for any request whose URL *starts with* that prefix, for any HTTP method: `app.use("/api", apiRouter)` matches `/api/users` and `/api/orders`, GET or POST.

That prefix matching is the difference from `app.get("/api")`, which matches that exact path and that method only. It is what makes `app.use` the tool for mounting routers, serving static files, applying global middleware, and registering the error handler — anything that is about a subtree rather than a single endpoint.

## How do you parse the body, query and route params? (E)

**Body** — `req.body` is only populated if a parser ran first. `express.json()` for JSON payloads, `express.urlencoded({ extended: true })` for HTML form posts, and something like `multer` for multipart uploads. Set a size limit; the default is 100kb, and an unbounded body is a cheap denial-of-service vector.

**Query** — `req.query` is parsed from the query string automatically, no middleware needed. Values are strings, so `?page=2` gives you `"2"`. In Express 4 the extended parser also turns `?filter[name]=x` into a nested object, which is occasionally useful and occasionally a security footgun (prototype-pollution-shaped input arrives as an object you did not expect).

**Params** — `req.params` holds the named segments of the matched route: `/users/:id` gives `req.params.id`, also as a string.

All three are untrusted user input, and none of them are typed. The thing that matters more than the mechanics is validating at the boundary — parse with zod or joi in a middleware, replace the raw values with the validated result, and let the rest of the handler work with real types:

```js
const schema = z.object({ page: z.coerce.number().int().positive().default(1) });
app.get("/users", validate(schema, "query"), (req, res) => { /* req.query.page is a number */ });
```

## How do you serve static files? (E)

`express.static()`, mounted with `app.use`:

```js
app.use("/static", express.static("public", { maxAge: "1y", immutable: true }));
```

It resolves the path within the given root, sets `Content-Type` from the extension, handles `ETag` and `Last-Modified` (so conditional requests get a 304), and supports range requests for media. It calls `next()` when the file does not exist, so unmatched requests fall through to your routes.

Register it early so asset requests short-circuit before the rest of the stack. Use long `maxAge` with `immutable` only for content-hashed filenames; for anything served under a stable name, that caching header means users are stuck with a stale file.

In production most setups put a CDN or nginx in front, so Node is not reading files off disk on the hot path at all — `express.static` is then mostly a development convenience and a fallback.

## How would you structure a production Express API? (M)

Layered, and grouped by feature rather than by technical role — `users/` containing its controller and service beats a `controllers/` folder containing thirty unrelated files.

```
src/
  modules/
    users/  routes.ts  controller.ts  service.ts  repository.ts  schema.ts
    orders/ ...
  middleware/   auth.ts  validate.ts  errorHandler.ts  requestContext.ts
  config/       env.ts        // validated at startup, fails fast
  app.ts                      // builds and returns the app — no listen()
  server.ts                   // listen, signal handlers, graceful shutdown
```

The discipline that makes it worth doing is keeping the layers honest:

- **routes** only map URLs to middleware and handlers.
- **controllers** do HTTP and nothing else: read validated input, call a service, choose a status code.
- **services** own the business logic and know nothing about `req` or `res`, so they can be unit tested without HTTP and reused from a queue worker or a CLI.
- **repositories** own data access, so swapping or mocking the database touches one layer.

Around that: config validated from the environment at boot; structured JSON logging with a request id propagated via `AsyncLocalStorage`; a central error handler with typed errors; validation middleware at the edge; `helmet`, `cors` and rate limiting; and `/health` plus `/ready` endpoints for the orchestrator.

Splitting `app.ts` from `server.ts` is the small decision with the largest payoff — it means integration tests can `supertest(app)` without binding a port.

## How do you handle errors thrown in async route handlers? (M)

In Express 4 you have to catch them yourself. The standard fix is a wrapper that adapts a promise-returning handler into one that forwards rejections to `next`:

```js
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/users/:id", wrap(async (req, res) => {
  const user = await service.getUser(req.params.id);   // may throw NotFoundError
  res.json(user);
}));
```

The alternatives are `express-async-errors`, which monkey-patches the router so every handler is wrapped implicitly, or moving to **Express 5**, which awaits the value a handler returns and passes a rejection to `next(err)` itself. On Express 5 this problem simply goes away, and that is a large part of why the upgrade is worth it.

### Why does a rejected promise in a handler not reach your error middleware by default?

Because Express 4's dispatch calls your handler inside a `try/catch` and ignores the return value. A `try/catch` only catches what throws synchronously within it; an async function returns a pending promise immediately, and by the time it rejects, that stack frame has long since unwound. There is nothing left to catch it.

So the rejection is unhandled: `next` is never called, no response is ever sent, and the request hangs until the client times out — while the process logs an unhandled rejection warning, which on modern Node is fatal by default. It is the same "you cannot try/catch across an async boundary" problem as with callbacks, and the same fix: attach a `.catch` that hands the error back into the framework's own channel.

## What do middleware like CORS, helmet and rate-limiting add? (M)

**`cors`** sets the `Access-Control-Allow-*` headers and answers preflight `OPTIONS` requests. It exists because the browser's same-origin policy blocks cross-origin reads unless the server opts in — so it is the server declaring which origins may read its responses. Configure an explicit allowlist; reflecting whatever `Origin` the request sent while also setting `credentials: true` is the same as having no policy, and it is a common misconfiguration. Worth saying out loud: CORS is a browser mechanism, not an authorisation one — it does nothing about a request from curl.

**`helmet`** sets a bundle of security response headers: Content-Security-Policy, HSTS, `X-Content-Type-Options: nosniff`, frame-ancestors/`X-Frame-Options`, and `Referrer-Policy`. Cheap defence in depth against XSS, clickjacking, MIME sniffing and protocol downgrade. Everything except CSP is useful out of the box; CSP is the one that genuinely needs configuring per app, and the one that does the most.

**`express-rate-limit`** caps requests per key per window, which protects login endpoints from credential stuffing and everything else from casual abuse. Two things to get right in production: it needs a shared store such as Redis once you run more than one instance, otherwise your effective limit is silently multiplied by the instance count; and it needs `app.set("trust proxy", …)` configured correctly behind a load balancer, or every request appears to come from the proxy's IP and you rate-limit all your users as one.

The framing to add is that these are layers rather than a solution. None of them replaces server-side authorisation checks, input validation, or an edge/WAF rate limit for volumetric attacks — they raise the cost of the easy attacks.
