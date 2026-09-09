/**
 * Nuxt Content gives us a flat list of nodes. The design needs them grouped:
 * an h2 starts a question, an h3 starts a follow-up inside it, and everything
 * else belongs to whichever of the two is currently open.
 *
 * One h3 is special: `### Connected questions` is not a follow-up but the list
 * of other prompts the same story answers, which the page keeps folded away.
 *
 * Difficulty lives in the heading text as a trailing (E), (M) or (H).
 *
 * Shared between SectionBody (which renders the grouping) and the section page
 * (which only needs to know how much of it has been answered).
 */
export type Node = [string, Record<string, unknown>, ...unknown[]];

export interface Followup {
  prompt: string;
  body: Node[];
}

export interface Question {
  prompt: string;
  difficulty: string | null;
  body: Node[];
  followups: Followup[];
  /** Raw nodes under `### Connected questions`, rendered inside a <details>. */
  connected: Node[];
}

/** The h3 that opens a connected-questions block rather than a follow-up. */
const CONNECTED = /^connected questions\b/i;

/** Flattens an MDC node back to its plain text. Also used by the flashcards. */
export function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.slice(2).map(textOf).join("");
  return "";
}

export function parseQuestions(body?: { value?: Node[] }): Question[] {
  const out: Question[] = [];
  let q: Question | null = null;
  // where the nodes after the current heading are collected
  let target: Node[] | null = null;

  for (const node of body?.value ?? []) {
    const tag = node[0];
    if (tag === "h2") {
      const raw = textOf(node).trim();
      const m = raw.match(/^(.*?)\s*\(([EMH])\)$/);
      q = {
        prompt: m ? m[1]! : raw,
        difficulty: m ? m[2]! : null,
        body: [],
        followups: [],
        connected: [],
      };
      target = q.body;
      out.push(q);
    } else if (tag === "h3" && q) {
      const prompt = textOf(node).trim();
      if (CONNECTED.test(prompt)) {
        target = q.connected;
      } else {
        const f: Followup = { prompt, body: [] };
        q.followups.push(f);
        target = f.body;
      }
    } else if (target) {
      target.push(node);
    }
  }
  return out;
}

/** How many prompts a connected block lists, for the summary line. */
export function countItems(nodes: Node[]): number {
  let n = 0;
  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return;
    if (node[0] === "li") n += 1;
    node.slice(2).forEach(walk);
  };
  nodes.forEach(walk);
  return n;
}

/**
 * Content appends Shiki's highlight <style> to the end of the body, so the
 * last follow-up on a page with code always ends up holding one. It is not an
 * answer, and counting it would light up a question nobody has written yet.
 */
const isProse = (node: Node) => node[0] !== "style" && node[0] !== "script";
const hasProse = (body: Node[]) => body.some(isProse);

/**
 * A question counts as answered once it has prose of its own or any of its
 * follow-ups do — that is what decides both the layout and the badge, so
 * writing an answer is enough to make it show up. No flag to remember.
 */
export const isAnswered = (q: Question) =>
  hasProse(q.body) || q.followups.some((f) => hasProse(f.body));

export function answerProgress(questions: Question[]) {
  const done = questions.filter(isAnswered).length;
  return { done, total: questions.length };
}
