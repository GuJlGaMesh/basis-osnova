<!-- tl-ai-kit:agent-rules -->
## Nested `AGENTS.md` — rule for Codex CLI

Before you touch files in a subdirectory you have not worked in yet, check the nested `AGENTS.md` files on the path from the session's start directory to that file — once. Do not re-read instructions that are already loaded, and do not scan other subdirectories.

If your harness picks up nested `AGENTS.md` files on its own, skip this section.
<!-- /tl-ai-kit:agent-rules -->

# Работа с БАЗИС-Мебельщиком

## Перед любой задачей: контекст из docs/

1. Открой [docs/AGENTS.md](docs/AGENTS.md) и выбери сценарий в `docs/change-scenarios/`.
2. Прочитай его раздел «Читать сначала»; если сценария нет — `docs/architecture/overview.md`.
3. Перед изменением файлов прочитай `docs/development/rules.md`; перед проверками — `docs/development/testing.md`.
4. Перед подготовкой скрипта собери паспорт по `docs/development/intake.md`. Не угадывай критические размеры, материал, фурнитуру и возможности API.
5. Результат задачи моделирования — готовый `.js` и комплект по `docs/development/releases.md`. Запуск в БАЗИС выполняет человек или агент при доступном управлении и разрешении пользователя; отсутствие локального БАЗИС или управления его окном не блокирует подготовку скрипта.
6. Завершай работу отчётом по `docs/development/quality-gates.md`: отдельно готовность скрипта и модели. Запуск и геометрия не проверены до выполнения в БАЗИС; непроведённая проверка не считается пройденной.
7. По умолчанию скрипт дополняет текущую модель: проверка входов → новый отдельный блок → вставка вплотную с выравниванием по лицу. Существующие объекты не удалять и не изменять. Замена допустима только по отдельному явному запросу; подробности — `docs/development/bazis.md`.
8. Перед выдачей `.js` обязательно проверить кодировку по правилу 12 в `docs/development/rules.md`: ASCII без BOM, русские строки через `\uXXXX`.

Документация проекта — на русском, технические имена API сохраняются без перевода.
Подтверждённую целевую версию БАЗИС бери из раздела Tech Stack в [README.md](README.md), не запрашивай её повторно без изменения среды.
Не называй модель готовой к изготовлению без проверок сохранённого файла и допуска технолога.
