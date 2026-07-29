<script setup lang="ts">
const { data: first } = await useAsyncData("first-section", () =>
  queryCollection("sections").order("order", "ASC").first(),
);

if (first.value) {
  await navigateTo(`/${first.value.slug}`, { replace: true });
}
</script>

<template>
  <section class="section">
    <p>Loading&hellip;</p>
  </section>
</template>
