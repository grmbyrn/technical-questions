---
slug: auth-oauth-sessions-jwt
order: 30
number: '28'
group: BACKEND & DATA
title: Auth (OAuth / Sessions / JWT)
status: questions-only
---

## Can you walk through the OAuth 2.0 authorization code flow end to end? (H)

### What is the code exchanged for, and why is that step done server-side?

### What does the state parameter prevent?

## What happens, step by step, in a Sign in with GitHub round trip? (M)

## What are the tradeoffs between session-based auth and JWT? (M)

### How do you revoke a JWT before it expires?

### What does stateless really buy you, and what does it cost?

## How does session-based route protection work? (M)

## Where should you store a session or token, and what do httpOnly, SameSite and Secure do? (M)

## How does CSRF relate to cookie-based sessions? (M)

## What are refresh tokens, and why and how are they used? (M)

### What is refresh token rotation, and what attack does it detect?

## What’s the difference between authentication and authorisation? (E)

## How should passwords be stored, and which hashing algorithms are appropriate? (M)

### Why is bcrypt or argon2 preferable to SHA-256, and what does the work factor do?

## What is PKCE, and why do single-page and mobile apps need it? (M)

### What attack does it close?

## What’s the difference between SSO and OAuth, and where does SAML fit in? (M)

### Where does OpenID Connect sit relative to OAuth?

## How do magic links work, and what are their tradeoffs versus passwords? (M)
