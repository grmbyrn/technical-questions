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

## In <script setup> you have const count = ref(0). How do you add 1 to it there?

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

import StatBadge from "./StatBadge.vue" in App's <script setup>

An imported component is immediately usable as a tag. Script setup exposes it to the template the same way it exposes a ref.

## A component declares defineProps(["label"]) without saving the return value. How does its template show the label?

{{ label }}

Declared props work in the template like refs: the bare name in double curly braces.

## A child component runs emit("save", draft). How does the parent receive draft?

@save="handleSave", and handleSave gets draft as its argument

The parent listens for the child's event by name, and the emitted payload arrives as the handler's argument.

## Which of these statements about component communication are true?

(select multiple)

1. Content written inside <slot>...</slot> in the child is the fallback, shown when the parent passes nothing

2. A child may assign a new value to its own prop when it needs to change it

3. Slot content can only be plain text, never elements

4. A <slot> outlet renders whatever the parent writes between the component's tags

---

**1, 4** Fallback content keeps a wrapper component usable even with empty tags.

## On a text input, `v-model="name"` is shorthand for which pair?

`:value="name"` plus `@input="name = $event.target.value"`

That is the whole trick: the value binds down and every input event writes back up. v-model wraps the loop in one directive.

## Three checkboxes for picking pizza toppings share one ref. What should the ref start as?

`ref([])`

A checkbox group collects the checked value attributes into an array, so the ref must start as one.

## A guest count is bound with plain `v-model="guests"`. The user types 4, and the template renders `{{ guests + 1 }}`. What shows up?

41

Text fields produce strings, so guests holds "4" and + glues on the 1. v-model.number casts the input so the math works.

## What does the .prevent in @submit.prevent="save" actually do?

Calls the event's preventDefault(), cancelling the browser's page-reloading default submit

The submit still fires and the handler still runs. Only the built-in reload is cancelled, so your state survives.

## Which of these statements about v-model are true?

(select multiple)

1. .trim converts the typed text into a number

2. It works on a <textarea> just like on a text input

3. v-model.lazy updates the ref on the change event instead of every keystroke

4. A <select> bound with v-model also needs a @change listener to work

---

**2, 3** Multi-line text binds the same way. Interpolating between the tags is the thing that does not work.

## When does the callback you pass to onMounted run?

Right after the component's elements land in the page

That is the mounted moment. Script setup has run, the template has rendered, and the page really contains the component.

## A list will be filled by a fetch in onMounted. Why should the ref start as ref([]) rather than ref()?

The component renders before the data arrives, and the first render needs something v-for can loop over

The first paint happens while the fetch is still in flight. An empty array loops zero times and renders cleanly, then the assignment re-renders with rows.

## A fetch reaches the server, which answers with a 404. There is no res.ok check. What happens?

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

## Which of these statements are true?

(select multiple)

1. A fetch inside onMounted delays the first render until the data arrives

2. A finally block runs whether the fetch succeeded or failed

3. A watch callback receives the new value and the old value

4. onMounted runs again on every re-render

---

**2, 3** That is what makes finally the reliable place to end a loading state: both stories pass through it.
