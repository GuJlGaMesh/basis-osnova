# Project Context — Shared Layer

Single source of truth for the cross-skill «load the project's own context» rule. A skill declares this file in its `skill.json` (`sharedReferences`) and the CLI copies it into that skill's `references/` on install. Consumers point here instead of restating the reading order; what a particular skill *looks for* in that context stays in the consuming skill.

The file is self-contained: an agent handed only this file plus its skill's instructions knows which project files to open, in what order, and when to stop.

Instructions to the agent are written in English; the Russian literals below are section names of project files that are themselves written in Russian, per the localization rules in the root `AGENTS.md`.

## The rule that governs the rest

**Read the minimum context this run needs, not the whole documentation.** Every file below costs context and every one of them is optional. A file that does not exist is skipped silently — a missing context file is never a finding, never a warning and never a failure. Never mass-read `docs/**`, never recurse into it, and stop as soon as the run has what it needs.

Loading context is **read-only**: reading `README.md` or anything under `docs/` for context never authorizes editing it. A skill that owns some of these files says so in its own body.

## Always — the three-file baseline

In this order, each one skipped when absent:

1. **`docs/AGENTS.md`** — the navigation index «task type → which files to read». It is a router, not content: use it to pick the two or three files that actually matter for this run and open those instead of everything under `docs/`. Missing → go straight to 2 and 3.
2. **`README.md`, top section** — the tech stack: language, frameworks, package manager, build and test commands, so nothing downstream is guessed.
3. **`docs/architecture/overview.md`** — the real module map, so any statement about where things live starts from the codebase as it is rather than from a guess.

A consuming skill may narrow this baseline when its run provably does not need a file — a commit message, for example, is judged from the diff. Such a narrowing is stated explicitly in that skill's own body; without one, read all three.

## By task type — only when the run needs it

| Source | Read it when |
|---|---|
| `docs/change-scenarios/<type>.md` | The run plans, classifies or executes a change and one of the playbooks matches its type: new-feature, bugfix, refactor, api-change, config-change, db-migration, dep-upgrade, perf-fix, frontend-change, incident-postmortem. Its sections («Читать сначала», «Шаги», «Чеклист», «Типовые ошибки» — Russian, because that is how those files are written) fold into the run's own output. Directory missing → skip silently. |
| `docs/architecture/layers.md` | The run has to answer *where code goes* or *what may depend on what* — file placement, module boundaries, a layering rule to respect or to check a change against. Pull `docs/architecture/dependencies.md` alongside it when the question is about dependency direction. |
| `docs/development/rules.md` | The run produces or judges something the rules constrain — code, a commit message, a review verdict. These are hard requirements: they override generic patterns and the skill's own defaults. |
| One topic file under `docs/<subdir>/` | The run is about a single area — `docs/domain/<area>.md`, one architecture file, one development file. Open that file, not the whole layer it sits in. |

Anything outside this table is read only when the run has a concrete reason for it — name the reason before opening the file.

## What this layer does not cover

- **Project-level overrides.** `docs/skill-context/<skill>/SKILL.md` is a separate layer with its own precedence rules; it is not part of the reading order above, and each consuming skill points at it on its own.
- **What to look for.** This file fixes the order, the conditions and the stopping rule. The questions a skill asks of that context — which patterns to search for, which module names to use, which criteria to check a result against — belong to that skill.
