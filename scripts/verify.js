#!/usr/bin/env node
/**
 * Four checks:
 *
 *   1. content/*.md still matches the original hand-written index.html
 *      (git 287f46c) — the migration lost nothing.
 *   2. index.html contains ZERO question or answer text — no prompt, no
 *      paragraph, no code sample, no follow-up, and none of the markup that
 *      would hold them.
 *   3. manifest.json agrees with the Markdown on every section's metadata.
 *   4. the browser's Markdown parser agrees with the Node one, file by file.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");
const { parse } = require("./extract.js");
const { loadSections } = require("./lib.js");
const { buildManifest } = require("./build.js");

const ROOT = path.join(__dirname, "..");
const BASELINE = "287f46c:index.html";

let failures = 0;
function pass(msg) {
  console.log("✓ " + msg);
}
function fail(msg, detail) {
  failures++;
  console.error("✗ " + msg);
  (detail || []).slice(0, 8).forEach((d) => console.error("   " + d));
}

function checkAgainstOriginal(source) {
  let original;
  try {
    original = execFileSync("git", ["show", BASELINE], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    console.log(`- skipped: baseline ${BASELINE} not reachable`);
    return;
  }
  const expected = parse(original);
  const problems = [];
  if (expected.length !== source.length) {
    problems.push(`section count ${source.length} != ${expected.length}`);
  }
  expected.forEach((e, i) => {
    try {
      assert.deepStrictEqual(source[i], e);
    } catch (err) {
      problems.push(`${e.slug}: ${err.message.split("\n")[0]}`);
    }
  });
  problems.length
    ? fail("content/*.md matches the original hand-written HTML", problems)
    : pass("content/*.md matches the original hand-written HTML");
}

function checkHtmlHasNoContent(source) {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const problems = [];

  // Markup that could only exist to hold questions or answers. Checked against
  // the document body only — the stylesheet defines these classes and the
  // renderer builds them as strings, which is not the same as shipping content.
  const markup = html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<script>[\s\S]*?<\/script>/g, "");
  ["qa", "qlist", "flist", "follow", "eyebrow", "badge", "tag"].forEach((c) => {
    if (markup.includes(`class="${c}`)) {
      problems.push(`found class="${c}" in the document body`);
    }
  });

  // every prompt and every paragraph of prose, verbatim
  let checked = 0;
  for (const s of source) {
    for (const q of s.questions) {
      const strings = [q.prompt]
        .concat(q.followups.map((f) => f.prompt))
        .concat(q.body.filter((b) => b.type === "p").map((b) => b.text))
        .concat(q.body.filter((b) => b.type === "code").map((b) => b.text))
        .concat(
          q.followups.flatMap((f) => f.body.map((b) => b.text)),
        );
      for (const str of strings) {
        checked++;
        // compare on a distinctive slice; short fragments risk false positives
        const probe = str.slice(0, 60);
        if (probe.length > 20 && html.includes(probe)) {
          problems.push(`leaked into index.html: ${JSON.stringify(probe)}`);
        }
      }
    }
  }

  problems.length
    ? fail(`index.html contains no question or answer text`, problems)
    : pass(
        `index.html contains no question or answer text ` +
          `(${checked} strings probed, 0 found)`,
      );
}

function checkManifest(source) {
  const expected = buildManifest(source);
  const actual = JSON.parse(
    fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"),
  );
  try {
    assert.deepStrictEqual(actual, expected);
    // and it must not carry content of its own
    const blob = JSON.stringify(actual);
    const leaked = source
      .flatMap((s) => s.questions.map((q) => q.prompt))
      .filter((p) => blob.includes(p.slice(0, 40)));
    if (leaked.length) {
      return fail("manifest.json holds nav metadata only", [
        `${leaked.length} prompt(s) present`,
      ]);
    }
    pass("manifest.json matches the Markdown, and holds metadata only");
  } catch (err) {
    fail("manifest.json matches the Markdown", [err.message.split("\n")[0]]);
  }
}

/**
 * The browser ships its own copy of the Markdown parser (src/app.js). Two
 * implementations of one format drift silently, so assert they agree on every
 * file before that can happen.
 */
function checkParserParity(source) {
  const app = fs.readFileSync(path.join(ROOT, "src/app.js"), "utf8");
  const start = app.indexOf("function parseMarkdown(");
  if (start === -1) return fail("browser parser found in src/app.js", []);

  let depth = 0;
  let end = start;
  for (let i = app.indexOf("{", start); i < app.length; i++) {
    if (app[i] === "{") depth++;
    else if (app[i] === "}" && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  const browserParse = new Function(
    app.slice(start, end) + "; return parseMarkdown;",
  )();

  const problems = [];
  const dir = path.join(ROOT, "content");
  for (const s of source) {
    const file = `${String(s.order).padStart(2, "0")}-${s.slug}.md`;
    const questions = browserParse(
      fs.readFileSync(path.join(dir, file), "utf8"),
    );
    try {
      assert.deepStrictEqual(questions, s.questions);
    } catch (err) {
      problems.push(`${file}: ${err.message.split("\n")[0]}`);
    }
  }
  problems.length
    ? fail("browser and Node Markdown parsers agree", problems)
    : pass(
        `browser and Node Markdown parsers agree on all ${source.length} files`,
      );
}

function main() {
  const source = loadSections();
  const q = source.reduce((n, s) => n + s.questions.length, 0);
  const files = fs.readdirSync(path.join(ROOT, "content")).filter((f) =>
    f.endsWith(".md"),
  ).length;
  console.log(`content/: ${files} Markdown files, ${q} questions\n`);

  checkAgainstOriginal(source);
  checkHtmlHasNoContent(source);
  checkManifest(source);
  checkParserParity(source);

  if (failures) process.exit(1);
  const bytes = fs.statSync(path.join(ROOT, "index.html")).size;
  console.log(
    `\nAll content lives in content/*.md. index.html is a ` +
      `${(bytes / 1024).toFixed(1)} KB shell.`,
  );
}

if (require.main === module) main();
