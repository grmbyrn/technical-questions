---
slug: javascript-async-the-event-loop
order: 3
number: '4'
group: CORE JAVASCRIPT
title: JavaScript — Async & the Event Loop
status: questions-only
---

## What is the event loop, and what’s the difference between the call stack and the task queue? (H)

### Where does rendering fit into the loop?

### What happens to the UI if a task takes 500ms?

## What is the microtask queue, and how does it differ from the task queue? (M)

### Order the output of a snippet mixing setTimeout, Promise.then and synchronous logs.

### What happens if a microtask schedules another microtask, forever?

## What’s the difference between synchronous and asynchronous functions? (M)

## What is a callback function in the context of async operations? (E)

### What is callback hell, and what problems does it cause beyond readability?

## What are the different states of a Promise? (E)

### Can a settled promise change state?

## What are the pros and cons of Promises versus callbacks? (M)

## What’s the difference between Promise.all, Promise.allSettled and Promise.race? (M)

### What happens to the other promises when Promise.all rejects?

### When would you reach for Promise.any?

## How can you test asynchronous code? (E)

## What are debouncing and throttling, and how do they differ? (E)

### Which would you use for a search input, and which for a scroll handler?

### Write debounce from scratch, including a cancel method.

## How does garbage collection work in JavaScript? (H)

### What is mark-and-sweep, and why does reference counting struggle with cycles?

### What are the common sources of memory leaks in a browser app?

## What are Web Workers used for? (M)

### What can a worker not access, and how do you get data in and out of one?

## What are Proxies used for? (M)

### How do frameworks use Proxies for reactivity?

## What are JavaScript polyfills for? (M)

### What’s the difference between a polyfill and a transpiler?
