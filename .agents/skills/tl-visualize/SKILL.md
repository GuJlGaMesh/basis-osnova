---
name: tl-visualize
description: >-
  Turns a text artifact or a data question into one self-contained HTML page — charts, graphs, timelines. Not for: designing a product UI → tl-frontend-design; rewriting the document itself → tl-docs. Use when: визуализируй, нарисуй схему, построй график.
argument-hint: "[<файл> | <вопрос>] [--out <path>] [--gallery]"
allowed-tools: Read Write Edit Glob Grep Bash AskUserQuestion
disable-model-invocation: false
---

# Visualize — a text artifact you can read at a glance

## The goal

A plan with 24 tasks, a spec with 30 requirements, a design review with 4 variants, a JSON dump of
query results — the information is all there, and none of it is visible. Reading it back linearly is
how people miss the one task everything else waits on and the one requirement that conflicts with the
code.

This skill closes that gap. It produces **one self-contained HTML page** that makes the shape of the
data visible: what depends on what, what is done, where the conflicts are, how the numbers compare.

Done means: the page opens offline by double-click, a reader who never saw the source knows what the
document is about and can see its structure, and every number on it comes from the source. Not done:
a pretty page that re-renders the document as prose, or one that shows a chart of data nobody asked
about.

**Not this skill's job.** Designing a product interface (`tl-frontend-design`), writing or restructuring
the source document (`tl-docs`), replacing a mermaid diagram that belongs inside a markdown artifact —
`tl-tech-design` and `tl-research` draw their own diagrams inline, and an HTML page next to them is a
derived view, never the source of truth.

## The toolbox

Everything lives next to this file. Paths are relative to `SKILL.md`.

| Tool | What it is |
|---|---|
| `scripts/render.mjs` | CLI. JSON description of blocks → one `.html`. Zero dependencies, no network. |
| `scripts/lib/blocks.mjs` | The block renderers (inline SVG + CSS). Read it when a block does something unexpected. |
| `scripts/lib/shell.mjs` | The page shell: dark-theme design tokens, print styles. |
| `references/BLOCKS.md` | Data shape of every block, tone semantics, what each block is bad at, and how to build what the set does not cover. |
| `references/RECIPES.md` | Per-artifact starting points: plan, spec, tech-design, ADR, research, workflow, raw data, a whole directory, two documents at once, a document in an unfamiliar format, free prompt. |
| the gallery | A live example of every block plus the JSON behind it — generated on demand, see below. |

Blocks available: `kpi`, `progress`, `table`, `matrix`, `graph`, `timeline`, `bar`, `line`, `donut`,
`scatter`, `board`, `cards`, `tree`, `steps`, `code`, `callout`, `prose`, `section`, `row`, `svg`,
`raw`.

Modifiers that turn out to matter more than the block list: `collapsible` on any block, `detail` on a
table row (click to open the whole record), `segments` on a `bar` (stacked), `heat` on a `matrix`
(density), `spark` on a `kpi` tile, `target` on a `progress` item.

## How to drive them

```bash
node <skill-dir>/scripts/render.mjs spec.json -o .tl-ai-kit/visualizations/<slug>.html
node <skill-dir>/scripts/render.mjs --stdin -o <path>.html    # spec from stdin
node <skill-dir>/scripts/render.mjs --list                    # block types + when each fits
node <skill-dir>/scripts/render.mjs --gallery -o .tl-ai-kit/visualizations/gallery.html
```

The spec is a plain JSON file: page envelope (`title`, `subtitle`, `intro`, `source`) plus a `blocks`
array. `intro` is required — see the rule below; `render.mjs` warns on stderr when it is missing.
Write it with `Write`, render it, keep it next to the page — regenerating after a correction is then
an edit plus one command, not a rewrite.

**Output** goes to `.tl-ai-kit/visualizations/<slug>.html` — a visualization is a disposable derived
view, not a repository artifact. The renderer adds `visualizations/` to `.tl-ai-kit/.gitignore` itself.
Write elsewhere only when the user asks for it.

**Opening.** The page is a local file, so hand over the path and offer to open it —
`start <path>` (Windows), `open <path>` (macOS), `xdg-open <path>` (Linux). Ask before running it;
launching a browser is the user's call, not a side effect of rendering.

**The gallery is a tool, not a deliverable.** Render it when unsure what a block looks like or what
it can carry, then read `references/BLOCKS.md` for the exact shape. Do not ship it to the user as the
answer to their request.

## When the request is not in the set

«Нарисуй вот такое» is a normal request, not an edge case. The block set is a floor, not a ceiling:
the only thing that never bends is Constraint 1 below — no CDN, no network. Everything else is
buildable, and the escalation ladder (detailed in `references/BLOCKS.md`) is:

1. **A block option.** Most «такого блока нет» is `collapsible`, `detail`, `segments`, `heat`,
   `width`, or a column `type` away. Check this first — a `raw` block reinvented to typeset a code
   sample leaves the page unescaped for no reason.
2. **`svg`.** A picture the set has no notion of — a request path, a state machine, a layout of
   something physical. Framed, scrollable and themed already; you draw only the picture, using the
   page's own tokens (`var(--accent)`, `var(--bad)`) and classes (`node-box`, `edge`, `edge-label`).
3. **`raw`.** Custom markup rather than a picture, with the `u-*` utilities and `card` / `pill`
   so it does not look pasted in.
4. **`css` / `js` on the page envelope.** Own styling, own behaviour. Same rule as `raw`: your code,
   nothing untrusted in it, self-contained.

Two limits hold across all four. Nothing loads from the network. And **interactivity may reveal a
fact, never hold it** — anything that exists only after a click is missing on paper and missing for a
reader whose JS is off.

Say on the page when a picture is your own construction rather than a standard view, so a reader does
not take a hand-drawn schema for something the source document actually states.

## The judgement the tools don't have

The renderer draws whatever it is given. Choosing *what* to draw is the whole job:

- **Form follows data, not preference.** Dependencies are a `graph`, two crossed dimensions are a
  `matrix`, magnitudes across categories are a `bar`, change over time is a `line`. Picking the
  impressive block over the fitting one is the most common way these pages fail.
  `references/BLOCKS.md` says what each block is bad at.
- **Say what it is before you show it.** Every page opens with `intro` — one to three sentences on
  what the source document is about and why this page was made. The page gets forwarded, opened a
  month later, read by someone who never saw the plan; a title and a file path do not tell them what
  is being built or why anyone assembled this view. Take the «what» from the source (the plan's goal,
  the spec's `## Scope`, the design's `## Проблема`), and the «why» from the request that produced the
  page. Both are stated, neither is invented — `references/BLOCKS.md` has the shape and the limits.
- **Lead with the answer.** Straight under the intro, the page states what the reader came for — the
  count that is off, the conflict, the blocked task — and the detail supports it below. Two or three
  lines of intro are the whole budget above it; a page that opens with a table of contents, or with an
  intro that retells the document, has buried its own point.
- **Colour is meaning.** `bad` is broken or blocking, `warn` is at risk, `good` is done or safe.
  Colouring by position, or tinting everything so it looks designed, destroys the one channel a
  reader scans first. Category is a different channel and has its own key — `group` on a graph node,
  never `tone`.
- **Hide detail, don't drop it.** Any block takes `collapsible: true` and then costs one line when
  closed; a long table also takes `filter`, `sortable`, and `detail` on a row — click it and the whole
  record opens underneath. So the choice is almost never «сводка или полный список» — it is «что
  развёрнуто, а что раскрывается по клику». A picture with no way to look up what a node actually is
  has answered half the question, and a task list you cannot open the task from is the same failure.
- **Show what you left out.** Top-10 of 200 rows, a truncated graph, a phase without dates — say it
  on the page. A silent cut reads as the whole picture.
- **Never invent a value.** No estimate, percentage or date that is not in the source. Where a field
  is missing, the page says it is missing.
- **Ask about the cut, not the layout.** One question is worth asking when the scope is genuinely
  ambiguous («по всем фазам или только по текущей?»). Asking the user which chart type to use is
  handing back the job.

`references/RECIPES.md` carries the per-artifact starting points — which structure in a plan / spec /
tech-design actually carries the meaning, and what to leave out of the page.

## Before handing it over

Check the rendered file, not just the spec:

1. No red «Неизвестный тип блока» / «не отрисовался» callout — either is a bug in the spec, not a
   rendering quirk to ship.
2. No `NaN`, `undefined`, empty axis or bar of zero length where the source had a value.
   `grep -c "NaN\|undefined\|Неизвестный тип блока\|не отрисовался" <page>.html` must print `0`.
3. Every number traceable to the source; ids the source uses (`Task 3`, `REQ-02`, `variant-2`) are on
   the page.
4. The header names the source file or the question the page answers, and the subtitle is one line,
   not a paragraph — the header is sticky and its height is paid on every screen.
5. `intro` is there and does its job: what the document is about, why the page exists, in one to three
   sentences. Read it as someone who has never seen the source — if it needs the source open to make
   sense, or if it has turned into a summary of the document, rewrite it.
6. A reader who never opens the source gets the structure — and is not misled about what is missing.
7. Nothing on the page depends on hovering or clicking: a tooltip is a bonus and an expandable row is
   a convenience, never the only place a fact lives (that is what `notes: true` on `matrix` and `note`
   on the block are for). Print preview is the check — everything opens on paper.
8. Charts fill their container: a canvas drawn at 760px inside a full-width card leaves a dead third
   on the right, and one drawn at page width inside a `row` scrolls. `width` is how you fix either.

Then report to the user in Russian: the path, what the page shows in one or two sentences, and what
was deliberately left out. Offer to open it, and offer one concrete refinement — a cut you considered
and did not take.

## Constraints

1. **Zero dependencies, always.** No CDN, no external fonts, no remote images, no fetch. Charts are
   inline SVG, styles are inline CSS. The page must open offline, from disk, behind a corporate proxy.
   If the user explicitly asks for something only a heavy library gives (live zoom/pan over thousands
   of points), say plainly that the page will then need network access at open time and get an
   explicit yes before adding it — never quietly.
2. **One file.** No sidecar assets. Data is embedded in the page.
3. **Escape everything but `raw`.** The renderers escape their inputs; `raw` does not. Never
   interpolate untrusted or unread text into `raw`.
4. **The source document is read-only.** This skill writes the page (and its spec JSON). It does not
   edit the plan, spec or design it visualises — if the source is wrong, say so, do not fix it here.
5. **Read-only harness.** The skill writes files. If the host denies a mutating call, stop and ask:
   «Чтобы продолжить, переключи агента в режим, разрешающий запись, и запусти `/tl-visualize` ещё
   раз — скиллу нужно записать HTML-страницу.»

**Project overrides:** read `docs/skill-context/tl-visualize/SKILL.md` if it exists — its rules
override this skill's own on conflict. How to apply them: `references/skill-context.md`.
