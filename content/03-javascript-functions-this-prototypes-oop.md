---
slug: javascript-functions-this-prototypes-oop
order: 3
number: "4"
group: CORE JAVASCRIPT
title: JavaScript — Functions, this, Prototypes & OOP
status: answered
---

## How does this work in JavaScript, and what are the different ways it can be bound? (H)

this is decided by how a function is called, not where it is defined — with arrow functions as the exception. There are four rules, and they apply in priority order.

First, new binding: calling with new makes this the newly created object. Second, explicit binding: call, apply or bind set it directly. Third, implicit binding: when a function is called as a method, this is the object to the left of the dot. Fourth, default binding: a plain call gets undefined in strict mode, or the global object in sloppy mode.

Arrow functions sit outside all of that. They have no this of their own, so they take it from the enclosing lexical scope at the point they were written, and nothing can change it afterwards.

```js
const obj = {
  name: "obj",
  regular() {
    return this.name;
  }, // 'obj'  (implicit)
  arrow: () => this?.name, // outer this, not obj
};

const fn = obj.regular;
fn(); // undefined - lost the receiver
```

### What is this in a plain function call in strict mode versus non-strict?

In strict mode it is undefined. In sloppy mode the engine substitutes the global object, which is where the classic bug comes from — you write this.count++ in a detached function and silently create or clobber a global instead of getting an error.

This is one of the better arguments for strict mode: it turns a silent misfire into a TypeError you can see.

### How does an arrow function decide its this?

It does not decide anything at call time. It closes over this from the scope where it was defined, exactly as it would close over any other variable. call, apply and bind cannot override it, and using it with new throws.

That is what makes arrows the right choice for callbacks inside a method — the callback keeps the method's this instead of losing it.

## How does this behave inside event handlers? (E)

With addEventListener and a regular function, this is the element the listener is attached to — the same as event.currentTarget, not necessarily event.target, which is where the event originated.

With an arrow function it is whatever this was in the surrounding scope, so you lose the element reference. That is fine if you did not need it, and a bug if you did.

### What breaks when you pass a method directly as a handler, and what are three ways to fix it?

You pass the function value, not the object, so the implicit binding is gone. By the time the browser calls it, there is no receiver on the left of the dot and this is undefined in strict mode — hence the classic cannot read property of undefined in old React class components.

Three fixes: bind it, either in the constructor or at the point of use; wrap it in an arrow function so the arrow's lexical this is captured and forwarded; or define the method as a class field with arrow syntax so it is bound per instance at construction.

```
el.addEventListener('click', this.handle.bind(this));
el.addEventListener('click', () => this.handle());
handle = () => { /* class field, already bound */ };
```

## What’s the difference between .call() and .apply(), and what does Function.prototype.bind do? (M)

call and apply both invoke the function immediately with an explicit this. The only difference is how the arguments are passed: call takes them as a list, apply takes them as an array. The mnemonic is A for apply, A for array.

bind is different in that it does not call anything — it returns a new function with this permanently fixed, and optionally with leading arguments pre-filled, which makes it a partial application tool as well.

```
fn.call(ctx, a, b);
fn.apply(ctx, [a, b]);
const bound = fn.bind(ctx, a);   // returns a function; call it later

// spread has made apply largely unnecessary
Math.max(...numbers);
```

### Can you bind an already-bound function?

You can call bind on it, but the this will not change — the first binding wins and every later one is ignored. Additional arguments do still get appended, so partial application stacks even though the receiver is locked.

It works that way because bind returns an exotic bound function that closes over the original target and this value; the second bind just wraps the wrapper.

### How would you implement bind yourself?

The core is a closure over the target function, the context and any preset arguments, returning a function that applies them together with whatever arrives later.

```
Function.prototype.myBind = function (ctx, ...preset) {
  const target = this;
  return function (...later) {
    return target.apply(ctx, [...preset, ...later]);
  };
};
```

If they push further, the spec version also has to handle being called with new — in that case the bound this is ignored and the new object wins — and it copies the length and name. I would mention that rather than write it, unless asked.

## What’s a typical use case for arrow syntax, and how does it differ from a regular function? (M)

The typical use is short callbacks, and any callback inside a method that needs to keep the surrounding this — array transforms, promise handlers, setTimeout inside a class.

The differences are more than syntax. An arrow has no own this, no arguments object, no prototype property, and cannot be used with new or with super or new.target. It also has the implicit return when the body is a single expression.

```
const doubled = nums.map(n => n * 2);

class Timer {
  start() {
    setInterval(() => this.tick(), 1000);  // this survives
  }
}
```

### Where would an arrow function be the wrong choice?

Anywhere this needs to be dynamic. Object literal methods, prototype methods, constructors, and event handlers where you want this to be the element. Also anything that needs the arguments object, or a library that calls your function with a specific this — a Mocha test using this.timeout, for example.

The rule I use: if the function cares who called it, use a regular function. If it only cares where it was written, use an arrow.

## What advantage is there to using arrow syntax for a method in a constructor? (M)

Defining it as a class field with arrow syntax binds it once per instance at construction, so you can pass it around as a callback and it keeps its this without a manual bind. That removed a lot of constructor boilerplate in React class components.

The tradeoff worth mentioning: it lives on each instance instead of on the prototype, so you get one copy per object rather than one shared function, and it is harder to override or spy on through the prototype in tests. For most application code that is a fine trade; for something instantiated tens of thousands of times it is not.

```
class Button {
  handleClick = () => { this.count++; };  // bound, per instance
}
```

## What’s a typical use case for anonymous functions? (M)

Callbacks passed to higher-order functions, immediately invoked expressions, and one-off handlers — anywhere the function is used once and a name would add nothing.

In modern code arrows have taken over most of these, and where a function is complex enough to be worth naming, I name it, because the name doubles as documentation.

### What do you lose in a stack trace by using them?

Historically you got anonymous frames, which made a deep trace much harder to read. Modern engines infer a name from the assignment target, so const doSomething = () => {} shows up as doSomething.

You still get nothing useful for a function passed inline as an argument, which is the common case in a promise chain — that is a real argument for extracting named handlers when debugging matters.

## What’s the difference between function foo(){} and var foo = function(){}? (M)

The first is a function declaration and is fully hoisted — both the name and the body are available before the line where it appears. The second is a function expression assigned to a variable: only the variable declaration is hoisted, so calling it before the assignment gives you undefined is not a function.

```
hoisted();      // works
declared();     // TypeError: declared is not a function

function hoisted() {}
var declared = function () {};
```

There is also the named function expression form, where the name is only visible inside the function itself, which is occasionally useful for recursion without leaking a name.

## What’s the difference between function Person(){}, const person = Person(), and const person = new Person()? (M)

The first just declares a function. Calling it without new runs it as an ordinary function: it returns undefined unless you return something, and this is undefined in strict mode — so any this.name = name inside throws. In sloppy mode it would instead write those properties onto the global object, which is worse because it fails silently.

Calling it with new creates a fresh object whose prototype is Person.prototype, runs the body with this pointing at that object, and returns it.

This is exactly the trap that class syntax closed — a class throws immediately if you call it without new.

### What does the new keyword actually do, step by step?

Four steps. It creates a new empty object. It sets that object's internal prototype to the constructor's prototype property. It calls the constructor with this bound to the new object. Then it returns that object — unless the constructor explicitly returns an object of its own, in which case that one wins and the new object is discarded.

```
function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype);
  const result = Ctor.apply(obj, args);
  return (result &amp;&amp; typeof result === 'object') ? result : obj;
}
```

## What is a higher-order function? (M)

A function that takes a function as an argument, returns a function, or both. map, filter and reduce are the everyday examples; so is any decorator or middleware, and so is bind.

It is possible in JavaScript because functions are first-class values — they can be assigned, passed and returned like any other value.

## What is currying, what is partial application, and how do they differ? (M)

Currying converts a function of several arguments into a chain of single-argument functions, so f(a, b, c) becomes f(a)(b)(c). Partial application means fixing some arguments now and getting back a function that takes the rest — it does not care about arity, and it is what bind does.

So the difference is that currying is a strict one-at-a-time transformation, while partial application is just pre-filling however many arguments you like. Most so-called curry helpers in the wild are actually flexible and accept both, which blurs the line.

```
const add = (a, b, c) => a + b + c;

curry(add)(1)(2)(3);       // currying
add.bind(null, 1, 2)(3);   // partial application
```

### Write a curry function that works for any arity.

The trick is to compare how many arguments have arrived against the original function's declared length, and either call it or return a collector for the rest.

```
const curry = fn =>
  function curried(...args) {
    return args.length >= fn.length
      ? fn.apply(this, args)
      : (...rest) => curried.apply(this, [...args, ...rest]);
  };
```

Worth flagging the limitation out loud: fn.length ignores default parameters and rest parameters, so this does not work on a variadic function. That caveat usually earns more credit than the code does.

## What are the benefits of currying and partial application? (E)

Mainly specialisation and composition. You configure a general function once and hand out a narrower version — a logger with the level already fixed, a fetch wrapper with the base URL baked in — which removes repeated arguments at every call site.

They also make functions easier to pipe together, because each stage takes one value and returns one value.

The honest counterpoint is that heavily curried code can be hard for a team to read and harder to debug, since stack traces fill with anonymous wrappers. I use it where it removes real duplication, not as a default style.

## What are function composition and pipe, and how do they relate to currying? (M)

Composition is building one function out of several small ones, where each takes the previous one's output. compose applies them right to left, matching the maths notation f(g(x)); pipe applies them left to right, which reads in the order things actually happen and is what most codebases settle on.

Currying is what makes it practical. Composition wants unary functions, and currying is how you turn a two-argument helper into one that takes its configuration first and its data last, ready to drop into a pipeline.

```js
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, f) => f(acc), x);
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, f) => f(acc), x);

const slugify = pipe(trim, toLowerCase, hyphenate);
```

You see the shape everywhere once you look for it — Redux middleware, Express, Node streams, array method chains. The honest caveat is debugging: a stack trace through a composed chain tells you very little about which step failed, so name the functions rather than inlining arrows.

### Write compose so that compose(f, g)(x) equals f(g(x)).

The two-function case is the whole idea, and the variadic version is a fold over it. Folding the functions together rather than folding values through them is the version I would write, because the innermost function can then take however many arguments it likes:

```js
const compose2 = (f, g) => (x) => f(g(x));

const compose = (...fns) =>
  fns.reduce(
    (f, g) =>
      (...args) =>
        f(g(...args)),
  );
```

Each step returns a new function rather than a value, so nothing runs until the composed function is called. Note there is no initial value in that reduce — the first function is the seed — so compose() with no arguments throws, which is worth a guard if it is library code.

## What are generators and iterators, and how do you make an object iterable? (H)

An iterator is any object with a next() method returning { value, done }. An iterable is any object with a Symbol.iterator method that returns one. That protocol is what for...of, spread and array destructuring all speak, which is why arrays, strings, Map and Set work with them and plain objects do not.

A generator is the easy way to produce one. A function\* returns a generator object that is both an iterator and iterable, and yield hands back the next value and pauses there until next() is called again.

```js
const range = {
  from: 1,
  to: 3,
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) yield i;
  },
};

[...range]; // [1, 2, 3]
```

### What does yield do to the function's execution?

It suspends the function and returns a value to the caller while keeping the entire local state alive — variables, position in the loop — so execution resumes at that exact point. It is also two-way: whatever you pass to next() becomes the value the paused yield expression evaluates to.

That makes a generator a coroutine rather than just a lazy list, and it is how async/await was originally polyfilled — a generator that yields promises, driven by a runner calling next() as each one settles.

### Where would you actually reach for a generator?

Lazy or infinite sequences, where you want values one at a time instead of a materialised array: paginated results, an id generator, walking a tree without flattening it first. Anywhere the consumer should decide how much work happens.

In application code they are rare. You meet them more often indirectly — async iteration with for await...of over a stream, or redux-saga, which uses the pause-and-resume nature to make side effects testable.

## What is prototypal inheritance, and how does it differ from classical inheritance? (M)

Every object has a hidden link to another object, its prototype. When you read a property that the object does not have, the engine follows that link upwards until it finds the property or runs out of chain. So behaviour is shared by delegation at lookup time, not by copying.

Classical inheritance, as in Java or C++, works from classes as blueprints — the class defines a structure and instances are built from it, with the hierarchy fixed at compile time.

The practical difference is that JavaScript objects are live-linked: add a method to a prototype at runtime and every existing instance can use it immediately. And a class in JavaScript is still prototypes underneath — it is a nicer syntax over the same machinery.

### What is the prototype chain, and what happens at the end of it?

It is the sequence of prototype links the engine walks on a failed property lookup. A typical array goes instance to Array.prototype to Object.prototype, and Object.prototype's prototype is null. That null is the end — the lookup stops and the expression evaluates to undefined rather than throwing.

It is also why long chains cost a little on lookup, and why Object.create(null) is useful when you want a dictionary with no inherited keys at all.

### What is the difference between `__proto__` and prototype?

prototype is a property that exists on constructor functions. It is the object that will become the prototype of instances created with new — it is not the function's own prototype.

**proto** is the actual link on an object pointing at its prototype. It is a legacy accessor kept for compatibility; the standard way is Object.getPrototypeOf and Object.setPrototypeOf.

```
function Person() {}
const p = new Person();

Object.getPrototypeOf(p) === Person.prototype;  // true
Person.prototype.constructor === Person;        // true
```

## How does instanceof work, and when does it give the wrong answer? (M)

It walks the prototype chain of the value on the left, looking for the object that the constructor on the right has as its prototype property. So it is a question about the chain, not about a type tag — x instanceof Array is true if Array.prototype appears anywhere in x's chain.

Which means it can be wrong in both directions. It is false for primitives, because they have no chain of their own; it follows the chain upwards, so almost everything is an instance of Object; and it can be changed after the fact by reassigning a prototype or defining Symbol.hasInstance.

```js
[] instanceof Array; // true
[] instanceof Object; // true — further up the same chain
"a" instanceof String; // false — a primitive, not a String object
Array.isArray([]); // the check that actually holds up
```

### Why can instanceof fail across iframes or realms?

Each iframe, worker or Node vm context has its own copy of the built-ins. An array created inside an iframe has that iframe's Array.prototype in its chain, not yours, so arr instanceof Array is false even though it plainly is an array.

That is why Array.isArray exists, and why library code tends to use Object.prototype.toString.call(x) or duck typing for built-ins instead. For your own classes inside one realm, instanceof is fine.

## What is the difference between hasOwnProperty, Object.hasOwn and the in operator? (E)

in is true if the property exists anywhere on the object or its prototype chain, so "toString" in {} is true. hasOwnProperty is true only for the object's own properties and ignores everything inherited.

Object.hasOwn is the modern static form of that same check, added because calling the method directly is not always safe. All three see non-enumerable properties, which Object.keys and for...in do not.

```js
const o = { a: 1 };
"a" in o; // true
"toString" in o; // true — inherited
Object.hasOwn(o, "toString"); // false
```

### Why is calling obj.hasOwnProperty() directly risky?

Because you are looking the method up on the object itself, and the object may not have it. A parsed JSON payload with a key literally called hasOwnProperty shadows the method, and an object created with Object.create(null) — a common choice for a dictionary precisely to avoid prototype collisions — has no prototype at all, so the call throws.

The old workaround was Object.prototype.hasOwnProperty.call(obj, key). Object.hasOwn(obj, key) is exactly that, with a name you can read.

## What are the differences between ES2015 classes and ES5 function constructors? (H)

Underneath they produce the same prototype-based structure, but the class form fixes a list of sharp edges. Classes are not callable without new — they throw. The whole body runs in strict mode. Class declarations are hoisted but sit in a temporal dead zone, so you cannot use one before its declaration.

Methods defined in a class are non-enumerable, so they no longer show up in a for...in loop. extends and super give you a correct prototype chain in one line instead of the manual Object.create dance. And you get static members, getters and setters, and true private fields with the hash prefix.

```
class Person {
  #secret = 42;              // genuinely private
  static create(n) { return new Person(n); }
  constructor(name) { this.name = name; }
  greet() { return `hi ${this.name}`; }   // on the prototype, non-enumerable
}
```

### Are classes purely syntactic sugar? Name something you cannot replicate with a function constructor.

Not purely. Private fields with # have no ES5 equivalent — the closest is a closure or a WeakMap, and neither gives you the same syntax or the hard privacy.

The bigger one is extending built-ins. Subclassing Array or Error properly needs super() to construct the exotic object, because the base constructor is what creates an object with the right internal behaviour. With an ES5 constructor calling Array.call(this) you get an ordinary object — length does not update, and that is why transpiled subclasses of Array were broken for years.

Add that a class cannot be called without new, which no plain function can enforce as cleanly.

## How does inheritance work with ES2015 classes? (E)

extends sets up the prototype chain in both directions — instance methods and statics both inherit. Inside the subclass, super(...) calls the parent constructor and super.method() calls the parent's version of a method, which is how you extend behaviour rather than replace it.

```
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() { return `${super.speak()} - a bark`; }
}
```

### What does super() do, and why must it be called before using this?

super() invokes the parent constructor. In a derived class the parent is what actually creates the instance, so until super() has run there is no this to touch — it sits in its own temporal dead zone and any access throws a ReferenceError.

That is also why a derived class with a constructor must call super() at all; omitting it and then returning normally is an error. If you write no constructor, you get an implicit one that forwards its arguments to super.

## What do static members, #private fields and getters or setters add to a class? (M)

static puts a member on the constructor rather than on instances — factory methods in the style of User.fromJSON, and constants that belong to the type rather than to any one object. Statics are inherited, because the constructor has a prototype chain of its own.

#private fields are privacy enforced by the language rather than by convention or scope: invisible on the instance, unreachable through bracket notation, and a syntax error to touch from outside the class body. Getters and setters let a derived value be read like a property, or let an assignment be validated — though a setter doing real work is a common surprise, because the call site just looks like an assignment.

```js
class User {
  static #count = 0;
  #email;

  constructor(email) {
    this.#email = email;
    User.#count++;
  }

  get domain() {
    return this.#email.split("@")[1];
  }

  static get count() {
    return User.#count;
  }
}
```

Compared with the closure-based privacy in the scope section, the win is memory: the fields are per instance but the methods stay shared on the prototype.

### Can a subclass read a parent's #private field?

No. Private names are scoped to the class body that declares them and are not inherited, so a subclass method reading this.#email is a syntax error rather than undefined. Same for anything outside — including your tests, which is the practical objection people raise.

If a subclass genuinely needs access, the options are an underscore-prefixed field as a soft convention, or a protected accessor on the parent that the subclass calls. There is no protected keyword in JavaScript.

## What are the various ways to create objects in JavaScript? (M)

Object literal for the common case. A constructor function with new, or class syntax, when you want many instances sharing behaviour. Object.create when you want to specify the prototype directly, including Object.create(null) for a clean dictionary with no inherited keys.

And factory functions — a plain function that returns an object literal. They avoid new and this entirely and let you close over private state, which is why a lot of modern code prefers them over constructors for anything that is not a real hierarchy.

```
const a = { x: 1 };
const b = new Person('Ada');
const c = Object.create(protoObj);
const d = (name) => ({ name, greet: () => `hi ${name}` });   // factory
```

## Why is extending built-in JavaScript objects not a good idea? (M)

Because the built-in prototypes are shared global state. If you add Array.prototype.contains and a library does the same with different semantics, one of you silently loses — and the bug appears somewhere unrelated to either.

There is also a forward-compatibility problem: the language may standardise the same name later with different behaviour. That genuinely happened with the proposal for Array.prototype.flatten, which had to be renamed to flat because an old version of MooTools had patched a conflicting version onto the prototype and would have broken the web.

The safe alternatives are a standalone function, a subclass you use locally, or a wrapper object.

## What are encapsulation and polymorphism? (M)

Encapsulation is keeping internal state private and exposing a deliberate interface, so callers depend on what something does rather than how it does it. In JavaScript that is closures, module scope, or genuine #private fields in a class.

Polymorphism is one interface with several implementations — calling speak() on a collection of different animals and each doing its own thing. JavaScript gets it two ways: prototype method overriding, and plain duck typing, where anything with the right method just works, no shared base class required.

Duck typing is worth calling out, because it means most of the value of polymorphism in JavaScript arrives without any inheritance at all.

## What’s the difference between composition and inheritance, and when would you use each? (M)

Inheritance is an is-a relationship: the subclass is a kind of the parent and takes everything it has. Composition is a has-a relationship: you build an object out of smaller capabilities and combine only the ones you need.

My default is composition. Inheritance is worth it when the hierarchy is genuinely stable and shallow and the is-a relationship is real — a framework's base component class, say, or an error hierarchy. As soon as the taxonomy starts feeling arbitrary, that is the signal to compose instead.

```
// composition: pick the behaviours you need
const canFly = (s) => ({ fly: () => `${s.name} flies` });
const canSwim = (s) => ({ swim: () => `${s.name} swims` });

const duck = (name) => {
  const self = { name };
  return Object.assign(self, canFly(self), canSwim(self));
};
```

### What problem does deep inheritance cause that composition avoids?

The fragile base class problem: a change high in the hierarchy ripples into every descendant, including ones the author has never looked at, and there is no way to opt out. Behaviour also gets scattered across five files, so reading one class tells you very little.

The other one is that inheritance is all-or-nothing — the gorilla and the banana. You wanted one method and you inherited the whole tree. Composition lets you take just the banana.

## How do you create custom error objects, and how does error propagation work? (M)

Extend Error, call super with the message, and set a name so it is identifiable. Adding a field or two — a status code, the original cause — is what makes it useful, because then a catch block can branch on the type instead of parsing message strings.

Propagation is that a throw unwinds the call stack until it hits a try/catch, and if nothing catches it, it reaches the top level as an uncaught error. In async code the equivalent is a rejected promise, which propagates down the chain to the nearest catch; with async/await, await re-throws the rejection so ordinary try/catch works.

```
class ApiError extends Error {
  constructor(message, status, options) {
    super(message, options);        // options.cause is supported
    this.name = 'ApiError';
    this.status = status;
  }
}

try {
  await load();
} catch (e) {
  if (e instanceof ApiError &amp;&amp; e.status === 404) { /* handle */ }
  else throw e;                     // rethrow what you cannot handle
}
```

### Why does extending Error need special handling for the prototype and stack?

In modern engines it mostly does not — class extends Error works. The problem appears when the class is transpiled down to ES5: the Error constructor returns a fresh object rather than operating on this, so the prototype link is lost and instanceof fails. The fix is Object.setPrototypeOf(this, new.target.prototype) at the end of the constructor.

For the stack, V8 captures it automatically, but Error.captureStackTrace(this, MyError) lets you strip the constructor frame so the trace points at the caller instead of at your error class.

### What happens to an error thrown inside a promise chain with no catch?

It becomes an unhandled rejection. The promise settles as rejected and nothing consumes it, so the error does not surface where it happened.

In the browser that fires an unhandledrejection event on window, which is what error reporting tools hook into. In Node it has been fatal by default since version 15 — the process crashes rather than continuing in an unknown state. Either way the practical rule is that every chain needs a terminal catch, and every async function called from a non-async context needs its rejection handled.
