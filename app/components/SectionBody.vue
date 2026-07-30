<script setup lang="ts">
import type { Node } from "~/composables/useQuestions";

/**
 * Which layout a section gets is decided by its content, not by frontmatter:
 * as soon as any question has an answer written under it, the whole section
 * switches to the heading layout that can render prose and code. Questions
 * still waiting on an answer just show up as a heading with nothing below.
 */
const props = defineProps<{ body?: { value?: Node[] } }>();

const questions = computed(() => parseQuestions(props.body));
const hasAnswers = computed(() => questions.value.some(isAnswered));

/** ContentRenderer wants a document; hand it a slice of one. */
const asDoc = (value: Node[]) => ({ body: { type: "minimal", value } });
</script>

<template>
  <!-- sections with at least one answer written -->
  <template v-if="hasAnswers">
    <div v-for="(q, i) in questions" :key="i" class="qa">
      <h2>
        {{ q.prompt }}
        <span v-if="q.difficulty" class="tag">({{ q.difficulty }})</span>
      </h2>
      <ContentRenderer v-if="q.body.length" :value="asDoc(q.body)" />
      <div v-for="(f, j) in q.followups" :key="j" class="follow">
        <h3>{{ f.prompt }}</h3>
        <ContentRenderer v-if="f.body.length" :value="asDoc(f.body)" />
      </div>
    </div>
  </template>

  <!-- sections that are still just a question list -->
  <ul v-else class="qlist">
    <li v-for="(q, i) in questions" :key="i">
      {{ q.prompt }}
      <span v-if="q.difficulty" class="tag">({{ q.difficulty }})</span>
      <ul v-if="q.followups.length" class="flist">
        <li v-for="(f, j) in q.followups" :key="j">{{ f.prompt }}</li>
      </ul>
    </li>
  </ul>
</template>
