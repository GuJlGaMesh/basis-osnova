# Execution Modes — Shared Layer

Single source of truth for the cross-skill «execution mode / subagent orchestration» layer. A skill declares this file in its `skill.json` (`sharedReferences`) and the CLI copies it into that skill's `references/` on install. Consumers reference this file instead of re-stating the rules below; skill-private details (which fields a skill's subagent returns, where its progress lives) stay in the consuming skill.

The file is self-contained: an orchestrator (or a subagent) handed only this file plus its skill's instructions can drive the two axes and the response contract correctly.

Instructions to the agent are written in English; user-facing literals (mode/autonomy labels, contract strings the agent emits to the user) are Russian with «ты»-form, per the localization rules in the root `AGENTS.md`.

## Two independent axes

The word «mode» conflates two unrelated decisions. Keep them apart — both keys are part of every consuming skill's marker, and all combinations are meaningful. Never write «this autonomy only with that mode».

### Axis A — `mode` (context isolation: where the work runs)

| Value | Meaning |
|---|---|
| `inline` | One agent holds the whole plan and history in a single context. Default; legacy behavior. |
| `subagent-per-task` | Each unit of work runs in a fresh subagent with its own context; the orchestrator keeps only the plan and the reports. |
| `subagent-per-phase` | Same isolation, but the unit is a whole phase. |

The `-per-<unit>` suffix names the **consuming skill's unit of work**, not a fixed enum: `tl-implement` works in tasks/phases (`subagent-per-task` / `subagent-per-phase`), while a chain orchestrator whose unit is a step uses `subagent-per-step`. The constant part is `inline` vs `subagent-…`; the unit after the dash is the consumer's.

### Axis B — `autonomy` (how often the agent stops to ask)

| Value | Meaning |
|---|---|
| `full` | Runs the whole plan on its own; stops only on a real blocker. |
| `checkpoint` | Same, plus stops at marked checkpoints and waits for «ок». |
| `interactive` | Confirmation at almost every step. Default; legacy behavior. |

**Default combo: `inline` + `interactive`.** This is exactly the legacy behavior of any consuming skill — without an explicit choice, nothing changes. Choosing the default must not alter anything observable.

## Autonomy protocol

### What counts as a checkpoint

A checkpoint is not invented on the fly. It is derived from:

- **plan structure** — phase boundaries (`### Этап N:` headings, written by `tl-plan`; older plans use the legacy `### Phase N:` and are read, never rewritten);
- **a fixed list of irreversible actions** — commit, push, DB migration, or a fork in the road with a non-obvious choice.

### Behavior on a blocker in `full`

In `full` the agent **stops at the first real blocker and waits** for the user. This is a deliberate trade-off: never skip and never build work on wrong assumptions, at the cost of a possible early idle. Soft questions (a reasonable default exists) the agent resolves itself in `full` and records the choice in its report — it stops only on a genuine blocker.

### Autonomy is driven by the orchestrator, not the subagent

The subagent only honestly returns `question` or `blocker`. The decision «do we interrupt the user?» belongs to the orchestrator and depends on the autonomy value:

- `question` → in `full`, the orchestrator decides by a reasonable default and records it; in `checkpoint`, it holds the question until the next checkpoint; in `interactive`, it asks immediately.
- `blocker` → stop and wait, in every autonomy value.

This split keeps the subagent simple (report only) and the autonomy policy in one place (the orchestrator).

## Orchestrator ↔ subagent contract (common skeleton)

This section is the **common** part of the contract, shared by every consumer. The skill-private payload (the fields a particular skill's subagent returns) lives in that skill's own references, not here.

### Common fields

- `status`: `done` | `blocker` | `question` — the control channel for autonomy (see «Autonomy protocol»).
- `summary` — one or two lines in Russian: what was done / what blocks / what to ask.
- `notes` — optional; nuances that surfaced during the work.

Meaning of `status`:

- `status: done` — the unit's acceptance is fully satisfied AND build + tests are green. Anything less is `blocker` or `question`, not `done`.
- `status: blocker` — work started but cannot finish (missing dependency, contradiction, broken environment). Include enough detail for the orchestrator/user to decide: skip, retry, or rethink.
- `status: question` — clarification needed before continuing. Do not partially implement — return the question and wait.

### Identifier echo and verification

A skill that works on identified units (a task id, a step name) makes the subagent **echo that identifier** back as a diagnostic. The identifier is an echo, not authority: the orchestrator applies state to the unit it **spawned the subagent for**, not to whatever the response names. If the echoed identifier does not match the spawned one, the orchestrator treats the response as `status: blocker` regardless of the reported `status`, surfaces the mismatch to the user, and leaves the saved state untouched for manual review.

### Formatting

- Emit exactly one fenced ` ```yaml ` block, as the **last** thing in the reply, so the orchestrator can parse it stably and distinguish it from prose.
- **String fields MUST be double-quoted.** Free-text Russian frequently contains `:`, which breaks naive YAML parsers when the value is unquoted. If a value itself contains a double quote, use a YAML block scalar (`summary: >-` with indented text) instead of escaping.

### Invariant: the subagent never changes saved state

Saved state — plan-file checkboxes, a chain-state file, any on-disk progress — is flipped **only by the orchestrator**, after it parses the response. The subagent reports; it never edits the saved state itself. This is what lets the work survive a restart and continue across sessions.

### Two response forms

1. **Per-unit** — `status` + one echoed identifier (e.g. a single task). 
2. **Batch** — a list of finished units plus a list of blockers (e.g. a whole phase). In the batch form a non-empty blocker list is dispatched by the orchestrator using the same autonomy rules above.

A consuming skill picks the form that fits its unit of work and defines its own skill-private fields on top of this skeleton.

## Agent-agnostic fallback

Subagents are a host-specific optimization, not a requirement. The base path must work on any harness.

- **If the harness supports subagents** (a Task-like API that lets the main agent delegate work to a fresh agent with its own context) → use the subagent path for the chosen `mode`.
- **Otherwise → fall back to `inline`**: do the work in the current context, or, for a one-shot fresh-look pass, ask the user for a new context. Emit a single one-line notice and continue.

Use neutral terms — «host», «harness», «orchestrator», «subagent». Do not hardcode a specific agent or agent-specific paths.
