# Per-Task Execution Contract

Self-contained instruction for executing one task from a `tl-implement` plan. Used two ways: read inline by the orchestrator (`SKILL.md` Step 3), or handed to a subagent as its system prompt together with the task excerpt. Plan discovery and marker setup are the orchestrator's job — execution starts with the task already chosen.

## Input

1. **Task excerpt** — the `### Task N: <subject>` block in canonical `tl-plan` format («Контекст», «Что сделать», «Файлы», «Acceptance criteria», «Тесты», optional «Зависит от» / «Риски/нюансы»). Format: `components/skills/tl-plan/references/TASK-FORMAT.md`.
2. **`tdd` flag** — `true` selects the TDD path, `false` the Classic one.

## Load project context first

A subagent does not inherit the orchestrator's context, and skipping these reads silently violates project rules — so load them here too, in this order, skipping what does not exist:

1. `docs/AGENTS.md` — navigation index.
2. `docs/development/rules.md` — hard requirements. Always follow.
3. `docs/architecture/layers.md` — file placement, module boundaries, imports.
4. `docs/skill-context/tl-implement/SKILL.md` — project overrides; on conflict they win over this file too (`references/skill-context.md`).

If the task matches a `docs/change-scenarios/<type>.md` topic, open that file as well.

## Classic path (`tdd=false`)

1. **Read.** Open the files in «Файлы» plus what you need to understand the change surface. Trace the real call path; for a bug, inspect callers and find the shared root before editing. Match existing patterns; do not refactor unrelated code.
2. **Select.** Reuse sufficient project/platform behavior; otherwise make the smallest necessary change without speculative extension points.
3. **Implement.** Do what «Что сделать» asks, satisfying every «Acceptance criteria» bullet. Touch only what is necessary.
4. **Tests.** Implement the «Тесты» scenarios **in the same PR** — unit/integration tests at the specified paths for branching code, `grep`-checks and dry runs for markdown/config, a named regression suite for refactors.
5. **Verify.** Build green, tests green, Acceptance criteria satisfied bullet by bullet.
6. **Simplify.** Only after green, remove speculative code, unused flexibility and avoidable dependencies. Never trade away acceptance criteria, tests, validation, error handling, security, accessibility, compatibility, migration or rollback requirements; rerun affected checks.
7. **Done.** Report to the orchestrator; it flips the checkbox.

## TDD path (`tdd=true`)

Reordering only — the «Тесты» scenarios still ship in the same PR, never as a separate task.

1. **Read and select.** Trace the flow, reuse a sufficient existing option, then make the smallest necessary change.
2. **Write failing tests first** from «Тесты» and the verifiable «Acceptance criteria» bullets, at the paths the task specifies.
3. **Run.** Confirm they are red for the right reason (missing behavior, not import errors). A test that is green before any implementation means the test is wrong or the behavior already exists — stop and clarify.
4. **Implement** until they turn green.
5. **Verify.** Build green, full suite green (not just the new tests), Acceptance criteria satisfied.
6. **Simplify.** Repeat the Classic cleanup and affected checks.
7. **Done.** Report; the orchestrator flips the checkbox.

## Response contract (subagent mode)

The common skeleton — `status` semantics, identifier echo and verification, YAML formatting, «the subagent never changes saved state» — is defined once in `references/execution-modes.md` → «Orchestrator ↔ subagent contract». Only the private payload is here. The saved state this subagent must not touch is the plan-file checkboxes.

```yaml
status: done            # done | blocker | question
task_id: 4              # echo of the id the orchestrator spawned for; on mismatch it treats the reply as a blocker
summary: "одна-две строки на русском: что сделано / что мешает / что спросить"
files_changed:
  - "src/services/search.ts"
notes: "опционально — нюансы, всплывшие в реализации"
```

Report `question` / `blocker` honestly regardless of the session's `autonomy` — never suppress a question because the run is `full`, never invent a blocker to force a pause. The orchestrator decides what to do with the report. In inline mode the block is not emitted at all.

## Phase batch (subagent-per-phase)

Same contract, one subagent for a whole `### Этап N:` excerpt (legacy plans: `### Phase N:`). Load the project context once for the phase, then walk its tasks in order, respecting «Зависит от» **inside** the phase and following the path above for each. Do not skip past a blocker to attempt later tasks — record what actually finished and stop. Cross-phase ordering is the orchestrator's.

Return one batch block instead of the per-task one:

```yaml
phase: 2
completed_task_ids: [4, 5, 6]   # only tasks with green build + tests AND satisfied Acceptance criteria
blockers:
  - task_id: 7
    reason: "короткая строка на русском: что мешает"   # incl. "blocked by task N" for cascade failures
notes: "опционально — кросс-задачные наблюдения"
```

Half-done work is a blocker, not a completion. The orchestrator flips the checkboxes listed in `completed_task_ids` and treats everything absent as still pending.

## Not covered here

Tech Stack updates in `README.md`, `docs/architecture/*` updates, commit prompts, completion summaries and flipping any plan-file checkbox all belong to the orchestrator (`SKILL.md` Steps 3.7 / 3.8 / 5) — they need plan-wide context.
