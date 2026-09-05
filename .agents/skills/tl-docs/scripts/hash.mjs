#!/usr/bin/env node
// Вычисляет SHA-256 содержимого файла с нормализацией EOL к LF.
// Используется скиллом tl-docs для детекции человеческих правок между прогонами.
//
// Usage:
//   node <skill-dir>/scripts/hash.mjs <path>
//   node <skill-dir>/scripts/hash.mjs <path> outside-markers
//
// Режим outside-markers вырезает перед хешированием известные managed-блоки
// (нужно для корневого AGENTS.md, где скилл владеет только текстом вне чужих
// managed-островов). Allowlist явный, двух форм:
//   - slash-close (tl-ai-kit): <!-- tl-ai-kit:X --> ... <!-- /tl-ai-kit:X -->
//   - start/end-suffix (gear): <!-- gear:NAME:start --> ... <!-- gear:NAME:end -->
// Произвольные <!-- namespace:start --> блоки НЕ вырезаются — только перечисленные.
//
// Stdout: 64-символьный hex SHA-256 (без перевода строки).
// Exit codes: 0 — OK; 1 — файл не существует или ошибка чтения; 2 — неверные аргументы.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [file, mode] = process.argv.slice(2);

if (!file) {
  process.stderr.write('usage: node hash.mjs <path> [outside-markers]\n');
  process.exit(2);
}

let content;
try {
  content = readFileSync(file, 'utf8');
} catch (err) {
  process.stderr.write(`cannot read ${file}: ${err.message}\n`);
  process.exit(1);
}

// EOL normalization: CRLF → LF, standalone CR → LF
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// Allowlist внешних managed blocks, вырезаемых в режиме outside-markers.
// Каждый паттерн матчит ровно одну форму маркеров; wildcard'ов нет.
const MANAGED_BLOCK_PATTERNS = [
  // tl-ai-kit CLI: <!-- tl-ai-kit:X --> ... <!-- /tl-ai-kit:X -->
  /<!-- tl-ai-kit:[^>]+-->[\s\S]*?<!-- \/tl-ai-kit:[^>]+-->/g,
  // gear: <!-- gear:agent-docs:start --> ... <!-- gear:agent-docs:end -->
  /<!-- gear:agent-docs:start -->[\s\S]*?<!-- gear:agent-docs:end -->/g,
  // gear: <!-- gear:user-notes:start --> ... <!-- gear:user-notes:end -->
  /<!-- gear:user-notes:start -->[\s\S]*?<!-- gear:user-notes:end -->/g,
];

if (mode === 'outside-markers') {
  for (const pattern of MANAGED_BLOCK_PATTERNS) {
    content = content.replace(pattern, '');
  }
} else if (mode !== undefined) {
  process.stderr.write(`unknown mode: ${mode} (expected: outside-markers)\n`);
  process.exit(2);
}

process.stdout.write(createHash('sha256').update(content, 'utf8').digest('hex'));
