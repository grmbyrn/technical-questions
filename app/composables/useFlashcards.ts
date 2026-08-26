import type { Node } from "~/composables/useQuestions";

/**
 * A deck is a Markdown file in content/flashcards/. Inside it every `##`
 * heading starts a card: the heading is the front, everything under it until
 * the next `##` is the back.
 *
 * A heading is a single line of inline Markdown, so it cannot hold a list or a
 * code block. When the question needs one, a `---` rule splits the card: what
 * is above it joins the front, what is below is the answer. Cards with no rule
 * keep the simple reading — heading asks, body answers.
 *
 * Tags come from the file's frontmatter and apply to every card in it. A card
 * can add its own by ending the heading with square brackets:
 *
 *   ## Why is useEffect's cleanup called before the next effect? [hooks]
 *
 * Keeping both in the heading means adding a card never means touching a
 * second file — see FLASHCARDS.md.
 */
export interface Flashcard {
  id: string;
  question: string;
  tags: string[];
  /** Extra front-of-card content — the lists and code a heading cannot hold. */
  front: Node[];
  /** MDC nodes for the answer; empty when the card has no answer written. */
  answer: Node[];
  hasAnswer: boolean;
}

export interface Deck {
  id: string;
  title: string;
  tags?: string[];
  body?: { value?: Node[] };
}

/** Tags are compared and displayed lowercase, so `React` and `react` are one. */
const normalise = (tag: string) => tag.trim().toLowerCase();

/**
 * Shiki appends its highlight <style> to the end of the body, so the last card
 * in a deck with code always inherits one. It still has to be rendered (the
 * code depends on it) but it is not an answer, and counting it would make an
 * empty card look written.
 */
const isProse = (node: Node) => node[0] !== "style" && node[0] !== "script";

const splitTags = (raw: string) => raw.split(",").map(normalise).filter(Boolean);

/**
 * Splits `## Question here [hooks, perf]` into its two halves.
 *
 * MDC reads `[text]` as its inline-span syntax, so by the time the heading
 * reaches us the brackets are gone and the tags are a trailing `span` child.
 * That is the case that actually fires; the regex is the fallback for a
 * heading whose brackets did survive as plain text.
 */
function splitHeading(node: Node): { question: string; tags: string[] } {
  const children = node.slice(2);
  const last = children[children.length - 1];

  if (Array.isArray(last) && last[0] === "span") {
    return {
      question: children.slice(0, -1).map(textOf).join("").trim(),
      tags: splitTags(textOf(last)),
    };
  }

  const raw = children.map(textOf).join("").trim();
  const m = raw.match(/^(.*?)\s*\[([^\]]+)\]$/);
  return m
    ? { question: m[1]!.trim(), tags: splitTags(m[2]!) }
    : { question: raw, tags: [] };
}

/**
 * Everything under a heading, cut at the first `---`. No rule means the whole
 * body is the answer, which is the common case and the one that reads best in
 * the Markdown.
 */
function splitBody(nodes: Node[]): Pick<Flashcard, "front" | "answer" | "hasAnswer"> {
  const rule = nodes.findIndex((n) => n[0] === "hr");
  const front = rule === -1 ? [] : nodes.slice(0, rule);
  const answer = rule === -1 ? nodes : nodes.slice(rule + 1);
  return { front, answer, hasAnswer: answer.some(isProse) };
}

export function parseFlashcards(deck: Deck): Flashcard[] {
  const base = (deck.tags ?? []).map(normalise).filter(Boolean);
  const out: Flashcard[] = [];
  let body: Node[] = [];

  // the split needs the whole body in hand, so cards are finished on the way
  // out: when the next heading arrives, and again after the last node
  const finish = () => {
    const card = out[out.length - 1];
    if (card) Object.assign(card, splitBody(body));
    body = [];
  };

  for (const node of deck.body?.value ?? []) {
    if (node[0] === "h2") {
      finish();
      const { question, tags } = splitHeading(node);
      out.push({
        id: `${deck.id}#${out.length}`,
        question,
        tags: [...new Set([...base, ...tags])],
        front: [],
        answer: [],
        hasAnswer: false,
      });
    } else if (out.length) {
      body.push(node);
    }
  }
  finish();

  return out;
}

/** Every card in every deck, in file order then heading order. */
export function useFlashcards() {
  return useAsyncData("flashcards", () =>
    queryCollection("flashcards").order("order", "ASC").all(),
  );
}

/** Fisher-Yates on a copy — the source order stays intact for "in order". */
export function shuffled<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
