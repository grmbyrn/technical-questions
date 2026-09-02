---
slug: vue-nuxt
order: 15
number: '13'
group: FRAMEWORKS
title: Vue / Nuxt
status: answered
---

## How does Vue’s reactivity system track dependencies? (H)

Vue tracks dependencies at runtime by observing which reactive properties are read while a function is running.

When you call `reactive()`, you get a `Proxy` around the object. The `get` trap calls `track(target, key)` and the `set` trap calls `trigger(target, key)`. A `ref` does the same thing without a Proxy — it is a plain object with a `value` getter and setter that call the same two functions.

The bookkeeping lives in a module-level `targetMap`: a `WeakMap` keyed by the raw object, whose value is a `Map` keyed by property, whose value is a `Set` of the effects that read that property. There is also a module-level `activeEffect` pointing at whichever effect is currently running.

```
// roughly what track and trigger do
let activeEffect = null;
const targetMap = new WeakMap();

function track(target, key) {
  if (!activeEffect) return;
  let deps = targetMap.get(target);
  if (!deps) targetMap.set(target, (deps = new Map()));
  let dep = deps.get(key);
  if (!dep) deps.set(key, (dep = new Set()));
  dep.add(activeEffect);
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key);
  if (dep) for (const effect of dep) effect.schedule();
}
```

So the whole mechanism is: running an effect sets `activeEffect`, every reactive read during that run registers the effect against that exact property, and a write to that property looks up the set and re-runs whatever is in it.

Two consequences worth stating. Tracking is per-property, not per-object, so mutating `user.name` does not re-run something that only read `user.email`. And because `activeEffect` is only set during a run, a reactive read outside any effect — in an event handler, in a `setTimeout` — tracks nothing, which is correct but surprises people who expect the read itself to create a subscription.

This is why Vue needs no compiler for reactivity. Svelte works out dependencies statically at build time; Vue works them out dynamically at run time. The cost is the Proxy overhead and the bookkeeping; the benefit is that it works on any value from anywhere, including data that crossed a module or function boundary.

### What is a reactive effect, and when is it re-run?

A reactive effect is a function Vue runs with `activeEffect` pointed at it, so that every reactive property read during the run is recorded as a dependency. It re-runs when any of those recorded properties is written.

Everything reactive in Vue is one of these. A component's render function is an effect — that is how a template re-renders. `computed` is an effect with caching and lazy evaluation. `watch` and `watchEffect` are effects with a user callback attached.

Dependencies are recollected on every run, not accumulated. Before re-running, Vue cleans up the previous subscriptions, so branches are handled correctly:

```
watchEffect(() => {
  if (!show.value) return;
  console.log(user.name);
});
```

While `show` is false the effect never reads `user.name`, so it is not subscribed to it and changing the name does nothing. Flip `show` to true and the next run reads it and picks up the subscription. This is why "my watcher stopped firing" is usually an early return that skipped the read.

Re-runs are not synchronous. A trigger pushes the effect onto a queue, deduplicated, flushed on the next microtask — so mutating fifty properties in a loop produces one re-render, and reading the DOM straight after a mutation gives you the old DOM until `nextTick`. Watchers can opt into different timing with `flush: 'post'` (after the DOM updates, the default for `watchEffect` in a component) or `flush: 'sync'`.

Effects are also tied to a scope. Ones created during `setup` belong to the component's `EffectScope` and are disposed when it unmounts; ones created outside a component — in a composable called from a module, say — are not, and leak until you stop them yourself or wrap them in `effectScope()`.

## What’s the difference between ref and reactive, and why does ref need .value? (M)

`reactive()` takes an object and returns a `Proxy` of it. You use the properties directly — `state.count++` — and the proxy intercepts the access.

`ref()` takes any value and returns an object with a single `value` property, whose getter and setter do the tracking. So you write `count.value++` in script, and just `count` in the template, because the compiler unwraps top-level refs for you.

```
const count = ref(0);
const state = reactive({ count: 0 });

count.value++;
state.count++;
```

The `.value` exists because there has to be a property access to intercept. JavaScript gives you no hook for reading a variable — `count` on its own compiles to a plain binding lookup and nothing can observe it. Boxing the value inside an object turns the read into a property access on that object, which a getter can trap.

I default to `ref` for everything. It works for primitives and objects alike, it survives reassignment (`list.value = []` is fine, where a `reactive` array cannot be replaced), the `.value` is a visible marker that this thing is reactive, and it does not silently lose reactivity when destructured. The cost is the `.value` noise in script blocks, which is a real ergonomic tax and the main argument the other way.

`reactive` earns its place for a cohesive group of related state you always touch together — a form model, say — where `form.email` reads better than `form.value.email`. Its limitations are that it only accepts objects, it cannot be replaced wholesale, and it loses reactivity if you destructure or spread it.

Worth knowing that they are not separate systems: `ref` with an object value wraps that object in `reactive` internally, so `user.value.name` is deeply reactive too.

### Why can a ref hold a primitive when reactive cannot?

`reactive` is implemented with `Proxy`, and `new Proxy()` requires an object target — you cannot proxy the number `5`. Even if you could, primitives are immutable and copied by value, so there would be nothing to observe: passing `5` around hands out copies, not references to a shared cell.

`ref` sidesteps this by not proxying the value at all. It creates a wrapper object and stores the value in a private field, then exposes it through an accessor:

```
class RefImpl {
  constructor(value) { this._value = value }
  get value() { track(this, 'value'); return this._value }
  set value(v) { this._value = v; trigger(this, 'value') }
}
```

The reactivity is on the wrapper's `value` property, which is a normal object property and therefore trappable. What is inside is irrelevant — a number, a string, `null`, a DOM node, a class instance. That indirection is also what makes a ref shareable: the wrapper is a stable reference you can pass between modules and functions while the value inside changes.

## Why can reactivity be lost when you destructure a reactive object, and how do you fix it? (M)

Because destructuring reads the property. The Proxy's `get` trap fires once, hands back the current value, and the binding you are left with is an ordinary variable holding that value — there is no live link back to the object.

```
const state = reactive({ count: 0 });
const { count } = state;   // count is the number 0, permanently

state.count++;             // state.count is 1, count is still 0
```

For a primitive this is unavoidable: the value was copied and the connection is gone. If the property held an object you keep *its* reactivity, because you copied a reference to a nested proxy — which is why this bug is intermittent and confusing.

The fix is `toRefs`, which converts each property into a ref that reads and writes through to the original object:

```
const { count } = toRefs(state);
count.value++;             // writes back to state.count
```

`toRef(state, 'count')` does one property, and works even if the key does not exist yet. The cost is that you are back to `.value`.

The same trap catches passing `state.count` into a function — the function receives a number, not a reactive source — which is why `watch(() => state.count, ...)` needs a getter rather than the value itself.

Props are the case that bites most often, since `const { modelValue } = props` freezes the prop at its first value. Historically the answer was `toRefs(props)`. Since Vue 3.5, reactive props destructuring is stable: the compiler rewrites destructured props back into `props.x` accesses, so `const { modelValue } = defineProps<Props>()` stays reactive. That only applies to props in `<script setup>`, not to `reactive` objects generally.

In practice I avoid the problem rather than patching it: use `ref` for state and destructure objects only at the point of use, inside the template or inside a computed, where the read happens during an effect and gets tracked normally.

## What’s the difference between computed, watch and watchEffect? (M)

`computed` derives a value. It is lazy — the getter does not run until something reads it — and it caches, so repeated reads cost nothing until a dependency changes. It should be pure: no fetching, no mutation, no DOM.

`watch` reacts to a change in an explicit source. You name what to watch, you get the old and new values, and it does not run on setup unless you pass `immediate: true`.

`watchEffect` reacts to a change in whatever it happens to read. Dependencies are collected automatically, it runs immediately on creation, and there is no old value.

```
const first = ref('Ada'), last = ref('Lovelace');

const full = computed(() => `${first.value} ${last.value}`);

watch(userId, async (id, prevId) => {
  user.value = await fetchUser(id);
});

watchEffect(() => {
  document.title = `${full.value} — profile`;
});
```

The rule I use: if the question is "what is this value", it is a `computed`. If the question is "what should happen when this changes", it is a watcher. Reaching for a watcher to assign to another ref is nearly always a computed written the long way — it costs an extra render pass and can go stale.

Between the two watchers, `watch` for anything where you care about the specific source, need the previous value, or want laziness — a fetch keyed on an id is the canonical case. `watchEffect` for a side effect with several dependencies where enumerating them is noise, like syncing to `localStorage` or the document title. The risk with `watchEffect` is over-subscription: it tracks every reactive read in the body, including ones incidental to the effect, and it stops tracking anything after the first `await` because the dependency collection only covers the synchronous portion of the run.

### Which one caches, and which runs immediately by default?

`computed` caches. Its value is stored and only recalculated when a dependency has actually changed, so reading it ten times in a template runs the getter once. Neither watcher caches anything — they return no value.

`watchEffect` runs immediately, because it has to execute the body once to discover what to depend on. `watch` does not run initially; it fires on the next change, unless you pass `{ immediate: true }`.

`computed` is also lazy in the other direction: it does not even run on creation. If nothing ever reads it, the getter never executes — which is a genuine gotcha if you put a side effect in one and wonder why it never happened.

## When would you use shallowRef or shallowReactive? (H)

When deep reactivity is either wasted or actively harmful.

`ref` and `reactive` are deep: every nested object accessed through them gets wrapped in its own Proxy on access. The shallow variants only track the top level — `shallowRef` triggers when `.value` is reassigned, `shallowReactive` when a root property is assigned — and hand back nested values raw.

Three situations where I reach for them.

**Large, immutable data.** A ten-thousand-row table you replace wholesale rather than mutate in place. Deep reactivity means proxying every row and every cell on access to detect mutations you never make. `shallowRef` plus reassignment gives identical behaviour at a fraction of the cost.

```
const rows = shallowRef([]);
rows.value = await fetchRows();          // triggers
rows.value[0].name = 'x';                // does not, by design
```

**Non-plain objects from outside Vue.** A Chart.js instance, a Leaflet map, a CodeMirror editor, a WebSocket, a class with private fields. Wrapping these in a Proxy is at best pointless and at worst breaks them — internal identity checks fail because `this` is the proxy rather than the raw object, and some libraries hold references that no longer match. `shallowRef` for these, or `markRaw` to permanently exclude an object from ever being made reactive.

**Very hot state** where you want to control exactly when downstream effects fire, batching many mutations and then calling `triggerRef` once to force the update.

The trade is that you now own the invalidation. Anything mutating nested state silently does nothing, and that failure is quiet — no error, just a stale UI. So I treat them as an optimisation applied to a measured problem, not a default, and I write shallow state as replace-don't-mutate so the reactivity boundary is obvious from the call site.

## How does Vue 3’s Proxy-based reactivity differ from Vue 2’s Object.defineProperty? (H)

Vue 2 converted data eagerly. At initialisation it walked the whole `data` object and, for every property it found, replaced it with a getter/setter pair via `Object.defineProperty`. Arrays could not be handled that way, so Vue 2 patched the array prototype methods — `push`, `splice`, `sort` and the rest — on the observed array to trigger updates.

Vue 3 wraps the object itself in a `Proxy`, which intercepts operations on the object rather than on individual properties that existed at setup time.

```
// Vue 2 — per property, at init
Object.defineProperty(obj, 'count', { get() {...}, set(v) {...} });

// Vue 3 — per object, covering operations that don't exist yet
new Proxy(obj, { get(t, k) {...}, set(t, k, v) {...}, deleteProperty(t, k) {...} });
```

Three structural differences follow. Proxies intercept *operations* — `has`, `deleteProperty`, `ownKeys` — not just reads and writes of known keys, so property addition and deletion are observable. Conversion is lazy: Vue 3 proxies a nested object the first time you access it, rather than walking the entire tree up front, so initialising a large deep object costs almost nothing. And the raw object is untouched, where Vue 2 mutated your data object in place.

The costs are real but small. `Proxy` cannot be polyfilled, so Vue 3 dropped IE11. Every property access goes through a trap, so a single read is marginally slower than a `defineProperty` getter — comfortably repaid by not converting everything up front and by the compiler optimisations Vue 3 layers on top.

### What limitations of Vue 2 did Proxies remove?

Four that you actually hit in practice.

**Adding and removing properties.** `this.user.email = 'x'` on a property that did not exist at init was invisible, because no getter/setter had been installed for it. You needed `Vue.set(this.user, 'email', 'x')` and `Vue.delete`. In Vue 3 both are plain assignments.

**Array index and length.** `arr[0] = 'x'` and `arr.length = 0` did not trigger, hence `Vue.set(arr, 0, 'x')` and `arr.splice(0)`. Proxies trap index assignment like any other key, so both work.

**Map and Set.** Vue 2 could not observe them at all, since `defineProperty` cannot intercept `map.set()`. Vue 3 ships dedicated collection handlers, so `Map`, `Set`, `WeakMap` and `WeakSet` are reactive.

**Initialisation cost on large objects.** The full recursive walk at startup was proportional to the size of the data, whether or not you ever read most of it. Lazy proxying makes it proportional to what you touch.

Vue 2 also required every property to be declared in `data` up front just so it would be converted — a piece of boilerplate that disappears entirely.

## What are the tradeoffs between the Composition API and the Options API? (M)

The Options API organises a component by *kind of thing*: `data`, `computed`, `methods`, `watch`, lifecycle hooks. The Composition API organises it by *concern*: everything for one feature — its state, its derived values, its watchers, its lifecycle — sits together in `setup`, and can be lifted into a function.

The Composition API wins on three things.

**Logic reuse.** A composable is a function that returns values. It takes arguments, its return is explicit, and two of them cannot collide. Mixins, the Options API answer, merged into a shared namespace and could not do any of that.

**TypeScript.** `setup` is a normal function over normal variables, so inference just works. The Options API has to infer types through `this`, which requires a lot of machinery in Vue's own type definitions and still degrades on anything complex.

**Scaling within a file.** In a 400-line Options component, one feature is smeared across five blocks and following it means scrolling between them. In a Composition component the feature is contiguous, and once it is contiguous it is extractable.

The Options API wins on structure and floor. There is exactly one place for each thing, which makes unfamiliar components predictable and is genuinely valuable across a large team with mixed experience. `this`-based access avoids `.value` entirely. And for a component that is a bit of state and two methods, it is less ceremony.

The costs of the Composition API are that it gives you no structure for free — a badly written `setup` is a 300-line procedural blob — and that `.value` and reactivity loss on destructuring are real footguns the Options API does not have.

Practically: new work in Composition API with `<script setup>`, which is what the docs, the ecosystem and Vue's own tooling now assume. It also generates smaller output, since Options API components carry runtime machinery that cannot be tree-shaken. I would not migrate a working Options codebase wholesale — they interoperate per component, so the boundary can move gradually.

## What does script setup simplify? (M)

`<script setup>` is compile-time sugar over `setup()`. The body of the block becomes the body of the setup function, and the compiler wires up everything you would otherwise do by hand.

```
<script setup lang="ts">
import { ref } from 'vue';
import UserCard from './UserCard.vue';

const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ select: [id: string] }>();
const count = ref(0);
</script>

<template>
  <UserCard :id="props.userId" @click="emit('select', props.userId)" />
  <button @click="count++">{{ count }}</button>
</template>
```

What it removes:

**The return statement.** Every top-level binding — variables, functions, imports — is exposed to the template automatically. No more maintaining a return object and wondering why a value is undefined in the template.

**Component registration.** An imported component is usable in the template directly; no `components: { UserCard }`.

**The `props`/`context` plumbing.** `defineProps`, `defineEmits`, `defineModel`, `defineSlots`, `defineExpose` and `defineOptions` are compiler macros — they are compiled away, not called at runtime, which is why they can only appear at the top level of the block and cannot be imported into a helper.

**Type declarations.** Props and emits can be declared purely as TypeScript types, and the compiler generates the runtime declarations from them. This is not possible with plain `setup()`.

It is also faster. The template compiles into a render function inside the same scope, so bindings are accessed as local variables rather than through a render context proxy, and the compiler can mark whole subtrees as static.

The one behavioural change to know: a `<script setup>` component is closed by default. A parent holding a template ref gets nothing unless the child calls `defineExpose({ ... })`, where an Options component would expose everything. That is a deliberate encapsulation improvement, and it is the thing that surprises people migrating.

If you need options that run outside setup — `inheritAttrs: false`, a custom `name` — that is `defineOptions()`, or a second plain `<script>` block alongside.

## What is a composable, how would you write a simple one, and why are composables preferred over mixins? (M)

A composable is a function that uses Vue's reactivity APIs to encapsulate stateful logic. By convention it is named `useSomething`, it is called from `setup`, and it returns the reactive state and functions its caller needs.

```
// composables/useLocalStorage.ts
import { ref, watch, type Ref } from 'vue';

export function useLocalStorage<T>(key: string, initial: T): Ref<T> {
  const stored = localStorage.getItem(key);
  const value = ref<T>(stored ? JSON.parse(stored) : initial) as Ref<T>;

  watch(value, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true });

  return value;
}
```

```
const theme = useLocalStorage('theme', 'light');
```

One that owns a lifecycle registers and cleans up its own listeners, which is the part that makes composables genuinely compose:

```
export function useMouse() {
  const x = ref(0), y = ref(0);
  const update = (e: MouseEvent) => { x.value = e.clientX; y.value = e.clientY };

  onMounted(() => window.addEventListener('mousemove', update));
  onUnmounted(() => window.removeEventListener('mousemove', update));

  return { x, y };
}
```

The conventions that matter: call them synchronously at the top of `setup` so lifecycle hooks bind to the right component instance; return refs rather than raw values so the caller keeps reactivity; accept refs or getters as arguments and normalise with `toValue()` so callers can pass either; and return an object the caller can destructure, since refs survive destructuring.

They are preferred over mixins because a composable is just a function call. Its inputs are arguments, its outputs are a return value, and both are visible at the call site and typed.

### What problems did mixins cause that composables avoid?

**Name collisions.** Two mixins defining `loading` silently merged, with the component winning over the mixin and the last mixin winning over earlier ones. No error, no warning for data properties — just one of them quietly not working.

**Untraceable sources.** Reading a component using three mixins, `this.formatDate` came from *somewhere*. You grepped. With composables, `const { formatDate } = useDates()` names its own origin, and "go to definition" works.

**Implicit coupling.** Mixins commonly depended on the component defining a particular property, or on another mixin being present, with nothing expressing that. Composables take arguments, so the dependency is in the signature.

**No configuration.** A mixin could not take parameters — `useFetch(url)` had no mixin equivalent, so you got mixin factories, which were worse.

**Weak typing.** Everything arrived through `this`, so TypeScript needed complex merged-type machinery and often gave up. Composables are ordinary functions with ordinary inference.

The underlying difference: mixins merge into a shared namespace, composables return values into a scope you control. Everything above follows from that.

## How does v-model work, and how do you implement it on a custom component? (M)

On a native input, `v-model` binds the value and listens for input events, picking the right pair for the element — `value`/`input` for text, `checked`/`change` for a checkbox, `value`/`change` for a select. It also handles IME composition, which is the main reason to use it over wiring the two halves yourself.

On a component it is a prop plus an event. In Vue 3 the defaults are `modelValue` and `update:modelValue`. The modern way to implement it is `defineModel()`, which gives you a writable ref that declares the prop and the emit for you:

```
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>

<template>
  <input :value="model" @input="model = ($event.target as HTMLInputElement).value" />
</template>
```

Writing to `model` emits; reading it gives the current prop value. Before 3.4 you wrote both halves explicitly:

```
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
```

The important property is that this stays one-way: the child never mutates the prop, it asks the parent to change it. If the parent binds something that does not write back, the value simply does not change — no hidden two-way link, no mutation warning.

For a wrapper around a native input where you have nothing to add, `defineModel` is still worth it over `v-bind="$attrs"` because it gives you a typed, named contract.

### What is it syntactic sugar for, and how do you support multiple v-models?

`<Child v-model="foo" />` compiles to:

```
<Child :model-value="foo" @update:model-value="foo = $event" />
```

Named models take an argument, which changes the prop and event names to match: `v-model:title="x"` becomes `:title="x" @update:title="x = $event"`. There is no limit on how many a component takes.

```
<script setup lang="ts">
const first = defineModel<string>('first');
const last = defineModel<string>('last');
</script>

<!-- parent -->
<NameFields v-model:first="user.first" v-model:last="user.last" />
```

Modifiers work too. Built-in ones (`.trim`, `.number`, `.lazy`) apply to native elements; on a component you receive them and decide what they mean. `defineModel` hands them back as the second tuple element along with a transform hook:

```
const [model, modifiers] = defineModel<string>({
  set(value) { return modifiers.capitalise ? value[0].toUpperCase() + value.slice(1) : value },
});
```

The Vue 2 differences are worth knowing if you are migrating: there was only one `v-model` per component, the prop was `value` and the event `input`, customising them meant a `model: { prop, event }` option, and the separate `.sync` modifier covered the multi-binding case. Vue 3 folded `.sync` into named `v-model` and removed it.

## What’s the difference between v-if and v-show? (E)

`v-if` controls whether the element exists. When false, nothing is rendered — no DOM node, and for a component, no instance: it is not created, its lifecycle hooks never run, its watchers do not exist. Toggling it mounts and unmounts.

`v-show` always renders the element and toggles `display: none` on it. The DOM node and the component instance persist; only the CSS changes.

So the trade is initial cost against toggle cost. `v-if` is cheaper if the condition is rarely true and never changes; `v-show` is cheaper if it flips often, because toggling a style is far cheaper than creating and destroying a subtree.

The behavioural difference usually matters more than the performance one. `v-if` resets state — a form inside it loses its contents, a component re-runs `onMounted` and refetches on every toggle. `v-show` preserves everything, which is what you want for a dropdown or a tab panel you return to, and not what you want if the content must be fresh each time.

Two practical notes. `v-show` does not work on `<template>`, because there is no element to style, and it has no `v-else`. And `v-if` is the only correct choice when the content must not exist — a permission-gated section, or a child that would crash on null data, since `v-show` still renders and still runs its setup.

## Why do v-for items need a key? (E)

The key gives each item a stable identity, so that when the list changes Vue can tell which vnodes correspond to which — that this item moved rather than that its contents changed.

Without a key Vue uses an in-place patch strategy: it matches old and new nodes by index and patches each one's contents. For a static list that is fine and marginally faster. The moment the list reorders, is filtered, or has items inserted anywhere but the end, index-matching is wrong — Vue patches the DOM node that was showing item A to display item B, reusing the element.

For plain text output you would not notice. What breaks is state attached to the element rather than to the data: the value typed into an input, focus and selection, a checkbox's checked state, a component's internal state, a CSS transition mid-flight, a video's playback position. The classic symptom is deleting the first row of a list and watching the text you typed stay in place while the labels shift up by one.

```
<li v-for="user in users" :key="user.id">{{ user.name }}</li>
```

The key must be unique among siblings and stable across renders for the same item. A database id is ideal. The index is the anti-pattern: it is exactly the behaviour you get without a key, so it silences the lint rule without fixing anything — acceptable only when the list is genuinely static. `Math.random()` is worse: every key changes on every render, so Vue destroys and recreates the entire list each time.

Keys are also what let you deliberately force a remount — putting `:key="userId"` on a component makes changing the id throw away the old instance and build a fresh one, which is often cleaner than a watcher that resets six refs.

## How do you define typed props and emit typed events? (M)

With `<script setup lang="ts">` you declare both as type arguments and the compiler generates the runtime declarations.

```
<script setup lang="ts">
interface Props {
  userId: string;
  role?: 'admin' | 'viewer';
  tags?: string[];
}

const { role = 'viewer', tags = () => [] } = defineProps<Props>();

const emit = defineEmits<{
  select: [id: string];
  update: [id: string, changes: Partial<User>];
  close: [];
}>();
</script>
```

Optional properties on the interface become optional props; a union type is enforced by TypeScript at every call site in the template, which is where most prop bugs would otherwise surface at runtime.

For defaults, the modern form is destructuring with plain JavaScript defaults, stable since 3.5 — the compiler keeps them reactive. Before that you needed `withDefaults(defineProps<Props>(), { role: 'viewer' })`, which still works and is what you will see in older code. Object and array defaults need a factory function in `withDefaults`, same as the runtime API.

The emits type is a map of event name to argument tuple — `close: []` is an event with no payload. That gives you autocomplete on `emit('...')`, an error on a misspelled event name, and checked argument types. The older call-signature form `(e: 'select', id: string): void` means the same thing and is more verbose.

Declaring emits at all is worth doing even untyped: a declared event is removed from `$attrs`, so it stops falling through to the root element as a native listener and firing twice.

Two constraints. The type has to be resolvable by the compiler — since 3.3 it can follow imported types and use generics, but not arbitrary computed types. And you cannot pass a generic parameter through unless the component is generic, which is what `<script setup lang="ts" generic="T">` is for.

## What’s the difference between default, named and scoped slots? (M)

A **default slot** is the unnamed content hole. Anything the parent puts inside the component's tags lands there.

**Named slots** let a component have several holes. The child declares `<slot name="header" />`, the parent fills it with `<template #header>`. Everything not in a named template goes to the default slot.

**Scoped slots** pass data the other way: the child binds values onto the `<slot>` element, and the parent receives them as a slot prop. That is what lets a component own logic and behaviour while the parent owns the markup.

```
<!-- DataTable.vue -->
<template>
  <slot name="header" :count="rows.length">
    <h2>{{ rows.length }} rows</h2>
  </slot>

  <tr v-for="row in rows" :key="row.id">
    <slot name="row" :row="row" :selected="row.id === selectedId" />
  </tr>
</template>
```

```
<DataTable :rows="users">
  <template #header="{ count }">
    <h2>{{ count }} users</h2>
  </template>

  <template #row="{ row, selected }">
    <td :class="{ active: selected }">{{ row.name }}</td>
  </template>
</DataTable>
```

Content inside `<slot>` is the fallback, rendered when the parent supplies nothing. `$slots` tells you at runtime which slots were passed, so you can skip rendering a wrapper for an empty slot.

The distinction that matters is scope, and it is the reason the third kind exists. Slot content is compiled in the *parent's* scope, so it can only see the parent's data. A scoped slot is the child explicitly handing values out through the slot's props, which is how it can render rows it does not know the shape of.

Named and scoped are not exclusive — most useful slots are both. The shorthand is `#name`, dynamic names are `#[key]`, and `v-slot` without a name on the component tag is the default slot's scope.

Typing them is `defineSlots<{ row(props: { row: User }): any }>()`, which gives the parent autocomplete on the slot props.

## What are provide and inject used for, and what are the pitfalls? (M)

They pass values down a component tree without threading props through every level. An ancestor calls `provide(key, value)`, any descendant at any depth calls `inject(key)`. It is Vue's dependency injection, and the direct equivalent of React context.

```
// keys.ts
import type { InjectionKey, Ref } from 'vue';
export const themeKey = Symbol() as InjectionKey<Ref<'light' | 'dark'>>;

// ancestor
const theme = ref<'light' | 'dark'>('light');
provide(themeKey, theme);

// descendant, any depth
const theme = inject(themeKey, ref('light'));
```

The typical uses are app-level configuration (theme, locale, feature flags), and compound components — a `<Tabs>` providing state its `<Tab>` children consume without the user wiring them together.

The pitfalls:

**Losing reactivity.** `provide('count', count.value)` provides a number, once. Provide the ref itself, and let descendants unwrap it. If you provide a `reactive` object, do not destructure it on the way in either.

**Uncontrolled mutation.** Any descendant can write to a provided ref, and there is nothing at the injection site saying who did. Provide `readonly(state)` along with explicit mutator functions, so writes go through a named function you can find.

**String keys.** They collide across libraries and give you `unknown` on inject. A `Symbol` typed as `InjectionKey<T>` in a shared module fixes both, and makes the provider and consumer type-check against each other.

**Missing providers.** `inject('key')` returns `undefined` if nothing provided it, and you find out via a null error deep in a child. Pass a default, or throw explicitly in a small `useTheme()` wrapper so the failure names itself.

**Only works during setup**, and only downwards. Calling `inject` in an event handler or after an `await` returns undefined because there is no current instance. And it does not reach `<Teleport>`ed content's new location — teleport moves DOM, not the component tree, so injection still follows the logical parent, which is usually what you want.

The bigger judgement call is that provide/inject makes coupling invisible — a component's real dependencies are no longer in its props. I keep it for genuinely ambient concerns and compound components, and reach for a Pinia store when the state is application state rather than tree-scoped context.

## What are the main lifecycle hooks, and their Composition API equivalents? (M)

The mapping is mechanical for most of them — the Options hook becomes an `on`-prefixed function you call inside `setup`:

- `beforeMount` / `mounted` become `onBeforeMount` / `onMounted`
- `beforeUpdate` / `updated` become `onBeforeUpdate` / `onUpdated`
- `beforeUnmount` / `unmounted` become `onBeforeUnmount` / `onUnmounted`
- `errorCaptured` becomes `onErrorCaptured`
- `activated` / `deactivated` become `onActivated` / `onDeactivated`

The two creation hooks are the exception. `beforeCreate` and `created` have no equivalent, because `setup` runs before both — code that would have gone in `created` just goes in the setup body.

What each is actually for:

`onMounted` — the component's DOM exists and template refs are populated. Anything touching the real DOM, measuring an element, initialising a third-party library that needs a node, or starting a client-only subscription. It does not run during SSR, which makes it the standard place for browser-only work.

`onUnmounted` — cleanup. Listeners, intervals, observers, sockets, anything a library asked you to `destroy()`. Watchers and effects created in `setup` are disposed automatically, so those need nothing.

`onBeforeUnmount` — when you need the DOM or the state still intact while tearing down, such as saving scroll position.

`onUpdated` — after the component re-rendered and the DOM is patched. Rarely the right tool; mutating state in it re-renders and loops. A `watch` on the specific thing you care about is almost always better.

`onErrorCaptured` — catches errors from descendants; return `false` to stop propagation.

`onActivated` / `onDeactivated` — only fire inside `<KeepAlive>`, where a cached component is not unmounted. If you have logic in `onMounted` that must run every time the user returns to a cached view, it belongs in `onActivated`.

Hooks must be registered synchronously during `setup` — after an `await` there is no active instance and the registration silently does nothing.

## What is nextTick, and why is it needed? (M)

`nextTick` returns a promise that resolves after Vue has flushed pending DOM updates.

It is needed because state changes do not update the DOM synchronously. Mutating a ref queues the component's render effect on an internal job queue, deduplicated, and Vue flushes that queue on the next microtask. That batching is what makes a loop of fifty mutations produce one re-render rather than fifty — but it means the DOM is stale on the line right after the assignment.

```
const items = ref<string[]>([]);
const list = ref<HTMLElement>();

async function add(item: string) {
  items.value.push(item);
  console.log(list.value.children.length);   // old count — DOM not patched yet

  await nextTick();
  list.value.scrollTop = list.value.scrollHeight;   // now correct
}
```

The cases where you need it are all "act on the DOM that this state change produces": scrolling to a newly rendered element, focusing an input that a `v-if` just revealed, measuring an element whose content changed, or handing a fresh node to a third-party library.

`await nextTick()` is the usual form; it also takes a callback. Inside a watcher, `{ flush: 'post' }` does the same job declaratively — the callback runs after the DOM update rather than before it — and is cleaner than putting `nextTick` in the body.

It is also essential in tests: after setting a value or dispatching an event, you `await nextTick()` (or the test utils' `wrapper.vm.$nextTick()`) before asserting on rendered output, otherwise you assert against the previous render.

The thing to watch for is `nextTick` used as a general "wait a bit" — if you need two of them in a row, the real dependency is usually a specific watcher or an `onMounted` in a child, and the ticks are papering over an ordering assumption that will break.

## What do Teleport and KeepAlive do? (M)

**`<Teleport>`** renders its children into a different place in the DOM while leaving them in the same place in the component tree.

```
<Teleport to="body">
  <div v-if="open" class="modal">…</div>
</Teleport>
```

The point is escaping CSS containment. A modal, dropdown, tooltip or toast rendered deep in the tree inherits `overflow: hidden`, `transform`, `z-index` stacking contexts and `position: relative` from its ancestors, and no amount of z-index fixes a stacking context. Teleporting to `<body>` sidesteps all of it.

What stays put is everything logical: props, events, `provide`/`inject`, the parent-child relationship. The component still belongs where it was written; only its DOM node moved. `disabled` toggles the teleport off, which is how you render inline on desktop and to body on mobile.

**`<KeepAlive>`** caches component instances instead of destroying them when they are switched away from.

```
<KeepAlive :max="10" :include="['SearchResults']">
  <component :is="currentTab" />
</KeepAlive>
```

Switching away deactivates rather than unmounts: state, scroll position and subscriptions survive, and switching back is a re-activation rather than a fresh mount and refetch. That is what you want for tab panels, a search results page a user navigates back to, or a multi-step form — anywhere losing state would be annoying and refetching would be wasteful.

The hooks change accordingly: `onMounted` fires once, and `onActivated`/`onDeactivated` fire on every switch, so anything that must happen per visit goes there.

The cost is memory and staleness — cached components keep their instances, their watchers and their listeners alive. Bound `:max` to evict least-recently-used, and use `include`/`exclude` to cache the few views that benefit rather than everything. In Vue Router, wrapping `<RouterView>` in `<KeepAlive>` is the standard pattern, usually with `include` naming specific routes.

## What problems do Suspense and async components solve? (M)

They address two different halves of "this part of the UI is not ready yet".

**`defineAsyncComponent`** solves code splitting. The component is a dynamic import, so its code is a separate chunk fetched on first use rather than shipped in the initial bundle. That is how you keep a heavy editor, chart library or admin panel out of the entry chunk.

```
const Chart = defineAsyncComponent({
  loader: () => import('./Chart.vue'),
  loadingComponent: Spinner,
  errorComponent: LoadFailed,
  delay: 200,
  timeout: 10000,
});
```

The options handle the awkward parts on their own: `delay` avoids a spinner flashing for a 50ms load, `timeout` bounds the wait, `errorComponent` gives you a retry path instead of a blank space.

**`<Suspense>`** solves coordinating asynchronous *setup*. A component with a top-level `await` in `<script setup>` is an async component in the other sense — its setup returns a promise — and Suspense is what renders a fallback until it resolves.

```
<Suspense>
  <UserDashboard :id="id" />
  <template #fallback>
    <DashboardSkeleton />
  </template>
</Suspense>
```

The value is that it hoists the loading state out of the component. Without it, every component that fetches carries its own `loading` ref, its own `error` ref and its own `v-if` ladder, and a page with four of them either shows four spinners or needs manual coordination. Suspense waits for *all* async dependencies in its subtree and shows one fallback, so you get a single coherent loading state and no cascade of layout shifts.

The caveats are real. Suspense is still marked experimental — the API has been stable in practice for a long time, but the docs say the details may change, and I would say so rather than pretend otherwise. It only catches async setup, not fetches started in `onMounted`. And it pairs with `onErrorCaptured` or an error boundary, since a rejected setup promise has to go somewhere.

In Nuxt most of this is handled for you: route components are code-split automatically, and `useAsyncData`/`useFetch` block navigation until resolved rather than needing Suspense directly.

## What is Pinia, and how does it differ from Vuex? (M)

Pinia is Vue's official state management library and the recommended replacement for Vuex. A store is a function that returns state, getters and actions — in the setup form, it is a composable that happens to be a singleton.

```
export const useCartStore = defineStore('cart', () => {
  const items = ref<Item[]>([]);

  const total = computed(() => items.value.reduce((n, i) => n + i.price, 0));

  async function add(id: string) {
    items.value.push(await fetchItem(id));
  }

  return { items, total, add };
});
```

```
const cart = useCartStore();
cart.add('abc');
const { total } = storeToRefs(cart);
```

The differences from Vuex:

**No mutations.** Vuex separated synchronous mutations from asynchronous actions, so every change needed a mutation, a `commit`, and usually an action wrapping it. Pinia has actions only, and they mutate state directly. That single change removes most of Vuex's boilerplate; the devtools time-travel that mutations existed to enable works fine without them.

**No modules, and no namespacing.** Vuex had one root store split into nested modules with string-namespaced paths (`commit('cart/items/add')`). Pinia has many flat stores, each with an id, imported and called directly. Stores use each other by calling each other, so cross-store access is a function call rather than a `rootGetters` path.

**Real TypeScript.** Everything is inferred from the store definition, because state and actions are ordinary values and functions rather than strings dispatched through a generic API. Vuex's `dispatch(type, payload)` is untypeable in any useful way, and Vuex 4's types were widely considered its weakest point.

**Smaller and tree-shakeable** — around 1.5kB, and unused stores are dropped.

The one gotcha is that destructuring a store breaks reactivity, exactly as it does for any reactive object: `storeToRefs` for state and getters, plain destructuring for actions since functions are not reactive.

Vuex is in maintenance mode and Pinia is the answer for new work. Worth adding that with the Composition API, a plain composable holding module-scoped refs covers a lot of the ground a store used to — Pinia earns its place through devtools, SSR state hydration, HMR and plugins, not because shared state needs a library any more.

## How does Vue Router handle params, navigation guards and lazy-loaded routes? (M)

**Params** come from dynamic segments in the path. `/users/:id` populates `route.params.id`, and you read it with `useRoute()`.

```
const route = useRoute();
watch(() => route.params.id, (id) => load(id), { immediate: true });
```

The thing that catches people is that navigating from `/users/1` to `/users/2` reuses the component — same route, different params — so `onMounted` does not run again. Either watch the param, as above, or put `:key="route.params.id"` on the `<RouterView>` to force a remount. Setting `props: true` on the route passes params in as props, which decouples the component from the router and makes it far easier to test.

**Guards** run in a pipeline before a navigation is confirmed. `router.beforeEach` is global, `beforeEnter` is per route, and `onBeforeRouteLeave`/`onBeforeRouteUpdate` are in-component. Returning `false` cancels, returning a location redirects, returning nothing continues.

```
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.user) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
});
```

Guards are async, so a navigation can await a session check — with the caveat that a slow guard is a slow navigation with no feedback, so anything nontrivial belongs behind a loading indicator. The `next()` callback style still works but the return-value form is what you want: forgetting to call `next()` hangs the router silently, and it is impossible to call twice by accident.

`meta` is the standard place to hang route-level policy (`requiresAuth`, roles, layout) so guards stay generic.

**Lazy loading** is a dynamic import in place of the component:

```
{ path: '/admin', component: () => import('./views/Admin.vue') }
```

The bundler splits that into its own chunk, fetched on first navigation, which keeps routes the user may never visit out of the initial bundle. It composes with route-level grouping — several routes importing from the same chunk name are bundled together — and pairs well with prefetching links on hover. In Nuxt this is automatic for everything in `pages/`.

## What does Nuxt add on top of Vue, and how do useFetch and useAsyncData work? (M)

Nuxt is the application framework around Vue — roughly what Next is to React.

The main things it adds: **server-side rendering and static generation**, with hydration handled for you; **file-based routing** from `pages/`, with layouts, nested routes and route middleware; **a server layer** (`server/api/`) running on Nitro, so API routes deploy alongside the app to Node, Workers, Lambda or a static host from the same codebase; **auto-imports** of components, composables and Vue APIs; **data fetching composables** that work identically on server and client; a **module ecosystem** for the usual concerns; and build tooling, code splitting and payload handling configured out of the box.

The problem `useAsyncData` exists to solve is double-fetching. During SSR the server fetches, renders, and serialises the result into the HTML payload. On the client, hydration reads that payload instead of fetching again, so the user sees data immediately and the request happens once.

```
// full control over the fetcher
const { data, status, error, refresh } = await useAsyncData(
  'user-' + id.value,
  () => $fetch(`/api/users/${id.value}`),
  { watch: [id] }
);

// sugar for the common case
const { data, error } = await useFetch(`/api/users/${id.value}`);
```

Both return refs plus `refresh`/`execute`, and both block navigation until resolved unless you pass `lazy: true`, in which case the route renders straight away and `status` moves through `pending`. `server: false` makes it client-only. `transform` reshapes the response before it is cached, and `pick` limits which fields go into the payload — worth using, since everything you fetch is serialised into the HTML.

For anything that is not a page-load read — a form submission, a delete — none of this applies. Use plain `$fetch` in the handler; `useFetch` in an event handler is a mistake, since the SSR/hydration machinery has nothing to do there.

### What is the difference between the two, and why does the key matter?

`useFetch(url)` is sugar for `useAsyncData(key, () => $fetch(url))`. It derives the key from the URL and options automatically, and it handles request-specific details — forwarding cookies and headers during SSR, building the query string, deduplicating in-flight requests to the same URL.

`useAsyncData(key, fn)` is the general form: any async function, not necessarily HTTP. Use it when the fetcher is not a single URL — a database or CMS SDK call, multiple requests combined, or a call whose URL is computed in a way `useFetch` cannot see.

The key is the cache identity. Nuxt uses it to store the result in the payload on the server and look it up during hydration, to deduplicate concurrent calls, and to share data between components asking for the same thing. If two different requests share a key, the second silently gets the first one's data.

That is exactly what goes wrong with `useFetch` and a dynamic URL. The key is generated from the URL *at the call site*, so a component fetching `/api/users/${id}` inside a loop, or a route whose id changes, can end up reusing a key and showing stale data. The fix is to pass an explicit key, or to use `useAsyncData` with a key you compute yourself.

The related gotcha is that the URL must be reactive for a refetch to happen at all. Interpolating a ref builds the string once, so the data never updates when the id changes. Pass a getter instead, or set an explicit `watch`:

```
// evaluated once — never refetches
useFetch(`/api/users/${id.value}`);

// reactive — refetches when id changes
useFetch(() => `/api/users/${id.value}`);
```

## How do you type a Vue component with defineProps and defineEmits? (M)

Beyond props and emits themselves, fully typing a component means covering the other three surfaces: what it exposes, what slots it takes, and how you reference it.

```
<script setup lang="ts" generic="T extends { id: string }">
const props = defineProps<{
  items: T[];
  selected?: T | null;
}>();

const emit = defineEmits<{ select: [item: T] }>();

defineSlots<{
  item(props: { item: T; index: number }): any;
  empty?(): any;
}>();

const model = defineModel<string>();

function focus() { inputEl.value?.focus() }
defineExpose({ focus });
</script>
```

`generic="T"` makes the component generic, so a `<List :items="users" />` gets `user` typed correctly inside the `#item` slot rather than falling back to a union or `any`. That is the piece that turns a generic list or table component from loosely typed to actually safe.

`defineSlots` types the slot props for consumers, and marks which slots are optional.

`defineExpose` is what makes a template ref useful. A `<script setup>` component is closed, so without it the parent's ref has no public surface. On the parent side you type the ref with `InstanceType`:

```
const list = ref<InstanceType<typeof MyList> | null>(null);
list.value?.focus();
```

Two details worth knowing. Type-only declarations must be resolvable by the compiler — since 3.3 it follows imported types and generic parameters, but not arbitrary conditional or mapped types, and the error when it cannot is not obvious. And you cannot mix the two declaration styles: `defineProps` takes either a runtime object or a type argument, never both, so defaults come from destructuring or `withDefaults`.

Getting this checked in templates as well as scripts needs `vue-tsc` in the build or CI — the IDE checks templates through Volar, but `tsc` alone does not look inside `.vue` files.

## What are common reactivity pitfalls in Vue? (M)

The recurring ones, most to least common:

**Destructuring reactive state.** `const { count } = props` or `const { user } = reactive(state)` copies the value and drops the connection. `toRefs`, or don't destructure — with the exception of props in 3.5+, where the compiler handles it.

**Forgetting `.value`.** In script, `count++` on a ref increments nothing useful and `if (isOpen)` is always truthy, because the ref object is truthy. Templates unwrap automatically, which is what makes the script-side omission easy to miss. Volar catches most of it; a ref used in a nested object or passed through a function is where it slips through.

**Replacing a `reactive` object.** `state = { ...state, count: 1 }` rebinds a local variable and the proxy everyone else holds is unchanged. `reactive` state must be mutated, not reassigned — one of the main reasons to prefer `ref`.

**Watching the wrong thing.** `watch(props.user, ...)` watches the object identity, so a parent replacing the object fires it and mutating a field does not. `watch(() => props.user.name, ...)` for a field, `{ deep: true }` for any change within — and `deep` on a large object is a real cost, since it traverses everything on every check.

**Async setup boundaries.** After an `await`, there is no active component instance. Lifecycle hooks, `inject` and `provide` registered past that point silently do nothing. Register synchronously at the top of `setup`.

**Non-reactive sources.** Module-level plain objects, class instances, values from a third-party library, `Date` objects mutated in place. Vue tracks what it wraps; anything else changes without a trigger.

**Losing tracking in `watchEffect` after an await.** Dependency collection only covers the synchronous part of the run, so reads after the first `await` are not tracked.

**Index keys in `v-for`** with a list that reorders — state attaches to the wrong row.

**Mutating props.** Not reactivity so much as ownership, but it presents the same way: a warning for primitives and silent divergence for objects, since the child mutates the same object the parent holds. Emit and let the parent decide.

The pattern behind most of these is the same: reactivity lives on the *access path*, not on the value. Any operation that reads a value out of that path — destructuring, spreading, assigning to a local, passing to a function — hands you a plain value, and the tracking does not come with it.

## How would you optimise a Vue app’s performance? (M)

I would start by measuring, because the fix depends entirely on which of three problems it is: too much JavaScript shipped, too much re-rendering, or too much work per render. The Vue devtools timeline shows component render counts and durations, and a production build profile plus a bundle analysis tells you the rest.

**Ship less.** Route-level code splitting via dynamic imports is the biggest single win and mostly free in Nuxt. Beyond that: `defineAsyncComponent` for heavy leaf components — editors, charts, maps — so they load on demand; auditing dependencies for the usual offenders (a full date library for one `format` call, a full icon set for six icons); and making sure the build is actually tree-shaking, which means ES modules and no `import * as`.

**Re-render less.** Vue's per-property tracking means a component only re-renders if it read something that changed, so the wins here are structural: `v-if` instead of `v-show` for expensive subtrees that are rarely shown, stable keys so lists patch rather than rebuild, `computed` instead of calling a method in the template (a method call re-runs on every render, a computed is cached), and `v-once` or `v-memo` for genuinely static or rarely-changing chunks. `v-memo` on a long list row with an explicit dependency array is the sharpest tool here, and the easiest to get subtly wrong, so I use it only where profiling shows the row diff dominating.

Also worth checking: `v-for` combined with `v-if` on the same element, which filters on every render — filter in a computed instead.

**Do less per render.** `shallowRef` and `markRaw` for large datasets and third-party instances, so Vue is not proxying structures it does not need to observe. Virtual scrolling for anything over a few hundred rows — nothing beats not rendering the elements. Debouncing expensive watchers. And keeping deep watchers off large objects.

**Load better.** SSR or SSG through Nuxt for first-paint and SEO, with hydration cost in mind — Nuxt's lazy hydration and islands help where a page is mostly static. Then the framework-independent work that usually matters more than any of the above: image formats and sizing, font loading, caching headers, and preconnecting to the API origin.

The honest answer for most apps is that the framework is not the bottleneck. Before reaching for `v-memo` I would look for the unpaginated list, the API call in a loop, the 2MB hero image and the third-party analytics script blocking the main thread.
