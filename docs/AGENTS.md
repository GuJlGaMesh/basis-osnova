# Внутренний справочник агента

Выбери **этап → тип мебели → специальную операцию**. Не загружай весь `docs/`. Общие обязательные ограничения — [rules.md](development/rules.md); версию среды брать из [README](../README.md#tech-stack).

## Этап и достаточный результат

| Задача | Минимальное чтение | Гейт |
|---|---|---|
| Подготовить или изменить скрипт | [Паспорт](development/intake.md) → карточка мебели → [БАЗИС](development/bazis.md) | [S0–S3](development/gates/script.md) |
| Построить и проверить модель | Паспорт ревизии → карточка мебели → [методы проверок](development/testing.md) | [G0–G7](development/gates/model.md) |
| Передать в изготовление | Протокол модели → [комплект](development/releases.md) | [G8](development/gates/production.md) |
| Оформить статус или отчёт | [Правила решения](development/quality-gates.md) → [шаблон qa.md](development/templates/qa.md) | По этапу, без переноса PASS между этапами |

## Тип мебели — открыть только нужное

| Изделие или узел | Карточка |
|---|---|
| Шкаф, тумба, стеллаж, корпус и полки | [Корпусная мебель](development/furniture/cabinet.md) |
| Наружные/внутренние ящики и направляющие | [Ящики](development/furniture/drawers.md) |
| Кухня, углы, мойка/варочная/духовка/вытяжка, GOLA, опоры | [Кухонные модули](development/furniture/kitchen.md) |
| Встроенный холодильник или морозильник | [Холодильный модуль](development/furniture/refrigerator.md) |

Специальные карточки добавлять по фактическому составу; новый тип — по [правилам расширения справочника](development/furniture/README.md). Общие правила геометрии — [modeling.md](development/modeling.md).

## Специальная операция — только при необходимости

Новое изделие → [сценарий](change-scenarios/new-feature.md); размеры/фурнитура → [настройки](change-scenarios/config-change.md); ошибка → [исправление](change-scenarios/bugfix.md); рефакторинг → [сценарий](change-scenarios/refactor.md); новый API → [совместимость](change-scenarios/api-change.md).

Генератор по файлу модели → [маршрут](development/model-to-script.md); извлечение знаний → [источники и эталоны](development/reference-models.md); ревью → [метод](development/review.md); выпуск → [контракт файлов](development/releases.md); изменение документации → [карта ответственности](README.md).
