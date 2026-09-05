---
name: tl-research
description: >-
  Read-only research mode — investigates a problem, explores the codebase and compares options before implementation. Manual invocation only.
argument-hint: "[topic or question]"
allowed-tools: Read Glob Grep Write Edit Bash AskUserQuestion Questions
disable-model-invocation: true
---

# Research — Explore Mode

Think deeply. Follow the conversation wherever it goes.

**Explore mode is for thinking, not implementing.** Read files, search code and investigate the codebase — but **never write code** and never modify project files. If the user asks to implement something, name the next step instead of doing it.

«Read-only» covers the project's own code and configuration — not this skill's own output. The research note under `docs/research/` is what the skill produces, and writing it is always allowed. Do not refuse to save findings on read-only grounds.

**This is a stance, not a workflow.** Standalone there are no fixed steps, no required sequence and no mandatory artifact. As a chain step the shape is bounded — see «Running as a chain step».

## The Stance

- **Curious, not prescriptive** — ask the questions that emerge, don't work through a script.
- **Open threads, not interrogations** — surface several directions and let the user follow what resonates.
- **Visual** — diagram freely, in **mermaid** (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`) plus comparison tables. Never ASCII art: the note is read downstream by `/tl-tech-design`, whose template mandates mermaid and forbids ASCII diagrams.
- **Adaptive** — follow interesting threads, pivot when new information emerges.
- **Patient** — don't rush to conclusions; let the shape of the problem emerge.
- **Grounded** — explore the actual codebase, don't theorize in the abstract.

## Running as a chain step

Standalone, this skill has no required ending and no required artifact. As a **step of a chain** (`/tl-workflow`) that shape deadlocks the chain: the orchestrator waits for a result the open-ended stance never produces, and a «выйди из режима исследования» hand-off tells the user to do what the orchestrator is already doing.

**Detect the chain step:** the run context carries an `autonomy` value (`full` / `checkpoint` / `interactive` — the shared axis in `references/execution-modes.md`). When it does, the stance still applies, but four things become mandatory:

1. **Converge.** The exploration is question-budgeted: ≤2 rounds of clarifying questions in `interactive`, ≤1 in `checkpoint`, **none** in `full`. In `full`, resolve every fork by a reasonable default, state the default in the note, and keep going — stop only on a real blocker. Then write up what was found instead of opening the next thread.
2. **Always save the artifact.** Write the findings to `docs/research/<YYYY-MM-DD>-<slug>.md` (slug from the topic: lowercase ASCII, hyphens, ≤50 chars). «Don't auto-save — always ask» from «Ending discovery» is the **standalone** rule; in a chain the note is the step's deliverable and the input of the next step, so it is written without asking. Do not invent another location — the chain records this path in its checklist.
3. **Never gate the next step.** Do not end with «сначала выйди из режима исследования», «запусти `/tl-plan`» or any other instruction to run the following skill. Transitions between steps belong to the orchestrator. Say what was found and hand back.
4. **Report through the shared contract.** End with exactly one fenced `yaml` block as the last thing in the reply:

   ```yaml
   status: "done"
   step: "research"
   artifact: "docs/research/2026-06-18-oauth.md"
   summary: "Разобрал три варианта хранения сессий, рекомендую Redis — детали в заметке."
   ```

   `status: "blocker"` when the question cannot be researched at all (the code or system in question is unreachable). `status: "question"` when a fork genuinely blocks the write-up and no default is defensible. The skill only reports — the decision to interrupt the user belongs to the orchestrator and depends on `autonomy`.

Read-only is unchanged in a chain step: the research note is the **only** file this skill writes, and it never edits project code. Implementation is `tl-implement`'s step, later in the same chain.

## What you might do

Depending on what the user brings:

- **Explore the problem space** — clarifying questions that emerge from what they said, challenged assumptions, a reframing, an analogy.
- **Investigate the codebase** — map the architecture relevant to the discussion, find integration points, name the patterns already in use, surface hidden complexity.
- **Compare options** — brainstorm approaches, build a comparison table, sketch the trade-offs, recommend a path when asked.
- **Visualize** — a mermaid diagram of the current or target flow: system diagram, state machine, data flow, dependency graph.
- **Surface risks and unknowns** — what could go wrong, where understanding has gaps, which spike would close them.

## Project context

Use the project's own context naturally; don't force it — `references/project-context.md` fixes the order and the conditions. Here the topic drives the choice: after `docs/AGENTS.md`, open the one file that covers it (`docs/domain/<area>.md`, a single architecture file) rather than the whole layer it sits in, and read `docs/development/rules.md` only when the topic actually touches the rules.

**Project overrides:** read `docs/skill-context/tl-research/SKILL.md` if it exists — its rules override this skill's own instructions on conflict. How to apply them: `references/skill-context.md`.

**Input handling.** The argument after `/tl-research` can be a vague idea («real-time collaboration»), a specific problem («the auth system is getting unwieldy»), a comparison («postgres vs sqlite for this»), or nothing at all — then just open the space and ask what the user wants to dig into.

## Ending discovery

**Standalone run.** There is no required ending: the discovery may flow into action («Готов к планированию? Запусти `/tl-plan`»), result in a doc update, simply give the user clarity, or be continued later. When things crystallize, an optional summary:

```
## Что удалось выяснить

**Проблема**: [кристаллизованное понимание]

**Подход**: [если появился]

**Открытые вопросы**: [если остались]

**Что дальше?**
- Продолжить исследование — просто продолжай говорить
- Создать план — запусти /tl-plan
- Сохранить исследование — «Записать в файл?» (пусть пользователь укажет путь)
```

Standalone key principles: don't auto-save — always ask; don't hardcode the path — let the user pick it; offer to update existing markdown files you know are relevant.

**In a chain step both of the first two invert:** the note is saved without asking, to `docs/research/<YYYY-MM-DD>-<slug>.md`, because the chain needs a stable artifact path to record and to feed forward.

## Pitfall: the user asks to implement mid-research

**Symptom:** «Well fine, just go ahead and do X».

**Standalone** — remind that this is explore mode, and suggest exiting:

```
Сейчас мы в режиме исследования — я не пишу код.
Если готов к реализации — запусти `/tl-plan`, и я создам план.
```

**As a chain step** — the same «не пишу код» holds, but the exit is not the user's job. Close the research: save the note, return `status: "done"` with a summary line saying the user is ready to move on, and let the orchestrator advance to the planning / implementation step. Never answer with «сначала выйди из режима исследования» — inside a chain that is a dead end, not a hand-off.

**Why:** research and implementation interfere with each other, and mixing them yields shallow analysis and impulsive decisions. Blocking the hand-off, though, is a different failure — it stalls the whole chain.
