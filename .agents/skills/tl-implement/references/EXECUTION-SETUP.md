# Execution Setup Contract

Source of truth for the `tl-implement` execution marker and the one-shot setup session that produces it. `SKILL.md` (Step 0.3) points here instead of restating the rules.

## What the setup decides

| Axis | Key | Allowed values | Default |
|---|---|---|---|
| Execution mode | `mode` | `inline` \| `subagent-per-task` \| `subagent-per-phase` | `inline` |
| Autonomy | `autonomy` | `full` \| `checkpoint` \| `interactive` | `interactive` |
| TDD ordering | `tdd` | `true` \| `false` | `false` |
| Commit policy | `commit` | `per-task` \| `per-phase` \| `none` | `per-task` |

`mode` and `autonomy` are the shared keys of the «execution modes» layer (`references/execution-modes.md`); `tdd` and `commit` are private to this skill. The default combo is behavior-identical to the legacy `tl-implement` — choosing defaults must not change anything observable.

## Marker

One line, in the plan file immediately under the H1, in the `tl-implement:` namespace:

```
# План реализации: Добавить аутентификацию
<!-- tl-implement: mode=inline autonomy=interactive tdd=false commit=per-task -->
```

Parse it leniently, per key rather than positionally: find the `<!-- tl-implement: … -->` line, then read each `key=value` independently. Key order does not matter. Any key that is missing, unreadable or carries a value outside its set falls back to that key's default — a marker written before `autonomy` existed is therefore read as `autonomy=interactive`, not as broken. Re-run the setup session only when the marker line is absent entirely or nothing parses out of it.

Writing is idempotent: replace the marker line if one is there, insert it under the H1 if not, never append at the bottom. The write touches only the plan file, so it does not trigger the uncommitted-changes prompt (`SKILL.md` Step 0.0, active-plan-file exception).

`--reconfigure` deletes the existing marker line and forces the setup session; the result overwrites the old values. It combines with `@<path>`, a task id or a range, but not with the read-only `status` / `--list` invocations, where it is ignored with a one-line notice.

## Setup session (one shot, 4 questions)

Ask all four axes in a single interaction — the user picks the combo as a whole, not in sequence. Where the host offers a quick-pick UI (`AskUserQuestion` or equivalent), use one call with four single-select questions; otherwise print the same options and read one line back in the marker's `key=value` shape, defaulting any key the reply omits.

1. **Режим** — «Как исполнять задачи?»
   - `Inline (Recommended)` — Основной агент сам пишет код задача за задачей.
   - `Субагент на задачу` — На каждую задачу поднимается отдельный субагент с фокус-промптом.
   - `Субагент на фазу` — Субагент берёт целую фазу и возвращает список выполненных task-id.
2. **Автономия** — «Насколько часто останавливаться спросить?»
   - `Интерактивно (Recommended)` — Подтверждение почти на каждом шаге. Текущее поведение.
   - `Контрольные точки` — Идёт сам, но встаёт на границах фаз и перед необратимым (коммит, пуш, миграция) и ждёт «ок».
   - `Полная` — Идёт по всему плану сам, останавливается только на настоящем блокере; мягкие вопросы решает по дефолту и помечает.
3. **TDD** — «Сначала тесты или сначала код?»
   - `Classic (Recommended)` — Код → тесты в той же PR.
   - `TDD` — Сначала падающие тесты, затем реализация до зелёного.
4. **Коммиты** — «Когда предлагать коммит?»
   - `После каждой задачи (Recommended)` — Текущее поведение.
   - `После каждой фазы` — Только на границе `### Этап N:` (в старых планах — `### Phase N:`); для плана без фаз — fall-back на per-task.
   - `Не предлагать` — Внутри сессии молча; финальный `/tl-code-review → /tl-commit` всё равно работает.

Map the answers back to the canonical values and write the marker. If the user picks a `subagent-*` mode, warn once that the host may not support subagents, in which case the run falls back to `inline`.

The four questions are asked **once per implementation session**. A marker that already exists is adopted silently — partial runs never re-ask, and only `--reconfigure` does.
