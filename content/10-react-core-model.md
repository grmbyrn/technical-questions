---
slug: react-core-model
order: 10
number: '11'
group: FRAMEWORKS
title: React — Core Model
status: questions-only
---

## What is React, and what are its benefits? (M)

## What’s the difference between a React Node, a React Element and a Component? (M)

## What is JSX, and how does it work? (M)

### What does JSX compile down to?

### Why did the transform change in React 17?

## What’s the difference between state and props? (E)

## Explain one-way data flow and its benefits. (M)

## What is the virtual DOM, how does it work, and what are its benefits and downsides? (M)

### Is the virtual DOM faster than direct DOM manipulation? Defend your answer.

## What is reconciliation? (M)

### What are the two assumptions the diffing heuristic relies on?

## Why does the diffing algorithm assume different element types produce different trees? (M)

## What is React Fiber, and how is it an improvement over the previous approach? (H)

### What does interruptible rendering enable that a synchronous stack reconciler could not?

## What is the purpose of the key prop, and what are the consequences of using array indices as keys? (M)

### Show a concrete bug caused by index keys.

### When are index keys actually fine?

## What does re-rendering mean, and what causes a component to re-render? (H)

### Does a parent re-render always re-render its children?

### Why does passing an inline object or arrow function defeat React.memo?

## Why does React recommend against mutating state? (H)

### What comparison does React actually perform, and why does mutation defeat it?

## What’s the difference between controlled and uncontrolled components? (M)

### When is uncontrolled the better choice?

## What are React Fragments for? (M)

## What is forwardRef() used for? (M)

### What changed about ref handling in React 19?

## What are React Portals used for? (M)

### Does an event fired inside a portal bubble to the React parent or the DOM parent?

## How do you reset a component’s state? (M)

### Why is changing the key often better than an effect that resets state?

## What are error boundaries for? (M)

### What kinds of errors do they not catch?

## What is React strict mode, and what are its benefits? (M)
