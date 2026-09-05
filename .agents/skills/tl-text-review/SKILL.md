---
name: tl-text-review
description: >-
  Reviews Russian text for factual errors, contradictions, duplication and unclear phrasing. Use when: проверь текст, вычитай документ, найди противоречия.
allowed-tools: Read Glob Grep
---

# Text Review

Skill for deep review of Russian-language texts. Finds problems the author cannot see anymore because their eyes are tired.

## Workflow

1. Read the entire text first — do not start the analysis until you see the full picture.
2. If the text is long (>1000 words), ask the user to highlight the critical sections for priority review.
3. Walk through every review category (see below).
4. Produce the report following the "Report Format" section.

## Review Categories

### 1. Factual errors

Look for:
- Wrong numbers, dates, names.
- Statements that contradict commonly known facts.
- Outdated information (library versions, references to deprecated APIs).
- Incorrect code examples (if any).

### 2. Internal contradictions

Look for places where the text contradicts itself:
- One place says "A", another says "not A".
- Numbers don't add up (early in the text "5 modules", later 6 are listed).
- Terms are used with different meanings.
- Promises made early on that are never fulfilled.

**Example:**
> Раздел 1: «Курс состоит из 4 модулей»
> Раздел 3: перечислены модули 0, 1, 2, 3, 4 — это 5 модулей.
> **Противоречие**: заявлено 4 модуля, перечислено 5.

### 3. Duplicated meaning

Look for:
- The same idea repeated with different wording in different places.
- Sections that overlap in content.
- Lists with bullets saying the same thing.

When duplication is found, suggest:
- Which version to keep (more precise / more complete).
- Where to move the content if it belongs in both places (a cross-reference instead of a copy).

### 4. Logic and structure

Look for:
- Order violations (consequence before cause, conclusion before arguments).
- Inconsistent numbering.
- "Dangling" references: "as described below" — but there is nothing below.
- Headings that don't match the content of the section.
- Heading-level jumps (H2 → H4, with H3 skipped).

### 5. Ambiguity and vague phrasing

Look for:
- «Это» / «они» / «данный» — unclear what they refer to.
- Phrases with double meaning.
- Vague promises: «подробнее позже», «в дальнейшем», without saying where exactly.
- Terms used at first mention without a definition.

### 6. Gaps

Look for:
- Topics mentioned but never elaborated on.
- Incomplete lists ("3 ways" claimed, only 2 described).
- TODO / FIXME / placeholders left in the text.
- Cut-off thoughts.

## Finding Priorities

| Level | What belongs here |
|-------|-------------------|
| **Критичное** | Factual errors, blatant contradictions, loss of meaning |
| **Стоит исправить** | Duplication, logic violations, ambiguity |
| **Мелочи** | Style nits, small inconsistencies, phrasing improvements |

## Principles

- **Don't fill in gaps for the author.** If you can't tell what was meant — flag it as an ambiguity, don't silently rewrite.
- **Quote.** Every finding includes a quote from the text so the author sees the context immediately.
- **Suggest, don't dictate.** Phrase your output as a suggestion, not a command.
- **Praise what's good.** In «Общие наблюдения» mention the strengths of the text.
- **Don't touch the author's voice.** This skill looks for errors and problems, it does not rewrite the text in your taste. Style edits — only when they clearly hurt comprehension.

## Pitfalls

### 1. False positives on domain-specific terms

Terms that look like errors may be correct within the domain.

**Example:** In a CI/CD text the word «деплой» is not an error, it's an established term.

**How to handle:** If a term appears repeatedly and is used consistently — it's most likely not an error. When in doubt — flag it as «возможно, нестандартный термин» with a question for the author.

### 2. Balance between completeness and readability

A report that's too detailed (>20 findings) is hard to read; one that's too short looks shallow.

**How to handle:**
- Up to 5 findings — full report.
- 5-15 findings — group small ones by category.
- >15 findings — surface the top 5 critical items, move the rest into «Дополнительно».

### 3. "Obvious" depends on the audience

What's obvious to an expert may be unclear to a beginner.

**How to handle:** Evaluate the text from the target audience's perspective. If the audience is unknown — ask the user, or flag ambiguities with a note like «для экспертной аудитории может быть понятно, для общей — нет».

---

## Report Format

Group findings by category. For each finding — quote, problem, suggestion.

**Входной текст (фрагмент):**

> Наш курс состоит из 4 модулей. В модуле 0 мы разбираем основы. Модуль 1 посвящён базовым концепциям. В модуле 2 мы углубляемся в детали. Модуль 3 — практика. Модуль 4 — финальный проект. Курс подойдёт для всех, кто хочет изучить программирование. Подробнее о требованиях к компьютеру читайте в следующем разделе.

**Отчёт:**

```markdown
## Результаты проверки

### Критичное

> «Курс состоит из 4 модулей»

**Проблема:** Заявлено 4 модуля, но перечислено 5 (0, 1, 2, 3, 4).
**Где:** Введение
**Предложение:** Либо написать «5 модулей», либо перенумеровать с 1 по 4.

---

### Стоит исправить

> «подойдёт для всех, кто хочет изучить программирование»

**Проблема:** Слишком размыто — «всех» и «программирование» без уточнения уровня и языка.
**Где:** Введение
**Предложение:** Уточнить: «для начинающих без опыта» или «для тех, кто знает основы Python».

> «Подробнее о требованиях к компьютеру читайте в следующем разделе.»

**Проблема:** «Следующий раздел» неявно ссылается на контент, который может быть не сразу после этого абзаца.
**Где:** Конец абзаца
**Предложение:** Указать точное название раздела: «см. раздел "Системные требования"».

---

### Мелочи

> «В модуле 0 мы разбираем основы.»

**Проблема:** Нестандартная нумерация с 0 — может путать не-программистов.
**Где:** Введение
**Предложение:** Рассмотреть нумерацию с 1, если аудитория не только разработчики.

---

### Общие наблюдения
- ✅ Чёткая структура перечисления модулей
- ⚠️ Текст содержит незакрытые обещания (ссылки на несуществующие разделы)
```
