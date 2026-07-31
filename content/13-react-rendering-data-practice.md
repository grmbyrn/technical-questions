---
slug: react-rendering-data-practice
order: 13
number: '11d'
group: FRAMEWORKS
title: React — Rendering, Data & Practice
status: answered
---

## What’s the difference between Server Components and Client Components? (H)

A Server Component runs only on the server, once, at request or build time. It never ships to the browser — what the client receives is the *output*, a serialised description of the rendered tree, not the component's code. It can be `async`, so it can await a database query or a file read directly in the body, and it has no state, no effects and no event handlers because there is no second act for it to participate in.

A Client Component is what React has always been. Its code is bundled and sent to the browser, it renders on the server for the initial HTML if you are doing SSR, then hydrates and lives in the browser with state, effects, refs and event handlers.

The point of the split is bundle size and data locality. A markdown renderer, a date formatting library, an ORM query — none of that needs to be in the client bundle, and moving a component to the server removes its dependencies from the download entirely. It also collapses the fetch waterfall: a server component fetches next to the database rather than over a round trip from the user's device.

The mental model I use is that Server Components render the parts of the page that are a function of the data, and Client Components render the parts that are a function of the interaction. Most trees are mostly the former, with islands of the latter at the leaves.

### What does the use client directive actually mark?

The *boundary*, not the component. `'use client'` at the top of a file says "everything from here down the import graph is client code" — it is the entry point where the server-rendered tree hands over to the bundler. Modules imported by that file become part of the client bundle whether or not they carry the directive themselves.

So you do not put it on every client component; you put it at the top of the ones that are imported *from* a server component. Everything they pull in is client-side by consequence.

The corollary people miss: the directive is per-file, so `'use client'` on a barrel file that re-exports thirty components drags all thirty into the bundle. It is also why the advice is to push the boundary as far down the tree as possible — a `'use client'` on your root layout makes the entire application a client app with extra steps.

The counterpart is `'use server'`, which marks the opposite direction: functions that are exposed to the client as callable server endpoints. Confusing them is a common mistake — `'use server'` does not mean "this is a server component".

### Can a Server Component be rendered inside a Client Component?

Not by importing it — importing a server component from a client file makes it a client component, because imports follow the bundle. But it can be *passed in* as a prop, most often `children`, and that works fine.

```
// app/page.tsx — server
<ClientTabs>
  <ServerHeavyThing />        {/* rendered on the server, passed in as an element */}
</ClientTabs>
```

The reason it works is that the server has already rendered `<ServerHeavyThing />` into serialised output by the time the client component receives it. The client component is holding a finished element, not a function it needs to call, so none of that component's code is needed on the client.

This is the composition escape hatch that makes the whole model usable in practice. It is how you get an interactive shell — a modal, a tab set, a sidebar with client state — wrapping content that stays entirely on the server.

## What can you not do in a Server Component, and why can you not pass a function as a prop to a Client Component? (H)

No state, no effects, no refs, no event handlers, no browser APIs, no context via `useContext`, and no custom hooks that use any of those. All of them assume a component that persists and re-renders in a browser; a Server Component renders once and produces output, so there is no "later" for any of it to happen in.

Concretely that means no `useState`, `useEffect`, `useReducer`, `onClick`, `window`, `localStorage`, or `useContext`. What it gains instead is `async`/`await` in the body, direct access to the filesystem, environment secrets and the database, and freedom to import heavy libraries without a bundle cost.

You cannot pass a function as a prop across the boundary because props have to be serialised. The server renders a tree and sends it over the wire in React's flight format; a closure cannot be represented in that format, because it carries a scope that only exists in the server process. The same applies to class instances, `Date` subclasses with methods, symbols, `Map`/`Set` in older versions, and JSX from a component the client cannot resolve.

The exception is a Server Action — a function marked `'use server'`, which *is* passable, because what crosses the wire is not the function but a reference to it. The client gets a stub that makes an RPC call back to the server.

### What has to happen to props as they cross the boundary?

They have to be serialisable by React's flight protocol. That is a superset of JSON — primitives, plain objects, arrays, `Date`, `Map`, `Set`, typed arrays, promises, and React elements — but it is not arbitrary JavaScript. Functions, classes, symbols and anything with behaviour attached do not survive it.

Practically, that means when you hand data to a Client Component you are handing it a *copy*, and it is worth being deliberate about how much. Passing an entire ORM record into a client component serialises every field into the HTML payload, where it is visible to anyone reading the page source — including the ones you did not intend to expose. Select the fields you need.

Two consequences worth mentioning. Passing a promise across the boundary is allowed and is the idiomatic way to stream — the server starts the fetch, hands the pending promise down, and the client component `use()`s it inside a Suspense boundary. And errors thrown on the server are sanitised in production before crossing, so the client sees a generic message rather than your stack trace, with a digest you can correlate against the server logs.

## Explain server-side rendering and its benefits. (M)

The server runs the components for a request, produces HTML, and sends that HTML to the browser. The browser paints a complete page immediately, then downloads the JavaScript and hydrates it to make it interactive.

The benefits are first paint and content availability. The user sees real content before the bundle has downloaded and executed, which matters most on slow networks and cheap phones — the gap between "HTML arrives" and "React is running" can be several seconds on a mid-range Android. It also improves the metrics that follow from that, particularly LCP.

Second, crawlers and link previews get real content without executing JavaScript. Google renders JS these days, but not reliably, not immediately, and not for every other bot — social previews, Slack unfurls and non-Google search engines mostly do not.

Third, the server can fetch data next to the data source. A page needing four queries does them over the datacentre network rather than four round trips from the user's device.

The costs are a server to run and pay for, a slower time-to-first-byte than serving a static file, and a whole class of bugs that only exist when the same code runs in two environments — `window` at module scope, dates and locales differing, hydration mismatches. Streaming SSR mitigates the TTFB part by flushing HTML as it is produced rather than waiting for the whole page.

## Explain static generation and its benefits. (M)

The pages are rendered to HTML at build time, once, and served as files. Every request gets the same pre-built output, so there is no rendering work per request at all.

That makes it the fastest and cheapest option available. The response is a file from a CDN edge close to the user — measured in tens of milliseconds — and there is nothing to fall over under load, because serving static files scales trivially. It also has the best failure characteristics: no server means no server incidents, and the page keeps working when your database is down.

The constraint is that the content has to be knowable at build time and the same for everyone. Marketing pages, documentation, blog posts, product pages, changelogs — anything content-driven. Not a dashboard, not anything personalised, not anything that has to be accurate to the second.

The two things that soften those limits are incremental static regeneration — the page is static but regenerated in the background on a schedule or on demand, so content can update without a full rebuild — and rendering the static shell statically while streaming the personalised parts in. Build time is the other practical constraint: ten thousand product pages is a long build, which is what on-demand ISR and `generateStaticParams` with a partial list are for.

## Explain what React hydration is. (M)

Hydration is the process of attaching React to server-rendered HTML. The browser already has the markup; React renders the same component tree, walks the existing DOM instead of creating it, associates each element with its fiber, restores state and refs, and attaches the event handlers. After that the page is a normal React app.

The point is to avoid throwing away the server's work. Without it you would render the HTML, then have React build the whole DOM again and replace it, which flashes and wastes the fast first paint you just paid for.

The cost is that hydration is work on the main thread, and until it finishes the page looks interactive but is not — the "uncanny valley" where clicks do nothing. On a large page that gap can be substantial, which is what selective and progressive hydration address: with `hydrateRoot` and Suspense, React can hydrate parts of the tree independently and prioritise the region the user just interacted with, rather than doing the whole tree in one blocking pass.

The bigger lever is not hydrating at all where you do not need to — which is the entire argument for Server Components and for island architectures like Astro.

### What is a hydration mismatch, and what commonly causes one?

It is when the tree React renders on the client differs from the HTML the server produced. React logs an error, and since 18 it recovers by discarding the server HTML for that subtree and re-rendering it on the client — correct, but it throws away the benefit and can cause a visible flash.

The usual causes are all forms of the two sides having different information:

- **Non-deterministic values** — `Date.now()`, `Math.random()`, `new Date().toLocaleString()`, a `uuid()` in render. Anything that differs between the two executions.
- **Locale and timezone** — the server formats a date in UTC, the browser in the user's timezone.
- **Browser-only state read during render** — `localStorage`, `window.matchMedia`, cookies read client-side. The server has no idea what the theme preference is, which is why dark mode is such a reliable source of these.
- **Invalid HTML nesting** — a `<div>` inside a `<p>`, or a `<p>` inside a `<p>`. The browser's parser fixes it while building the DOM, so the DOM no longer matches what React rendered.
- **Browser extensions** injecting attributes or nodes before hydration.

The fixes are to make the value deterministic, to defer the browser-only part to an effect (render a neutral state on both sides, then update after mount), to use `suppressHydrationWarning` for a genuinely unavoidable single value like a timestamp, or to set the value before React runs at all — a blocking inline script for theme, so the HTML is already correct.

## What is React Suspense, and what does it enable? (M)

`<Suspense fallback={…}>` marks a boundary in the tree that can show a placeholder while something inside it is not ready. A component signals "not ready" by throwing a promise — which is what `React.lazy`, `use()`, and Suspense-aware data libraries do internally — and React shows the nearest boundary's fallback until it resolves.

What it enables is declarative loading states. Instead of every component owning an `isLoading` flag and a branch, the *tree* declares where loading boundaries are, which means loading state is a layout concern positioned wherever the design says it should be, and it composes: nested boundaries give you nested granularity for free.

The two things it unlocks that are not just tidier code are code splitting with `lazy`, and streaming SSR. On the server, React can send the HTML outside a boundary immediately, send the fallback in its place, and then stream the real content in when it resolves — no client JavaScript required for the swap.

It also cooperates with transitions: an update inside `startTransition` will not replace visible content with a fallback, so navigating to a route with a slower data dependency keeps the current page on screen rather than flashing a spinner over it.

The caveat is that it does not work with arbitrary async code — a plain `useEffect` fetch does not suspend. It needs `use()`, a framework's data layer, or a library that integrates with it.

## How do you handle asynchronous data loading? (M)

In an application, with a library — TanStack Query or SWR on the client, a framework loader or a Server Component on the server. Data fetching looks simple and is not: you need caching, deduplication of concurrent requests, retries with backoff, revalidation on focus and reconnect, pagination, optimistic updates and cancellation. Every one of those is a thing you will otherwise write badly by hand in each component.

If I am writing it manually, the shape is a single state object modelled as a union rather than three booleans, an `AbortController` for cancellation, and a check that the response is still relevant before setting state:

```
const [state, setState] = useState({ status: 'idle' });

useEffect(() => {
  const controller = new AbortController();
  setState({ status: 'loading' });

  fetch(url, { signal: controller.signal })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => setState({ status: 'success', data }))
    .catch(e => { if (e.name !== 'AbortError') setState({ status: 'error', error: e }) });

  return () => controller.abort();
}, [url]);
```

The union matters because it makes "loading and errored" unrepresentable, and it forces the UI to handle every state explicitly rather than defaulting to whatever the boolean combination happens to render.

The current React-native answer is `use()` with Suspense for the loading state and an error boundary for failures, which moves both branches out of the component entirely. In Next.js that is a Server Component awaiting the data with `loading.tsx` and `error.tsx` alongside it.

## What are some common pitfalls when doing data fetching in React? (M)

Fetching in an effect at all, when the data is needed for the initial view — it cannot start until after the component mounts, which is after the bundle has loaded and rendered, so it is the last possible moment to begin.

Waterfalls, where each request has to wait for one before it. Race conditions, where responses arrive out of order. Missing cleanup, so a stale response overwrites a fresh one or a request keeps running after the user has navigated away. Those three are the classic set and are covered below.

Beyond them: refetching on every render because an object or inline function is in the dependency array; no caching, so the same data is fetched again on every mount as the user navigates back and forth; no deduplication, so three components mounting together fire three identical requests; treating server data as component state and letting it go stale; over-fetching entire records into client components, which also serialises them into the page payload; and no error handling at all, or a `catch` that logs and leaves the UI stuck on a spinner forever.

The one that causes the most user-visible damage is the loading state on every navigation — showing a spinner for data you already have because there is no cache, so the app feels slower than a page reload.

### Waterfalls, race conditions, missing cleanup — how do you address each?

**Waterfalls** — parallelise anything independent, and hoist the fetch as high as it can go. `Promise.all` rather than sequential awaits; start requests in a route loader or Server Component so they begin before rendering; prefetch on hover or on link visibility. The subtle version is a *component* waterfall: a parent fetches, renders a child, which then starts its own fetch. Fixing that means either lifting both fetches to the same level or letting the parent pass a promise down so the child suspends on something already in flight.

```
// serial — 600ms
const user = await getUser(id);
const posts = await getPosts(id);

// parallel — 300ms
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
```

**Race conditions** — make each request responsible for invalidating itself. An `AbortController` per effect run, aborted in the cleanup, so the previous request is cancelled before the next starts. If the work cannot be aborted, an `ignore` flag closed over by that run and set in the cleanup, checked before every `setState`. A query library keyed by the request parameters sidesteps it entirely, because the result is stored against its key rather than into a single state slot.

**Missing cleanup** — return a cleanup from every effect that starts something. Abort the request, unsubscribe the listener, clear the timer. StrictMode's double-mount in development exists specifically to make the absence of this visible immediately, which is why the response to "my effect runs twice" should be to write the cleanup rather than to suppress the second run.

## What is code splitting in a React application? (M)

Breaking the bundle into chunks that load on demand rather than shipping everything up front. The browser downloads what the first view needs, and pulls the rest in as the user navigates or triggers a feature.

In React the primitive is `lazy` plus `Suspense` — `lazy(() => import('./Chart'))` turns a dynamic import into a component, the bundler emits a separate chunk for it, and the Suspense boundary covers the load.

```
const Chart = lazy(() => import('./Chart'));

<Suspense fallback={<ChartSkeleton />}>
  {showChart && <Chart data={data} />}
</Suspense>
```

The reason to care is that JavaScript is the most expensive resource on a page — it has to be downloaded, parsed, compiled and executed, and on a mid-range phone the execution cost dominates. Cutting an initial bundle from 800KB to 200KB is usually the single largest improvement available to a slow React app.

Route-level splitting is nearly free and is where every framework starts. Beyond that, the honest measurement tool is a bundle analyser: the wins are usually one or two heavy dependencies — a charting library, a rich text editor, a date library with all its locales — not the application code.

### Where would you place the split points, and how do you avoid a loading spinner on every click?

Route boundaries first, because they line up with what the user is doing and the framework does it for you. Then heavy components that are conditionally rendered — modals, editors, charts, maps, video players, anything below the fold or behind an interaction. Then large dependencies imported for a narrow purpose, which can often be dynamically imported inside the handler that uses them rather than at module scope.

The way to avoid the spinner is to make the chunk arrive before it is needed. Prefetch on intent: `onMouseEnter` or `onFocus` of the link or button that will trigger it, which buys you the 100–300ms of hover time and is almost always enough. Frameworks do this for routes automatically — Next.js prefetches links in the viewport — and for your own lazy components you can call the same `import()` early, since the module cache makes the second call free.

The other half is not showing a spinner even when you do wait. `startTransition` around the navigation keeps the current UI on screen instead of swapping in a fallback, and a skeleton that matches the eventual layout is better than a spinner because it does not shift the page when the content arrives. And split at the right granularity — a boundary per small component gives a page that flickers into existence in twelve pieces, which feels worse than one slightly longer wait.

## How do you test React applications? (M)

In layers, weighted towards the middle. Unit tests for pure functions — reducers, formatters, validation, custom hooks with `renderHook`. Component and integration tests for anything with markup, using React Testing Library and Vitest or Jest, where a "unit" is usually a feature rather than a single component. And a small number of end-to-end tests in Playwright for the critical paths: sign in, checkout, the thing that costs money when it breaks.

The principle I follow is to test behaviour through the interface a user has. Render the component, interact with it via `userEvent`, assert on what appears — not on state, not on props, not on whether a particular child rendered. That way a refactor that keeps the behaviour keeps the tests passing, which is the only property that makes a test suite worth maintaining.

```
test('shows an error when the email is invalid', async () => {
  const user = userEvent.setup();
  render(<SignupForm />);

  await user.type(screen.getByRole('textbox', { name: /email/i }), 'nope');
  await user.click(screen.getByRole('button', { name: /sign up/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
});
```

For network, MSW — intercept at the HTTP layer rather than mocking `fetch` or the query library, so the test exercises the real client code and the same handlers can drive local development. `userEvent` over `fireEvent`, because it dispatches the full sequence of real events including focus and keyboard behaviour.

What I do not do is test implementation details, snapshot entire trees (a diff nobody reads, approved with `-u`), or chase 100% coverage — coverage tells you what was executed, not what was verified.

### Why does Testing Library push you towards querying by role?

Because it is the closest a test can get to how the application is actually perceived. `getByRole('button', { name: 'Save' })` finds the thing a user would call the Save button and a screen reader would announce as a button — it goes through the accessibility tree, which is the same surface assistive technology uses.

That makes the query resilient to the changes that should not break a test: swapping a `<div>` for a `<section>`, restructuring the markup, renaming a class, moving to a different styling approach. A `querySelector('.btn-primary')` test breaks on any of those while the behaviour is unchanged.

It also has a useful side effect: elements that cannot be found by role are usually elements with an accessibility problem. A clickable `<div>` has no role and no accessible name, so the test cannot find it — and neither can a keyboard user. The query order the library recommends (role, label, placeholder, text, then `data-testid` last) is essentially a ranking by how closely a query resembles user perception, and it makes accessibility failures show up as test friction rather than as a separate audit.

## How do you debug React applications? (M)

The React DevTools first, because most React-specific bugs are visible in the tree. The Components panel shows props, state and hooks per instance, lets you edit them live, and shows *why* something is rendering if you enable "highlight updates" — a component flashing on every keystroke that has nothing to do with the input is usually the whole diagnosis. The Profiler records a commit and attributes time per component, with the "why did this render" attribution when you turn on record-why-each-component-rendered.

For state that changes and you cannot see where from: the store's devtools if there is one (Redux and Zustand both have time-travel), or a `useEffect` logging the value with its deps to see which change triggered it. For a re-render loop, log in the render body — it is impure and temporary, but it tells you immediately whether the component is rendering twice or two hundred times.

Beyond that it is ordinary web debugging: breakpoints in the sources panel rather than `console.log` for anything with control flow, the network tab for data problems, `debugger` inside a handler, and the performance panel for anything about frames or long tasks. Source maps matter — debugging a minified production bundle is not worth attempting.

Error boundaries plus a reporting service is what makes production debuggable at all: `componentDidCatch` or `onCaughtError` sending to Sentry with the component stack, and `unhandledrejection` for the async errors boundaries do not catch. And `use-strict-mode` warnings and the exhaustive-deps lint rule prevent a decent share of the bugs you would otherwise be debugging.

## How do you localize React applications? (M)

With a library — `react-i18next`, `react-intl`/FormatJS, or `next-intl` in a Next app. What they give you beyond a lookup table is the parts that are easy to underestimate: pluralisation rules (which differ per language, and Slavic languages have three or four forms), interpolation with embedded markup, date/number/currency formatting, and a translation file format the people doing the translating can actually work with.

The mechanics are a provider at the root holding the active locale and its messages, a hook in components to look up keys, and messages held in per-locale JSON keyed by a stable id rather than by the English string — so fixing a typo in the source language does not orphan every translation.

```
const { t } = useTranslation();

t('cart.itemCount', { count });     // handles plural forms per locale
<Trans i18nKey="terms">By continuing you accept our <Link>terms</Link>.</Trans>
```

The things that catch people out are mostly not the strings. Interpolation of components inside a sentence — you cannot concatenate fragments, because word order changes, which is what `<Trans>` exists for. Dates, numbers and currency go through `Intl`, not through hand-written formatting. Pluralisation must not be `count === 1 ? 'item' : 'items'` in application code. Layout has to survive German, which is routinely 30% longer, and RTL languages need `dir="rtl"` plus logical CSS properties (`margin-inline-start` rather than `margin-left`).

Delivery matters too: load only the active locale's messages, split by route if the catalogue is large, and choose the locale from the URL rather than only from a cookie so pages are linkable and indexable per language. In Next that is the `[locale]` segment with `hreflang` tags and a static render per locale, which keeps the whole thing cacheable.
