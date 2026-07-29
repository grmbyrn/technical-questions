---
slug: system-design
order: 35
number: '33'
group: ARCHITECTURE, INFRASTRUCTURE & DATA
title: System Design
status: questions-only
---

## How would you design a URL shortener, and what are its key components? (H)

### How do you generate the short code, and how do you avoid collisions?

### How would you handle analytics on redirects without slowing them down?

## How would you design a basic rate limiter for an API? (H)

### Where does the counter live once you have more than one server?

## Can you walk me through designing the backend for a social media feed? (H)

### Fan-out on write or fan-out on read? What changes for a celebrity account?

## How would you design a chat application supporting real-time messaging at scale? (H)

### How do you route a message to the right server when the recipient is connected elsewhere?

## How would you design an autocomplete or typeahead search feature? (H)

### Where does the debouncing happen, and what does the server-side index look like?

## How would you estimate the storage and traffic requirements for a new feature? (H)

## What is the CAP theorem, and what does it actually mean to give up consistency versus availability? (H)

### What does a partition look like in practice, and what does your system do during one?

## What’s the difference between horizontal and vertical scaling, and what are the tradeoffs? (M)

## How does a load balancer decide which server to send a request to? (M)

### What breaks if a user’s session lives in one server’s memory?

## How do leader-follower (primary-replica) setups help you scale reads? (M)

## What single points of failure would you look for when reviewing a system’s architecture? (M)

## What’s the difference between a monolith and a distributed system in terms of how they fail? (M)
