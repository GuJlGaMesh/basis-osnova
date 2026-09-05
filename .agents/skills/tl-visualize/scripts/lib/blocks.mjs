// blocks.mjs — рендереры визуальных блоков: JSON-данные → HTML/inline SVG.
//
// Правила, на которых держится файл:
//   - zero-dep: графики рисуются как inline SVG, ничего не грузится из сети;
//   - весь текст из данных проходит через esc() — единственное исключение
//     блок `raw`, он для намеренной ручной вёрстки;
//   - неизвестный тип блока не роняет рендер, а превращается в видимую ошибку
//     на странице (тихо потерянный блок хуже заметной плашки).

import { esc, inline, SERIES_COLORS } from './shell.mjs';

const TONES = ['neutral', 'good', 'warn', 'bad', 'info', 'accent'];
const tone = (t) => (TONES.includes(t) ? t : 'neutral');

// Ширина холста графиков по умолчанию — ровно колонка страницы под паддингами
// карточки. Уже — и справа остаётся пустая треть; шире — появляется прокрутка
// там, где данные помещались. Внутри `row` блок передаёт свой `width`.
const PLOT_W = 1020;
const plotWidth = (b, fallback = PLOT_W) => {
  const w = Number(b.width);
  return Number.isFinite(w) && w >= 240 ? w : fallback;
};

const nfmt = (v) =>
  typeof v === 'number' && Number.isFinite(v)
    ? String(Math.round(v * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : esc(v);

// Ширина глифа подписи оси (12.5px, шрифт страницы) по классам символов —
// замерено в браузере через getComputedTextLength. Шрифт пропорциональный, и
// одной константой тут не обойтись: «.» это 2.7px, а «Ю» — 12.7px, разброс в
// пять раз. Числа — потолок класса, а не среднее: оценка обязана быть НЕ МЕНЬШЕ
// реальной ширины, иначе подпись вылезет за холст. Цена — колонка процентов на
// 15-30 шире необходимого, а это всего лишь пустое место.
const CH_W = [
  [/[ .,:;!|'"`ijlI]/, 4.2],
  [/[()[\]{}/\\\-tfr]/, 5.2],
  [/[0-9]/, 6.8],
  [/[mwMW]/, 11.7],
  [/[a-z]/, 7.4],
  [/[A-Z]/, 9.5],
  [/[жмшщыю]/, 10.4],
  [/[ЖМШЩЮФ]/, 12.8],
  [/[а-яё]/, 8.9],
  [/[А-ЯЁ]/, 9.8],
];
// Тире, «@», «%» и всё незнакомое — по самому широкому глифу шрифта.
const CH_FALLBACK = 12.8;

/** Ширина строки в пикселях — верхняя оценка по таблице классов. */
const textW = (text) => {
  let sum = 0;
  for (const c of String(text ?? '')) {
    const hit = CH_W.find(([re]) => re.test(c));
    sum += hit ? hit[1] : CH_FALLBACK;
  }
  return sum;
};

/**
 * Ширина колонки подписей: по самой длинной, но не уже `min` и не шире `max`.
 * `max` считается от холста, а не константой: на узком графике (`width` внутри
 * `row`) колонка в фиксированные 240px оставляет столбикам полоску в палец.
 * `pad` — зазор до столбиков; его же надо вычесть, отдавая ширину в fitLabel,
 * иначе колонка и обрезка разойдутся на пару пикселей и съедят лишний символ.
 */
const labelColumn = (labels, { min, max, pad }) =>
  Math.min(Math.max(min, max), Math.max(min, ...labels.map((l) => textW(l) + pad)));

/**
 * В SVG нет ни переноса, ни ellipsis: подпись длиннее колонки просто рисуется
 * за левым краем холста и молча теряет начало — а начало у пути как раз то, по
 * чему файл узнают. Обрезаем сами: у пути съедаем голову (имя файла важнее
 * каталога), у обычного текста — хвост. Полный текст остаётся в <title>.
 */
function fitLabel(text, widthPx) {
  const s = String(text ?? '');
  if (textW(s) <= widthPx) return s;
  const fromTail = !/[/\\]/.test(s);
  // Режем по одному символу, а не делим ширину на среднее: символы разной
  // ширины, и «средний» расчёт промахивается на несколько знаков.
  let cut = s;
  while (cut.length > 1 && textW(fromTail ? `${cut}…` : `…${cut}`) > widthPx) {
    cut = fromTail ? cut.slice(0, -1) : cut.slice(1);
  }
  return fromTail ? `${cut}…` : `…${cut}`;
}

/** Жадный перенос строки по словам — для текста внутри SVG (там нет word-wrap). */
function wrap(text, maxChars, maxLines = 3) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, '…');
  }
  return lines.length ? lines : [''];
}

/**
 * Красивые деления оси: 1 / 2 / 2.5 / 5 × 10^n.
 * Верхнее деление всегда >= max — иначе точка ряда уезжает за пределы холста.
 * Из нескольких «красивых» шагов берём тот, при котором вверху остаётся меньше
 * пустоты: шаг, оставляющий треть холста незанятой, врёт про размер значений.
 */
function niceTicks(max, { integer = false } = {}) {
  if (!(max > 0)) return [0, 1];
  let best = null;
  for (const count of [4, 5, 6, 8]) {
    const raw = max / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) {
      const step = m * mag;
      if (step < raw) continue;
      // Данные целые — деления тоже: «12,5 открытых вопроса» не бывает.
      if (integer && !Number.isInteger(step)) continue;
      const top = Math.ceil(max / step) * step;
      const n = Math.round(top / step);
      if (n < 3 || n > 8) continue;
      const score = top / max + Math.abs(n - 5) * 0.03;
      if (!best || score < best.score) best = { step, top, score };
    }
  }
  if (!best) {
    const step = Math.pow(10, Math.ceil(Math.log10(max)));
    best = { step, top: Math.ceil(max / step) * step };
  }
  const ticks = [];
  for (let v = 0; v <= best.top + best.step / 2; v += best.step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

// ── Заголовки и обёртки ──────────────────────────────────────────────

/**
 * Блок без данных. Пустой холст графика выглядит как поломка рендера, а не как
 * «данных нет» — поэтому пустота всегда подписана. Если это не ошибка спеки, а
 * честный ответ, замени блок текстом: страница обязана сказать, чего нет.
 */
const emptyBlock = (b, what = 'данных') => frame(b, `<div class="block-note">Нет ${esc(what)}.</div>`);

function frame(block, inner, { card = true } = {}) {
  const body = card ? `<div class="card">${inner}</div>` : inner;

  // collapsible: деталь не выкидывается со страницы, а прячется под summary.
  // Свёрнутый блок ничего не стоит глазу и остаётся доступен для поиска по странице.
  if (block.collapsible) {
    const summary = block.title ? inline(block.title) : 'Подробности';
    return `<div class="block"><details class="fold"${block.open ? ' open' : ''}>
<summary>${summary}${block.note ? `<span class="f-note">${inline(block.note)}</span>` : ''}</summary>
${body}</details></div>`;
  }

  const head =
    (block.title ? `<div class="block-title">${inline(block.title)}</div>` : '') +
    (block.note ? `<div class="block-note">${inline(block.note)}</div>` : '');
  return `<div class="block">${head}${body}</div>`;
}

// ── Блоки ────────────────────────────────────────────────────────────

// Разделам нужны стабильные id: по ним строится меню в шапке страницы.
let sectionSeq = 0;
export const sectionId = (n) => `sec-${n}`;

/** Разделы в том же порядке, в каком их отрисует renderBlocks — для меню в шапке. */
export function collectSections(blocks) {
  const out = [];
  let n = 0;
  const walk = (list) => {
    for (const b of list ?? []) {
      if (b?.type === 'section') out.push({ id: sectionId(++n), title: String(b.title ?? '') });
      else if (b?.type === 'row') walk(b.blocks);
    }
  };
  walk(blocks);
  return out;
}

function section(b) {
  return `<div class="section" id="${sectionId(++sectionSeq)}"><h2>${inline(b.title ?? '')}</h2>${
    b.note ? `<div class="note">${inline(b.note)}</div>` : ''
  }</div>`;
}

function code(b) {
  const text = String(b.text ?? b.code ?? '');
  if (!text.trim()) return emptyBlock(b, 'текста');
  const body = `<div class="codeblock${b.wrap ? ' wrap' : ''}">${
    b.lang ? `<span class="lang">${esc(b.lang)}</span>` : ''
  }<pre><code>${esc(text)}</code></pre></div>`;
  return frame(b, body, { card: b.card !== false });
}

function steps(b) {
  if (!(b.items ?? []).length) return emptyBlock(b, 'шагов');
  const items = (b.items ?? [])
    .map((i, idx) => {
      const t = tone(i.tone);
      return `<div class="st s-${t}">
  <div class="s-n">${esc(i.step ?? idx + 1)}</div>
  <div class="s-label">${inline(i.label ?? '')}</div>
  ${i.note ? `<div class="s-note">${inline(i.note)}</div>` : ''}
  ${i.status ? `<div class="s-status"><span class="pill t-${tone(i.statusTone ?? i.tone)}">${esc(i.status)}</span></div>` : ''}
</div>`;
    })
    .join('');
  return frame(b, `<div class="steps">${items}</div>`, { card: false });
}

/**
 * Пункт списка: чекбокс из исходника остаётся чекбоксом. Текст задачи почти
 * всегда приходит смесью «строка-заголовок + список», поэтому список
 * распознаётся внутри абзаца, а не только когда им занят весь абзац.
 */
function listItem(text) {
  const box = String(text).match(/^\[( |x|X|-)\]\s+(.*)$/);
  if (!box) return `<li>${inline(text)}</li>`;
  const done = box[1].toLowerCase() === 'x';
  const parked = box[1] === '-';
  return `<li class="li-check${done ? ' is-done' : ''}"><span class="ck" aria-hidden="true">${
    done ? '☑' : parked ? '☒' : '☐'
  }</span>${inline(box[2])}</li>`;
}

function prose(b) {
  const text = String(b.text ?? '');
  const html = text
    .split(/\n{2,}/)
    .map((chunk) => {
      const lines = chunk.split('\n').filter((l) => l.trim());
      const out = [];
      let buf = [];
      let mode = null;
      const flush = () => {
        if (!buf.length) return;
        if (mode === 'ul') out.push(`<ul>${buf.map(listItem).join('')}</ul>`);
        else if (mode === 'ol') out.push(`<ol>${buf.map(listItem).join('')}</ol>`);
        else out.push(`<p>${buf.map(inline).join('<br>')}</p>`);
        buf = [];
      };
      for (const raw of lines) {
        const ul = raw.match(/^\s*[-*]\s+(.*)$/);
        const ol = raw.match(/^\s*\d+[.)]\s+(.*)$/);
        const next = ul ? 'ul' : ol ? 'ol' : 'p';
        if (next !== mode) {
          flush();
          mode = next;
        }
        buf.push(ul ? ul[1] : ol ? ol[1] : raw);
      }
      flush();
      return out.join('');
    })
    .join('');
  return frame(b, `<div class="prose">${html}</div>`, { card: b.card !== false });
}

function callout(b) {
  const t = tone(b.tone ?? 'info');
  return `<div class="block"><div class="callout c-${t}">${
    b.title ? `<div class="c-title">${inline(b.title)}</div>` : ''
  }<div>${inline(b.text ?? '')}</div></div></div>`;
}

/**
 * Спарклайн в плитке: форма ряда без осей. Отвечает на «растёт или падает»,
 * а не «сколько именно» — точные значения живут в `line`, если они нужны.
 */
function sparkline(values, color) {
  const nums = (values ?? []).map(Number).filter(Number.isFinite);
  if (nums.length < 2) return '';
  const w = 104;
  const h = 26;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pts = nums
    .map((v, i) => `${((i / (nums.length - 1)) * (w - 2) + 1).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`)
    .join(' ');
  const last = pts.split(' ').pop().split(',');
  return `<svg class="k-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"></polyline><circle cx="${last[0]}" cy="${last[1]}" r="2.2" fill="${color}"></circle></svg>`;
}

function kpi(b) {
  if (!(b.items ?? []).length) return emptyBlock(b, 'показателей');
  const tiles = (b.items ?? [])
    .map(
      (i) => `<div class="kpi">
  <div class="k-label">${esc(i.label ?? '')}</div>
  <div class="k-value fg-${tone(i.tone)}">${nfmt(i.value)}${
    i.unit ? `<span style="font-size:15px;font-weight:500;color:var(--muted)"> ${esc(i.unit)}</span>` : ''
  }</div>
  ${i.delta ? `<div class="k-delta fg-${tone(i.deltaTone ?? i.tone)}">${esc(i.delta)}</div>` : ''}
  ${sparkline(i.spark, i.tone ? `var(--${tone(i.tone)})` : 'var(--accent)')}
  ${i.note ? `<div class="k-note">${inline(i.note)}</div>` : ''}
</div>`,
    )
    .join('');
  return frame(b, `<div class="kpi-grid">${tiles}</div>`, { card: false });
}

let tableSeq = 0;

/**
 * Раскрывающаяся деталь строки: строка таблицы отвечает «что это», деталь —
 * «что там внутри». Строка — сводка, деталь — всё остальное, поэтому сюда
 * кладут полный текст задачи, а не вторую сводку.
 * Принимает строку (как prose), объект {text, meta, blocks} или массив блоков.
 */
function detailContent(detail) {
  if (detail === null || detail === undefined) return '';
  if (typeof detail === 'string') return prose({ type: 'prose', text: detail, card: false });
  if (Array.isArray(detail)) return renderBlocks(detail);
  const parts = [];
  if (detail.text) parts.push(prose({ type: 'prose', text: detail.text, card: false }));
  if ((detail.meta ?? []).length) {
    parts.push(
      `<div class="rd-meta">${detail.meta
        .map((m) => `<div><span class="m-label">${esc(m.label)}</span>${inline(m.value ?? '')}</div>`)
        .join('')}</div>`,
    );
  }
  if ((detail.blocks ?? []).length) parts.push(renderBlocks(detail.blocks));
  return parts.join('');
}

function table(b) {
  const cols = b.columns ?? [];
  const rows = b.rows ?? [];
  if (!cols.length || !rows.length) return emptyBlock(b, 'строк');
  const id = `tbl-${++tableSeq}`;
  const maxByKey = new Map();
  for (const c of cols) {
    if (c.type === 'bar') {
      maxByKey.set(c.key, Math.max(1, ...rows.map((r) => Math.abs(Number(r[c.key]) || 0))));
    }
  }
  const cell = (c, row) => {
    const v = row[c.key];
    if (c.type === 'pill') {
      const t = tone(row[`${c.key}Tone`] ?? row.tone);
      return v === undefined || v === null || v === '' ? '' : `<span class="pill t-${t}">${esc(v)}</span>`;
    }
    if (c.type === 'bar') {
      const max = maxByKey.get(c.key) || 1;
      const pct = Math.max(0, Math.min(100, (Math.abs(Number(v) || 0) / max) * 100));
      const t = row[`${c.key}Tone`] ?? row.tone;
      const fill = t && TONES.includes(t) ? `var(--${t})` : 'var(--accent)';
      return `<span class="inbar"><span class="ib-track"><i style="width:${pct.toFixed(1)}%;background:${fill}"></i></span><span class="ib-v">${nfmt(v)}</span></span>`;
    }
    if (c.type === 'num') return nfmt(v);
    if (c.type === 'code') return v === undefined || v === null || v === '' ? '' : `<code>${esc(v)}</code>`;
    return inline(v ?? '');
  };
  const cls = (c) =>
    [c.type === 'num' || c.align === 'right' ? 'num' : '', c.align === 'center' ? 'center' : '', c.nowrap ? 'nowrap' : '']
      .filter(Boolean)
      .join(' ');
  const head = cols
    .map(
      (c) =>
        `<th class="${[cls(c), b.sortable ? 'sortable' : ''].filter(Boolean).join(' ')}"${
          c.width ? ` style="width:${esc(c.width)}"` : ''
        }>${esc(c.label ?? c.key)}</th>`,
    )
    .join('');
  // Строка отвечает «что это», деталь — «что внутри». Раскрытие держит полный
  // текст на той же странице, вместо ссылки «смотри исходник».
  const withDetail = rows.filter((r) => r.detail !== undefined && r.detail !== null && r.detail !== '');
  const body = rows
    .map((r, ri) => {
      const detail = r.detail !== undefined && r.detail !== null && r.detail !== '' ? r.detail : null;
      const detailId = `${id}-d${ri}`;
      const classes = [
        r.rowTone && TONES.includes(r.rowTone) ? `rt-${r.rowTone}` : '',
        detail ? 'expandable' : '',
      ].filter(Boolean);
      // Раскрытие — настоящая кнопка внутри ячейки, а не role="button" на <tr>:
      // роль на строке выбивает её из структуры таблицы для скринридера.
      // Клик по всей строке остаётся как удобство и делегирует этой же кнопке.
      const toggleBtn = `<button type="button" class="exp-mark" aria-expanded="false" aria-controls="${detailId}" aria-label="Показать подробности"></button>`;
      const tr = `<tr${classes.length ? ` class="${classes.join(' ')}"` : ''}>${cols
        .map((c, ci) => {
          const sortable = c.type === 'num' || c.type === 'bar';
          const sortAttr = sortable ? ` data-sort="${esc(Number(r[c.key]) || 0)}"` : '';
          const marker = detail && ci === 0 ? toggleBtn : '';
          return `<td class="${[cls(c), b.highlight === c.key ? 'hl-col' : ''].filter(Boolean).join(' ')}"${sortAttr}>${marker}${cell(c, r)}</td>`;
        })
        .join('')}</tr>`;
      if (!detail) return tr;
      return `${tr}<tr class="row-detail" id="${detailId}" hidden><td colspan="${cols.length}"><div class="rd-body">${detailContent(
        detail,
      )}</div></td></tr>`;
    })
    .join('');
  // Фильтр включается сам на длинной таблице: 30 строк без поиска — это склад, а не ответ.
  const filter = b.filter ?? rows.length >= 25;
  const controls = [
    withDetail.length
      ? `<button class="tbl-expand" type="button" data-expand="${id}" aria-expanded="false">Развернуть все</button>`
      : '',
    filter
      ? `<input class="tbl-filter" type="search" data-filter="${id}" placeholder="${esc(
          b.filterPlaceholder ?? 'Фильтр по строкам…',
        )}" aria-label="Фильтр таблицы">`
      : '',
  ].filter(Boolean);
  const toolbar = controls.length ? `<div class="tbl-controls">${controls.join('')}</div>` : '';
  const emptyNote = filter ? `<div class="tbl-empty" id="${id}-empty" style="display:none">Ничего не найдено.</div>` : '';
  return frame(
    b,
    `${toolbar}<div class="scroll-x"><table class="data${
      withDetail.length ? ' has-detail' : ''
    }" id="${id}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${emptyNote}`,
  );
}

function matrix(b) {
  const rows = b.rows ?? [];
  const cols = b.columns ?? [];
  if (!rows.length || !cols.length) return emptyBlock(b, 'данных для матрицы');
  const byKey = new Map();
  for (const c of b.cells ?? []) byKey.set(`${c.row}\u0000${c.col}`, c);
  // Тепловая карта: значение красит фон плотностью, а не категорией. Нужна там,
  // где важна величина (коммитов, обращений, строк), а не оценка «хорошо/плохо».
  const heat = b.heat === true;
  const heatTone = TONES.includes(b.heatTone) ? b.heatTone : 'accent';
  const nums = heat ? (b.cells ?? []).map((c) => Number(c.value)).filter((v) => Number.isFinite(v)) : [];
  const heatMax = Math.max(Number(b.heatMax) || 0, ...nums, 0);
  // Шкала идёт не от 0 до 100% цвета, а от 10 до 60: на полной насыщенности
  // цифра в ячейке перестаёт читаться, а читать её нужно ровно там, где
  // значение максимально. Диапазона в 50 пунктов хватает, чтобы различить плотность.
  const HEAT_MIN = 10;
  const HEAT_MAX = 60;
  const heatBg = (v) => {
    if (!Number.isFinite(v) || heatMax <= 0) return '';
    const pct = v <= 0 ? 0 : Math.round(HEAT_MIN + (v / heatMax) * (HEAT_MAX - HEAT_MIN));
    return ` style="background:color-mix(in srgb, var(--${heatTone}) ${pct}%, var(--surface-2))"`;
  };

  const head = `<tr><th></th>${cols.map((c) => `<th class="col">${esc(c)}</th>`).join('')}</tr>`;
  const body = rows
    .map((r) => {
      const cells = cols
        .map((c) => {
          const cell = byKey.get(`${r}\u0000${c}`);
          if (!cell) return '<td class="empty">—</td>';
          const label = cell.value ?? '';
          const title = cell.note ? ` title="${esc(cell.note)}"` : '';
          // Подпись под значением: ссылка на код видна и на бумаге, а не только под курсором.
          const sub = cell.sub ?? (b.notes ? cell.note : undefined);
          // tone важнее тепла: явно проставленное состояние шкалой не перекрашивается.
          const byHeat = heat && cell.tone === undefined;
          return `<td class="${byHeat ? 'heat' : `t-${tone(cell.tone)}`}"${
            byHeat ? heatBg(Number(cell.value)) : ''
          }${title}>${esc(label)}${sub ? `<span class="m-sub">${esc(sub)}</span>` : ''}</td>`;
        })
        .join('');
      return `<tr><th>${esc(r)}</th>${cells}</tr>`;
    })
    .join('');
  const legend = (b.legend ?? []).length
    ? `<div class="legend">${b.legend
        .map(
          (l) =>
            `<span><span class="sw t-${tone(l.tone)}" style="background:currentColor"></span>${esc(l.label)}</span>`,
        )
        .join('')}</div>`
    : '';
  // Шкала обязательна: без неё насыщенность цвета не переводится обратно в число.
  const scale =
    heat && heatMax > 0
      ? `<div class="legend heat-scale"><span>0</span><span class="hs-ramp" style="background:linear-gradient(90deg, color-mix(in srgb, var(--${heatTone}) ${HEAT_MIN}%, var(--surface-2)), color-mix(in srgb, var(--${heatTone}) ${HEAT_MAX}%, var(--surface-2)))"></span><span>${nfmt(
          heatMax,
        )}${b.unit ? ` ${esc(b.unit)}` : ''}</span></div>`
      : '';
  return frame(b, `<div class="scroll-x"><table class="matrix">${head}${body}</table></div>${legend}${scale}`);
}

function progress(b) {
  if (!(b.items ?? []).length) return emptyBlock(b, 'данных о прогрессе');
  const rows = (b.items ?? [])
    .map((i) => {
      const pct =
        i.percent !== undefined
          ? Number(i.percent)
          : Number(i.total) > 0
            ? (Number(i.done) / Number(i.total)) * 100
            : 0;
      const clamped = Math.max(0, Math.min(100, pct));
      const label =
        i.percent !== undefined ? `${Math.round(clamped)}%` : `${i.done ?? 0} / ${i.total ?? 0} · ${Math.round(clamped)}%`;
      const color = i.tone ? `var(--${tone(i.tone)})` : 'var(--accent)';
      // Цель — засечка на дорожке. Полоса без неё отвечает «сколько сделано»,
      // но не «хватает ли этого», а спрашивают обычно второе.
      // Единицы цели те же, что у самого элемента: с `total` — штуки, с `percent` — проценты.
      const rawTarget = Number(i.target);
      const targetPct =
        i.target === undefined || !Number.isFinite(rawTarget)
          ? null
          : Math.max(
              0,
              Math.min(100, i.percent === undefined && Number(i.total) > 0 ? (rawTarget / Number(i.total)) * 100 : rawTarget),
            );
      const targetMark =
        targetPct === null
          ? ''
          : `<span class="p-target" style="left:${targetPct.toFixed(1)}%" title="Цель: ${esc(i.target)}"></span>`;
      return `<div class="p-label">${inline(i.label ?? '')}${
        i.note ? `<span class="p-note">${inline(i.note)}</span>` : ''
      }</div>
<div class="p-track"><div class="p-fill" style="width:${clamped.toFixed(1)}%;background:${color}"></div>${targetMark}</div>
<div class="p-num">${esc(label)}</div>`;
    })
    .join('');
  return frame(b, `<div class="prog">${rows}</div>`);
}

function cards(b) {
  if (!(b.items ?? []).length) return emptyBlock(b, 'карточек');
  const items = (b.items ?? [])
    .map(
      (i) => `<div class="c b-${tone(i.tone)}">
  <div class="c-head"><div class="c-title">${inline(i.title ?? '')}</div>${
    i.badge ? `<span class="pill t-${tone(i.badgeTone ?? i.tone)}">${esc(i.badge)}</span>` : ''
  }</div>
  ${i.text ? `<div class="c-text">${inline(i.text)}</div>` : ''}
  ${
    (i.meta ?? []).length
      ? `<div class="c-meta">${i.meta
          .map((m) => `<div><span class="m-label">${esc(m.label)}</span>${inline(m.value ?? '')}</div>`)
          .join('')}</div>`
      : ''
  }
</div>`,
    )
    .join('');
  return frame(b, `<div class="cards">${items}</div>`, { card: false });
}

function tree(b) {
  if (!(b.items ?? []).length) return emptyBlock(b, 'узлов');
  const render = (nodes) =>
    `<ul class="tree">${(nodes ?? [])
      .map(
        (n) =>
          `<li><span class="fg-${tone(n.tone)}">${inline(n.label ?? '')}</span>${
            n.meta ? `<span class="t-meta">${inline(n.meta)}</span>` : ''
          }${n.children?.length ? render(n.children) : ''}</li>`,
      )
      .join('')}</ul>`;
  return frame(b, render(b.items));
}

// ── SVG-графики ──────────────────────────────────────────────────────

function bar(b) {
  const data = b.data ?? [];
  if (!data.length) return emptyBlock(b);
  const horizontal = b.horizontal !== false;

  // Составной столбец: категория раскладывается на части одного целого
  // (фаза → сделано/в работе/не начато). Общая длина остаётся сравнимой между
  // категориями, поэтому вопрос «где больше» и вопрос «из чего состоит»
  // отвечаются одной картинкой.
  const stacked = data.some((d) => (d.segments ?? []).length);
  const segsOf = (d) =>
    (d.segments ?? []).map((s) => ({ ...s, value: Math.max(0, Number(s.value) || 0) })).filter((s) => s.value > 0);
  const totalOf = (d) => (stacked && (d.segments ?? []).length ? segsOf(d).reduce((a, s) => a + s.value, 0) : Number(d.value) || 0);

  const values = data.map(totalOf);
  const max = Math.max(1, Number(b.max) || 0, ...values);
  const ticks = niceTicks(max, { integer: values.every(Number.isInteger) });
  const top = ticks[ticks.length - 1];
  // Один ряд — один цвет. Радуга по категориям красива и ничего не значит:
  // цвет здесь освобождён под tone, то есть под смысл.
  const palette = b.palette === 'categorical';
  const color = (d, i) =>
    d.tone ? `var(--${tone(d.tone)})` : palette ? SERIES_COLORS[i % SERIES_COLORS.length] : 'var(--accent)';

  // Цвет сегмента одинаков во всех столбцах: иначе «сделано» будет зелёным в
  // одной фазе и синим в соседней, и легенда перестанет что-либо значить.
  const segLabels = [...new Set(data.flatMap((d) => segsOf(d).map((s) => String(s.label ?? ''))))];
  const segColor = (s) =>
    s.tone ? `var(--${tone(s.tone)})` : s.color ?? SERIES_COLORS[segLabels.indexOf(String(s.label ?? '')) % SERIES_COLORS.length];
  const segLegend = stacked
    ? `<div class="legend">${segLabels
        .map((l) => {
          const sample = data.flatMap(segsOf).find((s) => String(s.label ?? '') === l) ?? {};
          return `<span><span class="sw" style="background:${esc(segColor(sample))}"></span>${esc(l)}</span>`;
        })
        .join('')}</div>`
    : '';
  const valueLabel = (d) => `${nfmt(totalOf(d))}${b.unit ? ` ${b.unit}` : ''}`;
  const segTitle = (d) =>
    stacked && segsOf(d).length ? segsOf(d).map((s) => `${s.label}: ${nfmt(s.value)}`).join(' · ') : '';

  if (horizontal) {
    const rowH = 30;
    const w = plotWidth(b);
    // Правый отступ считаем по самой длинной подписи значения — иначе «7 004 строк»
    // у максимального столбца обрезается краем холста.
    const valueW = Math.max(36, ...data.map((d) => textW(valueLabel(d)) + 12));
    // Колонке имён отдаём максимум 45% свободной ширины: остальное — столбикам,
    // ради которых блок и берут. Что не влезло — обрезается многоточием.
    const labelW = labelColumn(data.map((d) => d.label), { min: 90, max: (w - valueW) * 0.45, pad: 10 });
    const plotW = Math.max(40, w - labelW - valueW);
    const h = data.length * rowH + 34;
    const bars = data
      .map((d, i) => {
        // Отрицательные величины блок не рисует (шкала всегда от нуля) — но и
        // подпись значения не должна уехать влево, на колонку с названиями.
        const total = totalOf(d);
        const len = Math.max(0, (total / top) * plotW);
        const y = 26 + i * rowH;
        const segs = segsOf(d);
        let cursor = labelW;
        const shape = stacked && segs.length
          ? segs
              .map((s) => {
                const sw = (s.value / top) * plotW;
                const x = cursor;
                cursor += sw;
                return `<rect x="${x.toFixed(1)}" y="${y + 3}" width="${Math.max(0.5, sw).toFixed(
                  1,
                )}" height="17" fill="${esc(segColor(s))}"><title>${esc(d.label)} · ${esc(s.label)}: ${nfmt(
                  s.value,
                )}</title></rect>`;
              })
              .join('')
          : `<rect x="${labelW}" y="${y + 3}" width="${Math.max(1, len).toFixed(1)}" height="17" rx="3" fill="${color(d, i)}"></rect>`;
        return `<g><title>${esc(d.label)}: ${nfmt(total)}${segTitle(d) ? ` · ${esc(segTitle(d))}` : ''}</title>
<text class="ax" x="${labelW - 8}" y="${y + 14}" text-anchor="end" style="fill:var(--text);font-size:12.5px">${esc(fitLabel(d.label, labelW - 8))}</text>
${shape}
<text class="ax bar-value" x="${labelW + len + 7}" y="${y + 16}">${nfmt(total)}${b.unit ? ' ' + esc(b.unit) : ''}</text></g>`;
      })
      .join('');
    const grid = ticks
      .map((t) => {
        const x = labelW + (t / top) * plotW;
        return `<line class="grid" x1="${x}" y1="20" x2="${x}" y2="${h - 12}"></line><text class="ax" x="${x}" y="14" text-anchor="middle">${nfmt(t)}</text>`;
      })
      .join('');
    return frame(
      b,
      `<div class="scroll-x"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${grid}${bars}</svg></div>${segLegend}`,
    );
  }

  const w = plotWidth(b);
  const h = Number(b.height) || 300;
  const padL = 48;
  const padB = 46;
  const plotW = w - padL - 16;
  const plotH = h - padB - 20;
  const slot = plotW / Math.max(1, data.length);
  const bw = Math.min(56, slot * 0.62);
  const grid = ticks
    .map((t) => {
      const y = 20 + plotH - (t / top) * plotH;
      return `<line class="grid" x1="${padL}" y1="${y}" x2="${w - 16}" y2="${y}"></line><text class="ax" x="${padL - 8}" y="${y + 4}" text-anchor="end">${nfmt(t)}</text>`;
    })
    .join('');
  const bars = data
    .map((d, i) => {
      const total = totalOf(d);
      const bh = (total / top) * plotH;
      const x = padL + i * slot + (slot - bw) / 2;
      const y = 20 + plotH - bh;
      const lines = wrap(d.label, 12, 2);
      const segs = segsOf(d);
      let cursor = 20 + plotH;
      const shape = stacked && segs.length
        ? segs
            .map((s) => {
              const sh = (s.value / top) * plotH;
              cursor -= sh;
              return `<rect x="${x.toFixed(1)}" y="${cursor.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(
                0.5,
                sh,
              ).toFixed(1)}" fill="${esc(segColor(s))}"><title>${esc(d.label)} · ${esc(s.label)}: ${nfmt(
                s.value,
              )}</title></rect>`;
            })
            .join('')
        : `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, bh).toFixed(
            1,
          )}" rx="3" fill="${color(d, i)}"></rect>`;
      return `<g><title>${esc(d.label)}: ${nfmt(total)}${segTitle(d) ? ` · ${esc(segTitle(d))}` : ''}</title>
${shape}
${lines
  .map(
    (l, li) =>
      `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${20 + plotH + 16 + li * 12}" text-anchor="middle">${esc(l)}</text>`,
  )
  .join('')}</g>`;
    })
    .join('');
  return frame(
    b,
    `<div class="scroll-x"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${grid}${bars}</svg></div>${segLegend}`,
  );
}

function line(b) {
  const xs = b.x ?? [];
  const series = b.series ?? [];
  if (!xs.length || !series.some((s) => (s.values ?? []).length)) return emptyBlock(b, 'ряда данных');
  const all = series.flatMap((s) => (s.values ?? []).map(Number)).filter(Number.isFinite);
  const max = Math.max(1, ...all);
  const ticks = niceTicks(max, { integer: all.every(Number.isInteger) });
  const top = ticks[ticks.length - 1];
  const w = plotWidth(b);
  const h = Number(b.height) || 320;
  const padL = 52;
  const padB = 52;
  const plotW = w - padL - 20;
  const plotH = h - padB - 22;
  const px = (i) => padL + (xs.length > 1 ? (i / (xs.length - 1)) * plotW : plotW / 2);
  const py = (v) => 22 + plotH - ((Number(v) || 0) / top) * plotH;

  const grid = ticks
    .map((t) => {
      const y = py(t);
      return `<line class="grid" x1="${padL}" y1="${y}" x2="${w - 20}" y2="${y}"></line><text class="ax" x="${padL - 8}" y="${y + 4}" text-anchor="end">${nfmt(t)}</text>`;
    })
    .join('');
  const step = Math.max(1, Math.ceil(xs.length / 10));
  const xlabels = xs
    .map((x, i) =>
      i % step === 0
        ? `<text class="ax" x="${px(i).toFixed(1)}" y="${22 + plotH + 18}" text-anchor="middle">${esc(x)}</text>`
        : '',
    )
    .join('');
  const paths = series
    .map((s, si) => {
      const c = SERIES_COLORS[si % SERIES_COLORS.length];
      const pts = (s.values ?? []).map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
      const dots = (s.values ?? [])
        .map(
          (v, i) =>
            `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="3" fill="${c}"><title>${esc(s.name ?? '')} · ${esc(xs[i] ?? i)}: ${nfmt(v)}</title></circle>`,
        )
        .join('');
      return `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"></polyline>${dots}`;
    })
    .join('');
  const legend = series
    .map(
      (s, si) =>
        `<span><span class="sw" style="background:${SERIES_COLORS[si % SERIES_COLORS.length]}"></span>${esc(s.name ?? `Ряд ${si + 1}`)}</span>`,
    )
    .join('');
  return frame(
    b,
    `<div class="scroll-x"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${grid}${xlabels}${paths}</svg></div>${
      series.length > 1 ? `<div class="legend">${legend}</div>` : ''
    }`,
  );
}

function timeline(b) {
  const items = b.items ?? [];
  if (!items.length) return emptyBlock(b, 'этапов');
  const isDate = items.some((i) => typeof i.start === 'string' && !Number.isNaN(Date.parse(i.start)));
  const toNum = (v) => {
    if (typeof v === 'number') return v;
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t / 86400000;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = (v) =>
    isDate ? new Date(Math.round(v) * 86400000).toISOString().slice(0, 10) : String(Math.round(v * 10) / 10);

  const starts = items.map((i) => toNum(i.start));
  const ends = items.map((i, idx) => Math.max(toNum(i.end ?? i.start), starts[idx]));
  const min = starts.length ? Math.min(...starts) : 0;
  const max = Math.max(...ends, min + 1);
  const span = Math.max(1e-9, max - min);

  const w = plotWidth(b);
  const labelW = labelColumn(items.map((i) => i.label), { min: 120, max: (w - 24) * 0.45, pad: 17 });
  const plotW = Math.max(60, w - labelW - 24);
  const rowH = 27;

  // Группы рисуются как подзаголовки-строки — порядок сохраняется как в данных.
  const rows = [];
  let lastGroup = null;
  for (const it of items) {
    if (it.group && it.group !== lastGroup) {
      rows.push({ group: it.group });
      lastGroup = it.group;
    }
    rows.push({ item: it });
  }
  const h = rows.length * rowH + 40 + ((b.markers ?? []).some((m) => m.label) ? 12 : 0);

  // Крайние подписи прижимаются к своей стороне: по центру они уезжают за холст
  // и обрезаются ровно на дате окончания — самой нужной подписи на шкале.
  // Делений столько, сколько влезает подписей: пять дат на короткой шкале
  // налезают друг на друга и превращают ось в кашу.
  const tickW = Math.max(textW(fmt(min)), textW(fmt(max))) + 20;
  const steps = Math.max(1, Math.min(4, Math.floor(plotW / tickW)));
  const ticks = Array.from({ length: steps + 1 }, (_, i) => min + (i / steps) * span);
  const grid = ticks
    .map((t, i) => {
      const x = labelW + ((t - min) / span) * plotW;
      const anchor = i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle';
      return `<line class="grid" x1="${x.toFixed(1)}" y1="24" x2="${x.toFixed(1)}" y2="${h - 10}"></line><text class="ax" x="${x.toFixed(1)}" y="16" text-anchor="${anchor}">${esc(fmt(t))}</text>`;
    })
    .join('');

  // Вертикальные отметки: «сегодня», дедлайн, дата релиза — то, относительно чего
  // читают всю шкалу.
  const markers = (b.markers ?? [])
    .map((m) => {
      const at = toNum(m.at ?? m.start);
      if (!Number.isFinite(at)) return '';
      const x = labelW + ((at - min) / span) * plotW;
      const stroke = m.tone ? `var(--${tone(m.tone)})` : 'var(--accent)';
      const anchor = x > labelW + plotW - 60 ? 'end' : 'start';
      return `<g><line x1="${x.toFixed(1)}" y1="22" x2="${x.toFixed(1)}" y2="${h - 10}" stroke="${stroke}" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.85"></line>${
        m.label
          ? `<text class="ax edge-label" x="${(x + (anchor === 'end' ? -5 : 5)).toFixed(1)}" y="${h - 1}" text-anchor="${anchor}" style="fill:${stroke}">${esc(m.label)}</text>`
          : ''
      }</g>`;
    })
    .join('');

  let y = 30;
  const body = rows
    .map((r) => {
      if (r.group) {
        const out = `<text class="ax" x="0" y="${y + 15}" style="font-weight:600;fill:var(--text)">${esc(
          fitLabel(r.group, labelW - 8),
        )}</text>`;
        y += rowH;
        return out;
      }
      const it = r.item;
      const s = toNum(it.start);
      const e = Math.max(toNum(it.end ?? it.start), s);
      const x = labelW + ((s - min) / span) * plotW;
      const fill = it.tone ? `var(--${tone(it.tone)})` : SERIES_COLORS[0];
      // Веха (нулевая длительность) рисуется ромбом: полоска в 4 пикселя
      // читается как «очень короткий этап», а это не этап вообще.
      const milestone = it.milestone === true || e === s;
      const bw = Math.max(4, ((e - s) / span) * plotW);
      const shape = milestone
        ? `<path d="M ${x.toFixed(1)} ${y + 4} l 7 7.5 l -7 7.5 l -7 -7.5 z" fill="${fill}"></path>`
        : `<rect x="${x.toFixed(1)}" y="${y + 4}" width="${bw.toFixed(1)}" height="15" rx="3" fill="${fill}" opacity="0.9"></rect>`;
      const noteX = milestone ? x + 12 : x + bw + 7;
      const out = `<g><title>${esc(it.label)}: ${esc(fmt(s))}${milestone ? '' : ` → ${esc(fmt(e))}`}${it.note ? ` · ${esc(it.note)}` : ''}</title>
<text class="ax" x="${labelW - 15}" y="${y + 16}" text-anchor="end" style="fill:var(--text);font-size:12.5px">${esc(fitLabel(it.label, labelW - 15))}</text>
${shape}
${it.note ? `<text class="ax edge-label" x="${noteX.toFixed(1)}" y="${y + 16}">${esc(it.note)}</text>` : ''}</g>`;
      y += rowH;
      return out;
    })
    .join('');

  return frame(
    b,
    `<div class="scroll-x"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${grid}${markers}${body}</svg></div>`,
  );
}

/**
 * `donut` — из чего состоит целое. Отвечает на «какая доля», а не «сколько»:
 * точные величины читаются в легенде рядом, потому что на глаз сектор в 12%
 * от сектора в 15% не отличается.
 */
function donut(b) {
  const data = (b.data ?? []).map((d) => ({ ...d, value: Math.max(0, Number(d.value) || 0) })).filter((d) => d.value > 0);
  if (!data.length) return emptyBlock(b, 'долей');
  const sum = data.reduce((a, d) => a + d.value, 0);
  if (!(sum > 0)) return emptyBlock(b, 'ненулевых значений');
  const R = 62;
  const SW = 24;
  const C = 2 * Math.PI * R;
  const size = (R + SW / 2 + 4) * 2;
  const color = (d, i) => (d.tone ? `var(--${tone(d.tone)})` : d.color ?? SERIES_COLORS[i % SERIES_COLORS.length]);

  let offset = 0;
  const arcs = data
    .map((d, i) => {
      const len = (d.value / sum) * C;
      const arc = `<circle class="dn-arc" cx="${size / 2}" cy="${size / 2}" r="${R}" fill="none" stroke="${esc(
        color(d, i),
      )}" stroke-width="${SW}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(
        2,
      )}"><title>${esc(d.label)}: ${nfmt(d.value)} · ${Math.round((d.value / sum) * 100)}%</title></circle>`;
      offset += len;
      return arc;
    })
    .join('');

  const center = b.center ?? nfmt(b.total ?? sum);
  const legend = data
    .map(
      (d, i) => `<div class="dn-row"><span class="sw" style="background:${esc(color(d, i))}"></span>
<span class="dn-label">${inline(d.label ?? '')}</span>
<span class="dn-val">${nfmt(d.value)}</span><span class="dn-pct">${Math.round((d.value / sum) * 100)}%</span></div>`,
    )
    .join('');

  return frame(
    b,
    `<div class="donut">
<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">
<g transform="rotate(-90 ${size / 2} ${size / 2})">${arcs}</g>
<text class="dn-center" x="${size / 2}" y="${size / 2 + 2}" text-anchor="middle">${esc(center)}</text>
${b.centerLabel ? `<text class="dn-center-label" x="${size / 2}" y="${size / 2 + 20}" text-anchor="middle">${esc(b.centerLabel)}</text>` : ''}
</svg>
<div class="dn-legend">${legend}</div></div>`,
  );
}

/**
 * `scatter` — две числовые оси сразу: трудоёмкость × ценность, риск × стоимость.
 * Матрица берёт категории, точечная — величины, и только она показывает, что
 * «дорого и бесполезно» и «дёшево и бесполезно» — разные вещи.
 * `xSplit` / `ySplit` делят поле на квадранты, `quadrants` подписывает их
 * в порядке [левый верх, правый верх, левый низ, правый низ].
 */
function scatter(b) {
  const points = (b.points ?? []).filter((p) => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
  if (!points.length) return emptyBlock(b, 'точек');
  const w = plotWidth(b, 760);
  const h = Number(b.height) || 420;
  const padL = 58;
  const padB = 46;
  const padT = 20;
  const padR = 26;
  const plotW = w - padL - padR;
  const plotH = h - padB - padT;

  const xs = points.map((p) => Number(p.x));
  const ys = points.map((p) => Number(p.y));
  const xTicks = niceTicks(Math.max(Number(b.xMax) || 0, ...xs), { integer: xs.every(Number.isInteger) });
  const yTicks = niceTicks(Math.max(Number(b.yMax) || 0, ...ys), { integer: ys.every(Number.isInteger) });
  const xTop = xTicks[xTicks.length - 1];
  const yTop = yTicks[yTicks.length - 1];
  const px = (v) => padL + (Number(v) / xTop) * plotW;
  const py = (v) => padT + plotH - (Number(v) / yTop) * plotH;

  const grid = [
    ...xTicks.map(
      (t) =>
        `<line class="grid" x1="${px(t).toFixed(1)}" y1="${padT}" x2="${px(t).toFixed(1)}" y2="${padT + plotH}"></line><text class="ax" x="${px(
          t,
        ).toFixed(1)}" y="${padT + plotH + 16}" text-anchor="middle">${nfmt(t)}</text>`,
    ),
    ...yTicks.map(
      (t) =>
        `<line class="grid" x1="${padL}" y1="${py(t).toFixed(1)}" x2="${padL + plotW}" y2="${py(t).toFixed(
          1,
        )}"></line><text class="ax" x="${padL - 8}" y="${(py(t) + 4).toFixed(1)}" text-anchor="end">${nfmt(t)}</text>`,
    ),
  ].join('');

  // Квадранты: линии раздела плюс подписи в углах поля, а не у точек —
  // подпись у точки читалась бы как её собственная метка.
  const hasSplit = Number.isFinite(Number(b.xSplit)) && Number.isFinite(Number(b.ySplit));
  const splits = hasSplit
    ? `<line class="q-split" x1="${px(b.xSplit).toFixed(1)}" y1="${padT}" x2="${px(b.xSplit).toFixed(1)}" y2="${padT + plotH}"></line>
<line class="q-split" x1="${padL}" y1="${py(b.ySplit).toFixed(1)}" x2="${padL + plotW}" y2="${py(b.ySplit).toFixed(1)}"></line>`
    : '';
  const qLabels =
    hasSplit && (b.quadrants ?? []).length
      ? [
          { t: b.quadrants[0], x: padL + 8, y: padT + 16, anchor: 'start' },
          { t: b.quadrants[1], x: padL + plotW - 8, y: padT + 16, anchor: 'end' },
          { t: b.quadrants[2], x: padL + 8, y: padT + plotH - 8, anchor: 'start' },
          { t: b.quadrants[3], x: padL + plotW - 8, y: padT + plotH - 8, anchor: 'end' },
        ]
          .filter((q) => q.t)
          .map((q) => `<text class="q-label" x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}" text-anchor="${q.anchor}">${esc(q.t)}</text>`)
          .join('')
      : '';

  const groups = [...new Set(points.map((p) => p.group).filter(Boolean))];
  const dots = points
    .map((p) => {
      const fill = p.tone
        ? `var(--${tone(p.tone)})`
        : p.group
          ? SERIES_COLORS[groups.indexOf(p.group) % SERIES_COLORS.length]
          : 'var(--accent)';
      const x = px(p.x);
      const y = py(p.y);
      // Подпись уходит влево у правого края — иначе она обрезается там, где точка
      // как раз самая интересная (максимум по обеим осям).
      const flip = x > padL + plotW - 90;
      return `<g><title>${esc(p.label ?? '')}: ${esc(b.xLabel ?? 'x')} ${nfmt(p.x)} · ${esc(b.yLabel ?? 'y')} ${nfmt(p.y)}${
        p.note ? ` · ${esc(p.note)}` : ''
      }</title>
<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Number(p.size) > 0 ? Math.min(18, Number(p.size)) : 6}" fill="${fill}" fill-opacity="0.75" stroke="${fill}" stroke-width="1.5"></circle>
${p.label ? `<text class="edge-label" x="${(x + (flip ? -10 : 10)).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${flip ? 'end' : 'start'}">${esc(p.label)}</text>` : ''}</g>`;
    })
    .join('');

  const axisLabels = `${
    b.xLabel
      ? `<text class="ax axis-name" x="${(padL + plotW / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle">${esc(b.xLabel)}</text>`
      : ''
  }${
    b.yLabel
      ? `<text class="ax axis-name" transform="rotate(-90 14 ${(padT + plotH / 2).toFixed(1)})" x="14" y="${(
          padT +
          plotH / 2
        ).toFixed(1)}" text-anchor="middle">${esc(b.yLabel)}</text>`
      : ''
  }`;

  const legend = groups.length
    ? `<div class="legend">${groups
        .map(
          (g, i) =>
            `<span><span class="sw" style="background:${SERIES_COLORS[i % SERIES_COLORS.length]}"></span>${esc(g)}</span>`,
        )
        .join('')}</div>`
    : '';

  return frame(
    b,
    `<div class="scroll-x"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${grid}${splits}${qLabels}${dots}${axisLabels}</svg></div>${legend}`,
  );
}

/**
 * `board` — карточки, разложенные по колонкам-состояниям. Та же информация, что
 * в таблице со статусом, но отвечает на другой вопрос: не «в каком состоянии
 * эта задача», а «сколько всего застряло вот здесь».
 */
function board(b) {
  const columns = (b.columns ?? []).filter(Boolean);
  if (!columns.length) return emptyBlock(b, 'колонок');
  const cols = columns
    .map((c) => {
      const items = c.items ?? [];
      const cards = items.length
        ? items
            .map(
              (i) => `<div class="bd-card b-${tone(i.tone ?? c.tone)}">
  <div class="bd-title">${inline(i.title ?? '')}</div>
  ${i.text ? `<div class="bd-text">${inline(i.text)}</div>` : ''}
  ${
    (i.meta ?? []).length || i.badge
      ? `<div class="bd-meta">${i.badge ? `<span class="pill t-${tone(i.badgeTone ?? i.tone ?? c.tone)}">${esc(i.badge)}</span>` : ''}${(
          i.meta ?? []
        )
          .map((m) => `<span class="bd-m">${esc(m)}</span>`)
          .join('')}</div>`
      : ''
  }
</div>`,
            )
            .join('')
        : '<div class="bd-empty">пусто</div>';
      return `<div class="bd-col">
<div class="bd-head fg-${tone(c.tone)}">${inline(c.title ?? '')}<span class="bd-count">${items.length}</span></div>
${cards}</div>`;
    })
    .join('');
  return frame(b, `<div class="board">${cols}</div>`, { card: false });
}

/**
 * `svg` — своя картинка на общих токенах страницы. То же, что `raw`, но с
 * рамкой, заголовком, прокруткой и координатной сеткой уже на месте: рисунок,
 * которого нет в наборе, не должен обходиться дороже, чем готовый блок.
 * Содержимое НЕ экранируется — см. `raw`.
 */
function svgBlock(b) {
  const content = String(b.content ?? b.svg ?? '');
  if (!content.trim()) return emptyBlock(b, 'содержимого');
  const viewBox = b.viewBox ?? `0 0 ${Number(b.width) || 760} ${Number(b.height) || 320}`;
  const parts = String(viewBox).trim().split(/\s+/).map(Number);
  const w = Number(b.width) || (Number.isFinite(parts[2]) ? parts[2] : 760);
  const h = Number(b.height) || (Number.isFinite(parts[3]) ? parts[3] : 320);
  return frame(
    b,
    `<div class="scroll-x"><svg viewBox="${esc(viewBox)}" width="${w}" height="${h}" role="img"${
      b.ariaLabel ? ` aria-label="${esc(b.ariaLabel)}"` : ''
    }>${content}</svg></div>`,
    { card: b.card !== false },
  );
}

// Маркер-стрелка объявляется внутри каждого svg — id должен быть уникальным
// на странице, иначе второй граф ссылается на defs первого.
let graphSeq = 0;

function graph(b) {
  const nodes = b.nodes ?? [];
  const edges = (b.edges ?? []).filter((e) => nodes.some((n) => n.id === e.from) && nodes.some((n) => n.id === e.to));
  if (!nodes.length) return emptyBlock(b, 'узлов');
  const arrowId = `arrow-${++graphSeq}`;

  // Слои: layer(to) = max(layer(from) + 1). Итераций не больше числа узлов —
  // это же и защита от цикла в данных (цикл просто перестанет расти).
  const layer = new Map(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const e of edges) {
      const want = layer.get(e.from) + 1;
      if (want > layer.get(e.to)) {
        layer.set(e.to, want);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Схлопываем номера слоёв в плотный ряд 0..N-1: цикл в данных разгоняет
  // счётчик и оставляет дыры, а по дыре геометрия считается в NaN.
  const dense = new Map([...new Set(nodes.map((n) => layer.get(n.id)))].sort((a, c) => a - c).map((v, i) => [v, i]));
  for (const n of nodes) layer.set(n.id, dense.get(layer.get(n.id)));

  const NW = 178;
  const GAP_LAYER = 74; // между слоями
  const GAP_SIB = 18; // между соседями внутри слоя
  const layers = [];
  for (const n of nodes) {
    const l = layer.get(n.id);
    (layers[l] ??= []).push(n);
  }

  // Геометрия узлов
  const box = new Map();
  for (const n of nodes) {
    const lines = wrap(n.label ?? n.id, 24, 3);
    box.set(n.id, { lines, w: NW, h: 14 + lines.length * 16 + (n.meta ? 15 : 0) });
  }

  // Ориентация: считаем натуральную ширину обеих раскладок и берём ту, что уже.
  // Длинная цепочка (типичный план) в вертикали помещается в колонку страницы,
  // широкий веер — в горизонтали. Размер шрифта фиксированный, схема никогда не
  // масштабируется вниз, поэтому «уже» здесь буквально означает «меньше прокрутки».
  const widthH = layers.length * (NW + GAP_LAYER) - GAP_LAYER;
  const maxCol = Math.max(...layers.map((c) => c.length));
  const widthV = maxCol * (NW + GAP_SIB) - GAP_SIB;
  const vertical = b.direction === 'vertical' || (b.direction !== 'horizontal' && widthV < widthH);

  // Один проход барицентра: узел тянется к среднему положению предшественников
  // вдоль оси слоя. Без него рёбра пересекаются тем сильнее, чем шире веер.
  const pos = new Map();
  const orderColumn = (col, axis) => {
    const bary = new Map(
      col.map((n) => {
        const preds = edges.filter((e) => e.to === n.id).map((e) => pos.get(e.from)?.[axis]);
        const known = preds.filter((v) => v !== undefined);
        return [n.id, known.length ? known.reduce((a, c) => a + c, 0) / known.length : Number.MAX_SAFE_INTEGER];
      }),
    );
    col.sort((a, c) => bary.get(a.id) - bary.get(c.id));
  };

  let w;
  let h;
  if (vertical) {
    const colWidths = layers.map((col) => col.length * (NW + GAP_SIB) - GAP_SIB);
    const maxW = Math.max(...colWidths, 0);
    let y = 24;
    layers.forEach((col, li) => {
      if (li > 0) orderColumn(col, 'x');
      let x = 8 + (maxW - colWidths[li]) / 2;
      for (const n of col) {
        pos.set(n.id, { x, y });
        x += NW + GAP_SIB;
      }
      y += Math.max(...col.map((n) => box.get(n.id).h)) + GAP_LAYER;
    });
    w = 16 + maxW;
    h = y - GAP_LAYER + 24;
  } else {
    const colHeights = layers.map((col) => col.reduce((s, n) => s + box.get(n.id).h + GAP_SIB, -GAP_SIB));
    const maxH = Math.max(...colHeights, 0);
    layers.forEach((col, li) => {
      if (li > 0) orderColumn(col, 'y');
      let y = 24 + (maxH - colHeights[li]) / 2;
      for (const n of col) {
        pos.set(n.id, { x: 8 + li * (NW + GAP_LAYER), y });
        y += box.get(n.id).h + GAP_SIB;
      }
    });
    w = 16 + widthH;
    h = maxH + 48;
  }

  // Стрелка красится в цвет ребра, поэтому маркер нужен на каждый использованный
  // тон: один общий серый маркер на красной линии читается как чужая стрелка.
  const edgeTones = [...new Set(edges.map((e) => (e.tone && TONES.includes(e.tone) ? e.tone : 'default')))];
  const markerId = (t) => `${arrowId}-${t}`;
  const defs = edgeTones
    .map(
      (t) =>
        `<marker id="${markerId(t)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M 0 0 L 10 5 L 0 10 z" fill="${t === 'default' ? 'var(--muted)' : `var(--${t})`}" opacity="${t === 'default' ? '0.7' : '0.95'}"></path></marker>`,
    )
    .join('');

  const edgeSvg = edges
    .map((e) => {
      const a = pos.get(e.from);
      const c = pos.get(e.to);
      const ha = box.get(e.from).h;
      const hc = box.get(e.to).h;
      const [x1, y1, x2, y2] = vertical
        ? [a.x + NW / 2, a.y + ha, c.x + NW / 2, c.y]
        : [a.x + NW, a.y + ha / 2, c.x, c.y + hc / 2];
      const d = vertical
        ? `M ${x1} ${y1} C ${x1} ${y1 + Math.max(20, (y2 - y1) / 2)}, ${x2} ${y2 - Math.max(20, (y2 - y1) / 2)}, ${x2} ${y2 - 7}`
        : `M ${x1} ${y1} C ${x1 + Math.max(24, (x2 - x1) / 2)} ${y1}, ${x2 - Math.max(24, (x2 - x1) / 2)} ${y2}, ${x2 - 7} ${y2}`;
      const t = e.tone && TONES.includes(e.tone) ? e.tone : 'default';
      const style = [
        t === 'default' ? '' : `stroke:var(--${t});opacity:0.9`,
        e.dashed ? 'stroke-dasharray:6 4' : '',
      ]
        .filter(Boolean)
        .join(';');
      return `<path class="edge" d="${d}"${style ? ` style="${style}"` : ''} marker-end="url(#${markerId(t)})">${
        e.label ? `<title>${esc(e.label)}</title>` : ''
      }</path>${
        e.label
          ? `<text class="edge-label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle">${esc(e.label)}</text>`
          : ''
      }`;
    })
    .join('');

  // Группа — категориальная принадлежность узла (фаза, слой, команда). Она красит
  // полоску слева, а tone остаётся за рамкой: цвет-категория и цвет-состояние
  // не должны драться за один канал.
  const groups = [...new Set(nodes.map((n) => n.group).filter(Boolean))];
  const groupColor = (g) => SERIES_COLORS[groups.indexOf(g) % SERIES_COLORS.length];

  const nodeSvg = nodes
    .map((n) => {
      const g = box.get(n.id);
      const { x, y } = pos.get(n.id);
      const accent = n.tone ? `var(--${tone(n.tone)})` : 'var(--border)';
      return `<g><title>${esc(n.label ?? n.id)}${n.meta ? ` · ${esc(n.meta)}` : ''}${n.group ? ` · ${esc(n.group)}` : ''}</title>
<rect class="node-box" x="${x}" y="${y}" width="${g.w}" height="${g.h}" rx="8" stroke="${accent}" stroke-width="1.5"></rect>
${n.group ? `<rect x="${x + 1}" y="${y + 7}" width="3.5" height="${g.h - 14}" rx="2" fill="${groupColor(n.group)}"></rect>` : ''}
${g.lines
  .map((l, li) => `<text class="node-label" x="${x + 12}" y="${y + 22 + li * 16}">${esc(l)}</text>`)
  .join('')}
${n.meta ? `<text class="node-meta" x="${x + 12}" y="${y + 22 + g.lines.length * 16}">${esc(n.meta)}</text>` : ''}</g>`;
    })
    .join('');

  // Схема никогда не ужимается под ширину страницы (иначе подписи уезжают в
  // нечитаемые 6px) — вместо этого контейнер прокручивается, о чём и говорим.
  const hint = w > 1080 ? '<div class="block-note scroll-hint">Схема шире экрана — прокрути по горизонтали.</div>' : '';

  const legendItems = (b.legend ?? []).length
    ? b.legend.map((l) => ({ label: l.label, color: l.tone ? `var(--${tone(l.tone)})` : l.color ?? 'var(--muted)' }))
    : groups.map((g) => ({ label: g, color: groupColor(g) }));
  const legend = legendItems.length
    ? `<div class="legend">${legendItems
        .map((l) => `<span><span class="sw" style="background:${esc(l.color)}"></span>${esc(l.label)}</span>`)
        .join('')}</div>`
    : '';

  return frame(
    b,
    `<div class="scroll-x"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<defs>${defs}</defs>
${edgeSvg}${nodeSvg}</svg></div>${legend}${hint}`,
  );
}

// ── Диспетчер ────────────────────────────────────────────────────────

const RENDERERS = {
  section,
  prose,
  callout,
  kpi,
  table,
  matrix,
  progress,
  cards,
  tree,
  steps,
  bar,
  line,
  timeline,
  graph,
  donut,
  scatter,
  board,
  code,
  svg: svgBlock,
  raw: (b) => `<div class="block">${b.html ?? ''}</div>`,
  row: (b) => `<div class="block row-grid">${renderBlocks(b.blocks ?? [])}</div>`,
};

export const BLOCK_TYPES = Object.keys(RENDERERS);

/** Одна страница — один прогон: счётчики id начинаются заново. */
export function renderDocument(blocks) {
  sectionSeq = 0;
  tableSeq = 0;
  graphSeq = 0;
  return renderBlocks(blocks);
}

export function renderBlocks(blocks) {
  return (blocks ?? [])
    .map((b) => {
      const fn = RENDERERS[b?.type];
      if (!fn) {
        return `<div class="block"><div class="callout c-bad"><div class="c-title">Неизвестный тип блока: ${esc(
          b?.type,
        )}</div><div>Допустимые: ${BLOCK_TYPES.join(', ')}</div></div></div>`;
      }
      try {
        return fn(b);
      } catch (err) {
        return `<div class="block"><div class="callout c-bad"><div class="c-title">Блок «${esc(
          b.type,
        )}» не отрисовался</div><div>${esc(err.message)}</div></div></div>`;
      }
    })
    .join('\n');
}
