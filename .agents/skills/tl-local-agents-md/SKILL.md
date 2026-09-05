---
name: tl-local-agents-md
description: >-
  Works with nested local AGENTS.md files: `candidates` proposes directories that need one, `validate` checks an existing one. Use when: где нужен локальный AGENTS.md, проверь локальный AGENTS.md, валидируй AGENTS.md.
argument-hint: "[candidates | validate <path>]"
allowed-tools: Read Glob Grep Bash AskUserQuestion
---

# Local AGENTS.md Helper

Helps with **local `AGENTS.md`** files — agent-navigation files placed not at
the repository root, but in complex directories (modules, services, apps).

Full methodology: references/methodology.md. This skill automates only the steps that
can be done without the module owner. Stages that require dialogue
(terminology review, code-side verification with the owner) stay with the
human.

## Modes

The skill has two modes:

- `candidates` — propose directories that need a local `AGENTS.md`.
- `validate` — review an existing local `AGENTS.md` against a checklist.

If the user did not specify the mode and there is no clear hint in the
prompt, ask explicitly:

> «Что нужно — найти кандидатов на локальный AGENTS.md (`candidates`) или
> проверить готовый локальный AGENTS.md (`validate`)?»

## Mode `candidates`

Goal: propose directories where a local `AGENTS.md` would help.

Make no assumptions about repo structure. Open it yourself.

### Steps

1. Read the root `AGENTS.md` if it exists. The point — do not propose
   directories that the root file already covers exhaustively.
2. Identify top-level source directories. Heuristic: first-level folders
   that are not typical service ones (`.git`, `.github`, `.vscode`,
   `node_modules`, `bin`, `obj`, `dist`, `target`, `build`, `vendor`,
   `.idea`, `.vs`). Respect `.gitignore`.
3. For each top-level folder, walk 1–2 levels deep and look for candidate
   directories. Candidate signals:
   - **size**: number of files and total LOC above the project average;
   - **multiple responsibility zones**: ≥ 4 first-level subfolders under
     a single roof;
   - **multiple external integrations or providers next to each other**:
     folder names look like vendor names; nearby `*Client`, `*Provider`,
     `*Integration`-style entities;
   - **legacy / deprecating markers**: words like «legacy», «obsolete»,
     «deprecated», «устаревш», «не развивается» in README, comments,
     folder names;
   - **change frequency** via `git log --since=1.year` — hot zones are
     more valuable than cold ones;
   - an `AGENTS.md` already exists nearby, but is short or clearly out
     of date.
4. Drop candidates fully covered by the root `AGENTS.md` (no extra
   responsibility zones, no ambiguous terms left).
5. Output a table: `path | priority (high/med/low) | signals | has
   AGENTS.md (yes/no) | short reason`. Sort by priority.
6. Do **not** create files yet. Finish by suggesting that the user pick
   one project/directory from the table and create a local `AGENTS.md`
   for it:

   > «Выбери один проект из списка — дальше подготовим для него локальный AGENTS.md по методологии: references/methodology.md».

## Mode `validate`

Goal: review a ready local `AGENTS.md` against the checklist below.

Input: path to the file. If not provided — search all `AGENTS.md` below the
repository root and offer a choice via AskUserQuestion.

### Steps

1. Read the target file and the root `AGENTS.md` (for comparison).
2. Run the checklist:
   - **No duplication of the root.** Stack description, generic search
     rules, generic build/test commands belong to the root `AGENTS.md`,
     not to a local one. Detected duplicates — violation.
   - **Size.** 30–120 lines. Less — too little value. More — part of the
     content should move into detailed documentation next to the module
     and stay in `AGENTS.md` as a link only.
   - **Links.** For every relative link — verify the file exists. Do not
     fetch external URLs.
   - **Deprecating zones marked explicitly.** If legacy / phasing-out
     code is mentioned — there must be an explicit marker next to the
     folder description: «устаревающая зона», «не развивается», «не
     используй как пример для нового кода» — or an English equivalent.
   - **No mixed synonyms.** One entity = one term throughout the file.
     Common smell: `provider` / «внешняя система» / «интеграция» used
     interchangeably for the same thing.
   - **Has navigation sections.** At least one of: «Что где лежит»,
     «Границы», «Частые сценарии», «Правило уточнения» (or English
     equivalents).
   - **Narrow business cases not in the centre.** Long scenarios and
     detailed business rules — flag them and suggest moving to the
     module's detailed docs, leaving a link in `AGENTS.md`.
3. (Optional) If the project uses host-specific aliases for `AGENTS.md`
   (a small file in the same folder that just re-references the
   `AGENTS.md` sitting next to it via `@AGENTS.md`), check that such an
   alias exists next to the local `AGENTS.md` being validated and that
   it re-references the local file — not the root one. Only report —
   do not edit. If the project does not use such aliases, skip this
   check entirely.
4. Output a report:
   - severity: `must` (checklist violation), `should` (smell),
     `nit` (style);
   - exact line numbers in the file;
   - a suggested fix as plain text.
5. Do **not** edit the file yourself — only produce the report.

### Report format

Output to the user in Russian, structured:

```
## Отчёт по {{relative path to file}}

### must
- [строки X–Y] {{что нарушено}}
  Предложение: {{короткий текст исправления}}

### should
- [строка Z] {{запах}}
  Предложение: {{что переписать}}

### nit
- [строка W] {{стилистика}}
  Предложение: {{как лучше}}
```

If a section is empty, omit it. Finish with one short summary line: how
many `must`, `should`, `nit` items were found, and whether the file is
ready to merge as-is or needs a pass.

## What this skill does NOT do

- Does **not** generate the body of a local `AGENTS.md` autonomously.
- Does **not** guess the purpose of folders from their names alone.
- Does **not** edit the root `AGENTS.md` or any host-specific aliases.
- Does **not** trigger AGENTS.md / host-alias synchronization (use
  `tl-sync-agents` for that).
- Does **not** assume any specific docs layout (`Docs/`, `MemoryBank/`,
  etc.) is present.

## Communication with the user

- Confirm the mode at the start (`candidates` or `validate`) — one line
  in Russian.
- Address the user with «ты». Tone — short, businesslike, no fluff.
- After the table / report — explicitly say what comes next: dialogue
  with the module owner via the methodology, or fixes by the file owner.
