#!/usr/bin/env node
/**
 * index.html -> content/*.md  (one Markdown file per section)
 *
 * Conventions in the generated Markdown:
 *   ##  question       trailing (E|M|H) is the difficulty tag
 *   ### follow-up
 *   fenced block       code sample, verbatim
 *   anything else      a prose paragraph
 *
 * Sections that have no answers yet emit questions and follow-ups with no
 * body, which is exactly how they are stored today.
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content");

const norm = (s) => s.replace(/\s+/g, " ").trim();

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Difficulty letter from a `<span class="tag">(M)</span>`, if present. */
function difficultyOf($el) {
  const m = $el.find("> .tag").first().text().match(/\(([EMH])\)/);
  return m ? m[1] : null;
}

/** Text of an element with the difficulty tag and any nested list removed. */
function promptOf($, el, dropSelector) {
  const c = $(el).clone();
  c.find(".tag").remove();
  if (dropSelector) c.find(dropSelector).remove();
  return norm(c.text());
}

/** Walk an element's children in document order into typed body blocks. */
function bodyOf($, $container, { paraSelector }) {
  const blocks = [];
  $container.children().each((_, node) => {
    const $n = $(node);
    if ($n.is(paraSelector)) {
      const text = norm($n.text());
      if (text) blocks.push({ type: "p", text });
    } else if ($n.is("pre")) {
      // internal whitespace is meaningful; trailing whitespace never is
      blocks.push({
        type: "code",
        text: $n.find("code").text().replace(/\s+$/, ""),
      });
    }
  });
  return blocks;
}

function parse(html) {
  const $ = cheerio.load(html);
  const sections = [];

  $("main > section.section").each((order, el) => {
    const $s = $(el);
    const heading = norm($s.find("> h2").first().text());
    const m = heading.match(/^(\S+?)\.\s+(.+)$/);
    const number = m ? m[1] : String(order + 1);
    const title = m ? m[2] : heading;
    const answered = $s.find("> .badge").first().hasClass("done");

    const questions = [];

    if (answered) {
      $s.find("> .qa").each((_, qaEl) => {
        const $qa = $(qaEl);
        const $h3 = $qa.find("> h3").first();
        questions.push({
          prompt: promptOf($, $h3),
          difficulty: difficultyOf($h3),
          body: bodyOf($, $qa, { paraSelector: "p:not(.f)" }),
          followups: $qa
            .find("> .follow")
            .map((__, fEl) => {
              const $f = $(fEl);
              return {
                prompt: norm($f.find("> h4").first().text()),
                body: bodyOf($, $f, { paraSelector: "p.f" }),
              };
            })
            .get(),
        });
      });
    } else {
      $s.find("> ul.qlist > li").each((_, liEl) => {
        const $li = $(liEl);
        questions.push({
          prompt: promptOf($, $li, "ul.flist"),
          difficulty: difficultyOf($li),
          body: [],
          followups: $li
            .find("> ul.flist > li")
            .map((__, fEl) => ({ prompt: norm($(fEl).text()), body: [] }))
            .get(),
        });
      });
    }

    sections.push({
      slug: slugify(title),
      order,
      number,
      group: norm($s.find("> .eyebrow").first().text()),
      title,
      status: answered ? "answered" : "questions-only",
      questions,
    });
  });

  return sections;
}

/** Pick a fence long enough to contain the sample (template literals!). */
function fenceFor(code) {
  const longest = (code.match(/`+/g) || []).reduce(
    (n, run) => Math.max(n, run.length),
    0,
  );
  return "`".repeat(Math.max(3, longest + 1));
}

function toMarkdown(section) {
  const { questions, ...front } = section;
  const out = ["---", yaml.dump(front, { lineWidth: -1 }).trim(), "---", ""];

  const emitBody = (body) => {
    for (const b of body) {
      if (b.type === "p") out.push(b.text, "");
      else {
        const f = fenceFor(b.text);
        out.push(f, b.text.replace(/\n+$/, ""), f, "");
      }
    }
  };

  for (const q of questions) {
    out.push(`## ${q.prompt}${q.difficulty ? ` (${q.difficulty})` : ""}`, "");
    emitBody(q.body);
    for (const f of q.followups) {
      out.push(`### ${f.prompt}`, "");
      emitBody(f.body);
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function main() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const sections = parse(html);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const s of sections) {
    const name = `${String(s.order).padStart(2, "0")}-${s.slug}.md`;
    fs.writeFileSync(path.join(OUT, name), toMarkdown(s), "utf8");
  }

  fs.writeFileSync(
    path.join(ROOT, "content.json"),
    JSON.stringify(sections, null, 2),
    "utf8",
  );

  const q = sections.reduce((n, s) => n + s.questions.length, 0);
  const f = sections.reduce(
    (n, s) => n + s.questions.reduce((m, x) => m + x.followups.length, 0),
    0,
  );
  const c = sections.reduce(
    (n, s) =>
      n +
      s.questions.reduce(
        (m, x) =>
          m +
          x.body.filter((b) => b.type === "code").length +
          x.followups.reduce(
            (k, ff) => k + ff.body.filter((b) => b.type === "code").length,
            0,
          ),
        0,
      ),
    0,
  );
  console.log(
    `wrote ${sections.length} files to content/  (${q} questions, ${f} follow-ups, ${c} code blocks)`,
  );
}

if (require.main === module) main();
module.exports = { parse, toMarkdown, slugify };
