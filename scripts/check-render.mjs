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
  const status = front.match(/^status: (.*)$/m)[1].trim();

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

  let actual;
  if (status === "answered") {
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

  const bad = ["questions", "followups", "code"].filter(
    (k) => actual[k] !== expected[k],
  );
  if (bad.length) {
    failures++;
    console.error(
      `✗ ${slug} (${status}): ` +
        bad.map((k) => `${k} ${actual[k]} != ${expected[k]}`).join(", "),
    );
  }
  for (const k of Object.keys(totals)) totals[k] += expected[k];
}

console.log(
  `\n${files.length} pages crawled — ${totals.questions} questions, ` +
    `${totals.followups} follow-ups, ${totals.code} code blocks`,
);
if (failures) {
  console.error(`✗ ${failures} page(s) did not match their Markdown`);
  process.exit(1);
}
console.log("✓ every page matches the Markdown it came from");
