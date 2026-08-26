/**
 * Per-card scoring for the test rounds, kept in localStorage.
 *
 * The point of the score is to bias which cards a round draws: a card you
 * missed should keep coming back until you stop missing it, and a card you
 * have known three times running should mostly get out of the way.
 */
export interface CardStat {
  /** Times marked "didn't know". Never decays — a hard card stays weighted. */
  misses: number;
  /** Consecutive times marked "knew it" since the last miss. */
  hits: number;
  seen: number;
}

const KEY = "flashcards:stats:v1";

/**
 * Relative odds of a card being drawn into a round.
 *
 *   unseen              1
 *   missed once         4      (four times as likely as an unseen card)
 *   missed once, then
 *     known once        2      (halved, but still above unseen)
 *   known three times   0.25
 *
 * Misses push up, a run of hits divides back down, and nothing ever reaches
 * zero — every card stays in the pool.
 */
export const weightOf = (stat?: CardStat) =>
  stat ? (1 + 3 * stat.misses) / (1 + stat.hits) : 1;

export function useCardStats() {
  const stats = ref<Record<string, CardStat>>({});

  // localStorage does not exist during prerender, and reading it in setup
  // would desync the server-rendered markup from the first client render
  onMounted(() => {
    try {
      stats.value = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      stats.value = {};
    }
  });

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(stats.value));
    } catch {
      // private browsing, or the quota is full — the round still works
    }
  }

  function record(id: string, knew: boolean) {
    const s = stats.value[id] ?? { misses: 0, hits: 0, seen: 0 };
    stats.value[id] = {
      misses: s.misses + (knew ? 0 : 1),
      hits: knew ? s.hits + 1 : 0,
      seen: s.seen + 1,
    };
    save();
  }

  function reset() {
    stats.value = {};
    save();
  }

  const weight = (id: string) => weightOf(stats.value[id]);
  const missedCount = computed(
    () => Object.values(stats.value).filter((s) => s.misses > s.hits).length,
  );

  return { stats, record, reset, weight, missedCount };
}

/**
 * Draws `n` distinct items, each item's chance proportional to its weight.
 *
 * Weights are recomputed against the shrinking pool on every draw, which is
 * what keeps it sampling *without* replacement — no card appears twice in one
 * round however heavily it is weighted.
 */
export function weightedSample<T>(
  items: T[],
  n: number,
  weightOf: (item: T) => number,
): T[] {
  const pool = items.slice();
  const out: T[] = [];

  while (out.length < n && pool.length) {
    const weights = pool.map(weightOf);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < pool.length - 1 && (r -= weights[i]!) > 0) i++;
    out.push(pool.splice(i, 1)[0]!);
  }
  return out;
}
