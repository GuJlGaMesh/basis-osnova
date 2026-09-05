# tl-reference Document Template

The canonical shape of a knowledge reference. The file lives at `docs/references/<name>.md` — a flat file, one topic per file, written by URL / file mode and amended in place by `--update`.

A reference answers **what the sources say**: facts, exact signatures and copied examples. It never carries the agent's own opinion, and it never carries the project's own design decisions — those belong in project docs.

## Contents

- [Header](#header) — source attribution and dates
- [Sections](#sections) — core, conditional, and what an empty one means
- [Skeleton](#skeleton) — the shape to write
- [Quality rules](#quality-rules) — what makes the result usable
- [Conformance checklist](#conformance-checklist) — run before writing the file
- [Index entry](#index-entry) — the row added to the references index

---

## Header

Three metadata lines above the first section. `--update` rewrites `Updated:` and the changed sections; `Created:` is set once and never changes.

```markdown
# <Topic> Reference

> Source: <list of source URLs or file paths>
> Created: YYYY-MM-DD
> Updated: YYYY-MM-DD
```

Without `Source:` the reference cannot be refreshed and cannot be trusted — it is the one line that is never optional.

---

## Sections

**Core — always present, in this order:** `## Overview`, `## Core Concepts`, `## Usage Patterns`, `## Best Practices`, `## Common Pitfalls`.

**Conditional — the heading appears only when the sources actually cover it:** `## API / Interface` (the subject has an API surface), `## Configuration` (options and defaults exist), `## Version Notes` (the sources mention breaking changes, migrations or deprecations). Present conditional sections keep their place in the order of the skeleton below.

**A section that is present is never empty and never guessed.** When the sources are silent on a core topic, write one line naming what the sources do not cover instead of filling it from memory. An invented paragraph is worse than a gap: the next reader cannot tell the two apart.

---

## Skeleton

```markdown
# <Topic> Reference

> Source: <list of source URLs or file paths>
> Created: YYYY-MM-DD
> Updated: YYYY-MM-DD

## Overview

<1-3 paragraph summary: what this is, when to use it, key characteristics>

## Core Concepts

<Concept 1>: <clear explanation>
<Concept 2>: <clear explanation>
...

## API / Interface

<Only if applicable. Method signatures, parameters, return types.>
<Preserve exact signatures and types from source docs.>

## Usage Patterns

<Practical code examples organized by use case.>
<Every example must be complete enough to be useful — not just fragments.>

## Configuration

<Options, defaults, valid values. Table format preferred.>

## Best Practices

<Numbered list with reasoning — not just "do X" but "do X because Y">

## Common Pitfalls

<What goes wrong and how to avoid it>

## Version Notes

<Only if relevant. Breaking changes, migration notes, deprecations.>
```

---

## Quality rules

- **No hallucination** — only include information actually found in sources. If a topic wasn't covered, omit the section rather than guessing.
- **Preserve code verbatim** — code examples from docs must be exact, not paraphrased.
- **Actionable over academic** — write "Use X when..." not "X is a feature that..."
- **Dense** — pack maximum useful information per line. This is a reference, not a tutorial.
- **Complete signatures** — for APIs, include ALL parameters, types, and return types.
- **Source attribution** — always include source URLs at the top.

---

## Conformance checklist

Run this against the draft before writing the file, and fix every violation there and then:

- [ ] Header carries `Source:`, `Created:`, `Updated:`; `Created:` unchanged on an update.
- [ ] All five core sections present, in order, none empty.
- [ ] Every conditional section present only because the sources cover it.
- [ ] Every code example copied verbatim from a source — no rewritten or "cleaned up" snippets.
- [ ] Every `## Best Practices` item states its reason ("… because …").
- [ ] Every API signature complete: all parameters, their types, the return type.
- [ ] Nothing stated that no source supports.
- [ ] File under 1000 lines; if larger, split by subtopic into `docs/references/<topic>/` with an index inside.

---

## Index entry

Every reference is registered in `docs/references/INDEX.md`. Create the file if it does not exist, otherwise add or update the one row — never rewrite rows that belong to other references.

```markdown
# References Index

Available knowledge references for AI agents.

| Reference | Topic | Sources | Updated |
|-----------|-------|---------|---------|
| [react-hooks](react-hooks.md) | React Hooks API and patterns | react.dev | 2026-03-20 |
| [docker-compose](docker-compose.md) | Docker Compose configuration | docs.docker.com | 2026-03-20 |
```

`Sources` holds the host or file origin, not the full URL — the full list already lives in the reference header. `Updated` matches the `Updated:` date inside the reference.
