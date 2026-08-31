<script setup lang="ts">
import type { ChallengeSection } from "~/composables/useChallenges";

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: doc } = await useAsyncData(
  () => `challenge-${slug.value}`,
  () => queryCollection("challenges").where("slug", "=", slug.value).first(),
  { watch: [slug] },
);

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: "Challenge not found" });
}

// computed, not destructured once: navigating between challenges swaps `doc`
// under us and the sections have to follow
const split = computed(() => splitAtSolution(splitSections(doc.value?.body)));
const problem = computed(() => split.value.problem);
const solution = computed(() => split.value.solution);

// The reveal is the whole point of keeping these: read the problem, have
// another go, then check. It resets whenever you move to another challenge.
const revealed = ref(false);
watch(slug, () => (revealed.value = false));

/** ContentRenderer wants a document; hand it a slice of one. */
const asDoc = (value: ChallengeSection["nodes"]) => ({
  body: { type: "minimal", value },
});

// prev/next walk the same newest-first order as the index
const { data: all } = await useChallenges();
const index = computed(() =>
  (all.value ?? []).findIndex((c) => c.slug === slug.value),
);
const prev = computed(() => (all.value ?? [])[index.value - 1]);
const next = computed(() => (all.value ?? [])[index.value + 1]);

const shortDate = (iso?: string) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const description = computed(
  () => `Solution and notes for ${doc.value?.title}.`,
);

useHead({
  title: () => `${doc.value?.title} — Challenge`,
  meta: [{ name: "description", content: description }],
});
</script>

<template>
  <article v-if="doc" class="section">
    <div class="eyebrow">
      <NuxtLink to="/challenges" class="crumb">Challenges</NuxtLink>
    </div>
    <h1>{{ doc.title }}</h1>

    <div class="challengemeta head">
      <span class="pill" :class="doc.difficulty">{{ doc.difficulty }}</span>
      <a v-if="doc.url" :href="doc.url" target="_blank" rel="noopener">
        {{ doc.source || "Original problem" }} &nearr;
      </a>
      <span v-else-if="doc.source">{{ doc.source }}</span>
      <span v-if="doc.completed">solved {{ shortDate(doc.completed) }}</span>
      <span v-for="t in doc.tags" :key="t" class="cardtag">{{ t }}</span>
    </div>

    <section v-for="(s, i) in problem" :key="i">
      <h2 v-if="s.title">{{ s.title }}</h2>
      <ContentRenderer :value="asDoc(s.nodes)" />
    </section>

    <template v-if="solution.length">
      <div v-if="!revealed" class="revealbox">
        <p class="startlead">
          Have a go at it first — the solution and notes are hidden until you
          ask for them.
        </p>
        <button class="deckbtn primary" @click="revealed = true">
          Show my solution
        </button>
      </div>

      <template v-else>
        <section v-for="(s, i) in solution" :key="i">
          <h2 v-if="s.title">{{ s.title }}</h2>
          <ContentRenderer :value="asDoc(s.nodes)" />
        </section>
        <button class="deckbtn ghostbtn" @click="revealed = false">
          Hide solution
        </button>
      </template>
    </template>

    <div class="pager">
      <NuxtLink v-if="prev" class="pn" :to="`/challenges/${prev.slug}`">
        &larr; {{ prev.title }}
      </NuxtLink>
      <span v-else class="pn ghost" />
      <NuxtLink v-if="next" class="pn" :to="`/challenges/${next.slug}`">
        {{ next.title }} &rarr;
      </NuxtLink>
      <span v-else class="pn ghost" />
    </div>
  </article>
</template>
