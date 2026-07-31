---
slug: next-js
order: 14
number: '12'
group: FRAMEWORKS
title: Next.js
status: answered
---

## What’s the difference between the App Router and the Pages Router, and when would you use each? (M)

The Pages Router is the original file-based router: a file in `pages/` is a route, everything is a Client Component, and data fetching happens through the page-level exports `getServerSideProps`, `getStaticProps` and `getStaticPaths`. Layouts are something you assemble yourself in `_app.tsx`.

The App Router is built on React Server Components. Routes are folders in `app/` with special files — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` — components are server-side by default, data fetching is `await` in the component that needs the data, and layouts are nested and persistent across navigation. It also brings streaming with Suspense, Server Actions, and a much more granular caching model.

For anything new I use the App Router. It is where the work is going, the data-fetching model is genuinely better — colocated, parallel by default, no props-drilling from a page-level export — and Server Components are a real reduction in bundle size rather than a marginal one.

I would stay on Pages for an existing application that works, because migration is not mechanical: the mental model changes, and libraries that assume client-side rendering (older CSS-in-JS, some component libraries) need work. They interoperate in the same app, so incremental migration route by route is possible, and that is how I would do it. The Pages Router is still supported and is not being removed, so "it works, leave it" is a legitimate answer.

## Are components Server or Client Components by default, and how do you opt out? (M)

In the App Router, Server Components by default — every file under `app/` is server-side unless it says otherwise. In the Pages Router, everything is a Client Component; Server Components do not exist there.

You opt out with `'use client'` at the top of the file, above the imports. That marks the boundary where server rendering hands over to the client bundle, and everything imported below it becomes client code too.

```
'use client';

import { useState } from 'react';

export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

The rule of thumb is to push the directive as far down the tree as it will go — put it on the small interactive leaf, not on the layout that contains it. A `'use client'` near the root pulls the whole subtree into the bundle and you have a client app with an extra rendering step.

Two practical notes. If you need interactivity inside an otherwise server-rendered page, wrap the server content and pass it in as `children` rather than importing it from the client file — that keeps it on the server. And the directive is per-file, so a barrel file that re-exports a whole component library will drag all of it client-side; import from the specific modules instead.

## What’s the difference between a Server Action and an API Route? (M)

A Server Action is a function marked `'use server'` that the client can call directly. Next generates the endpoint, the serialisation and the fetch for you — you write a function and call it, or hand it to a `<form action={…}>`. It is RPC, typed end to end, colocated with the component that uses it.

An API Route (`route.ts` in the App Router, `pages/api` before that) is an HTTP handler. You own the method, the path, the request parsing and the response, and anything that speaks HTTP can call it.

```
'use server';

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('unauthorised');

  const post = await db.post.create({ data: { title: formData.get('title') as string } });
  revalidatePath('/posts');
  return post;
}
```

For mutations coming from your own UI, the action is the better tool: no endpoint to name, no client-side fetch to write, no duplicated types, and the form works before JavaScript loads because Next progressively enhances `<form action>`.

The thing to be clear about is that an action is a public HTTP endpoint regardless of how it looks. It can be invoked directly by anyone who finds it, so authentication, authorisation and input validation go *inside* the action — being called from a server-rendered page proves nothing about the caller.

### When would you still want an API route?

When something other than your own React app is calling it. Webhooks from Stripe or GitHub, a mobile client, a third-party integration, a public API — all of those need a stable URL, a documented method and a real HTTP contract, none of which a Server Action gives you.

Also when you need control over the HTTP response itself: streaming a file download, setting specific cache headers, returning a non-200 status with a body, serving an image or a PDF, `Content-Type` negotiation, CORS. Actions always respond in React's own format.

And for anything that is not a mutation triggered by a user interaction — a cron endpoint, a health check, an OG image, an auth callback, a `robots.txt` generated at runtime.

The heuristic: my UI mutating my data, Server Action; anything with an external caller or a specific HTTP shape, route handler.

## What’s the difference between SSG, ISR and SSR, and when does each apply? (M)

SSG renders at build time. One render, served as a static file from the CDN, identical for every user until the next deploy. Fastest and cheapest, and it cannot fail at request time because there is nothing running.

ISR is SSG with a background refresh. The page is still static and still served from cache, but after a revalidation window — or when you explicitly invalidate it — the next request triggers a re-render in the background while the stale version continues to be served. So you get static performance with content that is not frozen to the deploy.

SSR renders per request. Every visit runs the component tree on the server, so the output can depend on cookies, headers, the user, or anything that changed a second ago. Slowest TTFB and the only one that needs to scale with traffic.

Which to use follows from how the content varies. Same for everyone and rarely changes — static. Same for everyone but updates independently of deploys (a blog, a product catalogue, a docs site with a CMS behind it) — ISR, with the window set to how stale you can tolerate. Different per user or genuinely real-time — SSR.

In the App Router these are not page-level exports any more; they fall out of the caching options on your fetches and the segment config. `export const revalidate = 3600` gives ISR, `cache: 'no-store'` or reading cookies/headers makes the route dynamic, and the default in Next 15 is uncached fetches — which changed from Next 14 and catches people out.

The fourth option worth naming is Partial Prerendering: a static shell served instantly with dynamic holes streamed in, which is the answer when a mostly-static page has one personalised region.

### What makes a route switch from static to dynamic without you asking?

Reading anything request-specific. `cookies()`, `headers()`, `draftMode()`, and `searchParams` on a page all force dynamic rendering, because their values cannot exist at build time. Same for a fetch with `cache: 'no-store'`, `next: { revalidate: 0 }`, or a non-GET method, and for `export const dynamic = 'force-dynamic'`.

The one that surprises people is that it is transitive through the component tree — a small component deep inside an otherwise static page calling `cookies()` opts the whole route into dynamic rendering. Auth helpers do this constantly, which is how a marketing page ends up rendering per request because a header component checks whether the user is signed in.

You find out from the build output, which prints a symbol per route saying whether it was static, dynamic or ISR. It is worth actually reading — a route that silently became dynamic is a page you thought was on the CDN and is in fact hitting your server on every request.

The fixes are to move the dynamic read into a component wrapped in Suspense so the rest of the page can prerender (which is what Partial Prerendering formalises), or to move it to the client, or to accept it and cache at the CDN with the appropriate headers.

## How do you revalidate cached data, both time-based and on-demand? (M)

Time-based, you attach a revalidation window and let it expire — either per fetch or per route segment. The page keeps being served from cache and is regenerated in the background after the window, so no user waits for the re-render.

```
// per fetch
await fetch(url, { next: { revalidate: 3600, tags: ['posts'] } });

// per segment
export const revalidate = 3600;
```

On-demand, you invalidate explicitly when you know something changed — from a Server Action after a mutation, or from a route handler wired to a CMS webhook, so an editor publishing an article sees it live in seconds rather than at the end of the window.

```
'use server';
export async function publish(id: string) {
  await db.post.update({ where: { id }, data: { published: true } });
  revalidateTag('posts');
  revalidatePath(`/posts/${id}`);
}
```

The pattern I use is both: on-demand for correctness on the paths I control, and a generous time-based window as a backstop for anything that changes without telling me. Worth knowing that `revalidate` sets a maximum staleness, not a refresh schedule — nothing regenerates until a request arrives — and that revalidation is invalidation, so the next visitor triggers the rebuild and may get the stale copy while it happens.

### What is the difference between revalidatePath and revalidateTag?

`revalidatePath('/posts/123')` invalidates the cache for a route. You are saying "this URL's output is stale", so the whole page is regenerated, including everything it fetched.

`revalidateTag('posts')` invalidates a *data* tag. Any fetch anywhere in the app that was tagged `posts` is marked stale, and every route whose output depended on one of those fetches is regenerated — however many that is, wherever they are.

The distinction matters for the common case where one piece of data appears on several pages. A post shows on `/posts/[id]`, on `/posts`, in a sidebar of recent posts on the home page, and in the author's profile. With paths you have to enumerate all four and keep that list correct forever. With a tag you invalidate the data and Next works out which routes it touched.

So: tags for data that appears in multiple places, paths when you genuinely mean "this specific page changed" or when a route's output depends on something outside the fetch cache. `revalidatePath` also takes a type argument for dynamic segments (`revalidatePath('/posts/[id]', 'page')`) if you want every instance of a route pattern rather than one URL.

## When would you use middleware, and what are its constraints? (M)

Middleware runs before a request is matched to a route, so it is for decisions you want to make on the way in, on every matching request: redirecting unauthenticated users away from a protected area, rewriting for A/B tests or feature flags, geo or locale routing, setting a request header, bot handling, or attaching a request id.

It is one file at the project root with a `matcher` config, and it runs on the Edge runtime — geographically close to the user, before any rendering happens.

```
export function middleware(req: NextRequest) {
  const token = req.cookies.get('session');
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/settings/:path*'] };
```

The constraints are the point. It runs on the Edge runtime, so no Node APIs and no native modules. It runs on *every* matching request including ones the CDN would otherwise have served, so it sits on the latency path of the whole site — the matcher should be as narrow as possible, and the body should be fast. And it cannot render anything; it can only redirect, rewrite, or continue with modified headers.

The design rule I follow is that middleware makes cheap, coarse decisions. Anything that needs the database, the full session, or per-resource permissions belongs in the page or the action.

### Why can you not query a database directly from middleware?

Because the Edge runtime is not Node. It is a V8 isolate with the Web APIs — `fetch`, `Request`, `Response`, `crypto`, `URL` — and no `net`, `fs`, `dns` or `tls`. Every traditional database driver opens a raw TCP socket, so `pg`, `mysql2` and the Mongo driver simply cannot load there.

There is also a design reason. Middleware runs on every matching request, at the edge, physically far from your database. A query from there is a round trip across the internet to your primary region, added to the front of every request — you would be paying 100–200ms globally to check something you could check inside the render that already has to happen.

What does work is an HTTP-based data layer: Vercel KV/Upstash Redis, Neon or PlanetScale's serverless HTTP drivers, Prisma with Accelerate, or your own API. Realistically, though, the answer for auth is not to query at all — verify a stateless signed token (a JWT with `jose`, which is Edge-compatible) or just check for the presence of a session cookie, and do the real lookup in the server component or action that needs it.

That is also why Next's own auth guidance moved towards "optimistic check in middleware, authoritative check at the data access layer" — middleware decides whether to bother rendering, the render decides what you are allowed to see.

## What’s the difference between redirect() and router.push()? (E)

`redirect()` is server-side. You call it from a Server Component, a Server Action or a route handler, and it stops execution — it throws a special error Next catches — and sends the browser to the new location. Nothing after it in the function runs, and no HTML for the original page is produced.

`router.push()` is client-side, from `useRouter()` in a Client Component. It performs a client-side navigation: no full page load, the layouts that are shared stay mounted, and it pushes an entry onto the history stack so back returns to where you were.

```
// server — a guard in a layout or page
const session = await auth();
if (!session) redirect('/login');

// client — after an interaction
const router = useRouter();
async function onSubmit() { await save(); router.push('/dashboard') }
```

Two details worth knowing. `redirect` issues a 307 by default (308 in a Server Action, preserving the method), and its counterpart `permanentRedirect` issues a 308 — the distinction matters for SEO and for caching. And because `redirect` works by throwing, calling it inside a `try` block will be caught by your own `catch`; it has to sit outside, which is a genuinely common bug.

The equivalent pair for replacing rather than pushing is `router.replace()` on the client — the right choice after a login, so back does not return to the login form.

## What’s the difference between layout.tsx and template.tsx? (M)

Both wrap the route segment below them. The difference is what happens on navigation within that segment: a layout stays mounted and is reused, a template is remounted, creating a new instance every time.

So a layout preserves its DOM, its state and its scroll position, and its effects do not re-run. A template unmounts and mounts, so state resets, effects fire again, and CSS enter animations play.

Layouts are what you want almost always — a sidebar whose scroll position and expanded sections survive navigating between pages, a nav that does not flicker, a persistent player. That persistence is one of the main reasons the App Router exists.

Templates are for the cases that need per-navigation freshness: an enter animation on each page, a `useEffect` that logs a page view and must run on every navigation, or a form whose state must not survive moving to a sibling route. If you have both, the template renders inside the layout.

Neither can access `searchParams` — only pages can — and a root `layout.tsx` is mandatory and owns the `<html>` and `<body>` tags.

### Which one preserves state across navigation?

The layout. It is the same React component instance across sibling routes, so anything inside it — `useState`, refs, scroll position, an open dropdown, a running animation — is untouched when the page beneath it changes.

The template does not. It gets a fresh key on every navigation, so React unmounts the old subtree and mounts a new one; state goes back to its initial value and effects re-run from scratch.

The way I remember which is which: a layout is *the frame*, and the frame does not move when you change the picture. If you find yourself wanting a layout to reset, you either want a template, or you want a `key` on the specific component that should reset — which is usually the more surgical fix, since it is rare that the whole frame needs to be thrown away.

## When would you do an auth check in middleware versus a server component? (M)

Both, for different jobs. Middleware does the cheap gate: is there a session cookie, is the token structurally valid and unexpired, should this request be allowed to proceed at all. It runs before rendering, so an unauthenticated user hits a redirect without your server rendering a page they will never see, and one matcher covers a whole area of the site.

The Server Component — or better, the data access layer beneath it — does the authoritative check: is this session actually valid against the store, is this user's account still active, do they have permission for *this specific resource*. That needs the database and the resource id, neither of which middleware has cheaply.

The reasoning behind the split is that middleware is coarse and optimistic. It sees a cookie, not a verified session; it knows a path, not which row you are requesting. Treating it as the only guard produces the classic bug where `/posts/123` is protected in general but any signed-in user can read anyone's post.

So the model I follow is: middleware redirects the obviously-unauthenticated, the layout or page confirms the session, and every function that reads or writes data re-checks authorisation itself. The last one is the one that actually protects you, because Server Actions and route handlers are directly callable and never pass through the page's check at all. Vercel's own guidance moved this way after CVE-2025-29927, where a crafted header could bypass middleware entirely — a good illustration of why the authorisation check should not live only at the edge.

## What are the benefits of next/image, next/font and next/dynamic? (M)

`next/image` handles everything you would otherwise get wrong about images: it serves modern formats (AVIF/WebP) with fallbacks, resizes per device with a correct `srcset` and `sizes`, lazy-loads below the fold, and reserves the space so the page does not shift when the image lands. Add `priority` for the LCP image so it is preloaded rather than lazy-loaded, and `placeholder="blur"` for a low-quality preview. Images are usually the largest thing on a page, so this is one of the highest-leverage components in the framework.

`next/font` self-hosts fonts at build time — including Google Fonts, downloaded and served from your own domain, so there is no request to a third party, no extra DNS and TLS handshake, and no privacy or availability dependency. It generates the `@font-face` with the right `font-display`, preloads the files, and builds a matched fallback so the swap does not move the text.

`next/dynamic` is `React.lazy` with Next's SSR knowledge attached: a dynamic import that gets its own chunk, with a `loading` component and `ssr: false` for anything that cannot render on the server. It is how you keep a chart library, a map, a rich text editor or a modal out of the initial bundle.

All three are the same trade: a small amount of framework coupling in exchange for the performance defaults that are tedious and easy to get wrong by hand.

### What layout-shift problem does next/font actually solve?

The reflow when a web font replaces the fallback. The browser paints with a system font first, then swaps in the real one, and because the two have different metrics — x-height, character widths, line height — every line of text re-wraps and moves. Anything below it shifts, which is exactly what CLS measures, and it is one of the most common causes of a poor score.

`next/font` fixes it by generating a fallback `@font-face` whose metrics are adjusted to match the real font: `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` are computed from the actual font file so the fallback occupies the same space. When the real font arrives, the swap is invisible because nothing moves.

It also removes the *delay* before the swap. Self-hosting means the font is fetched from the same origin as the document, on a connection already open, and it can be preloaded — instead of the old sequence of parsing CSS, connecting to `fonts.googleapis.com`, fetching a stylesheet, then connecting to `fonts.gstatic.com` for the file, which is two extra connections on the critical path.

## What’s the difference between the Edge runtime and the Node runtime? (M)

The Node runtime is a normal Node.js process — the full standard library, npm packages with native bindings, TCP sockets, filesystem access. It is the default for route handlers and rendering.

The Edge runtime is a V8 isolate with only Web-standard APIs: `fetch`, `Request`, `Response`, `URL`, `TextEncoder`, `crypto.subtle`, `ReadableStream`. It starts in single-digit milliseconds because there is no process to boot, and it is deployed to many locations, so it runs geographically close to the user.

The tradeoffs follow directly. Edge wins on cold start and on latency for anything that does not need to talk back to a central datacentre — middleware, redirects, geolocation, personalisation, A/B assignment, simple streaming. Node wins on everything that needs the ecosystem: a database driver, a PDF or image library, a large SDK, anything with a native module. Edge functions also carry tighter limits on bundle size, memory and execution time.

Middleware is Edge-only. Everything else lets you choose per route with `export const runtime = 'edge'`, and the sensible default is Node unless there is a specific reason for the other.

Worth noting that Node is increasingly the recommendation even for cases Edge was pitched for: if the function has to query a database in one region, running it at the edge means a fast start followed by a slow round trip, which is usually a net loss.

### What Node APIs are unavailable at the edge, and when does that force your hand?

No `fs`, no `net`, `tls` or `dgram`, no `child_process`, no `worker_threads`, no native addons, and no `Buffer` or `process` beyond a small shim. `crypto` is only the Web Crypto subset — `crypto.subtle` — not Node's module.

What that rules out in practice: every traditional database driver, because they open TCP sockets; anything doing image processing (`sharp`), PDF generation, or archive handling; libraries that read files at runtime, which includes some template and i18n setups; `jsonwebtoken` and `bcrypt`, both of which depend on Node crypto or native bindings.

It forces your hand any time the work needs one of those. The usual resolutions are to swap the library for a Web Crypto equivalent (`jose` for JWTs, which is Edge-compatible and better anyway), to move to an HTTP-based data client (Neon, PlanetScale, Upstash, Prisma Accelerate), or simply to run that route on Node and keep Edge for the parts that genuinely benefit.

The one place it is not negotiable is middleware, which is why auth middleware ends up checking a signed token rather than a session table — and why the real session check has to happen further in.

## How does streaming with Suspense or loading.tsx improve perceived performance? (H)

Without streaming, server rendering is all-or-nothing: the server waits for every data dependency, renders the whole page, and sends it. The user stares at a blank screen for the duration of the slowest query, and TTFB is the sum of the worst path.

With streaming, the server sends the HTML it already has — the shell, the layout, the navigation, anything not blocked on data — immediately, with a placeholder where the pending content goes. TTFB drops to roughly the time to render the shell. As each slow region resolves, its HTML is streamed down the same response and swapped into place.

The perceptual win is large even when total load time is unchanged, because the user sees structure immediately and can start reading, and the parts that arrive later arrive one at a time rather than in one late block. It also means one slow query no longer holds the whole page hostage — a page with a fast product description and a slow recommendations widget shows the description straight away.

`loading.tsx` is the file-based version: Next wraps the page in a Suspense boundary with that file as the fallback, giving you a route-level skeleton for free. Manual `<Suspense>` boundaries inside the page give finer granularity, and that is where the real gains are — one boundary per independent slow region, with a skeleton that matches the final layout so nothing shifts when it fills in.

### What is sent to the browser first, and how does the rest arrive?

First is the document shell: `<head>` with the stylesheets and font preloads, then whatever HTML React could render without suspending — layouts, navigation, static content — with the fallback markup inline wherever a Suspense boundary is pending. That is enough for the browser to start fetching CSS and JS and to paint something real.

The response is not closed. As each suspended boundary resolves on the server, React writes the resolved HTML into the same chunked response, wrapped in a hidden `<div>` at the end of the body, followed by a tiny inline script that moves it into the placeholder's position and removes the fallback. That swap is plain DOM manipulation and needs no React on the client, which is why streamed content appears even before hydration.

Alongside the HTML, React streams the RSC payload — the serialised component tree — which the client uses to hydrate and to reconcile with future navigations. Hydration is selective: React hydrates the boundaries that have arrived rather than waiting for the whole document, and it prioritises whichever region the user has just interacted with.

Two practical consequences. Because the response has already started, you cannot set headers or issue a redirect after the first flush — so anything that might redirect has to happen before streaming begins. And intermediaries that buffer responses will defeat the whole mechanism, which is worth checking if streaming appears to do nothing behind a proxy.

## How would you keep a Next.js site stable under very high concurrent traffic? (H)

The strategy is to make as few requests as possible reach anything that computes. In order:

**Serve static from the CDN.** Anything that can be SSG or ISR should be, because a static hit never touches your origin and scales without limit. The biggest single win under load is usually discovering which routes silently became dynamic — a `cookies()` call in a shared header, a `searchParams` read, an uncached fetch — and fixing them so the page is prerendered again. Partial Prerendering is the tool when a page is mostly static with one personalised region.

**Cache what remains.** `Cache-Control` with `stale-while-revalidate` on dynamic responses so the CDN can serve a slightly stale copy while refreshing; the Next data cache with tags for fetches; a shared Redis layer for anything expensive and reused across instances. `stale-while-revalidate` in particular is what stops a cache expiry turning into a thundering herd against the origin.

**Protect the origin.** Rate limiting at the edge on anything that mutates or is expensive, deduplication of identical in-flight requests, and a circuit breaker with a cached or degraded response when a downstream dependency starts failing — so a slow third-party API sheds load instead of holding connections open until everything is exhausted.

**Watch the database, because that is what actually falls over.** Serverless concurrency multiplies connections, so a connection pooler (PgBouncer, Prisma Accelerate, or a serverless HTTP driver) is not optional. Then the ordinary work: indexes for the query patterns, no N+1s, read replicas for read-heavy paths, and a hard timeout on every query so a slow one cannot occupy a connection indefinitely.

**Keep the client cheap.** A smaller bundle and fewer client components mean less server render work and fewer requests overall. Streaming with Suspense also helps under load, because the shell can be cached and served while only the dynamic hole costs anything.

**Then verify it.** Load test against a realistic traffic mix before the event rather than after, with monitoring on p95/p99 latency, error rate, cache hit ratio and database connection count — and know in advance which features you will turn off if you have to. Being able to serve a degraded page is worth more under real load than any amount of optimisation that assumes everything stays up.
