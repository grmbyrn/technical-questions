---
title: System Design
order: 8
tags: [system-design]
---

## What is the primary purpose of a database index?

1. To reduce how much disk space a table uses
2. To compress rows for faster network transfer
3. To enforce foreign key constraints between tables
4. To let the database find matching rows without scanning the whole table

---

**4.** Without an index, finding a user by email means scanning every row in the table -- 10 million users means 10 million rows to check. An index lets the database jump straight to the matching rows in milliseconds. Indexes actually cost extra storage, they don't save it.

## Normalization means duplicating data across records so reads can avoid joins.

1. True
2. False

---

**False.** That's denormalization. Normalization splits data across tables to avoid duplication -- each order references a user ID instead of copying the user's data -- keeping data consistent at the cost of needing joins. Denormalization goes the other way, trading update complexity for faster reads
