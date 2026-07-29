import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    sections: defineCollection({
      type: "page",
      source: "**/*.md",
      schema: z.object({
        slug: z.string(),
        order: z.number(),
        number: z.string(),
        group: z.string(),
        title: z.string(),
        status: z.enum(["answered", "questions-only"]),
      }),
    }),
  },
});
