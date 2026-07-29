<script setup lang="ts">
const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: doc } = await useAsyncData(
  () => `section-${slug.value}`,
  () => queryCollection("sections").where("slug", "=", slug.value).first(),
  { watch: [slug] },
);

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: "Section not found" });
}

// prev/next are derived from the ordered list, not hardcoded per section
const { data: sections } = await useAsyncData("sections", () =>
  queryCollection("sections")
    .order("order", "ASC")
    .select("slug", "order", "number", "group", "title", "status")
    .all(),
);

const index = computed(() =>
  (sections.value ?? []).findIndex((s) => s.slug === slug.value),
);
const prev = computed(() => (sections.value ?? [])[index.value - 1]);
const next = computed(() => (sections.value ?? [])[index.value + 1]);

useHead({ title: () => `${doc.value?.number}. ${doc.value?.title}` });
</script>

<template>
  <section v-if="doc" class="section">
    <div class="eyebrow">{{ doc.group }}</div>
    <h2>{{ doc.number }}. {{ doc.title }}</h2>
    <div class="badge" :class="doc.status === 'answered' ? 'done' : 'todo'">
      {{
        doc.status === "answered"
          ? "Answers written"
          : "Questions only — answers not written yet"
      }}
    </div>

    <SectionBody :body="doc.body" :status="doc.status" />

    <div class="pager">
      <NuxtLink v-if="prev" class="pn" :to="`/${prev.slug}`">
        &larr; {{ prev.number }}. {{ prev.title }}
      </NuxtLink>
      <span v-else class="pn ghost" />
      <NuxtLink v-if="next" class="pn" :to="`/${next.slug}`">
        {{ next.number }}. {{ next.title }} &rarr;
      </NuxtLink>
      <span v-else class="pn ghost" />
    </div>
  </section>
</template>
