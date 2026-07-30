import fs from "node:fs";
import path from "node:path";

/**
 * The crawler starts at "/", which redirects to the first section, so it never
 * discovers the rest. Enumerate the section routes from the Markdown instead —
 * adding a file to content/ is then all that is needed to get it prerendered.
 */
const contentDir = path.join(import.meta.dirname, "content");
const sectionRoutes = fs
  .readdirSync(contentDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const src = fs.readFileSync(path.join(contentDir, f), "utf8");
    const slug = src.match(/^slug: (.*)$/m)?.[1]?.trim();
    if (!slug) throw new Error(`content/${f} has no slug in its frontmatter`);
    return `/${slug}`;
  });

export default defineNuxtConfig({
  modules: ["@nuxt/content"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  compatibilityDate: "2025-07-01",
  nitro: {
    prerender: {
      routes: sectionRoutes,
      crawlLinks: true,
    },
  },
  app: {
    head: {
      // lang matters twice over: Reader detection, and which voice the
      // speech synthesiser picks when reading the page aloud
      htmlAttrs: { lang: "en" },
      title: "Interview Prep",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
