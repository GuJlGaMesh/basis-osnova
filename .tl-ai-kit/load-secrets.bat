@echo off
chcp 65001 >nul
rem Загружает переменные из .tl-ai-kit/secrets.local.env в окружение родительского cmd-процесса.
rem Ограничение: значения со спецсимволами (& | > < ^ !) и пробелами по краям парсятся некорректно,
rem потому что cmd раскрывает %%B до запуска "set". Текущие токены (GITLAB_PERSONAL_ACCESS_TOKEN,
rem CONTEXT7_API_KEY) безопасны; для секретов со спецсимволами используйте PowerShell-лоадер
rem (.\.tl-ai-kit\load-secrets.ps1) — он обрабатывает их корректно.
set "TLAK_LOADED=0"
setlocal EnableDelayedExpansion
set "SECRETS_FILE=%~dp0secrets.local.env"
if not exist "%SECRETS_FILE%" (
    echo [tl-ai-kit] secrets.local.env not found: %SECRETS_FILE% 1^>^&2
    endlocal
    set "TLAK_LOADED="
    exit /b 1
)
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%SECRETS_FILE%") do (
    if not "%%A"=="" endlocal & set "%%A=%%B" & set /a TLAK_LOADED+=1 >nul & setlocal EnableDelayedExpansion
)
endlocal & set "TLAK_LOADED=%TLAK_LOADED%"
echo [tl-ai-kit] Секреты загружены: %TLAK_LOADED% переменных из .tl-ai-kit\secrets.local.env
echo [tl-ai-kit] Можно запускать агента в этом же окне: claude / codex / opencode
set "TLAK_LOADED="
