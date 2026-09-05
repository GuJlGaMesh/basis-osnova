#!/usr/bin/env node
// render.mjs — собирает самодостаточную HTML-страницу из JSON-описания блоков.
//
// Usage:
//   node <skill-dir>/scripts/render.mjs <spec.json> [-o <out.html>]
//   node <skill-dir>/scripts/render.mjs --stdin -o <out.html>     # spec из stdin
//   node <skill-dir>/scripts/render.mjs --gallery [-o <out.html>] # витрина всех блоков
//   node <skill-dir>/scripts/render.mjs --list                    # типы блоков и когда их брать
//
// Формат spec:
//   { "title": "...", "subtitle": "...", "source": "...",
//     "intro": "1-3 фразы: о чём документ и зачем эта страница",  // обязательна
//     "layout": "wide" | "narrow",       // ширина колонки страницы
//     "css": "...", "js": "...",         // собственные стили и скрипт страницы
//     "blocks": [ { "type": "kpi", ... }, ... ] }
//
// Вывод по умолчанию: .tl-ai-kit/visualizations/<slug>.html (slug из title).
// Если файл ложится внутрь .tl-ai-kit/, скрипт дописывает `visualizations/`
// в .tl-ai-kit/.gitignore — визуализация расходник, в репозиторий не едет.
//
// Exit codes: 0 — OK; 1 — ошибка чтения/записи или битый JSON; 2 — неверные аргументы.

import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import * as path from 'node:path';
import { renderPage } from './lib/shell.mjs';
import { renderDocument, collectSections, BLOCK_TYPES } from './lib/blocks.mjs';
import { SAMPLES, gallerySpec } from './lib/gallery.mjs';

const argv = process.argv.slice(2);

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
  process.stdout.write(
    [
      'render.mjs — JSON с блоками → один самодостаточный .html',
      '',
      '  node scripts/render.mjs <spec.json> [-o <out.html>]',
      '  node scripts/render.mjs --stdin -o <out.html>',
      '  node scripts/render.mjs --gallery [-o <out.html>]',
      '  node scripts/render.mjs --list',
      '',
      `Типы блоков: ${BLOCK_TYPES.join(', ')}`,
      'Формы данных: references/BLOCKS.md',
      '',
    ].join('\n'),
  );
  process.exit(argv.length === 0 ? 2 : 0);
}

if (argv.includes('--list')) {
  const pad = Math.max(...SAMPLES.map((s) => s.type.length)) + 1;
  for (const s of SAMPLES) process.stdout.write(`${s.type.padEnd(pad)} ${s.when}\n`);
  process.exit(0);
}

const outIndex = argv.findIndex((a) => a === '-o' || a === '--out');
const explicitOut = outIndex >= 0 ? argv[outIndex + 1] : undefined;
if (outIndex >= 0 && !explicitOut) fail('-o требует путь к файлу');

let spec;
if (argv.includes('--gallery')) {
  spec = gallerySpec();
} else if (argv.includes('--stdin')) {
  let raw = '';
  try {
    raw = readFileSync(0, 'utf8');
  } catch (err) {
    fail(`не смог прочитать stdin: ${err.message}`, 1);
  }
  spec = parse(raw, '<stdin>');
} else {
  // Позиционный аргумент — путь к spec. Пропускаем значение -o, но только если -o вообще был:
  // при outIndex === -1 проверка «i !== outIndex + 1» съела бы самый первый аргумент.
  const skipIndex = outIndex >= 0 ? outIndex + 1 : -1;
  const specPath = argv.find((a, i) => !a.startsWith('-') && i !== skipIndex);
  if (!specPath) fail('не указан spec.json (или --stdin / --gallery)');
  if (!existsSync(specPath)) fail(`нет файла ${specPath}`, 1);
  spec = parse(readFileSync(specPath, 'utf8'), specPath);
}

function parse(raw, where) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`битый JSON в ${where}: ${err.message}`, 1);
  }
}

if (!spec || typeof spec !== 'object') fail('spec должен быть объектом', 1);
if (!Array.isArray(spec.blocks)) fail('в spec нет массива blocks', 1);

// Вводка не влияет на рендер, но без неё страница не отвечает читателю,
// который не открывал источник: что это за документ и зачем страница.
// Не ошибка — предупреждение: чинить это агенту, а не падать на рендере.
const intro = String(spec.intro ?? '').trim();
if (!intro) {
  process.stderr.write(
    'предупреждение: в spec нет intro — страница не скажет, о чём документ и зачем она собрана\n',
  );
} else if (intro.length > 600) {
  process.stderr.write(
    `предупреждение: intro на ${intro.length} символов — вводка это 1-3 фразы, а не пересказ документа\n`,
  );
}

// `width` сужает холст графика — он нужен только внутри `row`, где график делит
// строку с соседом. На блоке верхнего уровня он оставляет полкарточки пустыми,
// а подписи жмёт в обрезанную колонку. Ошибка частая: значение копируют из
// примера про `row`.
const narrowTopLevel = spec.blocks
  .filter((b) => b && b.type !== 'row' && Number.isFinite(Number(b.width)))
  .map((b) => `${b.type}${b.title ? ` «${b.title}»` : ''}`);
if (narrowTopLevel.length) {
  process.stderr.write(
    `предупреждение: width на блоке верхнего уровня (${narrowTopLevel.join(
      ', ',
    )}) — он нужен только внутри row; убери, и график займёт всю ширину карточки\n`,
  );
}

// Имя файла всегда ASCII: кириллица в путях ломает часть инструментов и ссылок.
const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const slugify = (s) =>
  String(s || 'visualization')
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => TRANSLIT[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'visualization';

const outPath = explicitOut ?? path.join('.tl-ai-kit', 'visualizations', `${slugify(spec.title)}.html`);

const html = renderPage({
  title: spec.title,
  subtitle: spec.subtitle,
  intro,
  source: spec.source,
  generated: spec.generated ?? new Date().toISOString().slice(0, 10),
  css: spec.css,
  js: spec.js,
  layout: spec.layout,
  sections: spec.nav === false ? [] : collectSections(spec.blocks),
  body: renderDocument(spec.blocks),
});

try {
  mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
} catch (err) {
  fail(`не смог записать ${outPath}: ${err.message}`, 1);
}

ensureIgnored(outPath);

process.stdout.write(`${outPath}\n`);

/**
 * Визуализация — расходник. Если она легла в .tl-ai-kit/, дописываем правило
 * в .tl-ai-kit/.gitignore (файл append-only, чужие строки не трогаем).
 */
function ensureIgnored(target) {
  const rel = path.relative(process.cwd(), path.resolve(target)).replace(/\\/g, '/');
  const m = rel.match(/^(.*\.tl-ai-kit)\/(.+)\//);
  if (!m) return;
  const rule = `${m[2].split('/')[0]}/`;
  const ignorePath = path.join(m[1], '.gitignore');
  try {
    const current = existsSync(ignorePath) ? readFileSync(ignorePath, 'utf8') : '';
    if (current.split(/\r?\n/).some((l) => l.trim() === rule)) return;
    appendFileSync(ignorePath, `${current && !current.endsWith('\n') ? '\n' : ''}${rule}\n`, 'utf8');
  } catch {
    // .gitignore не критичен для результата — молча продолжаем
  }
}
