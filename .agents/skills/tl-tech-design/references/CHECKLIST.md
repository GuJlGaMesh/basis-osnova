# tl-tech-design Checklist

Рабочий чек-лист дизайн-ревью. Покрывает канонический список вопросов из внутреннего шаблона + пункты, всплывающие в реальных DR-документах.

**Это инструмент автора, а не секция документа.** Агент проходит по списку во время драфта (init) и перед закрытием встречи (update), но сам список в документ НЕ копируется — в документе нет секции «Чек-лист». Каждый пункт маршрутизируется по правилам из секции «How the agent applies this» ниже.

---

## Полный список пунктов

### Эксплуатация и мониторинг

- Технический мониторинг работоспособности — метрики/алерты/логи/дашборды, что мониторим, как обнаруживаем сбои; покрыта ли единая точка отказа.
- Технический мониторинг на stage — выкатка фичи на pre-prod, как проверяем работоспособность до prod.
- Мониторинг бизнес-метрик — если фича перестанет выполнять свою бизнес-функцию, как пользователи / бизнес узнают об этом.
- Логирование и обработка ошибок — какие классы ошибок ожидаемы, как они логируются, как быстро находятся.
- Восстановление работоспособности — как обеспечивается recovery после сбоя; есть ли automated retry, manual resume, rollback.

### Корректность и устойчивость

- Исключительные / особенные ситуации — учтены ли (цель: минимум неожиданного поведения в проде).
- Согласованность и целостность данных — гарантия доставки, дедупликация, идемпотентность; что произойдёт при двойной обработке.
- Side-effects — какие соседние модули/сервисы затрагиваются, как страхуемся от случайных поломок.
- Конкурентность — возможна ли гонка / двойной запуск, как защищаемся (locks, version, unique constraints).

### Архитектура и интерфейсы

- Соответствие архитектурным принципам — размещение по слоям/модулям, соблюдение boundary-rules `docs/architecture/layers.md`.
- Технические интерфейсы — как другие системы взаимодействуют с нашей и наоборот (API, события, очереди); версионирование.
- Пользовательские интерфейсы — UI/UX-сценарии, точки входа, инструкции для пользователя.
- Внешние зависимости — от каких систем/команд зависит реализация; нужны ли изменения во внешних системах.
- Рассмотренные альтернативы — какие варианты сравнивались и какие критерии были ключевыми (см. `## Варианты`).

### Производительность и масштабирование

- Поведение под нагрузкой — RPS, объём данных в перспективе, узкие места.
- Масштабирование — как горизонтально/вертикально масштабируется решение.
- Приемлемый уровень производительности — целевые SLO/SLA по latency/throughput/availability.

### Безопасность

- Хранение чувствительных данных — где, как, с какими гарантиями (encryption-at-rest, secrets management).
- Передача чувствительных данных — TLS, межсервисная аутентификация, проверка подписей.
- Аутентификация / авторизация — кто имеет право вызывать; новые роли / permissions / уровни доступа.
- OWASP-риски — injection, XSS, CSRF, IDOR, broken access control — релевантные для этого DR.

### Тестирование и обслуживание

- Тестирование — unit / integration / e2e сценарии; что и кем покрывается; где живут тесты.
- Обслуживание — чистка данных, регламентные работы, действия при инциденте (runbook).
- Пуско-наладка — нужны ли feature-flags, миграционные скрипты, посевные данные, дополнительные настройки.
- Сценарии использования — основные user journeys, как пользователь взаимодействует с фичей в типовых случаях.

### Откат и совместимость

- Откат фичи — feature-flag / kill-switch / эталонный rollback; как быстро можем выключить.
- Обратная совместимость — миграции БД с rollback-планом, поведение на старых клиентах, deprecation-окно.
- Изменения в инфраструктуре — что нужно поднять/настроить в инфре до выкатки.

### Риски и допущения

- Риски решения — что может пойти не так, оценка вероятности и последствий.
- Ограничения решения — что мы НЕ покрываем, какие границы скоупа.
- Допущения — на каких неподтверждённых предположениях стоит решение; что произойдёт, если допущение не сработает.

---

## How the agent applies this

Walk the full list once while drafting (init mode, after the variants exist). Route every item into exactly one of three buckets — the list itself never appears in the document:

1. **Addressed by the design** → one short line in `## Сквозные аспекты` (bold label + how it is handled), or it is already visible in the variant text / `## Решение`. Do not restate what a variant subsection already says.
2. **Open and relevant** → a candidate question for the resolve step (SKILL.md Step 6), which applies its two filters (decision-grade + proposed default) and routes the item either to `## Открытые вопросы` or to an assumption line in `## Сквозные аспекты`.
3. **Not applicable** → silently skipped. Never write N/A lines into the document — an inapplicable concern is simply absent.

**Calibration.** Both buckets have per-profile budgets — the Profiles table in `references/TEMPLATE.md`. If more than ~10 items land in bucket 2, the initiative is under-explored: go back to Step 3 (codebase exploration) before asking the user. If bucket 1 keeps overflowing, the DR is drifting back into a checklist review — the reviewers need the concept in `## Решение`, not thirty confirmed details.

Update mode does not walk the checklist again — it works from `## Открытые вопросы`. Re-walk only when the chosen variant differs substantially from what the draft described (hybrid picked at the meeting).

Skill-context (`docs/skill-context/tl-tech-design/SKILL.md`) may add project-specific items — append them to the walkthrough and route them by the same rules.
