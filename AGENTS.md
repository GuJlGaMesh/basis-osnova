<!-- tl-ai-kit:agent-rules -->
## Nested `AGENTS.md` — rule for Codex CLI

Before you touch files in a subdirectory you have not worked in yet, check the nested `AGENTS.md` files on the path from the session's start directory to that file — once. Do not re-read instructions that are already loaded, and do not scan other subdirectories.

If your harness picks up nested `AGENTS.md` files on its own, skip this section.
<!-- /tl-ai-kit:agent-rules -->

# Работа с БАЗИС-Мебельщиком

## Перед любой задачей: контекст из docs/

1. Открой [docs/AGENTS.md](docs/AGENTS.md): выбери этап, карточку мебели и сценарий. У сценария прочитай «Читать сначала»; если подходящего маршрута нет — [архитектуру](docs/architecture/overview.md).
2. Перед изменениями прочитай [обязательные правила](docs/development/rules.md); перед проверками — [методы проверок](docs/development/testing.md). Специальные требования бери только из выбранной карточки мебели.
3. Для подготовки скрипта заполни [паспорт](docs/development/intake.md) и пройди [S0–S3](docs/development/gates/script.md); комплект выдачи определяет [releases.md](docs/development/releases.md). Отсутствие локального БАЗИС не блокирует подготовку `.js`.
4. Отчёт веди по [правилам гейтов](docs/development/quality-gates.md): готовность скрипта, проверка модели и производственный допуск — разные этапы. До запуска фактическая модель не проверена; изготовление требует G8.
5. По умолчанию добавляй новый отдельный блок, сохраняя старые объекты; повторный запуск создаёт новый экземпляр. Точный порядок вставки и выравнивания — [bazis.md](docs/development/bazis.md). Замена требует отдельного явного запроса.
6. Перед выдачей `.js` проверь ASCII без BOM и русские строки через `\uXXXX` по [правилу 12](docs/development/rules.md).

Документация проекта — на русском, технические имена API сохраняются без перевода. Подтверждённую версию БАЗИС брать из [Tech Stack](README.md#tech-stack), не запрашивать повторно без изменения среды.
