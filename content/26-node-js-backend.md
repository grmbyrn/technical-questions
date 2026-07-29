---
slug: node-js-backend
order: 26
number: '24'
group: BACKEND & DATA
title: Node.js / Backend
status: questions-only
---

## How does the Node.js event loop work, and what are its phases? (H)

### Where do I/O callbacks, timers and close handlers each run?

### How does it differ from the browser event loop?

## What’s the difference between process.nextTick, setImmediate and setTimeout(fn, 0)? (H)

### Which runs first inside an I/O callback, and why is the answer different at the top level?

## How does Node handle concurrency if it is single-threaded? (M)

### What is the thread pool actually used for?

## How do you handle CPU-intensive tasks without blocking the event loop? (M)

## What’s the difference between Cluster and Worker Threads? (M)

### Which shares memory, and when does that matter?

## What is backpressure in streams, and what are the four stream types? (H)

### What happens if a fast producer outpaces a slow consumer?

## What’s the difference between pipe() and pipeline()? (M)

### What does pipe leak on error?

## How do you prevent memory leaks in Node? (H)

### What are the usual culprits, and how would you find one in production?

## What’s the difference between operational and programmer errors? (M)

### Should you ever keep the process alive after an uncaught exception?

## What are the differences between CommonJS and ES modules in Node? (M)

## How would you scale a Node application? (M)

## What is AsyncLocalStorage used for? (H)

### How does it let you carry a request ID through an async call chain?

## How do you implement graceful shutdown on SIGTERM? (M)

### What has to happen in order, and what is the failure mode if you skip it?

## What’s the difference between Express and Fastify? (M)
