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

/** Same deal for the challenge write-ups, which live one directory down. */
const challengeDir = path.join(contentDir, "challenges");
const challengeRoutes = fs.existsSync(challengeDir)
  ? fs
      .readdirSync(challengeDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const src = fs.readFileSync(path.join(challengeDir, f), "utf8");
        const slug = src.match(/^slug: (.*)$/m)?.[1]?.trim();
        if (!slug) throw new Error(`challenges/${f} has no slug`);
        return `/challenges/${slug}`;
      })
  : [];

/* Project Pages serve from /<repo>/, so a built site has to carry that prefix
   on every asset and route URL. `nuxt dev` stays at "/" so local work is
   unaffected; NUXT_APP_BASE_URL overrides either way, which is what you want
   when previewing the generated output or hosting it somewhere else. */
const base =
  process.env.NUXT_APP_BASE_URL ??
  (process.env.NODE_ENV === "production" ? "/technical-questions/" : "/");

export default defineNuxtConfig({
  modules: ["@nuxt/content", "@vite-pwa/nuxt"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  compatibilityDate: "2025-07-01",
  nitro: {
    prerender: {
      routes: [
        ...sectionRoutes,
        ...challengeRoutes,
        "/flashcards",
        "/challenges",
      ],
      crawlLinks: true,
    },
  },
  app: {
    baseURL: base,
    head: {
      // lang matters twice over: Reader detection, and which voice the
      // speech synthesiser picks when reading the page aloud
      htmlAttrs: { lang: "en" },
      title: "Interview Prep",
      meta: [
        { charset: "utf-8" },
        // viewport-fit=cover lets the installed app paint into the safe areas
        // rather than letterboxing itself on a notched screen
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#1f3fa8" },
        // iOS reads these instead of the manifest when deciding how an
        // added-to-home-screen page launches
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "Interview Prep" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "default",
        },
      ],
      link: [
        { rel: "icon", type: "image/png", href: `${base}favicon.png` },
        { rel: "apple-touch-icon", href: `${base}apple-touch-icon.png` },
      ],
    },
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Interview Prep",
      short_name: "Interview",
      description:
        "Frontend/backend interview prep - 532 questions across 44 sections",
      lang: "en",
      start_url: ".",
      scope: ".",
      display: "standalone",
      orientation: "portrait",
      background_color: "#f4f6f8",
      theme_color: "#1f3fa8",
      icons: [
        { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
        { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "pwa-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      /* The defaults miss the two things this site cannot read offline
         without: the sqlite WASM binary that @nuxt/content queries through,
         and the .txt SQL dumps it seeds that database from. */
      globPatterns: ["**/*.{js,css,html,json,txt,wasm,png,svg,ico,woff2}"],
      // the WASM binary is ~850KB, over Workbox's 2MiB-per-file default only
      // if it grows, but the headroom costs nothing
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      navigateFallback: "index.html",
      cleanupOutdatedCaches: true,
    },
    client: {
      // no update prompt UI in the app, so let a new build take over silently
      // on the next launch
      installPrompt: false,
      periodicSyncForUpdates: 3600,
    },
    devOptions: { enabled: false },
  },
});
