import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    // Sections are the flat files at the top of content/ — the glob is
    // deliberately non-recursive so content/flashcards/ is not swept in and
    // rejected by this schema.
    sections: defineCollection({
      type: "page",
      source: "*.md",
      schema: z.object({
        slug: z.string(),
        order: z.number(),
        number: z.string(),
        group: z.string(),
        title: z.string(),
        status: z.enum(["answered", "questions-only"]),
      }),
    }),
    // One file per solved challenge — see CHALLENGES.md.
    challenges: defineCollection({
      type: "page",
      source: "challenges/**/*.md",
      schema: z.object({
        slug: z.string(),
        title: z.string(),
        /** Where it came from, e.g. "LeetCode 1" or "Advent of Code 2024 d3". */
        source: z.string().optional(),
        url: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        tags: z.array(z.string()).default([]),
        /** ISO date, used to sort newest first. */
        completed: z.string().optional(),
      }),
    }),
    // One file per deck. Everything a card needs lives in the Markdown, so
    // adding a card is adding an `##` heading — see FLASHCARDS.md.
    flashcards: defineCollection({
      type: "page",
      source: "flashcards/**/*.md",
      schema: z.object({
        title: z.string(),
        order: z.number().default(0),
        tags: z.array(z.string()).default([]),
      }),
    }),
  },
});
