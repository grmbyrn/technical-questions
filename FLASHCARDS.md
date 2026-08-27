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
## How many times does this loop run?

```js
for (let i = 0; i < 5; i++) {
  console.log(i);
}
```

---

**5 times** — `i` takes the values 0, 1, 2, 3, 4.
````

## Keep code in backticks

Not a style rule — Markdown will otherwise eat it, and mostly without saying so:

- `<a>`, `<Welcome />`, `<li>…</li>` are parsed as **HTML**, not text. An
  unclosed one swallows every card below it in the file; a closed or
  self-closing one is quietly turned into an element and its text vanishes.
- `/* a block comment */` reads as emphasis and comes back as
  `/_ a block comment _/`.

Both are silent, so there is a linter for it:

```
npm run check-decks    # what is wrong, with file:line
npm run fix-decks      # wraps the tags in backticks for you
```

It needs no server and takes no time. It also flags duplicate `order:` values,
two cards asking the same question (they would share one score), unclosed code
fences and empty decks — those it reports rather than fixes, since the right
answer is a judgement call.

`npm run check-render` covers the other half, against a running server: it
cross-checks the number of cards the page actually shows against the `##`
headings in the Markdown.

**If a card looks wrong in the browser but `check-decks` says the deck is
clean, the dev server is serving a stale cache.** Stop it, `rm -rf .data`, and
start it again.

One more heading rule: put the `[tags]` last, since the tag syntax reads the
end of the line.

The `/flashcards` page collects every card from every deck, offers the tags as
filters, and reveals the answer on click. A card with no body renders as "no
answer written yet", so you can drop in a stack of questions first and fill
them in later.

## The two modes

**Browse** walks the whole filtered deck a card at a time, in file order or
shuffled.

**Test yourself** deals a round of ten drawn at random and asks you to mark each
one _knew it_ or _didn't know it_. Those marks are scored per card and kept in
`localStorage`, and the score biases the next draw: a card you missed is about
four times as likely to come up as one you have never seen, and a card you have
known three times running is about a quarter as likely. Missing it again pushes
it up further; knowing it a few times lets it fade back. The weighting is in
[`useCardStats.ts`](app/composables/useCardStats.ts), and "Reset progress" on
the start screen clears it.

Cards are identified by their heading's anchor slug, so scores survive adding
and reordering cards — but rewording a question starts it fresh.
