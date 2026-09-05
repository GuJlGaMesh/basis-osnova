# Настройка секретов

> Этот файл сгенерирован автоматически. Не редактируйте вручную — он перезаписывается при `init` и `update`.

Следующие MCP-серверы и скиллы требуют переменных окружения:

- **tl_context7** (mcp): CONTEXT7_API_KEY — [как получить](mcp/tl_context7.md)

## Быстрый старт (рекомендуемый способ)

1. Откройте [`secrets.local.env`](secrets.local.env), заполните значения.
2. Перед запуском агента загрузите переменные в shell **(выбрать в зависимости от терминала)**:
   - **Windows cmd.exe:** `call .tl-ai-kit\load-secrets.bat`
   - **Windows PowerShell:** `. .\.tl-ai-kit\load-secrets.ps1` (точка перед путём — dot-source, обязательна)
3. Запустите агента **в том же терминале**: `claude` / `codex` / `opencode`.

`secrets.local.env` попадает в `.tl-ai-kit/.gitignore` и не коммитится.

> **Важно.** `set` (cmd) и `Set-Item Env:` (PowerShell) выставляют переменные только в текущем процессе shell — они **не попадают** в User/System variables Windows и не видны в других терминалах. Это by design: секретам не место в глобальном реестре. Запускайте агента в том же окне, где делали `call`/`dot-source`.

> **PowerShell и .bat.** Команда `call .tl-ai-kit\load-secrets.bat` из PowerShell **не сработает** — `call` это синтаксис cmd.exe. Используйте `load-secrets.ps1` для PowerShell либо откройте отдельное окно `cmd.exe` для .bat.

### Как проверить, что загрузка сработала

В том же терминале после `call`/`dot-source`:

```cmd
:: Windows cmd.exe
echo %GITLAB_PERSONAL_ACCESS_TOKEN%
```
```powershell
# Windows PowerShell
$env:GITLAB_PERSONAL_ACCESS_TOKEN
```

Если выводится значение — загрузка сработала. Если пусто или печатается литерал `%GITLAB_...%` — вы используете не ту команду проверки для вашего shell (cmd-синтаксис `%VAR%` в PowerShell не раскрывается).

## JetBrains IDE: переменные окружения один раз (Rider, IntelliJ, GoLand, …)

Если работаете в JetBrains IDE, можно прописать переменные **один раз** в настройках встроенного терминала — тогда каждое новое терминал-окно в IDE сразу получает их без `call`/`dot-source`.

1. **Settings → Tools → Terminal → Project Settings**.
2. В поле **Environment variables** заполните значения в формате `KEY=value;KEY2=value2` (разделитель — `;`):

   ```
   GITLAB_PERSONAL_ACCESS_TOKEN=glpat-xxxx;OTHER_TOKEN=yyyy
   ```

3. **Save**. Настройки лежат в `.idea/workspace.xml` — по умолчанию gitignored, в репозиторий не утекает.
4. Откройте **новый** терминал в IDE и запускайте агента — лоадер вызывать не нужно.

> **Только для встроенного терминала IDE.** Внешний `cmd`/PowerShell этих переменных не увидит — там по-прежнему `load-secrets.bat`/`load-secrets.ps1`.

## Альтернативы для отдельных агентов

### Codex CLI

Для Codex доступен **только** способ через bat/ps1-лоадер выше — `.env` из корня Codex не читает, а секции `[mcp_servers.<name>.env]` в `config.toml` мы больше не генерируем. В `.codex/config.toml` передаётся только `env_vars = [...]` — список имён, а значения берутся из shell environment.

### Codex Desktop на Windows

Обычный запуск Codex Desktop через меню «Пуск» не видит секреты из `.tl-ai-kit/secrets.local.env`. Из-за этого MCP-серверы и скиллы, которым нужны токены, не смогут войти во внешние системы.

На Windows эту проблему решает PowerShell-launcher. Он загружает секреты и сразу запускает Codex Desktop с нужными переменными окружения. Значения остаются в `secrets.local.env` и не попадают в User/System environment.

#### Что настроить один раз

1. Заполни `.tl-ai-kit/secrets.local.env`.
2. CLI предложит записать секреты в переменные окружения пользователя. Если хочешь хранить их только в `secrets.local.env` и запускать Codex через launcher, ответь «Нет». Если ответишь «Да», Codex получит секреты из пользовательского окружения без launcher.
3. Создай файл `start-codex-desktop.ps1` в удобной папке и вставь в него код ниже.

Сам launcher не содержит секретов. Его можно хранить в обычной папке и создать для него ярлык.

#### Launcher

```powershell
$ErrorActionPreference = 'Stop'

$TlAiKitDir = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.tl-ai-kit'
$Loader = Join-Path $TlAiKitDir 'load-secrets.ps1'

if (-not (Test-Path -LiteralPath $Loader -PathType Leaf)) {
    throw "Лоадер не найден: $Loader"
}

. $Loader

$CodexApp = Get-StartApps |
    Where-Object { $_.AppID -like 'OpenAI.Codex_*!App' } |
    Select-Object -First 1

if (-not $CodexApp) {
    throw 'Codex Desktop не найден в меню «Пуск»'
}

Start-Process -FilePath 'explorer.exe' `
    -ArgumentList "shell:AppsFolder\$($CodexApp.AppID)"
```

Пример использует глобальную установку `~/.tl-ai-kit`. Для проектной установки замени `$TlAiKitDir` на абсолютный путь к `<project>\.tl-ai-kit`.

#### Как запускать Codex дальше

1. Полностью закрой Codex Desktop, если он уже работает.
2. Запусти `start-codex-desktop.ps1` через PowerShell. Например:

   ```powershell
   powershell.exe -NoProfile -File "C:\tools\start-codex-desktop.ps1"
   ```

3. Дождись открытия Codex Desktop. MCP-серверы и скиллы получат секреты из `secrets.local.env`.

Запускай Codex через этот launcher каждый раз, когда нужны MCP или скиллы с секретами. Обычный ярлык из меню «Пуск» запускает приложение без них.

Если изменил значение в `secrets.local.env`, полностью закрой Codex Desktop и запусти его через launcher ещё раз. Уже работающий процесс не получит новые переменные.
