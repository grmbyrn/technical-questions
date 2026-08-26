---
title: TypeScript Fundamentals
order: 6
tags: [typescript-fundamentals]
---

## How does TypeScript relate to JavaScript?

It's a superset: every valid JavaScript program is valid TypeScript, plus types on top. Everything you learned in JavaScript Basics carries over unchanged. TypeScript adds a type layer, it doesn't replace the language.

## What happens to your type annotations when the compiled program actually runs?

They're erased during compilation, so the running code is plain JavaScript. Types exist at compile time only. tsc checks them, then strips them from the output.

## Given this code what happens?:

```ts
let count = 10;
count = "ten";
```

---

A compiler error: count was inferred as a number, so a string can't be assigned to it. Inference locked count to number from its initial value. An inferred type is enforced exactly like a written one.

## The compiler says: Type 'string' is not assignable to type 'number'. What does that mean?

You gave a string value to something that was declared to hold a number. Read it as: the value's type is string, the declared type is number, and they disagree.

## A teammate annotates a variable with any and the file compiles. What did the annotation actually do?

It turned type checking off for that variable, so mistakes with it surface at runtime instead. any means "stop checking," not "any type, checked." Every bug the compiler would catch now waits for runtime.

## Given this code what does the compiler say?

```ts
let level: "low" | "medium" | "high" = "low";
level = "medium";
level = "extreme";
```

The reassignment to "medium" is fine; the reassignment to "extreme" is an error. A union accepts exactly its members. "medium" is on the menu, "extreme" isn't.

## What does type Speed = "slow" | "fast" create?

A reusable name for the union, usable in annotations like let pace: Speed. An alias names a type. Anywhere you'd write the union out, the name now works, and it's one place to update.

## A variable is declared like this, what is its type?:

```
ts
const answer: 42 = 42
```

---

The literal type 42: the only value it can ever hold is the number 42. A literal type is one exact value used as a type. Alone it's rigid; combined into unions it becomes a fixed menu.
