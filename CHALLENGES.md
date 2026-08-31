# Adding a solved code challenge

One Markdown file per challenge in `content/challenges/`. The filename does not
matter; the `slug` is the URL.

```markdown
---
slug: two-sum
title: Two Sum
source: LeetCode 1
url: https://leetcode.com/problems/two-sum/
difficulty: easy # easy | medium | hard
tags: [arrays, hash-map]
completed: 2026-08-31
---

## Problem

Given an array of integers `nums` and an integer `target`, return the indices
of the two numbers that add up to `target`.

## Solution

```js
function twoSum(nums, target) { … }
```

## Notes

The brute force is two nested loops, O(n²). The trick is that for each element
there is exactly one number that would complete the pair…
```

Only `slug` and `title` are required. `difficulty` defaults to `medium`, and a
challenge with no `completed` date sorts to the bottom of the list.

## The point of the `## Solution` heading

**Everything from the first `## Solution` heading onwards is hidden behind a
button.** Anything above it — the problem, examples, constraints — shows
straight away.

That is what makes the section a revision tool rather than an archive: open an
old challenge, read the problem, have another go, and only then check what you
did last time. `## Answer`, `## Approach` and `## My solution` work as the
trigger too. A file with no such heading just renders in full.

Put anything spoiler-ish (the complexity analysis, the trick, the gotcha) in
`## Notes` **after** `## Solution`, so it is hidden along with the code.

## Where it shows up

`/challenges` lists everything newest first, filterable by difficulty and tag.
`/challenges/<slug>` is the write-up, with prev/next links through the list.

## Checking your Markdown

`npm run check-decks` lints these files along with the flashcard decks, and
`npm run fix-decks` repairs what it can. It catches the two silent killers:

- **Raw HTML outside backticks.** `<div>` written as prose is parsed as HTML,
  not text. Code inside ``` fences is safe; prose is not.
- **Invisible characters.** A `##` followed by a non-breaking space instead of
  a real space is not a heading, so the section is silently swallowed by the
  one above it. Pasting from a browser is how they get in.
