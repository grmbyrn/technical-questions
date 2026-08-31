<script setup lang="ts">
const { data: challenges } = await useChallenges();

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const difficulty = ref("");
const activeTags = ref<string[]>([]);

const tags = computed(() => {
  const counts = new Map<string, number>();
  for (const c of challenges.value ?? []) {
    for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
});

function toggleTag(tag: string) {
  activeTags.value = activeTags.value.includes(tag)
    ? activeTags.value.filter((t) => t !== tag)
    : [...activeTags.value, tag];
}

const shown = computed(() =>
  (challenges.value ?? []).filter(
    (c) =>
      (!difficulty.value || c.difficulty === difficulty.value) &&
      (!activeTags.value.length ||
        c.tags.some((t) => activeTags.value.includes(t))),
  ),
);

/** "2026-08-31" reads better as a date than as a sort key. */
const shortDate = (iso?: string) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

useHead({
  title: "Code Challenges",
  meta: [
    {
      name: "description",
      content: "Solved code challenges, with the working kept for revision.",
    },
  ],
});
</script>

<template>
  <article class="section">
    <div class="eyebrow">Practice</div>
    <h1>Code Challenges</h1>
    <div class="badge done">
      {{ challenges?.length ?? 0 }} solved
    </div>

    <div class="topicbar">
      <label class="topiclabel" for="difficulty">Difficulty</label>
      <select id="difficulty" v-model="difficulty" class="topicselect">
        <option value="">Any difficulty</option>
        <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <div v-if="tags.length > 1" class="tagbar">
      <button
        v-for="t in tags"
        :key="t.tag"
        class="chip"
        :class="{ on: activeTags.includes(t.tag) }"
        :aria-pressed="activeTags.includes(t.tag) ? 'true' : 'false'"
        @click="toggleTag(t.tag)"
      >
        {{ t.tag }} <span class="chipnum">{{ t.count }}</span>
      </button>
      <button
        v-if="activeTags.length"
        class="chip clear"
        @click="activeTags = []"
      >
        clear
      </button>
    </div>

    <ul v-if="shown.length" class="challenges">
      <li v-for="c in shown" :key="c.slug">
        <NuxtLink class="challenge" :to="`/challenges/${c.slug}`">
          <div class="challengetop">
            <span class="challengetitle">{{ c.title }}</span>
            <span class="pill" :class="c.difficulty">{{ c.difficulty }}</span>
          </div>
          <div class="challengemeta">
            <span v-if="c.source">{{ c.source }}</span>
            <span v-if="c.completed">{{ shortDate(c.completed) }}</span>
            <span v-for="t in c.tags" :key="t" class="cardtag">{{ t }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="noanswer">
      {{
        challenges?.length
          ? "Nothing matches that filter."
          : "No challenges yet — add a Markdown file to content/challenges/."
      }}
    </p>
  </article>
</template>
