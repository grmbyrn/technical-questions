---
title: JavaScript Intermediate
order: 5
tags: [javascript-intermediate]
---

## What does array.map(...) give you back?

A brand new array, with the callback's result for every item. Right. map runs your function once per item and collects the returned values into a new array. The original is left unchanged.

## The function you pass to filter should return what?

A boolean: true to keep the item, false to drop it. filter calls your function on each item and keeps the items where it returned true. The result is a new array of just those items.

## What is the difference between find and filter?

find returns the first matching item (or undefined); filter returns an array of all matches. Reach for find when you want one item, and filter when you want every match. find also stops at the first hit.

## When is anyOpen true? anyOpen is set like this:

```js
const anyOpen = tickets.some((t) => t.resolved === false);
```

---

When at least one ticket is not resolved. some returns true as soon as one item passes the test. It only returns false when none of them do.

## What does this print?

```js
const nums = [3, 8, 12, 20];
const out = nums.filter((n) => n >= 10).map((n) => n / 2);
console.log(out);
```

---

[ 6, 10 ]. Read it left to right. filter keeps 12 and 20, then map halves each of those to 6 and 10. The 3 and 8 were dropped before map ever saw them.

## What does array.reduce(...) give you back?

A single value, built up from every item in the array. reduce walks the array and folds every item into one running result, like a total, a max, or a combined object.

## What does this return?

```js
[10, 2, 1].sort();
```

---

[ 1, 10, 2 ], because sort compares items as text by default. With no comparator, sort turns items into strings, and the string 10 sorts before the string 2. The fix is a comparator: (a, b) => a - b.

## Given this object, what does const { city } = user give you?

```js
const user = { name: "Ada", city: "Lisbon" };
```

---

The value "Lisbon", matched by the key name city. Object destructuring matches by key name, so { city } reaches into user and pulls out the value stored under city.

## Each user is an object with a name field. What does this produce?

```js
users.map(({ name }) => name);
```

---

An array of just the name values. Destructuring in the parameter pulls name out of each user, so map collects those values into a plain array of names.

## What is the result here?

```js
const base = { theme: "dark", fontSize: 14 };
const next = { ...base, fontSize: 16 };
```

---

A new object { theme: "dark", fontSize: 16 }. Spread copies base in, then the later fontSize: 16 wins because the last value for a key is the one that sticks.

## What order does this print?

```js
console.log("a");
setTimeout(() => console.log("b"), 0);
console.log("c");
```

---

a, c, b. The setTimeout callback runs after the synchronous code, even with a 0 delay. JavaScript runs all the synchronous lines first (a and c), then comes back to the scheduled callback (b). A 0 delay still means after, not now.

## A promise fulfills with a value. Which handler receives that value, and how do you handle a rejection?

.then receives the resolved value on success, and .catch receives the error on failure. .then runs with the value when the promise fulfills, and .catch runs with the error when it rejects.

## What does await do here?

```js
const order = await getOrder();
```

---

Pauses the async function until the promise resolves, then gives you the resolved value. await waits for getOrder()'s promise to settle and hands you the value directly, so order is the resolved object, not a promise.

## An awaited promise rejects inside a try block. What happens?

Control jumps to the catch block to handle the error, and the program keeps running. A rejected await throws, the rest of the try block is skipped, and catch handles it so the program does not crash.

## Why use Promise.all([loadA(), loadB()]) instead of awaiting each one on its own line?

It runs both at the same time and waits for both, instead of one after the other. Promise.all starts every promise at once and resolves when all are done, so you wait for the slower one, not the sum of both.

## Why does reading data from fetch take two awaits, like const res = await fetch(url) then const data = await res.json()?

The first await waits for the response to arrive; the second waits for its body to finish parsing into an object. fetch resolves once the response arrives, but the body is still raw. response.json() reads and parses it, and that is also async, so it gets its own await.

## What value does count ?? 0 produce when count is the number 0?

0, because ?? only falls back on null or undefined, and 0 is a real value. ?? treats 0 and the empty string as genuine data and passes them through. It only supplies the fallback for null or undefined.

## You fetch a URL and the server responds with a 404. Does fetch reject and send you to catch?

No. fetch only rejects on a network failure, so you must check response.ok yourself and throw on a bad status. A 404 is still a completed response, so fetch resolves. You check response.ok and throw, which then lands in your catch.

## An endpoint returns an array of 100 posts, which you parse into a variable called posts. How do you get just the posts whose userId is 1?

It is a normal array, so use the methods you already know: posts.filter((post) => post.userId === 1). Once parsed, fetched data is just arrays and objects, so map, filter, and find all work on it directly.

## A user object has no company field. What does user.company?.name evaluate to?

undefined, because optional chaining short-circuits when company is missing instead of throwing. When the value before ?. is null or undefined, the whole expression stops and returns undefined rather than crashing.
