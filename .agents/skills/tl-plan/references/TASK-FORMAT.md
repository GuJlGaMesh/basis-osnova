# tl-plan Plan and Task Format

Canonical source of truth for the plan-file structure and task descriptions. `SKILL.md` references this file rather than duplicating its rules.

The plan file is the single artifact: it lists tasks as checkboxes and holds each task's full description inline. Progress is tracked by the checkbox state (`- [ ]` → `- [x]`).

## Contents

- [Task description: 5 sections](#task-description-5-sections) — what every `### Task N:` block carries
- [Plan file template](#plan-file-template) — the shape of the whole plan file
- [Header rows and the context section](#header-rows-and-the-context-section) — what the header may carry, how long `## Контекст` may be
- [Sizing](#sizing) — one task = one small atomic PR
- [Documentation tasks](#documentation-tasks) — in-task by default
- [What not to put in a task description](#what-not-to-put-in-a-task-description) — the noise to drop
- [Conformance checklist](#conformance-checklist) — run before writing the plan

---

## Task description: 5 sections

Every `### Task N:` block has these sections, in this order. The Russian section labels are user-facing literals — keep them in Russian.

1. **Контекст** — why the task exists; what's missing or broken.
2. **Что сделать** — concrete actions (bullets, imperative mood).
3. **Файлы** — paths with a marker (создать | изменить | удалить).
4. **Acceptance criteria** — verifiable bullets.
5. **Тесты** — concrete scenarios or verification method (mandatory, see below).

Optional sections: **Зависит от** (other task IDs in this plan), **Риски/нюансы**.

**Requirement traceability.** When the plan carries a `Spec:` header row, a task driven by a requirement names it in «Контекст» by its stable id — `Реализует REQ-01, REQ-04.` The ids are the spec's and are copied verbatim, never renumbered here. This is what lets `/tl-implement`'s completion gate check *requirements* against the code instead of only tasks against the code, in both directions — a task names its ids, and no requirement is left unclaimed. A task with no requirement behind it (refactor, plumbing, tooling) carries no id, and that absence is itself informative.

**Claims about existing code are proven, not assumed.** Whenever a task rests on how existing code already behaves — «X возвращает Y без Z», «этот метод не вызывает Q», «хелпер теряет поле при подмене коллекции» — open the method body and read it before writing the task; a signature, a name and a call site are not evidence. Record the outcome in «Контекст» as one line: `Проверено: <вывод> — <path>#<symbol>`. No line numbers — they rot on the next refactor. A claim you could not prove is false: drop the task, or the part of it that rested on the claim. Skip this only when every file the task touches is created from scratch, because then there is no existing behavior to assume anything about.

**The «Тесты» section is mandatory and self-contained.** Never `«написать тесты»` / `«проверить»`; never a bare forward-reference («См. Task N», «В Task N», «Same as Task N») without scenarios. It either lists concrete scenarios for this task, or names a concrete verification method for this task (build green, migration apply on dev, dry-run command, `grep`-check, downstream task that exercises the wiring).

**Tests live in the task that introduces the behavior worth testing.** Test-only tasks and test-only phases (e.g. a separate `### Этап N: Tests` after the implementation phases, in any test flavor — unit, component, integration, e2e, smoke, contract) are forbidden: they hollow out earlier tasks' «Тесты» sections into forward-references. When a behavior only becomes reachable after several tasks combine (e.g. an `internal` ctor reachable only via a sibling task's factory method), the scenarios go into the **latest** task that opens the surface, and that task's «Тесты» enumerates everything testable through it.

**Add tests where they verify real behavior, not ritually.** A purely declarative task (an enum, an ORM/EF configuration, a DI binding, a migration scaffold) needs no invented tests of any flavor — the build plus a downstream task that exercises the wiring covers it, and the «Тесты» section names that verification path and moves on. A task introducing branches, validation or state changes does list concrete scenarios.

Pick the form by change type: behavior → unit/integration/component tests with file path and scenarios; pure declaration → build green / migration apply / a named downstream task; refactor → regression on the named existing suite; markdown/config/docs → concrete checks (`grep <term>`, dry run, `npm test`); deletion → build + tests green plus `grep` confirming no references remain.

**Then take the strongest form that actually applies.** «Тесты» is what the execution loop runs as this task's gate, so it has to end in a binary PASS/FAIL. Strongest to weakest:

1. **Deterministic command** — build, a named test (`<runner> -t "<name>"`), a migration apply, a dry run, a `grep`-check. Read the exit code.
2. **Unit test** over pure logic — converters, value objects, pure functions.
3. **Integration test** for anything crossing a process, a database, a queue or the network.
4. **Independent review** — only for a criterion that is a judgment by nature (API readability, whether a mapping is correct). `/tl-implement` sends it to a reviewer that did not write the code, never to the author.
5. **Manual check** — only for UI visuals, and marked as manual.

A criterion sent to review when a command could decide it is a defect of the plan, not of the code.

## Plan file template

```markdown
# План реализации: <Название фичи>

Branch: <текущая ветка или "none">
Created: <YYYY-MM-DD>
[Refined: <YYYY-MM-DD> (<чем был этот проход>)]  # optional, written by --refine
[Spec: <path-to-spec.md>]                  # optional, only when --spec was used
[Tech design: <path-to-tech-design.md>]    # optional, only when --tech-design was used
[Chosen variant: variant-N]                # optional, only when --tech-design was used

## Контекст

<Мотивация: проблема, что хотим, ограничения, решения, open questions — связный текст,
не inline-ключи. Для маленьких планов 1–3 строки достаточно, потолок — 400 слов.>

### Принятые решения

<опционально: решения, принятые за пользователя, и допущения — по пункту на решение>

## Файлы

- <path/to/file> — <короткая ремарка зачем>

## Задачи

- [ ] Task 1: Реализовать endpoint логина пользователя
- [ ] Task 2: <subject>

(для 2+ фаз использовать `### Этап N:` группировки внутри `## Задачи`)

---

### Task 1: Реализовать endpoint логина пользователя

**Контекст.** Нужен публичный API логина для веб-клиента. Существующий `/auth/token`
принимает только client_credentials и не подходит для пользовательского flow.

**Что сделать.**
- Создать `POST /api/auth/login`, принимающий email + password.
- Проверять credentials через `AuthService.verifyPassword`.
- Возвращать JWT при успехе, 401 при неверных credentials.

**Файлы.**
- `src/api/auth/login.ts` (создать)
- `src/api/auth/index.ts` (изменить — подключить роут)

**Acceptance criteria.**
- `POST /api/auth/login` → 200 + JWT для валидных credentials.
- 401 для неверного password или несуществующего email; 400 для запроса без email/password.
- Логируются попытки логина (без password).

**Тесты.**
- Happy: валидные credentials → 200 + JWT.
- Sad: неверный password → 401; несуществующий email → 401; невалидный body → 400.
- Файл: `src/api/auth/login.test.ts`.

**Зависит от:** <task IDs, опционально>

**Риски/нюансы.** <опционально>
```

For small plans (1–2 tasks) phases are not used; sections stay short but are never skipped. The checkbox subject and the `### Task N: <subject>` heading must match exactly — no paraphrasing.

**The plan speaks one language.** Top-level sections are Russian — `## Контекст`, `## Файлы`, `## Задачи`, and `### Этап N:` inside them — exactly like the per-task labels «Контекст / Что сделать / Файлы / Acceptance criteria / Тесты». There is no English variant of a section name in a new plan. Plans written before this rule keep their `## Context` / `## Files to change` / `## Tasks` / `### Phase N:` headings and are **not** retroactively rewritten; `/tl-implement` reads both sets.

## Header rows and the context section

**Header rows.** Directly under `Created:` the plan MAY carry these `Key: value` rows, in this order. They are header lines, never `##` sections:

- `Refined: <YYYY-MM-DD>` — added by refine mode (`/tl-plan --refine`) when it actually applies changes. An optional parenthetical says what that pass was and who decided the open points: `Refined: 2026-08-26 (второй проход, пользователь недоступен — решения приняты автором прохода)`. A later refine **overwrites the row in place**: it records when the plan was last reworked, not a changelog of every pass.
- `Spec: <path>` — only with `--spec`.
- `Tech design: <path>` and `Chosen variant: variant-N` — only with `--tech-design`.

**`## Контекст` is capped at 400 words.** It exists to let a reader judge the task list, not to re-derive the feature: the problem, what changes, the constraints that shaped the split, and the decisions that are not obvious from the tasks. Everything past that ceiling goes where it belongs and is referenced, not copied — requirements into the spec, solution variants and trade-offs into the tech design, both of which the header rows already link. With neither document in play, cut instead of moving: a context that needs more than 400 words is usually a plan whose scope was never narrowed.

**`### Принятые решения` is the only allowed subsection of `## Контекст`.** It carries what the spec's `## Допущения` carries — decisions taken **on the user's behalf** and the assumptions behind them, one bullet each, with the reason: `- **<решение>** — <почему именно так>; влияет на: Task 3, Task 7.` It appears only when there is something to put in it, and its bullets count towards the 400 words. A decision made for the user and buried in prose is the failure this subsection prevents: it must be reviewable by scanning one list. No other `###` heading is allowed inside `## Контекст`.

## Sizing

- **One task = one small atomic PR.** Two independent commits → two tasks.
- **Plan scope ≠ task scope.** Big features → many small tasks grouped under `### Этап N`. Don't squeeze a whole feature into 3–5 bloated tasks.
- **One concept per task.** New entity + migration + middleware = three tasks.
- **Scaffolding separate from logic.** Setup first, feature second.
- **Phases are grouping, not tasks.** `### Этап 1: Setup` / `### Этап 2: Core` / `### Этап 3: Integration` group by layer, domain or stage; tasks inside stay atomic.
- **Prefer many small tasks over a few large ones.** "Tasks too large" is the constant problem; "too many tasks" almost never is.
- **Splitting triggers:** >5 files touched; AC > 5–7 items; mixes refactor + feature; mixes scaffolding + logic; introduces >1 concept. A reviewer should grok the diff in 10–15 minutes. No hard LoC threshold.

## Documentation tasks

- **In-task (default).** A task updates its own share of documentation: touches a public class/method/field → updates its doc comment (JSDoc/TSDoc, C# XML-doc `/// <summary>`, Python docstring, Rust `///`, Go-style) in the same task; changes a CLI flag or env var → updates the corresponding `README.md` line in the same task. These edits appear in that task's «Файлы» / «Acceptance criteria» / «Тесты». No separate doc-task.
- **Cross-task (only when actually needed).** A separate `### Task N:` only when documentation describes the plan/feature **as a whole**: a new `README.md` section, a `CHANGELOG.md` entry, an `AGENTS.md` update for a new agent process, a new `docs/<feature-slug>.md`. Format — the usual five sections.

Documentation is not only `docs/`: `README.md`, `CHANGELOG.md`, `AGENTS.md`, `docs/**/*.md`, an `*.md` next to a module, and doc comments in the source. In a cross-task doc task, «Файлы» names concrete files, «Acceptance criteria» names the sections / doc comments that must appear, and «Тесты» is a link-check or `grep` for the key sections and tags (`@param`, `<param>`, `:param`) — plus the doc lint rule when the project has one.

## What not to put in a task description

- Code already in the repo, or obvious context.
- Declarations of intent.
- Summaries / "what was done" — task descriptions look forward, not backward.

## Conformance checklist

The plan file MUST contain, in this order:

1. `# План реализации: <Название фичи>` — title (this exact prefix).
2. `Branch:` and `Created:` lines.
3. `## Контекст` (motivation / problem / ограничения — 1+ line, ≤400 words).
4. `## Файлы` (touched files with a short note for each).
5. `## Задачи` — subject-only checkboxes (`- [ ] Task N: <subject>`). `### Этап N:` groupings only when 2+ phases.
6. A `### Task N: <subject>` block for **every** task in `## Задачи`, with the full 5-section description plus optional «Зависит от» / «Риски/нюансы».

The plan file MAY contain these header `Key: value` rows below `Created:`, in this order: `Refined: <YYYY-MM-DD>` (refine mode, optional parenthetical note), `Spec: <path>` (only with `--spec`), `Tech design: <path>` and `Chosen variant: variant-N` (only with `--tech-design`). They are not mutually exclusive — a plan created with both flags and later refined carries all four. Format details — «Header rows and the context section» above.

The plan file MAY contain one `### Принятые решения` subsection inside `## Контекст`, listing the decisions taken on the user's behalf and the assumptions behind them, one bullet each with its reason. No other `###` heading is allowed there.

When the `Spec:` row is present, every task that implements a requirement MUST name it in «Контекст» as `REQ-NN` (see «Requirement traceability» above). Without this the spec's stable ids stop at the plan boundary and requirement-level verification is impossible.

The plan file MUST NOT contain:

- English top-level section names — `## Context`, `## Files to change`, `## Tasks`, `### Phase N:`. A new plan uses `## Контекст` / `## Файлы` / `## Задачи` / `### Этап N:` only. (Plans written before this rule keep the English names and are not rewritten.)
- A `## Контекст` longer than 400 words — the surplus goes into the spec or the tech design and is referenced from the header, or is cut.
- Other top-level sections (no `## Commit Strategy`, no ad-hoc sections). The optional `Refined:` / `Spec:` / `Tech design:` / `Chosen variant:` rows are header `Key: value` lines, NOT top-level sections — they don't violate this rule.
- Inline `Goal:` / `Constraints:` / `Decisions:` / `Open questions:` keys — they belong inside `## Контекст` as prose, and decisions taken for the user belong in `### Принятые решения`. (Older plans created with these keys are not retroactively rewritten; new plans MUST NOT use them.)
- Multiple template variants — there is only this one.

**TASK-FORMAT.md is the single source of truth.** When the format evolves, update it here, and SKILL.md will keep pointing to the right place.
