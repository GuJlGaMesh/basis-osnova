# WORKFLOW — tl-docs flows

Detail behind Steps 3, 4 and 8 of `SKILL.md`. Modes, exit codes and the headless contract live there and are not repeated here.

## Contents

- [Init flow](#init-flow) — first run, no `lastUpdateCommit` yet
- [Update flow](#update-flow) — consume the diff since the last commit
- [Audit flow](#audit-flow) — read-only staleness report, writes nothing
- [Add flow](#add-flow) — one piece of knowledge written by hand
- [Module survey](#module-survey) — where a local AGENTS.md belongs
- [Guarantees](#guarantees) — idempotency and the other invariants

---

## Init flow

Entered when `lastUpdateCommit` is missing from the config.

### 1. Detect the project

`README.md` (language + tagline), then the manifest that exists — `package.json` / `pyproject.toml` / `*.csproj` / `go.mod` / `Cargo.toml` — for `{{PROJECT_NAME}}`, `{{PRIMARY_LANG}}`, `{{FRAMEWORK}}`, `{{PKG_MANAGER}}`. Glob `src/**/*.{ts,js,py,cs,go}` to size the codebase and seed `architecture/layers.md`.

Generation language: from the README; if there is none, one `AskUserQuestion` RU / EN (in `--headless`: EN + warning to stderr).

### 2. Propose the layout

```
README.md                            <create>
AGENTS.md                            <create skeleton, tl-ai-kit markers preserved>
<module>/AGENTS.md                   <one per module the survey keeps — Step 4>
docs/README.md                       <create>
docs/AGENTS.md                       <create>
docs/architecture/{overview,layers,dependencies,constraints}.md   <create>
docs/development/{rules,testing,review,releases}.md               <create>
docs/development/migrations.md       <create if a db stack is detected>
docs/change-scenarios/<10 files>     <create>
docs/adr/README.md                   <create>
docs/glossary.md                     <create if ≥20 unique terms>
```

`AskUserQuestion` (single-select): «Применить всю раскладку (рекомендуется) / Выбрать вручную / Отменить»; «Выбрать вручную» opens a multi-select over the same list. In `--headless`, log «headless init применит default layout» and continue.

### 3. Generate

For each file in the layout:

1. Exists and is non-empty → **skip**, never overwrite.
2. Missing → `Write` from the `TEMPLATES.md` template with the placeholders substituted.
3. Root `AGENTS.md` is special: if missing, write the skeleton with markers. If present, read it, locate the `<!-- tl-ai-kit:* -->` blocks **and the allowlisted external managed blocks** (`gear:agent-docs`, `gear:user-notes`) and preserve every one of them verbatim; if the «Перед любой задачей: контекст из docs/» section is missing (or only the legacy 2-line «Что читать первым» variant is there), append it from `TEMPLATES.md` §2 outside the markers. Other user sections outside the markers stay untouched. The text outside the markers may legitimately be empty on a fresh repo — initialize the skeleton, do not fail.

Then the module survey (Step 4 — see «Module survey» below), then Step 5 (link check), Step 7 (review) and Step 8 (finalize) from `SKILL.md`.

### Как считать hash

SHA-256 of the file contents **after EOL is normalized to LF**, in that order — otherwise a CRLF checkout on Windows flips every file to «human-edited» for no reason.

```bash
# Regular file
node <skill-dir>/scripts/hash.mjs <path>

# Root AGENTS.md — hash only the text outside the allowlisted managed blocks
# (tl-ai-kit markers + gear agent-docs / user-notes)
node <skill-dir>/scripts/hash.mjs AGENTS.md outside-markers
```

`<skill-dir>` is the directory holding this skill's `SKILL.md` and its `scripts/`. Stdout: 64 hex chars, no trailing newline. Exit codes: `0` ok, `1` read error, `2` bad arguments.

Use this script for every hash in the run, in init and in update alike. Improvising with `sha256sum`, `openssl dgst` or an inline `node -e` without the LF normalization produces inconsistent hashes and turns all of `managedFiles` into false conflicts.

## Update flow

Entered when `lastUpdateCommit` is present.

### 1. Validate the base commit

`git cat-file -e <lastUpdateCommit>`. Non-zero exit means the commit is gone (rebase / force-push): ask the user «Полный audit / Init с нуля / Ввести новый base commit вручную» (validate the entered SHA the same way). In `--headless`: exit 1. Never diff against a commit that no longer exists.

### 2. Diff and classify

`git diff --name-only <lastUpdateCommit>..HEAD` — empty list → «нечего обновлять», exit 0. Otherwise map the changed paths onto managed files:

- `src/**` → `docs/architecture/*` (a new module also means `layers.md`, and possibly a new change-scenario)
- `package.json` / `pyproject.toml` / `*.csproj` → `README.md` tech stack
- `migrations/**` / `*.sql` → `docs/development/migrations.md`
- CI config (`.github/workflows/**`, `.gitlab-ci.yml`, `Jenkinsfile`) → `docs/development/releases.md`
- `docs/**` outside `managedFiles` → human-authored, may need integrating rather than overwriting
- a new or substantially grown top-level module dir → run the module-survey delta and create/maintain its local `AGENTS.md` + paired `docs/**` (SKILL.md Step 4)

### 3. Detect human edits

For every entry in `managedFiles`, recompute the hash with `scripts/hash.mjs` (adding the `outside-markers` argument when the entry is flagged `outsideMarkersOnly`) and compare it with the stored value. Different → the file is **human-edited** and goes to smart merge.

### 4. Build the proposal

Apply the authoring discipline from [`DOC-PRINCIPLES.md`](DOC-PRINCIPLES.md) to every candidate edit:

- **Doc-worthiness gate** — drop or redirect content that is not durable and reusable before it reaches a file.
- **Replace over append** — rewrite the section that already covers the topic; the git diff is the changelog, the doc is the current state.
- **Pruning** — in the same pass, delete or rewrite the claims this change just falsified. An update is not append-only.

Then per file: managed and untouched by humans → apply the proposal (report it in the summary); managed and human-edited → smart merge; not managed yet but needed → create from the template and add it to `managedFiles`.

### 5. Smart merge

1. Read the human version; generate the AI proposal.
2. For root `AGENTS.md`, lift the `<!-- tl-ai-kit:* -->` blocks and the allowlisted gear blocks out first and re-insert them verbatim at the end — they are read-only islands and never take part in collision resolution.
3. Split both versions into regions by H1/H2 headings. AI changed only → apply AI. Human changed only → keep the human text. Both changed → collision.
4. Collisions: one `AskUserQuestion` per file showing the user's version beside the AI proposal, with «оставить пользовательскую / применить AI / пропустить merge». In `--headless` nothing is applied and each collision goes to stderr in the `<path>: conflict: <reason>` format.
5. `Write` the merged file, then refresh its hash.

## Audit flow

Read-only, writes nothing, never finalizes state: validate the base commit, run the diff to find code that changed while its docs did not (stale), hash-check all managed files (human-edited), link-check them (broken links). Report the three lists plus what an `update` would propose, then exit 0.

## Add flow

Entered only on an explicit `add` request carrying one piece of knowledge, in an already-initialized project. `add` is a surgical manual write, not a `git diff` consumption: it runs on a dirty tree and it never moves `lastUpdateCommit`.

1. **Doc-worthiness gate.** Run the input through the filter in [`DOC-PRINCIPLES.md`](DOC-PRINCIPLES.md). Not doc-worthy → write nothing and push back, naming where the input belongs instead (commit message / code comment / `tl-reference` / the agent's own memory) and saying plainly that nothing was written. The push-back is user-facing: Russian, on «ты». In `--headless`: exit `3`, reason to stderr as `add: not doc-worthy: <reason>` — never the `conflict:` format, and never a silent write.
2. **Route by audience and altitude** (DOC-PRINCIPLES #1, #8): architecture (overview / layers), development (rules / testing), the matching change-scenario, an ADR, or the glossary. Prefer routing tables from `docs/skill-context/tl-docs/` when they exist. Stay inside the «Owns» list.
3. **Replace over append** (#5): if the topic already has a section, rewrite it in place instead of adding a parallel one. If the fact is already authoritative elsewhere, link to it instead of copying (#6).
4. **Confirm** — show the proposed diff and ask «применить / поправить формулировку / отмена» (Russian, «ты»). `--dry-run` stops here; `--headless` skips the question and applies.
5. **Review** with `REVIEW-CHECKLISTS.md`, including Altitude & Maintainability.
6. **Finalize:** refresh the hash of each touched file in `managedFiles` (adding new files to the map), leave `lastUpdateCommit` alone. `lastUpdateAt` may be refreshed.

## Module survey

Backs SKILL.md Step 4. Runs in `init` (create), `update` (keep the set in step as the tree changes) and `audit` (report gaps, write nothing). The goal: a local `AGENTS.md` on every real module boundary and nowhere else — the discipline and the boundaries are DOC-PRINCIPLES §9.

Discover boundaries; do not assume them. The repo's layout is unknown — open it.

1. **Top-level source dirs.** First-level folders that are not service ones (`.git`, `.github`, `.vscode`, `node_modules`, `bin`, `obj`, `dist`, `target`, `build`, `vendor`, `.idea`, `.vs`). Honour `.gitignore`.
2. **Module signals** (walk 1–2 levels in, no deeper). A folder is a candidate boundary when it reads as a self-contained module rather than one of a crowd:
   - an **application layer** (a domain / application / infrastructure-style separation, whatever the stack calls it);
   - an **entry point** — an API, a scheduler / worker, a message-bus consumer, a CLI, a frontend app;
   - a **sizeable package / library** with its own responsibility;
   - a **cluster of external integrations or providers** sitting side by side;
   - a **tricky or legacy / phasing-out zone** — the places an agent most often gets wrong.
3. **Reject** anything that fails §9: below a module's top level, one of dozens of siblings, or under vendored / generated code.
4. **Act by mode.** `init` / `update`: for each kept boundary create or maintain `<module>/AGENTS.md` from `TEMPLATES.md` §2a and its paired `docs/**` page, under the smart-merge and human-edit rules; add every touched file to `managedFiles`. `audit`: list the boundaries with no `AGENTS.md` and the ones that drifted, and write nothing.

Nothing here names a framework or a fixed path — the categories are the contract, the paths in the examples are only examples.

## Guarantees

- **Idempotency.** Rerunning `update` with no code changes produces an empty diff and exit 0 without mutating state.
- **No automatic rollback.** The user reverts with `git checkout -- <file>` / `git reset`; the post-run report lists every touched file so that is easy.
- **Secrets.** Never carry a real env value or API key into docs — variable names only. Finding `SECRET=xxx` in code is a WARN in the review, not something to copy out.
