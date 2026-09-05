---
name: tl-sync-agents
description: >-
  Keeps AGENTS.md and CLAUDE.md in sync — AGENTS.md is the source of truth, CLAUDE.md holds only an @AGENTS.md reference. Use when: синхронизируй агентов, обнови CLAUDE.md, настрой AGENTS.md.
---

# Sync AGENTS.md and CLAUDE.md

## Rule

When creating or modifying `AGENTS.md` or `CLAUDE.md` files in any directory of the project, follow these rules:

### AGENTS.md is the source of truth

- `AGENTS.md` is the **single source of truth** for agent instructions.
- All instructional content, rules, and descriptions go **only into AGENTS.md**.

### CLAUDE.md is a reference to AGENTS.md

- `CLAUDE.md` must contain **exactly one line**:

```
@AGENTS.md
```

- No other content is allowed in `CLAUDE.md`.

### When creating a new AGENTS.md

1. Create the `AGENTS.md` file with the required content.
2. Create a sibling `CLAUDE.md` file with the single line `@AGENTS.md`.

### When creating a new CLAUDE.md

1. If no sibling `AGENTS.md` exists — create an empty `AGENTS.md`.
2. Write the single line `@AGENTS.md` into `CLAUDE.md`.

### When modifying content

- Make all instruction changes **only in AGENTS.md**.
- **Never** write content directly into `CLAUDE.md` — it must always remain the `@AGENTS.md` reference.

### Sync (no parameters)

If the skill is invoked without a specific operation — perform a full sync:

1. Recursively find all `AGENTS.md` and `CLAUDE.md` files in the project.
2. Compare and present the action plan to the user:
   - Which `CLAUDE.md` files will be created (sibling `AGENTS.md` exists, no `CLAUDE.md`)
   - Which `CLAUDE.md` files will be fixed (contain anything other than `@AGENTS.md`)
   - Which `AGENTS.md` files will be created (sibling `CLAUDE.md` exists, no `AGENTS.md`)
3. Ask the user: «Готов к синхронизации?» — wait for confirmation.
4. After confirmation execute the planned operations.
5. Print the result: which files were created, which were fixed.

## Invariants

- Every `AGENTS.md` has a paired `CLAUDE.md` with content `@AGENTS.md`
- Every `CLAUDE.md` has a paired `AGENTS.md`
- `CLAUDE.md` never contains anything other than `@AGENTS.md`
- On detecting desync — bring `CLAUDE.md` into compliance

## Scope

This rule applies at all nesting levels: project root, subdirectories, `.claude/`, `.agents/`, etc.
