---
slug: javascript-scope-hoisting-closures
order: 2
number: '3'
group: CORE JAVASCRIPT
title: JavaScript — Scope, Hoisting & Closures
status: answered
---

## What is hoisting, and how does it differ between var, let and const? (M)

Hoisting is that declarations are processed when a scope is created, before any code inside it runs. So the name already exists before the line that declares it. What differs is what the name holds during that gap.

A var is created and initialised to undefined, so reading it early gives you undefined rather than an error. A let or const is created but deliberately left uninitialised, so reading it early throws a ReferenceError. That gap is the temporal dead zone.

So the common shorthand that let and const are not hoisted is not quite right — they are hoisted, they just are not initialised. The proof is that a let shadows an outer variable of the same name from the very top of the block, not from its declaration line.

```
console.log(a);   // undefined
var a = 1;

console.log(b);   // ReferenceError
let b = 2;

const x = 'outer';
{
  console.log(x); // ReferenceError, not 'outer'
  let x = 'inner';
}
```

### Are let and const hoisted at all?

Yes. The binding is created when the scope is entered; what is missing is the initialisation. The shadowing example above is the evidence — if let were not hoisted, that log would simply find the outer x instead of throwing.

### What is actually moved at compile time — the declaration, the assignment, or both?

Nothing physically moves. Hoisting is a useful mental model, not a description of what the engine does — it registers the declarations when it sets up the scope, and the code stays where you wrote it.

Only the declaration is registered. The assignment runs when execution reaches that line, which is why var a = 1 behaves like two separate steps: the name exists from the top, the value arrives on the line.

## How does hoisting work for function declarations versus function expressions? (E)

A function declaration is hoisted with its body, so you can call it above the point where it is written. A function expression only hoists the variable it is assigned to, and the function itself is not created until that line runs.

So calling a var function expression early gives a TypeError — the name exists and holds undefined, and undefined is not a function. With let or const you get a ReferenceError from the temporal dead zone instead. Arrow functions are just expressions, so they behave the same way.

```
declared();    // works
function declared() {}

expressed();   // TypeError: expressed is not a function
var expressed = function () {};

arrow();       // ReferenceError
const arrow = () => {};
```

### What happens if you declare a function and a variable with the same name?

The function declaration wins during scope setup, and then the assignment overwrites it when execution reaches that line. So before the line the name is the function, and after it the name is whatever you assigned.

If the var has no initialiser it does not reset the name to undefined — the function survives. Worth adding that a let or const clashing with a function declaration in the same scope is a SyntaxError instead, which is a much better outcome than the silent overwrite.

## How can you avoid problems related to hoisting? (E)

Use const by default and let when you genuinely reassign, and stop using var. That alone converts the silent undefined bugs into loud errors at the point of the mistake.

Beyond that: declare things before you use them, and keep functions small enough that the distance between a declaration and its use is short. A linter rule like no-use-before-define catches whatever is left.

In practice this is mostly a historical problem now. With modules and block scoping, the classic hoisting bugs rarely come up in new code — you meet them reading old code.

## What’s the difference between global scope, function scope and block scope? (E)

Global scope is the outermost one, reachable from everywhere. In a browser, a top-level var or function declaration in a classic script becomes a property of window, while let and const do not.

Function scope is what var uses: the variable is visible throughout the whole function no matter which block it was written in. Block scope is what let and const use: the variable is confined to the nearest braces, whether that is an if, a loop, or a bare block.

The practical consequence is that a var declared inside an if is still there after the if ends, and a let is not.

```
function f() {
  if (true) {
    var a = 1;
    let b = 2;
  }
  console.log(a);   // 1
  console.log(b);   // ReferenceError
}
```

One addition: a module has its own top-level scope, so the top level of a module is not the global scope. That is a large part of why modules removed the need for the old wrapping tricks.

## What is lexical scope? (M)

Lexical scope means a name is resolved by where it sits in the source text, not by what is happening at runtime. When a function uses a variable it did not declare, the engine looks at the enclosing scope in the source, then that scope’s enclosing scope, and so on up to global.

That chain is fixed when the code is written. It is also the mechanism closures are built on — a closure is just an inner function holding on to its lexical scope after the outer function has finished.

### Is scope determined where a function is defined or where it is called?

Where it is defined. The same function called from anywhere resolves its variables identically, because the scope chain was decided by the source, not the call.

The contrast is this, which in a normal function is dynamic and set by the call site — that is why the two get confused. Arrow functions close over this lexically as well, which is exactly why they behave better as callbacks.

```
const x = 'outer';
function inner() { console.log(x); }

function run() {
  const x = 'inner';
  inner();   // 'outer' — where it is written, not where it is called
}
run();
```

## What is a closure, and how and why would you use one? (M)

A closure is a function bundled together with the scope it was created in. Because scope is lexical, an inner function keeps access to the outer function’s variables even after that outer function has returned.

I use them for factory functions that bake in some configuration, for private state, and for anything callback-based that has to remember something between calls — debounce, throttle, memoisation, event handlers, once-only guards.

```
function counter() {
  let n = 0;
  return () => ++n;
}

const next = counter();
next();   // 1
next();   // 2

const other = counter();
other();  // 1 — its own n
```

Worth saying in a React context that hooks are closures: every effect, handler and callback in a component closes over that particular render’s variables. Most of the confusing hook behaviour comes straight from that.

### What is actually kept alive in memory by a closure?

The variable binding, not a snapshot of the value. The closure points at the live variable, so if anything else reassigns it the closure sees the new value — which is why several closures over the same variable share it.

Engines generally keep only the variables a closure actually references rather than the whole enclosing scope, but that is an optimisation and not something I would design around.

### Give a case where a closure causes a memory leak.

A long-lived closure holding a reference to something big. The classic is an event listener on an element that lives for the whole session, whose handler closes over a large object or a detached DOM node — while the listener is attached, none of it can be collected.

A setInterval that is never cleared does the same thing, and so does a cache that keeps closures. The fixes are the obvious ones: remove the listener, clear the interval, drop the reference — in React, that is what the cleanup function returned from useEffect is for.

## How can closures be used to create private variables? (E)

Declare the state inside a function and return only the functions that operate on it. Nothing outside holds a reference to the variable, so it cannot be read or written except through what you chose to expose.

This is the basis of both the module pattern and ordinary factory functions, and unlike a leading underscore it is real privacy rather than a naming convention.

```
function makeAccount(balance) {
  return {
    deposit: (n) => { balance += n; },
    get: () => balance,
  };
}

const acc = makeAccount(100);
acc.deposit(50);
acc.get();     // 150
acc.balance;   // undefined — no way in
```

### How does this compare to the # private field syntax in classes?

A # field is privacy enforced by the language rather than by scope. Touching one from outside is a SyntaxError, not just undefined, and it is visible in the class body, which reads better than inferring privacy from what a factory happens to return.

The trade-off is memory. Closure privacy gives every instance its own copy of every method, while class methods live once on the prototype. For a handful of objects that is irrelevant; for thousands it is not. I would use # in a class-based codebase and closures in a functional one.

## How would you write a memoize function using a closure? (M)

Keep the cache in the closure and return a wrapper that checks it before calling through. The cache is private to the returned function, which is the appeal — nothing else can read it, clear it or corrupt it.

```js
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

Two details worth saying out loud. It is only safe for pure functions — memoize something that reads a database or the clock and you have cached a stale answer for the life of the page. And it checks has before get, so a cached undefined or 0 is not recomputed every single time, which a truthiness check would do.

### What are the limits of building a cache key from the arguments?

JSON.stringify only handles serialisable arguments and it is order-sensitive, so { a: 1, b: 2 } and { b: 2, a: 1 } produce different keys for what is the same input. Functions and undefined disappear, Map and Set come out empty, and a circular structure throws.

For a single object argument, a WeakMap keyed on identity is both cheaper and correct. For the general case you either accept the limitation or let the caller pass a key resolver, which is what lodash's memoize does — defaulting, notably, to just the first argument.

### When does a memo cache turn into a memory leak?

As soon as it is unbounded and long-lived. A memoized function at module scope holds every argument set and every result for the life of the page, so memoizing something called with user input grows without limit, and memoizing on DOM nodes keeps every node it has ever seen — the same shape of problem as the listener above.

The fixes are a size cap with an eviction policy, a WeakMap when the key is an object you do not want to pin, or scoping the memo to the work that needs it rather than to the module.

## What are the potential pitfalls of using closures? (M)

Retention is the main one. A closure keeps its scope alive, so if the closure itself is long-lived it can hold on to far more memory than you intended.

The second is stale values. A closure captures the binding it was created with, so a callback created in one render or one iteration can later read something that is no longer current. That is exactly the stale closure problem in React, where a handler with a missing dependency keeps seeing the first render’s state.

Then there is the loop case, where every closure created with var shares one variable, and the general readability cost — state hidden in a scope is harder to inspect in a debugger than a plain object.

None of these are arguments against closures. They are arguments for being deliberate about what you capture and how long the closure lives.

## What is the module pattern / IIFE, and why was it used? (M)

An IIFE is a function expression that is invoked as soon as it is defined. Before modules existed, every script shared one global scope, so any top-level var went onto window and could collide with another library.

Wrapping a file in an IIFE gave it a private scope and let it return only what it wanted to expose. That is the module pattern, and it is how essentially every library of the jQuery era was built.

```
var Counter = (function () {
  var n = 0;                                  // private
  function inc() { return ++n; }              // private
  return { inc: inc };                        // the public surface
})();
```

### What replaced it, and why?

ES modules. Each module has its own top-level scope, so nothing leaks by default, and import and export are explicit rather than a matter of assigning to a global and hoping about load order.

The bigger win is that modules are statically analysable. A bundler can see which exports are actually used and drop the rest, which is what tree shaking depends on and what it cannot do with an object assembled at runtime by an IIFE.

IIFEs have not disappeared — they are still a bundler output format, and still handy for scoping a block of setup code — but not as a module system.

## Why does function foo(){}(); not work as an IIFE, and how do you fix it? (M)

Because at the start of a statement that is parsed as a function declaration, and a declaration is not something you can invoke. The trailing parentheses are then read as a separate grouping, and because they are empty it is a SyntaxError.

Whether function is a declaration or an expression comes down to position, so the fix is to put it somewhere an expression is expected. Wrapping it in parentheses is the usual way.

```
function foo(){}();            // SyntaxError

(function () { /* ... */ })();  // parens around the function
(function () { /* ... */ }());  // or around the whole call
!function () { /* ... */ }();   // an operator works too
```

The !function form shows up in older minified code because it saves a byte; void and unary + do the same job. With a named function you could equally just declare it and call it on the next line — the whole trick only exists to avoid the name.

## What is the temporal dead zone, and why do let and const trigger it but var does not? (M)

The temporal dead zone is the stretch between entering a scope and executing the declaration, during which a let or const binding exists but cannot be touched. Reading or writing it throws a ReferenceError.

var has no dead zone because it was specified to initialise to undefined the moment it is created. let and const came later and were designed on purpose so that using something before you declare it is an error rather than a silent undefined.

const needs it particularly badly — a const cannot be assigned after creation, so there is no sensible value to give it before its declaration has run.

```
{
  typeof t;   // ReferenceError — typeof does not save you here
  let t = 1;
}
```

The detail worth adding is that the dead zone is about time, not position. A function written above a let can read it perfectly well, as long as it is not called until after the declaration has run.

## Why does a var inside a for loop capture the same variable across iterations, and how does let fix that? (M)

Because var is function-scoped, so there is only one variable for the entire loop. Every closure created inside the loop points at that same binding, and by the time deferred callbacks run the loop has finished, so they all read the final value.

let fixes it because the spec creates a fresh binding for each iteration and copies the previous value into it. Each closure captures its own, so each one sees the value from its own pass.

```
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
// 3 3 3

for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));
// 0 1 2
```

That per-iteration binding is a specific rule for let in a for loop, not just a consequence of block scoping — which is worth saying, because it is the part people assume rather than know.

### How would you have solved this before let existed?

An IIFE per iteration, passing i in as an argument so each call gets its own copy. The extra function is the whole point — it creates the scope that var will not.

```
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j));
  })(i);
}
```

In practice people reached for forEach instead, since the callback parameter gives you a per-item binding for free and reads far better. setTimeout’s trailing-arguments form was another way round it.
