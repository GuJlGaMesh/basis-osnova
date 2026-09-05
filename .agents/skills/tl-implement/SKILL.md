---
name: tl-implement
description: >-
  Executes tasks from the current plan one by one, ticking each off after its check passes, then gates the plan on completeness. Use when: выполни план, начни кодить, всё ли сделано по плану, verify the plan is done.
argument-hint: '[--list] [--check] [--reconfigure] [@plan-file] [task-id | task-range | "status"]'
allowed-tools: Read Write Edit Glob Grep Bash AskUserQuestion
disable-model-invocation: false
---

# Implement — Execute Task Plan

Execute tasks from the plan file, keep its checkboxes in sync, and let the work resume across sessions.

## The main invariant

> **`- [x]` goes in ONLY after that task's own check has passed green.**

A checkbox is *evidence of verification*, not evidence of effort. Ticking it before the check is green turns the plan into a wish list and lets the run declare «готово» with nothing behind it. This rule overrides every convenience below — never break it.

## Workflow

### Step 0: Parse arguments, check state

All arguments are optional and combinable:

| Argument | Effect |
|---|---|
| `--list` | list available plans and stop (see below) |
| `--reconfigure` | drop the execution marker and re-run the setup session (Step 0.3) |
| `@<path>` | explicit plan file — beats auto-discovery |
| `<N>` | start from task N |
| `<N>-<M>` | run the inclusive range; tasks already `- [x]` inside it are skipped silently |
| `status` | report progress only |
| `--check` | run the completion gate (Step 5) over the plan and report; executes nothing |

Natural-language phrasings resolve to the same things — «задача 5» → `5`, «выполни таски 2-4» → `2-4`, «с 5 до конца» → task 5 through the last one. If a phrase does not clearly resolve to a task or a range, ask instead of guessing.

`status`, `--list` and `--check` are read-only: no task execution, no file writes, no checkbox changes — `--check` reports what the gate found instead of flipping anything back. `--list` wins over every other flag, `--check` over `status`. `--reconfigure` next to `status`, `--check` or `--list` is ignored with a one-line notice («`--reconfigure` игнорируется в режиме `status`; запусти `/tl-implement --reconfigure` отдельно»).

Then run `git status` and `git branch --show-current`.

**`--list`:** glob `docs/plans/*.md` (date-based names `YYYY-MM-DD[-HHMM][-description].md`), print them most recent first with usage hints (format: `references/IMPLEMENTATION-GUIDE.md`), and stop here.

### Step 0.0: Resume and recovery

When resuming after a break or a context loss, rebuild state from the repo before touching tasks: `git status`, `git branch --show-current`, `git log --oneline --decorate -20`, optionally `git diff --stat` and `git stash list`.

Then reconcile the plan against the code:

- Code for a task is already there but the checkbox is still `- [ ]` → verify it against the task's Acceptance criteria and flip it to `- [x]`.
- A task is `- [x]` but its code is missing (after a rebase or reset) → flip the checkbox back to `- [ ]` and discuss with the user before continuing.

**Uncommitted changes.** Resolve the active plan file first (`@<path>` override, otherwise auto-discovery). Changes **only** in that plan file are normal — continue without prompting. Otherwise ask:

```
У тебя есть незакоммиченные изменения. Сначала закоммитить их?
- [ ] Да, закоммитить сейчас (/tl-commit)
- [ ] Нет, stash и продолжить
- [ ] Отмена
```

**If no plan file exists:**

```
Активный план не найден.

Текущая branch: feature/user-auth

Что хочешь сделать?
- [ ] Начать новую фичу с текущей branch
- [ ] Вернуться на main/master и начать новую фичу
- [ ] Создать быстрый план задач (без branch)
- [ ] Ничего, просто проверяю статус
```

→ new feature from here: `/tl-plan --branch <description>`; back to main: `git checkout main`, `git pull`, then `/tl-plan --branch <description>`; quick task: `/tl-plan --no-branch <description>`.

### Step 0.1: Load project context

Read `references/project-context.md` at the start of the run and load the context the plan's tasks need. Every conditional source in it applies to an implementation run: the `docs/change-scenarios/<type>.md` playbook matching the task, `docs/development/rules.md` (hard requirements — they override generic patterns and anything you would otherwise infer from the surrounding code), and `docs/architecture/layers.md` for file placement and module boundaries, plus `dependencies.md` when needed.

`docs/skill-context/tl-implement/SKILL.md` — project overrides. On conflict the project rule wins over this skill's own instructions, including the code you write and how you update checkboxes. How to apply: `references/skill-context.md`.

### Step 0.2: Find the plan file

`@<path>` if given; otherwise glob `docs/plans/*.md` and take the most recent by date (then by HHMM).

Read it for the task checklist (`- [ ]` / `- [x]`), the `### Task N:` blocks, the `**Зависит от:**` lines, and each task's «Тесты» section — those scenarios ship in the same PR as the task itself.

**Plan sections come in two vintages and this skill reads both.** `## Задачи` = `## Tasks`, `## Контекст` = `## Context`, `## Файлы` = `## Files to change`, `### Этап N:` = `### Phase N:` — Russian in current plans, English in older ones. Match whichever the file actually uses and **never rewrite its headings**: historical plans are not migrated. Everything below names the Russian form; read it as «either name».

### Step 0.3: Execution setup

In `status` and `--check` modes skip this step entirely: adopt whatever marker is present (or the defaults) and go straight to the report without writing to the plan file.

Otherwise resolve four axes — `mode`, `autonomy`, `tdd`, `commit` — and persist them in one HTML marker line directly under the plan-file H1:

```
<!-- tl-implement: mode=inline autonomy=interactive tdd=false commit=per-task -->
```

1. `--reconfigure` → delete the existing marker line and continue as if there were none.
2. Otherwise parse the marker and adopt its values.
3. No marker, or it does not parse → run the one-shot setup session (four questions) and write the marker.

Allowed values, lenient parsing and prompt wording: `references/EXECUTION-SETUP.md`. `mode` and `autonomy` are the shared axes of `references/execution-modes.md`; `tdd` and `commit` are private to this skill.

Read `references/report-format.md` before printing any progress or completion report — it fixes the status marks this skill uses (`✅` / `⚠️` / `❌`) and what a report may not claim.

The setup questions are asked **once per implementation session** — later partial runs (`/tl-implement 2-4`, `/tl-implement 5`) adopt the existing marker silently. The defaults (`mode=inline autonomy=interactive tdd=false commit=per-task`) reproduce the legacy behavior exactly. Writing the marker touches only the plan file, so the active-plan-file exception above applies — no commit/stash prompt for it.

### Step 1: Pick the next task

With `--check`, skip Steps 1–4 and run the Step 5 completion gate over the plan as it stands.

Parse the `## Задачи` checklist and the `### Task N:` blocks. The next task is the first `- [ ]` whose `**Зависит от:**` line (if any) refers only to already-checked (`- [x]`) tasks. If a previous session left work mid-task (code partially written, checkbox still `- [ ]`), finish that task first instead of moving on to the next pending one.

### Step 2: Show progress

```
## Прогресс реализации

✅ Выполнено: 3/8 задач
🔄 В работе: Задача #4 — Реализовать search service
⏳ Ожидает: 4 задачи
```

### Step 3: Execute

`mode` decides where the work runs, `autonomy` decides how often to stop and ask; the axes are independent and every combination is valid. The plan-file checkboxes are the single source of truth and are flipped **only by the orchestrator** (this step) — subagents report task ids, the orchestrator applies them.

- **`mode=inline`** (default) — read the `### Task N: <subject>` block and follow `references/TASK-EXECUTION.md` (Classic or TDD per the `tdd` flag). Flip the checkbox only through the gate in 3.5.
- **`mode=subagent-per-task`** — spawn a subagent with `references/TASK-EXECUTION.md` + the task excerpt + the `tdd` flag, parse its `status: done | blocker | question` reply, and on `done` flip the checkbox through the gate in 3.5.
- **`mode=subagent-per-phase`** — same, with the `### Этап N:` excerpt and `TASK-EXECUTION.md` → «Phase batch»; run the gate in 3.5 for every id in the returned `completed_task_ids` and flip the ones that come back green.

Fallbacks — each applies for the rest of the session with a one-line notice, and never rewrites the marker:

- `subagent-per-phase` on a plan without `### Этап N:` groupings → `subagent-per-task`. «План без фаз, переключаюсь на `subagent-per-task`.»
- `subagent-*` where the host exposes no subagent-spawn tool → `inline`. «Хост не поддерживает субагентов, выполняю inline.»
- Partial run (`<N>`, `<N>-<M>`) × `subagent-per-phase` → `subagent-per-task` for that range. «Частичный запуск, схлопываю режим до `subagent-per-task`.»

**Autonomy dispatch.** The executor only reports honestly; the orchestrator decides whether to interrupt the user (`references/execution-modes.md` → «Autonomy protocol»). Checkpoints here are phase boundaries (`### Этап N:` headings) and irreversible actions — commit, push, DB migration, or a fork in the road with a non-obvious choice.

- `status: question` → `full`: resolve it by the reasonable default and record the choice; `checkpoint`: hold it until the next checkpoint and ask there; `interactive`: ask immediately.
- `status: blocker` → stop and wait for the user, in every autonomy value.
- In `checkpoint`, pause for an «ок» at each checkpoint even with no pending question.

A batched per-phase report is walked under the same rules, item by item.

**3.5: The check gate.** Applies in all three modes — a subagent reporting `status: done` is a claim, and the orchestrator flips the checkbox only after this gate is green. Every task carries one check: its «Тесты» section names it, and `tl-plan/references/TASK-FORMAT.md` orders the forms from strongest to weakest. Run it and read the actual exit code or output — «выглядит правильно» is not a result, and a check nobody ran is a red check.

A criterion that is a **judgment** by nature (API readability, whether a mapping is correct, whether the wording fits) has no command behind it. Do not rule on it yourself — the author of a change is always satisfied with it. Hand it to an independent reviewer: if the harness supports subagents, spawn one with the task's Acceptance criteria plus `git diff` of the touched files and the instruction «верни строго PASS или FAIL и 1–3 причины; код не пиши»; otherwise run `/tl-code-review` over the same diff and read its verdict. `FAIL` feeds the fix loop.

**3.6: The fix loop.** A red check is not a blocker yet:

```
attempts = 0
while check != PASS and attempts < 5:
    read the actual error output → make the MINIMAL fix that removes it → rerun the check
    attempts += 1
if check != PASS:
    leave the checkbox "- [ ]", report the last error, STOP and ask the user
    do not start tasks whose «Зависит от» names this one
```

Five attempts is a ceiling, not a target: two attempts producing the same error mean the approach is wrong, so stop early and ask instead of spending the rest of the budget. Every attempt fixes the error the check reported — **never** the check itself. Weakening, skipping or rewriting a check so that it passes is the one failure this loop exists to prevent. Blocker wording: `references/IMPLEMENTATION-GUIDE.md`.

**3.7: Context artifacts.** Steps 3.7 and 3.8 are orchestrator decisions in all three modes — they need plan-wide context a subagent does not have. Touch these only when something actually changed:

- **`README.md`, Tech Stack section — allowed.** A new dependency, integration or stack change → add the factual delta. Do not rewrite unrelated sections; a full documentation refresh belongs to `/tl-docs update`.
- **`docs/architecture/*` — allowed.** New modules, directories or entry points, or changed dependency rules → refresh `layers.md`; add `overview.md` for a new high-level flow and `dependencies.md` for new constraints. Do not rewrite on every task.
- **`docs/development/rules.md` — not allowed.** Never edit `docs/development/rules.md` from this skill. If you spot recurring conventions or pitfalls, propose up to 3 candidate rules and let the user add them:

  ```
  AskUserQuestion: Сохранить новые правила проекта в `docs/development/rules.md`?
  1. Да — добавить эти правила (рекомендуется)
  2. Нет — пропустить
  ```

- **`docs/AGENTS.md` and the root `AGENTS.md` — not allowed.** They are owned by `/tl-docs`; if navigation needs updating, report it and suggest `/tl-docs update` after `/tl-code-review`.

`docs/change-scenarios/*.md` stays read-only here, and never invoke `/tl-docs` on your own.

**3.8: Offer a commit** — dispatch on `commit`. Build the message from the task (or phase) description.

- **`per-task`** (default) — after every completed task:

  ```
  ✅ Задача #4 выполнена: Реализовать search service

  Готов закоммитить?
  Предлагаемое сообщение: "feat: implement search service"

  - [ ] Да, закоммитить сейчас (/tl-commit)
  - [ ] Нет, перейти к следующей задаче
  - [ ] Пропустить предложения commit в этой сессии
  ```

  The third option stops the prompts until the session ends.

- **`per-phase`** — prompt only when the checkbox you just flipped was the last `- [ ]` of its `### Этап N:` block, no matter when the earlier tasks of that phase were closed (previous session or this run). Offer «✅ Этап N завершён. Готов закоммитить всю фазу одним коммитом?» with the same three options. Plan without phases → fall back to `per-task`, one notice: «План без фаз, переключаюсь на коммиты per-task.» A partial run that closes no phase → suppress the per-task prompts inside the range and ask once after its last task: «Частичный запуск закончен (задачи N–M). Готов закоммитить весь диапазон одним коммитом?»
- **`none`** — no prompt; print one line: «Commit policy: none — пропускаю предложение коммита.»

The Step 5 `/tl-code-review → /tl-commit` dialog is never suppressed by the `commit` policy — the options above govern in-session prompts only.

**3.9: Move to the next task, or pause.**

### Step 4: Pausing

Progress lives in the plan-file checkboxes, so it survives any session reset.

```
Прогресс сохранён.

Выполнено: 4/8 задач
Следующая задача: #5 — Добавить поддержку пагинации

Чтобы продолжить позже, запусти:
/tl-implement
```

### Step 5: Completion gate

Every box ticked is a claim about the plan as a whole, and the loop closes by checking it — the per-task gate of 3.5 saw one task at a time and cannot see what fell between them. Before printing anything, walk **every** task in the plan and find, with `Glob` / `Grep` / `Read`, the code that satisfies its Acceptance criteria. Check that the implementation does what the task described, not that «что-то написано».

This pass exists to catch a false sense of completion, and what it catches a diff review structurally cannot:

- the task is closed, but a TODO for it is still sitting in the code;
- the function is created, but never exported or wired in;
- the endpoint exists, but returns a stub;
- the extreme case — a task that produced **no change at all**: there is nothing in the diff to look at, so only the plan reveals it.

| Status | Meaning |
|---|---|
| `✅ ВЫПОЛНЕНО` | every requirement was found in the code and read |
| `⚠️ ЧАСТИЧНО` | part is implemented — name exactly what is missing |
| `❌ НЕ НАЙДЕНО` | no implementation found — name where you looked |
| `⏭️ ПРОПУЩЕНО` | the user deliberately skipped the task |

A `- [x]` checkbox never upgrades a status on its own — the code decides. Anything that is not `✅` flips its checkbox back to `- [ ]`: the plan does not reach «завершено» with a red row in it, and the unfinished ids are handed back so `/tl-implement <N>` can pick them up.

When the plan carries a `Spec:` header row, check the traceability in the other direction too: every `REQ-NN` of the spec is named by at least one task's «Контекст». A requirement no task claims is an uncovered requirement — report it instead of quietly closing the plan.

Then report. The H1 is «Реализация завершена» only when every row is `✅`; with anything red it is «Реализация: гейт полноты», and «Что дальше?» leads with the tasks that came back:

```
## Реализация: гейт полноты

Задачи: 7/8 ✅

| # | Задача | Статус | Что не так |
|---|--------|--------|------------|
| 1 | Создать модель пользователя | ✅ Выполнено | |
| … | … | ✅ Выполнено | |
| 7 | Добавить сброс пароля | ⚠️ Частично | Нет отправки email (в задаче — интеграция SendGrid) |
| 8 | Обновить API-документацию | ✅ Выполнено | |

Branch: feature/product-search
Файл плана: docs/plans/2026-03-20-product-search.md
Изменённые файлы:
- src/services/search.ts (создан)

Что дальше?

1. 🔧 /tl-implement 7 — Доделать задачу, не прошедшую гейт (рекомендуется)
2. 🔍 /tl-code-review — Проверить дифф на дефекты
3. 💾 /tl-commit — Закоммитить изменения напрямую
```

The table is the completion record: **one row per task in the plan**, the `✅` ones included — that is what makes «ничего не забыли» checkable. Leave «Что не так» empty for the green rows and do not narrate them.

Then, only when every row is `✅`, offer to drop the plan file:

```
Удалить docs/plans/2026-03-20-add-auth.md? (Все задачи выполнены, план больше не нужен)
- [ ] Да, удалить
- [ ] Нет, оставить
```

Context is heavy after implementation. If the harness supports subagents, the next step gets a clean context from its own subagent run — just suggest the command. Otherwise recommend that the user release the agent's context first; never invoke a context-release command yourself.

## Rules

- Execute one task at a time, following the existing code conventions and the placement rules in `docs/architecture/layers.md`.
- Implement the «Тесты» scenarios of the current task in the same PR — they are part of the DoD, not optional. A task is not complete until build and tests are green.
- Never flip a checkbox to `- [x]` before that task's check is green (the main invariant above), and never weaken a check to get it green. The plan file is the source of truth for progress.
- No summary reports, no analysis documents, no wrap-up files.
- Do not add tasks that are not in the plan, and do not skip tasks without the user's permission. Stop and ask when a task is unclear.

The blocker template, the `--list` output and a full flow example: `references/IMPLEMENTATION-GUIDE.md`.
