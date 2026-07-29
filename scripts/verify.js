#!/usr/bin/env node
/**
 * Proves content/*.md is a faithful, lossless source of truth — twice over:
 *
 *   1. against the original hand-written index.html (git 287f46c), so the
 *      migration provably lost nothing;
 *   2. against the current generated index.html, so the build provably emits
 *      everything the Markdown holds.
 *
 * Comparison is on *content*, not bytes: the original was Prettier-wrapped and
 * the generated file is not, so byte equality is not a meaningful goal.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execFileSync } = require("child_process");
const { parse } = require("./extract.js");
const { loadSections } = require("./lib.js");

const ROOT = path.join(__dirname, "..");
const BASELINE = "287f46c:index.html";

const tally = (secs) => {
  const walk = (pred) =>
    secs.reduce(
      (n, s) =>
        n +
        s.questions.reduce(
          (m, q) =>
            m +
            q.body.filter(pred).length +
            q.followups.reduce((k, f) => k + f.body.filter(pred).length, 0),
          0,
        ),
      0,
    );
  return {
    sections: secs.length,
    questions: secs.reduce((n, s) => n + s.questions.length, 0),
    followups: secs.reduce(
      (n, s) => n + s.questions.reduce((m, q) => m + q.followups.length, 0),
      0,
    ),
    paragraphs: walk((b) => b.type === "p"),
    code: walk((b) => b.type === "code"),
  };
};

function compare(label, expected, actual) {
  const problems = [];
  if (expected.length !== actual.length) {
    problems.push(`section count ${actual.length} != ${expected.length}`);
  }
  expected.forEach((e, i) => {
    try {
      assert.deepStrictEqual(actual[i], e);
    } catch (err) {
      problems.push(`${e.slug}: ${err.message.split("\n")[0]}`);
    }
  });
  if (problems.length) {
    console.error(`\n✗ ${label} — ${problems.length} difference(s):`);
    problems.slice(0, 10).forEach((p) => console.error("   " + p));
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

function main() {
  const source = loadSections();
  console.log("content/*.md:", JSON.stringify(tally(source)), "\n");

  let ok = true;

  // 1. nothing was lost migrating out of the original hand-written HTML
  let original;
  try {
    original = execFileSync("git", ["show", BASELINE], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    console.log(`- skipped baseline check (${BASELINE} not reachable)`);
  }
  if (original) {
    ok = compare("matches original hand-written index.html", parse(original), source) && ok;
  }

  // 2. the build emits everything the Markdown holds
  const generatedPath = path.join(ROOT, "index.html");
  if (fs.existsSync(generatedPath)) {
    const generated = parse(fs.readFileSync(generatedPath, "utf8"));
    ok = compare("matches generated index.html", source, generated) && ok;
  } else {
    console.log("- skipped build check (index.html not built yet)");
  }

  if (!ok) process.exit(1);
  console.log("\ncontent/*.md is the single source of truth.");
}

if (require.main === module) main();
