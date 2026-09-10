---
title: Next Fundamentals
order: 3
tags: [next-fundamentals]
---

## How do you create the /about page in the App Router?

Add an about folder inside app/ with a page.tsx file in it. A folder is the URL segment, and the page.tsx inside it is the page that renders there.

## Which file turns a folder into a visitable page?

page.tsx

## Where should a navigation bar that appears on every page go?

In the root layout, app/layout.tsx. The root layout wraps every page, so UI placed there (like a header and nav) shows on all pages.

## Why use Next's Link component instead of a plain `<a>` tag for internal links?

Link navigates without a full page reload, which is faster and smoother. Link does client-side navigation, keeps the shared layout in place, and preloads pages so they feel instant.

## What does a nested layout, like app/guides/layout.tsx, do?

It wraps only the pages inside that folder, nesting within the root layout. Layouts stack: a /guides page is wrapped by the guides layout, which is wrapped by the root layout.

## A nested layout receives content to display through which prop?

children, which it renders with {children}. Both root and nested layouts get the page (or deeper layout) as children and decide where to render it.

## What is Next.js?

A React framework that adds routing, server rendering, and data fetching on top of React. You still write React. Next.js provides the structure and features a real app needs around it.

## In the App Router, how do you create a new page?

By creating a folder with a page.tsx file inside the app/ directory. The folder sets the URL and the page.tsx renders the page for it. No router config needed.

## Which file provides the UI that renders at a URL?

page.tsx

## What is the root layout.tsx responsible for?

The shared shell that wraps every page, including the html and body tags. Anything you want on every page, like a nav bar, lives in the layout.

## By default, where does a Next.js page component run?

On the server, where it renders to HTML before reaching the browser. Components are Server Components by default. You opt specific pieces into the browser later.

## How do you make a route segment dynamic in the App Router?

Name the folder in square brackets, like [slug]. A bracketed folder matches any value in that position, and the name inside the brackets becomes the key you read back.

## Inside app/blog/[slug]/page.tsx, how do you read the slug from the URL?

Await the params prop the page receives, then read slug from it. params is passed to the page as a Promise. The component is async and does const { slug } = await params.

## Why is the dynamic page written as an async function?

Because params is a Promise, so you await it. In the current App Router, params (and searchParams) arrive as Promises so Next can stream them. Awaiting requires an async component.

## Your [slug] page does const post = posts.find((p) => p.slug === slug). Why add an if (!post) check before rendering?

find returns undefined when no post matches the slug, so reading the title off undefined would crash the page. A bracketed route matches any value, so someone can visit a slug that isn't in your data. find comes back undefined there, and a simple if (!post) lets you show a not-found message instead of crashing.

## Which statements about the list-to-detail pattern are true? Select all that apply.

(select multiple)

1. One [slug]/page.tsx serves every post, no per-post file needed

2. You must create a separate folder and page.tsx for each post by hand

3. The detail page uses the slug from params to find the matching post in the data

4. The post data lives in one place, and both the list and the detail page read from it

---

1, 3 and 4.

## In the App Router, what kind of component do you get by default?

A Server Component, it runs on the server and sends HTML

Every component is a Server Component until you opt into the browser with the use client directive.

## How do you turn a component into a Client Component?

Add the string 'use client' as the first line of the file

The directive goes at the very top, above the imports, and marks the file (and what it imports) as browser code.

## Which of these force a component to be a Client Component? Select all that apply.

(select multiple)

1. Attaching an onClick or onChange handler

2. Using useState or useEffect

3. Reading data from a local module and rendering it

4. Calling a hook like usePathname

---

**1, 2, 4**

## A Server Component renders a Client Component and passes it data. How does the data get across?

As props, the server passes data down to the client component

Props are the bridge: the server holds the data, the client island receives it and handles interaction.

## Why does the nav that highlights the current link have to be a Client Component?

It calls usePathname, a hook, and hooks only run in the browser

Reading the current URL with usePathname is client-side, so the component needs use client.

## Where does the fetch in an async Server Component run?

On the server, before the HTML is sent to the browser

Server Components run on the server, so the data is fetched there and the page arrives already filled in.

## How do you load data inside an async Server Component?

Make the component async and await fetch right in the function body

No useEffect, no useState. You await the data and return JSX that uses it.

## Why does an async Server Component not need a loading spinner for its first render?

The server waits for the data and sends HTML that already contains it

Because the await happens on the server before the response, the browser receives a finished page. Slow fetches are handled with loading UI, which is the next chapter.

## In Next.js, what is the default caching behavior of fetch?

Not cached: each request fetches fresh data unless you opt in

You opt into caching with cache: force-cache or next: revalidate. no-store keeps it always fresh.

## The server characters page fetches the characters and renders CharacterFilter, a Client Component, passing characters to it. How does CharacterFilter receive the data?

As props: the server fetches the data and passes it down

Server fetches, client interacts. The page does the fetch and hands the result to the client island as a prop.

## Which special file does Next show while a page's data is still loading?

loading.tsx

Next wraps the page in a Suspense boundary and streams loading.tsx until the data is ready.

## What must be at the very top of an error.tsx file?

The use client directive

An error boundary runs in the browser to catch the error and offer a retry, so error.tsx must be a Client Component.

## An error.tsx component receives error and reset props. What is reset for?

Retrying the failed render without reloading the whole page

Calling reset() re-renders the page, so a Try again button can recover from a transient failure.

## How do you tell Next to show the nearest not-found.tsx for a missing item?

Call notFound() from next/navigation

notFound() stops rendering the page and shows the nearest not-found.tsx.

## You place a loading.tsx in app/books. Which pages does it cover?

/books and the pages nested under it, like /books/[id], until a deeper folder provides its own

A special file applies to its own segment and everything below it, unless a closer one overrides it.

## A page returns HTML for a person to look at. What does a route handler return?

Data, usually JSON, for other code to read

Route handlers are how you serve data instead of a screen - your own client components, scripts, or other apps fetch them.

## Which file turns a folder under app/ into an API endpoint?

route.ts

A route.ts at app/api/snippets answers /api/snippets. The folders are the URL.

## Inside a POST handler, how do you read the JSON the client sent?

await request.json()

The body arrives as a stream; request.json() parses it, and it is async so you await it.

## Your POST created a record successfully. Which status code should you send back?

201

201 Created is the conventional status for a request that made a new resource.

## A request comes in as /api/snippets?q=clamp. How do you read the q value?

new URL(request.url).searchParams.get('q')

Build a URL from request.url and read its searchParams; .get returns the value or null.

## Stash's search box is a Client Component. Why does it fetch /api/snippets instead of importing the snippets module directly?

It runs in the browser, which cannot import a server-side module - but it can fetch a URL

That is the whole reason the endpoint exists: it bridges server data to code running in the browser.
