---
name: tl-doc-coauthoring
description: >-
  Co-authors a proposal, RFC, design doc or PRD with the user in three stages: context, refinement, reader testing. Not for: auto-generating project docs like README → tl-docs; gathering requirements → tl-spec. Use when: помоги написать документ, набросай предложение.
---

# Doc Co-Authoring Workflow

Guide the user through writing one document — a proposal, RFC, design doc, decision doc or PRD — in three stages: context gathering, refinement, reader testing. Act as an active guide, not a ghostwriter: the user owns the document, the agent runs the process.

## Route

1. **Offer the workflow.** Name the three stages in one line each and say what it buys — the doc has to work for readers who were not in this conversation. Ask whether to run the workflow or write freeform.
2. **If the user declines** — write freeform and stop using this skill.
3. **If the user accepts** — read `references/STAGES.md` before starting Stage 1 and follow it stage by stage. It carries the questions to ask, the per-section loop and the reader-testing procedure.
4. **At every stage boundary** — apply the quality gates below. They are the part of this workflow the user cannot get from a plain «напиши мне документ».

| Stage | Goal | Done when |
|---|---|---|
| 1. Context gathering | Close the gap between what the user knows and what the agent knows | The agent can ask about edge cases and trade-offs without needing basics explained |
| 2. Refinement & structure | Build the doc section by section: questions → brainstorm → curation → draft → surgical edits | Every section is drafted and the completeness pass is clean |
| 3. Reader testing | Check the doc against a reader carrying no context from this conversation | The predicted questions are answered correctly and no new gaps surface |

## Quality gates

Three checks that make this workflow worth its cost. Never skip them and never collapse them into one «выглядит хорошо».

### Gate 1 — the removal question

After **three consecutive iterations on a section with no substantial change**, stop editing and ask what can be **removed** without losing important information. Iteration that only adds is the signal the section is already done and the conversation is padding it.

### Gate 2 — the completeness pass

At 80%+ of sections drafted, announce it, then re-read the **entire** document — not the diff — and report on:

- flow and consistency across sections;
- redundancy or contradictions;
- anything that feels like slop or generic filler;
- whether every sentence carries weight.

### Gate 3 — reader testing

Before calling the doc done, predict **5–10 questions a reader would realistically ask** of it, then have them answered by an agent that holds **no context from this conversation**. The procedure and its fallback are in `references/STAGES.md` → Stage 3; read it when Stage 2 is finished. A doc its authors find obvious is exactly the doc that fails here.

## Editing rules

- **Create the document file** with whatever file-writing tool the harness provides. Name it for the doc type (`decision-doc.md`, `technical-spec.md`) unless the user names it. Scaffold it with every section header plus a `[To be written]` placeholder before drafting anything.
- **Edit in place, surgically.** Replace the text of one section at a time; never reprint the whole document into the chat.
- **Brainstorm in the conversation, not in the file.** Option lists are throwaway — only curated content lands in the document.
- **If the user edits the file directly** — read what changed, keep their wording, and carry that style into later sections.
- **Ask for change requests, not edits.** When drafting the first section, tell the user to say what to change («убери буллет про X — он уже покрыт Y», «сократи третий абзац») instead of rewriting it themselves: that is how the agent learns their style.

## Access to sources

- If the context lives in a chat channel, a wiki page or a shared document and the agent **has** a tool or MCP for that source — say what will be read, then read it.
- If the agent **has no access** to that source — say so plainly and ask the user to paste the relevant content into the chat. Do not send the user off to configure the host.
- If the document carries images without alt-text — explain that a reader working through an agent will not see them, and ask the user to paste each image so alt-text can be written.
- Before searching connected tools for an unfamiliar entity or project — ask and wait for confirmation.

## Guidance style

- Be direct and procedural. Explain a rationale only when it changes what the user should do.
- Do not sell the workflow — run it.
- If the user wants to skip a stage — ask once whether they would rather write freeform, then honour the answer.
- If the user is frustrated by the pace — acknowledge it and offer a shorter path: fewer brainstorm options, bigger chunks per round.
- If something mentioned in passing is unclear — ask right away. Gaps compound.

## Finishing

When reader testing passes:

1. Tell the user to do a final read-through themselves — they own the document and are responsible for its quality.
2. Suggest double-checking facts, links and technical details.
3. Ask whether it achieves the impact they wanted.

Then offer the closing tips: link the working conversation in an appendix so readers can see how the doc was developed, use appendices for depth instead of bloating the body, and update the doc as real readers give feedback.
