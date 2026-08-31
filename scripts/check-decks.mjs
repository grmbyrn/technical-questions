#!/usr/bin/env node
/**
 * Lints the flashcard decks, and fixes the fixable part.
 *
 *   npm run check-decks     report problems
 *   npm run fix-decks       rewrite the ones that can be fixed automatically
 *
 * No server needed — this reads the Markdown directly, so it is the fast way
 * to find out why a card is not showing up the way you wrote it.
 */
import fs from "node:fs";
import path from "node:path";

const FIX = process.argv.includes("--fix");
const DIR = path.join(import.meta.dirname, "..", "content", "flashcards");

const decks = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).sort()
  : [];

let problems = 0;
let fixed = 0;
const orders = new Map();
const questions = new Map();

const problem = (where, msg, line) => {
  problems++;
  console.error(`✗ ${where}: ${msg}${line ? `\n    ${line}` : ""}`);
};

/**
 * Wraps anything tag-shaped in backticks so it renders as text.
 *
 * A balanced pair is wrapped whole (`<li>x</li>`), otherwise the lone tag is
 * (`<Welcome />`). An identifier butted up against the `<` comes along with
 * it, so a TypeScript generic is wrapped as `Partial<Options>` rather than as
 * a bare `<Options>` hanging off the name.
 *
 * It is still the conservative fix — always correct, but if the tag sat inside
 * a longer expression you may want to widen the backticks by hand.
 */
const IDENT = "([A-Za-z_$][\\w$.]*)?";
const TAGS = new RegExp(
  `${IDENT}<([a-zA-Z][\\w.-]*)([^>]*)>([\\s\\S]*?)<\\/\\2>|${IDENT}<[a-zA-Z/!][^>]*>`,
  "g",
);

const backtick = (segment) => segment.replace(TAGS, (m) => `\`${m}\``);

for (const file of decks) {
  const where = `flashcards/${file}`;
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const lines = src.split("\n");
  const out = [];
  let fenced = false;
  let changed = false;

  // ---- frontmatter ----
  const front = src.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!front) problem(where, "no frontmatter — needs at least a `title:`");
  else {
    if (!/^title:/m.test(front)) problem(where, "frontmatter has no `title:`");

    // a duplicate `order` leaves the deck sequence up to the database
    const order = front.match(/^order: (.*)$/m)?.[1]?.trim();
    if (order !== undefined) {
      if (orders.has(order)) {
        problem(where, `order ${order} is already used by ${orders.get(order)}`);
      } else orders.set(order, where);
    }
  }

  if (!/^## /m.test(src)) {
    console.warn(`… ${where}: no cards yet — a card is a \`## \` heading`);
  }

  // ---- line by line ----
  lines.forEach((raw, i) => {
    let line = raw;

    /*
     * Invisible characters, which is the worst way for a card to break. A
     * heading is `##` followed by a *space*; paste one in from a browser or a
     * word processor and the space can be a non-breaking space instead, which
     * looks identical and is not a heading at all — the card silently becomes
     * part of the answer above it.
     */
    const invisible = raw.match(/[\u00a0\u2007\u202f\u200b\u200c\ufeff]/g);
    if (invisible) {
      const cleaned = raw
        .replace(/[\u00a0\u2007\u202f]/g, " ") // look like a space, are not
        .replace(/[\u200b\u200c\ufeff]/g, ""); // look like nothing at all
      const what =
        {
          "\u00a0": "non-breaking space",
          "\u2007": "figure space",
          "\u202f": "narrow no-break space",
          "\u200b": "zero-width space",
          "\u200c": "zero-width non-joiner",
          "\ufeff": "byte-order mark",
        }[invisible[0]] ?? "invisible character";
      const heading = /^##[^ \t]/.test(line);

      if (FIX) {
        line = cleaned;
        changed = true;
        fixed++;
        console.log(
          `✎ ${where}:${i + 1}  ${what}${heading ? " after ##" : ""}\n` +
            `    ${cleaned.trim().slice(0, 78)}`,
        );
      } else {
        problem(
          `${where}:${i + 1}`,
          heading
            ? `a ${what} after \`##\` — this is NOT a heading, so the card is ` +
              `swallowed by the answer above it`
            : `contains a ${what}`,
          line.trim(),
        );
      }
    }

    if (line.trimStart().startsWith("```")) fenced = !fenced;

    if (fenced || line.startsWith("```")) {
      out.push(line);
      return;
    }

    // Cards are identified by their question, so two identical questions share
    // a score in the test rounds.
    if (line.startsWith("## ")) {
      const key = line
        .slice(3)
        .replace(/\s*\[[^\]]+\]\s*$/, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      if (questions.has(key)) {
        problem(
          `${where}:${i + 1}`,
          `the same question is already in ${questions.get(key)} — they will ` +
            `share one score`,
          line.trim(),
        );
      } else questions.set(key, `${where}:${i + 1}`);
    }

    // Text outside backticks goes to the HTML parser. An unclosed tag swallows
    // every card below it; a closed or self-closing one becomes an element and
    // its text disappears. Both are silent.
    const segments = line.split("`");
    if (segments.length % 2 === 0) {
      problem(`${where}:${i + 1}`, "odd number of backticks", line.trim());
      out.push(line);
      return;
    }

    const bare = segments.filter((_, n) => n % 2 === 0).join("");
    const tag = bare.match(/<[a-zA-Z/!][^>]*>/)?.[0];
    if (!tag) {
      out.push(line);
      return;
    }

    if (!FIX) {
      problem(
        `${where}:${i + 1}`,
        `\`${tag}\` is parsed as HTML, not text — wrap it in backticks`,
        line.trim(),
      );
      out.push(line);
      return;
    }

    const next = segments.map((s, n) => (n % 2 ? s : backtick(s))).join("`");
    changed = true;
    fixed++;
    console.log(`✎ ${where}:${i + 1}\n    - ${line.trim()}\n    + ${next.trim()}`);
    out.push(next);
  });

  if (fenced) problem(where, "a ``` code fence is never closed");
  if (changed) fs.writeFileSync(path.join(DIR, file), out.join("\n"));
}

const cards = decks.reduce(
  (n, f) =>
    n + (fs.readFileSync(path.join(DIR, f), "utf8").match(/^## /gm) ?? []).length,
  0,
);

console.log(`\n${decks.length} decks — ${cards} cards`);

if (FIX) {
  console.log(
    fixed ? `✓ fixed ${fixed} line(s)` : "✓ nothing to fix",
    problems ? `— ${problems} problem(s) still need you` : "",
  );
  process.exit(problems ? 1 : 0);
}
if (problems) {
  console.error(`✗ ${problems} problem(s) — \`npm run fix-decks\` fixes the HTML ones`);
  process.exit(1);
}
console.log("✓ every deck is clean");
