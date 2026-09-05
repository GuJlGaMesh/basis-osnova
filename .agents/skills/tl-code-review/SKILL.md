---
name: tl-code-review
description: >-
  Reviews a diff — staged changes, a branch, or a pull/merge request — for bugs and project-rule violations. Not for: a dedicated security/OWASP audit → tl-security-review. Use when: проверь код, сделай ревью, посмотри изменения.
argument-hint: "[<PR ref>] [--branch] [--no-checks]"
allowed-tools: Read Glob Grep Bash AskUserQuestion
disable-model-invocation: false
---

# Code Review

Canonical diff review for the kit: one pass over a change, looking for defects that break something.

The skill is **read-only** — it never edits code, a plan file, or `docs/*`. Findings are handed off, not fixed here.

Every other skill that needs a diff reviewed delegates to this file instead of restating its rules. When a caller has a plan to check as well, that check belongs to `/tl-implement`'s completion gate, not here — this skill judges the diff.

## Execution mode

Review is one «fresh look» pass. If the harness supports subagents, run it in a single subagent with a clean context and take its report back; otherwise run inline in the current context. Both axes (`mode`, `autonomy`) and the response contract: `references/execution-modes.md`. Autonomy is nearly a no-op here — the pass is read-only and asks nothing. Nothing is persisted.

## Step 1: Load context

### 1.1 Diff source

Resolve the repository's default branch first — do **not** assume it is literally `main`:

```bash
git symbolic-ref --quiet --short refs/remotes/origin/HEAD   # → e.g. "origin/master"
git remote show origin                                      # fallback → line "HEAD branch: <name>"
```

| Input | Diff to review |
|---|---|
| no argument | `git diff --cached`; if nothing is staged, `git diff`; if the working tree is clean, `git diff --name-only <default-branch>...HEAD` — three-dot form diffs against the merge base, so commits that landed on the default branch meanwhile do not leak in |
| `--branch` | force the branch form above even when there is uncommitted work |
| PR/MR number or URL | if the harness exposes a repo-hosting MCP, fetch the diff through it; otherwise fall back to the platform CLI (`glab mr diff <id>`, `gh pr diff <id>`); otherwise `git fetch origin <branch>` and diff it against the default branch locally. If none of these is available, ask the user for the branch name |

Never derive a commit range from a task count — tasks are not commits.

Store the result as `CHANGED_FILES` + the diff hunks.

### 1.2 Project context

Load what `references/project-context.md` lists before reading a single hunk. Two of its conditional sources always apply to a review: `docs/development/rules.md` — the explicit project rules a finding can cite — and `docs/architecture/layers.md` (+ `dependencies.md`) for boundary and dependency rules.

**Project overrides:** read `docs/skill-context/tl-code-review/SKILL.md` if it exists — on conflict the project rule wins over this skill's own instructions. How to apply: `references/skill-context.md`.

Read-only for context artifacts: do not modify `docs/*` during a review. A missing optional context file is skipped silently — it is not a finding.

## Step 2: Diff review

Read the **hunks**, not whole files; open surrounding code only when a hunk cannot be judged on its own.

Report a finding only when you can name a concrete failure mode at a concrete `file:line`. Priority order:

1. **Breaks at runtime** — wrong logic, unhandled error path, null/undefined, a broken contract with an existing caller.
2. **Reachable from untrusted input** — injection, missing authn/authz or validation, a leaked secret or PII.
3. **Violates an explicit rule** in `docs/development/rules.md` or a boundary in `docs/architecture/layers.md` (only if those files exist).

No style findings, no naming preferences, no «consider extracting this». If the diff is clean, write «Замечаний нет» and stop — do not pad the report.

Context beats checklists: which of the above even applies depends on what the code does and what reaches it. A pattern that is a vulnerability in a public HTTP handler is noise in a build script.

**Leftover artifacts.** Scan only the lines the diff **adds** (`git diff <base>...HEAD -U0`, `+` lines) for `TODO|FIXME|HACK|PLACEHOLDER` and for debug leftovers (`console.log`/`print`/`dd(` used for debugging). Report a marker only when it refers to work that should already be finished; a marker on a line the diff did not add belongs to someone else's change and is not a finding here.

## Step 3: Build, tests, lint

Skipped entirely with `--no-checks`, and when the diff came from a PR/MR that is not checked out locally.

Take each command from the project's own docs, in this order: `AGENTS.md` (quality-gate section) → `README.md` (Tech Stack / scripts) → `docs/development/rules.md`. Only if none documents one, infer it from the manifest actually present (`package.json`, `*.csproj`, `pyproject.toml`, `go.mod`, `Makefile`, …). Never assume a package manager.

- **Build** fails → report the errors with `file:line`.
- **Tests** fail → report which ones, and whether they relate to the change under review. No tests, or testing explicitly out of scope → note it, do not fail.
- **Lint** — only the changed files, and only if a linter is actually configured.

## Step 4: Report

Read `references/report-format.md` before printing the report: it fixes the kit-wide status marks (`✅ / ⚠️ / ❌`), the rule on empty sections and the rule on unverified claims.

```
## Ревью изменений

### Проверки
- Build: ✅ | Tests: ✅ 42/42 | Lint: ⚠️ 2 предупреждения в src/api/auth/reset.ts

### Замечания
1. ❌ `src/api/auth/reset.ts:45` — токен не проверяется на срок действия: просроченная ссылка сбрасывает пароль
2. ⚠️ `src/services/mailer.ts:12` — ошибка fetch не обрабатывается, при недоступности SMTP запрос падает с 500

Итог: ❌ есть блокеры
```

Rules for the report:

- **Every finding carries a concrete `file:line`** and the failure mode it causes — the same pair Step 2 demanded. A finding with no location is not printed.
- **The mark is the priority from Step 2**: `❌` when the finding breaks something — a runtime failure (1), something reachable from untrusted input (2), or a violated hard rule (3); `⚠️` when it does not block. Every `❌` comes before any `⚠️`.
- A section with no content is omitted entirely. Never write an «всё в порядке» section listing checks you did not run: asserting an unverified negative is fabrication.
- `Итог`: `❌` if any finding breaks something; `⚠️` if only non-blocking findings remain; `✅` if there are none.
- Hand off, do not fix: findings are `file:line` items the caller acts on.

Next step after the report: `/tl-commit`, or `/tl-security-review` for a dedicated OWASP pass — chaining steps is `/tl-workflow`'s job, not this skill's.

## Pitfalls

- **Over-review.** Only `CHANGED_FILES` — never sweep the whole project.
- **TODO ≠ defect.** `// TODO: optimize later` is a note; `// TODO: implement this` on a code path the change presents as finished is a finding.
- **Pre-existing code is not this diff.** A defect on a line the diff did not touch is out of scope; mention it at most in one line, never as a finding.
