# Blocks — data shapes

Every block is one object in `spec.blocks`. Common optional keys on any block: `title`, `note`,
`collapsible`, `open`.
Any field that renders text accepts inline markup: `**bold**`, `*italic*`, `` `code` ``, `[text](url)`.

`tone` is one of `neutral | good | warn | bad | info | accent` and drives colour everywhere it appears.
It is a **semantic** channel, not decoration: `bad` means broken/blocking, `good` means done/safe, `warn`
means at risk. Never colour a row `bad` because it is the last one.

**The page is dark, and only dark.** There is one palette, no theme toggle and no light variant — do
not build one in `css`. Custom markup therefore always goes through the tokens (`var(--text)`,
`var(--surface)`, `var(--border)`), never through a literal `#fff` or `black`, which are invisible
here. Print is the single exception the shell handles itself: under `@media print` the tokens flip to
a paper palette, so a hard-coded colour breaks exactly there.

A live example of every block, with the JSON that produced it, is the gallery page —
`node scripts/render.mjs --gallery -o <path>.html`. `node scripts/render.mjs --list` prints the
same one-line "when to use" summaries in the terminal.

## Contents

- [Page envelope](#page-envelope) — title, source, blocks, custom css
- [`intro`](#intro--what-this-is-and-why-it-exists) — required on every page
- [`collapsible`](#collapsible--detail-without-noise) — detail without noise
- [Blocks](#blocks) — the block catalogue, one `###` per type
- [Своё, когда блока не хватает](#своё-когда-блока-не-хватает) — custom markup through the tokens
- [Failure modes the renderer surfaces](#failure-modes-the-renderer-surfaces) — unknown type, render errors

---

## Page envelope

```json
{
  "title": "Заголовок страницы",
  "subtitle": "необязательный подзаголовок",
  "intro": "**О чём.** …\n\n**Зачем страница.** …",
  "source": "docs/plans/feature.md",
  "generated": "2026-08-13",
  "layout": "wide",
  "css": "дополнительный CSS, необязателен",
  "js": "свой скрипт страницы, необязателен",
  "nav": true,
  "blocks": []
}
```

`source` and `generated` land in the header — the page must always say where the data came from.
`css` is appended after the base stylesheet; use it to extend the theme, never to fight it.
`layout` widens (`"wide"`, 1440px) or narrows (`"narrow"`, 860px) the page column; default is 1120px.
Take `wide` for a dense table or a broad diagram, `narrow` for a page that is mostly read as text.
`js` runs after the built-in scripts — see «Своё, когда блока не хватает».

**Header budget.** The header is sticky, so its height is a tax on every screen of scrolling: `title`,
`subtitle` and the source line are each clamped to two lines (the full text stays in the hover
tooltip). Write the subtitle as one sentence, not a paragraph.

## `intro` — what this is and why it exists

**Required on every page.** One to three sentences, right under the header and above the first block:
what the source document or dataset is *about*, and why this page was made — the question it answers,
the decision it supports, the reader it is for.

It exists because the page outlives its request. A title, a file path and a row of KPI tiles tell a
reader who never saw the source that there are 24 tasks and 9 are done; they do not say what is being
built, or why anyone assembled this page. The intro is the only part that says it.

```json
{"intro": "**Биллинг: перевод списаний на сагу.** План на 24 задачи в трёх фазах, ветка `feat/billing-saga`.\n\n**Зачем страница.** Видно, что уже сделано и какая задача держит остальные — с неё начинается любой следующий заход."}
```

Rules that keep it an intro and not a retelling:

- **Take the «what» from the source**, never from your own reading of the code: the plan's goal line,
  the spec's `## Scope`, the tech-design's `## Проблема`, the research question, the ADR's context.
  When the source states none of it, say what the data *is* («выгрузка `git log` за 30 дней») and
  leave the rest to the «зачем».
- **The «why» is the request that produced the page**, and that is always available — the user asked
  for this cut. «Зачем страница» is a legitimate sentence even when the source document has no purpose
  section of its own; inventing a business motive the source never states is not.
- **Not the answer, and not a summary.** The finding — the conflict, the blocked task, the number that
  is off — stays in the `kpi` / `callout` below, where a reader scans for it. An intro that grows past
  ~600 characters is a retelling, and `render.mjs` says so on stderr.
- **Written for someone who did not ask for the page.** Expand the ids and abbreviations the source
  takes for granted; a reader who needs the source open to parse the intro has no intro.

Inline markup works, and a blank line starts a new paragraph — the two-paragraph «о чём» / «зачем»
split above is the default shape, not a requirement. `subtitle` is not a substitute: it is clamped to
two lines inside a sticky header and is read as a label, not a sentence.

**Section menu.** From three `section` blocks up, a strip of links to them appears under the title —
built automatically, no `blocks` entry for it. `nav: false` turns it off. It is navigation, not a table
of contents: it costs one line and does not push the page's answer below the fold.

## `collapsible` — detail without noise

```json
{"type": "table", "title": "Все задачи", "note": "24 шт", "collapsible": true, "columns": [], "rows": []}
```

Any block takes `collapsible: true` (add `open: true` to start expanded). It renders inside a
`<details>` with the title as the summary line.

This is what makes «full detail» affordable. The choice is not *summary or dump* — a collapsed block
costs one line of vertical space, stays searchable with Ctrl+F, and prints expanded. When the question
is «should this go on the page or not», the answer is usually «yes, collapsed».

## Blocks

### `kpi` — numbers that summarise the whole page

```json
{"type": "kpi", "items": [
  {"label": "Задач", "value": 24, "unit": "шт", "note": "в трёх фазах"},
  {"label": "Сделано", "value": 9, "tone": "good", "delta": "+4 за неделю", "deltaTone": "good",
   "spark": [1, 2, 2, 5, 5, 9]}
]}
```

3–6 tiles, at the top, nowhere else. More than six and none of them registers.

`spark` draws the shape of a series under the value — no axes, no numbers. It answers «растёт или
падает», never «сколько именно»; when the exact values matter the block is `line`. Needs ≥2 points,
and only makes sense when the series is really ordered in time.

### `progress` — share of something completed

```json
{"type": "progress", "items": [
  {"label": "Фаза 1", "done": 6, "total": 6, "tone": "good"},
  {"label": "Фаза 2", "done": 3, "total": 9, "target": 7, "note": "к демо нужно 7"},
  {"label": "Покрытие", "percent": 63, "target": 80}
]}
```

Either `done` + `total` (renders `6 / 6 · 100%`) or `percent` alone.
`target` puts a tick on the track in the item's own units — a count next to `total`, a percentage
next to `percent`. Add it whenever the source names a threshold: a bar without one says how much is
done but not whether that is enough, and the second question is usually the real one.

### `table` — flat records and criterion-by-criterion comparison

```json
{"type": "table",
 "sortable": true,
 "filter": true,
 "columns": [{"key": "name", "label": "Вариант"},
             {"key": "effort", "label": "Трудоёмкость", "type": "bar"},
             {"key": "risk", "label": "Риск", "type": "pill"},
             {"key": "cost", "label": "Часы", "type": "num"},
             {"key": "entry", "label": "Файл", "type": "code", "nowrap": true}],
 "highlight": "name",
 "rows": [{"name": "Saga", "effort": 8, "risk": "средний", "riskTone": "warn", "cost": 64,
           "entry": "billing/saga.ts", "rowTone": "good"}]}
```

Column `type`: `text` (default, inline markup) · `num` (right-aligned, tabular figures) ·
`pill` (badge; tone from `<key>Tone` on the row, else the row's `tone`) ·
`bar` (in-cell bar scaled to the column max; colour from `<key>Tone` / row `tone`) ·
`code` (monospace, for paths, ids, flags).
Per column also: `align` (`left|center|right`), `width` (`"120px"`, `"18%"`), `nowrap`.
`highlight` shades one column.

`rowTone` marks the whole row with a coloured tick on the left — the chosen variant, the requirement
in conflict. It is separate from `tone`, which only feeds the pills.

`sortable: true` makes headers clickable (numeric columns sort by value, not by string).
`filter: true` adds a search box that hides non-matching rows; it turns itself on from 25 rows up,
`filter: false` turns it off. A collapsed table of 40 tasks that cannot be searched is a warehouse,
not an answer — but on paper both controls disappear, so the table must be readable without them.

Drop a column whose cells are all equal: a row of identical values is noise, not information.

#### `detail` — the whole record, one click away

```json
{"type": "table",
 "columns": [{"key": "id", "label": "ID"}, {"key": "s", "label": "Задача"}],
 "rows": [
   {"id": "Task 3", "s": "Оркестратор саги",
    "detail": {
      "text": "**Контекст.** Нужен последовательный откат. Реализует REQ-04.\n\n**Что сделать.**\n- шаги саги и их порядок",
      "meta": [{"label": "Файлы", "value": "`src/billing/saga.ts` — создать"},
               {"label": "Acceptance criteria", "value": "сага доходит до конца на happy path"}],
      "blocks": [{"type": "code", "lang": "sql", "text": "select 1", "card": false}]
    }}
 ]}
```

Any row may carry `detail`. A ▸ disclosure button appears in the first cell, the whole row becomes
clickable as a convenience, and the full record opens underneath. A «Развернуть все» button appears
above the table on its own. The row stays a table row — the button carries the `aria-expanded` state,
so keyboard and screen-reader users get a real disclosure and the table keeps its structure.

`detail` accepts three shapes: a **string** (rendered as prose, with `**bold**`, lists and
`- [ ]` checkboxes), an **object** `{text, meta, blocks}`, or an **array of blocks** — so the detail
can itself hold a table, a `code` fragment, or a small `graph`.

This is what makes «покажи всё» and «не заваливай меня текстом» the same page rather than opposite
ones. It behaves correctly under everything else the table does: search matches the collapsed detail
text too, sorting carries each detail with its own row, and printing opens all of them.

The split to aim for: the row is what you scan by (id, subject, status, dependencies), the detail is
everything you would otherwise have to open the source for. Do not put a second summary in the
detail — if it fits on the row, it belongs on the row.

### `matrix` — two dimensions crossed

```json
{"type": "matrix",
 "notes": true,
 "rows": ["REQ-01", "REQ-02"],
 "columns": ["Состояние", "Тесты"],
 "cells": [{"row": "REQ-01", "col": "Состояние", "value": "конфликт", "tone": "bad", "note": "runner.ts:8"}],
 "legend": [{"tone": "bad", "label": "конфликт с кодом"}]}
```

`rows` / `columns` are the labels themselves and `cells` reference them by exact string.
A missing cell renders as an empty `—`. `note` becomes a native hover tooltip.
`notes: true` also prints every `note` under its value (per cell: `sub`) — use it whenever the note is
the evidence rather than a footnote: a code citation that only exists on hover is invisible on paper
and to anyone scanning the page.
Always ship a `legend` when tones carry meaning.

**`heat: true` — density instead of category.** With `heat`, a cell's numeric `value` colours its
background on a scale, and the scale itself is printed under the table (`unit` labels it, `heatTone`
picks the hue, `heatMax` pins the top).

```json
{"type": "matrix", "heat": true, "unit": "коммитов",
 "rows": ["src/billing", "src/api"], "columns": ["Май", "Июнь"],
 "cells": [{"row": "src/billing", "col": "Июнь", "value": 31}]}
```

Take it when the question is «где больше» — commits per module per month, errors per endpoint per day.
Do not take it for `есть / нет / конфликт`: those are categories, and a scale would suggest that
`конфликт` is merely more of `есть`. A cell that carries its own `tone` keeps it — so a single broken
value can still be marked red inside a heat map.

### `graph` — dependencies and flows

```json
{"type": "graph", "direction": "auto",
 "nodes": [{"id": "t1", "label": "Схема БД", "meta": "Task 1", "group": "Фаза 1", "tone": "good"}],
 "edges": [{"from": "t1", "to": "t2", "label": "после отката", "tone": "bad", "dashed": true}]}
```

Layers are computed from the edges (longest path), so pass the dependencies and let the layout
place the nodes. Cycles do not break the render but do mean the data is wrong — say so on the page.

**Two colour channels, and they do not overlap.** `tone` on a node is its *state* and paints the
border (done, blocked, at risk). `group` is its *category* — phase, layer, owning team — and paints a
stripe on the left plus an automatic legend. Never encode a phase as `tone`: the reader who has
learned that red means blocking will read «фаза 3» as an incident.

Edges carry meaning too: `tone` colours the line and its arrowhead, `dashed: true` marks it as a
different kind of link (a violation of the rule, an implicit dependency, a planned link that does not
exist yet). Both go in the `legend` when the page relies on them: `legend` (`{tone|color, label}`)
overrides the auto group legend.

**Orientation is automatic** and rarely worth overriding: the renderer measures both layouts and picks
the narrower one — a long chain with few branches goes top-to-bottom and fits the page column, a wide
fan goes left-to-right. Force it with `direction: "vertical"` / `"horizontal"` only when the picture
means something the measurement cannot see (a pipeline that must read left-to-right, for instance).

A wide diagram **scrolls, it never shrinks** — scaling a graph down to page width is how 12px labels
become unreadable 6px ones. Past ~1080px the block prints its own «прокрути по горизонтали» hint.

Above ~30 nodes the picture stops being a picture regardless of orientation: aggregate (one node per
phase, per module) and put the detail in a `collapsible` table next to it.

### `timeline` — what follows what

```json
{"type": "timeline",
 "markers": [{"at": "2026-06-13", "label": "сегодня"}],
 "items": [
  {"label": "Схема и миграции", "start": "2026-06-01", "end": "2026-06-05", "group": "Фаза 1", "tone": "good"},
  {"label": "Демо заказчику", "start": "2026-06-30", "tone": "accent"},
  {"label": "Шаг 2", "start": 0, "end": 3, "note": "риск"}
]}
```

`start` / `end` are ISO dates or plain numbers — do not mix the two in one block.
`group` inserts a subheading row; keep items of one group together, order is preserved as given.
An item without `end` is a **milestone** and renders as a diamond (`milestone: true` forces it) —
a release date is a point, and drawing it as a short bar claims a duration the source never gave.
`markers` are vertical lines across the whole chart — «сегодня», a deadline, a freeze date. Without
one, a reader cannot tell whether a bar is late or simply upcoming.

Labels are truncated the same way as in `bar` (45% of the canvas, full text in the tooltip), and the
date axis drops to as few as two ticks when the scale is short — five dates on a narrow chart overlap
into mush.

### `bar` — magnitudes across categories

```json
{"type": "bar", "unit": "строк", "horizontal": true,
 "data": [{"label": "src/billing/saga.ts", "value": 412, "tone": "good"}]}
```

Horizontal by default — long labels stay readable. `horizontal: false` for a short ordinal axis.
Sort the data yourself; the renderer keeps the given order.

**The label column is capped at 45% of the canvas** and anything longer is cut with an ellipsis — from
the head for a path (`…/Controllers/NightAuditController.cs`: the file name is what identifies it),
from the tail for ordinary text. The full label always stays in the hover tooltip. So the cap is not a
reason to shorten labels by hand — but it *is* a reason not to squeeze the chart with `width`: at 480px
a 50-character path loses half of itself, at full width it fits whole.

The scale always starts at zero and negative values are not drawn — for a delta that can go both ways
use a `table` with a `num` column, or split it into two series.

One series, one colour: bars are all `--accent` unless a datum carries a `tone`, so colour still means
state. `palette: "categorical"` gives every bar its own hue — take it only when the categories are the
subject and are repeated elsewhere on the page in the same colours. `max` pins the top of the scale
(comparable charts side by side).

**`segments` instead of `value` — a stacked bar.** A category splits into parts of one whole, and the
totals stay comparable across categories:

```json
{"type": "bar", "unit": "задач", "data": [
  {"label": "Фаза 2", "segments": [
    {"label": "сделано", "value": 3, "tone": "good"},
    {"label": "в работе", "value": 4, "tone": "warn"},
    {"label": "не начато", "value": 2, "tone": "neutral"}]}
]}
```

Segment colour is keyed by the segment's `label`, so «сделано» is the same colour in every bar and
the auto legend means something. 2–4 segments; beyond that the thin slices stop being readable and
the shape belongs in a `table`. Use it when both questions are live at once — «где больше всего
работы» and «в каком она состоянии»; when only the second matters, `progress` is shorter.

### `line` — change over time

```json
{"type": "line", "x": ["н1", "н2", "н3"],
 "series": [{"name": "Открыто", "values": [12, 14, 11]}]}
```

Up to ~4 series; beyond that lines collide. A legend appears automatically for 2+ series.

### `donut` — parts of one whole

```json
{"type": "donut", "centerLabel": "задач", "data": [
  {"label": "Сделано", "value": 9, "tone": "good"},
  {"label": "В работе", "value": 4, "tone": "warn"},
  {"label": "Не начато", "value": 9, "tone": "neutral"}
]}
```

2–6 slices. Values and percentages are listed beside the ring, because by eye a 12% slice and a 15%
slice are the same slice — the ring carries the proportion, the legend carries the number.
The centre shows the sum; `total` and `center` override it, `centerLabel` captions it.

It answers «из чего это состоит», not «что больше» — for ranking categories use `bar`, and for
change over time `line`. Zero-valued entries are dropped rather than drawn as invisible slivers.

### `scatter` — two numeric dimensions at once

```json
{"type": "scatter",
 "xLabel": "Трудоёмкость, дн.", "yLabel": "Ценность",
 "xSplit": 8, "ySplit": 5,
 "quadrants": ["Быстрые победы", "Крупные ставки", "Мелочи", "Ловушки"],
 "points": [{"label": "Saga", "x": 8, "y": 9, "tone": "accent", "note": "выбранный вариант"}]}
```

Effort against value, risk against cost, size against age. `matrix` crosses two *categorical*
dimensions; `scatter` is the one that crosses two *measured* ones, and only it shows that «дорого и
бесполезно» and «дёшево и бесполезно» are different places.

`xSplit` + `ySplit` draw the quadrant lines; `quadrants` names them in the order
`[левый верх, правый верх, левый низ, правый низ]`. Both splits are required for the quadrants to
appear — a threshold on one axis alone is a `bar` with a `max`. `group` colours points by category
and adds a legend; `size` scales a dot (a third dimension, and the last one that fits).

Past ~20 points the labels collide. Then label only what the page is about and leave the rest as
dots, saying so in the block's `note`.

### `board` — items by state

```json
{"type": "board", "columns": [
  {"title": "Не начато", "items": [{"title": "Task 5: Экран истории", "meta": ["Фаза 3"]}]},
  {"title": "В работе", "tone": "warn",
   "items": [{"title": "Task 3: Оркестратор саги", "text": "Реализует REQ-04.", "badge": "риск"}]},
  {"title": "Сделано", "tone": "good", "items": []}
]}
```

The same data a status column carries, answering a different question: not «в каком состоянии эта
задача» but «сколько всего скопилось вот здесь». Column counts are rendered automatically, an empty
column says «пусто» rather than disappearing — an empty «Сделано» is information.

Item fields: `title`, `text`, `badge` (+`badgeTone`), `meta` (an array of short strings), `tone`.
Three to five columns; more and each one becomes too narrow to read. When items need a sentence each
rather than a state, that is `cards`.

### `cards` — heterogeneous items with prose

```json
{"type": "cards", "items": [
  {"title": "Импорт падает на первой ошибке", "badge": "блокер", "tone": "bad",
   "text": "Жёсткий `throw` в цикле.", "meta": [{"label": "Где", "value": "`runner.ts:8`"}]}
]}
```

For findings, risks, variants — anything that needs a sentence and a couple of facts.

### `steps` — a linear chain

```json
{"type": "steps", "items": [
  {"label": "research", "status": "готово", "tone": "good", "note": "docs/research/2026-06-18-oauth.md"},
  {"label": "implement", "status": "в работе", "tone": "warn", "note": "5/8 задач"},
  {"label": "code-review", "status": "ждёт"}
]}
```

Steps of a workflow, rollout phases, pipeline stages — anything that reads left to right with no
branching. The moment two steps depend on a third, it is a `graph`, not a chain.
`step` overrides the auto-numbering; `status` renders as a pill (`statusTone` for its colour).

### `code` — a verbatim fragment

```json
{"type": "code", "title": "Вызов инструмента", "lang": "json", "wrap": false,
 "text": "{\"tool\":\"Grep\",\n \"head_limit\":60}"}
```

A command, a JSON payload, a log line, a piece of config — escaped like everything else, unlike `raw`.
Long lines scroll horizontally; `wrap: true` soft-wraps them instead. `lang` is a label in the corner,
not a highlighter — there is no syntax colouring, by design (it would need a library).

Put a fragment on the page only when it *is* the evidence. Code that merely illustrates that code
exists belongs in the source file the page links to.

### `tree` — hierarchy

```json
{"type": "tree", "items": [
  {"label": "src/billing", "meta": "ядро изменений",
   "children": [{"label": "saga.ts", "meta": "новый", "tone": "good"}]}
]}
```

### `callout` — a single accent

```json
{"type": "callout", "tone": "warn", "title": "Допущение", "text": "Компенсация идемпотентна."}
```

One idea. Three callouts in a row are wallpaper — use `cards` instead.

### `prose` — connective text

```json
{"type": "prose", "text": "Абзац.\n\n- пункт\n- пункт", "card": false}
```

Blank line separates paragraphs; a chunk whose every line starts with `- ` becomes a list.
`card: false` drops the surrounding card — for lead-ins under a section heading.

### `section` — heading between parts of the page

```json
{"type": "section", "title": "Зависимости", "note": "по данным плана"}
```

### `row` — blocks side by side

```json
{"type": "row", "blocks": [{"type": "kpi", "items": []}, {"type": "bar", "width": 480, "data": []}]}
```

Wraps to one column on a narrow screen. Do not nest a `row` inside a `row`.

A chart inside a `row` needs its own `width` (~480): charts are drawn at the width of the full page
column, and a canvas wider than its container scrolls rather than shrinks. `width` (and `height` on
`bar`, `line`, `scatter`) is how you fit one — never by letting it scale down, which is what turns
12px labels into unreadable 6px ones.

**`width` belongs to `row` and nowhere else.** On a top-level block it leaves half the card empty and
squeezes the label column into an ellipsis for no reason; the default already *is* the page column.
`render.mjs` warns on stderr when it sees one — the value is usually copied out of the example above.

### `svg` — your own picture, on the page's terms

```json
{"type": "svg", "title": "Путь запроса через компенсацию", "viewBox": "0 0 620 130", "height": 130,
 "content": "<rect x=\"8\" y=\"34\" width=\"130\" height=\"46\" rx=\"8\" fill=\"var(--surface-2)\" stroke=\"var(--border)\"></rect><text class=\"node-label\" x=\"26\" y=\"62\">Отмена акта</text>"}
```

The block set covers common shapes, not every shape. When the thing worth showing is a specific
mechanism — a request path, a state machine, a layout of something physical — draw it, and this block
gives you the frame, the title, the horizontal scroll and the theme for free. `content` is **not**
escaped (see `raw`).

Everything the built-in charts use is available inside: `var(--accent)` / `--good` / `--warn` /
`--bad` / `--muted` / `--surface` / `--surface-2` / `--border` / `--text`, and the classes
`node-box`, `node-label`, `node-meta`, `edge`, `edge-label`, `ax`, `grid`. Using them is what keeps a
custom picture from looking pasted in — and keeps it correct on paper, where hard-coded colours turn
into light-grey-on-white (the page is dark on screen and switches tokens for print).

`width`/`height` default to the `viewBox` dimensions. Define any `<marker>` / `<defs>` id with a
prefix of your own: ids are global to the page and a second definition of `arrow` will hijack the first.

### `raw` — escape hatch

```json
{"type": "raw", "html": "<div class=\"card u-row\">своя вёрстка</div>"}
```

Not escaped — never interpolate untrusted text into it. For a **picture** prefer `svg` (framed and
scrollable already); `raw` is for custom *markup* — a layout no block produces.

Before reaching for it, check that the shape is genuinely absent: a snippet with a caption is `code`,
a linear chain is `steps`, side-by-side blocks are `row`, and most «нужна своя колонка» cases are a
column `type` / `align` / `width` in `table`.

## Своё, когда блока не хватает

The block set is a floor, not a ceiling. When the request is «нарисуй вот такое» and nothing here is
that shape, build it — the constraint that never bends is Constraint 1 in `SKILL.md` (no CDN, no
network), not the block list.

Escalate in this order, and stop at the first step that fits:

1. **A block option** — `collapsible`, `detail`, `segments`, `heat`, `width`, a column `type`.
   Most «этого нет» turns out to be one of these.
2. **`svg`** — a picture the set has no notion of, drawn with the page's own tokens and classes.
3. **`raw`** — custom markup: a layout, a comparison, a legend of your own.
4. **`css` / `js` on the page** — only when the custom piece needs its own styling or behaviour.

**Utility classes**, so custom markup does not reinvent the page: `u-grid` (auto-fit columns),
`u-row` (inline flex row), `u-stack` (vertical stack), `u-between`, `u-muted`, `u-mono`, `u-small`,
`u-big`, `u-right`, `u-center`, `u-sep`. Plus the components themselves: `card`, `pill t-good`,
`fg-warn`, `legend`, `scroll-x`, `block-title`, `block-note`.

**`js` on the page envelope** is the last step and comes with the same rule as `raw`: it is your code,
so nothing untrusted goes into it, and it must be self-contained — no CDN, no fetch, no network at
open time. It runs after the built-in table script, so `document.querySelector` sees the finished page. What it must never do is *hold* a fact: if a number only appears after a click, it is
absent when the page is printed and absent for whoever has JS blocked. Interactivity may reveal
detail, reorder it, filter it — never be the only place it exists.

## Failure modes the renderer surfaces

An unknown `type`, or a block that throws while rendering, becomes a red callout on the page instead of
disappearing. If one shows up in the output, the spec is wrong — fix it, do not ship the page with it.
