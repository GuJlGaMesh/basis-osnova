# tl-tech-design — density of `## Решение`

Not a second template — the shape is `references/TEMPLATE.md`. This file calibrates the one thing a template of placeholders cannot show: how much substance the Step 4.1 sanity check («could a reviewer argue with this section alone?») actually asks for.

## Enough to argue with

```markdown
## Решение

**Предлагается:** [Вариант 1](#variant-1) — экспоненциальный retry в существующей очереди.

Доставка остаётся там же, где сейчас, и меняется только политика обработки ошибки:
вместо «упало — потеряли» сообщение возвращается в очередь с растущей задержкой
(1м → 5м → 30м → 2ч → 6ч) и живёт там до 6 часов, после чего уходит в dead-letter
с алертом. Новой инфраструктуры не появляется, вся политика читается в одном
месте — в consumer'е.

**Что принимаем как плату:** при массовом сбое крупного партнёра очередь распухает
ретраями и замедляет доставку остальным; отдельной наблюдаемости по недоставленным
событиям не будет — только dead-letter и метрики.

**Что нужно от ревью:** согласны ли, что 6-часового окна достаточно и наблюдаемости
через dead-letter хватает, или нужен outbox с полной историей доставки.

Статус: предложение, решается на встрече.
```

A reviewer who reads only this knows what appears, where it lives, what it costs and where to push back — without opening `## Варианты`. In M/L the same block additionally carries the target-state mermaid diagram.

## Too thin — the failure this guards against

```markdown
## Решение

Рекомендуется Вариант 1 (см. сравнение ниже). Окончательное решение — на встрече.
```

No concept, no accepted cost, no ask: the reviewer has to reconstruct the design from the variants, which is exactly what the format exists to prevent. A `TBD` placeholder is the same failure in shorter form.

## After the meeting

Update mode replaces the header — `**Предлагается:**` / «Что нужно от ревью» / `Статус:` — with **Выбрано** / **Почему** / **Участники** plus 3–8 hint bullets. The concept paragraph, the target diagram and «Что принимаем как плату» stay: they describe the design, not the pre-meeting state.
