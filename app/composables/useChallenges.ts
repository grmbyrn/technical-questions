import type { Node } from "~/composables/useQuestions";

/**
 * A solved code challenge is one Markdown file in content/challenges/, written
 * as ordinary `##` sections: the problem, then the solution, then whatever
 * notes are worth keeping.
 *
 * The split that matters for revision is where the answer starts. Everything
 * from the first "Solution" heading onwards is held back behind a button, so
 * the page can be read as a problem to attempt rather than one to remember —
 * see CHALLENGES.md.
 */
export interface ChallengeSection {
  /** The `##` text. Empty for anything written above the first heading. */
  title: string;
  nodes: Node[];
}

export interface Challenge {
  slug: string;
  title: string;
  source?: string;
  url?: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  completed?: string;
  body?: { value?: Node[] };
}

export function splitSections(body?: { value?: Node[] }): ChallengeSection[] {
  const out: ChallengeSection[] = [];
  let current: ChallengeSection | null = null;

  for (const node of body?.value ?? []) {
    if (node[0] === "h2") {
      current = { title: textOf(node).trim(), nodes: [] };
      out.push(current);
      continue;
    }
    // anything before the first heading gets an untitled section of its own
    if (!current) {
      current = { title: "", nodes: [] };
      out.push(current);
    }
    current.nodes.push(node);
  }
  return out;
}

/** The heading that starts the answer. Everything from here down is hidden. */
const SOLUTION = /^(my )?(solution|answer|approach|walkthrough)\b/i;

export function splitAtSolution(sections: ChallengeSection[]) {
  const at = sections.findIndex((s) => SOLUTION.test(s.title));
  // no Solution heading means nothing to hide — show the lot
  return at === -1
    ? { problem: sections, solution: [] }
    : { problem: sections.slice(0, at), solution: sections.slice(at) };
}

/** Newest first; anything undated sorts to the end. */
const byNewest = (a: Challenge, b: Challenge) =>
  (b.completed ?? "").localeCompare(a.completed ?? "");

export function useChallenges() {
  return useAsyncData("challenges", async () => {
    const all = await queryCollection("challenges").all();
    return (all as Challenge[]).slice().sort(byNewest);
  });
}
