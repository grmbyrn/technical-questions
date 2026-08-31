---
slug: find-missing-number
title: Find missing number
completed: 2026-08-31
---

## Problem

Write a function called `findMissingNumber` that takes in an array of unique numbers from 1 to n (inclusive), where one number is missing. It should return the missing number.

## Solution

```js
function findMissingNumber(arr) {
  const sortedArr = arr.sort((a, b) => a - b);

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] + 1 !== arr[i + 1]) {
      return arr[i] + 1;
    }
  }
}
```
