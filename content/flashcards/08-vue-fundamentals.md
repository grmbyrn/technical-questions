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
