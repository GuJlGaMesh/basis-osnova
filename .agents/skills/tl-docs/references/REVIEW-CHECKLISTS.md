# Documentation Review Checklists

Run in Step 7 of `SKILL.md`, after any Write in init / update / add, and as the basis of the read-only `audit` report. Fix every failure before showing the result to the user.

## 1. Technical Accuracy

Structure:

- [ ] `README.md` exists, has the Tech Stack section near the top and a «Документация» table linking to `docs/architecture/overview.md`, `docs/development/rules.md`, `docs/change-scenarios/`, `docs/adr/README.md`, `docs/AGENTS.md`.
- [ ] Root `AGENTS.md` exists; the `<!-- tl-ai-kit:X -->` blocks are intact with their contents **unchanged**; it contains the «Перед любой задачей: контекст из docs/» section with the explicit workflow (open `docs/AGENTS.md` → find the scenario → read «Читать сначала» → read `development/rules.md` whenever the task edits files → code).
- [ ] `docs/README.md` and `docs/AGENTS.md` are both present.
- [ ] `docs/architecture/` has at least `overview.md` and `layers.md`; `docs/development/rules.md` is present; `docs/change-scenarios/` has ≥5 of the 10 scenarios; `docs/adr/README.md` carries the ADR template.

Links:

- [ ] Every internal link in `README.md` and `docs/**` resolves to an existing file (excluding `docs/plans/`, `docs/references/`, `docs/skill-context/`), with correct relative paths.
- [ ] The «По типу задачи» table in `docs/AGENTS.md` points at real `docs/change-scenarios/<name>.md` files.

State:

- [ ] `.tl-ai-kit/config.json` has `skillState.tl-docs.lastUpdateCommit` (the HEAD just operated on — not touched by `add`) and `lastUpdateAt` in ISO-8601.
- [ ] `managedFiles` has an entry for **every** file created or touched — none forgotten — and `AGENTS.md` carries the `outsideMarkersOnly: true` flag.
- [ ] Every stored hash matches a fresh `node <skill-dir>/scripts/hash.mjs <path>` (with `outside-markers` where the flag is set).
- [ ] The allowlisted external managed blocks in root `AGENTS.md` (`gear:agent-docs`, `gear:user-notes`), if they were there before the run, are byte-for-byte unchanged after it.

Content:

- [ ] Install instructions use the project's real package manager; no `<your-api-key>`-style placeholders left behind (either a real value, or `TODO: fill` reported in Step 7).

## 2. Readability & Completeness

Read it as a developer who just cloned the repo:

- [ ] The README says concretely what the project does, offers a copy-pasteable install command, a usage example with real input/output, and a visible next step (the documentation table).
- [ ] `docs/AGENTS.md` covers at least feature, bugfix, refactor, api-change and code review, each row linking to a real file.
- [ ] Every `docs/change-scenarios/<name>.md` has «Когда применять», «Читать сначала», «Шаги», «Чеклист», «Типовые ошибки», with «Читать сначала» pointing at files that exist and «Типовые ошибки» coming from this project's experience rather than generic advice.
- [ ] Pages are scannable: tables instead of long bullet chains, no wall-of-text paragraphs, project abbreviations expanded on first use or linked to `docs/glossary.md`.

## 3. Standards Compliance (AI-native-repo layout)

- [ ] No flat `docs/architecture.md` where a `docs/architecture/` directory belongs — if found, create the folder, move the content into `overview.md`, add the rest from `TEMPLATES.md`.
- [ ] `docs/AGENTS.md` present (from `TEMPLATES.md` §4) and root `AGENTS.md` present with its markers (from `TEMPLATES.md` §2).
- [ ] Root `AGENTS.md` links to no other, specific `AGENTS.md` file — no index of local module files, no «Local AGENTS.md» list (DOC-PRINCIPLES §9). `docs/AGENTS.md` as the entry point is the one allowed reference.
- [ ] Nothing outside the «Owns» list was written: no changes under `docs/plans/`, `docs/references/`, `docs/skill-context/`, `src/**`, `tests/**`, and no rewritten `<!-- tl-ai-kit:X -->` contents.
- [ ] All generated files are in one language — the README's.
- [ ] Update mode: every file whose hash changed was either merged, or left untouched and reported. In headless with exit 2, collisions went to stderr while the non-conflicting files were still updated.

## 4. Altitude & Maintainability

Applies [`DOC-PRINCIPLES.md`](DOC-PRINCIPLES.md). This is the checklist that stops "update the docs" from bloating the docs. Run it on every write (init / update / add).

- [ ] **No code mirroring** — no exhaustive enumerations duplicating the source tree (tables of every entity / enum / repository / method, sentences "currently in the code: A, B, C"). Roles + patterns + a directory link instead (#2).
- [ ] **No transient content** — no current counts ("~5 handlers"), no status notes ("not written yet", "TODO migrate"), no specific current names used as content (#3).
- [ ] **Right altitude** — every fact is a durable rule / role / invariant / rationale / "how to change X", not a snapshot of one function's current state (#1, #4).
- [ ] **No duplication** — each fact appears once, and pointer files stay one-line pointers rather than second copies of what they point at (#6, #8).
- [ ] **Replace, not append** — a changed topic was rewritten in its existing section; the page describes the current state, not a changelog of states (#5).
- [ ] **Pruning happened** — stale or now-false claims in the touched sections were removed or rewritten in the same pass (#7).
- [ ] **Reusability test** — every added sentence is still true and useful after ~10 more changes here, and helps someone who never saw this change (#4).

## Report

A compact `✅ / ⚠️ / ❌` list per checklist, then two short sections: what was fixed automatically, and what needs the user's attention (non-blocking). Nothing with no content is printed. In `--headless` the report goes to stdout; collisions additionally go to stderr per the exit-code contract in `SKILL.md`.
