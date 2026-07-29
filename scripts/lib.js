/**
 * Reading content/*.md — the single source of truth for the site.
 *
 * Markdown conventions:
 *   ##  question       trailing (E|M|H) is the difficulty tag
 *   ### follow-up
 *   fenced block       code sample, kept verbatim
 *   anything else      a prose paragraph
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const CONTENT = path.join(__dirname, "..", "content");

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
    if (!q) throw new Error("prose before the first question");
    (f ? f.body : q.body).push({ type: "p", text });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^(`{3,})\s*(\w*)$/);

    if (fence) {
      flushPara();
      const [, close, lang] = fence;
      const code = [];
      i++;
      while (i < lines.length && lines[i].trimEnd() !== close) {
        code.push(lines[i++]);
      }
      const block = { type: "code", text: code.join("\n").replace(/\s+$/, "") };
      if (lang) block.lang = lang;
      (f ? f.body : q.body).push(block);
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
      if (!q) throw new Error("follow-up before the first question");
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

/** Every section, ordered by the `order` in its frontmatter. */
function loadSections(dir = CONTENT) {
  const sections = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      try {
        return parseMarkdown(fs.readFileSync(path.join(dir, f), "utf8"));
      } catch (e) {
        throw new Error(`${f}: ${e.message}`);
      }
    })
    .sort((a, b) => a.order - b.order);

  const seen = new Set();
  for (const s of sections) {
    if (seen.has(s.slug)) throw new Error(`duplicate slug: ${s.slug}`);
    seen.add(s.slug);
  }
  return sections;
}

module.exports = { parseMarkdown, loadSections, CONTENT };
