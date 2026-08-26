# Adding flashcards

Cards live in `content/flashcards/`. One Markdown file is one deck — usually
one per topic. Adding a card is adding an `##` heading; nothing else needs
touching.

```markdown
---
title: React
order: 2
tags: [react]
---

## What is reconciliation?

The diff React runs between the previous element tree and the one your render
returned, to decide the smallest set of DOM operations.

## Why can't hooks be called conditionally? [hooks]

React associates a hook call with its stored state by call order, not by name…
```

- **The `##` heading is the front of the card.** Everything under it, up to the
  next `##`, is the back: paragraphs, lists, code fences — anything Markdown
  does.
- **A `---` rule puts content on the front too.** A heading is one line of
  inline Markdown, so it can't hold a list or a code block. When the question
  needs one, put it under the heading and follow it with `---`: everything
  above the rule is the question, everything below is the answer.
- **Frontmatter `tags` apply to every card in the file.** `order` decides where
  the deck falls in the unshuffled sequence.
- **A card adds its own tags in square brackets at the end of the heading:**
  `## Question here [hooks, performance]`. Those are added to the file's tags,
  not a replacement for them.
- Tags are lowercased, so `React` and `react` are the same tag.

A card whose question needs a code block or a list looks like this:

````markdown
## How many times does this loop run? [loops]

```js
for (let i = 0; i < 5; i++) {
  console.log(i);
}
```

---

**5 times** — `i` takes the values 0, 1, 2, 3, 4.
````

Two things to watch in headings: keep code in backticks, or Markdown will read
`/* a block comment */` as emphasis and mangle it to `/_ a block comment _/`;
and put the `[tags]` last, since the tag syntax reads the end of the line.

The `/flashcards` page collects every card from every deck, offers the tags as
filters, and reveals the answer on click. A card with no body renders as "no
answer written yet", so you can drop in a stack of questions first and fill
them in later.
