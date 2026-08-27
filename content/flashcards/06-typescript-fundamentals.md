---
title: TypeScript Fundamentals
order: 6
tags: [typescript-fundamentals]
---

## How does TypeScript relate to JavaScript?

It's a superset: every valid JavaScript program is valid TypeScript, plus types on top. Everything you learned in JavaScript Basics carries over unchanged. TypeScript adds a type layer, it doesn't replace the language.

## What happens to your type annotations when the compiled program actually runs?

They're erased during compilation, so the running code is plain JavaScript. Types exist at compile time only. tsc checks them, then strips them from the output.

## Given this code what happens?:

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

## A variable is declared like this, what is its type?:

```
ts
const answer: 42 = 42
```

---

The literal type 42: the only value it can ever hold is the number 42. A literal type is one exact value used as a type. Alone it's rigid; combined into unions it becomes a fixed menu.

## Which declaration types the name parameter as a string?

function greet(name: string) { ... }. Parameters take the same : type annotation as variables, inside the parentheses.

## Given this function, what does the final : number, after the parentheses, annotate?

```ts
function area(width: number, height: number): number {
  return width * height;
}
```

---

The type of the function's return value. After the parameter list comes the return type: takes two numbers, returns a number.

## A function is annotated with a : void return type. What does that mean?

It returns nothing, and its result isn't meant to be used. void marks the do-something functions, like loggers. Using their result is a compile error.

## Given this signature, what is the type of country inside the function body?

```ts
function locationLabel(city: string, country?: string): string;
```

---

string | undefined. ? means the caller can skip it, so inside the function it might be a string or undefined, a union to narrow.

## What does type Handler = (id: number) => boolean describe?

A function that takes a number and returns a boolean. A function type reads like an arrow function with the body swapped for the return type: number in, boolean out.

## Which annotation describes an object with a string name and a boolean inStock?

{ name: string; inStock: boolean }. An object type lists each property with its own : type, separated by semicolons (commas also work).

## What does this line create?

```ts
type Product = { name: string; price: number };
```

---

A reusable compile-time name for the shape, with no runtime value. Aliases exist only while the compiler checks. The compiled JavaScript never mentions Product.

## Inside your code, what is the type of user.email?

```ts
type User = { name: string; email?: string };
```

string | undefined. ? means the property might be absent, so reading it gives a union you have to narrow before use.

## A property is declared readonly id: number. What does that prevent, and when?

Assigning to id after the object is created, caught at compile time. readonly erases at runtime; it is the compiler that rejects any later obj.id = ... with TS2540.

## What does this annotation say about shelf?

```ts
const shelf: Book[] = [];
```

---

An array where every element is a Book. Book[] reads like string[]: a list whose elements all match the Book shape. On an empty array, the annotation is the only source of that information.
