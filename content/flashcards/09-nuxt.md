---
title: Nuxt
order: 9
tags: [nuxt]
---

## What does Nuxt add on top of Vue?

Server rendering, file-based routing, a server API layer, and auto-imports

Vue is the view library; Nuxt is the application framework around it, so routing, SSR, data fetching and the build are configured for you.

## Where do you put a file so it becomes the /about page?

`app/pages/about.vue`

Routing is file-based: the path of the file under `pages/` is the URL, so no route config is written by hand.

## Which component renders the matched page inside `app.vue`?

`<NuxtPage />`

It is the outlet the router fills with whichever page matches the current URL.

## What happens to routing if you have an `app.vue` with no `<NuxtPage />` in it?

Nothing routes — `app.vue` renders on every URL and the pages are ignored

`app.vue` replaces the whole app shell, so leaving out the outlet means no page ever gets rendered.

## How do you make a route segment dynamic?

Put the parameter name in square brackets, like `[id].vue`

A bracketed filename matches any value in that position, and the name inside the brackets is the key you read it back by.

## Inside `app/pages/blog/[slug].vue`, how do you read the slug from the URL?

`const route = useRoute()`, then `route.params.slug`

`useRoute` returns the current route object, and dynamic segments arrive on its `params`.

## Which filename matches /docs/a, /docs/a/b and /docs/a/b/c alike?

`[...slug].vue`

The spread makes it a catch-all, and the matched segments arrive as an array on `route.params.slug`.

## Why use `<NuxtLink>` instead of a plain `<a>` for internal links?

It navigates on the client without a full page reload, and prefetches the target

`<a>` throws away the running app and reloads everything; `<NuxtLink>` swaps the page in place and preloads it when the link appears.

## How do you navigate from inside a function rather than a link?

`navigateTo("/dashboard")`

It is the Nuxt helper for programmatic navigation, and works in middleware and on the server as well as in the browser.

## Where does a layout live, and which one applies when a page does not choose?

`app/layouts/default.vue`

Any page without an explicit choice is wrapped in `default.vue`, so shared chrome like a header and footer goes there.

## Which element marks where the page appears inside a layout file?

`<slot />`

A layout is an ordinary component, so the page is passed to it as slot content.

## How does a single page opt into a different layout?

`definePageMeta({ layout: "admin" })`

`definePageMeta` is a compiler macro read at build time, so it configures the route rather than running at render.

## You created `app/components/BaseButton.vue`. What do you import to use it in a page?

Nothing — auto-imports make it available as `<BaseButton />`

Nuxt scans the directory and registers what it finds, so components, composables and utils are usable without an import line.

## What does `useAsyncData` solve that fetching in `onMounted` does not?

It runs on the server and passes the result to the client, so the data is in the HTML and is fetched once

`onMounted` never runs during SSR, so the page ships empty and the browser has to fetch after hydrating.

## Why does this never refetch when `id` changes?

```js
const { data } = await useFetch(`/api/users/${id.value}`)
```

---

The template literal is evaluated once, so Nuxt receives a fixed string

Pass a getter so the URL is re-evaluated, or add `watch: [id]`:

```js
const { data } = await useFetch(() => `/api/users/${id.value}`)
```

## What is the difference between `useFetch` and `useAsyncData`?

`useFetch` is sugar for `useAsyncData` with `$fetch` as the handler

Use `useFetch` for a plain URL; use `useAsyncData` when the work is any other async function, like a CMS or database SDK call.

## What is the key argument to `useAsyncData` for?

It identifies the cached result, so the server payload and the client lookup match

Two calls sharing a key share the data, which is why a dynamic fetch with a colliding key returns the wrong result.

## When should you call `$fetch` directly instead of `useFetch`?

In event handlers and mutations — anything that is not a page-load read

`$fetch` just makes the request; the SSR payload and hydration machinery of `useFetch` has no job to do after the page has loaded.

## What does `lazy: true` change about `useFetch`?

The route renders immediately instead of blocking navigation until the data arrives

You then drive the UI off `status` rather than assuming `data` is populated on first render.

## Which statements about data fetching in Nuxt are true? Select all that apply.

(select multiple)

1. `useFetch` blocks navigation until it resolves unless you pass `lazy: true`

2. Calling `useFetch` inside a click handler is the normal way to submit a form

3. `server: false` makes the call skip SSR and run only in the browser

4. Everything `useFetch` returns is serialised into the HTML payload

---

**1, 3, 4** For a submission use `$fetch`, and use `pick` or `transform` to keep the payload small.

## How do you re-run a `useAsyncData` call on demand?

Call the `refresh` function it returns

`refreshNuxtData()` does the same across keys when you want to invalidate more broadly.

## Where do server API routes live, and what wraps the handler?

`server/api/`, with the handler wrapped in `defineEventHandler`

A file at `server/api/users.ts` is served at `/api/users`, and its return value is sent as JSON.

## What is Nitro?

Nuxt's server engine, which builds the server half into a portable bundle

It is what lets the same project deploy to Node, a static host, Workers or a serverless platform without rewriting the server code.

## In a server route, how do you read a route param, a query string and a JSON body?

`getRouterParam(event, "id")`, `getQuery(event)` and `await readBody(event)`

All three take the `event` the handler receives, which carries the underlying request.

## Why is a module-scope `const count = ref(0)` shared between components a bug in an SSR app?

The server process is shared, so that ref leaks state between users' requests

On the client a module is per-browser, but on the server it is created once and every request sees the same value.

## What does `useState` give you that a plain `ref` does not?

State that is per-request on the server and transferred into the client payload

It is the SSR-safe way to share state across components, and it hydrates rather than resetting.

## What does `ssr: false` in `nuxt.config.ts` do?

Turns the app into a client-rendered SPA with no server rendering

The server sends an empty shell and the browser does all the rendering, which costs first paint and SEO.

## What is `routeRules` used for?

Setting the rendering and caching behaviour per route

It is how one app mixes strategies — prerender the marketing pages, cache the blog, render the dashboard per request.

## Which command builds a fully static site you can host anywhere?

`nuxt generate`

It prerenders every route to HTML at build time, so no Node server is needed to serve it.

## How do you set the page title and meta description?

`useSeoMeta({ title: "...", description: "..." })`

`useHead` is the lower-level version for arbitrary tags; `useSeoMeta` is the typed, SEO-focused wrapper.

## What is route middleware, and how do you make one run on every route?

A function that runs before a navigation is confirmed; name it with a `.global.ts` suffix

Named middleware in `app/middleware/` runs only where a page opts in via `definePageMeta`, while a global one runs for all of them.

## An auth middleware needs to send a signed-out visitor to /login. What does it return?

`return navigateTo("/login")`

Returning the redirect cancels the current navigation and starts the new one.

## What does a Nuxt plugin do, and how do you reach what it provides?

Runs setup code at app start; anything it provides is read via `useNuxtApp()`

A plugin in `app/plugins/` returning `{ provide: { hello } }` is used as `useNuxtApp().$hello`.

## Which half of `runtimeConfig` is readable in the browser?

Only `runtimeConfig.public`

Anything outside `public` stays server-side, which is what keeps API secrets out of the client bundle.

## What does `<ClientOnly>` do, and when do you need it?

Skips its children during SSR and renders them only in the browser

It is the escape hatch for a component that touches `window` or produces different output on server and client.

## Which of these cause a hydration mismatch? Select all that apply.

(select multiple)

1. Rendering `new Date().toLocaleTimeString()` directly in the template

2. Reading `localStorage` during setup to decide what to render

3. Fetching data with `useAsyncData` and rendering it

4. Rendering a value from `Math.random()`

---

**1, 2, 4** Each produces different markup on the server and the client; `useAsyncData` avoids it precisely by shipping the server's result to the client.

## In Nuxt 4, how do you check whether code is running on the server?

`import.meta.server`, with `import.meta.client` for the browser

These replaced the older `process.server` and `process.client` flags.

## How do you trigger a 404 from a page, and where is it rendered?

`throw createError({ statusCode: 404 })`, rendered by `error.vue`

`error.vue` sits beside `app.vue` — in `app/` on Nuxt 4 — and replaces the whole page rather than rendering inside it, with `clearError` to recover.

## In Nuxt 4, where does application source code live by default?

In `app/` — `app/pages/`, `app/components/`, `app/layouts/` and so on

Nuxt 3 kept these at the project root; `server/`, `public/` and `nuxt.config.ts` stay at the root either way.
