<script setup lang="ts">
import type { Flashcard } from "~/composables/useFlashcards";

/** Cards drawn into one test round. */
const ROUND_SIZE = 10;

const { data: decks } = await useFlashcards();

const cards = computed(() => (decks.value ?? []).flatMap((d) => parseFlashcards(d)));

/**
 * Two filters, narrowing in order: a topic is one deck, and the tags then cut
 * within it. "" is every topic, which is the default both start from.
 */
const topics = computed(() => {
  const counts = new Map<string, { title: string; count: number }>();
  for (const c of cards.value) {
    const seen = counts.get(c.deckId) ?? { title: c.deck, count: 0 };
    seen.count++;
    counts.set(c.deckId, seen);
  }
  return [...counts.entries()].map(([id, t]) => ({ id, ...t }));
});

const topic = ref("");
const topicPool = computed(() =>
  topic.value ? cards.value.filter((c) => c.deckId === topic.value) : cards.value,
);
const topicName = computed(
  () => topics.value.find((t) => t.id === topic.value)?.title ?? "",
);

/** Tag filter, most-used first, counted within the chosen topic. */
const tags = computed(() => {
  const counts = new Map<string, number>();
  for (const c of topicPool.value) {
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

// a tag selected under one topic usually does not exist under the next, and
// leaving it on would silently empty the pool
watch(topic, () => {
  active.value = active.value.filter((t) =>
    tags.value.some((x) => x.tag === t),
  );
});

const pool = computed(() =>
  active.value.length
    ? topicPool.value.filter((c) => c.tags.some((t) => active.value.includes(t)))
    : topicPool.value,
);

const mode = ref<"browse" | "test">("browse");
const revealed = ref(false);

// ---------------------------------------------------------------- browsing

// The deck is a materialised order rather than a computed, so shuffling is a
// state change and not something the filter recomputes away.
const random = ref(false);
const deck = ref<Flashcard[]>([]);
const pos = ref(0);

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

// ------------------------------------------------------------ test rounds

const { record, reset, weight, missedCount } = useCardStats();

const round = ref<Flashcard[]>([]);
const roundPos = ref(0);
/** id -> knew it, for the cards marked so far in this round. */
const marks = ref<Record<string, boolean>>({});
const finished = ref(false);

const roundSize = computed(() => Math.min(ROUND_SIZE, pool.value.length));
const testCard = computed(() => round.value[roundPos.value]);
const score = computed(() => Object.values(marks.value).filter(Boolean).length);
const missed = computed(() =>
  round.value.filter((c) => marks.value[c.id] === false),
);

function startRound() {
  round.value = weightedSample(pool.value, ROUND_SIZE, (c) => weight(c.id));
  roundPos.value = 0;
  marks.value = {};
  finished.value = false;
  revealed.value = false;
}

function endRound() {
  round.value = [];
  finished.value = false;
  revealed.value = false;
}

function mark(knew: boolean) {
  const c = testCard.value;
  if (!c) return;
  record(c.id, knew);
  marks.value = { ...marks.value, [c.id]: knew };
  revealed.value = false;
  if (roundPos.value + 1 >= round.value.length) finished.value = true;
  else roundPos.value++;
}

// ------------------------------------------------------------------ shared

// Retagging changes what both modes are working from, so both go back to the
// start — a round half-drawn from a different pool would be meaningless.
watch(
  pool,
  (next) => {
    deck.value = random.value ? shuffled(next) : next.slice();
    pos.value = 0;
    revealed.value = false;
    endRound();
  },
  { immediate: true },
);

watch(mode, () => {
  revealed.value = false;
  endRound();
});

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.key === " ") {
    // a focused button already toggles on space; only handle the loose case
    if (tag === "BUTTON") return;
    e.preventDefault();
    revealed.value = !revealed.value;
    return;
  }
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

  if (mode.value === "test") {
    if (!round.value.length || finished.value) return;
    e.preventDefault();
    // the arrows only score once the answer is on screen; before that they do
    // the thing you actually want, which is to show it
    if (!revealed.value) revealed.value = true;
    else mark(e.key === "ArrowRight");
    return;
  }
  step(e.key === "ArrowRight" ? 1 : -1);
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

    <div class="modes" role="group" aria-label="Flashcard mode">
      <button
        class="modebtn"
        :class="{ on: mode === 'browse' }"
        :aria-pressed="mode === 'browse' ? 'true' : 'false'"
        @click="mode = 'browse'"
      >
        Browse
      </button>
      <button
        class="modebtn"
        :class="{ on: mode === 'test' }"
        :aria-pressed="mode === 'test' ? 'true' : 'false'"
        @click="mode = 'test'"
      >
        Test yourself
      </button>
    </div>

    <div class="topicbar">
      <label class="topiclabel" for="topic">Topic</label>
      <select id="topic" v-model="topic" class="topicselect">
        <option value="">All topics ({{ cards.length }})</option>
        <option v-for="t in topics" :key="t.id" :value="t.id">
          {{ t.title }} ({{ t.count }})
        </option>
      </select>
    </div>

    <!-- one tag covering the whole topic filters nothing, so it stays hidden -->
    <div v-if="tags.length > 1" class="tagbar">
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

    <!-- ------------------------------------------------------------ browse -->
    <template v-if="mode === 'browse'">
      <template v-if="card">
        <FlashCard
          :card="card"
          :revealed="revealed"
          @flip="revealed = !revealed"
        />

        <div class="deckbar">
          <button class="deckbtn" @click="step(-1)">&larr; Prev</button>
          <span class="deckcount">{{ pos + 1 }} / {{ deck.length }}</span>
          <button class="deckbtn" @click="step(1)">Next &rarr;</button>
          <button v-if="random" class="deckbtn ghostbtn" @click="inOrder">
            In order
          </button>
          <button v-else class="deckbtn ghostbtn" @click="shuffle">
            Shuffle
          </button>
        </div>

        <p class="deckkeys">
          Click the card to flip &middot; <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to
          move &middot; <kbd>space</kbd> to flip
        </p>
      </template>

      <p v-else class="noanswer">
        {{
          cards.length
            ? "No cards match that topic and tags."
            : "No cards yet — add a Markdown file to content/flashcards/."
        }}
      </p>
    </template>

    <!-- -------------------------------------------------------------- test -->
    <template v-else>
      <!-- the round is over -->
      <div v-if="finished" class="summary">
        <div class="score">
          {{ score }} <span>of {{ round.length }}</span>
        </div>
        <p class="summarylead">
          {{
            missed.length
              ? "Coming back more often from now on:"
              : "Clean round — nothing to drill."
          }}
        </p>
        <ul v-if="missed.length" class="missedlist">
          <li v-for="m in missed" :key="m.id">{{ m.question }}</li>
        </ul>
        <div class="deckbar">
          <button class="deckbtn primary" @click="startRound">
            Another {{ roundSize }}
          </button>
          <button class="deckbtn ghostbtn" @click="endRound">Done</button>
        </div>
      </div>

      <!-- a round in progress -->
      <template v-else-if="testCard">
        <div class="roundbar">
          <div class="rbar">
            <div
              class="rfill"
              :style="{ width: `${(roundPos / round.length) * 100}%` }"
            />
          </div>
          <span class="deckcount">{{ roundPos + 1 }} / {{ round.length }}</span>
        </div>

        <FlashCard
          :card="testCard"
          :revealed="revealed"
          @flip="revealed = !revealed"
        />

        <div class="deckbar">
          <template v-if="revealed">
            <button class="deckbtn miss" @click="mark(false)">
              Didn't know it
            </button>
            <button class="deckbtn knew" @click="mark(true)">Knew it</button>
          </template>
          <button v-else class="deckbtn primary" @click="revealed = true">
            Show answer
          </button>
          <button class="deckbtn ghostbtn" @click="endRound">End round</button>
        </div>

        <p class="deckkeys">
          <kbd>space</kbd> to flip &middot; then <kbd>&larr;</kbd> didn't know
          &middot; <kbd>&rarr;</kbd> knew it
        </p>
      </template>

      <!-- waiting to start -->
      <div v-else class="startbox">
        <p v-if="pool.length" class="startlead">
          {{ roundSize }} cards drawn at random from
          <strong>{{ topicName || "all topics" }}</strong
          ><template v-if="active.length">
            tagged {{ active.join(" or ") }}</template
          >, weighted towards the ones you have missed before.
          <template v-if="missedCount">
            {{ missedCount }} card{{ missedCount === 1 ? " is" : "s are" }}
            currently being drilled.
          </template>
        </p>
        <p v-else class="noanswer">No cards match that topic and tags.</p>

        <div v-if="pool.length" class="deckbar">
          <button class="deckbtn primary" @click="startRound">
            Start a round of {{ roundSize }}
          </button>
          <button v-if="missedCount" class="deckbtn ghostbtn" @click="reset">
            Reset progress
          </button>
        </div>
      </div>
    </template>
  </article>
</template>
