<script setup lang="ts">
/**
 * Nuxt Content gives us a flat list of nodes. The design needs them grouped:
 * an h2 starts a question, an h3 starts a follow-up inside it, and everything
 * else belongs to whichever of the two is currently open.
 *
 * Difficulty lives in the heading text as a trailing (E), (M) or (H).
 */
type Node = [string, Record<string, unknown>, ...unknown[]];

const props = defineProps<{
  body?: { value?: Node[] };
  status: "answered" | "questions-only";
}>();

function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.slice(2).map(textOf).join("");
  return "";
}

const questions = computed(() => {
  const out: Array<{
    prompt: string;
    difficulty: string | null;
    body: Node[];
    followups: Array<{ prompt: string; body: Node[] }>;
  }> = [];
  let q: (typeof out)[number] | null = null;
  let f: { prompt: string; body: Node[] } | null = null;

  for (const node of props.body?.value ?? []) {
    const tag = node[0];
    if (tag === "h2") {
      const raw = textOf(node).trim();
      const m = raw.match(/^(.*?)\s*\(([EMH])\)$/);
      q = {
        prompt: m ? m[1]! : raw,
        difficulty: m ? m[2]! : null,
        body: [],
        followups: [],
      };
      f = null;
      out.push(q);
    } else if (tag === "h3" && q) {
      f = { prompt: textOf(node).trim(), body: [] };
      q.followups.push(f);
    } else if (q) {
      (f ? f.body : q.body).push(node);
    }
  }
  return out;
});

/** ContentRenderer wants a document; hand it a slice of one. */
const asDoc = (value: Node[]) => ({ body: { type: "minimal", value } });
</script>

<template>
  <!-- sections with answers written -->
  <template v-if="status === 'answered'">
    <div v-for="(q, i) in questions" :key="i" class="qa">
      <h3>
        {{ q.prompt }}
        <span v-if="q.difficulty" class="tag">({{ q.difficulty }})</span>
      </h3>
      <ContentRenderer v-if="q.body.length" :value="asDoc(q.body)" />
      <div v-for="(f, j) in q.followups" :key="j" class="follow">
        <h4>{{ f.prompt }}</h4>
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
