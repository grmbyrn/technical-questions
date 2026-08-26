<script setup lang="ts">
import type { Flashcard } from "~/composables/useFlashcards";

/**
 * One card, front and back. Both the browsing deck and the test round render
 * this — what differs between them is the controls underneath, not the card.
 */
defineProps<{ card: Flashcard; revealed: boolean }>();
const emit = defineEmits<{ flip: [] }>();

/** ContentRenderer wants a document; hand it a slice of one. */
const asDoc = (value: Flashcard["answer"]) => ({
  body: { type: "minimal", value },
});

/**
 * The card is a plain div rather than a button: a question can carry a code
 * block or a list, and interactive content may not nest inside a button. The
 * "Show answer" button inside it is the accessible control — this handler
 * catches its click on the way up as well as clicks on the card itself.
 */
function onClick(e: MouseEvent) {
  // dragging out a selection ends in a click; don't flip the card mid-copy
  if (window.getSelection()?.toString()) return;
  if ((e.target as HTMLElement)?.closest("a")) return;
  emit("flip");
}
</script>

<template>
  <div class="card" @click="onClick">
    <div v-if="card.tags.length" class="cardtags">
      <span v-for="t in card.tags" :key="t" class="cardtag">{{ t }}</span>
    </div>
    <div class="cardq">{{ card.question }}</div>
    <!-- the lists and code blocks a heading cannot hold, from above the
         card's `---` rule -->
    <div v-if="card.front.length" class="cardfront">
      <ContentRenderer :value="asDoc(card.front)" />
    </div>
    <button class="cardflip" :aria-expanded="revealed ? 'true' : 'false'">
      {{ revealed ? "Hide answer" : "Show answer" }}
    </button>
  </div>

  <div v-if="revealed" class="answer">
    <ContentRenderer v-if="card.hasAnswer" :value="asDoc(card.answer)" />
    <p v-else class="noanswer">No answer written for this card yet.</p>
  </div>
</template>
