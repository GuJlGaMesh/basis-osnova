# Recipes — known artifacts

Starting points, not scripts. Each recipe says which structure carries the meaning in that document,
which blocks expose it, and what to leave out. Deviate whenever the actual file says something else —
a recipe that fights the data loses.

## Contents

- [`docs/plans/*.md`](#docsplansmd--implementation-plan) — implementation plan
- [`docs/specs/*.md`](#docsspecsmd--requirements-spec) — requirements spec
- [`docs/tech-designs/*/tech-design.md`](#docstech-designstech-designmd--design-review) — design review
- [`docs/adr/*.md`](#docsadrmd--architecture-decision-records) — architecture decision records
- [`docs/research/*.md`](#docsresearchmd--research-note) — research note
- [`docs/workflows/*.md`](#docsworkflowsmd--chain-state) — chain state
- [`*.json` / `*.csv` / query output](#json--csv--query-output--raw-data) — raw data
- [A directory of documents](#a-directory-of-documents--the-portfolio-page) — the portfolio page
- [Two documents at once](#two-documents-at-once--spec--plan-design--plan) — spec ↔ plan, design ↔ plan
- [Документ не по формату](#документ-не-по-формату--чужой-план-чужая-спека-произвольный-markdown) — чужой план, чужая спека, произвольный markdown
- [A free-form request](#a-free-form-request--tl-visualize-вопрос) — `/tl-visualize <вопрос>`

---

Four rules apply to every recipe:

- **Never invent a value the source does not carry.** No estimates, no percentages, no dates that are
  not in the file. A field that is missing is missing — say so on the page («оценок нет в плане»)
  or drop the block.
- **Every page names its source.** `source` in the page envelope, plus the ids the source uses
  (`Task 3`, `REQ-02`, `variant-2`, `ADR-0008`) on the blocks — so a reader can go back to the text.
- **Every page opens with an `intro`.** One to three sentences above the first block: what the source
  is about and why this page exists (see «Page envelope» in `BLOCKS.md`). Where the «what» comes from
  is recipe-specific — the goal line of a plan, `## Scope` of a spec, `## Проблема` of a tech-design,
  the question of a research note, the command behind a data dump. The «why» is the request that
  produced the page: «видно, что блокирует остальное», «видно, где требования расходятся с кодом».
  Neither is guessed — a source that states no goal gets an intro that says what the data is, not an
  invented motive.
- **The file in front of you is not the template.** Real documents are written by hand, produced by an
  older version of a skill, or translated halfway: variants show up as `##` instead of `###`,
  `## Открытые вопросы` as `## Open questions`, `Status:` as `Статус:`. Match on the **marker** —
  the `REQ-NN` id, the `{#variant-N}` anchor, the `- [ ]` checkbox, the `Status:` line — not on the
  exact heading. When a marker is genuinely absent, the page says the field is missing instead of
  guessing at it. A file that matches no recipe at all is not an error — see «Документ не по формату».

---

## `docs/plans/*.md` — implementation plan

Structure that matters: the header rows (`Branch:`, `Created:`, and optionally `Refined:`, `Spec:`,
`Tech design:`, `Chosen variant:`), the execution marker `<!-- tl-implement: mode=… autonomy=… -->`
right under the H1, `## Контекст` with its optional `### Принятые решения` subsection, the
`## Задачи` checklist with `- [ ]` / `- [x]` and optional `### Этап N:` groups, `## Файлы`, and
per-task `### Task N:` blocks — «Контекст» (which may name the requirements it implements:
`Реализует REQ-01, REQ-04`), «Что сделать», «Файлы», «Acceptance criteria», «Тесты», and
«Зависит от», which carries the dependency edges.

Plans written before the sections were renamed carry the English names — `## Context`,
`## Files to change`, `## Tasks`, `### Phase N:` — and are never migrated, so expect both sets and
match whichever the file uses. The markers that did not change are the reliable ones: the
`- [ ] Task N:` checkbox, the `### Task N:` heading and the `**Зависит от:**` line.

| What the reader wants | Block |
|---|---|
| Where the work stands | `kpi` — total tasks, done, blocked; `progress` per phase from the checkbox states |
| What blocks what | `graph` — one node per task, `group` = phase, edges from «Зависит от» |
| How the work is distributed by state | `donut` over task states, or `bar` with `segments` per phase |
| The order and shape of phases | `timeline` grouped by phase, **only when the plan carries dates** |
| What gets touched | `tree` or `bar` over «Файлы» across tasks — the file with 6 tasks pointing at it is the real hot spot |
| What was decided for the reader | `table` or `cards` over `### Принятые решения` — decision → reason → affected tasks, when the plan carries the subsection |
| **Which task is which, and what it actually says** | **`table` with `detail` on every row — always** |

**The full task list is not optional, and neither is the task text.** Every plan page carries a table
of *all* tasks — id, subject, phase, status pill, dependencies — and every row carries `detail` with
that task's «Контекст», «Что сделать», «Файлы», «Acceptance criteria», «Тесты». Click the task, get
the task. Three reasons it is a rule rather than a judgement call:

- The graph shows shape, not content. Node labels are truncated to three short lines, so the moment a
  reader asks «а что такое Task 13», the picture alone cannot answer.
- Hidden detail is free. It costs one line closed, it is still found by search on the page, and it
  prints open.
- «Схема + перечисление» sends the reader back to the markdown on the first real question. A plan page
  that cannot be worked from is a poster, not a tool.

Shape of the split: on the row goes what you scan by, in the detail everything you would otherwise
open the source for. Do not re-summarise in the detail — if it fits on the row, it belongs on the row.

```json
{"id": "Task 3", "task": "Оркестратор саги", "phase": "Фаза 2", "st": "в работе", "stTone": "warn",
 "dep": "Task 2",
 "detail": {"text": "**Контекст.** … Реализует REQ-04.\n\n**Что сделать.**\n- …",
            "meta": [{"label": "Файлы", "value": "`src/billing/saga.ts` — создать"},
                     {"label": "Acceptance criteria", "value": "…"},
                     {"label": "Тесты", "value": "…"}]}}
```

From ~20 tasks the table also needs `filter: true` (it switches itself on at 25) and `sortable: true`:
a list that long is looked *things up in*, not read. The filter searches collapsed details too, so
«найди задачу, которая трогает saga.ts» works without opening anything.

When tasks are still open, split it: an **expanded** table of the open ones (ordered so that
unblocked-and-not-started comes first) plus a `collapsible` table of the finished ones. The reader's
question on an in-flight plan is «что я могу взять прямо сейчас», and that answer must not be behind
a click.

A `board` (columns «не начато / в работе / сделано») is the alternative lead when the plan is being
run rather than reviewed — it answers «сколько всего висит в работе» at a glance. It does not replace
the table: it carries no dependencies and no task text.

Leave out: nothing of the task text — it goes in `detail`. What does not belong on the page is
commentary the plan does not contain, and a `cards` block repeating tasks that are already in the table.

Worth flagging visually: a task nobody depends on and that depends on nothing (isolated node), a
dependency pointing backwards into an earlier phase, and a task whose «Тесты» section is empty.

When the header carries `Spec:`, the plan can be read against its requirements — see «Two documents at
once» below.

## `docs/specs/*.md` — requirements spec

Structure that matters: frontmatter `status` (`draft` / `clarifying` / `ready` / `superseded`), the
`REQ-NN` ids, each requirement's `Приоритет:` (`must` / `should` / `could` / `won't`), its
`**Acceptance criteria.**` list and `**Текущее состояние:**` (`нет` / `частично` / `есть` /
`конфликт`) with the code citation that backs it — plus the `Искали:` line that a `нет` must carry.
Then `## Scope` / `## Non-goals`, `## Открытые вопросы` (`- [ ] open` / `- [x] answered` /
`- [-] parked`, where an open item also carries the proposed resolution after `предлагаю:` and its
decider after `нужно решение:`), and, when present, `## Допущения`, `## Термины`, `## Источники`
(a line may end with `устарело: … — в коде path:line` when the source no longer matches the code)
and the ready-made `## Расхождения с текущей реализацией` table.

| What the reader wants | Block |
|---|---|
| Can we plan from this yet | `kpi` — requirements, open questions, conflicts; `callout` with the `status` and what blocks `ready` |
| Requirement vs reality | `matrix` with `notes: true` — rows `REQ-NN`, columns `Состояние` / `Приоритет`, tone from the state (`конфликт` → `bad`, `нет` → `warn`, `частично` → `warn`, `есть` → `good`), the code citation as the visible note |
| What each requirement actually demands | `table` of all `REQ-NN` with `detail` per row — the acceptance criteria, the state and its citation, the `Искали:` line |
| What is unresolved and what is proposed | `cards` over `- [ ] open` items — the question, its `предлагаю:` resolution and the decider; or a `table` with the answer state as a pill |
| What was decided for the user | `table` over `## Допущения` with the affected `REQ-NN` |

`## Расхождения с текущей реализацией` is already the matrix in table form — read it for the «Что
нужно» column, but take the state and the citation from the requirement blocks themselves: the
template says the block wins if the two disagree.

A spec may carry **one** mermaid of its own — `## Жизненный цикл` (a `stateDiagram-v2` over the
statuses of one entity) or `## Основной сценарий` (a sequence or flowchart), with the `REQ-NN` id
written on every transition and step. Do not re-draw it: read it instead, because those ids are the
cheapest grouping the source will ever hand you — requirements on the same lifecycle belong next to
each other in the matrix. Redraw it as a `graph` only when the reader asked for the states
specifically, and then say the page's version is derived, not authoritative. A transition labelled
with an id that `## Требования` does not have is a defect in the source: show it as one, never
quietly reconcile it.

Conflicts are the point of the page. A spec with three `конфликт` rows and a green header has been
visualised wrong.

A `clarifying` or `ready` spec is allowed **at most three** live `- [ ] open:` items — everything
else should have become a `## Допущения` entry or a `- [-] parked:` one. A fourth is not a rendering
detail to smooth over: show the count, and let a spec that broke its own ceiling look like it did.
The `open` cards carry what the reader decides on — the question, its `предлагаю:` and the decider —
while `parked` and `answered` items belong in a collapsed table, not next to them.

Two things are easy to render wrong and both mislead the reader: `нет` is not `конфликт` (nothing is
broken, the work simply does not exist), and a `нет` with no `Искали:` line means «не смотрели», not
«не нашли» — worth its own tone or a note on the page.

## `docs/tech-designs/*/tech-design.md` — design review

Structure that matters: frontmatter `status` (`draft` / `in-review` / `decided` / `superseded` /
`abandoned`) and `chosen_variant`; `## Проблема`; `## Goals & Non-Goals`; `## Решение` with
**Предлагается:** [Вариант N](#variant-N), **Что принимаем как плату:** and **Что нужно от ревью:**;
`## Варианты` — a comparison table by criteria, then one `### Вариант N: … {#variant-N}` per variant
with **Плюсы** / **Минусы** / **API / данные** and a `Status: proposed | chosen | discarded` line
(a discarded one also carries `Reason:`); `## Открытые вопросы` where every item proposes a default;
`## Сквозные аспекты` (**Откат**, **Мониторинг**, **Совместимость**, **Допущение**); and, in the L
profile, `## Rollout & метрики`.

| What the reader wants | Block |
|---|---|
| The proposal in one screen | `callout` (или `prose`) — the concept from `## Решение` plus «что принимаем как плату» |
| How the variants differ | `table` from `## Варианты` — criteria as rows, chosen variant `highlight`ed and `rowTone`d, `Status` as a pill |
| Where the variants sit against each other | `scatter` — **only when two criteria in the table are actually numeric** (трудоёмкость × ценность, риск × стоимость), with the chosen variant toned `accent` |
| Why this one | `cards` — one per variant, pros/cons in the text, `tone: good` on the chosen, `neutral` on discarded, `Reason:` shown on the discarded ones |
| What review must decide | `cards` / `table` over `## Открытые вопросы`, each with its proposed default — this is what the meeting runs on |
| What has already been thought through | `table` over `## Сквозные аспекты`: aspect → what is planned |
| When and how it ships | `steps` or `timeline` over `## Rollout & метрики` phases, when they exist |

Before the meeting the page's job is the open questions and the comparison; after it (`status:
decided`, `chosen_variant` set) it is the decision, its price, and the rollout. Same document, two
different pages — read `status` before choosing the lead.

The document's own target diagram is mermaid inside the markdown. Do not re-draw it as a `graph`
unless the design's component wiring is genuinely clearer as a layered picture — and then say the
page's version is derived, not authoritative.

Drop criteria on which all variants score the same: an all-equal row is the noise the table exists
to remove.

## `docs/adr/*.md` — architecture decision records

One ADR is `# ADR-NNNN: <Title>` plus `- **Status:** Proposed | Accepted | Deprecated | Superseded by
ADR-XXXX`, `- **Date:**`, `- **Deciders:**`, and the sections `## Context`, `## Decision`,
`## Consequences`, `## Alternatives considered`. Russian variants of the field names (`Статус`,
`Дата`) are common — match the marker, not the word.

A **single ADR** is rarely worth a page: it is already one screen. Visualise it only when the decision
has real branching — then `cards` over `## Alternatives considered` with the chosen one toned `good`,
and a `callout` carrying the decision itself.

A **directory of ADRs** is where the page earns its keep, because nobody reads twenty of them in a row:

| What the reader wants | Block |
|---|---|
| What was decided and what is still standing | `table` — id, title, status pill, date, sortable and filterable, with `detail` carrying `## Decision` and `## Consequences` so the decision itself is one click away |
| What is in force vs superseded | `kpi` (accepted / deprecated / superseded / proposed) + tone in the table |
| What replaced what | `graph` — node per ADR, edge `ADR-0004 → ADR-0008` from «Superseded by», `dashed` for a «Связан с» reference |
| When decisions were taken | `timeline` of milestones by `Date`, grouped by area if the titles carry one |

An ADR whose status says `Accepted` but which a later ADR supersedes without updating it is exactly
the kind of contradiction this page exists to surface — flag it, do not silently pick one.

## `docs/research/*.md` — research note

Free-form by design. Read it and pull the shape that is actually there: findings → `cards`,
options weighed → `table`, a flow that was traced → `graph`, a command and its output that proves a
finding → `code`, open threads → `cards` or `callout`.
When the note carries no structure worth a page, say so instead of manufacturing one.

## `docs/workflows/*.md` — chain state

The file is the state of a skill chain: an H1, a marker
`<!-- tl-workflow: mode=<inline|subagent-per-step> autonomy=<full|checkpoint|interactive> -->`, and a
checklist where each step links its artifact — `- [x] research → docs/research/2026-06-18-oauth.md`,
`- [ ] code-review`.

`steps` is the block this file was made for: one item per step, `status` from the checkbox, `note` =
the artifact path or the one-line result, tone `good` for done and `warn` for the step in flight. Add
`kpi` (done / remaining) and a `callout` with `mode` / `autonomy`, and — when the artifacts exist —
a `table` linking step → artifact, so the chain becomes a launch pad rather than a status line.

## `*.json` / `*.csv` / query output — raw data

Pick by the shape of the data, not by what looks impressive:

| Shape | Block |
|---|---|
| Category → one number | `bar` (horizontal when labels are long) |
| Category → parts of a whole | `bar` with `segments` |
| Shares of one total | `donut` (2–6 slices) |
| Ordered sequence → number | `line` |
| Records with several fields | `table`, with `type: bar` on the numeric column that matters, `detail` when a record has more fields than fit a row |
| Two keys → category | `matrix` |
| Two keys → magnitude | `matrix` with `heat: true` |
| Two measured dimensions | `scatter` |
| Parent → children | `tree` |
| Nodes and links | `graph` |
| A handful of headline numbers | `kpi` (+ `spark` when the series behind a number exists) |
| The one record that explains the anomaly | `code` — the raw fragment, verbatim |

Large files: aggregate before rendering (top-N plus «остальные»), and **say on the page what was cut** —
a silently truncated chart reads as the whole picture. Sort by the value the reader cares about, not
by insertion order.

## A directory of documents — the portfolio page

`docs/plans/`, `docs/adr/`, `docs/tech-designs/` accumulate for months, and no one reads them again.
A page over the *set* answers questions no single document can: what is in flight, what was abandoned
half-done, which area gets all the attention.

Read the cheap parts of every file — the H1, the frontmatter, the header rows, the checklist counts —
and do **not** parse each document in full. Then:

| What the reader wants | Block |
|---|---|
| What is in flight vs finished | `kpi` + `table` — document, date, status, progress (`type: bar` over the done/total ratio), sortable |
| What has stalled | `rowTone: "warn"` on documents that are open and untouched the longest; say what «untouched» is measured by |
| How the work is spread over time | `timeline` of milestones by created date, grouped by area |
| Where the effort went | `bar` — documents per area or per month |

The trap is the invented number: «progress» exists only where a document really carries checkboxes,
and «stalled» only where a date is really there. Everything else is `—`.

## Two documents at once — spec ↔ plan, design ↔ plan

When the plan's header carries `Spec:` or `Tech design:`, the interesting page is not either document
but the seam between them: which requirements are covered by tasks, which tasks implement nothing
anyone asked for, which chosen variant the tasks actually follow.

Build it from the `Реализует REQ-NN` lines in the tasks' «Контекст»: a `matrix` of `REQ-NN` × tasks,
or a `table` of requirement → tasks → state, with two tones that matter — a requirement with no task
(`bad`: it will not be built) and a `must` requirement whose tasks are all still open. Say plainly
which document each column came from; this is a derived view of two sources, and both get named.

## Документ не по формату — чужой план, чужая спека, произвольный markdown

The most common real input is not a kit artifact: a plan pasted out of Jira, a spec a colleague wrote
in their own shape, an export from Confluence, a numbered list in a message. This is the normal case,
not a failure — and the recipes above are the wrong tool for it, because each one looks for markers
this file never had.

**Read the document first, pick the recipe second.** The structure of the page comes from the document
in front of you. Forcing the plan recipe onto something that is not a plan produces a page with an
empty dependency graph and a progress bar over nothing — which is worse than no page, because it looks
authoritative.

What to look for, in order of how much it can be trusted:

| Marker in the file | What it can carry |
|---|---|
| frontmatter (`---` … `---`) | status, dates, owner, ids — the cheapest reliable metadata there is |
| the H2/H3 set | the document's own outline: `section` blocks in the document's order |
| `- [ ]` / `- [x]` | states, and therefore a `kpi` count and `progress` — the only honest source of «сделано» |
| a markdown table | a `table`, almost as-is. Keep the original column names — renaming them loses the author's own wording |
| `**Поле:** значение` lines | `meta` in a card or a row `detail` |
| numbered list | `steps` (linear) or an ordered `table`; not a `graph` — numbering is not dependency |
| code fences | `code`, when the fragment is the evidence |
| ids (`ABC-123`, `REQ-01`, `#42`) | the stable handle for every row and node — always keep them verbatim |
| dates | a `timeline`, but only from ~3 real dates that mean events; two dates are a `kpi` |
| explicit links between items («после», «зависит от», «блокирует», `→`) | `graph` edges — only where the document states them |

Then the honest defaults. A flat list of items with no states is a searchable `table` with `detail` per
row plus a count — not a dashboard. A wall of prose with three findings in it is `cards`. A document
that carries no structure worth a page gets that said out loud instead of a page.

**Name what you could not read.** «Статусов в документе нет — прогресс не считался», «зависимости в
тексте не размечены, графа нет», «даты только у двух пунктов». The reader's next question is always
whether the page is complete, and an unsaid gap reads as an absence in the work, not in the source.

Two failure modes specific to foreign documents, both of which invent data:

- **Reading state out of prose.** «Кажется, почти готово», «осталось чуть-чуть» is not `- [x]`.
  Only an explicit marker becomes a status.
- **Reading dependency out of order.** Items listed 1, 2, 3 are listed, not blocked. An edge needs the
  document to say so.

If the file turns out to be a kit artifact in disguise — `REQ-NN` ids, a `Status:` line, a task
checklist with «Зависит от» — switch to that recipe for the parts that match and stay here for the rest.

## A free-form request — `/tl-visualize <вопрос>`

No file: the data has to be gathered first (repository, git history, the conversation so far, tool
output). Two things change:

- **Gather first, then visualise.** Read what is needed to answer, and if the answer is «данных на
  страницу нет», say that instead of rendering an empty page.
- **Confirm the cut, not the layout.** One question about what exactly to show and over what range
  is worth asking; a question about which chart type to use is not — that is the skill's job.

Typical shapes: distribution of changes across modules (`bar` over `git log --numstat`), team or
area ownership (`matrix`), the history of a metric (`line`), the map of a subsystem (`graph` + `tree`).
Whatever the question, the command or query that produced the numbers belongs on the page — a `code`
block or the `source` line — so the reader can re-run it instead of trusting it.
