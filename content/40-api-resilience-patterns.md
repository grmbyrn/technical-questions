---
slug: api-resilience-patterns
order: 40
number: '38'
group: ARCHITECTURE, INFRASTRUCTURE & DATA
title: API Resilience Patterns
status: questions-only
---

## What’s the difference between the token bucket and leaky bucket algorithms for rate limiting? (M)

### Which one allows a burst, and when is that desirable?

## What is an idempotency key, and why do payment APIs rely on them? (M)

### How long should the server remember one?

## What is a circuit breaker, and what problem does it solve? (M)

### What are the three states, and what moves it between them?

## What’s the difference between a timeout and a circuit breaker? (M)

## How should a client handle retries against a flaky downstream service? (M)

### Which requests are safe to retry automatically?

## Why does exponential backoff with jitter matter when retrying failed requests? (M)

### What is the thundering herd, and how does jitter break it up?

## How do you prevent a slow downstream service from cascading into an outage across your whole system? (H)

### What is a bulkhead, and how does it contain the blast radius?
