---
slug: javascript-modules-tooling
order: 5
number: "6"
group: CORE JAVASCRIPT
title: JavaScript — Modules & Tooling
status: answered
---

## What are the differences between CommonJS modules and ES modules? (H)

CommonJS is Node's original system: require is an ordinary function call that runs at runtime, so it can be conditional, inside a function, or built from a variable. It is synchronous, and module.exports is just an object you mutate.

ES modules are static. The imports and exports are declarations that have to sit at the top level, so the whole dependency graph is known before any code executes. Modules are loaded asynchronously, always run in strict mode, and support top-level await.

The subtler difference is live bindings. A CommonJS import gives you a copy of the value at the moment you required it, so if the exporting module later reassigns it you never see the change. An ES import is a live view of the exporting module's binding, so you do.

```
// CommonJS
const { readFile } = require('fs');
module.exports = { thing };

// ESM
import { readFile } from 'node:fs/promises';
export { thing };
```

In Node the practical friction is interop: .mjs and .cjs extensions or the type field in package.json, no \_\_dirname in ESM, and the dual package hazard where a dependency ends up loaded twice in both formats.

### Why can ES modules be tree-shaken when CommonJS generally cannot?

Because the structure is statically analysable. A bundler can read the import and export statements without executing anything, build the full graph, and prove that a particular export is never used — so it can be dropped.

With CommonJS, require is a function call whose argument might be computed and whose result might be reassigned or conditionally exported. The bundler cannot prove anything without running the code, so it has to keep it all.

Worth adding that tree-shaking also depends on side effects: if a module does something at import time, removing it would change behaviour. That is what the sideEffects field in package.json is for — it tells the bundler it is safe to drop unused modules entirely.

### What is the difference between a static import and a dynamic import()?

A static import is hoisted and resolved before the module runs, so it always happens and always at the top. import() is a function-like expression that returns a promise, can be called anywhere, and can take a computed path.

That is what makes code splitting possible — a bundler sees an import() and emits a separate chunk fetched on demand. It is the mechanism behind React.lazy and route-level splitting.

## What are the pros and cons of languages that compile to JavaScript? (M)

The upside is everything the host language gives you that JavaScript does not: static types in TypeScript, exhaustive pattern matching and no runtime exceptions in Elm, a different concurrency model. Types are the one that pays off at scale, because they turn a class of runtime bugs into build errors and make large refactors survivable.

The costs are a build step between you and the browser, debugging through source maps rather than the code you wrote, and dependence on the toolchain keeping up with the language. There is also a hiring and onboarding cost for anything outside the mainstream.

And you still have to understand the JavaScript underneath — when something behaves oddly at runtime, the compiled output is what is actually executing. TypeScript makes that especially clear, since its types are erased and guarantee nothing once the code is running.

## What tools and techniques do you use for debugging JavaScript? (M)

Breakpoints over logging, as a default. DevTools gives conditional breakpoints, logpoints that print without editing the source, and breakpoints on DOM mutation, network requests or specific exceptions — break on uncaught exceptions is the fastest way to find where something actually went wrong rather than where it surfaced.

Beyond that: the network tab for anything involving a request, the performance profiler for jank, heap snapshots for leaks, and the debugger statement when I want the code itself to trip. In Node, --inspect attaches the same DevTools.

And when I am genuinely lost, bisecting — git bisect, or commenting out half the code — beats staring at it. The goal is always to shrink the search space rather than to guess.

### How do you debug something that only reproduces in production?

First I try to remove the difference. Run a production build locally, since minification, tree-shaking, environment variables and disabled dev warnings all change behaviour. Race conditions in particular only appear with real network latency.

If I cannot reproduce it, I need better information from the wild: an error tracker like Sentry with source maps uploaded so the stack traces are readable, breadcrumbs showing what the user did beforehand, and session replay if the budget allows. Feature flags help too — being able to turn a suspect feature off for a subset of users is both a fix and a diagnostic.

### What do source maps give you, and why can they be a security concern?

They map the minified bundle back to the original files, so a stack trace points at your real line numbers and you can step through the source you actually wrote.

The concern is that serving them publicly effectively publishes your source code — anyone can open DevTools and read it, comments included. The usual approach is hidden source maps: generate them, upload them to the error tracker so traces stay readable, and do not deploy them to the CDN. Bear in mind the client-side code is shipped to the browser regardless, so this is about making it inconvenient, not about hiding secrets. Nothing sensitive should be in the bundle in the first place.

## What’s the difference between feature detection and feature inference? (M)

Feature detection tests directly for the thing you are about to use — is this property on window, does this method exist on the prototype. Feature inference tests for one thing and assumes another comes with it, which breaks as soon as a browser ships a partial implementation or the two features diverge.

The third option, sniffing the user agent string, is the least reliable of all: strings are spoofed, they change, and you end up maintaining a list of browsers instead of a list of capabilities. It is only defensible when you are working around a specific known bug in a specific browser, where there is nothing to detect.

```
if ('IntersectionObserver' in window) {}      // detection
if (document.getElementsByTagName) { /* ...and assume the rest */ }  // inference
if (/Chrome/.test(navigator.userAgent)) {}    // sniffing, last resort
```
