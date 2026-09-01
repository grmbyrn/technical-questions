---
slug: first-non-repeating
title: findFirstNonRepeatingCharacter
completed: 2026-08-31
---

```js
function findFirstNonRepeatingCharacter(str) {
  // Create a hashmap to store character -> frequency count.
  // Using Map here (rather than a plain object) because it
  // preserves insertion order and has cleaner get/set/has methods.
  const charCount = new Map();

  // --- Pass 1: build the frequency map ---
  for (const char of str) {
    // `for...of` on a string iterates character by character.

    // charCount.get(char) looks up the current count for this char.
    // If it's never been seen, get() returns undefined,
    // and `undefined || 0` falls back to 0.
    // Either way, we add 1 and store the new count back in the map.
    charCount.set(char, charCount.get(char || 0) + 1);
  }

  // After this loop, charCount maps every character in str
  // to how many times it appears, e.g. for "leetcode":
  // { l:1, e:3, t:1, c:1, o:1, d:1 }

  for (const char of str) {
    // We loop over the ORIGINAL string again (not the map's keys)
    // because we need the first char in string order, and the map
    // doesn't guarantee that matches what we want to check first
    // (it's insertion order, which happens to work here, but
    // looping the string directly is more explicit/robust).

    if (charCount.get(char) === 1) {
      // O(1) lookup into the hashmap built in pass 1 —
      // this is the payoff of using a hashmap: no need to
      // rescan the string to count occurrences of `char`
      return char; // first non-repeating character found
    }
  }
  // If we get through the whole string without finding
  // a count-1 character, there isn't one.
  return null;
}
```
