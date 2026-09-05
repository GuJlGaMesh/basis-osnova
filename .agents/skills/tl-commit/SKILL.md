---
name: tl-commit
description: >-
  Writes a Conventional Commits message from the staged changes and commits them. Use when: сделай коммит, сохрани изменения, запушить.
argument-hint: "[scope or context]"
allowed-tools: Read Bash(git *) Glob Grep AskUserQuestion
disable-model-invocation: false
---

# Conventional Commit Generator

Generate commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Workflow

### Step 1: Load Project Context

Lightweight context — needed only to ensure the commit wording matches project terminology and conventions. `references/project-context.md` gives the general order; this run deliberately narrows it to two files: the `docs/AGENTS.md` router, and `docs/development/rules.md` for the Conventional Commits format, language constraints and `BREAKING CHANGE` cases — **ALWAYS follow** those rules when generating the message.

The rest of the baseline — the `README.md` stack section and `docs/architecture/*` — is not needed for a commit message; the diff is enough.

**Project overrides:** read `docs/skill-context/tl-commit/SKILL.md` if it exists — its rules override this skill's own instructions on conflict. How to apply them: `references/skill-context.md`.

### Step 2: Analyze Changes

1. Run `git status` to see staged files
2. Run `git diff --cached` to see staged changes
3. If nothing staged, show warning and suggest staging

### Step 3: Run Context Gates (Read-Only)

- Check `docs/development/rules.md` to catch convention violations — commit format, allowed scopes, mandatory footers.
- Missing optional files are `WARN`, not blockers.
- Never modify context artifacts from this command.

### Step 4: Determine Commit Type

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or dependencies
- `ci`: CI configuration
- `chore`: Maintenance tasks

### Step 5: Identify Scope

- From file paths (e.g., `src/auth/` → `auth`)
- From argument if provided
- Optional - omit if changes span multiple areas

### Step 6: Generate Message

- Keep subject line under 72 characters
- Use imperative mood ("add" not "added")
- Don't capitalize first letter after type
- No period at end of subject
- **All commit messages MUST be in Russian language**

### Step 7: Ask For Task Number (MANDATORY)

Before proposing the commit message, ask the user for the task number via `AskUserQuestion`:

```
AskUserQuestion: Укажи номер задачи для footer (например, TLANALYTICS-1950):

Options:
1. Указать номер задачи
2. Без задачи (пропустить)
```

- **Указать номер задачи** → user enters the task ID (e.g., `TLANALYTICS-1950`) via the "Other" input. Append it as a bare line in the `<footer>` of the commit message — no prefix like `Refs:`, just the ID itself on its own line.
- **Без задачи** → skip the footer entry. Do not add any task reference to the commit.

Accept any non-empty string as a task ID and trim whitespace — do not validate the format strictly. This step is MANDATORY and must run for every commit, including splits.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Examples

**Simple feature (with task):**
```
feat(auth): добавить функционал сброса пароля

TLANALYTICS-1950
```

**Simple feature (без задачи):**
```
feat(auth): добавить функционал сброса пароля
```

**Bug fix with body:**
```
fix(api): обработать null-ответ от платёжного шлюза

API оплаты может возвращать null при таймауте шлюза.
Добавлена проверка на null и логика повторных попыток.

TLANALYTICS-1950
```

**Breaking change:**
```
feat(api)!: изменить формат ответа эндпоинта пользователя

BREAKING CHANGE: эндпоинт пользователя теперь возвращает вложенный объект profile

TLANALYTICS-1950
```

## Behavior

When invoked:

1. Check for staged changes
2. Analyze the diff content
3. Run read-only context gates and summarize findings as `WARN`/`ERROR`
4. Ask the user for the task number via `AskUserQuestion` (MANDATORY — see Workflow Step 7). Remember the provided value (or "skip") for use in the footer
5. Propose a commit message, including the task number as a bare line in the footer if provided
6. Confirm with the user before committing:

   ```
   AskUserQuestion: Предлагаемое commit message:

   <type>(<scope>): <subject>

   Options:
   1. Закоммитить как есть
   2. Изменить сообщение
   3. Отмена
   ```

7. Handle user response:
   - **Закоммитить как есть** → proceed to step 8
   - **Изменить сообщение** → ask the user for the corrected message via `AskUserQuestion`, then return to step 6 with the new message
   - **Отмена** → stop, do NOT commit. End the workflow

8. Execute `git commit` with the confirmed message.

   **Как передавать сообщение в `git commit` (обязательно):**

   - **Однострочное сообщение** (только subject, без body и footer) → `git commit -m "<type>(<scope>): <subject>"`.
   - **Любое сообщение с body или footer** → создать файл с сообщением через file-write операцию агента (например, в `.git/COMMIT_EDITMSG_TMP`), затем `git commit -F .git/COMMIT_EDITMSG_TMP`, затем удалить файл. Этот путь shell-агностичен и полностью убирает проблемы квотинга.
   - **НЕ использовать heredoc** (`<<EOF`, `@'...'@`) для передачи сообщения коммита. Синтаксис heredoc зависит от shell: `@'...'@` работает только в PowerShell, `<<EOF` / `$'...'` — только в Bash. При смешивании инструмента и синтаксиса маркеры heredoc попадают в само сообщение коммита.

8.5. **Верифицировать сообщение коммита (MANDATORY).**

   Сразу после `git commit` выполнить `git log -1 --format=%B` и сравнить вывод с предложенным сообщением. Признаки повреждения:
   - лишние маркеры heredoc (`EOF`, `@'`, `'@`) в теле или footer'е;
   - незакрытые кавычки, обрезанные строки;
   - неэкранированные `$VAR`, развернувшиеся в пустую строку или чужое значение;
   - пропавшие переносы строк между subject / body / footer.

   Если есть расхождение — исправить через `git commit --amend -F <file>` (или `--amend -m ... -m ...`) **до** предложения пуша. Только после успешной верификации переходить к шагу 9.

9. After a successful commit, offer to push:
   - Show branch/ahead status: `git status -sb`
   - If the branch has no upstream, use: `git push -u origin <branch>`
   - Otherwise: `git push`

   ```
   AskUserQuestion: Запушить в remote?

   Options:
   1. Запушить сейчас
   2. Пропустить push
   ```

   - **Запушить сейчас** → execute push command based on upstream status:
     - if branch has no upstream → `git push -u origin <branch>`
     - otherwise → `git push`
   - **Пропустить push** → end the workflow

If argument provided (e.g., `/tl-commit auth`):
- Use it as the scope
- Or as context for the commit message

## Running as a chain step

When the run context carries an `autonomy` value (the shared axis defined in `references/execution-modes.md`), this skill is a step of `/tl-workflow`. Everything above is unchanged except who answers the gates — and one thing that is never answered by guessing:

- **The task number (Step 7) is never invented.** Sources, in order: the value the chain passed; an issue id literally present in the branch name (`feat/TLANALYTICS-1950-oauth` → `TLANALYTICS-1950`). With neither, `interactive` asks as usual, while `checkpoint` and `full` commit **без задачи** and record that in the summary. Do not derive an id from the diff, the plan file or a previous commit — a wrong id in git history outlives the chain.
- **Message confirmation (Behavior 6).** `interactive` → ask. `checkpoint` → the commit is the checkpoint: show the message and wait for «ок». `full` → commit the proposed message and put it in the summary.
- **Split proposal (Important).** `interactive` → ask. `checkpoint` → fold the proposed grouping into the same checkpoint. `full` → follow your own proposal and record the grouping; splitting happens before any commit, so it needs no gate of its own.
- **Push (Behavior 9) is not part of a hands-off run.** `interactive` → ask. `checkpoint` → part of the same checkpoint. `full` → **do not push** unless the chain passed an explicit push decision; report «закоммичено, не запушено». A local commit is trivially undone; a pushed one is not.
- **Step 8.5 verification runs in every autonomy.** A commit message that came out corrupted is a `blocker`, and a blocker stops the chain regardless of autonomy — fix it with `--amend` or hand it back, never report `done` over a damaged message.
- **Return the result** through the layer's contract skeleton: `status` (`done` / `blocker` / `question`) and a Russian `summary` carrying the commit subject and whether it was pushed.

## Important

- Review large diffs carefully before committing
- `/tl-commit` has no implicit strict mode — context gates are warning-first unless user explicitly requests blocking behavior
- Treat `docs/development/rules.md`, `docs/architecture/*`, and `README.md` (Tech Stack section) as read-only context in this command
- If staged changes contain unrelated work (e.g., a feature + a bugfix, or changes to independent modules), suggest splitting into separate commits:
  1. Show which files/hunks belong to which commit
  2. Confirm split plan with the user:

     ```
     AskUserQuestion: Разбить на отдельные commits?

     Options:
     1. Да, разбить как предложено
     2. Нет, закоммитить всё вместе
     3. Дай я скорректирую группировку
     ```

  3. Handle user response:
     - **Да, разбить как предложено** → proceed to step 4
     - **Нет, закоммитить всё вместе** → proceed to step 5 (propose single commit message)
     - **Дай я скорректирую группировку** → ask the user for the adjusted grouping via `AskUserQuestion`, then return to step 2 with the new plan
  4. Unstage all: `git reset HEAD`
  5. Stage and commit each group separately using `git add <files>` + `git commit`
  6. Offer to push only after all commits are done
- NEVER add `Co-Authored-By` or any other trailer attributing authorship to the AI. Commits must not contain AI co-author lines
- **Кросс-shell на Windows.** Если хост — Windows и доступны и Bash, и PowerShell как инструменты, выбрать ОДИН инструмент на весь commit-flow и использовать его синтаксис целиком. Не смешивать: `@'...'@` — только PowerShell, `<<EOF` / `$'...'` — только Bash. Самый безопасный путь, не зависящий от выбора shell — `git commit -F <file>` (см. Step 8)
- **Верификация после коммита обязательна** (см. Step 8.5) — `git log -1 --format=%B` ловит ошибки квотинга и повреждения сообщения ДО того, как мусор уйдёт в remote
