---
title: Vue Fundamentals
order: 8
tags: [vue-fundamentals]
---

## What is the shorthand for v-bind:src?

:src

A bare colon replaces v-bind, so :src="photoUrl" and v-bind:src="photoUrl" mean the same thing.

## Given this template, what renders on the page?:

```vue
<script setup>
const plan = "pro";
</script>

<template>
  <p v-if="plan === 'free'">Upgrade for more.</p>
  <p v-else-if="plan === 'pro'">You have every feature.</p>
  <p v-else>Contact sales.</p>
</template>
```

---

Only "You have every feature."

Vue checks the chain top to bottom and renders the first true branch, the v-else-if here.

## An element's v-if condition is false. What happens to the element?

It is removed from the page entirely

v-if false means the element does not exist in the page until the condition turns true.

## Why does every v-for element need a :key?

It gives each rendered item a stable identity so Vue tracks it correctly when the array changes

With stable keys, Vue knows which existing element belongs to which item through reorders, inserts, and removals.

## Which of these are valid ways to apply classes from data? Select all that apply.

(select multiple)

1. :class="stock > 0 ? 'badge' : 'error'"

2. :class="if (isDown) { 'error' }"

3. :class="{ error: isDown }"

4. class="{ error: isDown }"

---

**1, 3** Any expression works in a binding, and a ternary picks between two classes.

## In `<script setup>` you have const count = ref(0). How do you add 1 to it there?

count.value++

In the script, the number lives on the ref's .value property, so that is what you change.

## How do you show that same count ref in the template?

{{ count }}

Templates unwrap refs automatically, so the bare name renders the number.

## What is the shorthand for v-on:click?

@click

The @ symbol replaces v-on:, so @click="addLike" and v-on:click="addLike" mean the same thing.

## Given this script, what happens when quantity.value becomes 4?:

```js
const price = ref(10);
const quantity = ref(3);
const total = computed(() => price.value * quantity.value);
```

---

total recalculates to 40 on its own

The function read quantity, so quantity is a dependency, and any dependency change triggers a recalculation.

## Which of these statements about ref and reactive are true? Select all that apply.

(select multiple)

1. A reactive object's properties are read and changed directly, with no .value

2. reactive works on objects, not on single numbers or strings

3. You can replace an entire reactive object by reassigning it

4. Destructuring a property out of a reactive object keeps it reactive

---

**1, 2** reactive returns the object itself made reactive, so player.hp-- just works.

## A component lives in src/StatBadge.vue. What makes it usable inside App's template?

import StatBadge from "./StatBadge.vue" in App's `<script setup>`

An imported component is immediately usable as a tag. Script setup exposes it to the template the same way it exposes a ref.

## A component declares defineProps(["label"]) without saving the return value. How does its template show the label?

{{ label }}

Declared props work in the template like refs: the bare name in double curly braces.

## A child component runs emit("save", draft). How does the parent receive draft?

@save="handleSave", and handleSave gets draft as its argument

The parent listens for the child's event by name, and the emitted payload arrives as the handler's argument.

## Which of these statements about component communication are true?

(select multiple)

1. Content written inside `<slot>...</slot>` in the child is the fallback, shown when the parent passes nothing

2. A child may assign a new value to its own prop when it needs to change it

3. Slot content can only be plain text, never elements

4. A `<slot>` outlet renders whatever the parent writes between the component's tags

---

**1, 4** Fallback content keeps a wrapper component usable even with empty tags.

## On a text input, `v-model="name"` is shorthand for which pair?

`:value="name"` plus `@input="name = $event.target.value"`

That is the whole trick: the value binds down and every input event writes back up. v-model wraps the loop in one directive.

## Three checkboxes for picking pizza toppings share one ref. What should the ref start as?

`ref([])`

A checkbox group collects the checked value attributes into an array, so the ref must start as one.

## A guest count is bound with plain `v-model="guests"`. The user types 4, and the template renders `{{ guests + 1 }}`. What shows up?

41

Text fields produce strings, so guests holds "4" and + glues on the 1. v-model.number casts the input so the math works.

## What does the .prevent in @submit.prevent="save" actually do?

Calls the event's preventDefault(), cancelling the browser's page-reloading default submit

The submit still fires and the handler still runs. Only the built-in reload is cancelled, so your state survives.

## Which of these statements about v-model are true?

(select multiple)

1. .trim converts the typed text into a number

2. It works on a `<textarea>` just like on a text input

3. v-model.lazy updates the ref on the change event instead of every keystroke

4. A `<select>` bound with v-model also needs a @change listener to work

---

**2, 3** Multi-line text binds the same way. Interpolating between the tags is the thing that does not work.

## When does the callback you pass to onMounted run?

Right after the component's elements land in the page

That is the mounted moment. Script setup has run, the template has rendered, and the page really contains the component.

## A list will be filled by a fetch in onMounted. Why should the ref start as ref([]) rather than ref()?

The component renders before the data arrives, and the first render needs something v-for can loop over

The first paint happens while the fetch is still in flight. An empty array loops zero times and renders cleanly, then the assignment re-renders with rows.

## A fetch reaches the server, which answers with a 404. There is no res.ok check. What happens?

The promise resolves normally and the catch block never runs on its own

fetch treats any delivered response as success, even a 404. Turning a bad status into an error is the res.ok guard's whole job.

## Which of these correctly watches the ref count?

1. watch("count", (newValue) => { ... })

2. count.watch((newValue) => { ... })

3. watch(count, (newValue) => { ... })

4. watch(count.value, (newValue) => { ... })

---

watch(count, (newValue) => { ... })

watch takes the ref itself as the source. Vue tracks it and runs the callback on every change.

## Which of these statements about lifecycle and watchers are true?

(select multiple)

1. A fetch inside onMounted delays the first render until the data arrives

2. A finally block runs whether the fetch succeeded or failed

3. A watch callback receives the new value and the old value

4. onMounted runs again on every re-render

---

**2, 3** That is what makes finally the reliable place to end a loading state: both stories pass through it.

## What does the route record { path: "/tours", component: ToursPage } do?

When the URL matches /tours, ToursPage renders where RouterView sits

That is the whole contract: the record maps a path to a component, and RouterView is the outlet the matched component renders into.

## What does RouterLink give you that a plain `<a href>` pointing at the same page does not?

Client-side navigation without a reload, plus an automatic class on the link for the current page

The router swaps the matched component in place, state survives, and the active link gets router-link-exact-active for styling.

## A submit handler should send the user to /done after saving. Which is the right tool?

useRouter() in script setup, then router.push("/done") in the handler

useRouter returns the router, the object that can move the app. Grab it during setup, push when the work is done.

## Which of these statements about routing are true?

(select multiple)

1. A dynamic segment like :id can only match numeric values

2. RouterView marks the spot where the matched page component renders

3. Registering with app.use(router) makes RouterLink and RouterView available without imports

4. Clicking a RouterLink reloads the page to fetch the new route

---

**2, 3** It is the outlet. Layout around it stays put, the router swaps only what is inside.

## What is a composable?

A plain function that owns reactive state with the Composition API and returns what components need

That is the whole recipe: refs and logic inside, an object of refs and functions out. The use prefix is the naming convention on top.

## Two components each call useSpotlight(), which creates its ref inside the function body. Component A turns its spotlight on. What does component B see?

Nothing changes for B, each call created its own private state

Every call runs the body again, so every caller closes over a fresh ref. Per-call state is the default.

## What makes the state in a composable shared by every component that calls it?

Declaring the ref at module scope, outside the exported function

A module runs once, so that ref is created once, and every call returns the same one. Where the state is created decides who shares it.

## An ancestor runs provide("user", userName) where userName is a ref. Why provide the ref instead of userName.value?

The ref keeps the link live, so descendants see every later change

Injectors get the actual ref and stay connected. Providing .value hands them a frozen copy of one moment's string.

## Which of these statements about provide/inject are true?

(select multiple)

1. inject("theme", "light") falls back to "light" when no ancestor provided the key

2. Components between the provider and the injector must forward the value

3. Destructuring the object a composable returns breaks reactivity

4. A composable can use computed, watch, and onMounted inside

---

**1, 4** The second argument is the default, so the component still works without a provider above it.

## The route is { path: "/plants/:id", component: PlantPage } and the URL shows #/plants/42. What does useRoute().params hold?

{ id: "42" }, with the value as a string

The :id segment captured 42, and params are always strings, even when they look like numbers.
