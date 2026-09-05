# Doc Co-Authoring — Stage Procedures

Load this file once the user has accepted the workflow (`SKILL.md` → Route). It carries the step-by-step procedure for the three stages. The quality gates, the editing rules and the guidance style stay in `SKILL.md` — this file names a gate at the moment it fires instead of restating it.

## Contents

- [Stage 1 — Context gathering](#stage-1--context-gathering)
- [Stage 2 — Refinement and structure](#stage-2--refinement-and-structure)
- [Stage 3 — Reader testing](#stage-3--reader-testing)

---

## Stage 1 — Context gathering

**Goal:** close the gap between what the user knows and what the agent knows, so the guidance in Stage 2 can be smart instead of generic.

### Meta questions

Ask these five before anything else, and say up front that shorthand answers are fine:

1. What type of document is this — technical spec, decision doc, proposal, PRD, RFC?
2. Who is the primary audience?
3. What should happen when someone reads it?
4. Is there a template or a required format?
5. Any other constraint worth knowing — deadline, reviewer, prior version?

**If the user names a template or a doc type** — ask whether they have a template document. If they give a link, fetch it if the agent has a tool for that source; if they give a path, read the file; otherwise ask them to paste it.

**If the user is editing an existing document** — read its current state first, and check for images without alt-text (see `SKILL.md` → Access to sources).

### The info dump

Once the meta questions are answered, ask the user to dump everything they have, unorganized. Prompt for:

- background on the project or the problem;
- related discussions, threads or shared documents;
- why the alternatives are not being used;
- organizational context — team dynamics, past incidents, politics;
- timeline pressure and constraints;
- technical architecture and dependencies;
- stakeholder concerns.

Offer the ways they can supply it: stream-of-consciousness in the chat, a pointer to a channel or thread, a link to a document, a file path. Tell them clarifying questions come after the dump, so they should not stop to organize.

While they dump: track what has been learned and what is still unclear. Do not let an unfamiliar entity slide by — ask about it, and ask before searching connected tools for it.

### Clarifying questions

When the user signals the dump is done — or once substantial context has arrived — ask **5–10 numbered questions** aimed at the gaps.

Tell them the answers can be shorthand (`1: да`, `2: смотри тред в #канале`, `3: нет, ломает обратную совместимость`), a link, a pointer to a channel, or just more dumping — whatever is fastest for them.

### Exit condition

Stage 1 is done when the questions the agent asks are about edge cases and trade-offs rather than about basics. Ask whether there is more context to add or whether it is time to draft; if they add more, absorb it and re-check the same condition.

---

## Stage 2 — Refinement and structure

**Goal:** build the document section by section, curating before drafting.

### Agree the structure

Tell the user the doc will be built section by section, and what each round looks like: clarifying questions → brainstormed options → their curation → a draft → surgical edits.

- **If the structure is clear** — ask which section to start with, and recommend the one with the most unknowns: usually the core proposal in a decision doc, the technical approach in a spec. Summary and overview sections go last, once there is something to summarize.
- **If the user does not know what sections they need** — propose 3–5 sections that fit the doc type and the template, and ask whether that works or needs adjusting.

Once the structure is agreed, create the document file and scaffold it: every section header, each with a `[To be written]` placeholder. Confirm the file name, then start filling sections in.

### The per-section loop

Run these six steps for each section, in order.

**Step 1 — clarifying questions.** Announce which section is starting. Ask 5–10 questions specific to that section and the context gathered in Stage 1. Shorthand answers are fine.

**Step 2 — brainstorm.** Produce 5–20 numbered options for what the section could contain, scaled to the section's complexity. Deliberately look for context the user shared earlier and may have forgotten, and for angles nobody has raised yet. Offer to generate more.

**Step 3 — curation.** Ask which options to keep, drop or merge, and ask for a one-line reason each — the reasons are what teach the agent their priorities for the next sections. Show the shorthand: «оставь 1,4,7,9», «убери 3 — дублирует 1», «убери 6 — аудитория это знает», «объедини 11 и 12». If they answer freeform instead («в целом норм, но…»), extract the same decisions from it and move on.

**Step 4 — gap check.** Given what they kept, ask whether anything important is missing from this section.

**Step 5 — draft.** Replace that section's placeholder with the drafted content, in place. Do not touch other sections and do not reprint the document. Then ask them to read it and say what to change, noting that specifics teach the agent for the sections still to come.

**Step 6 — iterate.** Apply their feedback as surgical replacements of the affected text. Keep iterating until they are satisfied — and apply `SKILL.md` → **Gate 1** as soon as three consecutive rounds bring no substantial change.

Confirm the section is complete, then ask whether to move to the next one. Repeat for every section.

### Near completion

At 80%+ of sections drafted, run `SKILL.md` → **Gate 2** — the full re-read for flow, redundancy, slop and sentences that carry no weight — and report what it found.

When every section is drafted and refined, review the whole document once more for coherence and completeness, give the final suggestions, and ask whether to move on to reader testing or refine something else first.

---

## Stage 3 — Reader testing

**Goal:** find the blind spots — the things that are obvious to the authors and confusing to everyone else — before real readers hit them.

Explain to the user what is about to happen and why: the document is going to be read by an agent that has none of this conversation's context, exactly like a reader who was not in the room.

### Step 1 — predict the questions

Generate **5–10 questions a reader would realistically ask** of this document — what they would actually want out of it, not what the document happens to answer. This is `SKILL.md` → Gate 3.

### Step 2 — run the reader agent

Subagents are a host capability, not a requirement, so there are two paths:

- **If the harness supports subagents** (an API that lets the agent delegate to a fresh agent with its own context) — for each predicted question, invoke a **reader agent** with only the document content and that one question. Nothing from this conversation goes into the prompt: the isolation is the whole point of the test.
- **Otherwise** — fall back to the user: emit a one-line notice, then ask them to open a new session with a clean context, paste the document there, and put the predicted questions to it. Give them the questions in a copyable block.

For every question, the reader agent reports three things: the answer, anything that was ambiguous or unclear, and what knowledge the document assumes the reader already has.

### Step 3 — the standing checks

Beyond the predicted questions, put these three to the reader agent as well:

- what in this document might be ambiguous or unclear to a reader?
- what knowledge or context does it assume the reader already has?
- are there internal contradictions or inconsistencies?

### Step 4 — report and fix

Summarize what the reader agent got right and what it got wrong, question by question. Turn each miss into a concrete gap, name the section responsible, and loop back into the Stage 2 per-section loop for those sections only.

### Exit condition

Reader testing passes when the reader agent answers the predicted questions correctly and the standing checks surface no new gaps or ambiguities. Then go to `SKILL.md` → Finishing.
