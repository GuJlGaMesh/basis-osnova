---
name: tl-compound
description: >-
  Turns learnings from the current session into durable edits to the project's rules and context docs, after confirmation. Use when: выводы по сессии, добавь правила из сессии, чтобы агент не ошибался.
argument-hint: "[light | full] [focus area or short context]"
allowed-tools: Read Glob Grep AskUserQuestion Questions
disable-model-invocation: false
---

# Compound — Session Learnings to Guardrails

Convert the current coding session into durable repo guidance so future agent runs make fewer mistakes.

This skill is for prevention, not for writing generic retrospectives. It extracts concrete learnings from the current session and upgrades the repo context that guides later work.

## Modes

Parse `$ARGUMENTS`:

- `light` → quick pass, highest-value 1–3 improvements only
- `full` → deeper pass across rules, skill-context, AGENTS, and architecture
- no mode → default to `full`

Remaining text after mode parsing is the optional focus area.

Examples:

- `/tl-compound`
- `/tl-compound light`
- `/tl-compound full auth module`
- `/tl-compound add rules from this debugging session`

## Workflow

### Step 0: Load Context

Read these files if they exist:

- Root `AGENTS.md`
- `docs/AGENTS.md`
- `docs/development/rules.md`
- `docs/architecture/overview.md`, `docs/architecture/layers.md`, `docs/architecture/dependencies.md`, `docs/architecture/constraints.md`
- `README.md` (top Tech Stack section)
- `docs/skill-context/**/SKILL.md`

If a focus area or skill is obvious from the session, prioritize the matching skill-context file. Do not bulk-edit many files just because they exist.

### Step 1: Extract Session Learnings

Infer the most valuable learnings from the current session.

Look for evidence of:

- repeated mistakes
- missing repo conventions
- missing file discoverability
- wrong assumptions about architecture or ownership
- missing implementation constraints
- missing review or verification checks

For each learning, capture:

1. **Observed friction** — what went wrong or what was harder than necessary
2. **Why it happened** — missing rule, missing context, missing discoverability, or unclear architecture
3. **Preventive improvement** — the smallest durable repo change that would reduce repeat failures

When an intentional shortcut is worth preserving as a learning, record at least its accepted limit and an observable reason to revisit it. Add a likely upgrade path only when the session provides one; do not discard the learning merely because that future solution is still unknown. A vague «we will improve this later» alone is not actionable.

Ground every learning in the session and repo context. Do not invent process because it sounds nice.

### Step 2: Classify Each Improvement

Assign each learning to one of these buckets:

#### A. Project Rule

Use `docs/development/rules.md` when the guidance is:

- short
- actionable
- project-wide
- likely to apply across multiple future tasks

Good examples:

- `Always update API contract tests when changing response DTOs`
- `Do not call external provider clients directly from controllers; use application services`

#### B. Skill Context

Use `docs/skill-context/<skill>/SKILL.md` when the guidance is specific to how one skill should behave in this repo.

Examples:

- `tl-implement` must always inspect generated migrations before applying them
- `tl-code-review` must check a specific boundary or risk that is important in this repo

#### C. Discoverability

Use root `AGENTS.md` (only text outside `<!-- tl-ai-kit:* -->` markers) when the problem is that the agent does not know where to look first. For task-type navigation use `docs/AGENTS.md`.

Examples:

- a critical folder or context artifact was not surfaced
- a key entry point or ownership boundary was easy to miss
- a durable repository convention existed only implicitly in code
- `docs/AGENTS.md` does not reflect a new change-scenario or a new subdir

#### D. Architecture

Use `docs/architecture/overview.md` / `layers.md` / `dependencies.md` / `constraints.md` when the learning is about structure, boundaries, dependency direction, or module responsibility.

Examples:

- allowed dependency flow between layers
- module ownership of a business process
- where integrations belong

### Step 3: Quality Gate Before Proposing Changes

Every proposed improvement must pass all checks below.

#### Specificity

Reject vague rules such as:

- `write clean code`
- `be careful with types`
- `test everything`

Rewrite them into something concrete and checkable.

#### Correct Placement

Do not put skill-specific behavior into `docs/development/rules.md`.

Do not put architecture decisions into `AGENTS.md` if `docs/architecture/*` is the real source of truth.

Do not duplicate an existing rule with slightly different wording.

#### Minimality

Prefer the smallest correct change:

- append one rule
- add one bullet to an existing section
- extend one skill-context file

Only add a new section if there is no natural place for the guidance.

#### Evidence

If you cannot explain which session failure or friction the change prevents, do not propose it.

### Step 4: Present Proposed Improvements

Before editing anything, show a concise report:

```markdown
## Выводы по сессии

### Ценные уроки
1. [урок]
   Почему важно: [какую повторяющуюся ошибку предотвращает]

### Предлагаемые изменения
1. `docs/development/rules.md`
   Изменение: [точная новая формулировка правила или краткое описание]
   Почему сюда: [почему это правильный файл]

2. `docs/skill-context/tl-implement/SKILL.md`
   Изменение: [краткое описание]
   Почему сюда: [причина]

Применить эти изменения?
- [ ] Да, применить все
- [ ] Дай выбрать
- [ ] Нет, только отчёт
```

If there are no worthwhile improvements, say so explicitly and stop.

### Step 5: Apply Only Confirmed Changes

After the user confirms:

- Apply only the selected changes
- Preserve the file's existing style and density
- Prefer editing existing sections over adding new top-level sections
- Keep wording compact and operational

If the user chooses selective application, ask which changes to apply.

### Step 6: Final Report

Report:

- which files were changed
- what each change prevents in future sessions
- any high-value improvement you intentionally did not apply

## Editing Rules By Target

Prefer these targets in the order below: 1 first, 5 last.

Do not create new files in v1 unless the target file is the natural canonical location and must be created to store the guidance. Leave new layout generation to `/tl-docs` — `/tl-compound` only appends to existing artifacts.

### 1. `docs/development/rules.md`

- Keep rules flat as `- ` list items
- One rule per line
- Short, actionable, and verifiable
- Skip duplicates and near-duplicates

### 2. `docs/skill-context/<skill>/SKILL.md`

- Treat skill-context as project-specific overrides
- Add only guidance relevant to that skill
- Match the surrounding style
- Prefer small additions near existing enforcement or workflow sections

### 3. Root `AGENTS.md`

- Improve discoverability, not procedural micromanagement
- Surface key folders, ownership, or conventions an agent should know early
- Prefer one line in an existing relevant section before adding a new section
- **Never touch content inside `<!-- tl-ai-kit:X -->` ... `<!-- /tl-ai-kit:X -->` markers** — that is the tl-ai-kit CLI zone

### 4. `docs/AGENTS.md`

- Update the task-type table when the session showed the agent did not know where to go for a new task type
- Edit only when a discoverability problem actually surfaced; for minor clarifications use `docs/development/rules.md` instead

### 5. `docs/architecture/*.md`

- Add only durable structural decisions
- Do not document temporary implementation details
- Keep boundaries, dependency direction, and module ownership explicit
- File choice: `overview.md` for high-level, `layers.md` for boundaries, `dependencies.md` for directions, `constraints.md` for non-functional constraints

## Gotchas

- One strong rule beats five weak ones — volume is not value.
- If the same learning fits several targets, choose the single strongest source of truth unless the repo genuinely needs both discoverability and detail.

## Output

The primary output is a short findings report plus approved targeted edits to existing repo context files.
