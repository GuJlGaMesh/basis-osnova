---
name: tl-workflow
description: >-
  Orchestrates a chain of skills (research → spec → plan → implement → code-review → commit), resumable across sessions. Not for: first-time onboarding → tl-kit-onboard. Use when: цепочка скиллов, весь пайплайн, сквозной прогон.
argument-hint: "[--list] [chain description or empty to choose interactively]"
allowed-tools: Read Write Edit Glob Grep Bash AskUserQuestion
disable-model-invocation: false
---

# Workflow — Chain Orchestrator

Run a chain of tl-ai-kit skills as one flow. Steps and axes are chosen once; the chain runs each step, records progress on disk and resumes across sessions.

**The two axes** — defined once in `references/execution-modes.md` (together with the autonomy protocol and the orchestrator ↔ subagent contract); do not restate them here. `autonomy` (`full` / `checkpoint` / `interactive`) is chosen once and delivered to every step — that is what makes a hands-off end-to-end run possible. `mode` is `inline` (the step runs in the current context) or `subagent-per-step` (a fresh subagent per step, falling back to `inline` with a one-line notice when the harness has no subagents) — the chain's unit of work is a step, hence `-per-step`. The axes are independent; every combination is valid.

## Workflow

**Step 0 — parse arguments, find the chain state.** `--list` → print the existing chain-state files (read-only) and stop. Remaining text is an optional chain description. Resolve the branch (`git branch --show-current`, `/` → `-`) and look for `docs/workflows/<branch>.md` (fallback: the most recent `docs/workflows/<YYYY-MM-DD>-*.md`). Found → **resume**: read the marker and checklist and continue from the first unchecked step, without re-asking the setup. Not found → **new chain**: Step 1, then Step 2.

**Step 1 — choose steps and axes (new chain only).** In one interaction (Russian, «ты»-form) ask which steps make up the chain and in what order, then `autonomy` (`interactive` — Recommended) and `mode` (`inline` — Recommended). Use a quick-pick UI where the host has one, otherwise print the options and parse one line back; map answers onto the canonical values. Ask nothing beyond that by default — add a question only when the chosen checklist needs an answer the chain would otherwise have to invent (a branch flag for `tl-plan`, the task number and the push decision for `tl-commit` — see «Per-step delivery»); under `interactive` those may equally wait for the step itself.

| Step | What it contributes | Artifact | Threaded forward as |
|---|---|---|---|
| `tl-research` | «как оно устроено, какие вообще есть варианты» — open investigation | `docs/research/<date>-<slug>.md` | source material in the run context — context, not a flag |
| `tl-spec` | «что именно система должна делать» — requirements with stable `REQ-NN` ids | `docs/specs/<date>-<slug>.md` | `--spec <path>` to `tl-tech-design` and `tl-plan` |
| `tl-tech-design` | «каким решением это делаем» — variants + the chosen one | `docs/tech-designs/<date>-<slug>/tech-design.md` | `--tech-design <path>` to `tl-plan` |
| `tl-plan` | «на какие задачи это разбивается» | `docs/plans/<...>.md` | the plan file `--refine` and `tl-implement` operate on |
| `tl-plan --refine` | optional second pass over that plan before coding | the same plan file | — |
| `tl-implement` | executes the plan and closes it with the completeness gate | — (plan-file checkboxes) | — |
| `tl-code-review` | reviews the resulting diff for defects | — (a report) | — |
| `tl-commit` | turns the result into a commit | — (a commit) | — |
| `tl-fix-merge-request` | closes the reviewer-comment loop on an open MR/PR | — (MR/PR replies) | — |

The four upstream steps answer **different** questions and are independently optional — never offer them as one package, never silently substitute one for another, and any subset is a valid chain. Plan completeness is **not** a separate chain step: `tl-implement` will not report the plan finished until its own completion gate is green, so a chain never re-checks the same checkboxes afterwards.

**Step 2 — create the state file (new chain only).** Write `docs/workflows/<branch>.md` per «Chain state file», then continue.

**Step 3 — run steps.** Walk the checklist from the first `- [ ]` step, per «Running one step». The chain is complete when every step is `- [x]`.

## Chain state file

- **Location:** `docs/workflows/<branch>.md` (fallback `docs/workflows/<YYYY-MM-DD>-<slug>.md` when there is no branch).
- **Marker** — one line under the H1, in the shared layer keys. This is the **single** place the chain's axes are stored; delivering `autonomy` to a step (below) is delivery, not a second copy:

  ```
  <!-- tl-workflow: mode=<inline|subagent-per-step> autonomy=<full|checkpoint|interactive> -->
  ```

  Parse per key, order-independent: match the `^<!--\s*tl-workflow:\s+.*-->\s*$` line, then read `mode=` and `autonomy=` independently. Both are required; a value outside its set is a broken marker → re-run Step 1.
- **Step checklist** — flipped only by the orchestrator:

  ```
  - [x] research → docs/research/2026-06-18-oauth.md
  - [x] spec → docs/specs/2026-06-18-oauth.md
  - [x] plan → docs/plans/2026-06-18-oauth.md
  - [x] implement → 8/8 задач, план docs/plans/2026-06-18-oauth.md
  - [ ] code-review
  - [ ] commit
  ```

  A step that produces a document links to it; a step that produces none (`implement`, `code-review`, `commit`, `fix-merge-request`) records a one-line result instead. Everything lives by reference — results are never copied into the state file. A step id is the skill name without the `tl-` prefix (`tl-code-review` → `code-review`, `tl-fix-merge-request` → `fix-merge-request`); ids are stable, so a chain started by an earlier version still resumes.

**Resume across sessions.** The next `/tl-workflow` finds the file by branch and continues from the first `- [ ]` step: the marker carries `mode`/`autonomy`, the recorded links carry the upstream inputs.

## Passing artifacts between steps

Each step's artifact is the next step's input (the «Threaded forward as» column above), and most step-skills pick it up **only when the orchestrator passes it explicitly** — a chain that runs `tl-spec` and then calls `tl-plan` without `--spec` has thrown the spec away.

Pass every artifact the next step accepts — `--spec` (WHAT) and `--tech-design` (HOW) are compatible — and never re-ask what an upstream artifact already answered (`tl-plan --spec` skips its own clarifying-questions block by design). A skipped step is not an error: no `tl-spec` simply means `tl-plan` runs without `--spec`; never fabricate a path to a document no step produced. A recorded artifact missing on disk is a `blocker` — stop and report, do not quietly continue. An unfinished upstream document is a `question`, not a `done`: `tl-spec` ends `clarifying` while blocking questions remain, and that question is dispatched by the chain's `autonomy`, not left to stall as the step's own prompt.

## Running one step

1. **Pick execution by `mode`.** A step marked user-invocation-only (`disable-model-invocation: true`, e.g. `tl-research`) cannot be triggered as a tool — that is **not** a reason to skip it: read its `SKILL.md` and follow it in the current context, exactly as `inline` does.
2. **Pass the upstream artifacts** the step accepts.
3. **Deliver `autonomy` — and whatever else that step would otherwise ask the user.** `tl-implement` is the only plan-based step and takes no autonomy argument: before running it, patch its plan-file marker (`<!-- tl-implement: … autonomy=<chain-autonomy> … -->`). Every other step is plan-less — pass the value in the run context / as an argument; for `tl-research`, `tl-spec` and `tl-tech-design` it does double duty as the «you are in a chain» signal. The per-step details, and the gates a step would otherwise put to the user, are in «Per-step delivery».
4. **Collect the result** through the layer's contract skeleton: `status` (`done` / `blocker` / `question`) plus the step's own payload and the echoed step identifier. `blocker` stops the chain under any autonomy; `question` is dispatched per autonomy.
5. **Mark the checkbox** `- [x]` and record the artifact link or result line — orchestrator-only.

**A step's own «что дальше?» is never forwarded.** `tl-research`, `tl-spec`, `tl-tech-design` and `tl-plan` skip theirs once they see `autonomy` in the run context; only `tl-implement` (Step 5) still asks. Do not forward that question and do not answer it as the user — the checklist already holds the answer. Note it once («шаг предложил выбрать следующий скилл — цепочка решает это сама») and continue with the next unchecked step. A «что дальше?» prompt is **never** a `question` in the contract sense; only one whose answer changes the step's own output is. A step that refuses to hand off at all («сначала выйди из этого режима») is treated the same way. A step that ignores the propagated `autonomy` degrades to interactive behavior for that step — say so once, in neutral terms, instead of assuming it ran hands-off.

## Per-step delivery

`autonomy` alone is not enough. Several steps carry a gate of their own that predates the chain, and a gate nobody answers either stalls the run or gets answered by the agent on the user's behalf. Deliver the row below together with the upstream artifacts.

| Step | Deliver | Its own gate under the chain |
|---|---|---|
| `tl-research`, `tl-spec`, `tl-tech-design` | `autonomy` in the run context — it doubles as the «you are in a chain» signal | Handled by the skill: «Что дальше?» skipped, leftovers written into the artifact |
| `tl-plan` (create) | `autonomy`, `--spec` / `--tech-design`, **an explicit branch flag** | «Что дальше?» skipped by the skill. Branch is never left to the skill's own question — see «Branch and the state file». Preferences and clarifications are question-budgeted by `autonomy` |
| `tl-plan --refine` | `autonomy`, the plan path as `@<path>` | The apply gate: `full` → «Да, все», with the applied changes listed in the step result; `checkpoint` → hold the report until the next checkpoint; `interactive` → ask |
| `tl-implement` | the four marker keys — below | The setup session never runs, because the marker is complete before the step starts |
| `tl-code-review` | nothing beyond the diff source | None — the pass is read-only and asks nothing |
| `tl-commit` | `autonomy`, the task number or an explicit «без задачи», the push decision | Message and split are dispatched by `autonomy`; the task number is never invented and the push is not hands-off — below |
| `tl-fix-merge-request` | `autonomy` — it seeds its own `tl-implement` marker from it | The triage gate is non-interactive as a chain step; the skill handles it |

**`tl-implement`'s marker — write all four keys, never let them default.** Patch `<!-- tl-implement: mode=… autonomy=… tdd=… commit=… -->` under the plan's H1 before the step runs; it parses per key, so replacing individual keys is safe:

- `autonomy` — the chain's value.
- `mode` — `inline`, **not** the chain's `mode`. `subagent-per-step` around `subagent-per-task` nests a subagent inside a subagent, which not every harness supports; choose `subagent-per-phase` only when the host is known to allow the nesting.
- `commit` — `none` when the checklist has a `commit` step, `per-task` when it does not. Leaving it at its default while a `commit` step is queued makes the chain commit twice: once per task inside `tl-implement`, then again at the end.
- `tdd` — `false` unless the user asked otherwise at Step 1.

**A user-specific value is never invented.** `tl-commit`'s task number comes from what the user gave at Step 1 or from an issue id literally present in the branch name; with neither, the step reports `status: question` and the chain answers it by autonomy — «без задачи» in `full` and `checkpoint`, recorded in the result line. A guessed id lands in git history and no later step can take it back.

**Push is not part of a hands-off run.** `commit` is on the layer's fixed list of irreversible actions: in `checkpoint` the commit itself is a checkpoint, and in `full` the chain commits but **skips the push** unless the user opted into pushing at Step 1. An unpushed commit is trivially recoverable, a pushed one is not. Either way the result line records «запушено» or «не запушено».

**Branch and the state file.** The state file is found by branch name, so a step that switches branches mid-chain orphans it — the next `/tl-workflow` looks for `docs/workflows/<new-branch>.md`, finds nothing and starts a second chain over the same work. Pass `--no-branch` to `tl-plan`, or, when the user did want a branch, rename the state file to the new branch immediately after the step and before its checkbox is marked.

## Rules

1. **Orchestrator owns saved state** — only the orchestrator flips step checkboxes and patches step plan-markers; a step never edits the chain state file.
2. **Orchestrator owns transitions** — the chain decides what runs next, and upstream artifacts are threaded forward into every later step that accepts them.
3. **Agent-agnostic** — subagents are an optional optimization; the `inline` path works on any harness. Do not hardcode a specific subagent tool.
4. **Never invent a user-specific value** — a task id, an issue key, a branch name the user has not given. Such a value is a `question` for the chain to dispatch, not a blank the step fills in.
