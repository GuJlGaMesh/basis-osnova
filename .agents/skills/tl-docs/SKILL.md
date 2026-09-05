---
name: tl-docs
description: >-
  Creates and updates the project's own docs — README, AGENTS.md, architecture, ADRs — modes init, update, audit, add. Not for: external/library docs → tl-reference; implementation plans → tl-plan. Use when: создай документацию, задокументируй проект, актуализируй docs.
allowed-tools: Read Write Edit Glob Grep Bash(git *) Bash(node *) Bash(mkdir *) AskUserQuestion
disable-model-invocation: false
---

# tl-docs — AI-native documentation

Project documentation following the TL **AI-native repo** standard, in four modes: **init** (from scratch), **update** (incremental from the last recorded commit), **audit** (read-only report), **add** (surgical capture of one piece of knowledge).

References, each loaded by the step that needs it:

- `references/TEMPLATES.md` — templates for every generated file (Steps 3, 4).
- `references/WORKFLOW.md` — init / update / add flows, smart merge, hash recipe (Steps 3, 7).
- `references/DOC-PRINCIPLES.md` — authoring principles + the doc-worthiness filter (every write).
- `references/REVIEW-CHECKLISTS.md` — final review (Step 7).
- `references/report-format.md` — kit-wide status marks (`✅ / ⚠️ / ❌`) and what a report may claim; read before printing any report to the user (`audit`, Step 7).

## Artifacts

Owns (reads + writes):

- `README.md` — landing page + Tech Stack section
- root `AGENTS.md` — **only the text outside `<!-- tl-ai-kit:* -->` markers**, and outside the allowlisted external managed blocks (`gear:agent-docs`, `gear:user-notes`):
  - Both kinds of block are read-only islands: excluded from the content hash (an edit inside them is never a human edit) and re-inserted verbatim on every write — never edited, reordered, or rewritten. `gear:user-notes` is gear-owned even though a human writes its body.
  - The file must carry the «Перед любой задачей: контекст из docs/» section (`references/TEMPLATES.md` §2) — the agent's entry point into project context; without it the skill has not done its job. Verify it in init and in update: if it is missing (no file / file without the section / only the legacy 2-line «Что читать первым» variant), add it outside the markers.
- `docs/README.md` (human route map), `docs/AGENTS.md` (agent navigation index, plus optional `docs/<subdir>/AGENTS.md`), `docs/glossary.md`
- **module-level `AGENTS.md`** — one at the top of each major module the structure survey (Step 4) finds: a terse pointer into `docs/**` plus agent-only traps, ≤30 lines. Placement, the docs-vs-pointer split and the boundaries are DOC-PRINCIPLES §9; the set of modules is discovered by heuristic every run, never a hard-coded path list
- `docs/architecture/` — `overview.md`, `layers.md`, `dependencies.md`, `constraints.md`, `c4-*.md`
- `docs/development/` — `rules.md`, `testing.md`, `review.md`, `migrations.md`, `releases.md`
- `docs/change-scenarios/` — the 10 playbooks listed in `references/TEMPLATES.md` §6
- `docs/adr/` — `README.md` with the ADR template; ADR-0001 optional

**Ownership boundary.** Never write outside that list, even when a file looks related: `docs/plans/` belongs to `tl-plan`, `docs/references/` to `tl-reference`, `docs/skill-context/` to the user, and the marker blocks above to their owners. The single exception is migrating legacy doc files into the new structure, with the user's confirmation — and legacy content is never deleted before the merge has succeeded.

## Modes

| Mode | When | What it does |
|---|---|---|
| `init` | `lastUpdateCommit` missing in `.tl-ai-kit/config.json` | Creates the full AI-native layout from scratch |
| `update` | `lastUpdateCommit` present | Reads `git diff <commit>..HEAD`, updates only what the change touched, preserves human edits |
| `audit` | explicit `audit` flag | Read-only report: what is stale, which links are broken, where AI↔human diverge. Writes nothing |
| `add` | explicit `add` flag/keyword **only** | Captures one fact: routes it to the right file at the right altitude, or pushes back if it does not belong in docs. Works on a dirty tree; does **not** move `lastUpdateCommit` |
| `--dry-run` | modifier for any mode | Shows the change plan, writes nothing |
| `--headless` | non-interactive use | No AskUserQuestion, auto-apply non-conflicting changes, collisions to stderr, exit codes below |

**Mode detection.** Read `.tl-ai-kit/config.json` → `skillState['tl-docs'].lastUpdateCommit`: missing → **init**, present → **update**. If `git cat-file -e <sha>` fails on that commit (rebase / force-push dropped it), do not diff against it silently — ask the user: `полный audit / init с нуля / ввести новый base commit вручную` (in `--headless`: exit 1).

`add` is **never auto-detected** — it runs only on an explicit `add` flag or keyword, and only in an already-initialized project (`lastUpdateCommit` present); otherwise tell the user to run `init` first.

Explicit flags `init | update | audit | add | --dry-run | --headless` override detection.

## Exit codes (`--headless` only; interactively everything goes through AskUserQuestion)

- `0` — applied, or nothing to do (including an `add` that wrote its content)
- `2` — collisions in init / update: non-conflicting changes applied, each collision to stderr as `<path>: conflict: <reason>`
- `3` — (`add` only) input is not doc-worthy: nothing written, reason to stderr as `add: not doc-worthy: <reason>`. Deliberately distinct from `2` — a push-back is a refusal to write, not an edit collision, so never report it in the `conflict:` format
- `1` — fatal: not a git repo, read-only FS, unusable git state, broken templates

## State

All state lives in `.tl-ai-kit/config.json` under `skillState['tl-docs']`:

```jsonc
{
  "skillState": {
    "tl-docs": {
      "lastUpdateCommit": "e0cd6e4...",
      "lastUpdateAt": "2026-04-22T10:15:00+03:00",
      "managedFiles": {
        "README.md": { "hash": "sha256-..." },
        "AGENTS.md": { "hash": "sha256-...", "outsideMarkersOnly": true }
      }
    }
  }
}
```

`hash` — SHA-256 of the contents **after EOL is normalized to LF**; without that normalization Windows CRLF fakes a human edit on every file. Use the recipe in `references/WORKFLOW.md` → «Как считать hash».

## Workflow

### Step 0: Skill-context overrides

Read `docs/skill-context/tl-docs/SKILL.md` if it exists. Those are project-level overrides: on conflict with anything here, the skill-context rule wins. Validate every generated artifact against them — a violation is a bug, fix it before showing the result.

Also read `references/project-context.md` before generating or updating `docs/AGENTS.md`, the root `AGENTS.md` entry-point section or `docs/change-scenarios/`: it is the reading order every other skill resolves against, so a layout invented outside it leaves them looking for files that do not exist.

### Step 1: Detect mode

Per the algorithm above → `mode ∈ {init, update, audit, add}` + `dryRun`, `headless`.

### Step 2: Git safety (first, in every mode)

1. `git rev-parse --is-inside-work-tree` — if this is not a repo, stop with «tl-docs работает только внутри git-репозитория».
2. `git status --porcelain` — in `update` on a dirty tree ask «закоммитить автоматически / stash / отменить» (`--headless`: exit 1). `init` and `add` run fine on a dirty tree — `add` is a manual point edit, not a consumption of `git diff`. An uncommitted current `docs/plans/*` file is ignored (same exception as `/tl-implement`).

### Step 3: Execute the mode

Flows in `references/WORKFLOW.md`. In short:

- **init** — one `AskUserQuestion` over the proposed layout → create the missing files from `TEMPLATES.md` → module survey (Step 4) → link check (Step 5).
- **update** — `git diff --name-only <lastUpdateCommit>..HEAD` → decide which managed files the change affects → for each, compare the current hash with the stored one (equal: apply the proposal; different: the file was edited by hand → smart merge) → show the diff → apply.
- **audit** — walk `managedFiles`, recompute hashes, report stale content, divergences and broken links. Writes nothing, and skips Step 8.
- **add** — run the input through the doc-worthiness filter (`references/DOC-PRINCIPLES.md`); not doc-worthy → push back and redirect, write nothing; doc-worthy → route it to the right file at the right altitude, rewrite the existing section instead of appending, show the diff, confirm, `Write`. With `--dry-run` stop after the diff.

### Step 4: Module survey → local AGENTS.md

Producing module-level `AGENTS.md` is default behaviour — but never blind generation. First survey the tree, then create only on real module boundaries (the «walk the tree first» rule of DOC-PRINCIPLES §9).

1. **Survey.** Walk the repo and list candidate module roots by heuristic, not by a fixed layout: the top-level source directories (skip service / vendored / generated ones — `node_modules`, `bin`, `obj`, `dist`, `target`, `build`, `vendor`, … — and honour `.gitignore`), then, inside them, the units that read as a *module* — an application layer, an API or other entry point, a frontend app, a sizeable package, a cluster of external integrations, or a tricky / legacy zone. Signals and the full walk are in `references/WORKFLOW.md` → «Module survey». Stay stack-agnostic: discover these as categories, never assume a particular framework's paths.
2. **Bound.** Keep only boundaries that pass §9 — a module's top level only (never a subfolder of it), nothing that has dozens of siblings, nothing under vendored or generated code.
3. **Create / maintain.** For a kept boundary with no local `AGENTS.md`, create one from `TEMPLATES.md` §2a — a pointer into `docs/**` plus agent-only traps, ≤30 lines. For existing ones, maintain per §9 and the smart-merge rules (a rename or a new `docs/` section changes the pointer; ordinary code changes touch only the paired `docs/**`). In `audit`, only report the gaps and the stale files — write nothing.

A deeper, interactive candidate / validation pass ships separately as `tl-local-agents-md`; this step is the automatic default baked into the docs pipeline.

### Step 5: Link check

After any Write: for every `[text](path)` link in `README.md`, `docs/**` and the module-level `AGENTS.md` files, verify the target file exists. Skip external URLs and bare `#anchor` links; skip `docs/plans/`, `docs/references/` and `docs/skill-context/` entirely — they are not ours and change on their own schedule. Broken links go into the report with a proposed `Edit` (in `--headless`: stderr, no fix attempts).

### Step 6: Glossary auto-detection (optional)

Glob `src/**/*.{ts,js,py,cs,go}`, count unique CamelCase entities and UPPERCASE abbreviations of length ≥3. ≥20 unique → create `docs/glossary.md` seeded with the 10 most frequent. Otherwise skip.

### Step 7: Documentation review

After any Write, run all four checklists from `references/REVIEW-CHECKLISTS.md` — Technical Accuracy, Readability & Completeness, Standards Compliance, Altitude & Maintainability. Fix every failure before showing the result; report as a compact `✅ / ⚠️ / ❌` list per checklist, per `references/report-format.md`.

### Step 8: Finalize state

The last step of any successful init / update / add run. Without it the next run cannot work as `update`.

1. Recompute the hash of every file created or touched (`references/WORKFLOW.md` → «Как считать hash»; root `AGENTS.md` gets the `outside-markers` argument and the `outsideMarkersOnly: true` flag) and write it into `managedFiles[path]` — a brand-new file is added to the map.
2. In init / update only: set `lastUpdateCommit = git rev-parse HEAD` and `lastUpdateAt` = current ISO-8601 timestamp.
3. Write `.tl-ai-kit/config.json` back (via the CLI's `readSkillState` / `writeSkillState` helpers if reachable, otherwise `node -e` / `jq`).

Skipped entirely in `audit` and under `--dry-run` (exit 0 with «ничего не применено»).

### Step 9: Context cleanup

After heavy generation, offer to release the agent's context before continuing (`AskUserQuestion`: «Освободить контекст агента / Продолжить как есть»). The skill never releases context itself — the mechanism depends on the harness. Not in headless.

## Rules

1. **Show the plan before writing** — multi-select `AskUserQuestion` on init, and on update whenever more than 3 files are affected.
2. **Human edits > AI proposals.** A hash mismatch means a human touched the file: smart-merge instead of overwriting, and on a real collision ask the user (headless: leave the file alone, exit 2).
3. **All writes go through DOC-PRINCIPLES.** Every write mode — init, update, add — runs the proposed content through `references/DOC-PRINCIPLES.md` before writing: right altitude, no code mirroring, no transient content, replace over append, single source of truth, pruning. This is what keeps docs from bloating and rotting over hundreds of edits; it is not optional.
4. **`add` does not move `lastUpdateCommit`.** It is orthogonal to the diff window: advancing the base commit would make the next `update` skip every code change between the old base and HEAD.
5. **Project language follows the README.** Russian README → Russian docs. No README and no code to judge by → ask once during init (headless: EN + a warning to stderr).
6. **Module `AGENTS.md`: survey before you generate, and stay stack-agnostic.** Local `AGENTS.md` are produced by default (Step 4), but only after the structure survey marks real module boundaries — never blanket-generated, never one per folder. Discover boundaries by heuristic (layers, entry points, frontend, packages, integration and legacy zones); do not hard-code any framework’s paths. The root `AGENTS.md` never indexes them — it carries no links to other, specific `AGENTS.md` files. Bounds, the docs-vs-pointer split and the no-index rule live in DOC-PRINCIPLES §9.

## Non-goals

- Does not edit `.editorconfig`, `scripts/verify.*`, `.gitignore`.
- Does not run linters or formatters over generated files.
- Does not commit — the user decides (or uses `/tl-commit`).
