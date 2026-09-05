---
name: tl-plan
description: >-
  Breaks a feature or task into an implementation plan, or refines an existing one (`--refine`). Not for: collecting or clarifying requirements → tl-spec. Use when: запланируй, новая фича, разбей на задачи, улучши план, доработай план.
argument-hint: "[--refine [@plan-file]] [--branch [name] | --no-branch] [--spec <path>] [--tech-design <path>] <description>"
allowed-tools: Read Write Edit Glob Grep Bash(git *) Bash(mkdir *) AskUserQuestion
disable-model-invocation: false
---

# Plan — Implementation Planning

Two modes: **create** (default, Step 0 → Step 7) builds a new plan from a description; **refine** (`--refine [@plan-file]`, Step 0.1 → «Refine mode» → Step 7) reworks an existing one.

Plans always live in `docs/plans/YYYY-MM-DD[-HHMM][-description].md`. The plan-file and task format is defined once, in `references/TASK-FORMAT.md` — this file points at it instead of restating it.

## Step 0: Context and arguments

### 0.1 Project context (both modes)

Read `references/project-context.md` at the start of the run and load the context it lists. Its change-scenario row carries the most weight here: when a playbook matches this task type, fold its sections into the plan itself. Add `docs/architecture/layers.md` whenever the task is about code placement.

Use that context to know which patterns to search for, which module names and technologies to name in tasks, and where new files belong.

**Project overrides:** read `docs/skill-context/tl-plan/SKILL.md` if it exists — on conflict a skill-context rule wins over this SKILL.md. How to apply: `references/skill-context.md`.

### 0.2 Arguments

```
--refine [@plan-file]   → refine an existing plan instead of creating one
--branch [name]         → create a git branch (optional explicit name)
--no-branch             → stay on the current branch
--spec <path>           → link to a requirements spec (adds the `Spec:` header row)
--tech-design <path>    → link to a design-review doc (adds `Tech design:` / `Chosen variant:`)
```

Strip the recognized flags; the rest is the description (in refine mode — an optional improvement prompt). The flags are independent and combinable — `--spec` is WHAT, `--tech-design` is HOW, the branch flags are orthogonal to both; `--no-branch` wins over `--branch` and warns. Empty description in create mode → ask the user for a short one (with `--tech-design`, the DR folder slug is a sensible fallback).

### 0.3 Git repository

Check with `git rev-parse --is-inside-work-tree`. If it reports the directory is not a repository, do **not** run `git init` — planning must not create a repository behind the user's back, and a non-git directory usually means the wrong working directory. Ask instead: «Это не git-репозиторий. Создать его здесь (`git init`), планировать без git (ветка не создаётся, в шапке плана `Branch: none`) или отменить?» Any other `git` failure (permissions, broken repo) is reported to the user as-is — don't swallow it, don't retry with a different command.

### 0.4 Validate `--spec` / `--tech-design` (only for the flags that are set)

Read the document's YAML frontmatter and check, in this order:

- File missing or no frontmatter → fail: «Не вижу <спеки | design-review документа> по `<path>`. Проверь путь или сначала создай документ через `/tl-spec` (`/tl-tech-design`).»
- No `slug` / `status` → fail: «Файл не похож на <спеку | tech-design> (нет `slug`/`status` во frontmatter).»
- `status: superseded` (spec), `status: superseded` or `status: abandoned` (DR) → **refuse to plan**: «Документ помечен как `<status>`. Возьми документ из `superseded_by` или собери требования / дизайн заново.» Never silently plan from replaced requirements or an out-of-date decision.
- Spec `status: draft` / `clarifying`, DR `status: draft` / `in-review`, or DR `status: decided` with `chosen_variant: null` → warn via AskUserQuestion: «Документ ещё не финальный (`status: <…>`). Планируем по неполным данным или сначала доведём его через `/tl-spec --update <path>` (`/tl-tech-design --update <path>`)?» — options «Продолжить», «Сначала довести документ», «Отмена». Continuing from a draft DR → mark the plan header «Plan from draft DR» so it stays visible downstream.
- Spec `status: ready`, DR `status: decided` with a `chosen_variant` → normal flow.

Hold the parsed values (`chosen_variant`, the requirement list) for Step 4 and the plan header in Step 6.

---

### Step 1: Preferences (create mode)

Ask two questions before planning: (1) «Планируем документацию после реализации?» — «да» means the plan covers docs (in-task doc-comment edits plus, if needed, separate cross-task README / CHANGELOG / AGENTS tasks), «нет» means no cross-task doc tasks are created (in-task doc edits on touched public entities are still expected); (2) «Есть ли специфические требования или ограничения?»

Hold the docs answer for Step 4 — it is not written into the plan file; its effect materializes in the task list itself. Constraints are reflected in the plan content. Tests are not a question: the «Тесты» section is mandatory in every task (see Important Rules).

### Step 2: Branch decision (create mode)

Flag first, interactive only as a fallback:

1. `--no-branch` → stay on the current branch.
2. `--branch [name]` → create a branch, using `[name]` if given, else auto-generated `<type>/<short-description>` (lowercase, hyphens, ≤50 chars).
3. No flag → ask «Создать новую ветку для этой работы?» with the default option first and its reason. As a chain step this question does not run — see «Running as a chain step». Default by description type: feature / fix / refactor / perf → yes; chore / docs / test / ci → no; ambiguous → no.

Without a branch the plan header records the current branch name or `Branch: none`. With one: `git checkout main` → `git pull origin main` → `git checkout -b <branch-name>`. If the branch already exists, ask: переключиться на существующую или создать с другим именем.

### Step 3: Clarify requirements (create mode)

If the description leaves the scope ambiguous, ask before planning — one or two concrete questions about scope and approach («Нужно уточнить пару моментов перед созданием плана: …»).

**With `--spec <path>` this does NOT run.** Requirements are already gathered and agreed in the spec — take the `REQ-NN` items from it instead of re-asking. If something is still missing, do not start your own clarification loop: tell the user to top the spec up via `/tl-spec --update <path>` and plan from what is there.

### Step 4: Explore the codebase (create mode)

**Skip this step when `README.md` (top) + `docs/architecture/overview.md` already give enough context** — tiny chores and pure-doc edits do not need a code dig. (The documentation-surface pass below still runs when the docs answer was «да».)

**Spec link (`--spec`).** Read the spec's `## Требования`, `## Scope` / `## Non-goals`, `## Расхождения с текущей реализацией` and `## Допущения`. Reference requirements in task descriptions by their stable `REQ-NN` ids. The «Текущее состояние» classification is scoping input: `есть` means already implemented — do **not** turn it into a task; `частично` and `конфликт` say how much work is left (a `конфликт` usually means existing behaviour has to change). The rest of the spec is not copied into the plan — the spec stays the source of truth for requirements.

**Tech-design link (`--tech-design`).** Read the chosen variant's subsection — the heading carrying the `{#variant-N}` anchor matching `chosen_variant` (`### Вариант N: …`, or `## Вариант N: …` in legacy DRs). Hint bullets («Hints для плана» under `## Решение`; `## Implementation hints` in legacy DRs) are seed notes used by judgement — tasks are not derived one-to-one from them. Other DR sections are not auto-copied; the DR stays the source of truth for the decision.

**Code exploration** via `Glob` / `Grep` / `Read`: affected modules and entry points; existing patterns for similar functionality to copy style from; files that import what you will touch (side effects). If the harness supports parallel codebase-exploration subagents, launch 1–3 scaled to complexity, one per aspect, to keep the main context clean; otherwise explore directly — same result, just sequential.

**Choose the sufficient solution.** After the flow is understood, prefer existing project behavior, then a language/platform facility, then an installed dependency, then the smallest new implementation. A task that introduces a dependency, abstraction, configuration surface or speculative scaffolding must name the current requirement or repository constraint that makes the earlier options insufficient in its existing «Контекст» / «Риски/нюансы».

**Documentation surface (only when the docs answer was «да»).** A cheap surface check, not a survey: `Glob docs/*.md` (list, don't read), the top of `README.md`, existence of `CHANGELOG.md` / `AGENTS.md`. Don't recurse into `docs/**` and don't mass-read markdown; doc-comment style is noticed during the code exploration that is happening anyway.

Synthesize: files to create/modify, patterns to follow, dependencies between components, risks and edge cases.

### Step 5: Draft the tasks (create mode)

Each task = one small atomic PR (`references/TASK-FORMAT.md` → Sizing), ordered by dependency. Every task needs both a `- [ ] Task N: <subject>` checkbox in `## Задачи` and a matching `### Task N: <subject>` block with the 5 mandatory sections — Контекст / Что сделать / Файлы / Acceptance criteria / Тесты — plus `**Зависит от:** Task M` when it depends on another task.

**Doc tasks, two tiers.** In-task by default: per-entity doc edits (the doc comment on a touched public entity, the README line about this task's CLI flag) live in «Файлы» / «Acceptance criteria» / «Тесты» of the same code task. Cross-task: a separate `### Task N:` only when documentation describes the feature **as a whole** (new README section, CHANGELOG entry, AGENTS.md update for a new agent process, a new `docs/<feature-slug>.md`). Details — `references/TASK-FORMAT.md` → Documentation tasks.

### Step 6: Save the plan (create mode)

`mkdir -p docs/plans`, then save to `docs/plans/YYYY-MM-DD[-HHMM][-short-description].md`.

The flags contribute header rows directly under `Created:`, in this fixed order: `--spec` adds `Spec: <path>`; `--tech-design` adds `Tech design: <path>` + `Chosen variant: variant-N`. Both flags together → all three rows; without the flags the rows are simply absent.

**Sections are Russian** — `## Контекст`, `## Файлы`, `## Задачи`, `### Этап N:` — and **`## Контекст` stays under 400 words**, with decisions taken for the user in its optional `### Принятые решения`. Anything longer is referenced through the `Spec:` / `Tech design:` rows, not copied in. Details: `references/TASK-FORMAT.md` → «Header rows and the context section».

Before writing, run the conformance checklist from `references/TASK-FORMAT.md` — it also lists what a plan file MUST NOT contain.

### Step 7: Next steps (both modes)

Report «План создан: N задач. Файл плана: `<plan-path>`» (refine mode prints its own summary — see R5), then ask — **unless this is a chain step**, where the question is skipped entirely (see «Running as a chain step»):

```
AskUserQuestion: Что дальше?

1. Доработать план — второй проход: пробелы, зависимости, лишние задачи (`/tl-plan --refine`)
2. Перейти к реализации — план выглядит достаточным, сразу к коду (`/tl-implement`)
3. Остановиться здесь — ничего не запускать
```

Suggest the matching command and stop there. Whether to advise a context reset first depends on the harness: if it runs the next skill in its own fresh subagent, no manual reset is needed; without subagents context accumulates between runs, so tell the user to reset the agent context before the next command. Never invoke a context-release command yourself — that is the user's action and depends on the harness.

---

## Refine mode (`--refine [@plan-file]`)

A second pass over an existing plan: re-analyze it against the code, report what is wrong, apply the approved changes. Step 0.1 runs first and `references/TASK-FORMAT.md` applies unchanged. Steps 1–6 do not run — refine never creates a branch and never creates a new plan file.

**R1. Find the plan.** `--list` among the arguments → print the plans in `docs/plans/` with their dates and stop, changing nothing. `@<path>` → use it (relative to project root; absolute allowed); missing file → «Не вижу план по `<path>`» and stop. Otherwise → the most recent `docs/plans/YYYY-MM-DD*.md` (by date, then `HHMM`). No plans at all → «Активный план не найден. Сначала создай его: `/tl-plan <описание>`.» and stop.

Read the whole plan: goal, the `## Задачи` checkboxes, every `### Task N:` block, dependencies. **An older plan may use the English section names** (`## Context` / `## Files to change` / `## Tasks` / `### Phase N:`) — same sections, and the headings stay: refine reworks content, not the format of a plan in flight. Note which tasks are `- [x]` (done — off limits) and which are `- [ ]` (eligible for changes).

**R2. Re-analyze against the code.** Go deeper than the original planning pass: `Glob` / `Grep` / `Read` the files each task names, the patterns it should follow, and the integration points it would hit (routes, migrations, config, DI wiring, validation, auth). You are looking for what the plan assumed and the code contradicts.

**R3. Defect taxonomy.** Classify every finding as one of these six — the last four are what a generic «review this plan» pass misses:

1. **Missing task** — work the plan doesn't cover (migration, config, index, wiring, an uncovered edge case), or a task whose «Тесты» section is missing or is a bare forward-reference.
2. **Vague description** — no file paths, no concrete actions, acceptance criteria nobody can check, or paths that don't exist.
3. **Wrong, missing or unnecessary dependency** — A depends on B but is ordered before it; C consumes A's output without being blocked by it; or two tasks are chained that could run in parallel.
4. **Unnecessary work or solution** — the behavior already exists, two tasks duplicate it, or a new dependency, abstraction, configuration surface or scaffold is planned although an evidenced project/platform option satisfies the same acceptance criteria. Quote the proving `file:line` and, for a replacement, explain why behavior remains complete; raw task count or projected LoC is not evidence.
5. **Wrong scope** — too large (split; `references/TASK-FORMAT.md` → Sizing), too small (merge into its neighbour), or outside the feature (gold-plating).
6. **Not provable** — the plan declares the work but nothing can decide whether it happened. Four shapes, all cheap to find and expensive to miss:
   - «Тесты» that is not a binary check («написать тесты», «проверить работу») → name the concrete command, test or scenario.
   - A weaker check than the change allows — a judgment review where a command would decide it (`references/TASK-FORMAT.md` → the ladder).
   - With a `Spec:` header row: a `REQ-NN` no task names in «Контекст» — an uncovered requirement, which is a missing task, not a wording problem.
   - A claim about existing behavior with no `Проверено:` line behind it — re-read the method body; if it does not hold, the task built on it goes.

   Splitting a task belongs to defect 5, not here: two checks in one task are a reason to split only when they close **different** acceptance criteria. Several steps of one check — build green *and* the named test green — are one atomic task, and splitting them makes the plan worse.

An improvement prompt passed after the flag is an extra lens on top of these six, not a replacement for them.

**R4. Report, then the apply gate.** Show the findings and ask — nothing is applied before the answer comes back. As a chain step the answer comes from the orchestrator, not the user (see «Running as a chain step»):

```
## Отчёт по плану

План: <путь>, задач: N

**Добавить (N).** <тема> — зачем нужна, после какой задачи.
**Улучшить (N).** Task N: <что не так> → <что поменять>.
**Зависимости (N).** Task N ↔ Task M: <что не так> — почему.
**Удалить (N).** Task N — <почему избыточна, со ссылкой на существующий код>.
**Проверяемость (N).** Task N: <что нельзя проверить> → <какая проверка появится>.

Применить изменения? — «Да, все» / «Дай выбрать» / «Нет, оставить план как есть»
```

Nothing found → «План выглядит хорошо — существенных пробелов и противоречий не нашёл.» and go to Step 7.

**R5. Apply the approved changes** with `Edit` (or `Write` when the rewrite is extensive), in place, in the same plan file:

- Improve a task → edit its `### Task N:` block; if the subject changed, sync the `- [ ] Task N: <subject>` checkbox so the wording matches exactly.
- Add a task → append both the checkbox and a full 5-section `### Task N:` block; express the dependency with `**Зависит от:** Task M`.
- Fix a dependency → edit the `**Зависит от:**` line and reorder the task checklist when that makes the order readable.
- Remove a task → delete its checkbox and its block. Renumbering is optional; gaps are acceptable in small plans.
- **Never modify or remove `- [x]` completed tasks** — they describe work already done, and their blocks are the record of it.
- Stamp the header: `Refined: <YYYY-MM-DD>` under `Created:`, overwriting any row a previous pass left. Decisions this pass took for the user go into `### Принятые решения` inside `## Контекст`, with a short parenthetical on the `Refined:` row.

Re-check the result (every checkbox has its block and vice versa, subjects match, every block still has all 5 sections), then report «План обновлён: добавлено N задач, улучшено N описаний, исправлено N зависимостей, удалено N задач. План: `<путь>`, всего задач: N.» and go to Step 7.

## Running as a chain step

When the run context carries an `autonomy` value (the shared axis defined in `references/execution-modes.md`), this skill is a step of `/tl-workflow` and the orchestrator already knows what comes next. Everything above is unchanged except who answers the gates:

- **Skip the Step 7 «Что дальше?» question entirely** — asking it stalls the chain, and in `full` autonomy nobody is there to answer. Print the summary and hand back; the chain runs the next step, this skill never does.
- **Never ask about the branch (Step 2).** The chain passes `--branch` / `--no-branch` explicitly; with neither flag, stay on the current branch and say so in the summary. The chain's state file is keyed by the branch name, so switching branches on your own initiative orphans it and the chain loses its progress.
- **Budget the questions of Step 1 and Step 3 by autonomy** — ≤2 rounds in `interactive`, ≤1 in `checkpoint`, **none** in `full`. In `full`, answer each by a reasonable default (docs → «нет» unless the description is itself documentation work; constraints → nothing beyond what the code already shows), state the defaults in the summary and keep going. With `--spec` Step 3 does not run at all, as usual.
- **The refine apply gate (R4) is dispatched by the chain, not asked of the user.** `full` → apply every finding and list what was applied; `checkpoint` → print the report and hold it for the next checkpoint; `interactive` → ask as usual. R6 still holds — refine improves, it never rewrites, and `- [x]` tasks stay untouched in every autonomy.
- **Return the result** through the layer's contract skeleton: `status` (`done` / `blocker` / `question`), a one- or two-line Russian `summary`, plus the plan path and the task count. `status: question` is for a fork that genuinely blocks the plan — never for the gates above, which the chain answers.

---

## Important Rules

1. **The plan file is the source of truth.** Every `- [ ] Task N: <subject>` checkbox has a matching `### Task N: <subject>` block with the full 5-section description, and vice versa — a mismatch is a bug, fixed before the file is saved. See `references/TASK-FORMAT.md` → Conformance checklist.
2. **Tests are part of every task's DoD.** Each `### Task N:` block carries a self-contained «Тесты» section: concrete scenarios, or a concrete verification method (build, migration apply, a downstream task that exercises the wiring). Bare forward-references («См. Task N») and standalone test-only tasks or phases are forbidden. Tests go where they verify real behaviour, not ritually.
3. **One task = one small atomic PR.** The plan may be large; the task never is. Sizing and splitting triggers — `references/TASK-FORMAT.md`.
4. **Plans live in `docs/plans/`.** `--spec` / `--tech-design` change the plan header, never the save location.
5. **Ownership boundary.** This skill writes `docs/plans/*.md` and nothing else.
6. **Refine improves, it never rewrites.** Keep the existing plan's structure, justify every proposed change by the codebase or by the user's prompt, and apply only what the user approved — no unrequested extras.
7. **Read-only / plan-mode harnesses.** This skill writes to the repo (`git`, `mkdir`, `Write`, `Edit`). If the harness denies a mutating call because the user is in a read-only or planning mode, do not look for a way around it (no `--force`, no alternative tools). Stop and say: «Чтобы продолжить, переключи агента в режим, разрешающий запись, и запусти `/tl-plan` ещё раз — скиллу нужно записать файл плана.»
8. **Never start executing the plan.** Planning ends at Step 7. The skill MUST NOT call `/tl-implement`, edit the files the plan mentions, or run task code — even after the user picks option 2 in Step 7. Option 2 only suggests the next command; the user enters it in their next message. Execution is always a separate, user-initiated action.
