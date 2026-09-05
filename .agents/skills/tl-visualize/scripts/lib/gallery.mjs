// gallery.mjs — витрина блоков: по одному живому примеру на каждый тип
// плюс JSON, из которого он получился. Это же и источник примеров для
// `render.mjs --list`.

/**
 * Каждая запись: тип блока, когда он уместен, и минимальный рабочий пример.
 * Пример обязан быть валидным входом рендера — витрина рисуется прямо из него.
 */
export const SAMPLES = [
  {
    type: 'kpi',
    when: 'Итог в цифрах: 3–6 плиток над всей страницей. `spark` рисует форму ряда под значением — «растёт или падает», без осей и точных величин.',
    spec: {
      type: 'kpi',
      items: [
        { label: 'Задач', value: 24, note: 'в трёх фазах' },
        { label: 'Сделано', value: 9, tone: 'good', delta: '+4 за неделю', deltaTone: 'good', spark: [1, 2, 2, 5, 5, 9] },
        { label: 'Заблокировано', value: 2, tone: 'bad', note: 'ждут решения по контракту' },
        { label: 'Оценка', value: 13, unit: 'дн.' },
      ],
    },
  },
  {
    type: 'progress',
    when: 'Доля выполненного по группам: чекбоксы плана, покрытие, готовность фаз. `target` ставит засечку цели на дорожке — «сколько сделано» и «сколько нужно» на одной шкале.',
    spec: {
      type: 'progress',
      title: 'Готовность фаз',
      items: [
        { label: 'Фаза 1 · Схема данных', done: 6, total: 6, tone: 'good' },
        { label: 'Фаза 2 · API', done: 3, total: 9, target: 7, note: 'к демо нужно 7' },
        { label: 'Фаза 3 · UI', done: 0, total: 9, tone: 'neutral' },
        { label: 'Покрытие тестами', percent: 63, target: 80 },
      ],
    },
  },
  {
    type: 'table',
    when: 'Сравнение по критериям и любой плоский список записей. Колонка type: text | num | pill | bar | code; sortable, filter, rowTone.',
    spec: {
      type: 'table',
      title: 'Варианты решения',
      note: 'sortable: клик по заголовку сортирует; rowTone отмечает выбранный вариант',
      sortable: true,
      columns: [
        { key: 'name', label: 'Вариант' },
        { key: 'effort', label: 'Трудоёмкость', type: 'bar' },
        { key: 'risk', label: 'Риск', type: 'pill' },
        { key: 'cost', label: 'Стоимость, ч', type: 'num' },
        { key: 'entry', label: 'Точка входа', type: 'code', nowrap: true },
      ],
      highlight: 'name',
      rows: [
        { name: 'Saga с компенсациями', effort: 8, risk: 'средний', riskTone: 'warn', cost: 64, entry: 'billing/saga.ts', rowTone: 'good' },
        { name: 'Транзакция в одной БД', effort: 3, risk: 'низкий', riskTone: 'good', cost: 24, entry: 'billing/tx.ts' },
        { name: 'Двухфазный коммит', effort: 13, risk: 'высокий', riskTone: 'bad', cost: 104, entry: 'billing/2pc.ts' },
      ],
    },
  },
  {
    type: 'matrix',
    when: 'Пересечение двух измерений: требование × состояние, модуль × риск, роль × право. `notes: true` выносит подпись ячейки под значение.',
    spec: {
      type: 'matrix',
      title: 'Требования против текущей реализации',
      notes: true,
      rows: ['REQ-01 Импорт не падает', 'REQ-02 Повторный импорт', 'REQ-03 Отчёт в CSV'],
      columns: ['Состояние', 'Тесты', 'Документация'],
      cells: [
        { row: 'REQ-01 Импорт не падает', col: 'Состояние', value: 'конфликт', tone: 'bad', note: 'runner.ts:8' },
        { row: 'REQ-01 Импорт не падает', col: 'Тесты', value: 'нет', tone: 'warn' },
        { row: 'REQ-02 Повторный импорт', col: 'Состояние', value: 'нет', tone: 'warn' },
        { row: 'REQ-03 Отчёт в CSV', col: 'Состояние', value: 'есть', tone: 'good' },
        { row: 'REQ-03 Отчёт в CSV', col: 'Тесты', value: 'есть', tone: 'good' },
      ],
      legend: [
        { tone: 'good', label: 'реализовано' },
        { tone: 'warn', label: 'частично / нет' },
        { tone: 'bad', label: 'конфликт с кодом' },
      ],
    },
  },
  {
    type: 'graph',
    when: 'Зависимости и потоки: задачи плана, модули, шаги пайплайна. Слои и ориентация считаются автоматически; широкая схема прокручивается, а не ужимается. `group` у узла — категория (цветная полоска + легенда), `tone` — состояние (рамка), у ребра есть `tone` и `dashed`.',
    spec: {
      type: 'graph',
      title: 'Зависимости задач',
      nodes: [
        { id: 't1', label: 'Схема БД: таблица корректировок', meta: 'Task 1', group: 'Фаза 1', tone: 'good' },
        { id: 't2', label: 'Репозиторий корректировок', meta: 'Task 2', group: 'Фаза 1', tone: 'good' },
        { id: 't3', label: 'Оркестратор саги', meta: 'Task 3', group: 'Фаза 2' },
        { id: 't4', label: 'Компенсация проводок', meta: 'Task 4', group: 'Фаза 2', tone: 'warn' },
        { id: 't5', label: 'Экран истории корректировок', meta: 'Task 5', group: 'Фаза 3' },
      ],
      edges: [
        { from: 't1', to: 't2' },
        { from: 't2', to: 't3' },
        { from: 't2', to: 't4' },
        { from: 't3', to: 't5' },
        { from: 't4', to: 't5', label: 'после отката', tone: 'bad', dashed: true },
      ],
    },
  },
  {
    type: 'steps',
    when: 'Линейная цепочка: шаги воркфлоу, фазы выкатки, стадии пайплайна. Для ветвлений — graph.',
    spec: {
      type: 'steps',
      title: 'Состояние цепочки',
      items: [
        { label: 'research', status: 'готово', tone: 'good', note: 'docs/research/2026-06-18-oauth.md' },
        { label: 'spec', status: 'готово', tone: 'good', note: 'docs/specs/2026-06-18-oauth.md' },
        { label: 'plan', status: 'готово', tone: 'good', note: '8 задач' },
        { label: 'implement', status: 'в работе', tone: 'warn', note: '5/8 задач' },
        { label: 'verify', status: 'ждёт' },
        { label: 'commit', status: 'ждёт' },
      ],
    },
  },
  {
    type: '+detail',
    when: 'Не отдельный тип, а поле строки таблицы: `detail` раскрывается по клику. Строка отвечает «что это», деталь — всё остальное (полный текст задачи, критерии, тесты). Работает с фильтром и сортировкой, ищется поиском по странице, на печати раскрыта.',
    spec: {
      type: 'table',
      title: 'Задачи плана',
      note: 'клик по строке разворачивает подробности',
      columns: [
        { key: 'id', label: 'ID', nowrap: true },
        { key: 's', label: 'Задача' },
        { key: 'st', label: 'Статус', type: 'pill' },
        { key: 'd', label: 'Зависит от', nowrap: true },
      ],
      rows: [
        {
          id: 'Task 3',
          s: 'Оркестратор саги',
          st: 'в работе',
          stTone: 'warn',
          d: 'Task 2',
          rowTone: 'warn',
          detail: {
            text: '**Контекст.** Нужен последовательный откат проводок. Реализует REQ-04.\n\n**Что сделать.**\n- описать шаги саги и их порядок\n- добавить точку компенсации после каждого шага',
            meta: [
              { label: 'Файлы', value: '`src/billing/saga.ts` — создать' },
              { label: 'Acceptance criteria', value: 'сага доходит до конца на happy path' },
              { label: 'Тесты', value: 'integration на happy path' },
            ],
          },
        },
        {
          id: 'Task 4',
          s: 'Компенсация проводок',
          st: 'не начата',
          d: 'Task 2',
          detail: {
            text: '**Контекст.** Откат уже проведённых проводок.',
            meta: [
              { label: 'Файлы', value: '`src/billing/saga.ts` — изменить' },
              { label: 'Acceptance criteria', value: 'повторный вызов идемпотентен' },
              { label: 'Тесты', value: 'unit на повторный вызов' },
            ],
          },
        },
        { id: 'Task 5', s: 'Экран истории корректировок', st: 'не начата', d: 'Task 3, Task 4' },
      ],
    },
  },
  {
    type: 'donut',
    when: 'Из чего состоит целое: статусы задач, типы находок, доли в общем объёме. 2–6 долей; величины и проценты читаются в легенде рядом.',
    spec: {
      type: 'donut',
      title: 'Задачи по состоянию',
      centerLabel: 'задач',
      data: [
        { label: 'Сделано', value: 9, tone: 'good' },
        { label: 'В работе', value: 4, tone: 'warn' },
        { label: 'Не начато', value: 9, tone: 'neutral' },
        { label: 'Заблокировано', value: 2, tone: 'bad' },
      ],
    },
  },
  {
    type: '+stacked bar',
    when: 'Не отдельный тип, а `segments` вместо `value` у столбца: категория раскладывается на части одного целого. Длины столбцов остаются сравнимыми, цвет сегмента одинаков во всех столбцах.',
    spec: {
      type: 'bar',
      title: 'Фазы: из чего состоят',
      unit: 'задач',
      data: [
        {
          label: 'Фаза 1 · Хранение',
          segments: [
            { label: 'сделано', value: 6, tone: 'good' },
            { label: 'в работе', value: 0, tone: 'warn' },
            { label: 'не начато', value: 0, tone: 'neutral' },
          ],
        },
        {
          label: 'Фаза 2 · Оркестрация',
          segments: [
            { label: 'сделано', value: 3, tone: 'good' },
            { label: 'в работе', value: 4, tone: 'warn' },
            { label: 'не начато', value: 2, tone: 'neutral' },
          ],
        },
        {
          label: 'Фаза 3 · UI',
          segments: [
            { label: 'сделано', value: 0, tone: 'good' },
            { label: 'в работе', value: 0, tone: 'warn' },
            { label: 'не начато', value: 9, tone: 'neutral' },
          ],
        },
      ],
    },
  },
  {
    type: 'scatter',
    when: 'Две числовые оси сразу: трудоёмкость × ценность, риск × стоимость. `xSplit` / `ySplit` делят поле на квадранты, `quadrants` подписывает их в порядке [левый верх, правый верх, левый низ, правый низ].',
    spec: {
      type: 'scatter',
      title: 'Варианты: цена против отдачи',
      xLabel: 'Трудоёмкость, дн.',
      yLabel: 'Ценность для заказчика',
      xSplit: 8,
      ySplit: 5,
      quadrants: ['Быстрые победы', 'Крупные ставки', 'Мелочи', 'Ловушки'],
      points: [
        { label: 'Транзакция в одной БД', x: 3, y: 7, tone: 'good' },
        { label: 'Saga с компенсациями', x: 8, y: 9, tone: 'accent', note: 'выбранный вариант' },
        { label: 'Двухфазный коммит', x: 13, y: 6, tone: 'bad' },
        { label: 'Ручной откат', x: 2, y: 2 },
      ],
    },
  },
  {
    type: 'board',
    when: 'Карточки по колонкам-состояниям. Та же информация, что в таблице со статусом, но отвечает на другой вопрос: сколько всего застряло вот здесь.',
    spec: {
      type: 'board',
      title: 'Задачи по состоянию',
      columns: [
        {
          title: 'Не начато',
          items: [
            { title: 'Task 5: Экран истории', meta: ['Фаза 3', 'ждёт Task 3, Task 4'] },
            { title: 'Task 6: Экспорт в CSV', meta: ['Фаза 3'] },
          ],
        },
        {
          title: 'В работе',
          tone: 'warn',
          items: [{ title: 'Task 3: Оркестратор саги', text: 'Реализует REQ-04.', badge: 'риск', meta: ['Фаза 2'] }],
        },
        {
          title: 'Сделано',
          tone: 'good',
          items: [
            { title: 'Task 1: Схема БД', meta: ['Фаза 1'] },
            { title: 'Task 2: Репозиторий', meta: ['Фаза 1'] },
          ],
        },
      ],
    },
  },
  {
    type: '+heat',
    when: 'Не отдельный тип, а `heat: true` у матрицы: фон ячейки красится плотностью по числу, а не категорией. Для величины (коммитов, обращений, строк), когда «хорошо/плохо» неприменимо. Шкала печатается сама.',
    spec: {
      type: 'matrix',
      title: 'Коммиты по модулям и месяцам',
      heat: true,
      unit: 'коммитов',
      rows: ['src/billing', 'src/api', 'src/ui'],
      columns: ['Май', 'Июнь', 'Июль'],
      cells: [
        { row: 'src/billing', col: 'Май', value: 4 },
        { row: 'src/billing', col: 'Июнь', value: 31 },
        { row: 'src/billing', col: 'Июль', value: 22 },
        { row: 'src/api', col: 'Май', value: 12 },
        { row: 'src/api', col: 'Июнь', value: 9 },
        { row: 'src/api', col: 'Июль', value: 2 },
        { row: 'src/ui', col: 'Июнь', value: 1 },
        { row: 'src/ui', col: 'Июль', value: 17 },
      ],
    },
  },
  {
    type: '+collapsible',
    when: 'Модификатор любого блока, а не отдельный тип: `collapsible: true` (+ `open: true`, чтобы раскрыть сразу). Полная деталь под катом стоит одну строку и не пропадает при печати.',
    spec: {
      type: 'table',
      title: 'Все задачи',
      note: '3 шт · свёрнуто',
      collapsible: true,
      columns: [
        { key: 'id', label: 'ID' },
        { key: 's', label: 'Задача' },
        { key: 'st', label: 'Статус', type: 'pill' },
        { key: 'd', label: 'Зависит от' },
      ],
      rows: [
        { id: 'Task 1', s: 'Схема БД для корректировок', st: 'сделано', stTone: 'good', d: '—' },
        { id: 'Task 2', s: 'Репозиторий корректировок', st: 'сделано', stTone: 'good', d: 'Task 1' },
        { id: 'Task 3', s: 'Оркестратор саги', st: 'в работе', stTone: 'warn', d: 'Task 2' },
      ],
    },
  },
  {
    type: 'timeline',
    when: 'Что за чем во времени: фазы, этапы выкатки, длительности. start/end — ISO-дата или число; markers — вертикальные отметки («сегодня», дедлайн); элемент без end — веха-ромб.',
    spec: {
      type: 'timeline',
      title: 'План выкатки',
      markers: [{ at: '2026-06-13', label: 'сегодня' }],
      items: [
        { label: 'Схема и миграции', start: '2026-06-01', end: '2026-06-05', group: 'Фаза 1', tone: 'good' },
        { label: 'Репозиторий', start: '2026-06-04', end: '2026-06-09', group: 'Фаза 1', tone: 'good' },
        { label: 'Оркестратор саги', start: '2026-06-09', end: '2026-06-19', group: 'Фаза 2' },
        { label: 'Компенсации', start: '2026-06-15', end: '2026-06-24', group: 'Фаза 2', tone: 'warn', note: 'риск' },
        { label: 'Экран истории', start: '2026-06-22', end: '2026-06-30', group: 'Фаза 3' },
        { label: 'Демо заказчику', start: '2026-06-30', group: 'Фаза 3', tone: 'accent' },
      ],
    },
  },
  {
    type: 'bar',
    when: 'Сравнение величин по категориям. По умолчанию горизонтальный — длинные подписи читаются. Один ряд — один цвет; цвет освобождён под tone.',
    spec: {
      type: 'bar',
      title: 'Файлы с наибольшим числом изменений',
      unit: 'строк',
      data: [
        { label: 'src/billing/saga.ts', value: 412 },
        { label: 'src/billing/repository.ts', value: 264 },
        { label: 'src/api/corrections.ts', value: 151 },
        { label: 'tests/saga.spec.ts', value: 96, tone: 'good' },
      ],
    },
  },
  {
    type: 'line',
    when: 'Динамика во времени, один или несколько рядов.',
    spec: {
      type: 'line',
      title: 'Открытые вопросы по неделям',
      x: ['н1', 'н2', 'н3', 'н4', 'н5', 'н6'],
      series: [
        { name: 'Открыто', values: [12, 14, 11, 7, 5, 2] },
        { name: 'Закрыто', values: [0, 3, 6, 10, 13, 17] },
      ],
    },
  },
  {
    type: 'cards',
    when: 'Разнородные сущности с описанием: находки, риски, варианты, участки кода.',
    spec: {
      type: 'cards',
      title: 'Находки исследования',
      items: [
        {
          title: 'Импорт останавливается на первой ошибке',
          badge: 'блокер',
          tone: 'bad',
          text: 'Жёсткий `throw` в цикле обработки: 97 валидных строк не доезжают до каталога.',
          meta: [{ label: 'Где', value: '`src/import/price/runner.ts:8`' }],
        },
        {
          title: 'Формат CSV уже согласован соседним экспортом',
          badge: 'можно переиспользовать',
          tone: 'good',
          text: 'UTF-8 с BOM, разделитель `;` — конвенция закреплена в `src/export/stock.ts`.',
        },
      ],
    },
  },
  {
    type: 'tree',
    when: 'Иерархия: структура каталогов, разбор документа, дерево решений.',
    spec: {
      type: 'tree',
      title: 'Затрагиваемые модули',
      items: [
        {
          label: 'src/billing',
          meta: 'ядро изменений',
          children: [
            { label: 'saga.ts', meta: 'новый', tone: 'good' },
            { label: 'repository.ts', meta: 'правки', tone: 'warn' },
          ],
        },
        { label: 'src/api/corrections.ts', meta: 'новый эндпоинт', tone: 'good' },
      ],
    },
  },
  {
    type: 'code',
    when: 'Команда, JSON, лог, фрагмент конфига — дословно и с экранированием. Не для кода «на посмотреть»: если фрагмент не отвечает на вопрос страницы, ему тут не место.',
    spec: {
      type: 'code',
      title: 'Вызов инструмента в транскрипте',
      lang: 'json',
      note: 'первый вызов после старта сессии',
      text:
        '{"tool":"Grep",\n' +
        ' "pattern":"minio|MinIO|S3Client",\n' +
        ' "output_mode":"files_with_matches",\n' +
        ' "head_limit":60}',
    },
  },
  {
    type: 'callout',
    when: 'Один акцент: решение, риск, допущение. Не для длинного текста.',
    spec: {
      type: 'callout',
      tone: 'warn',
      title: 'Допущение',
      text: 'Компенсация проводок считается идемпотентной. Если это не так — вариант 1 отпадает целиком.',
    },
  },
  {
    type: 'prose',
    when: 'Связный текст между блоками. Поддерживает **жирный**, *курсив*, `код`, [ссылки](https://example.org), списки через `- ` и `1. `, чекбоксы `- [ ]` / `- [x]`. Список распознаётся и внутри абзаца, после строки-заголовка.',
    spec: {
      type: 'prose',
      text: 'Страница собрана из плана `docs/plans/corrections.md`.\n\n**Что взято из документа.**\n- чекбоксы и секции плана\n- порядок фаз сохранён как в документе\n\n**Открытые вопросы плана.**\n- [x] формат идентификатора корректировки\n- [ ] кто подтверждает откат проводок',
    },
  },
  {
    type: 'section',
    when: 'Разделитель-заголовок между смысловыми частями страницы.',
    spec: { type: 'section', title: 'Раздел страницы', note: 'подпись под заголовком, необязательна' },
  },
  {
    type: 'row',
    when: 'Два-три блока рядом. Вкладывает любые блоки, кроме себя.',
    spec: {
      type: 'row',
      blocks: [
        { type: 'kpi', items: [{ label: 'Слева', value: 42 }] },
        { type: 'kpi', items: [{ label: 'Справа', value: 17, tone: 'good' }] },
      ],
    },
  },
  {
    type: 'svg',
    when: 'Своя картинка на общих токенах: рамка, заголовок и прокрутка уже на месте, рисовать нужно только саму схему. Содержимое НЕ экранируется. Берётся тогда, когда механизм, который надо показать, не ложится ни на один блок.',
    spec: {
      type: 'svg',
      title: 'Путь запроса через компенсацию',
      note: 'своя схема: готового блока под неё нет',
      viewBox: '0 0 620 130',
      height: 130,
      content:
        '<defs><marker id="ex-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"></path></marker></defs>' +
        '<rect x="8" y="34" width="130" height="46" rx="8" fill="var(--surface-2)" stroke="var(--border)"></rect>' +
        '<text class="node-label" x="26" y="62">Отмена акта</text>' +
        '<path class="edge" d="M 142 57 L 214 57" marker-end="url(#ex-arrow)"></path>' +
        '<rect x="220" y="34" width="150" height="46" rx="8" fill="var(--surface-2)" stroke="var(--good)" stroke-width="1.5"></rect>' +
        '<text class="node-label" x="238" y="62">Сага: шаг 1..N</text>' +
        '<path class="edge" d="M 374 57 L 446 57" marker-end="url(#ex-arrow)" style="stroke:var(--bad)"></path>' +
        '<text class="edge-label" x="410" y="48" text-anchor="middle">ошибка</text>' +
        '<rect x="452" y="34" width="160" height="46" rx="8" fill="var(--surface-2)" stroke="var(--bad)" stroke-width="1.5"></rect>' +
        '<text class="node-label" x="470" y="62">Компенсация</text>' +
        '<text class="ax" x="8" y="108">Классы и токены страницы доступны внутри: node-label, edge, edge-label, var(--bad).</text>',
    },
  },
  {
    type: 'raw',
    when: 'Аварийный выход для собственной вёрстки (не картинки — для неё есть `svg`). Содержимое НЕ экранируется — не подставляй туда непроверенный текст. Доступны токены темы и утилиты `u-*`.',
    spec: {
      type: 'raw',
      html: '<div class="card u-row"><svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" stroke-width="5" stroke-dasharray="70 100"></circle></svg><div class="u-stack"><b>Своя вёрстка</b><div class="u-muted u-small">те же токены и утилиты: <span class="u-mono">var(--accent)</span>, <span class="u-mono">.card</span>, <span class="u-mono">.u-row</span>, <span class="u-mono">.u-stack</span></div></div></div>',
    },
  },
];

/** Собирает spec витрины: описание + живой пример + исходный JSON. */
export function gallerySpec() {
  const blocks = [
    {
      type: 'prose',
      card: false,
      text:
        'Страница собирается командой `node scripts/render.mjs --gallery`. Никаких внешних зависимостей: ' +
        'всё рисуется inline SVG и CSS, файл открывается офлайн двойным кликом.\n\n' +
        '- `tone` (`good` / `warn` / `bad` / `info` / `accent`) есть почти везде и означает состояние, а не оформление\n' +
        '- `collapsible: true` — модификатор любого блока: деталь под катом стоит одну строку\n' +
        '- `detail` у строки таблицы — раскрыть по клику всю запись целиком\n' +
        '- меню разделов в шапке появляется само, когда на странице три и больше `section`\n' +
        '- тема одна, тёмная; на печати токены сами переключаются на бумажные',
    },
  ];
  for (const s of SAMPLES) {
    blocks.push({ type: 'section', title: s.type, note: s.when });
    blocks.push(s.spec);
    // Сам каталог собран из тех же блоков: исходник примера — обычный `code` под катом.
    blocks.push({
      type: 'code',
      title: 'JSON блока',
      lang: 'json',
      collapsible: true,
      text: JSON.stringify(s.spec, null, 2),
    });
  }
  return {
    title: 'Каталог блоков',
    subtitle: 'tl-visualize',
    // Витрина сама показывает, как выглядит вводка: что за страница и зачем её открывают.
    intro:
      '**Каталог блоков рендера `tl-visualize`.** Сверху — как блок выглядит, под ним — JSON, ' +
      'который его породил.' +
      '\n\nСтраница нужна, чтобы выбрать форму под данные, не угадывая: посмотреть блок вживую, ' +
      'забрать его JSON и свериться с `references/BLOCKS.md` по формату полей.',
    blocks,
  };
}
