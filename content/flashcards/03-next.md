---
title: Next Fundamentals
order: 2
tags: [next-fundamentals]
---

## How do you create the /about page in the App Router?

Add an about folder inside app/ with a page.tsx file in it. A folder is the URL segment, and the page.tsx inside it is the page that renders there.

## Which file turns a folder into a visitable page?

page.tsx

## Where should a navigation bar that appears on every page go?

In the root layout, app/layout.tsx. The root layout wraps every page, so UI placed there (like a header and nav) shows on all pages.

## Why use Next's Link component instead of a plain <a> tag for internal links?

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

## What is the root layout.tsx responsible for?

The shared shell that wraps every page, including the html and body tags. Anything you want on every page, like a nav bar, lives in the layout.

## By default, where does a Next.js page component run?

On the server, where it renders to HTML before reaching the browser. Components are Server Components by default. You opt specific pieces into the browser later.
