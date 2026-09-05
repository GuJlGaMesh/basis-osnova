# tl-tech-design Document Template

The single source of truth for the document shape — when the format evolves, it changes here. The document is consumed by humans (the review meeting) and by other skills (`tl-plan --tech-design`, repeated `tl-tech-design --update`), so the skeleton — frontmatter keys, `{#variant-N}` anchors, question markers — MUST stay stable, and the Russian section labels are user-facing literals kept in Russian.

Guiding principle (Google design docs): **as short as possible, as long as necessary**. Size scales via profiles; the checklist is a drafting tool and is never copied into the document.

## Contents

- [YAML frontmatter](#yaml-frontmatter--required-fields) — the 8 required fields
- [Profiles](#profiles) — S / M / L sizing
- [Body sections (in order)](#body-sections-in-order) — the document skeleton
- [Варианты](#варианты) — comparison table and per-variant blocks
- [Открытые вопросы](#открытые-вопросы) — the open / resolved markers
- [Сквозные аспекты](#сквозные-аспекты) — cross-cutting concerns
- [Rollout & метрики](#rollout--метрики) — L profile only

---

## YAML frontmatter — required fields

The document MUST start with this block. All 8 keys are mandatory; values may be `null` until the matching workflow step fills them in. Do not add keys beyond these — participants, discard reasons, tags and story links live in the body.

```yaml
---
slug: <kebab-case-slug>     # string. Matches the folder name suffix.
status: draft               # draft | in-review | decided | superseded | abandoned
created: <YYYY-MM-DD>       # ISO date when init mode created the document.
decided_on: null            # YYYY-MM-DD, set by update mode.
spec: null                  # path to the spec this DR is based on, or null.
chosen_variant: null        # "variant-N" string, set by update mode.
supersedes: null            # path to an older tech-design.md replaced by this one, or null.
superseded_by: null         # path to a newer tech-design.md that replaced this one, or null.
---
```

### `status` lifecycle

- `draft` — `init` mode has just produced the document. Pre-meeting state.
- `in-review` — optional manual state: sent to the team, meeting not held yet. Never set automatically.
- `decided` — `update` mode flipped it after the meeting. Requires non-null `chosen_variant` and ISO `decided_on`.
- `superseded` — the decision was revisited in a newer DR. `superseded_by` MUST point to that newer document.
- `abandoned` — the initiative was closed without implementation. The document stays as a record.

`supersedes` / `superseded_by` cross-link old and new DRs: the new DR sets `supersedes`, the old one gets `status: superseded` + `superseded_by` (update mode, Step U.9).

---

## Profiles

The profile is chosen in init mode (agent recommends, user confirms) and is visible from the body shape — no frontmatter key.

| | S — мини-DR | M — default | L — крупная инициатива |
|---|---|---|---|
| Когда | один модуль, обратимое решение, 1–2 человека | типичная фича | кросс-доменная инициатива, публичный API, SLO-контракт, миграция данных |
| Объём | ~1 страница | 2–3 страницы | до 5–7 страниц |
| `## Решение` | предложение 2–3 предложения; целевая диаграмма опциональна | предложение + целевая диаграмма | предложение + целевая диаграмма |
| Варианты | по 1 абзацу; таблица опциональна (когда плюсы/минусы уже несут сравнение) | полные подсекции, таблица обязательна | полные подсекции, таблица до 6 критериев |
| Диаграммы в вариантах | не нужны — хватает целевой в `## Решение` | только там, где вариант структурно расходится с целевой схемой | обязательна для каждого варианта |
| `## Открытые вопросы` | ≤3 до встречи | ≤5 до встречи | ≤5 до встречи |
| `## Сквозные аспекты` | 2–3 строки, только если есть что сказать | 3–5 строк | полный проход по чек-листу |
| Rollout и метрики успеха | по необходимости — строки в `## Сквозные аспекты` после встречи | строки «Выкатка» / «Метрики успеха» в `## Сквозные аспекты` после встречи | отдельная секция `## Rollout & метрики` (`TBD` до встречи) |

Everything not listed as different is identical across profiles. Only L has a placeholder section pre-meeting (`## Rollout & метрики` = TBD); S/M drafts contain no «TBD»-sections at all. `## Решение` is never a placeholder in any profile.

---

## Body sections (in order)

```markdown
# <Название фичи>

## Проблема

<1–3 абзаца одним связным текстом: какую боль закрываем для бизнеса/пользователя
и что в текущей системе мешает. Без принудительного деления на подсекции.>

Story: INTRA-XXXX — <короткое название>
Requirements: docs/specs/<YYYY-MM-DD>-<slug>.md
Research: docs/research/<...>.md

(Маркеры Story / Requirements / Mockups / Research — только те, у которых есть
реальное значение. Если внешних источников нет — строка *Внешних источников нет.*)

## Goals & Non-Goals

### Goals

- <измеряемая или проверяемая цель — что фича обязана сделать>

### Non-Goals

- <что фича явно НЕ делает в этом скоупе>

(Минимум 1 goal и 1 non-goal. Non-Goals — load-bearing scope-control.)

## Решение

**Предлагается:** [Вариант N](#variant-N) — <короткое имя>.

<2–4 предложения: в чём суть подхода целиком — что появляется, где живёт, как
меняется текущий поток. Концепция, а не пересказ плюсов; читается самостоятельно,
без «Вариантов».>

```mermaid
<целевая схема «как будет» — верхний уровень; обязательность см. «Profiles».>
```

**Что принимаем как плату:** <1–3 пункта — минусы, с которыми сознательно живём>
**Что нужно от ревью:** <1–3 пункта — что подтвердить или оспорить. Не «посмотрите
документ», а конкретные точки несогласия.>

Статус: предложение, решается на встрече.

<После встречи шапка блока заменяется на **Выбрано** (ссылка на вариант) / **Почему**
(ключевой tradeoff) / **Участники**, плюс «Hints для плана» — 3–8 пунктов уровня
«компонентная работа» со ссылкой на [Вариант N](#variant-N) или модуль/путь. Целевая
диаграмма и «Что принимаем как плату» остаются.>

## Варианты

| Критерий | Вариант 1 | Вариант 2 |
|---|---|---|
| <критерий> | … | … |

(3–5 критериев (в L — до 6, в S таблица опциональна) — только те, по которым варианты
реально различаются; одинаковые по всем вариантам строки выбрасывать. Кандидаты:
сложность реализации, риски, обратная совместимость, нагрузочный профиль, сложность
поддержки, новые внешние библиотеки/сервисы/настройки, новые компоненты на поддержке,
изменения в публичных API. Ячейка — Низкая/Средняя/Высокая или 1 короткое предложение.)

### Вариант 1: <короткое имя> {#variant-1}

<1–3 абзаца: суть подхода, ключевые компоненты, как решается проблема.>

```mermaid
<Только если вариант структурно расходится с целевой схемой из `## Решение` —
см. «Diagrams (mermaid)». Иначе диаграммы в варианте нет.>
```

**Плюсы:** <2–4 пункта или одной строкой через «;»>
**Минусы:** <то же>
**API / данные:** <новые эндпоинты, таблицы, события, миграции — или «нет»>

Status: proposed

### Вариант 2: <короткое имя> {#variant-2}

<Аналогично. После встречи у отвергнутого варианта:>

Status: discarded
Reason: <короткая причина>

## Открытые вопросы

- [ ] open: <вопрос> — предлагаю: <дефолт>; нужно решение: <кто/к какому моменту>
- [x] answered: <вопрос> — <ответ + кто ответил/где зафиксировано>
- [-] parked: <вопрос> — <почему отложили, до какого момента>

(Единственный трекер вопросов в документе. Только вопросы уровня решения, каждый —
с предложенным дефолтом; лимит до встречи см. «Profiles», остаток уходит допущениями
в `## Сквозные аспекты`. Если вопросов нет — строка *Вопросов перед встречей нет.*
«предлагаю» — не мнение, а fallback: если на встрече до вопроса не дойдут, едем по нему.
«нужно решение» — конкретный человек или роль и момент, а не «обсудить».)

## Сквозные аспекты

*Информационно: уже учтено в решении, отдельного ответа не требует.*

<ТОЛЬКО релевантные пункты из прохода по references/CHECKLIST.md плюс допущения;
объём — см. «Profiles». Неприменимые пункты в документ не попадают вообще.>

- **Откат:** feature-flag `<имя>` (default off), выключение за минуту.
- **Мониторинг:** <метрика/алерт — как узнаем о сбое>.
- **Совместимость:** <миграции, старые клиенты, deprecation-окно>.
- **Допущение:** <на чём стоит решение + что делаем, если не сработает>.
- **Выкатка:** / **Метрики успеха:** <только в S/M и только после встречи —
  фазы + rollback trigger + owner; 1–3 метрики `<метрика>: target, период`.>

## Rollout & метрики

<Только L. До встречи — `TBD (заполняется в update-режиме)`. После встречи — фазы
выкатки, feature-flag + дефолт, rollback trigger + owner, 2–4 метрики успеха
формата `<метрика>: target = <значение>, период = <окно замера>`.>
```

---

## Diagrams (mermaid)

Diagrams are mermaid code blocks — GitLab, GitHub, VS Code and Obsidian render them natively. **Never ASCII art.**

- **Type by content:** `flowchart` — components and their links; `sequenceDiagram` — request/event flows between systems; `stateDiagram-v2` — lifecycles and status models; `erDiagram` — data-model changes.
- **Do NOT use the C4 syntax** (`C4Context` etc.) — it is experimental and GitHub's bundled mermaid does not render it.
- **≤ 12 nodes.** If it doesn't fit — the diagram is at the wrong altitude; zoom out.
- **`flowchart TD` by default.** Every renderer scales the SVG down to the page width, so a wide graph reaches the reader with unreadable text. `LR` only for a straight chain of ≤ 4 nodes with no branching.
- **Width is the failure mode, depth is free.** ≤ 3 parallel branches out of one node: branches that differ only by example (`repos/a`, `repos/b`) collapse into one node that names the examples in its own text. Wrap node text with `<br/>` about every 30 characters instead of letting one long line set the column width.
- **Edge labels ≤ 3 words.** A long condition or a multi-step transform (`path → nearest .git → origin → allowlist`) becomes its own node — a node wraps its text, an edge label stretches the whole span.
- **A diagram replaces prose, it does not duplicate it.** If a paragraph and a diagram say the same thing — drop the paragraph.

**Where diagrams live.** The load-bearing one is the **target-state diagram in `## Решение`** — the single picture of «как будет» that carries the concept. Variant diagrams are secondary and appear only where a variant is structurally different from that target picture (obligations per profile — the Profiles table). Two near-identical diagrams in two variants and none at the top is the failure mode this rule exists to prevent. In L, `## Проблема` may additionally carry one «как сейчас» diagram when the current flow is non-obvious — never in S, and in M only when that flow genuinely cannot be stated in a sentence.

---

## Conformance checklist

Sections in this order, each shaped as above: frontmatter (exactly the 8 keys) → `# <Название фичи>` (single H1) → `## Проблема` → `## Goals & Non-Goals` (≥1 goal, ≥1 non-goal) → `## Решение` → `## Варианты` (comparison table + ≥2 `### Вариант N: <name> {#variant-N}` subsections, each with a `Status:` line) → `## Открытые вопросы` → `## Сквозные аспекты` (required in M/L; in S only when non-empty) → `## Rollout & метрики` (L only, `TBD` allowed pre-meeting; absent in S/M). Counts and per-section obligations that differ by profile — the Profiles table.

The document MUST NOT:

- Leave `## Решение` as a bare `TBD` or a one-line recommendation — pre-meeting it carries the proposal, and that is what makes the document reviewable by humans.
- Contain a copied checklist section (`## Чек-лист`) or any `[-] N/A` line — the checklist is a drafting tool (`references/CHECKLIST.md`), and an inapplicable concern is simply not written.
- Contain an `[ ] open` question without a proposed default and a named decider, or one whose answer does not change the design (that is a cross-cutting line or an assumption, not a review question).
- Duplicate the decision outside `## Решение` (variant `Status:`/`Reason:` lines are the only allowed echo), or repeat the target diagram inside a variant subsection.
- Use anchor-IDs other than `{#variant-N}` (downstream tooling relies on this exact form), or drop/add frontmatter keys (use `null` for unfilled values).

Documents already written in an older shape stay valid for `--update` and are never restructured; new documents are always generated in the shape above.
