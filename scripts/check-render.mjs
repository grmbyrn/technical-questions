#!/usr/bin/env node
/**
 * Crawls every section page on a running dev/preview server and checks the
 * rendered output against the Markdown it came from.
 *
 *   node scripts/check-render.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3111";
const DIR = path.join(import.meta.dirname, "..", "content");

const count = (s, re) => (s.match(re) ?? []).length;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).sort();
let failures = 0;
let totals = { questions: 0, followups: 0, code: 0 };

for (const file of files) {
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const front = src.match(/^---\n([\s\S]*?)\n---/)[1];
  const slug = front.match(/^slug: (.*)$/m)[1].trim();

  const expected = {
    questions: count(src, /^## /gm),
    followups: count(src, /^### /gm),
    code: count(src, /^```/gm) / 2,
  };

  const res = await fetch(`${BASE}/${slug}`);
  if (!res.ok) {
    console.error(`✗ ${slug}: HTTP ${res.status}`);
    failures++;
    continue;
  }
  const html = await res.text();
  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));

  // a section picks its layout from its own content — the moment one answer is
  // written it switches to headings — so read back which one it actually used
  const layout = main.includes('<ul class="qlist">') ? "list" : "headings";

  let actual;
  if (layout === "headings") {
    // outline is h1 section title > h2 question > h3 follow-up
    actual = {
      questions: count(main, /<h2[ >]/g),
      followups: count(main, /<h3[ >]/g),
      code: count(main, /<pre[ >]/g),
    };
  } else {
    // questions are top-level <li>, follow-ups are <li> nested in .flist
    const nested = [...main.matchAll(/<ul class="flist">([\s\S]*?)<\/ul>/g)]
      .map((m) => count(m[1], /<li[ >]/g))
      .reduce((a, b) => a + b, 0);
    actual = {
      questions: count(main, /<li[ >]/g) - nested,
      followups: nested,
      code: count(main, /<pre[ >]/g),
    };
  }

  // the list layout has nowhere to put code, so a section that grew a code
  // block but still renders as a list has silently dropped it
  if (layout === "list" && expected.code > 0) {
    failures++;
    console.error(
      `✗ ${slug}: ${expected.code} code block(s) in the Markdown are not rendered ` +
        `— the page is still using the question-list layout`,
    );
    for (const k of Object.keys(totals)) totals[k] += expected[k];
    continue;
  }

  const bad = ["questions", "followups", "code"].filter(
    (k) => actual[k] !== expected[k],
  );
  if (bad.length) {
    failures++;
    console.error(
      `✗ ${slug} (${layout}): ` +
        bad.map((k) => `${k} ${actual[k]} != ${expected[k]}`).join(", "),
    );
  }
  for (const k of Object.keys(totals)) totals[k] += expected[k];
}

/**
 * Flashcards fail silently: raw HTML in a card swallows the cards below it, or
 * turns into an element whose text simply disappears. Whether the Markdown has
 * that problem is `npm run check-decks`, which needs no server — what needs
 * one is the question this answers, which is whether the cards that survived
 * the Markdown all made it onto the page.
 */
const DECKS = path.join(DIR, "flashcards");
const decks = fs.existsSync(DECKS)
  ? fs.readdirSync(DECKS).filter((f) => f.endsWith(".md")).sort()
  : [];

const cards = decks.reduce(
  (n, f) => n + count(fs.readFileSync(path.join(DECKS, f), "utf8"), /^## /gm),
  0,
);

if (decks.length) {
  const res = await fetch(`${BASE}/flashcards`);
  if (!res.ok) {
    failures++;
    console.error(`✗ flashcards: HTTP ${res.status}`);
  } else {
    const html = await res.text();
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const shown = Number(
      main.replace(/<[^>]+>/g, " ").match(/(\d+)\s+cards?\s+across/)?.[1],
    );
    if (shown !== cards) {
      failures++;
      console.error(
        `✗ flashcards: the page shows ${shown} cards, the Markdown has ` +
          `${cards} — run \`npm run check-decks\`, and restart the dev server ` +
          `if it comes back clean (.data/ is a cache)`,
      );
    }
  }
}

console.log(
  `\n${files.length} pages crawled — ${totals.questions} questions, ` +
    `${totals.followups} follow-ups, ${totals.code} code blocks\n` +
    `${decks.length} decks — ${cards} flashcards`,
);
if (failures) {
  console.error(`✗ ${failures} check(s) did not match the Markdown`);
  process.exit(1);
}
console.log("✓ every page matches the Markdown it came from");
