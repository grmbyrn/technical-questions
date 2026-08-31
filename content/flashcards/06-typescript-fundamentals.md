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

## ref is typed string | number. Why does ref.toUpperCase() fail to compile?

On a union, only operations legal for every member are allowed, and numbers have no .toUpperCase(). Until you narrow, ref might be either member, so TypeScript only permits what's safe for both.

## What does TypeScript know inside the else branch?

```ts
function label(id: string | number): void {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
  } else {
    // here
  }
}
```

---

id is number, the only member left after the string check. Narrowing works branch by branch: ruling out string leaves number, no annotation needed.

## A lookup function returns string | null. What does strict TypeScript require before you call a string method on the result?

A check that rules out null, like if (result !== null). That's error TS18047 doing its job: handle the miss before using the value, and the crash can't ship.

## Inside the "delayed" case, why can the code read t.newTime?

```ts
type OnTime = { kind: "on-time" };
type Delayed = { kind: "delayed"; newTime: string };
type Status = OnTime | Delayed;

function report(t: Status): void {
  switch (t.kind) {
    case "delayed":
      console.log(t.newTime);
      break;
  }
}
```

---

Matching the literal kind narrows t to Delayed, the one member with that kind. That's a discriminated union: the shared literal property tells the compiler which type each case holds.

## What actually separates unknown from any?

Both accept any value, but unknown blocks every use until you narrow it, while any turns checking off. unknown means "check me before use", so mistakes surface at compile time instead of crashing at runtime.

## Which of these declares an interface correctly?

1. type Recipe { servings: number }

2. interface Recipe: servings number

3. interface Recipe { servings: number }

4. interface Recipe = { servings: number }

---

**3.** An interface has no = sign: the body follows the name directly.

## Manager is declared like this. Which members does a Manager value need?

```ts
interface Employee {
  name: string;
  department: string;
}

interface Manager extends Employee {
  teamSize: number;
}
```

---

All three: name, department, and teamSize. extends brings every Employee member into Manager, and Manager adds its own on top.

## You need to name the type "small" | "medium" | "large". Which construct can do it, and why?

A type alias; an interface body describes an object's members, and a union isn't an object. Unions, primitives, and function types are alias-only. There's no way to say "one of" in an interface body.

## For a plain object shape, what's the real difference between naming it with interface and with type?

None in how it checks; pick one and stay consistent. Same checking, same errors. The differences show up elsewhere: only aliases name unions, only interfaces extend.

## Does the last line compile?

```ts
interface Employee {
  name: string;
}

interface Manager extends Employee {
  teamSize: number;
}

function greet(person: Employee): void {
  console.log("Hi " + person.name);
}

const boss: Manager = { name: "Ida", teamSize: 4 };
greet(boss);
```

---

Yes; a Manager has everything an Employee has, so it fits wherever an Employee is expected. TypeScript checks the shape, not the label. boss has a name, and that's all greet asked for.

## What does [string, number] say that string[] and (string | number)[] can't?

Exactly two elements, a string at position 0 and a number at position 1. A tuple types each position and fixes the length. The array types allow any length, and the union version allows either type anywhere.

## What is the type of entry[1], and what happens on the last line?

```ts
const entry: [string, number] = ["Trailhead", 0];
console.log(entry[1]);
console.log(entry[2]);
```

---

entry[1] is a number; entry[2] is a compile error, the tuple has no index 2. Positions come from the annotation: index 1 is number, and TS2493 rejects an index the tuple's length doesn't have.

## After compilation, what remains of an enum in the output JavaScript?

A real JavaScript object holding the members; enums are the exception to type erasure. Every other construct in this course is erased. The enum is emitted as an object, which is why its members have values at runtime.

## Medal is a string enum. Which assignment compiles?

```ts
enum Medal {
  Gold = "gold",
  Silver = "silver",
}
```

---

const won: Medal = Medal.Gold. An enum type accepts its own members only, reached through the enum's name with a dot.

## Your own code passes around a small fixed set of values, and you want the lighter construct. Which one, and why?

1. An enum; unions can't be reused across a file

2. A literal union; it's erased at compile time and a matching string satisfies it directly

3. Neither works without the other

4. An enum; unions stop checking values at compile time

---

**2.** A literal union; it's erased at compile time and a matching string satisfies it directly. The union adds nothing to the running program and needs no ceremony at assignment. That's why newer codebases mostly reach for it first.

## In function `firstItem<T>(items: T[]): T`, what is `T`?

A type parameter: a placeholder type, filled in fresh at every call. Each call fills the slot with its own type, so one function serves every element type without losing checking.

## What is the type of result, and who decided?

```ts
function firstItem<T>(items: T[]): T {
  return items[0];
}

const primes = [2, 3, 5, 7];
const result = firstItem(primes);
```

---

number; TypeScript inferred it from the argument. The argument is a number[], so T is number for this call, and the return type follows. No type argument written by hand.

## What does the constraint in `function heaviest<T extends { weightKg: number }>(boxes: T[]): T` change?

The body may read weightKg, and only types that have it can be passed in; T still comes out as the caller's full type. The constraint is the entry requirement. It unlocks the member inside AND blocks bad call sites, without giving up what-goes-in-is-what-comes-out.

## Speaker has name, topic, email, and city. You need a type with ONLY name and topic. Which derives it?

1. `Omit<Speaker, "name" | "topic">`

2. `Partial<Speaker>`

3. `Speaker<"name" | "topic">`

4. `Pick<Speaker, "name" | "topic">`

---

`Pick<Speaker, "name" | "topic">`

Pick keeps exactly the members you name, written as a union of quoted names. Deriving beats re-typing a copy that will drift.

## What does Partial`<Options>` produce, and what is it typically for?

The same members with each made optional; the natural type for update-style functions. An update is "some of the shape." Partial derives exactly that, and it stays in sync when Options changes.

## What does a type assertion like `value as User` actually do?

It tells the compiler to treat the value as that type, and checks nothing at runtime. Assertions are erased along with every other annotation, so if the value is not really a `User` there is no error at the assertion and a crash later, when you read a property that was never there. Narrowing with a real check is safer wherever it is possible.

## What is the `never` type, and where does it turn up?

The type of a value that can never exist. It is the return type of a function that always throws or never finishes, it is what a union collapses to once every member has been ruled out, and it is the trick behind exhaustiveness checks: assign the value to a `never` in the default case and the compiler errors the day someone adds a new member to the union.

## TypeScript is structurally typed. What does that mean?

Two types are compatible when their shapes match, regardless of their names or where they were declared. An object literal with the right properties satisfies an interface it has never heard of, which is why you rarely have to declare that something implements a type — having the members is enough.

## What is a type predicate like `function isCat(pet: Pet): pet is Cat` for?

It teaches the compiler that a `true` return from your own function means the argument is that narrower type. Without the `pet is Cat` return type the function is just a boolean check and nothing narrows inside the `if`; with it, TypeScript treats the value as a `Cat` in the true branch.

## What does `as const` do?

It infers the narrowest possible types instead of widening them, and makes the result deeply readonly. `const sizes = ["s", "m"]` infers `string[]`, while `const sizes = ["s", "m"] as const` infers `readonly ["s", "m"]`, so the values can be used as a literal union rather than as plain strings.
