#!/usr/bin/env node
/**
 * Round-trip check: parse the generated Markdown back into the same shape the
 * extractor produced from index.html, and prove the two are identical.
 *
 * This compares *content*, not bytes. The original HTML is Prettier-wrapped,
 * so re-emitting byte-identical HTML is not a meaningful goal; what matters is
 * that every question, answer paragraph, code sample and follow-up survived.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const yaml = require("js-yaml");
const { parse } = require("./extract.js");

const ROOT = path.join(__dirname, "..");

/** Markdown -> the extractor's section shape. */
function parseMarkdown(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("missing frontmatter");
  const section = yaml.load(m[1]);
  section.questions = [];

  const lines = m[2].split("\n");
  let q = null;
  let f = null;
  let para = [];

  const flushPara = () => {
    const text = para.join(" ").replace(/\s+/g, " ").trim();
    para = [];
    if (!text) return;
    (f ? f.body : q.body).push({ type: "p", text });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^(`{3,})\s*\w*$/);

    if (fence) {
      flushPara();
      const close = fence[1];
      const code = [];
      i++;
      while (i < lines.length && lines[i].trimEnd() !== close) code.push(lines[i++]);
      (f ? f.body : q.body).push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (line.startsWith("## ")) {
      flushPara();
      const t = line.slice(3).match(/^(.*?)(?:\s+\(([EMH])\))?$/);
      q = { prompt: t[1], difficulty: t[2] || null, body: [], followups: [] };
      f = null;
      section.questions.push(q);
      continue;
    }

    if (line.startsWith("### ")) {
      flushPara();
      f = { prompt: line.slice(4), body: [] };
      q.followups.push(f);
      continue;
    }

    if (line.trim() === "") flushPara();
    else para.push(line.trim());
  }
  flushPara();
  return section;
}

function main() {
  const fromHtml = parse(
    fs.readFileSync(path.join(ROOT, "index.html"), "utf8"),
  );
  const files = fs
    .readdirSync(path.join(ROOT, "content"))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const problems = [];
  assert.strictEqual(
    files.length,
    fromHtml.length,
    `file count ${files.length} != section count ${fromHtml.length}`,
  );

  files.forEach((file, i) => {
    const expected = fromHtml[i];
    let actual;
    try {
      actual = parseMarkdown(
        fs.readFileSync(path.join(ROOT, "content", file), "utf8"),
      );
    } catch (e) {
      problems.push(`${file}: unparseable — ${e.message}`);
      return;
    }
    try {
      assert.deepStrictEqual(actual, expected);
    } catch (e) {
      problems.push(`${file}: ${e.message.split("\n").slice(0, 6).join(" ")}`);
    }
  });

  // totals, as an independent cross-check on the per-file comparison
  const tally = (secs) => ({
    sections: secs.length,
    questions: secs.reduce((n, s) => n + s.questions.length, 0),
    followups: secs.reduce(
      (n, s) => n + s.questions.reduce((m, q) => m + q.followups.length, 0),
      0,
    ),
    paragraphs: secs.reduce(
      (n, s) =>
        n +
        s.questions.reduce(
          (m, q) =>
            m +
            q.body.filter((b) => b.type === "p").length +
            q.followups.reduce(
              (k, f) => k + f.body.filter((b) => b.type === "p").length,
              0,
            ),
          0,
        ),
      0,
    ),
    codeChars: secs.reduce(
      (n, s) =>
        n +
        s.questions.reduce(
          (m, q) =>
            m +
            q.body
              .filter((b) => b.type === "code")
              .reduce((k, b) => k + b.text.length, 0) +
            q.followups.reduce(
              (k, f) =>
                k +
                f.body
                  .filter((b) => b.type === "code")
                  .reduce((j, b) => j + b.text.length, 0),
              0,
            ),
          0,
        ),
      0,
    ),
  });

  const a = tally(fromHtml);
  console.log("from index.html:", JSON.stringify(a));

  if (problems.length) {
    console.error(`\n✗ ${problems.length} section(s) differ:\n`);
    problems.slice(0, 10).forEach((p) => console.error("  " + p));
    process.exit(1);
  }
  console.log(
    `\n✓ round-trip clean — all ${files.length} sections identical after ` +
      `HTML -> Markdown -> parse`,
  );
}

if (require.main === module) main();
module.exports = { parseMarkdown };
