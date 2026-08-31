---
slug: debounce
title: Implement debounce
source: Frontend interview classic
difficulty: medium
tags: [functions, closures, timers]
completed: 2026-08-31
---

## Problem

Write `debounce(fn, wait)`, which returns a function that delays calling `fn`
until `wait` milliseconds have passed without another call. Calling it again
during the wait restarts the timer.

## Solution

```js
function debounce(fn, wait) {
  let timer;

  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
```

## Notes

The whole thing rests on the closure: `timer` lives between calls because the
returned function keeps a reference to the scope it was created in.

Two details an interviewer usually pushes on. `fn.apply(this, args)` rather
than `fn(...args)`, so the debounced function still works as a method and
`this` survives — which is also why the returned function is a regular
function and not an arrow. And `clearTimeout(undefined)` is a no-op, so the
first call needs no special case.

The follow-up is usually "now add a `cancel`", which is a one-liner on the
returned function:

```js
debounced.cancel = () => clearTimeout(timer);
```
