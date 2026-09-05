---
name: tl-text-plain
description: >-
  Writes and rewrites Russian text in a plain, informal style without bureaucratese. Use when: напиши понятно, упрости текст, убери канцеляризмы.
---

# Plain Text

This skill applies when generating or rewriting text in Russian. Goal: write plainly, concretely, without filler.

## Core Rules

### 1. Sentence rhythm
- One thought — one sentence.
- **Vary length**: alternate short sentences (8–12 words) with medium ones (15–25 words). This creates rhythm.
- Avoid making every sentence equally short — the text becomes choppy.
- Split a long sentence (30+ words) into two.

### 2. Simple words
- Write the way you would explain it to a colleague over coffee.
- Don't overcomplicate when a simpler wording exists.

| Плохо | Хорошо |
|-------|--------|
| осуществлять | делать |
| произвести оплату | заплатить |
| функционал | возможности |
| в рамках | в / на / при |
| на сегодняшний день | сейчас |
| является | (перестроить фразу с глаголом: «это», «состоит из», «относится к») |
| в связи с тем что | потому что |
| данный | этот |
| вышеуказанный | (убрать или заменить конкретикой) |
| посредством | через / с помощью |
| надлежащим образом | как нужно / правильно |

### 3. Terms
- Write IT terms the way the industry does: API, backend, deploy, commit, merge.
- **Don't transliterate**: «апи», «бэкенд», «деплой», «мёрдж» are bad.
- Write general terms in Russian: база данных, сервер, запрос, ошибка.

### 4. Dashes and verbs
- **A dash does not replace a verb** in instructional text. Use «это», «называется», «означает».
- Maximum 1–2 dashes per paragraph. If there are more, restructure the sentences.
- Reading after a dash should be easy. If you stumble, simplify.
- If there is no predicate after the dash, usually add a verb or restructure the phrase.
- If a single sentence has two or more dashes, leave one. Replace the rest with a comma, conjunction, or split the sentence.
- Don't put a dash between two short complete sentences when a conjunction, comma, or semicolon works better.
- Edits around dashes must be minimal. Don't rewrite the whole paragraph if the issue is local.
- Don't touch dashes inside service markup and fixed forms: `---`, tables, compound words like `AI-assisted` and `open-source`.
- If a block of text follows a special template, first check whether the dash is part of that format.

| Плохо | Хорошо |
|-------|--------|
| Git — система контроля версий | Git — это система контроля версий |
| API — способ взаимодействия | API позволяет программам обмениваться данными |
| Цель — научиться | Цель курса — научить вас (глагол есть) |

### 5. Text flow
- Use connectives between sentences: «поэтому», «так», «например», «при этом».
- Don't chop the text into isolated phrases without connectives.
- The text should flow; the reader shouldn't stumble.

### 6. Remove stop-words
Strip from the text:
- **Вводные**: кстати, конечно, безусловно, очевидно, собственно, в целом
- **Усилители**: очень, крайне, максимально, чрезвычайно, буквально, абсолютно
- **Оценки без фактов**: уникальный, инновационный, высококачественный, эффективный, оптимальный, передовой

If an evaluation is needed — back it with a fact:
- Плохо: «Наша высокоэффективная система»
- Хорошо: «Система обрабатывает 10 000 запросов в секунду»

### 7. Verbs instead of verbal nouns
| Плохо | Хорошо |
|-------|--------|
| проведение тестирования | протестировать |
| осуществление деплоя | задеплоить / выкатить |
| выполнение настройки | настроить |
| реализация функционала | сделать / добавить |

### 8. Specifics instead of abstractions
- Numbers instead of «много», «некоторые», «ряд».
- Examples instead of generic phrases.
- Facts instead of evaluations.

| Плохо | Хорошо |
|-------|--------|
| Значительно ускорили работу | Ускорили с 3 с до 200 мс |
| Ряд улучшений | 4 исправления и 2 новые функции |
| Недавно обновили | Обновили 15 февраля |

### 9. Structure for the reader
- Headings — so the text can be scanned.
- Lists — when enumerating more than two items.
- Short paragraphs — 2–4 sentences.
- Most important first.

### 10. Tone
- Informal but respectful.
- Address the reader as «ты» when context allows.
- No buddy-buddy familiarity, no officialese either.
- Humor is allowed, in moderation.

## Pitfalls

### When simplicity hurts

Don't simplify to the point of losing meaning:

- **Technical documentation** — terms exist for precision. «База данных» can't be replaced with «хранилище» if these are different things.
- **Legal text** — wording protects the company. Simplification can create legal risk.
- **Safety instructions** — precision matters more than brevity here.

### Risk of losing nuance

Simplification easily drops something important:

- **Пример:** «Система работает быстро» vs «Система обрабатывает запросы за 200 мс в 99% случаев»
- The first is plain. The second is concrete and verifiable.
- **Balance:** simplify the wording, preserve the facts.

### Over-simplification

Text that is too plain looks primitive:

- Don't strip every professional term.
- «Деплой», «API», «баг» are normal for an IT audience.
- «Выкатить код на сервер» is fine. «Положить программу в компьютер» is too much.

### When to keep officialese

Sometimes a formal tone is appropriate:

- Responses to customer complaints.
- Official notices about changes in terms.
- Letters to executives of other companies.

## Pre-send checklist

Re-read the text and check:

1. Does every sentence carry meaning? If removed, does the text lose something?
2. No stop-words, intensifiers, bureaucratese?
3. Are evaluations backed by facts?
4. Does sentence length vary? Is there rhythm?
5. Do dashes avoid replacing verbs? Is reading after a dash easy?
6. No more than 1–2 dashes per paragraph?
7. Are terms written correctly (API, not «апи»)?
8. Can the text be scanned quickly?

## Examples

**Было (плохо):**
> На сегодняшний день наша компания осуществляет деятельность в сфере разработки высококачественного программного обеспечения, которое является инновационным решением для широкого ряда задач в рамках автоматизации бизнес-процессов.

**Стало (хорошо):**
> Мы делаем софт для автоматизации. Наши сервисы используют 200+ компаний в России.

---

**Было (плохо):**
> В связи с необходимостью проведения работ по оптимизации производительности базы данных, просим вас осуществить временную приостановку использования данного сервиса в период с 02:00 до 04:00.

**Стало (хорошо):**
> Сегодня с 2:00 до 4:00 сервис будет недоступен — ускоряем базу данных.
