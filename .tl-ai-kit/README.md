# .tl-ai-kit

> Этот файл сгенерирован автоматически. Не редактируйте вручную — он перезаписывается при `init` и `update`.

## Содержание

- [Настройка секретов](secrets.md) — переменные окружения для установленных MCP-серверов
- [Skills](skills.md) — описание установленных скилов и их место в workflow
- [Если скиллов слишком много](skills.md#если-скиллов-слишком-много) — почему лишние скиллы мешают и как свернуть или убрать их
- [Что исключать при поиске для ИИ](ai-ignore.md) — список папок-шума и tool-specific конфиги для Claude Code, Codex, OpenCode, Rider
- [Настройка MCP](mcp/) — инструкции по токенам и URL для установленных MCP-серверов

## Команды

```bash
# Обновить все компоненты до версии из пакета
npx git+ssh://git@gitlab.tl-lan.ru:dev-platform/dev-tools/tl-ai-kit.git update

# Добавить отдельный компонент
npx git+ssh://git@gitlab.tl-lan.ru:dev-platform/dev-tools/tl-ai-kit.git add <type:name>

# Разложить секреты из secrets.local.env по агентам
npx git+ssh://git@gitlab.tl-lan.ru:dev-platform/dev-tools/tl-ai-kit.git secrets

# Удалить все управляемые компоненты
npx git+ssh://git@gitlab.tl-lan.ru:dev-platform/dev-tools/tl-ai-kit.git uninstall
```
