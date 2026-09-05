# TEMPLATES — files tl-docs generates

Templates for the files the skill creates. `init` uses all of them, `update` only the ones the change touched.

Placeholders: `{{PROJECT_NAME}}` (from `package.json` / `*.csproj` / `pyproject.toml`, fallback the root folder name), `{{TAGLINE}}`, `{{PRIMARY_LANG}}`, `{{FRAMEWORK}}`, `{{PKG_MANAGER}}`, `{{TODAY}}` (ISO date).

Outer fences below are 4 backticks so the 3-backtick blocks inside a template render correctly. The generated file keeps only the inner content — the outer fence is an artifact of this file.

## Contents

- [1. README.md](#1-readmemd-root-landing-page) — root landing page
- [2. Root AGENTS.md](#2-root-agentsmd-text-outside-the-tl-ai-kit-markers) — the text outside the tl-ai-kit markers
- [2a. Local AGENTS.md](#2a-local-module-agentsmd) — one per module boundary
- [3. docs/README.md](#3-docsreadmemd-human-route-map) — human route map
- [4. docs/AGENTS.md](#4-docsagentsmd-agent-navigation-index) — agent navigation index
- [5. architecture/* and development/*](#5-docsarchitecture-and-docsdevelopment--section-skeletons) — section skeletons
- [6. change-scenarios/*.md](#6-docschange-scenariosmd) — five-section playbooks
- [7. docs/adr/](#7-docsadrreadmemd--adr-template) — index plus the ADR template
- [8. docs/glossary.md](#8-docsglossarymd-only-when-20-unique-terms-are-detected) — only when ≥20 terms are detected
- [Applying a template](#applying-a-template) — language, placeholders, what to drop

---

## 1. README.md (root landing page)

~80–150 lines: landing page with the Tech Stack section near the top.

````markdown
# {{PROJECT_NAME}}

> {{TAGLINE}}

## Tech Stack

- **Язык:** {{PRIMARY_LANG}}
- **Framework:** {{FRAMEWORK}}
- **Пакетный менеджер:** {{PKG_MANAGER}}
- **Тесты:** <detected test runner>
- **CI:** <detected CI>

## Quick start

```bash
# 1-3 команды от clone до запуска
```

## Key features

- **<feature 1>** — brief description
- **<feature 2>** — brief description

## Example

```
<короткий реальный пример использования>
```

---

## Документация

| Раздел | Что внутри |
|---|---|
| [Архитектура](docs/architecture/overview.md) | Слои, модули, зависимости |
| [Разработка](docs/development/rules.md) | Правила, тесты, review, миграции |
| [Change scenarios](docs/change-scenarios/) | Playbooks типовых изменений |
| [ADR](docs/adr/README.md) | Принятые архитектурные решения |
| [Глоссарий](docs/glossary.md) | Термины проекта |
| [Навигация для AI](docs/AGENTS.md) | Для автоматических агентов |

## License

<из LICENSE или detect>
````

---

## 2. Root AGENTS.md (text outside the tl-ai-kit markers)

Existing `<!-- tl-ai-kit:X -->` blocks and the allowlisted external managed blocks are preserved verbatim — this is only the skeleton for the text tl-docs owns.

No links to other, specific `AGENTS.md` files belong here — the root file never indexes the local module ones (DOC-PRINCIPLES §9). Only `docs/AGENTS.md` is referenced, as the entry point.

````markdown
# AGENTS.md

Инструкции для AI-агентов, работающих с этим репозиторием.

## Перед любой задачей: контекст из docs/

`docs/` — канонический источник проектного контекста для AI. **Не приступать к коду, пока не собран релевантный контекст оттуда.**

Workflow:

1. Открыть **`docs/AGENTS.md`** — карта «тип задачи → нужные файлы».
2. Найти свой сценарий в `docs/change-scenarios/` (`new-feature`, `bugfix`, `refactor`, `api-change`, ...).
3. Прочитать файлы из секции «Читать сначала» этого сценария (обычно `architecture/*`).
4. Если задача правит файлы — всегда дочитать `docs/development/rules.md`; сценарии его не перечисляют. Добавляешь или меняешь тесты — ещё `docs/development/testing.md`.
5. Только после этого — кодить.

Если задача не подходит ни под один сценарий — baseline: `docs/architecture/overview.md` + `docs/development/rules.md`.

## Дополнительные точки входа

- `README.md` — что это за проект, стек, quick start.
- `docs/architecture/overview.md` + `layers.md` — слои и зависимости.
- `docs/development/rules.md` — hard requirements кода и тестов.

<!-- tl-ai-kit:skills -->
<!-- /tl-ai-kit:skills -->

<!-- tl-ai-kit:mcp -->
<!-- /tl-ai-kit:mcp -->
````

---

## 2a. Local (module) AGENTS.md

One per module boundary the survey keeps (SKILL.md Step 4, DOC-PRINCIPLES §9). A terse pointer, ≤30 lines: one line of what the module is, a *See also* table linking the paired pages in `docs/**` where the real content lives, and an optional short traps section for agent-only rules. Never the content itself — that stays in `docs/**` (single source of truth, #6). Relative link depth follows the module's own depth (`../../docs/...` from `src/<module>/`, `../docs/...` from a root-level app).

````markdown
# <Module> — agent navigation

<One sentence: what this module is and its single responsibility.>

## See also

| Topic | File |
|---|---|
| Role and rules of this module | [<rel>/docs/architecture/<...>.md](<rel>/docs/architecture/<...>.md) |
| Overall architecture | [<rel>/docs/architecture/overview.md](<rel>/docs/architecture/overview.md) |
| Code rules | [<rel>/docs/development/rules.md](<rel>/docs/development/rules.md) |
| Tests | [<rel>/docs/development/testing.md](<rel>/docs/development/testing.md) |

## Boundaries

- <agent-only trap or hard limit — a forbidden dependency, a "read X first", an old-style caveat. Drop the section if there is none.>
````

---

## 3. docs/README.md (human route map)

````markdown
# Документация {{PROJECT_NAME}}

Короткий путеводитель для людей. Для AI-агентов — `docs/AGENTS.md`.

## Tech stack

См. верхнюю секцию `../README.md`.

## Структура

- `architecture/` — структурная правда проекта (слои, модули, зависимости, constraints).
- `development/` — процессы: правила, тесты, review, миграции, релизы.
- `change-scenarios/` — playbooks типовых изменений (feature, bugfix, refactor, ...).
- `adr/` — принятые архитектурные решения.
- `glossary.md` — словарь терминов проекта.

## Не владеются tl-docs

- `plans/` — планы реализации (tl-plan).
- `references/` — внешние справочники (tl-reference).
- `skill-context/<skill>/SKILL.md` — project overrides для скиллов.
````

---

## 4. docs/AGENTS.md (agent navigation index)

````markdown
# docs/AGENTS.md

Навигация по документации для AI-агентов. Карта «от задачи → к нужным файлам». Общие правила — в корневом `../AGENTS.md`.

## По типу задачи

| Задача | Читать сначала |
|---|---|
| Новая фича | `change-scenarios/new-feature.md` + `architecture/overview.md` |
| Bugfix | `change-scenarios/bugfix.md` + соответствующий модуль |
| Рефакторинг | `change-scenarios/refactor.md` + `architecture/layers.md` |
| API-изменения | `change-scenarios/api-change.md` + `architecture/overview.md` |
| Конфиг | `change-scenarios/config-change.md` + `architecture/constraints.md` |
| Миграция БД | `change-scenarios/db-migration.md` + `development/migrations.md` |
| Обновление зависимости | `change-scenarios/dep-upgrade.md` + `development/rules.md` |
| Производительность | `change-scenarios/perf-fix.md` + `architecture/layers.md` |
| Frontend | `change-scenarios/frontend-change.md` + релевантные UI-модули |
| Инцидент / postmortem | `change-scenarios/incident-postmortem.md` + `development/review.md` |
| Code review | `development/review.md` + `development/rules.md` |
| Планирование | `../README.md` (top) + `architecture/overview.md` |

## Карта директорий

- `architecture/` — структура: overview, layers, dependencies, C4, constraints
- `development/` — rules, testing, review, migrations, releases
- `change-scenarios/` — playbooks
- `adr/` — architectural decision records
- `glossary.md` — термины
````

---

## 5. docs/architecture/* and docs/development/* — section skeletons

One file per topic, each a set of H2 sections filled from the real project. A section with nothing true to say about this project is dropped, not stubbed.

- **`architecture/overview.md`** — Контекст (why the project exists, upstream / downstream) · Топ-level компоненты (component → responsibility) · Ключевые потоки (how a request or data crosses the system) · Технологические решения (language, framework, storage, queues, external integrations) · См. также (links to `layers.md`, `dependencies.md`, `constraints.md`, `../adr/README.md`).
- **`architecture/layers.md`** — Пирамида зависимостей (layers top-down; dependencies allowed downward only) · Модули (table: module | path | responsibility) · Правила размещения (which code goes where) · Anti-patterns (what NOT to do here, taken from real incidents).
- **`architecture/dependencies.md`** — Граф (module → what it depends on) · Запрещённые направления (e.g. `domain/` must not depend on `infrastructure/`) · Внешние зависимости (table: library | purpose | criticality).
- **`architecture/constraints.md`** — Нефункциональные (latency, throughput, availability, security targets) · Технологические (runtime versions, OS, DB) · Регуляторные (PII / GDPR / PCI / ...).
- **`development/rules.md`** — short actionable hard requirements: Код · Тесты (points at `testing.md`) · Коммиты (Conventional Commits; a commit compiles and passes tests) · Pull / Merge requests (points at `review.md`) · Security (secrets, auth, input validation).
- **`development/testing.md`** — Инструменты (unit / integration / e2e runners) · Где жить тестам · Что тестируем · Запуск (real commands) · Покрытие.
- **`development/review.md`** — Чек-лист ревьюера (tests cover happy + edge; changes follow `rules.md`; layer boundaries intact; no leaked secrets, no unsafe SQL/HTML/shell; no PII in logs; docs updated) · Чек-лист автора (self-review done; MR description answers «что» and «зачем»; linters clean).
- **`development/migrations.md`** (only when a DB stack is detected) — Инструмент · Правила (migrations are idempotent; backward compatible one step, i.e. app N-1 runs on schema N; large backfills go in their own migration or a job) · Процесс · Rollback (what cannot be rolled back automatically: DROP COLUMN, data deletion).
- **`development/releases.md`** — Версионирование (SemVer / CalVer) · Процесс (bump → CHANGELOG → tag `v<version>` → CI) · Каналы (branch → environment).

---

## 6. docs/change-scenarios/*.md

Each scenario is a 20–40 line playbook with these five sections:

````markdown
# Scenario: <название>

## Когда применять

Триггеры / признаки задачи.

## Читать сначала

Файлы из docs/, которые надо открыть до начала (реальные пути, относительные ссылки).

## Шаги

1. ...

## Чеклист проверки

- [ ] ...

## Типовые ошибки

- ...
````

The 10 files, with the content that must be in each:

- `new-feature.md` — pick the layer before writing; unit-test the business rules; integration-test the entry point; update `architecture/layers.md` when a module appears. Typical mistakes: business logic leaking into a controller, tests bound to internals.
- `bugfix.md` — reproducing test first, then the fix, then a regression test.
- `refactor.md` — behavior unchanged, tests green before and after, no logic edits inside the refactor.
- `api-change.md` — versioning, deprecation window, public-contract update in the owning module.
- `config-change.md` — update `architecture/constraints.md`, add the example to env.example, migrate existing environments.
- `db-migration.md` — follow `development/migrations.md`; one-step backward compatibility.
- `dep-upgrade.md` — dependency changelog, breaking changes, security advisories, regression tests.
- `perf-fix.md` — measurement before, measurement after, regression metric.
- `frontend-change.md` — a11y, responsive, cross-browser check.
- `incident-postmortem.md` — timeline, root cause, prevention, MR links.

---

## 7. docs/adr/README.md + ADR template

````markdown
# Architectural Decision Records

Формат — lightweight Markdown ADR.

## Как добавлять ADR

1. Создать `NNNN-<kebab-title>.md` (NNNN — следующий номер).
2. Заполнить шаблон ниже.
3. Сослаться на ADR из релевантных docs (architecture/*, development/*).

## Шаблон

```markdown
# ADR-NNNN: <Title>

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Deciders:** <people>

## Context

Что побудило принимать решение. Какие силы давят на выбор.

## Decision

Что решили. Конкретно.

## Consequences

- Плюсы: ...
- Минусы / tradeoffs: ...
- Последствия для архитектуры и команды.

## Alternatives considered

- <опция 1> — почему отклонили.
- <опция 2> — почему отклонили.
```
````

---

## 8. docs/glossary.md (only when ≥20 unique terms are detected)

````markdown
# Глоссарий

Термины и аббревиатуры проекта.

| Термин | Что это |
|---|---|
| `<Term1>` | <описание> |

> Терминология автоматически собрана из `src/**/*.{ts,js,py,cs,go}` (CamelCase сущности, UPPER-аббревиатуры ≥3 символов). Пополняй вручную по мере необходимости.
````

---

## Applying a template

1. **Language** — the README's language for every generated file; no «русский README + английский docs» mix. No README and nothing to judge by → ask once during init.
2. **Placeholders** — substitute real values; if a value cannot be detected, leave `<TODO: fill>` and list it in the Step 7 review report.
3. **Existing files** — in update mode a template only applies to a file that is missing, empty, or gaining a new section. Existing content is smart-merged, never overwritten.
4. **Links** — relative inside `docs/` (`../architecture/overview.md`), `docs/<...>` from the root README.
