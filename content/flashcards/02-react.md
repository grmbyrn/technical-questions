---
title: React
order: 2
tags: [react]
---

## Why can't hooks be called conditionally? [hooks]

React associates a hook call with its stored state by _call order_, not by
name. Each fiber holds a linked list of hook objects and a cursor that advances
one node per call.

Skip a call on a later render and every hook after it shifts by one, so a
`useState` reads another hook's slot. React catches the common shape of this
("Rendered fewer hooks than expected") but the aligned case is a silent
wrong-value bug.

## What does the dependency array of `useEffect` actually control? [hooks]

Whether the effect re-runs after a render. React compares each entry to the
previous render's with `Object.is`; if all match, it skips both the cleanup and
the effect.

`[]` means "after mount only". Omitting the array means "after every render".
The array is not a list of things the effect is _allowed_ to read — reading a
value you left out gives you a stale one.

## What is reconciliation? [rendering]

The diff React runs between the previous element tree and the one your render
returned, to decide the smallest set of DOM operations.

It assumes two things: elements of different types produce different trees (so
a changed type unmounts the subtree), and children with stable `key`s can be
matched across renders. Using an array index as a key breaks the second
assumption the moment the list reorders.
