---
title: Vue Fundamentals
order: 8
tags: [vue-fundamentals]
---

## What is the shorthand for v-bind:src?

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

## Why does every v-for element need a :key?

It gives each rendered item a stable identity so Vue tracks it correctly when the array changes

With stable keys, Vue knows which existing element belongs to which item through reorders, inserts, and removals.

## Which of these are valid ways to apply classes from data? Select all that apply.

(select multiple)

1. :class="stock > 0 ? 'badge' : 'error'"

2. :class="if (isDown) { 'error' }"

3. :class="{ error: isDown }"

4. class="{ error: isDown }"

---

**1, 3** Any expression works in a binding, and a ternary picks between two classes.
