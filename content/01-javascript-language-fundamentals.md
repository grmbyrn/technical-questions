---
slug: javascript-language-fundamentals
order: 1
number: '2'
group: CORE JAVASCRIPT
title: JavaScript — Language Fundamentals
status: answered
---

## What’s the difference between == and ===? (E)

=== is strict equality: it compares type and value with no conversion, so if the types differ the answer is false. == is loose equality: it converts the operands to a common type first and then compares.

In practice I use === everywhere. The one exception I deliberately make is x == null, which is a concise way of catching both null and undefined at once. Everything else is clearer written explicitly.

The rules worth knowing are that null and undefined are loosely equal to each other and to nothing else, NaN is not equal to anything including itself, and objects are compared by reference under both operators — two identical-looking objects are never equal.

```
1 == '1'      // true
1 === '1'     // false
null == undefined   // true
null == 0     // false
NaN === NaN   // false
```

### What does == do when comparing null and undefined?

They are loosely equal to each other, and that is the whole rule — null and undefined are not loosely equal to 0, to an empty string, or to false. The spec special-cases them rather than converting them to numbers.

That is exactly why x == null is a useful idiom: it means is this nullish, and nothing else slips through it.

### Is there ever a case where you would deliberately use ==?

Only the null check. Some codebases ban it entirely and use x === null || x === undefined, or the ?? operator, which is fine too. Outside of that I would treat a == in a code review as a mistake until proven otherwise.

## What’s the difference between a variable that is null, undefined, or undeclared, and how do you check for each? (E)

undefined means the variable exists but has no value — that is what you get from a declared-but-unassigned variable, a missing function argument, a property that is not there, or a function with no return. null is an assigned value that means deliberately empty; the engine never produces it on its own, a developer does.

Undeclared means the identifier was never declared at all. Reading it throws a ReferenceError.

For checking: x === undefined or x === null when I know the variable exists, x == null when I want either, and typeof x === 'undefined' when the variable might not be declared at all, because typeof is the one operator that does not throw on an unknown identifier.

```
let a;
a === undefined        // true
typeof notDeclared     // 'undefined', no throw
notDeclared            // ReferenceError
```

### Why does typeof null return object?

It is a bug from the very first implementation of JavaScript. Values were stored with a type tag in the low bits, and the tag for objects was 000. null was represented as the null pointer, all zeros, so it read as an object.

It was proposed as a fix and rejected because too much code depends on it. So it stays, and you check for null with x === null.

### Why is typeof safe on an undeclared variable when a direct reference throws?

It is specified that way — typeof was deliberately given an escape hatch so feature detection could work before a global existed. It returns the string 'undefined' rather than evaluating the reference.

Worth adding that this does not save you inside the temporal dead zone: typeof on a let or const before its declaration still throws.

## What are the various data types in JavaScript? (E)

There are seven primitives — string, number, boolean, null, undefined, symbol and bigint — and then object, which covers everything else: plain objects, arrays, functions, dates, maps, sets, regexes.

The distinction that actually matters is that primitives are immutable and copied by value, while objects are handled by reference.

### Where do Symbol and BigInt fit in, and what are they for?

A symbol is a guaranteed-unique value, mainly used as a property key that cannot collide with anything else. The well-known symbols are the interesting part — implementing Symbol.iterator is what makes your own object work with for...of and the spread operator.

BigInt exists because Number is a double and loses precision above 2 to the 53. BigInt handles arbitrarily large integers, with the catch that you cannot mix it with Number in arithmetic without converting explicitly.

## What’s the difference between primitive and non-primitive (reference) types? (E)

A variable holding a primitive holds the value itself. A variable holding an object holds a reference to it, so two variables can point at the same object and a change through one is visible through the other.

It also means equality behaves differently: two objects with identical contents are never === to each other, because you are comparing references, not contents.

### What happens when you pass an object into a function and reassign the parameter inside it?

The caller sees nothing. The parameter is a local copy of the reference, so reassigning it just points the local name at something else.

But if you mutate the object rather than reassigning the parameter, the caller does see it, because both names still point at the same object. JavaScript is pass-by-value where the value can itself be a reference — sometimes called pass by sharing.

```
function f(o) { o = { x: 2 }; }   // caller unaffected
function g(o) { o.x = 2; }        // caller sees x === 2
```

## What is type coercion? Walk through a tricky coercion example. (M)

Coercion is the implicit conversion the engine does when an operation gets a type it did not expect. The two rules that explain most of it: the + operator concatenates if either side ends up a string and otherwise adds as numbers, and every other arithmetic operator converts to number first.

Objects get converted through ToPrimitive, which tries valueOf and then toString. That is why an empty array becomes an empty string and a plain object becomes '[object Object]'.

```
1 + '2'        // '12'   (string wins for +)
1 - '2'        // -1     (- has no string mode)
[] + []        // ''
[] + {}        // '[object Object]'
[] == false    // true    (both convert to 0)
```

The one I usually offer is [] == false being true: the array becomes an empty string, the empty string becomes 0, false becomes 0, and 0 equals 0. Which is a good argument for using ===.

### Why does [] + {} differ from {} + []?

As expressions they do not — both produce '[object Object]'. The difference only shows up when {} appears at the start of a statement, which is where a browser console typically evaluates it. There it is parsed as an empty block, not an object, so what is left is +[], the unary plus on an empty array, which is 0.

So the classic gotcha is really a parsing quirk, not a coercion one. Wrapping it in parentheses makes both give the same answer.

### How does the + operator decide between concatenation and addition?

Both operands go through ToPrimitive first. If either result is a string, it concatenates. Otherwise it converts both to numbers and adds. That single rule accounts for most surprising + results.

## What’s the difference between mutable and immutable objects? (M)

An immutable value cannot be changed after it is created — every primitive is immutable, which is why string methods return new strings rather than editing in place. Objects and arrays are mutable by default.

It matters most for change detection and for shared references. React compares state by identity, so mutating an object in place gives you the same reference and no re-render. And a mutable object passed to several places can be changed under all of them at once, which is a hard class of bug to trace.

### How would you make an object immutable, and what are the limits of Object.freeze?

Object.freeze prevents adding, removing or changing properties — but only one level deep. Nested objects are still fully mutable, so you need a recursive deep freeze if you want real guarantees.

The other catch is that in sloppy mode a write to a frozen object fails silently; in strict mode, which includes all module code, it throws. For most application code the practical answer is convention plus a library like Immer rather than freezing everything.

## What’s the difference between a shallow copy and a deep copy, and how do you make each? (E)

A shallow copy duplicates the top level only — nested objects are still shared references. A deep copy recursively duplicates everything, so the two are fully independent.

For shallow: spread, Object.assign, Array slice, Array.from. For deep: structuredClone is now built in, or a library like lodash cloneDeep. JSON.parse(JSON.stringify(x)) still gets used but has real limitations.

```
const shallow = { ...obj };
const deep = structuredClone(obj);
```

### What does the spread operator actually copy?

Own enumerable properties, one level deep. It does not copy the prototype, it skips non-enumerable properties, and any nested object is copied by reference — so mutating a nested field still affects the original.

### What are the tradeoffs of structuredClone versus JSON round-tripping?

JSON silently loses things: undefined values, functions and symbols disappear, Dates come back as strings, Maps and Sets become empty objects, and a circular reference throws.

structuredClone handles Dates, Maps, Sets, typed arrays and circular references properly. It still cannot clone functions, DOM nodes or class instances with their prototypes intact. So structuredClone unless I need something it does not support.

## What’s the difference between dot notation and bracket notation for property access? (E)

Dot notation needs a fixed, valid identifier at author time. Bracket notation takes any expression, so you use it for dynamic keys, for keys that are not valid identifiers, and for symbol keys.

```
obj.userName        // fixed
obj[key]            // dynamic
obj['data-id']      // not a valid identifier
```

## How does destructuring assignment work for objects and arrays? (E)

It unpacks values into variables — arrays by position, objects by key name. It works in function parameters too, which is where it is most useful, and you can collect the remainder with rest syntax.

```
const [first, , third] = arr;
const { id, name: label = 'unnamed', ...rest } = obj;
function f({ url, retries = 3 }) {}
```

### How do you set a default, and when does the default actually apply?

With an = after the name. The important detail is that a default only applies when the value is undefined — not for null, not for 0, not for an empty string. So a null coming back from an API will not be replaced by your default.

### How do you destructure a nested property and rename it at the same time?

You nest the pattern and use a colon for renaming. Worth noting the colon means rename here, not type annotation, which trips people up coming from TypeScript.

```
const { user: { name: userName = 'anon' } } = data;
```

## How do ES6 template literals work? Give an example. (E)

Backticks instead of quotes, with ${} for interpolating any expression, and newlines are preserved without escaping. That is most of it.

```
const msg = `Hi ${user.name}, you have ${count} item${count === 1 ? '' : 's'}.`;
```

### What is a tagged template, and what would you use one for?

You put a function name in front of the literal, and it receives the static string parts as an array plus the interpolated values separately. That separation lets you process the values before they are inserted.

It is what powers styled-components, and it is the right tool for anything where interpolated values need escaping — safe HTML, or a SQL builder that parameterises the values instead of concatenating them.

## What does 'use strict' do, and what are its advantages and disadvantages? (M)

It opts a script or function into strict mode. Assigning to an undeclared variable throws instead of creating a global, this is undefined in a plain function call rather than the global object, duplicate parameter names and octal literals become syntax errors, and operations that used to fail silently — like writing to a frozen object — now throw.

The advantage is that a whole class of bugs becomes loud instead of silent, and it lets engines optimise more aggressively. The disadvantage is that it can break older code, and historically concatenating files could apply one file's strict directive to another that was not written for it.

In modern code you rarely type it, because ES modules and class bodies are strict automatically.

### Why are ES modules always in strict mode?

It was a clean break — modules were new syntax, so there was no legacy code to preserve compatibility with. The committee took the opportunity to make the safer behaviour the only behaviour.

## Is JavaScript statically or dynamically typed, and strongly or weakly typed? (M)

Dynamically typed and weakly typed. Dynamic means types belong to values rather than variables and are checked at runtime, so the same variable can hold a string and then a number. Weak means the engine will implicitly convert between types rather than refusing.

TypeScript adds a static layer on top, but it is entirely compile time — the types are erased in the output, so at runtime you are still running dynamically typed, weakly typed JavaScript. That is exactly why you still validate data at API boundaries.

## How do you iterate over object properties versus array items? (E)

For objects I use Object.keys, Object.values or Object.entries and then iterate that array — entries with destructuring is usually the most readable. For arrays, for...of when I want break or await, and map, filter or reduce when I am transforming.

```
for (const [key, value] of Object.entries(obj)) {}
for (const item of arr) {}
```

### What is the difference between for...in and for...of?

for...in enumerates enumerable string keys, including inherited ones from the prototype chain. for...of iterates the values of anything iterable, which it does by calling Symbol.iterator — so it works on arrays, strings, Maps, Sets and generators, but not on plain objects.

### Why is for...in risky on arrays?

It gives you keys as strings rather than numbers, it will pick up any extra properties added to the array or its prototype, and the order is not guaranteed the way array iteration order is. for...of or a normal loop avoids all three.

## What’s the difference between .forEach() and .map(), and when would you use each? (E)

map returns a new array containing whatever the callback returned, the same length as the original. forEach returns undefined and exists purely for side effects.

So the rule I use is: if I want a new array out, map; if I am doing something for each item and not building anything, forEach. Using map and throwing away the result is a smell, because it allocates an array nobody reads.

### Why can you not break out of a forEach, and what would you use instead?

Because the callback is a function — return exits that one call, not the loop, and there is no way to signal the iteration to stop. It also cannot await sensibly, since forEach ignores the returned promise.

If I need to stop early I use for...of with break, or some, every, find or findIndex, which short-circuit by design.

### What do reduce, filter, some and every add on top of these?

filter selects a subset, reduce folds a list down to a single value of any shape — a number, an object, a grouped map. some and every return booleans and stop as soon as the answer is known. reduce is the one to reach for carefully; if a plain loop reads better, use the loop.

## How would you make duplicate([1,2,3,4,5]) return [1,2,3,4,5,1,2,3,4,5]? (E)

Spread it twice, or concat it with itself. Both return a new array rather than mutating the input, which is what I would want.

```
const duplicate = arr => [...arr, ...arr];
// or
const duplicate = arr => arr.concat(arr);
```

## How would you write FizzBuzz for the numbers 1 to 100? (E)

Straightforward version first, and the thing to get right is checking 15 before 3 and 5.

```
for (let i = 1; i <= 100; i++) {
  let out = '';
  if (i % 3 === 0) out += 'Fizz';
  if (i % 5 === 0) out += 'Buzz';
  console.log(out || i);
}
```

Building the string up avoids the separate 15 case entirely, which is a small thing but interviewers usually notice it.

### How would you make it extensible so new rules can be added without touching the loop?

Move the rules into data and have the loop read them. Adding a new rule then means adding one entry, and the loop never changes — which is the open-closed principle in about six lines.

```
const rules = [[3, 'Fizz'], [5, 'Buzz'], [7, 'Bang']];

for (let i = 1; i <= 100; i++) {
  const out = rules
    .filter(([n]) => i % n === 0)
    .map(([, word]) => word)
    .join('');
  console.log(out || i);
}
```
