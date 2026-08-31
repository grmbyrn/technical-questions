---
slug: two-sum
title: Two Sum
source: LeetCode 1
url: https://leetcode.com/problems/two-sum/
difficulty: easy
tags: [arrays, hash-map]
completed: 2026-08-31
---

## Problem

Given an array of integers `nums` and an integer `target`, return the indices
of the two numbers that add up to `target`. Each input has exactly one
solution, and the same element may not be used twice.

```
nums = [2, 7, 11, 15], target = 9   ->  [0, 1]
nums = [3, 2, 4],      target = 6   ->  [1, 2]
```

## Solution

```js
function twoSum(nums, target) {
  const seen = new Map(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }

  return [];
}
```

## Notes

The brute force is two nested loops, O(n²). The trick is that for each element
there is exactly one number that would complete the pair, so instead of
searching for it you can ask whether you have already walked past it.

One pass, O(n) time and O(n) space. The order matters: check the map *before*
inserting the current value, or `nums = [3, 3]` with `target = 6` would match
the element against itself.
