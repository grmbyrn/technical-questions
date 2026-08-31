---
slug: are-all-chars-unique
title: Are all chars unique
completed: 2026-08-31
---

```js
function areAllCharactersUnique(str) {
  const charSet = new Set();

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (charSet.has(char)) {
      return false;
    }
    charSet.add(char);
  }
  return true;
}
```
