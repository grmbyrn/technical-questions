---
title: JavaScript Basics
order: 1
tags: [javascript-basics]
---

## What is the difference between `==` and `===`?

`===` compares type and value with no conversion. `==` runs the abstract
equality algorithm first, which coerces the operands — so `'1' == 1`,
`null == undefined` and `[] == false` are all true.

Use `===` everywhere. The one idiom worth keeping is `x == null`, which is true
for exactly `null` and `undefined` and nothing else.

## What does the event loop do with a promise callback vs. a `setTimeout` callback?

They go on different queues. Promise callbacks are microtasks; `setTimeout` is
a macrotask. After the current synchronous code finishes, the engine drains the
_entire_ microtask queue before taking a single macrotask — so a `.then()`
scheduled after a `setTimeout(fn, 0)` still runs first.

```js
setTimeout(() => console.log("timeout"));
Promise.resolve().then(() => console.log("promise"));
console.log("sync");
// sync, promise, timeout
```

## What is a closure?

A function together with the scope it was created in. The inner function keeps
a live reference to the outer variables — not a copy — so it can read and write
them long after the outer call has returned.

That is what makes module-private state, `useState`-style hooks and
once-only initialisers possible without a class.

## What is JavaScript primarily used for?

Adding logic and behavior to web pages. JavaScript is the programming language
that powers interactivity and computation on the web.

## What does `console.log` do?

Prints whatever value you give it to the console. `console.log` is how you tell
JavaScript to show you a value — your main tool for seeing what your code is
doing.

## What is an expression?

Anything that produces a value. An expression is anything JavaScript can
evaluate down to a value: a literal like `5`, a math operation like `2 + 3`, or
a variable name once we get to those.

## What does this print to the console?

```js
console.log(10 / 2);
```

---

`5`. JavaScript evaluates `10 / 2` to `5`, then `console.log` prints the result.

## Which of the following are valid comments in JavaScript?

1. `/* a block comment */`
2. `# a comment`
3. `// a single-line comment`
4. `<!-- a comment -->`

---

**1 and 3.** `/* ... */` is a multi-line (block) comment — it can span as many
lines as you want. `//` comments out the rest of the line. `#` is Python, and
`<!-- -->` is HTML.

## When should you reach for `let` instead of `const`?

When the value will need to change later. `let` allows reassignment, `const`
doesn't. Default to `const`; only use `let` when you actually need to reassign.

## Which of the following are primitive types in JavaScript? (Select all that apply.)

1. `null`
2. `string`
3. `number`
4. `list`
5. `boolean`

---

**All except 4.** There is no `list` type in JavaScript — arrays are objects.
`null` is one of the primitives (a deliberate "no value").

## What's the practical difference between `null` and `undefined`?

`null` is something you set on purpose; `undefined` is what JavaScript fills in
when no value was given.

`null` is your way of saying "I checked, and there's nothing here."
`undefined` is JavaScript's default for any variable that's been declared but
not assigned.

## What does `typeof null` return?

`"object"`. Yes, this is a long-standing JavaScript bug — `typeof null` returns
`"object"`, not `"null"`. The language designers never fixed it because too
much existing code depends on the current behavior.

## What does `"5" + 1` evaluate to, and what about `"5" - 1`?

`"51"` (a string) and `4` (a number).

`+` switches into string mode when either operand is a string, so `1` gets
converted to `"1"` and the two get glued together. `-` is only ever math, so
`"5"` gets converted to the number `5` and you get `4`.

## What does `10 % 3` evaluate to?

`1`. `%` is the remainder (or modulo) operator — it gives back what's left over
after dividing. 10 divided by 3 is 3 with 1 left over.

## Why does `volume || 100` return `100` when `volume` is `0`?

`||` returns the right side whenever the left side is falsy, and `0` is one of
the six falsy values: `false`, `0`, `""`, `null`, `undefined`, `NaN`.

Keep that in mind when `0` or `""` is a value you actually want to keep — `??`
is the operator that only falls back on `null` and `undefined`.

## What's the most idiomatic way to check "does `username` have a non-empty value"?

`if (username) { ... }` — the condition is checked for truthiness. An empty
string, `null`, or `undefined` all count as falsy, so only a non-empty string
passes through. This is the idiom you'll see most often for "does this value
exist?" checks.

## How many times does this loop run?

```js
for (let i = 0; i < 5; i++) {
  console.log(i);
}
```

---

**5 times** — `i` takes the values 0, 1, 2, 3, 4. It starts at 0, and the
condition `i < 5` keeps going as long as `i` is less than 5. Switching to
`i <= 5` would run six times.

## Which loop guarantees its body runs at least once, even if the condition is false from the start?

`do...while`. It checks the condition _after_ the body, so the body always runs
once before the condition has a chance to stop it.

Classic use: keep prompting the user for input until they give a valid one,
since you have to ask at least once.

## What's the difference between `break` and `continue`?

`break` exits the loop completely; `continue` skips the rest of this pass and
starts the next one.

`break` is the eject button: the loop is done, regardless of whether the
condition would have kept it going. `continue` is the skip button: the rest of
the current pass is abandoned, but the loop moves on to the next iteration.

## Why is this loop a bug?

```js
let i = 0;
while (i < 5) {
  console.log(i);
}
```

---

`i` is never updated inside the body, so the condition stays true forever and
the loop runs infinitely.

A `while` loop has no built-in update step — you have to change the counter
inside the body yourself. Without `i++`, `i < 5` is true forever and the loop
locks up.

## With two nested `for` loops walking arrays, the outer counter is `i`. The inner counter should be:

**A different name — conventionally `j`.** If the inner loop also uses `i`,
it'll overwrite the outer loop's counter on every pass and the outer condition
will misbehave.

The convention is `i` for outer, `j` for inner, `k` for a third level. The
names don't matter, they just have to be different.

## Which loop is the most idiomatic choice for printing each item here?

```js
const colors = ["red", "green", "blue"];
```

---

```js
for (const color of colors) {
  console.log(color);
}
```

`for...of` is the cleanest choice when you only need the item and not the
index — no counter to set up, no `colors[i]` to read inside the body. Reach for
`for...of` for the common case, and indexed `for` when you actually need `i`.

## What's the difference between a parameter and an argument?

Parameters are the names in the function declaration; arguments are the values
passed when the function is called.

In `function greet(name)`, `name` is the parameter (the slot in the
declaration). In `greet("Brad")`, `"Brad"` is the argument (the value going
into the slot). Most people use them interchangeably in casual speech; they're
not actually the same thing.

## What does this function return?

```js
function double(n) {
  console.log(n * 2);
}
```

---

`undefined` — it prints `n * 2` but never returns anything.

`console.log` prints to the console; it doesn't return a value out of the
function. Without a `return` statement the function silently returns
`undefined`. The fix is `return n * 2`.

## Convert this to an arrow function with an implicit return.

```js
function triple(n) {
  return n * 3;
}
```

---

```js
const triple = (n) => n * 3;
```

Arrow syntax plus an implicit return — no braces and no `return` keyword for a
single-expression body. The expression `n * 3` is both the body and the value
returned.

## What's the value of `count` after this loop?

```js
for (let count = 0; count < 5; count++) {
  // ...
}
console.log(count);
```

---

**`ReferenceError`** — `count` is block-scoped to the loop and isn't visible
outside it.

`let` and `const` are block-scoped, so a counter declared in the `for` header
only exists inside the loop. Declare `count` outside the loop if you need to
read it afterwards.

## What does this print?

```js
function collect(label, ...items) {
  console.log(`${label}: ${items.length}`);
}
collect("Cart", "apple", "banana", "cherry");
```

---

`Cart: 3`. `label` takes the first argument, and the rest parameter `...items`
collects the remaining three into an array, so `items.length` is 3.

The rest parameter is a real array, so every array method works on it.

## What does this print?

```js
const user = { name: "Brad" };
console.log(user.age);
```

---

`undefined`. Reading a missing key never throws; it returns `undefined`.

Convenient when you don't know what's on the object, but a real source of bugs
when you mistype a key — `user.naem` is also just `undefined`, no error.

## Will this throw?

```js
const user = { name: "Brad" };
user.name = "Sasha";
user.age = 38;
delete user.name;
```

---

**No.** `const` only protects the variable from being reassigned to a different
value. It does not make the object immutable.

`const user = ...` means `user` can never point at a different object. Adding,
updating and deleting properties on the existing object are all fine. The label
is locked; the contents aren't.

## What does this print?

```js
const user = {
  name: "Brad",
  address: { city: "Boston" },
};

const copy = { ...user };
copy.address.city = "New York";

console.log(user.address.city);
```

---

"New York" - spread is a SHALLOW copy. The top-level objects are separate, but the nested address is shared between them. { ...user } copies the top-level properties, but address is itself an object, and the reference to that nested object gets copied, not its contents. Both user.address and copy.address point to the same inner object, so changing it through one shows up through the other. The fix is to spread the nested object too: { ...user, address: { ...user.address, city: "New York" } }.

## What does this print?

```js
const user = {
  name: "Brad",
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
};

user.name = "Sasha";
user.greet();
```

---

Hi, I'm Sasha - this is the object the method was called on, and the method reads this.name fresh when it runs. this is bound at call time, not when the method was defined. By the time user.greet() runs, user.name has been reassigned to "Sasha", and this.name reads that current value.

## Which theme value ends up in settings?

```js
const defaults = { theme: "light", lang: "en" };
const overrides = { theme: "dark" };

const settings = { ...overrides, ...defaults };
```

---

"light" - defaults is spread LAST, so its theme overwrites the earlier one from overrides. In an object literal, later keys win over earlier ones. Here the order is ...overrides then ...defaults, so defaults.theme ("light") overwrites overrides.theme ("dark"). If you wanted overrides to win, the order would need to be { ...defaults, ...overrides }.

## What is hoisting, and how do `var`, `let` and `const` behave under it?

Declarations are processed before the code in a scope runs, but only `var` is initialised to `undefined`. Reading a `var` before its line gives `undefined`; reading a `let` or `const` before its line throws a ReferenceError, because it sits in the temporal dead zone from the top of the block until the declaration is reached.

## What is the difference between a function declaration and a function expression?

A declaration is hoisted whole, so you can call it before it appears in the file; an expression is only assigned when execution reaches that line. `function total() {}` can be called from above it. `const total = function () {}` cannot, because `total` is still in the temporal dead zone until that line runs.

## What does `this` refer to in a regular function versus an arrow function?

In a regular function `this` is decided by how the function is called; an arrow function has no `this` of its own and uses the one from the scope it was written in. That is why a regular callback inside a method loses `this` while an arrow function keeps it, and why arrow functions are the wrong choice for object methods that need `this` to be the object.

## What does this print, and why do the two arguments behave differently?

```js
function rename(person, label) {
  person.name = "changed";
  label = "changed";
}

const user = { name: "Ada" };
let title = "engineer";
rename(user, title);
console.log(user.name, title);
```

---

`changed engineer`. Arguments are always passed by value, but for an object that value is a reference, so `person` points at the same object and mutating it is visible outside. `label` holds a copy of the string, so reassigning it only changes the local copy.

## What is the difference between `for...in` and `for...of`?

`for...in` walks an object's keys; `for...of` walks the values of anything iterable, like an array or a string. On an array `for...in` hands you `"0"`, `"1"`, `"2"` as strings and also picks up inherited enumerable properties, which is why `for...of` is the right loop for array values.
