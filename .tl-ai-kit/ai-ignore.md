# Что исключать при поиске для ИИ

> Этот файл сгенерирован автоматически. Не редактируйте вручную — он перезаписывается при `init` и `update`.

AI-агент тратит контекст на каждый файл, который попадает ему на глаза. Чтобы агент работал быстрее и точнее, нужно отсечь шум (билды, кеши, логи, сгенерированные артефакты), но при этом оставить ему доступ к знаниям о проекте: документации, тестам, миграциям, ADR.

## Что обычно стоит исключать

- `node_modules/`
- `bin/`, `obj/`, `dist/`, `build/`
- `coverage/`, `TestResults/`
- `.vs/`, `.idea/`, `.vscode/` — если содержат локальный шум
- логи, дампы, временные файлы
- локальные `.env`
- машинно-зависимые конфиги
- крупные сгенерированные артефакты

## Что обычно НЕ стоит исключать

- `docs/`
- тесты
- миграции
- API-схемы
- инфраструктурные манифесты
- шаблоны конфигов
- ADR

## Базовый принцип

На `.gitignore` **надеяться нельзя**: разные CLI-агенты обращаются с ним по-разному, а явное чтение по пути всё равно достанет файл в обход любых ignore-правил. `.gitignore` — это про git, не про AI.

Инструкции в `AGENTS.md` и ignore-файлы помогают убрать шум из автоматического search, но это не security boundary: модель может прочитать файл по подсказанному пути. Если нужен технический запрет, используйте sandbox-enforced ограничения агента, если он их поддерживает. Секреты всё равно держите вне репозитория (см. [`secrets.md`](secrets.md)).

## Claude Code

`permissions.deny` в `.claude/settings.json`. Правила сматчиваются на каждый инструмент отдельно, поэтому маску перечисляйте для всех трёх (`Read`, `Glob`, `Grep`) — иначе путь закроется только частично:

```json
{
  "permissions": {
    "deny": [
      "Read(./bin/**)",
      "Read(./obj/**)",
      "Read(./TestResults/**)",
      "Glob(./bin/**)",
      "Glob(./obj/**)",
      "Glob(./TestResults/**)",
      "Grep(./bin/**)",
      "Grep(./obj/**)",
      "Grep(./TestResults/**)"
    ]
  }
}
```

## Codex CLI

В Codex доступ sandboxed-команд к файлам можно технически ограничить через permission profile в `.codex/config.toml`. Этот механизм пока имеет статус beta. Для синтаксиса из примера нужен Codex CLI `0.133.0` или новее.

Ограничение действует только внутри sandbox. Если вы вручную подтвердите escalation или заранее разрешите команду через `.rules`, она запустится вне sandbox и сможет прочитать файлы с `deny`. Перед подтверждением проверяйте саму команду и не выдавайте ей больше прав, чем нужно:

```toml
default_permissions = "project"

[permissions.project]
description = "Workspace access without generated files and local secrets."
extends = ":workspace"

[permissions.project.filesystem]
glob_scan_max_depth = 32

[permissions.project.filesystem.":workspace_roots"]
"**/.env*" = "deny"
"**/secrets.local.env" = "deny"
"**/bin/**" = "deny"
"**/obj/**" = "deny"
"**/TestResults/**" = "deny"
"**/coverage/**" = "deny"
```

`deny` закрывает чтение и сканирование подходящих файлов из workspace. Имя профиля `project` произвольное — главное, чтобы оно совпадало с `default_permissions` и секцией `[permissions.<имя>]`.

Команды, которые нужно запускать вне sandbox, можно точечно разрешить в `.codex/rules/*.rules`. Имя файла любое; `build.rules` ниже — только пример:

```python
# .codex/rules/build.rules
prefix_rule(
    pattern = ["msbuild", "Project.sln"],
    decision = "allow",
    justification = "Allow MSBuild commands for Project.sln outside the sandbox.",
)
```

Файлы `.rules` не ограничивают доступ к файлам: `decision = "allow"` запускает совпавшую команду вне sandbox и без дополнительного запроса. Поэтому делайте `pattern` как можно уже и разрешайте только команды, которым доверяете. Подробнее — в [Codex Permissions](https://developers.openai.com/codex/permissions) и [Codex Rules](https://developers.openai.com/codex/rules).

Инструкцию в корневом `AGENTS.md` можно оставить для файлов, которые не нужно сканировать без жёсткого запрета. Это поведенческая подсказка модели, а не технический фильтр:

```markdown
## Поиск по репозиторию

Не читай и не сканируй файлы из:
- `bin/`, `obj/`, `TestResults/`, `coverage/`
- сгенерированные `*.Designer.cs`, `*.g.cs`

Эти артефакты не несут смысла, они только раздувают контекст.
```

## OpenCode

Три механизма, можно комбинировать:

- **`.ignore` или `.rgignore`** в корне репозитория (синтаксис ripgrep) — фильтруют search.
- **`watcher.ignore`** в `opencode.json` — какие пути не мониторить:

  ```json
  {
    "watcher": {
      "ignore": ["node_modules/**", "dist/**", "TestResults/**"]
    }
  }
  ```

- **Инструкция в `AGENTS.md`** — поведенческая подсказка, как у Codex. `AGENTS.md` общий, одна правка покрывает оба инструмента:

  ```markdown
  ## Поиск по репозиторию

  Игнорируй при поиске и чтении: `bin/`, `obj/`, `dist/`, `TestResults/`.
  ```

## Rider / JetBrains AI Assistant

Если параллельно с CLI-агентом вы открываете проект в Rider (или другой JetBrains IDE) и используете встроенный AI Assistant или Junie — их настраивают **отдельно**: они работают со своим контекстом, а не с настройками CLI-агентов.

Главный механизм — файл **`.aiignore`** в корне проекта (синтаксис идентичен `.gitignore`). Подключение:

1. **Settings → Tools → AI Assistant → Project Settings**.
2. Включить чекбокс **Enable .aiignore** и нажать **Create .aiignore file**.
3. Заполнить паттернами шума.

Пример `.aiignore`:

```gitignore
# Билды и кеши
bin/
obj/
dist/
build/
TestResults/
coverage/

# IDE-локальный шум
.idea/
.vs/
*.iml

# Логи
*.log
```

`.aiignore` коммитится — настройки шарятся с командой.

> **Excluded Folders и Scopes в Rider** (Mark Directory as → Excluded, Settings → Project Structure → Excluded Folders, Settings → Appearance & Behavior → Scopes) влияют на индекс самой IDE — поиск, навигацию, рефакторинги. На контекст AI Assistant они **не** влияют: он смотрит на `.aiignore`. Если хотите дополнительно облегчить индекс IDE — используйте эти механизмы, но их роль ортогональна AI-фильтрации.
