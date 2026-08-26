<script setup lang="ts">
import type { Flashcard } from "~/composables/useFlashcards";

const { data: decks } = await useFlashcards();

const cards = computed(() => (decks.value ?? []).flatMap((d) => parseFlashcards(d)));

/** Tag filter, most-used first. No selection means "everything". */
const tags = computed(() => {
  const counts = new Map<string, number>();
  for (const c of cards.value) {
    for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
});

const active = ref<string[]>([]);
const isOn = (tag: string) => active.value.includes(tag);

function toggleTag(tag: string) {
  active.value = isOn(tag)
    ? active.value.filter((t) => t !== tag)
    : [...active.value, tag];
}

const pool = computed(() =>
  active.value.length
    ? cards.value.filter((c) => c.tags.some((t) => active.value.includes(t)))
    : cards.value,
);

// The deck is a materialised order rather than a computed, so shuffling is a
// state change and not something the filter recomputes away.
const random = ref(false);
const deck = ref<Flashcard[]>([]);
const pos = ref(0);
const revealed = ref(false);

watch(
  pool,
  (next) => {
    deck.value = random.value ? shuffled(next) : next.slice();
    pos.value = 0;
    revealed.value = false;
  },
  { immediate: true },
);

const card = computed(() => deck.value[pos.value]);

function step(delta: number) {
  if (!deck.value.length) return;
  // wrap, so a deck can be cycled without hunting for the ends
  pos.value = (pos.value + delta + deck.value.length) % deck.value.length;
  revealed.value = false;
}

function shuffle() {
  random.value = true;
  deck.value = shuffled(pool.value);
  pos.value = 0;
  revealed.value = false;
}

function inOrder() {
  random.value = false;
  deck.value = pool.value.slice();
  pos.value = 0;
  revealed.value = false;
}

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
function flip(e: MouseEvent) {
  // dragging out a selection ends in a click; don't flip the card mid-copy
  if (window.getSelection()?.toString()) return;
  if ((e.target as HTMLElement)?.closest("a")) return;
  revealed.value = !revealed.value;
}

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === "ArrowRight") step(1);
  else if (e.key === "ArrowLeft") step(-1);
  else if (e.key === " " && tag !== "BUTTON") {
    // a focused button already toggles on space; only handle the loose case
    e.preventDefault();
    revealed.value = !revealed.value;
  }
}

onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));

useHead({
  title: "Flashcards",
  meta: [
    {
      name: "description",
      content: "Self-testing flashcards — tap a question to reveal the answer.",
    },
  ],
});
</script>

<template>
  <article class="section">
    <div class="eyebrow">Practice</div>
    <h1>Flashcards</h1>
    <div class="badge done">
      {{ cards.length }} card{{ cards.length === 1 ? "" : "s" }} across
      {{ tags.length }} tag{{ tags.length === 1 ? "" : "s" }}
    </div>

    <div v-if="tags.length" class="tagbar">
      <button
        v-for="t in tags"
        :key="t.tag"
        class="chip"
        :class="{ on: isOn(t.tag) }"
        :aria-pressed="isOn(t.tag) ? 'true' : 'false'"
        @click="toggleTag(t.tag)"
      >
        {{ t.tag }} <span class="chipnum">{{ t.count }}</span>
      </button>
      <button v-if="active.length" class="chip clear" @click="active = []">
        clear
      </button>
    </div>

    <template v-if="card">
      <div class="card" @click="flip">
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

      <div class="deckbar">
        <button class="deckbtn" @click="step(-1)">&larr; Prev</button>
        <span class="deckcount">{{ pos + 1 }} / {{ deck.length }}</span>
        <button class="deckbtn" @click="step(1)">Next &rarr;</button>
        <button v-if="random" class="deckbtn ghostbtn" @click="inOrder">
          In order
        </button>
        <button v-else class="deckbtn ghostbtn" @click="shuffle">Shuffle</button>
      </div>

      <p class="deckkeys">
        Click the card to flip &middot; <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to
        move &middot; <kbd>space</kbd> to flip
      </p>
    </template>

    <p v-else class="noanswer">
      {{
        cards.length
          ? "No cards match the selected tags."
          : "No cards yet — add a Markdown file to content/flashcards/."
      }}
    </p>
  </article>
</template>
