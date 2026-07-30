---
slug: caching-redis
order: 35
number: '33'
group: ARCHITECTURE, INFRASTRUCTURE & DATA
title: Caching & Redis
status: questions-only
---

## What’s the difference between cache-aside, write-through and write-behind caching? (M)

### Which one risks losing writes, and which adds latency to every write?

## How do you decide what to cache, and for how long? (M)

## What cache eviction policies exist, and when would you pick one over another? (M)

## Why is cache invalidation considered hard, and how do you approach it in practice? (M)

## How would you keep a cache consistent when the underlying database changes underneath it? (H)

### Would you invalidate or update on write, and why?

## What data structures does Redis support, and what is a real use case for each? (M)

### How would you build a leaderboard, a rate limiter and a session store in Redis?

## How does Redis pub/sub differ from a proper message queue? (M)

### What happens to a message if no subscriber is listening?

## What’s the difference between caching at the CDN layer and caching inside your own application? (M)

## When would you reach for Redis instead of an in-memory cache inside your Node process? (M)

## What is a cache stampede, and how would you prevent one? (H)

### How do a lock, a stale-while-revalidate window and jittered TTLs each help?
