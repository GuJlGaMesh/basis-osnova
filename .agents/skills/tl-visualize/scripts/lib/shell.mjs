// shell.mjs — обёртка HTML-страницы: дизайн-токены тёмной темы, печать.
//
// Никаких внешних зависимостей: ни CDN, ни шрифтов из сети, ни бандлов.
// Страница — один самодостаточный .html, который открывается двойным кликом
// и работает офлайн.

/** Экранирование текста для вставки в HTML. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Мини-разметка внутри строки: **жирный**, *курсив*, `код`, [текст](url). */
export function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

// Категориальная палитра: подобрана под тёмный фон и различима при
// протанопии/дейтеранопии. Светлее классического vega-набора — на тёмном
// средние тона сливаются с фоном карточки.
export const SERIES_COLORS = [
  '#6a9df0',
  '#f5943c',
  '#5cc46a',
  '#ef6f6c',
  '#5fc9c0',
  '#c58ec0',
  '#e8c84a',
  '#bb8f6a',
];

// Страница тёмная, и только тёмная: одна палитра вместо двух — это один набор
// решений про контраст, а не два, которые расходятся при каждой правке.
// Исключение — печать: чёрный лист бумаги не бывает, поэтому под @media print
// токены переопределяются на бумажные (см. ниже).
const BASE_CSS = `
:root {
  color-scheme: dark;
  --bg: #14151a;
  --surface: #1c1e25;
  --surface-2: #23262f;
  --text: #e8e8ea;
  --muted: #9a9aa6;
  --border: #2e313b;
  --accent: #6f9dff;
  --good: #4ade80;
  --warn: #f0b429;
  --bad: #f87171;
  --info: #6f9dff;
  --neutral: #9a9aa6;
  --good-bg: #14301f;
  --warn-bg: #33280f;
  --bad-bg: #351a1a;
  --info-bg: #1a2440;
  --neutral-bg: #262932;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.25);
  --radius: 10px;
  --page-w: 1120px;
  --font: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "Cascadia Mono", Consolas, "Liberation Mono", monospace;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); }
code { font-family: var(--mono); font-size: 0.88em; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }

.page { max-width: var(--page-w); margin: 0 auto; padding: 0 28px 72px; }
/* Шапка липкая, поэтому её высота — налог на каждый экран прокрутки.
   Заголовок и подпись обрезаются по строкам, meta уходит вправо и переносится
   внутри своей колонки: длинное название не должно съедать треть экрана. */
.top {
  position: sticky; top: 0; z-index: 20;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}
.top-inner {
  max-width: var(--page-w); margin: 0 auto; padding: 14px 28px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
}
.top-id { min-width: 0; }
.top h1 {
  font-size: 19px; margin: 0; font-weight: 650; letter-spacing: -0.01em; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.top .sub {
  color: var(--muted); font-size: 13px; max-width: 78ch; margin-top: 2px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.top-side { display: flex; align-items: flex-start; gap: 12px; flex: 0 1 auto; min-width: 0; }
.top .meta {
  color: var(--muted); font-size: 12px; font-family: var(--mono); text-align: right;
  max-width: 46ch; overflow-wrap: anywhere; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
/* Навигация по разделам: страница легко вырастает на несколько экранов,
   и без неё единственный способ найти раздел — крутить колесо. */
.top-nav {
  max-width: var(--page-w); margin: 0 auto; padding: 0 28px 9px;
  display: flex; gap: 14px; overflow-x: auto; font-size: 12.5px; scrollbar-width: none;
}
.top-nav::-webkit-scrollbar { display: none; }
.top-nav a { color: var(--muted); text-decoration: none; white-space: nowrap; }
.top-nav a:hover { color: var(--accent); }

/* Вводка: одна-три фразы о том, что за документ и зачем эта страница.
   Не в шапке — шапка липкая, а вводку читают один раз и прокручивают мимо.
   Приглушена и с левой линейкой, чтобы её не путали с содержательным блоком. */
.intro {
  max-width: 92ch; margin: -4px 0 24px; padding-left: 14px;
  border-left: 2px solid var(--border); color: var(--muted); font-size: 14.5px;
}
.intro p { margin: 0 0 8px; }
.intro p:last-child { margin: 0; }
.intro strong { color: var(--text); font-weight: 600; }

/* Якорь не должен уезжать под липкую шапку. */
.section, .block { scroll-margin-top: 104px; }
.section { margin: 34px 0 14px; }
.section h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin: 0 0 4px; font-weight: 600; }
.section .note { color: var(--muted); font-size: 13px; }

.block { margin: 0 0 18px; }
.block > .block-title { font-size: 14px; font-weight: 620; margin: 0 0 6px; }
.block > .block-note { color: var(--muted); font-size: 13px; margin: -2px 0 8px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 18px; }
.scroll-x { overflow-x: auto; }
/* Широкая схема прокручивается, а НЕ ужимается: масштабирование вниз убивает
   подписи (12px превращаются в 6px и перестают читаться). Узкая — центрируется,
   иначе пустая треть справа читается как «здесь что-то не дорисовалось». */
.scroll-x > svg { max-width: none; width: auto; height: auto; margin: 0 auto; }
.scroll-hint { margin-top: 6px; font-size: 12px; }

details.fold { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
details.fold > summary {
  cursor: pointer; padding: 11px 16px; font-size: 14px; font-weight: 620;
  list-style: none; display: flex; align-items: baseline; gap: 9px;
}
details.fold > summary::-webkit-details-marker { display: none; }
details.fold > summary::before { content: "▸"; color: var(--muted); font-size: 12px; }
details.fold[open] > summary::before { content: "▾"; }
details.fold[open] > summary { border-bottom: 1px solid var(--border); }
details.fold > summary .f-note { font-weight: 400; color: var(--muted); font-size: 13px; }
details.fold > .card { border: none; box-shadow: none; background: transparent; }
details.fold > .card > .scroll-x > table.data { margin: -4px 0; }
.row-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); align-items: start; }

/* KPI */
.kpi-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 13px 15px; box-shadow: var(--shadow); }
.kpi .k-label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi .k-value { font-size: 27px; font-weight: 650; letter-spacing: -0.02em; margin-top: 2px; font-variant-numeric: tabular-nums; }
.kpi .k-delta { font-size: 13px; font-weight: 600; }
.kpi .k-note { color: var(--muted); font-size: 12px; margin-top: 2px; }
/* Спарклайн — форма ряда, не его значения: отвечает «растёт или падает». */
.kpi .k-spark { margin-top: 5px; }

/* Tables */
table.data { width: 100%; border-collapse: collapse; font-size: 14px; }
table.data th {
  text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--muted); padding: 8px 12px; border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
table.data td { padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
table.data tr:last-child td { border-bottom: none; }
table.data tbody tr:hover { background: var(--surface-2); }
table.data td.num, table.data th.num { text-align: right; font-variant-numeric: tabular-nums; }
table.data td.center, table.data th.center { text-align: center; }
table.data td.nowrap { white-space: nowrap; }
table.data col.hl + col, table.data .hl-col { background: var(--surface-2); }
/* Тон строки — узкая засечка слева, а не заливка: заливка забивает пилюли в ячейках. */
table.data tr.rt-good td:first-child { box-shadow: inset 3px 0 0 var(--good); }
table.data tr.rt-warn td:first-child { box-shadow: inset 3px 0 0 var(--warn); }
table.data tr.rt-bad td:first-child { box-shadow: inset 3px 0 0 var(--bad); }
table.data tr.rt-info td:first-child, table.data tr.rt-accent td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
table.data tr.rt-neutral td:first-child { box-shadow: inset 3px 0 0 var(--muted); }
table.data tr.rt-neutral td { color: var(--muted); }
table.data th.sortable { cursor: pointer; user-select: none; }
table.data th.sortable:hover { color: var(--text); }
table.data th.sortable::after { content: "↕"; opacity: 0.35; margin-left: 5px; font-size: 10px; }
table.data th.sortable[data-dir="asc"]::after { content: "↑"; opacity: 1; }
table.data th.sortable[data-dir="desc"]::after { content: "↓"; opacity: 1; }
.tbl-controls { display: flex; gap: 10px; align-items: center; margin: 0 0 10px; }
.tbl-filter {
  flex: 1 1 auto; width: 100%; margin: 0; padding: 6px 10px; font-size: 13px; font-family: var(--font);
  border: 1px solid var(--border); border-radius: 7px; background: var(--bg); color: var(--text);
}
.tbl-filter:focus { outline: 2px solid color-mix(in srgb, var(--accent) 45%, transparent); outline-offset: -1px; }
.tbl-empty { color: var(--muted); font-size: 13px; padding: 8px 2px; }
.tbl-expand {
  flex: 0 0 auto; border: 1px solid var(--border); background: var(--surface); color: var(--muted);
  border-radius: 7px; padding: 6px 11px; font-size: 12.5px; cursor: pointer; font-family: var(--font); white-space: nowrap;
}
.tbl-expand:hover { color: var(--text); }

/* Раскрывающаяся строка: сводка остаётся в таблице, подробности живут под ней.
   Полный текст задачи не уезжает в исходник и остаётся в поиске по странице. */
table.data tr.expandable { cursor: pointer; }
table.data tr.expandable:hover > td { background: var(--surface-2); }
table.data tr.expandable.is-open > td { background: var(--surface-2); }
button.exp-mark {
  appearance: none; border: 0; background: none; padding: 0; margin: 0 4px 0 0;
  width: 11px; color: var(--muted); font-size: 11px; font-family: var(--font);
  cursor: pointer; line-height: inherit; vertical-align: baseline;
}
button.exp-mark::before { content: "\\25B8"; }
button.exp-mark[aria-expanded="true"]::before { content: "\\25BE"; }
button.exp-mark:hover { color: var(--text); }
button.exp-mark:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-radius: 2px; }
table.data tr.row-detail > td { background: var(--surface-2); padding: 4px 16px 14px 25px; }
.rd-body > .block { margin-bottom: 12px; }
.rd-body > .block:last-child { margin-bottom: 0; }
.rd-body .card { background: var(--surface); }
.rd-meta { display: grid; gap: 4px; font-size: 13px; margin: 8px 0 0; }
.rd-meta .m-label { color: var(--muted); margin-right: 6px; }

.pill { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
/* В карточках колонка бывает уже бейджа — там он переносится, а не распирает
   карточку. В таблице nowrap остаётся: колонка там прокручивается. */
.cards .pill, .bd-meta .pill, .steps .pill { white-space: normal; max-width: 100%; }
.t-good { color: var(--good); background: var(--good-bg); }
.t-warn { color: var(--warn); background: var(--warn-bg); }
.t-bad { color: var(--bad); background: var(--bad-bg); }
.t-info { color: var(--info); background: var(--info-bg); }
.t-neutral, .t-accent { color: var(--neutral); background: var(--neutral-bg); }
.t-accent { color: var(--accent); background: var(--info-bg); }
.fg-good { color: var(--good); } .fg-warn { color: var(--warn); } .fg-bad { color: var(--bad); }
.fg-info { color: var(--info); } .fg-neutral { color: var(--muted); } .fg-accent { color: var(--accent); }

/* Полоска в ячейке: число стоит РЯДОМ с полосой, а не поверх неё —
   цифра на цветной заливке нечитаема ровно там, где значение велико. */
.inbar { display: flex; align-items: center; gap: 9px; min-width: 92px; }
.inbar > .ib-track { position: relative; flex: 1 1 auto; min-width: 40px; height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.inbar > .ib-track > i { position: absolute; inset: 0 auto 0 0; background: var(--accent); border-radius: 999px; }
.inbar > .ib-v { font-size: 12.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Matrix */
table.matrix { border-collapse: separate; border-spacing: 3px; font-size: 13px; }
table.matrix th { font-weight: 600; color: var(--muted); font-size: 12px; padding: 4px 8px; text-align: left; }
table.matrix th.col { text-align: center; }
table.matrix td { text-align: center; padding: 7px 10px; border-radius: 6px; font-weight: 600; min-width: 62px; }
table.matrix td.empty { background: var(--surface-2); color: var(--muted); font-weight: 400; }
table.matrix td .m-sub { display: block; font-weight: 400; font-size: 11px; opacity: 0.85; margin-top: 2px; font-family: var(--mono); }
.legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; font-size: 12px; color: var(--muted); }
.legend .sw { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
/* Шкала теплокарты: без неё насыщенность цвета не переводится обратно в число. */
.heat-scale { align-items: center; gap: 8px; }
.hs-ramp { display: inline-block; width: 130px; height: 10px; border-radius: 999px; border: 1px solid var(--border); }
table.matrix td.heat { color: var(--text); }

/* Progress */
.prog { display: grid; grid-template-columns: minmax(150px, 1.6fr) minmax(120px, 2.6fr) auto; gap: 10px 14px; align-items: center; }
.prog .p-label { font-size: 14px; }
.prog .p-note { color: var(--muted); font-size: 12.5px; margin-left: 8px; }
.prog .p-track { position: relative; height: 9px; background: var(--surface-2); border-radius: 999px; }
.prog .p-fill { height: 100%; border-radius: 999px; background: var(--accent); }
/* Цель — засечка поверх дорожки: «сколько сделано» и «сколько нужно» на одной шкале. */
.prog .p-target { position: absolute; top: -4px; bottom: -4px; width: 2px; background: var(--text); opacity: 0.5; border-radius: 2px; }
.prog .p-num { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Donut — доли одного целого. Величины стоят в легенде: на глаз 12% от 15% не отличить. */
.donut { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
.donut > svg { flex: 0 0 auto; }
/* Легенда не растягивается на всю карточку: величина, оторванная от подписи
   половиной экрана, перестаёт с ней связываться. */
.dn-legend { display: grid; gap: 7px; flex: 0 1 400px; min-width: 200px; }
.dn-row { display: flex; align-items: center; gap: 9px; font-size: 13.5px; }
.dn-row .sw { display: inline-block; width: 11px; height: 11px; border-radius: 3px; flex: 0 0 auto; }
.dn-label { flex: 1 1 auto; min-width: 0; }
.dn-val { font-variant-numeric: tabular-nums; font-weight: 620; }
.dn-pct { color: var(--muted); font-variant-numeric: tabular-nums; width: 40px; text-align: right; }
svg text.dn-center { font-size: 24px; font-weight: 650; fill: var(--text); }
svg text.dn-center-label { font-size: 11.5px; fill: var(--muted); }

/* Board — карточки по колонкам-состояниям: сколько застряло здесь, а не «где эта задача». */
.board { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(205px, 1fr)); align-items: start; }
.bd-col { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px; display: grid; gap: 8px; align-content: start; }
.bd-head { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 650; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.bd-count { color: var(--muted); font-variant-numeric: tabular-nums; }
.bd-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--border); border-radius: 8px; padding: 9px 11px; }
.bd-card.b-good { border-left-color: var(--good); } .bd-card.b-warn { border-left-color: var(--warn); }
.bd-card.b-bad { border-left-color: var(--bad); } .bd-card.b-info, .bd-card.b-accent { border-left-color: var(--accent); }
.bd-title { font-weight: 620; font-size: 13.5px; overflow-wrap: anywhere; }
.bd-text { color: var(--muted); font-size: 12.5px; margin-top: 3px; }
.bd-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; align-items: center; }
.bd-m { font-size: 11.5px; color: var(--muted); font-family: var(--mono); }
.bd-empty { color: var(--muted); font-size: 12.5px; padding: 4px 2px; }

/* Cards */
.cards { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.cards .c { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--border); border-radius: var(--radius); padding: 14px 16px; box-shadow: var(--shadow); }
.cards .c.b-good { border-left-color: var(--good); } .cards .c.b-warn { border-left-color: var(--warn); }
.cards .c.b-bad { border-left-color: var(--bad); } .cards .c.b-info, .cards .c.b-accent { border-left-color: var(--accent); }
/* Шапка карточки переносится: без wrap длинный бейдж (он nowrap и сжаться не
   может) выдавливает заголовок в колонку в одно слово и вылезает за карточку. */
.cards .c-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin-bottom: 5px; }
.cards .c-title { font-weight: 620; font-size: 15px; min-width: 0; overflow-wrap: anywhere; }
.cards .c-text { font-size: 14px; color: var(--text); overflow-wrap: anywhere; }
.cards .c-meta { margin-top: 9px; display: grid; gap: 3px; font-size: 12.5px; overflow-wrap: anywhere; }
.cards .c-meta .m-label { color: var(--muted); margin-right: 6px; }

/* Callout */
.callout { border-radius: var(--radius); padding: 12px 15px; border: 1px solid var(--border); border-left-width: 3px; }
.callout.c-good { border-left-color: var(--good); background: var(--good-bg); }
.callout.c-warn { border-left-color: var(--warn); background: var(--warn-bg); }
.callout.c-bad { border-left-color: var(--bad); background: var(--bad-bg); }
.callout.c-info { border-left-color: var(--info); background: var(--info-bg); }
.callout .c-title { font-weight: 640; margin-bottom: 3px; }

/* Tree */
ul.tree, ul.tree ul { list-style: none; margin: 0; padding-left: 0; }
ul.tree ul { padding-left: 17px; border-left: 1px solid var(--border); margin-left: 5px; }
ul.tree li { padding: 2px 0 2px 10px; position: relative; font-size: 14px; }
ul.tree ul > li::before { content: ""; position: absolute; left: -1px; top: 14px; width: 8px; height: 1px; background: var(--border); }
ul.tree .t-meta { color: var(--muted); font-size: 12.5px; margin-left: 7px; }

/* Prose */
.prose p { margin: 0 0 9px; }
.prose ul, .prose ol { margin: 0 0 9px; padding-left: 20px; }
.prose li { margin-bottom: 2px; }
.prose > :last-child { margin-bottom: 0; }
/* Чекбокс из исходника остаётся чекбоксом: маркер несёт состояние, а не оформление. */
.prose li.li-check { list-style: none; margin-left: -20px; }
.prose li.li-check .ck { display: inline-block; width: 17px; color: var(--muted); }
.prose li.li-check.is-done { color: var(--muted); }
.prose li.li-check.is-done .ck { color: var(--good); }

/* Code — команда, JSON, лог. Экранируется, как и всё остальное, в отличие от raw. */
.codeblock { position: relative; }
.codeblock pre {
  margin: 0; overflow-x: auto; background: var(--surface-2); border-radius: 8px;
  padding: 12px 14px; font-size: 12.5px; line-height: 1.55; tab-size: 2;
}
.codeblock pre code { background: none; padding: 0; font-size: inherit; font-family: var(--mono); }
.codeblock.wrap pre { white-space: pre-wrap; overflow-wrap: anywhere; }
.codeblock .lang {
  position: absolute; top: 8px; right: 10px; font-size: 10.5px; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--muted); font-family: var(--mono);
}

/* Steps — линейная цепочка: шаги воркфлоу, фазы выкатки, стадии пайплайна. */
.steps { display: flex; flex-wrap: wrap; gap: 9px; align-items: stretch; }
.steps .st {
  flex: 1 1 165px; background: var(--surface); border: 1px solid var(--border);
  border-top: 3px solid var(--border); border-radius: var(--radius); padding: 10px 13px; box-shadow: var(--shadow);
  position: relative; min-width: 0;
}
.steps .st.s-good { border-top-color: var(--good); } .steps .st.s-warn { border-top-color: var(--warn); }
.steps .st.s-bad { border-top-color: var(--bad); } .steps .st.s-info, .steps .st.s-accent { border-top-color: var(--accent); }
.steps .st .s-n { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
.steps .st .s-label { font-weight: 620; font-size: 14px; margin-top: 1px; overflow-wrap: anywhere; }
.steps .st .s-note { color: var(--muted); font-size: 12.5px; margin-top: 3px; overflow-wrap: anywhere; }
.steps .st .s-status { margin-top: 6px; }
.steps .st::after {
  content: "›"; position: absolute; right: -8px; top: 50%; transform: translateY(-50%);
  color: var(--muted); font-size: 17px; line-height: 1; opacity: 0.6;
}
.steps .st:last-child::after { content: none; }

svg { display: block; max-width: 100%; height: auto; }
svg text { font-family: var(--font); fill: var(--text); }
svg .ax { fill: var(--muted); font-size: 11px; }
svg .grid { stroke: var(--border); stroke-width: 1; }
svg .node-box { fill: var(--surface); stroke: var(--border); }
svg .node-label { font-size: 12.5px; font-weight: 600; }
svg .node-meta { font-size: 11px; fill: var(--muted); }
svg .edge { stroke: var(--muted); stroke-width: 1.4; fill: none; opacity: 0.65; }
/* Подпись ребра лежит поверх линии — без «ореола» цвета фона линия перечёркивает текст. */
svg .edge-label { font-size: 11px; fill: var(--muted); paint-order: stroke; stroke: var(--surface); stroke-width: 3.5px; stroke-linejoin: round; }
svg .bar-value { paint-order: stroke; stroke: var(--surface); stroke-width: 3px; stroke-linejoin: round; }
/* Scatter: линии квадрантов и их подписи — фон картинки, а не данные. */
svg .q-split { stroke: var(--muted); stroke-width: 1.4; stroke-dasharray: 6 4; opacity: 0.65; }
svg .q-label { font-size: 11.5px; fill: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.85; }
svg .axis-name { font-size: 12px; fill: var(--muted); }

/* Утилиты для собственной вёрстки в блоках raw и svg: публичная часть страницы,
   чтобы кастомный блок не изобретал заново отступы, сетку и приглушённый текст. */
.u-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.u-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.u-stack { display: grid; gap: 6px; }
.u-between { display: flex; gap: 12px; align-items: baseline; justify-content: space-between; }
.u-muted { color: var(--muted); }
.u-mono { font-family: var(--mono); }
.u-small { font-size: 12.5px; }
.u-big { font-size: 27px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.u-right { text-align: right; }
.u-center { text-align: center; }
.u-sep { border-top: 1px solid var(--border); margin: 12px 0; }

@media print {
  /* Единственное место, где палитра другая: чёрного листа бумаги не существует,
     а страницу проверяют печатью — на ней раскрывается всё свёрнутое. */
  :root {
    color-scheme: light;
    --bg: #ffffff; --surface: #ffffff; --surface-2: #f2f2ef;
    --text: #16161a; --muted: #5c5c63; --border: #d8d8d2;
    --accent: #24519e; --good: #14683e; --warn: #8a5600; --bad: #a5312a;
    --info: #24519e; --neutral: #5c5c63;
    --good-bg: #eaf5ee; --warn-bg: #fbf2e2; --bad-bg: #fbebea;
    --info-bg: #ecf1fb; --neutral-bg: #f1f1ee;
    --shadow: none;
  }
  .top { position: static; backdrop-filter: none; background: #fff; }
  .top h1, .top .sub { -webkit-line-clamp: none; display: block; overflow: visible; }
  .top-nav, .tbl-filter, .tbl-expand, .tbl-controls { display: none; }
  .card, .kpi, .cards .c, .steps .st, .bd-card { box-shadow: none; break-inside: avoid; }
  .block { break-inside: avoid; }
  .scroll-hint { display: none; }
  .scroll-x { overflow-x: visible; }
  /* На печати свёрнутое не должно пропадать — бумага не кликается. */
  details.fold:not([open]) > .card { display: block; }
  details:not([open]) > *:not(summary) { display: revert; }
  table.data tr.row-detail[hidden] { display: table-row; }
  button.exp-mark { display: none; }
}
`;

// Фильтр и сортировка больших таблиц. Без них collapsible-таблица на 40 строк
// «есть на странице», но ответить по ней на вопрос всё равно нельзя.
const TABLE_SCRIPT = `
(function () {
  var markOf = function (tr) { return tr.querySelector('button.exp-mark'); };
  var detailOf = function (tr) {
    var m = markOf(tr);
    var id = m && m.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  };
  var setOpen = function (tr, open) {
    var m = markOf(tr);
    if (m) m.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (m) m.setAttribute('aria-label', open ? 'Скрыть подробности' : 'Показать подробности');
    tr.classList.toggle('is-open', open);
    var d = detailOf(tr);
    if (!d) return;
    if (open) d.removeAttribute('hidden'); else d.setAttribute('hidden', '');
  };

  // Раскрытие подробностей. Строка — сводка, деталь — всё остальное: полный
  // текст остаётся на странице и в поиске по ней. Состояние живёт на кнопке
  // внутри ячейки (это она — disclosure), клик по строке — просто удобство.
  document.querySelectorAll('table.data tr.expandable').forEach(function (tr) {
    var toggle = function () {
      var m = markOf(tr);
      setOpen(tr, !(m && m.getAttribute('aria-expanded') === 'true'));
    };
    var m = markOf(tr);
    if (m) m.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    tr.addEventListener('click', function (e) {
      // Ссылка и любой другой контрол внутри строки работают сами за себя.
      if (e.target && e.target.closest && e.target.closest('a, button, input, select, summary')) return;
      toggle();
    });
  });
  document.querySelectorAll('button[data-expand]').forEach(function (btn) {
    var table = document.getElementById(btn.getAttribute('data-expand'));
    if (!table) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Свернуть все' : 'Развернуть все';
      table.querySelectorAll('tr.expandable').forEach(function (tr) { setOpen(tr, open); });
    });
  });

  document.querySelectorAll('input[data-filter]').forEach(function (input) {
    var table = document.getElementById(input.getAttribute('data-filter'));
    if (!table) return;
    var empty = document.getElementById(input.getAttribute('data-filter') + '-empty');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        if (tr.classList.contains('row-detail')) return; // едет вместе со своей строкой
        var d = detailOf(tr);
        // Ищем и по свёрнутой детали: раз текст задачи на странице, он обязан находиться.
        var hay = (tr.textContent + ' ' + (d ? d.textContent : '')).toLowerCase();
        var hit = !q || hay.indexOf(q) !== -1;
        tr.style.display = hit ? '' : 'none';
        if (d) d.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      if (empty) empty.style.display = shown ? 'none' : '';
    });
  });

  document.querySelectorAll('table.data th.sortable').forEach(function (th) {
    th.addEventListener('click', function () {
      var table = th.closest('table');
      var tbody = table.tBodies[0];
      var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
      var dir = th.getAttribute('data-dir') === 'asc' ? 'desc' : 'asc';
      th.parentNode.querySelectorAll('th').forEach(function (o) { o.removeAttribute('data-dir'); });
      th.setAttribute('data-dir', dir);
      var key = function (tr) {
        var td = tr.cells[idx];
        if (!td) return '';
        var raw = td.getAttribute('data-sort');
        // n === n отсеивает нечисло, не упоминая его имени: готовую страницу
        // проверяют грепом на это слово, служебный скрипт не должен давать ложный сигнал.
        if (raw !== null && raw !== '') { var n = Number(raw); return n === n ? n : raw; }
        return td.textContent.trim().toLowerCase();
      };
      // Сортируем парами «строка + её деталь»: иначе подробности уезжают к чужой строке.
      var groups = [];
      Array.prototype.slice.call(tbody.rows).forEach(function (tr) {
        if (tr.classList.contains('row-detail')) { if (groups.length) groups[groups.length - 1].push(tr); }
        else groups.push([tr]);
      });
      groups.sort(function (a, b) {
        var x = key(a[0]), y = key(b[0]);
        if (typeof x === 'number' && typeof y === 'number') return dir === 'asc' ? x - y : y - x;
        return dir === 'asc' ? String(x).localeCompare(String(y), 'ru') : String(y).localeCompare(String(x), 'ru');
      });
      groups.forEach(function (g) { g.forEach(function (tr) { tbody.appendChild(tr); }); });
    });
  });
})();
`;

// Ширина колонки страницы. `wide` — под плотную таблицу или широкую схему,
// `narrow` — под страницу, которую в основном читают текстом.
const LAYOUTS = { wide: '1440px', narrow: '860px' };

/**
 * Собирает готовую страницу.
 * @param {{title: string, subtitle?: string, intro?: string, source?: string,
 *          generated?: string, css?: string, js?: string, layout?: 'wide'|'narrow', body: string,
 *          sections?: Array<{id: string, title: string}>}} page
 */
export function renderPage(page) {
  const title = page.title || 'Визуализация';
  const meta = [page.source, page.generated].filter(Boolean).map(esc).join(' · ');
  const layoutCss = LAYOUTS[page.layout] ? `\n:root { --page-w: ${LAYOUTS[page.layout]}; }` : '';
  // Меню разделов только там, где по странице реально можно заблудиться.
  const sections = (page.sections ?? []).filter((s) => s.title);
  const nav =
    sections.length >= 3
      ? `<nav class="top-nav">${sections
          .map((s) => `<a href="#${esc(s.id)}">${esc(s.title)}</a>`)
          .join('')}</nav>`
      : '';
  // Пустая строка вводки — это её отсутствие, а не пустой блок с линейкой.
  const intro = String(page.intro ?? '').trim();
  const introHtml = intro
    ? `<div class="intro">${intro
        .split(/\n\s*\n/)
        .map((para) => `<p>${inline(para.trim())}</p>`)
        .join('')}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${BASE_CSS}${layoutCss}${page.css ? `\n/* spec.css */\n${page.css}` : ''}</style>
</head>
<body>
<header class="top">
<div class="top-inner">
  <div class="top-id">
    <h1>${esc(title)}</h1>
    ${page.subtitle ? `<div class="sub">${esc(page.subtitle)}</div>` : ''}
  </div>
  <div class="top-side">
    ${meta ? `<div class="meta" title="${meta}">${meta}</div>` : ''}
  </div>
</div>
${nav}
</header>
<main class="page">
${introHtml}${page.body}
</main>
<script>${TABLE_SCRIPT}</script>
${page.js ? `<script>\n/* spec.js */\n${page.js}\n</script>` : ''}</body>
</html>
`;
}
