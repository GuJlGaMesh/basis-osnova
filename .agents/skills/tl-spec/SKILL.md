---
name: tl-spec
description: >-
  Collects requirements into a spec with stable REQ-NN ids, reconciled with the code. Not for: solution variants → tl-tech-design; breaking work into tasks → tl-plan; investigating how code works → tl-research; co-authoring an RFC/PRD → tl-doc-coauthoring. Use when: собери требования, постановка задачи, спека, сверь требования с кодом.
argument-hint: "[--update <path>] [--slug <slug>] <topic>"
allowed-tools: Read Write Edit Glob Grep Bash(git *) Bash(mkdir *) Bash(basename *) AskUserQuestion
disable-model-invocation: false
---

# Spec — Requirements Document

Turn a fuzzy request into a reviewable requirements document. The skill first checks what the inputs claim about the system against what the repository actually does, then asks clarification questions while blocking unknowns remain, checks every drafted requirement against the code, records the delta, and closes the run by proposing a concrete resolution for everything still open. `init` mode produces the document; `update` mode (`--update <path>`, Step U.* below) answers open questions and appends new requirements.

A spec answers **WHAT** the system must do. It never proposes solution variants or architecture (that is `/tl-tech-design`) and never breaks work into tasks (that is `/tl-plan`).

The document is always saved to `docs/specs/<YYYY-MM-DD>-<slug>.md` — a flat file, not a folder.

Two references carry what this file deliberately does not restate: `references/TEMPLATE.md` — the document shape, the section rules and the conformance checklist; `references/CLARIFICATION.md` — the blocking test, the delegation routing and the coverage dimensions of a round.

---

## Workflow

### Step 0: Load Project Context

Read `references/project-context.md` at the start of the run and load the baseline it lists. `docs/architecture/overview.md` is the one that carries weight here: the Step 3 gap analysis has to start from the real module map instead of a guessed one.

**Project overrides:** read `docs/skill-context/tl-spec/SKILL.md` if it exists — its rules override this skill's own on conflict; how to apply them: `references/skill-context.md`. Here «all outputs» covers the document sections, the frontmatter values, the requirement format and the questions asked; typical rules a project puts there: «каждое требование ссылается на тикет», «приоритеты P0/P1/P2, а не must/should/could».

### Step 0.1: Ensure Git Repository

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || git init
```

Without a git repository the document is detached from history and the gap analysis has no baseline; warn the user and ask whether to `git init` here.

### Step 0.2: Parse Arguments

From `$ARGUMENTS`:

- `--update <path>` → update mode (**Step U.1**); the rest of the arguments is extra input for the update (new requirements, answers), not a new topic.
- `--slug <slug>` → explicit slug, skips auto-generation in Step 5. Missing or invalid value (not kebab-case ASCII ≤50 chars) → ask for one via AskUserQuestion.
- everything else → the topic for init mode (Step 1 onwards). An empty topic without `--update` → ask first: «О чём собираем требования? Опиши задачу в паре предложений — этого хватит, детали уточню вопросами.»

### Step 1: Decide scope (init mode)

Three signals mean the user probably wants a neighbouring skill: the request asks **how** to build it («какой вариант выбрать», «сравни подходы») → design review; it asks for a **task breakdown** («разбей на задачи», «составь план») → planning; the requirement is already unambiguous and fits in one sentence with no unknowns → a spec document is overhead.

When any of these fires, surface the choice — **the skill never switches flows by itself**:

```
AskUserQuestion: Похоже, тебе нужен не сбор требований. Что делаем?

Options:
1. Всё равно собрать спеку — продолжаем /tl-spec
2. Перейти к /tl-tech-design — если вопрос про варианты решения и архитектуру
3. Перейти к /tl-plan — если требования уже понятны и нужны задачи
4. Отмена
```

If the user picks a neighbour, print the exact command and stop — do not run it.

### Step 2: Gather initial input

At most one AskUserQuestion session, **≤4 questions**, asked in a single call:

1. «Что за задача и чья это боль — кто страдает сейчас и как?» → `## Проблема и контекст` + the first draft of `## Требования`
2. «Откуда брать вводные — есть Jira/Confluence, артефакт `/tl-research`, переписка? Если ничего нет — так и скажи.» → frontmatter `sources` + `## Источники`
3. «Что точно НЕ входит в задачу — какие соседние кейсы оставляем за бортом?» → `## Non-goals`
4. «Какие ограничения уже известны — совместимость, сроки, стек, объёмы?» → `## Scope` + the non-functional requirements

**This session is subtractive.** Test each of the four against the topic statement and delete any the user has effectively answered already: «сделать API из SQL, который выполняли вручную» answers 1 (боль — гоняют руками) and 2 (вводные — сам запрос), so only 3 and 4 survive. **If the topic statement answers all four, skip Step 2 entirely** — a session of questions the user has already answered reads as not listening.

A skipped question does not block: the gap goes into the ambiguity ledger in Step 4. This is the only gathering session in init mode; everything else is asked by the loop.

### Step 2.5: Reconcile the inputs with the code

The inputs describe the system as somebody believes it works — a ticket written three sprints ago, a wiki page nobody refreshed, a colleague's retelling. A requirement built on a stale premise is wrong before the first line of code, so the claims are checked **before** they turn into `REQ-NN`.

**What counts as a claim.** Every present-tense statement about the current system in the topic, in the Step 2 answers and in each item of `sources`: «сейчас лимит 100 строк», «эндпоинт уже есть», «статус не сохраняется», «делаем руками через SQL», a named module, a version, a default, a flag, a table. A wish («хотим, чтобы…») is a requirement and belongs to Step 3; a claim is what the input asserts already exists.

Read what can be read: a local path in `sources` is opened with `Read`. A link the host cannot fetch is not guessed at — mark it «со слов источника» and verify only the part the repository can answer.

**Verdict per claim**, with the same evidence discipline as Step 3 — no citation without a `Read`, and a search that found nothing names its queries:

| Verdict | Criterion |
|---|---|
| `подтверждено` | The code does what the input says — citation `path/to/file.ext:123`. |
| `устарело` | It used to be so; the code now does something else — citation of what it does today. |
| `не найдено` | Nothing in the repository confirms or denies it — followed by `Искали: <queries and paths actually run>`. |
| `противоречит` | The code states the opposite of the claim — citation. |

**HARD RULE — a broken premise is never silently repaired.** Every `устарело` / `противоречит` claim that a draft requirement rests on enters the ambiguity ledger in Step 4 as **blocking**, and the user picks which side is right: the input may be stale, or the code may be exactly the bug this task is about. Quietly rewriting the requirement to match the code buries the most valuable thing this step finds.

**Where it lands.** `## Проблема и контекст` describes the state the code actually shows, not the input's version of it; the `## Источники` line for that source says what turned out stale («— актуально, кроме лимита в 100 строк: в коде 500, `src/import/limits.ts:12`»); anything still unresolved becomes a `- [ ] open:` item and is picked up again by Step 7.5.

**Scale.** Verify the claims a requirement depends on; a passing remark nobody builds on is not worth a grep. If the topic makes no claims about the current system at all (greenfield ask, no sources), say so in one line and go to Step 3 — the step is never skipped silently.

### Step 3: Gap analysis against current implementation

This step is what separates a spec from a wish list. It runs **before** the clarification loop, because a `конфликт` verdict is itself a question for the user, and it starts from the facts Step 2.5 confirmed rather than from the input's account of them.

For each draft requirement, explore with `Glob` / `Grep` / `Read`: the modules and entry points it would touch; behaviour that already does part of what it demands; behaviour that **contradicts** it — a hard-coded limit, an opposite default, an early return.

**Classification.** Give every draft requirement exactly one verdict:

| Verdict | Criterion |
|---|---|
| `нет` | Nothing in the repository implements this behaviour or anything adjacent to it. |
| `частично` | Adjacent behaviour exists but does not cover the requirement — right place, wrong or incomplete behaviour. |
| `есть` | Already implemented as stated; the spec only records it. |
| `конфликт` | The code deliberately does something else, so satisfying the requirement means changing existing agreed behaviour. |

`частично` versus `конфликт` is the tricky pair: `частично` means «not enough yet», `конфликт` means «currently the opposite». When in doubt, call it `конфликт` — it costs one question and prevents a silent behaviour change.

**HARD RULE — no citation without a Read.** Every verdict other than `нет` MUST carry a concrete citation `path/to/file.ext:123`, allowed **only** for a file actually opened with `Read` in this run. A `Grep` hit is a candidate, not evidence: read the file first, then cite, and take the line number from what was read rather than from memory. «Где-то в модуле X» and a line number that does not exist are both invalid citations.

**HARD RULE — `нет` must be falsifiable too.** A `нет` verdict MUST be followed by a line `Искали: <the grep/glob queries and paths actually run>`. Without it, `нет` means «не смотрели», not «не нашли», and a downstream plan will happily re-implement something that already exists.

**HARD RULE — every `конфликт` becomes a question.** A conflict almost always means the requirement contradicts a decision somebody made on purpose, and somebody has to choose which side gives way. Each one enters the ambiguity ledger in Step 4 and is asked. It **cannot be parked silently**: it either ends as `- [x] answered:` in `## Открытые вопросы`, or stays `- [ ] open:` — and while it is open it **blocks `status: ready`** and is reported on its own line in the Step 8 summary.

The result lands in the `**Текущее состояние:**` line of each `REQ-NN` block (plus the `Искали:` line for every `нет`) and, at the sizes that carry that section, in one row per requirement in `## Расхождения с текущей реализацией`.

**Optional optimization.** If the harness supports parallel code-exploration subagents, launch 1–3 scaled to the number of draft requirements (existing behaviour / contradicting behaviour / entry points); otherwise explore sequentially with the same tools — same result, slower. Either way a subagent may return `path:line` only for files it actually read, and must report its search queries so the `Искали:` lines stay honest.

### Step 4: Clarification loop

Read `references/CLARIFICATION.md` before the first round — the operational blocking test, the delegation decision tree and the coverage dimensions live there and are not restated here.

**HARD RULE for the whole step: never invent a requirement.** No answer and no justified default → `TBD` in the requirement text plus a `- [ ] open:` item. A justified default → the requirement written in full plus a `- [assumed] …` item in `## Допущения`. Never a plausible-sounding sentence nobody agreed to, and never a default hidden inside a requirement's wording.

Before assigning `REQ-NN` ids, separate the requested outcome from speculative neighboring capabilities while drafting and clarifying requirements. Make those neighbors explicit Non-goals or clarification questions; never silently delete requested behavior or choose the implementation here.

**4.1 — Build the ambiguity ledger.** An internal working list (not a document section) of everything still unknown, seeded from four places: gaps in the Step 2 answers (skipped or vague), the Step 2.5 reconciliation — **every `устарело` / `противоречит` claim a draft requirement rests on**, the ambiguity signals from `references/CLARIFICATION.md` applied to every draft requirement, and the Step 3 gap analysis — **every `конфликт` enters the ledger, no exceptions**. Each entry records the unknown in one sentence, the draft requirement it belongs to, and a blocking / non-blocking flag set by the operational test — never by feel.

**4.2 — Ask one question.** A round is **one** question, in one AskUserQuestion call — the most blocking entry in the ledger (scope-changing unknowns first, then acceptance criteria, then the rest). One at a time is what makes the answer usable: it lands on the draft at once, and the next question is picked with it in hand instead of guessed at in a batch. Before sending, drop every candidate that Step 3 already answered from the code, that the topic statement already answered, that asks «как это реализовать» (that belongs to `/tl-tech-design`), or that re-words something already answered. Apply the answer immediately and remove the ledger entry.

**Every question is a full question, not a label.** «Матрица устройств и рантаймов (REQ-023)» names a topic — a reader who does not carry your context cannot answer it. Ask «На каких устройствах это должно работать — только десктопный браузер, или ещё мобильный и Node?»: one interrogative sentence, self-contained, naming the alternatives it chooses between. Same for the options — each is a decision the user can pick, not a category.

**4.3 — Handle «не знаю» / «решай сам» / «мне всё равно».** These are delegations, not answers — route each through the decision tree in `references/CLARIFICATION.md`, which has exactly three outcomes: a justified default (project convention, behaviour found in Step 3, industry norm) → take it, say it out loud, record `- [assumed] <что приняли> — основание: <почему>; влияет на: REQ-NN` in `## Допущения`, requirement written in full; no default and blocking → `TBD` in the requirement exactly where the answer would go plus `- [ ] open:`, status stays `clarifying`; no default and non-blocking → `- [ ] open:` only, requirement written without caveats.

**4.4 — Recompute the ledger.** Answers create new unknowns («continue on error» immediately raises «what goes into the error report?»). Add them and classify them with the same operational test before the next round.

**4.5 — Session cap.** The cap is **5 questions per session**, an exact integer, and it is a ceiling, not a target: a well-stated request often closes after **one**, and once the ledger holds no blocking entries the loop is over at question 1 of 5. Padding the budget with non-blocking questions is forbidden — they go straight to `- [ ] open:` by definition. On hitting the cap with blocking unknowns still open:

```
AskUserQuestion: Задал уже пять уточняющих вопросов, а часть всё ещё открыта. Что делаем?

Options:
1. Продолжим уточнять — задам ещё вопрос
2. Хватит, паркуем остаток — запишу открытые вопросы в спеку как есть
```

Independently of the cap: **if a question came back unanswered** (skipped or cancelled), stop the loop **immediately** and never re-ask the same thing in different words. The remaining unknowns go to `- [ ] open:`.

**4.6 — Stop condition and status.** Set `status: ready` only when **both** hold:

- (a) zero blocking unknowns remain in the ledger, **and**
- (b) zero unresolved `конфликт` verdicts from Step 3 — every one of them carries `- [x] answered:` in `## Открытые вопросы`.

If either fails, the status is `clarifying` and the remaining ledger entries become `## Открытые вопросы` items — **at most three of them as `- [ ] open:`**, ranked scope → safety → user scenario. The rest close here: the agent's own `предлагаю:` becomes `- [assumed] …` in `## Допущения`, or the entry becomes `- [-] parked:`. Nothing is dropped; `draft` is exempt. Detail: `references/TEMPLATE.md`.

**Fallback without AskUserQuestion.** If the harness has no quick-pick equivalent, print the question and its options as one numbered list in a single message and parse the free-form reply; no reply → the entry stays in the ledger. Same limits and same stop rules. The base path must work without any host-specific capability.

### Step 5: Determine slug & save path

`--slug` from Step 0.2 if given; otherwise auto-generate from the topic — lowercase, ASCII / latin only (transliterate Cyrillic or pick 2–3 key English words), hyphens as separators, ≤50 characters. The path is `docs/specs/<YYYY-MM-DD>-<slug>.md` with today's date — a **flat file**, never a folder per spec.

**Collision handling.** If the file already exists:

```
AskUserQuestion: Файл docs/specs/<YYYY-MM-DD>-<slug>.md уже есть. Что делаем?

Options:
1. Открыть существующую спеку в update-режиме (рекомендуется) — переключаемся на /tl-spec --update <path>
2. Использовать другой slug — спрошу заново
3. Перезаписать существующий файл — старая версия будет потеряна
4. Отмена
```

Default to option 1; option 3 requires a **second explicit confirmation** («Точно перезаписать? Прошлая версия спеки не восстановится.») before anything is written.

**Non-interactive-safe rule.** If asking is impossible, **never overwrite**: append `-2`, `-3`, … to the slug until the path is free, write there, and say which file was created and why — «Спека с таким slug уже была, создал `docs/specs/<YYYY-MM-DD>-<slug>-2.md`, чтобы ничего не затереть.»

### Step 6: Generate frontmatter

Per the schema in `references/TEMPLATE.md`. **All seven keys are always present**, even when empty:

| Key | Value in init mode |
|---|---|
| `slug` | resolved in Step 5, including any numeric suffix |
| `status` | the result of Step 4.6 — an unresolved `конфликт` forces `clarifying` even with zero open questions |
| `created` / `updated` | today (ISO); equal on the first write |
| `sources` | links and paths from Step 2 question 2; `[]` if the user said there were none |
| `tags` | domain / area tags from the topic and the modules touched in Step 3; `[]` if nothing obvious |
| `superseded_by` | `null` |

### Step 7: Save document

```bash
mkdir -p docs/specs
```

Then `Write` the document to the path from Step 5, using `references/TEMPLATE.md` as the skeleton: the sections in the order given there, at the size the template's core/conditional rule prescribes, filled from Steps 2–4 — including the Step 2.5 verdicts, which land in `## Проблема и контекст` and in the `## Источники` lines.

**Before writing, run the conformance checklist from `references/TEMPLATE.md` and fix every violation.** Six of them fail most often: a `**Текущее состояние:**` other than `нет` without a real `path/to/file.ext:123` citation; a `нет` without its `Искали:` line; a default taken on the user's behalf that is not a `- [assumed] …` item in `## Допущения`; a `- [ ] open:` item without its `предлагаю:` resolution; more than three live `- [ ] open:` items at `clarifying` or `ready`; `status: ready` while a `- [ ] open:` item exists or a `конфликт` is unresolved.

The skill writes **only** the file at that path. No side files, no scratch notes, no copies elsewhere.

### Step 7.5: Propose a resolution for everything still open

Runs when the saved spec still carries at least one `- [ ] open:` item, an unresolved `**Текущее состояние:** конфликт`, or an unresolved `устарело` / `противоречит` claim from Step 2.5. With none of them, print one line — «Открытых вопросов и расхождений нет» — and go to Step 8.

**The proposal is mandatory; asking is not.** Open questions already carry a `предлагаю:` line from Step 4 — this pass checks that each one is a resolution somebody could act on rather than a rephrasing of the question, and gives the `конфликт` verdicts and the stale claims the same treatment, since neither of them was ever phrased as a question. For every remaining item, write out 2–3 concrete resolutions and mark the one you recommend:

| What is left | Resolutions to offer |
|---|---|
| Open question | the default you would take and on what grounds; the plausible alternative; «оставить открытым — решает <кто>» |
| `конфликт` | change the code to match the requirement; keep the code's behaviour and rewrite the requirement to it; move the case to `## Non-goals` |
| `устарело` / `противоречит` | trust the code — fix `## Проблема и контекст` and the requirement; trust the input — record it as a requirement to change the code; go ask the source's author |

Then put them to the user in **one** AskUserQuestion session, ≤4 items, most scope-changing first:

```
AskUserQuestion: Осталось <N> нерешённых пунктов, по каждому есть предложение. Что берём?

Options (по каждому пункту):
1. <рекомендуемое решение> — <на чём основано> (рекомендую)
2. <альтернатива>
3. Оставить открытым — решает <кто>
```

**Never re-ask what the user already declined.** An item they explicitly parked in Step 4, or one from a round they left unanswered, is not put to them again: its proposal is written into the document and reported in Step 8, and that is its whole treatment. The same holds when there is nobody to ask (chain run, non-interactive host) — the proposals are still written, the question is simply not asked.

**Apply the answers with `Edit`, one section at a time.** A chosen resolution turns the item into `- [x] answered: <вопрос> — <решение> (решение пользователя)` and rewrites the requirement, its acceptance criteria and its `**Текущее состояние:**` wherever the answer changes them. An item left open keeps its marker and carries the proposal: `- [ ] open: <вопрос> — предлагаю: <решение>; нужно решение: <кто>`. A proposal nobody accepted is **not** an assumption — nothing is baked into the requirement, so it never appears in `## Допущения`.

**In update mode the read-only contract wins.** A resolution that would rewrite the wording of an already-agreed `REQ-NN` is offered, but here only what the contract allows is applied — the `TBD` it fills, the acceptance criteria the answer refines, the `**Текущее состояние:**` it changes. Restating an agreed requirement from scratch is a new spec, not an edit; say so instead of doing it.

Finish by recomputing `status` against the Step 4.6 gate and re-running the conformance lines the edits touched: a resolution that closes the last `конфликт` flips the document to `ready`, and one that rewrites a requirement can invalidate its citation.

### Step 8: Next steps

Print a short summary: the path to the created file; the number of requirements; the «Текущее состояние» breakdown (`нет` / `частично` / `есть` / `конфликт`); the claims Step 2.5 found `устарело` / `противоречит` and how each was settled; the number of open questions **and, for every one still open, the `предлагаю:` resolution that stands plus who has to decide it**; **on its own line, the number of unresolved `конфликт` verdicts** when it is not zero, because that is the reason `status: ready` was withheld; the number of assumptions in `## Допущения`.

Then offer the next step:

```
AskUserQuestion: Спека готова. Что дальше?

Options:
1. Перейти к /tl-tech-design --spec <path> — выбрать решение под эти требования
2. Перейти к /tl-plan --spec <path> — разбить требования на задачи
3. Дособрать требования позже (/tl-spec --update <path>)
4. Остановиться здесь
```

**The skill only prints the command.** It never invokes `/tl-tech-design`, `/tl-plan` or `/tl-implement` by itself — whichever option the user picks, the next invocation is the user's own action.

**Running as a chain step.** When the run context carries an `autonomy` value (the shared axis defined in `references/execution-modes.md`), this skill is a step of `/tl-workflow` and the orchestrator already knows what comes next:

- **Skip the «Что дальше?» question entirely** — asking it stalls the chain, and in `full` autonomy nobody is there to answer.
- **Step 7.5 still runs, but asks nothing** — every remaining question, `конфликт` and stale claim gets its `предлагаю:` resolution written into the document, and the AskUserQuestion session is skipped. In a chain the leftovers travel in the artifact, not in a prompt.
- Print the summary above, then return the spec path, the resulting `status` (`ready` / `clarifying`) and the count of open questions. `status: clarifying` is reported honestly — the chain decides by its own autonomy whether to plan from incomplete requirements, and hiding it would make that decision for the user.
- Everything else is unchanged, and the orchestrator still runs the next step — this skill never does.

---

## Update mode

Triggered by `--update <path>` in Step 0.2. Understanding of requirements evolves: open questions get answered, new requirements appear. Update mode amends the existing document **in place** — it never rewrites it from scratch, because that would break `REQ-NN` stability and lose the answer history.

**U.1 — Read and validate.** `Read` the file at `<path>`. If it is missing, stop with: «Не нашёл спеку по `<path>`. Проверь путь или запусти `/tl-spec` без `--update`, если спеки ещё нет.» The mode refuses to operate on arbitrary markdown: the frontmatter must carry at least `slug` and `status`, and the body must have a `## Требования` section with at least one `### REQ-NN` block. If either check fails, stop with: «Файл не похож на спеку: нет frontmatter с `slug`/`status` или секции `## Требования` с блоками `### REQ-NN`. Проверь путь или собери спеку заново через `/tl-spec`.»

**U.2 — Validate state.** `draft` / `clarifying` → continue. `ready` → ask via AskUserQuestion: «Спека уже в статусе `ready`. Это доработка готовой спеки — добавляем требования или пересматриваем ответы?» (options «Да, дорабатываем» / «Отмена»). `superseded` → refuse: «Спека помечена как `superseded` и больше не редактируется. Работай с документом из `superseded_by`.»

**U.3 — Re-run the clarification loop.** Step 4 over the existing `- [ ] open:` items plus any new input from the arguments — the ledger is seeded from the open items, and the blocking test, the one-question-at-a-time rule, the 5-question session cap, the three-`open` ceiling and the anti-interrogation stop are the same. Answers convert items in place: `- [ ] open: …` → `- [x] answered: … — <ответ + кто/где>`; deliberately deferred items become `- [-] parked: … — <почему отложили>`. Whatever is still open when the loop ends goes through **Step 7.5**: every remaining question and every unresolved `конфликт` leaves the run with a concrete proposed resolution, offered to the user once and — either way — written into the document by U.5.

**U.4 — Add / amend requirements.** New requirements are **appended** to the end of `## Требования` with the next free ids; a retired id stays retired. A changed state, transition or step is re-drawn in the diagram in the same edit — a stale picture reads as agreed behaviour. New input that makes claims about the current system goes through **Step 2.5** first, and every new requirement goes through the Step 3 gap analysis before it is written: a `**Текущее состояние:**` verdict with a real citation (or an `Искали:` line for `нет`).

**U.5 — Apply changes.** **Use `Edit` for every change — surgical, one section at a time. Rewriting the whole file with `Write` is forbidden in update mode.** Before touching the file, print a short diff-summary — what changes in the frontmatter, which questions close or park, which `REQ-NN` blocks are added or amended — and confirm:

```
AskUserQuestion: Применить эти изменения к спеке?

Options:
1. Применить — записать изменения в файл
2. Отменить — ничего не менять
3. Изменить — скажи, что поправить
```

**U.6 — Recompute status.** Zero blocking `- [ ] open:` items and zero unresolved `конфликт` → `status: ready`; otherwise `clarifying`. Set `updated` to today; `created` never changes.

### Read-only contract

| | |
|---|---|
| **MUST NOT change** | the `# <Title>` H1; `## Проблема и контекст`; frontmatter `created` and `slug`; the wording and ids of existing requirements — inside an existing `REQ-NN` block only `**Текущее состояние:**` and acceptance criteria that a clarification answer refined may move. |
| **MAY change** | frontmatter `status` / `updated` / `sources` / `tags` / `superseded_by`; `## Scope` and `## Non-goals` by **adding** bullets; `## Термины`; new `### REQ-NN` blocks appended to `## Требования`; `## Расхождения с текущей реализацией`; `## Допущения`; `## Открытые вопросы`; `## Источники`; the diagram section; any conditional section the spec lacks, once it gains content. |

Everything outside the MAY row stays byte-identical.

**Assumptions that turn into real answers.** When the user finally answers a question that was previously closed by a default, the `- [assumed]` item is **removed** from `## Допущения` and the requirement is rewritten to match the real answer. Leaving a stale assumption in place while the requirement says something else is forbidden — the list must always describe decisions that are still the agent's, not the user's.

Editing any file other than the one passed via `--update <path>` is allowed in exactly one case: setting `status: superseded` and `superseded_by: <new path>` on a spec this one replaces, and only with the user's explicit agreement. If the user wants to rewrite the problem statement or restate existing requirements from scratch — that is a new spec (a new slug, the old one marked `superseded`), not an update.

---

## Important Rules

1. **`REQ-NN` ids are load-bearing.** They are the contract with `/tl-tech-design --spec` and `/tl-plan --spec`: assigned once, never renumbered, never reused — a retired id stays retired.
2. **Ownership boundary.** This skill owns `docs/specs/*.md` and nothing else. It does not propose solution variants or architecture (that is `/tl-tech-design`), and it does not break work into tasks (that is `/tl-plan`). When the conversation drifts there, name the right skill and stop.
3. **Nothing leaves the run unresolved and unexplained.** Every open question, every `конфликт` and every stale input claim ends the run either answered or carrying a `предлагаю:` resolution with a named decider (Step 7.5). «Осталось непонятным» without a proposed way out is not an acceptable outcome — the agent drafted the spec, so it has an opinion and states it.
4. **Read-only / plan-mode harnesses.** This skill writes files (`mkdir`, `Write`, `Edit`) starting at Step 7. If the host denies a mutating call because the user is in a read-only or planning mode, do NOT bypass it — no `--force`, no alternative tools. Stop and ask: «Чтобы продолжить, переключи агента в режим, разрешающий запись (выйди из read-only / plan mode), и запусти `/tl-spec` ещё раз — скиллу нужно записать файл спеки.»
5. **Russian section labels are user-facing literals.** Keep `## Проблема и контекст`, `## Термины`, `## Требования`, `## Расхождения с текущей реализацией`, `## Допущения`, `## Открытые вопросы`, `## Источники`, the `Приоритет:` / `**Текущее состояние:**` / `Искали:` / `предлагаю:` / `нужно решение:` lines and the `[assumed]` / `open` / `answered` / `parked` markers exactly as they are. Do not translate them.
