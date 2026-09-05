# Implementation Reference

Output formats and a worked example for `SKILL.md`. Behavior rules live there and in `references/EXECUTION-SETUP.md` / `references/TASK-EXECUTION.md`.

## Blocker template

```
⚠️ Блокер на задаче #4

Проблема: [описание]

Варианты:
1. Пропустить эту задачу и продолжить (отметить как заблокированную)
2. Изменить подход к задаче
3. Остановить реализацию и обсудить

Что хочешь сделать?
```

## Plan list (`--list`)

```
## Доступные планы

- <path>   (<дата>)
- <path>   (<дата>)

Использование:
- /tl-implement @<path>  для выполнения конкретного плана
- /tl-implement          для автоматического выбора (самый свежий план)
```

When nothing matches `docs/plans/*.md`:

```
Файлы планов не найдены. Создай план с помощью:
- /tl-plan --branch <описание>
- /tl-plan --no-branch <описание>
```

## Example full flow

```
Session 1:
  /tl-plan --branch Добавить аутентификацию пользователя
  → creates branch feature/user-authentication and docs/plans/2026-03-20-user-authentication.md with 6 tasks
  /tl-implement
  → setup session writes the marker, executes tasks #1–#3, user ends the session

Session 2:
  /tl-implement
  → Возобновляю реализацию...
  → reads the same plan, adopts the marker silently, sees 3/6 done
  → continues from task #4 and finishes #4–#6
  → suggests /tl-code-review, then /tl-commit
```
