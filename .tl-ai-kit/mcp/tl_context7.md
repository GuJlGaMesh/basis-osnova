# Context7 (`tl_context7`)

> Этот файл сгенерирован автоматически. Не редактируйте вручную — он перезаписывается при `init` и `update`.

MCP-сервер использует пакет [@upstash/context7-mcp](https://github.com/upstash/context7) — предоставляет контекст по документации библиотек (React, Next.js, Prisma и др.) для AI-ассистентов. Требует одну переменную окружения:

- `CONTEXT7_API_KEY`

## `CONTEXT7_API_KEY`

API-ключ Context7. Бесплатный, но нужен для разумного rate limit (без ключа запросы идут анонимно с жёсткими лимитами). Как получить:

1. Открыть дашборд: <https://context7.com/dashboard>
2. Авторизоваться (OAuth через GitHub или Google)
3. Нажать `Create API Key`, задать имя и скопировать значение

Ключ показывается один раз — сохраните его сразу.

## Готовый пример

```
CONTEXT7_API_KEY=ctx7sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Замените `ctx7sk-...` на свой ключ из дашборда. Как вставить это значение для конкретного агента (Claude Code / Codex / OpenCode) — см. [secrets.md](../secrets.md).
