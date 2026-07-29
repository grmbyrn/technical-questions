---
slug: react-hooks
order: 10
number: 10b
group: FRAMEWORKS
title: React — Hooks
status: questions-only
---

## What are the benefits of hooks, and what are the rules of hooks? (M)

## Why can you not call hooks conditionally — what actually breaks internally? (H)

### How does React associate a hook call with its stored state?

## What happens when the useState setter is called, and why is it described as asynchronous? (M)

### Why does logging state immediately after setting it show the old value?

## What is the purpose of the updater (callback) form of a state setter? (M)

### Show a bug that only the updater form fixes.

## What does the useEffect dependency array control? (M)

### What happens with an empty array, and with no array at all?

### Why does an object or function in the deps cause an infinite loop?

## What’s the difference between useEffect and useLayoutEffect? (M)

### When is useLayoutEffect genuinely necessary, and what does it cost?

## When should logic go in useEffect versus an event handler? (M)

### Give an example of an effect that should not have been an effect.

## Why does my effect run twice in development, and is that a bug? (M)

### What is StrictMode trying to surface by doing this?

## How would you handle a race condition in an async effect? (H)

### Write the cleanup for it. Would AbortController or an ignore flag be better here?

## How do you prevent stale closures in hooks? (H)

### Why does a setInterval inside an effect often log stale state?

## When should you use useRef? (M)

### What are the two distinct uses, and why does changing a ref not re-render?

## When should you use useCallback, and when useMemo? (M)

### When is memoising actively harmful?

## What’s the difference between useMemo and React.memo? (M)

## When should you use useReducer instead of useState? (M)

## When should you use useId? (M)

## What problems do useTransition and useDeferredValue solve? (H)

### What is the difference between the two, and when do you pick each?

## How does automatic batching work in React 18? (H)

### What was not batched before 18?

## Implement a custom hook: useDebounce, usePrevious, or useFetch with cleanup. (M)

### How do you cancel the in-flight request when the component unmounts?
