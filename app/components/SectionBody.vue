<script setup lang="ts">
import type { Node, Question } from "~/composables/useQuestions";

/**
 * Which layout a section gets is decided by its content, not by frontmatter:
 * as soon as any question has an answer written under it, the whole section
 * switches to the heading layout that can render prose and code. Questions
 * still waiting on an answer just show up as a heading with nothing below.
 *
 * In that layout every question is folded shut. A section is 12 answers long
 * and each one is several paragraphs, so the useful view of the page is the
 * list of prompts, with the answer one click away.
 */
const props = defineProps<{ body?: { value?: Node[] } }>();

const questions = computed(() => parseQuestions(props.body));
const hasAnswers = computed(() => questions.value.some(isAnswered));

/** Nothing written yet — a fold with an empty inside is worse than a heading. */
const hasContent = (q: Question) =>
  q.body.length > 0 || q.followups.length > 0 || q.connected.length > 0;

/** ContentRenderer wants a document; hand it a slice of one. */
const asDoc = (value: Node[]) => ({ body: { type: "minimal", value } });
</script>

<template>
  <!-- sections with at least one answer written -->
  <template v-if="hasAnswers">
    <template v-for="(q, i) in questions" :key="i">
      <details v-if="hasContent(q)" class="qa">
        <summary>
          <h2>
            {{ q.prompt }}
            <span v-if="q.difficulty" class="tag">({{ q.difficulty }})</span>
          </h2>
        </summary>
        <div class="qa-body">
          <!-- folded again inside: opening a question should land you on the
               answer, not on the list of prompts it also covers -->
          <details v-if="q.connected.length" class="connected">
            <summary>Connected questions ({{ countItems(q.connected) }})</summary>
            <ContentRenderer :value="asDoc(q.connected)" />
          </details>
          <ContentRenderer v-if="q.body.length" :value="asDoc(q.body)" />
          <div v-for="(f, j) in q.followups" :key="j" class="follow">
            <h3>{{ f.prompt }}</h3>
            <ContentRenderer v-if="f.body.length" :value="asDoc(f.body)" />
          </div>
        </div>
      </details>

      <div v-else class="qa plain">
        <h2>
          {{ q.prompt }}
          <span v-if="q.difficulty" class="tag">({{ q.difficulty }})</span>
        </h2>
      </div>
    </template>
  </template>

  <!-- sections that are still just a question list -->
  <ul v-else class="qlist">
    <li v-for="(q, i) in questions" :key="i">
      {{ q.prompt }}
      <span v-if="q.difficulty" class="tag">({{ q.difficulty }})</span>
      <details v-if="q.connected.length" class="connected">
        <summary>Connected questions ({{ countItems(q.connected) }})</summary>
        <ContentRenderer :value="asDoc(q.connected)" />
      </details>
      <ul v-if="q.followups.length" class="flist">
        <li v-for="(f, j) in q.followups" :key="j">{{ f.prompt }}</li>
      </ul>
    </li>
  </ul>
</template>
