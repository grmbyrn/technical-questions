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
