---
slug: find-missing-letter
title: Find missing letter
completed: 2026-08-31
---

## Problem

Write a function called `findMissingLetter` that takes in an array of consecutive (increasing) letters as input and returns the missing letter in the array.

```js
function findMissingLetter(arr) {
  if (arr.length === 0) return "";
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const startIndex = alphabet.indexOf(arr[0]);

  for (let i = 0; i < alphabet.length; i++) {
    if (arr[i] !== alphabet[startIndex + i]) {
      return alphabet[startIndex + i];
    }
  }
}
```
