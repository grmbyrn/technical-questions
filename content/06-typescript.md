---
slug: typescript
order: 6
number: '7'
group: LANGUAGES & MARKUP
title: TypeScript
status: answered
---

## What’s the difference between type and interface, and when would you use each? (M)

For describing an object shape they are close to interchangeable. The real difference is reach: an interface can only describe an object-ish thing and it merges with other declarations of the same name, while a type alias is just a name for any type at all — a union, a tuple, a primitive, a mapped or conditional type, a function signature.

My rule is interfaces for public object shapes that something else might extend or augment, and types for everything else. In practice that means most application code ends up using type, because the useful things are unions and derived types, and interfaces show up on library surfaces and props.

There are two small technical points worth knowing. `extends` on an interface checks the parent at declaration time and errors on an incompatible override, whereas an intersection silently produces a property of type `never`. And the compiler caches interface relationships, so very large intersection-heavy type aliases can measurably slow down a build where interfaces would not.

```
interface User { id: string; name: string }

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
type Handler = (e: Event) => void;
type Keys = keyof User;
```

### Which one supports declaration merging, and when does that matter?

Interfaces. Two interfaces with the same name in the same scope merge into one; two type aliases with the same name are a duplicate identifier error.

It matters when you need to augment types you do not own — adding a field to Express’s `Request`, widening Vue’s `ComponentCustomProperties`, or declaring extra keys on `ProcessEnv`. That is a genuine feature and there is no equivalent for a type alias.

For your own application types it is a downside rather than a benefit. Anyone can reopen your interface from anywhere and add to it, and nothing tells you at the definition site that it happened.

## What is a discriminated union, and when would you use one? (M)

It is a union of object types that all share a property whose type is a different literal in each member. That shared property is the discriminant, and checking it tells the compiler exactly which member you are holding.

I reach for it whenever a value has a small number of distinct states with different data attached to each — request state, form state, a parsed result, an action in a reducer, a websocket message. The point is that the data lives on the state it belongs to, so you cannot reach for `data` in the loading branch, because in that branch it does not exist.

That is the real win: it makes impossible states unrepresentable. The alternative shape — one object with `loading`, `data` and `error` all optional — has sixteen combinations, twelve of which are nonsense you then have to defend against by hand.

```
type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function render(s: State<User>) {
  switch (s.status) {
    case 'success': return s.data.name;   // data exists only here
    case 'error':   return s.error.message;
    default:        return 'loading…';
  }
}
```

### How does the compiler narrow it, and what makes a good discriminant?

Narrowing works because the compiler recognises the property as a unit type — a single literal, not a wide `string`. When you compare it in an `if`, a `switch`, or a ternary, control-flow analysis keeps only the members whose discriminant could match, and it does that from the comparison to the end of that branch.

A good discriminant is required rather than optional, has the same property name in every member, and is a single literal per member — usually a string, because string literals read well in logs and devtools. It fails if you type the field as `string`, if it is optional, or if you use an object or an array as the tag.

Two related notes: `switch` with an exhaustive check is the pattern I actually write, and members can share a tag value only if you are happy with the union of both remaining after the check.

## What’s the difference between unknown and any, and why prefer unknown for untyped input? (M)

`any` switches the checker off for that value. It is assignable both to and from everything, and it spreads — one `any` at the top of a call chain silently un-types everything downstream, which is why it is so much worse than it looks in a diff.

`unknown` is the safe top type. Everything is assignable to `unknown`, but `unknown` is assignable to nothing except `unknown` and `any`, and you cannot read a property, call it, or do arithmetic on it. It says the same thing as `any` — "I do not know what this is" — but it forces the person holding it to establish what it is before using it.

That is exactly the shape of a boundary. `JSON.parse` returns `any`, a `fetch` body is `any`, and a `catch` variable is `any` unless you set `useUnknownInCatchVariables` (which `strict` turns on). Typing all of those as `unknown` means every one of them gets a check written for it.

```
function handle(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'unknown error';
}
```

### What must you do before you can use an unknown value?

Narrow it — with `typeof`, `instanceof`, `in`, `Array.isArray`, a custom type predicate, or a schema validator. Once narrowed the compiler lets you use it at the narrowed type.

You can also assert with `as`, and it compiles, but that is `any` wearing a hat: you have told the compiler an answer instead of checking one. If the value came from outside the program the assertion is a guess, and the whole reason for using `unknown` was to stop guessing.

## How do generic constraints work with extends? (M)

`<T extends X>` says T can be any type assignable to X. Inside the function you can use whatever X guarantees, and at the call site T is inferred as the caller’s actual type rather than being widened to X.

That last part is the reason to use a constraint instead of just typing the parameter as X. If a parameter is typed `X`, the return type can only be `X`; if it is typed `T extends X`, the specific type flows through and comes back out.

```
// loses information — returns Lengthy
function widen(x: Lengthy): Lengthy { return x; }

// keeps it — returns the caller's exact type
function keep<T extends { length: number }>(x: T): T { return x; }

const s = keep('hello');       // string, not { length: number }
```

Constraints also give the compiler something to check the default against, and they are what make conditional types usable inside a generic — without a constraint, `T` could be anything, so almost nothing is provable about it.

### How would you constrain a generic to only the keys of another object?

`K extends keyof T`. That is the standard property-getter shape, and it is worth being able to write from memory.

```
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: '1', age: 30 };
get(user, 'age');   // number
get(user, 'nope');  // error: not assignable to 'id' | 'age'
```

The return type is the indexed access `T[K]`, so it is the type of that specific property, not a union of all of them. If you want to allow nested paths you can build a template literal type of dotted key paths, but that gets expensive quickly and I would only do it in a library.

## What does the infer keyword do, and when would you use it? (H)

`infer` declares a type variable inside the `extends` clause of a conditional type. It says "match this shape, and capture whatever was in that position under this name". You can only use the captured name in the true branch.

I use it to take apart types I do not own or cannot name — the resolved type of a promise, the return type or parameters of a function, the props of a component, the element type of an array, the payload of an action. Anywhere the type already exists in the program but there is no direct way to point at the piece you want.

```
type Awaited1<T> = T extends Promise<infer U> ? U : T;
type Return<F> = F extends (...args: any[]) => infer R ? R : never;
type Params<F> = F extends (...args: infer P) => any ? P : never;
```

Two behaviours to know. If the same variable is inferred from multiple positions the results are unioned in covariant positions and intersected in contravariant ones — which is why `Parameters` on an overloaded function only gives you the last overload. And since 4.7 you can constrain it directly, `infer U extends string`, which saves a nested conditional.

### Write a type that extracts the element type from an array type.

```
type ElementOf<T> = T extends readonly (infer U)[] ? U : never;

type A = ElementOf<string[]>;              // string
type B = ElementOf<readonly number[]>;     // number
type C = ElementOf<[1, 'a', true]>;        // 1 | 'a' | true
```

The `readonly` in the pattern is what lets it also match readonly arrays and tuples; without it those fall to the false branch. The simpler version for the same job is the indexed access `T[number]`, which is what I would actually write unless I needed the conditional’s false branch.

## How do you handle runtime type safety at API boundaries? (M)

By parsing rather than asserting. At every point where data enters the program — an HTTP response, a request body, `localStorage`, query params, environment variables, a message from a worker — the value is `unknown`, and it goes through a schema that either returns a typed value or fails. Everything inside the boundary can then trust its types, because something actually checked.

The important part is that the check happens once, at the edge, and produces a value you own. Not a cast, not a defensive check sprinkled through the render tree. If the shape is wrong I want to know at the fetch, with the field name in the error, not three components deep with "cannot read properties of undefined".

For a failure I map it into whatever the app’s error handling already is — a rejected promise with a typed error, a `Result` union, a 400 in an Express handler. It is the same decision as any other invalid input.

### Why is a TypeScript interface not enough here?

Because types are erased. An interface exists only during compilation; there is no code in the bundle that corresponds to it, so nothing checks a response body against it at runtime.

`await res.json()` is `any`, and writing `as User` on it does not verify anything — it just stops the compiler asking. That makes it a promise you are making about a server you do not control, and it is exactly the promise that breaks when the API renames a field or starts returning `null` for something.

The failure mode is what makes it worse than no types at all: the program keeps running with a lie in it, and the error surfaces somewhere far away from the cause.

### How does a schema validator like Zod bridge the two?

A schema is a runtime value, so it can actually inspect the data, and it carries enough information for the compiler to derive the static type from it. One declaration produces both, so they cannot drift — you never end up with an interface that says one thing and a validator that checks another.

```
import { z } from 'zod';

const User = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.coerce.date(),
});

type User = z.infer<typeof User>;

async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const parsed = User.safeParse(await res.json());
  if (!parsed.success) throw new ApiError('bad user payload', parsed.error);
  return parsed.data;
}
```

`safeParse` returns a discriminated union rather than throwing, which fits normal control flow better. The other thing schemas give you is transformation at the boundary — `z.coerce.date()` there turns the ISO string the server sent into a real `Date`, so the rest of the app never handles the wire format.

## What does strictNullChecks do, and why does it matter? (M)

With it off, `null` and `undefined` are members of every type. `string` includes `null`, so the compiler will happily let you call `.toUpperCase()` on something that is null, and the type system is lying to you about the single most common cause of runtime crashes in JavaScript.

With it on, they are their own types and have to be written into the type when they are possible — `string | null`. The compiler then refuses the access until you have checked, and narrows the type inside the check so the good path stays clean. That is what gives optional properties, optional chaining and `??` any meaning at all; without it they are decoration.

It is the highest-value compiler flag there is, and it is included in `strict`. Turning it on in an existing codebase is the painful migration — the error count is alarming — but most of those errors are real, and the ones that are not are cheap to annotate. I would do it file by file behind a per-directory config rather than all at once.

## How would you type a component that accepts arbitrary HTML props plus custom ones? (H)

Take the element’s prop type from React rather than writing it out — `ComponentPropsWithoutRef<'button'>` gives every valid button attribute including the DOM events, and `ComponentPropsWithRef` if the component forwards a ref. Then intersect your own props onto it and spread the rest onto the element.

```
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'type'> & {
  variant?: 'primary' | 'ghost';
  type?: 'button' | 'submit';       // narrower than the native one
  icon?: ReactNode;
};

export function Button({ variant = 'primary', type = 'button', icon, children, ...rest }: ButtonProps) {
  return (
    <button type={type} data-variant={variant} {...rest}>
      {icon}
      {children}
    </button>
  );
}
```

The `...rest` spread is what makes it work in practice — `aria-label`, `disabled`, `onClick`, `data-*` all pass through without you enumerating them, and they stay type-checked. If the component is polymorphic over the element it renders, the same idea generalises with `<E extends ElementType>` and `ComponentPropsWithoutRef<E>`, plus an `as` prop.

### How do you avoid collisions between your props and the native ones?

`Omit` the native ones you are replacing before intersecting. If you just intersect, a conflicting property becomes the intersection of the two types — often `never` — and the error the consumer gets points at the call site with a message about nothing being assignable, which is baffling.

In the example above, `type` on a native button is `'button' | 'submit' | 'reset'`; omitting it and redeclaring it narrower means "reset is not allowed here" is enforced with a clear error. Same for `size` on an input, which natively means character width, or `color`, which natively is a legacy presentational attribute and is almost never what a design-system `color` prop means.

The habit is worth having generally: when you extend a DOM element’s props, list the ones you are taking over and omit them explicitly, so a future native attribute with the same name cannot quietly collide.

## What is the satisfies operator, and when would you use it? (M)

It checks that an expression conforms to a type, without changing the type the expression is inferred as. So you get the error if the value is wrong, and you keep the specific literal types the compiler worked out.

I use it for configuration objects, route tables, theme maps, lookup records — anything where I want the shape validated but I also want to derive types from the actual keys and values afterwards.

```
type Route = { path: string; auth?: boolean };

const routes = {
  home:    { path: '/' },
  profile: { path: '/me', auth: true },
} satisfies Record<string, Route>;

type RouteName = keyof typeof routes;    // 'home' | 'profile'
routes.profile.auth;                     // boolean — known to exist
```

### How does it differ from a plain type annotation or an as assertion?

An annotation checks, but it also widens: `const routes: Record<string, Route>` makes the type of `routes` literally that, so `keyof typeof routes` is `string`, autocomplete on `routes.` gives nothing, and the compiler no longer knows that `profile` has `auth`. You got the check and paid for it with everything you knew about the value.

`as` does the opposite — it changes the type with no check at all. It is an assertion, so it will happily accept an object missing a required field or with a typo in a key, which is precisely the mistake a config object is prone to.

`satisfies` is the check without the loss, so it replaces most of my uses of both. The one thing it does not do is act as a contextual type for inference in the same way an annotation does in every position, so occasionally you still want the annotation — for example when you need a function parameter’s type inferred from the target type.

## How do you do exhaustive checking on a union using never? (M)

In the branch that should be unreachable, assign the narrowed value to something typed `never`. If every member of the union has been handled, the compiler has narrowed the value to `never` at that point and the assignment is fine. If any member is left, the value is that member and the assignment is a compile error.

```
function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'square': return s.size ** 2;
    default: {
      const _exhaustive: never = s;
      throw new Error(`unhandled shape: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

I keep the `throw` as well as the type-level check, because the union describes what the program believes and data from outside can still violate it. The check is for the developer, the throw is for production.

### What happens to that check when someone adds a new member to the union?

The new member reaches the default branch, so the value there is that member rather than `never`, and the assignment fails to compile with a message naming the type that is not handled. That is the entire point — it converts "somebody added a shape and forgot the renderer" from a bug found in QA into a build failure found in the same commit.

It is also why I put the union in one place and let everything switch on it. Add a case to the union and the compiler walks you around every switch statement that needs updating, which is the closest TypeScript gets to a sealed type with pattern matching.

The related settings are `noFallthroughCasesInSwitch`, and `noImplicitReturns` if you are returning from each case — together they close the other ways a switch quietly does nothing.

## What’s the difference between union and intersection types? (M)

`A | B` means the value is one of them, so until you narrow you can only use what all members have in common. `A & B` means the value satisfies both at once, so you can use everything either of them has.

The part that trips people up is that for object types the effect on properties is inverted from what the symbols suggest. A union of objects gives you the intersection of their properties; an intersection of objects gives you the union of their properties. It makes sense once you think in terms of sets of values rather than sets of keys — a union is a bigger set of values, so less is guaranteed about any one of them.

```
type A = { a: string; shared: string };
type B = { b: number; shared: string };

declare const u: A | B;
u.shared;   // ok — on both
u.a;        // error — not guaranteed

declare const i: A & B;
i.a; i.b;   // both fine

type Impossible = string & number;   // never
```

Intersecting primitives with nothing in common gives `never`, and intersecting object types with a same-named property of incompatible types gives a property of type `never` — which is a value you can never supply, so the error appears at the assignment rather than at the declaration.

## What are type guards and type predicates (x is T)? (M)

A type guard is any expression the compiler recognises as narrowing — `typeof`, `instanceof`, `in`, `Array.isArray`, a truthiness check, comparing a discriminant against a literal. Control-flow analysis tracks the narrowing through branches, early returns and the rest of the function.

A type predicate is how you write your own. A function returning `x is T` tells the compiler that a `true` return means the argument is a `T`, so calling it inside an `if` narrows at the call site the same way a built-in guard would.

```
type Cat = { meow(): void };
type Dog = { bark(): void };

function isCat(a: Cat | Dog): a is Cat {
  return 'meow' in a;
}

function speak(a: Cat | Dog) {
  if (isCat(a)) a.meow();   // narrowed to Cat
  else a.bark();            // narrowed to Dog
}
```

The one caveat is that the compiler trusts the annotation and does not verify the body against it. A wrong predicate is a lie the type system adopts and propagates, so I keep the body as dumb and total as possible and, for anything non-trivial, use a schema’s guard instead of hand-writing one.

### When would you write a custom predicate instead of relying on narrowing?

Whenever the check has to live in a function. A helper returning plain `boolean` does not narrow anything at the call site — the compiler cannot see through the call — so you get the check but still have to assert afterwards, which defeats it.

The common cases are a reusable shape check across several call sites, filtering (`items.filter(isDefined)` gives `T[]` instead of `(T | undefined)[]` only because the predicate is there), and anything where the logic is more than one condition and you do not want it inlined everywhere.

The relative is the assertion function, `function assertUser(x: unknown): asserts x is User`, which narrows for the rest of the scope instead of inside an `if` and throws on failure. It needs an explicit type annotation on the variable holding it, which catches people out. TypeScript 5.5 also started inferring predicates for simple one-expression functions, so some of the hand-written ones are no longer necessary.

## How does type narrowing work with typeof, instanceof and in? (M)

`typeof` narrows primitives. The compiler special-cases the small set of strings it can return, so `typeof x === 'string'` narrows to `string` and the `else` removes it from the union. The trap is `typeof null === 'object'`, so a `typeof x === 'object'` check narrows to `T | null` and you still need the null test.

`instanceof` narrows by prototype chain, so it works for classes and for built-ins like `Error`, `Date` and `Map`. It fails across realms — an array from an iframe or a Node vm is not `instanceof` your `Array` — and it can behave oddly for classes transpiled to ES5. `Array.isArray` exists precisely to be realm-safe.

`in` narrows by property presence, which is how you discriminate object shapes that have no shared tag field. It is a weaker signal than a discriminant, because it only proves the key exists, but it is the right tool for union members that genuinely differ by which properties they carry.

```
function f(x: string | number | Date | { a: 1 } | { b: 2 }) {
  if (typeof x === 'string') x.toUpperCase();
  else if (typeof x === 'number') x.toFixed(2);
  else if (x instanceof Date) x.getTime();
  else if ('a' in x) x.a;
  else x.b;
}
```

Two things that undo narrowing are worth mentioning. Narrowing on a property of an object does not survive a function call or an `await`, because the compiler assumes the object could have been mutated — copy it into a `const` first. And a narrowed variable captured in a closure reverts to its declared type inside the closure if the variable is a `let`.

## What are mapped types and conditional types? (H)

A mapped type builds a new object type by walking the keys of an existing one: `{ [K in keyof T]: … }`. You can add or remove `?` and `readonly` with `+` and `-`, transform the value type, and since 4.1 rename the keys with an `as` clause — which also lets you drop keys by mapping them to `never`.

A conditional type is a type-level ternary: `T extends U ? X : Y`. When the checked type is a naked type parameter it distributes over unions, so `Conditional<A | B>` becomes `Conditional<A> | Conditional<B>`. That distribution is how `Exclude` and `Extract` work, and wrapping both sides in tuples (`[T] extends [U]`) is how you switch it off when you want to test the union as a whole.

Together they are what the whole standard utility library is built from, and what lets you derive types instead of maintaining parallel copies of them by hand.

```
type Optional<T> = { [K in keyof T]+?: T[K] };
type Mutable<T>  = { -readonly [K in keyof T]: T[K] };

type Getters<T> = { [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] };
// { getId: () => string; getAge: () => number }

type Exclude1<T, U> = T extends U ? never : T;   // distributes over the union
```

### Write a type that makes every property of T optional except one.

```
type OptionalExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;

type User = { id: string; name: string; email?: string };
type Patch = OptionalExcept<User, 'id'>;
// { id: string; name?: string; email?: string }
```

The `Required` around the `Pick` matters if the kept key was already optional in `T` — without it you would preserve the original optionality rather than forcing it. If I wanted a single flat object type in the tooltip rather than an intersection I would wrap the result in an identity mapped type, `{ [P in keyof X]: X[P] }`, which is the usual `Prettify` helper.

## What are template literal types? (H)

They are string literal types built by interpolation: `` type EventName<K extends string> = `on${Capitalize<K>}` ``. The interpolated positions accept string literal types, and if you interpolate a union the result is every combination, so it cross-multiplies — two unions of four members give sixteen literals.

They come with the four intrinsic case helpers — `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` — and they combine with `infer` to pull structure out of a string type, which is how typed routers extract path parameters.

```
type Margin = `margin-${'top' | 'right' | 'bottom' | 'left'}`;
// 'margin-top' | 'margin-right' | 'margin-bottom' | 'margin-left'

type Params<S extends string> =
  S extends `${string}:${infer P}/${infer Rest}` ? P | Params<Rest>
  : S extends `${string}:${infer P}` ? P
  : never;

type P = Params<'/users/:userId/posts/:postId'>;   // 'userId' | 'postId'
```

I use them for event handler names on a mapped type, prefixed keys, CSS-ish value types, i18n key checking, and typed query builders. The thing to watch is that they are eager — a union that cross-multiplies past the compiler’s limit (100,000 members) is a hard error, and even well below that they can dominate compile time, so I keep them shallow in application code.

## What do keyof and indexed access (T[K]) do? (M)

`keyof T` gives the union of T’s key names as literal types — `keyof { id: string; age: number }` is `'id' | 'age'`. For a type with a string index signature it is `string | number`, and for an array it is all the array method names plus `number`, which surprises people the first time.

Indexed access `T[K]` gives the type of that property. `K` can be a union, so `T['id' | 'age']` is `string | number`, and `T[keyof T]` is the union of all value types. On arrays and tuples `T[number]` is the element type, which is the shortest way to say "whatever is in this array".

```
type User = { id: string; age: number };

type Keys   = keyof User;          // 'id' | 'age'
type Age    = User['age'];         // number
type Values = User[keyof User];    // string | number

const roles = ['admin', 'editor'] as const;
type Role = (typeof roles)[number];   // 'admin' | 'editor'
```

The pair is the main mechanism for deriving types from values rather than declaring them twice. `typeof` on a value plus `keyof` and an indexed access covers most of what you need to keep a constants object and its type in sync.

## When should you use an enum versus an as const union? (M)

I default to `as const` — either a plain string-literal union when the names are the values, or an `as const` object plus a derived union when I want a named lookup as well. It has no runtime cost beyond the object you actually wanted, it is structurally typed so a matching string from JSON just works, and the type is a plain union so everything that works on unions works on it.

I would use an enum when I am working in a codebase that already uses them consistently, or when I specifically want the nominal behaviour — an enum member is not interchangeable with a bare string, so it can stop you passing the wrong constant.

```
const Status = {
  Idle: 'idle',
  Active: 'active',
} as const;

type Status = (typeof Status)[keyof typeof Status];   // 'idle' | 'active'

Status.Active;              // 'active' — a real value, usable at runtime
const s: Status = 'idle';   // a plain string is fine
```

### What does a TypeScript enum compile to, and why do some teams avoid it?

A numeric enum compiles to an IIFE building an object with a two-way mapping — name to number and number back to name — so it emits runtime code and the reverse entries are dead weight. A string enum compiles to a one-way object, which is smaller but still emitted.

That emission is the main practical objection now. Enums are not type-only, so they do not survive tools that strip types without checking them — `isolatedModules`, esbuild and swc need special handling, Node’s built-in type stripping rejects them outright, and `const enum` (which inlines instead of emitting) does not work across compilation units at all.

The type-level objections are that enums are nominal in a structurally typed language, so a string from an API that matches a member exactly is still not assignable without a cast; and that numeric enums were historically unsound — any `number` was assignable to a numeric enum type, so `getStatus(47)` type-checked. TypeScript 5.0 tightened that, but the reputation stuck.

## What do the common utility types do — Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, NonNullable, ReturnType, Parameters, Awaited? (M)

The first three are modifier flips on an object type. `Partial<T>` makes every property optional, `Required<T>` makes every property required and strips `undefined` from the type, `Readonly<T>` marks every property readonly. All three are shallow — nested objects are untouched, which is the single most common surprise.

`Pick<T, K>` keeps the listed keys, `Omit<T, K>` removes them, `Record<K, V>` builds an object type from a union of keys to a value type. Worth knowing that `Pick` constrains `K extends keyof T` so a typo is an error, while `Omit` does not — `Omit<User, 'emial'>` compiles happily and silently omits nothing, which is a real source of stale types after a rename.

```
type Draft   = Partial<User>;
type Public  = Omit<User, 'passwordHash'>;
type ById    = Record<string, User>;
type Flags   = Record<'read' | 'write', boolean>;
```

`Exclude<T, U>` and `Extract<T, U>` filter a union — remove the members assignable to `U`, or keep only those. `NonNullable<T>` is `Exclude<T, null | undefined>`. These operate on unions, not on object keys, which is the distinction from `Omit` and `Pick`.

The last three are `infer`-based extraction from something that already exists. `ReturnType<F>` and `Parameters<F>` pull the return type and the parameter tuple off a function type — usually reached for via `typeof someFunction`. `Awaited<T>` unwraps a promise, recursively, so nested promises and thenables resolve down to the final value type; it is what `await` and `Promise.all` are typed with. On an overloaded function, `Parameters` and `ReturnType` only see the last overload.

## What does noUncheckedIndexedAccess do? (H)

It adds `| undefined` to the result of any index signature or numeric index access, because otherwise the compiler assumes `arr[i]` and `record[key]` always produce a value — which is simply false, and is the one remaining hole in `strictNullChecks`.

It is not in `strict`, and it is off by default, because it is genuinely noisy. The compiler does not track index bounds, so a loop guarded by `i < arr.length` still gives you `T | undefined`, and every lookup after a `hasOwnProperty` check needs handling too.

```
const arr = [1, 2, 3];
const first = arr[0];        // number | undefined

const map: Record<string, User> = {};
map['bob'].name;             // error — possibly undefined

for (const n of arr) n.toFixed();          // fine, for...of is not indexed
const [a] = arr;                           // still number | undefined
const t: [number, number] = [1, 2];
t[0].toFixed();                            // fine — tuple, known index
```

I turn it on for new code and libraries and live with the noise, because the bugs it finds are real ones — off-by-one lookups and missing map keys. The mitigations are iterating with `for...of` or the array methods instead of by index, pulling the value into a local `const` and guarding once, and using tuple types where the length is genuinely known.

## What’s the difference between @ts-ignore and @ts-expect-error, and which is better? (M)

Both suppress errors on the following line. The difference is what happens when there is no error: `@ts-expect-error` becomes an error itself, complaining that the directive is unused, while `@ts-ignore` sits there silently forever.

That makes `@ts-expect-error` self-cleaning, and it is the one to use. When the library ships better types, or someone fixes the underlying problem, the build tells you the suppression is now obsolete and you delete it. With `@ts-ignore` you accumulate suppressions that no longer suppress anything, and worse, ones that are now hiding a different, real error on that line.

```
// @ts-expect-error — upstream types are wrong, see PR #123
legacy.doThing(1);
```

Two practical notes. Both apply to one line only, so a multi-line expression needs care about which line the error is actually reported on. And both are blunter than the alternatives — a narrow `as` cast, a local type predicate, or a declaration-merged module augmentation all keep some checking, where these turn it off entirely. Whichever I use, it gets a comment saying why, because a bare suppression is unreviewable.

## How would you write a generic Stack class? (M)

```
class Stack<T> {
  #items: T[] = [];

  push(...items: T[]): void {
    this.#items.push(...items);
  }

  pop(): T | undefined {
    return this.#items.pop();
  }

  peek(): T | undefined {
    return this.#items.at(-1);
  }

  get size(): number {
    return this.#items.length;
  }

  get isEmpty(): boolean {
    return this.#items.length === 0;
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let i = this.#items.length - 1; i >= 0; i--) yield this.#items[i]!;
  }
}

const s = new Stack<number>();
s.push(1, 2);
s.pop();      // number | undefined
```

The details I would talk through: `pop` and `peek` return `T | undefined` rather than `T`, because the honest type of "maybe empty" is that union and the caller should handle it — the alternative is throwing, which is a valid design but has to be a deliberate choice. The backing array is a private field so nothing outside can mutate it. And the class parameter `T` is what keeps `pop` returning the element type instead of `any`, which is the whole point of making it generic rather than a `Stack` of `unknown` with casts at every use.

## How does optional chaining interact with optional types? (E)

`a?.b` evaluates to `undefined` if `a` is `null` or `undefined`, and otherwise reads `b`. On the type side the compiler removes `null` and `undefined` from `a` for the access and then adds `| undefined` to the result, so the resulting type is honest about the short circuit.

That only means anything under `strictNullChecks`. Without it the optional property was already assignable to everything, so the chain compiles either way and the type does not record that the result might be missing.

```
type User = { profile?: { name: string } };

declare const u: User;
u.profile?.name;              // string | undefined
u.profile?.name ?? 'anon';    // string

u.profile?.name.trim();       // safe on profile, NOT on name
u.getName?.();                // call form — no error if the method is absent
u.list?.[0];                  // index form
```

The two things to be careful about: it short-circuits the whole chain rather than just the next link, so `a?.b.c` protects `a` and nothing else — if `b` is also optional it needs its own `?.`. And a `?.` on a value the compiler already knows is non-nullable is a sign the type is wrong somewhere; `no-unnecessary-condition` in typescript-eslint flags those, and they are usually worth chasing rather than leaving in as insurance.
