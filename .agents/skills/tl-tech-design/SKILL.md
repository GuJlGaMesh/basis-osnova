---
name: tl-tech-design
description: >-
  Produces a design-review document: ADR-style proposal, target-state diagram, ≥2 compared solution variants. Not for: investigating how existing code works → tl-research. Use when: технический дизайн, дизайн-ревью, проработай решение.
argument-hint: "[--update <path>] [--slug <slug>] [--spec <path>] <topic>"
allowed-tools: Read Write Edit Glob Grep Bash(git *) Bash(mkdir *) Bash(basename *) AskUserQuestion
disable-model-invocation: false
---

# Tech Design — Design Review Document

`init` mode builds the pre-meeting draft: problem, goals, an ADR-style `## Решение` block near the top (Step 4.1), at least 2 solution variants with a comparison table, and a single open-questions tracker — after first trying to resolve those questions with the user. `update` mode (Step U.*) records what the meeting actually chose.

Two principles the format follows: **as short as possible, as long as necessary** (size scales via S/M/L profiles), and **the document is a proposal, not a questionnaire** — a human reviewer gets the concept from `## Решение` alone, in under a minute, without reassembling it from the variants. The review checklist is a drafting tool, never a document section.

`references/TEMPLATE.md` owns the document shape, the profiles table and the conformance checklist. `references/CHECKLIST.md` owns the drafting checklist and its routing rules.

The document is always a folder: `docs/tech-designs/<YYYY-MM-DD>-<slug>/tech-design.md`. The implementation plan is a separate `/tl-plan --tech-design <path>` run saved to `docs/plans/`.

---

## Workflow

### Step 0: Setup

1. **Project context.** Load what `references/project-context.md` lists before scoping. `docs/architecture/layers.md` is mandatory here whenever the topic touches boundary rules — variants must respect the real module map, and a criterion like «соответствует layers.md» needs ground truth.
2. **Project overrides.** `docs/skill-context/tl-tech-design/SKILL.md` if it exists — its rules win on conflict; how to apply them: `references/skill-context.md`. «All outputs» there covers template sections, frontmatter values, the checklist walkthrough and the variants.
3. **Git.** `git rev-parse --is-inside-work-tree 2>/dev/null || git init` — without a repository the document is detached from history; warn and ask before running `git init`.
4. **Arguments** from `$ARGUMENTS`: `--update <path>` → update mode (Step U.1), everything else ignored except explicit user notes; `--slug <slug>` → explicit slug (kebab-case, ≤50 chars, ASCII — ask via AskUserQuestion if invalid); `--spec <path>` → seed from a spec, validate below; remaining text → the topic (empty topic without `--update` → ask for it first).
5. **Spec validation, only with `--spec`.** Read the spec's YAML frontmatter. Missing file or frontmatter → «Не вижу спеки по `<path>`. Проверь путь или сначала собери требования через `/tl-spec`.» No `slug`/`status` → «Файл не похож на спеку (нет `slug`/`status` во frontmatter).» Then branch on `status`: `ready` → continue; `draft`/`clarifying` → AskUserQuestion «В спеке остались нерешённые вопросы (`status: <…>`). Продолжаем проектирование по неполным требованиям или сначала дособираем через `/tl-spec --update <path>`?» — «Продолжить» / «Сначала дособрать требования» / «Отмена»; `superseded` → refuse: «Спека помечена как `superseded`. Используй документ из `superseded_by` или собери требования заново через `/tl-spec`.» On success hold the spec for Step 2 and the frontmatter `spec` key.

### Step 1: Scope & profile

**Scope.** A DR pays for itself when a wrong decision costs more than writing the document. Signals it is warranted: the feature crosses 2+ domains or services; a new public API or external contract; a saga / distributed transaction with retries or compensation; a schema change with backfill or breaking semantics; an auth / permission change; an explicit SLO or SLA; a substantial infra or tech-debt initiative; a story that asks for «техническую проработку». If none hold and the team would not genuinely weigh 2+ approaches with different tradeoffs, flag it once via AskUserQuestion: «Похоже, дизайн-ревью здесь избыточен — это `/tl-plan` материал. Что делать?» — «Всё равно сделать DR» / «Перейти к /tl-plan напрямую» / «Отмена». Never silently downgrade to `/tl-plan`; when unsure, lean toward a short DR — cheaper than redoing the work after a wrong decision.

**Profile.** Recommend one, confirm in a single AskUserQuestion with the recommendation first: «Какой размер документа берём?» — «M — стандартный (рекомендуется)» / «S — мини-DR на страницу» / «L — развёрнутый».

- **S** — one module, a reversible decision, 1–2 people aligning; the meeting could be a 15-minute call.
- **M** — the default: one team, real tradeoffs, a review meeting. This is the profile when in doubt.
- **L** — 2+ teams, external consumers, SLO commitments, data migration with backfill, or a rollback that needs its own plan.

The profile drives which sections, diagrams and tables are required and how many open questions survive — the Profiles table in `references/TEMPLATE.md`. Whatever the profile, `## Решение` always carries the proposal.

### Step 2: Gather inputs

**One AskUserQuestion session, ≤4 questions:**

1. Проблема — какую боль закрываем (бизнес + что в текущей системе мешает, одним ответом).
2. Ссылки и ограничения — story/требования/research (Jira, Confluence, `docs/research/...`) + известные ограничения (runtime, совместимость, стек); если ничего нет — «нет внешних источников».
3. Goals и Non-Goals — что фича обязана сделать (≥1) и что явно НЕ делает (≥1).
4. Вопросы к команде — что нужно решить до/на встрече; известные метрики успеха, если есть.

**This session is subtractive — drop what the request already answered.** Before sending, test each of the four against the topic statement (and against the spec when `--spec` is set) and delete every question the user has effectively answered already. **If the topic answers all four, skip Step 2 entirely** and go to Step 3 — re-asking what the user just typed reads as not listening.

If the user opts out of a question — carry the gap forward as an open question (Step 6) or an assumption, never as a `TBD` in the document. Do NOT block on missing input: it's a draft for the meeting. **Hard requirement:** at least 1 goal AND 1 non-goal before saving — re-ask specifically for the missing piece.

**With `--spec <path>`,** seed first and ask only about what is still missing: `## Проблема и контекст` → `## Проблема`; `## Scope` / `## Non-goals` → `## Goals & Non-Goals`; `## Источники` + the spec path → the source-marker lines. The spec path goes into the `Requirements:` marker. Seeding is a starting point, not copy-paste: reword into the DR's problem statement and reference individual requirements by their stable `REQ-NN` ids.

### Step 3: Explore codebase

Find the modules, files and integration points the variants will touch — ground them in the real architecture, don't draft yet. Default path: `Glob` / `Grep` / `Read` over modules likely affected, patterns already used for similar problems (variants should reuse them), and boundary rules in `docs/architecture/layers.md` (flag conflicts explicitly). If the agent supports parallel codebase-exploration subagents, launch 1–3 scaled to complexity; otherwise the same work sequentially. Don't dig further than the variants need (S: minutes, L: longer).

**Check the technology, not only the code.** When a variant leans on a library, framework or managed service, verify its current capabilities, limits and version constraints before they land in the comparison table — if a documentation-lookup tool is available, use it; otherwise state in the variant what you are assuming. A variant compared on a stale API is a wrong decision with a table around it.

Check whether the current system, a native/platform facility or an installed dependency can satisfy the goals before designing a new component or service. This is a selection constraint, not permission to skip a real trade-off or reduce the required two variants to one.

### Step 4: Draft variants

**Always at least 2 variants.** Non-negotiable — without alternatives the document is an announcement, not a design review. If the team is convinced there's only one path, the second variant records the rejected approach with reasons.

When reuse or a native/platform capability is materially viable, make it a real variant rather than comparing only custom implementations. For every variant, make new dependencies, services, configuration and ownership surfaces visible in the comparison; fewer is better only after goals, safety and operational constraints are satisfied.

Shape per variant, comparison-table criteria and when the table may be skipped — `references/TEMPLATE.md` (skill-context may add project-specific criteria). Two things the template cannot enforce for you: the `{#variant-N}` anchor format is fixed because downstream tooling parses it, and the table keeps only criteria on which the variants actually differ — a row whose cells are all equal is noise.

### Step 4.1: Build the proposal block (`## Решение`)

This is the section humans actually read. Pre-meeting it is a compact ADR, never a `TBD` placeholder. Pick the variant you'd recommend and fill the block from `references/TEMPLATE.md`, where the substance matters more than the syntax:

- The **2–4 sentences of concept** must read standalone — someone who never scrolls to `## Варианты` still understands what appears, where it lives and how the current flow changes. Not a restatement of the pros list.
- The **target-state mermaid diagram** («как будет») is the document's load-bearing picture; obligation per profile in the Profiles table.
- **«Что принимаем как плату»** names 1–3 downsides of your own recommendation. Naming them yourself turns the reviewers' job from auditing into agreeing or objecting.
- **«Что нужно от ревью»** names 1–3 concrete points to confirm or challenge. Never «посмотрите документ».

The recommendation is still a proposal, not the decision — update mode records what the meeting chose, which may be another variant.

Sanity check before moving on: if `## Решение` were the only section a reviewer read, could they argue with it? If not, it is too thin — `references/EXAMPLES.md` shows the density this asks for.

### Step 5: Checklist walkthrough

Read `references/CHECKLIST.md` and walk the full list against the drafted variants, routing every item into exactly one of its three buckets — addressed / open (→ Step 6) / not applicable — by the rules in «How the agent applies this» there.

`## Сквозные аспекты` is the detail appendix, not the review agenda: it sits below `## Открытые вопросы` and opens with the marker line `*Информационно: уже учтено в решении, отдельного ответа не требует.*`. Anything a reviewer must actually decide belongs in `## Решение` → «Что нужно от ревью» or in `## Открытые вопросы`.

### Step 6: Resolve open questions

Collect every open question accumulated so far (Step 2 answers, Step 4 drafting, Step 5 walkthrough) and **try to close them with the user right now**. Batch them into 1–2 AskUserQuestion sessions (≤4 each), most important first, each with concrete answer options derived from the design (e.g. «409 Conflict с Retry-After» / «ждать и вернуть результат первого запроса») plus the implicit «Other» — the user can always answer «не знаю / на встречу». Answers are folded into the design text, or kept as `[x] answered: … — <ответ> (решение пользователя, до встречи)` when the Q&A itself is worth preserving for the meeting.

Two filters before writing the section:

1. **Decision-grade only.** Keep a question only if a different answer changes the design (contract, data model, rollout, chosen variant). Everything else becomes `**Допущение:** <на чём стоим> — <что делаем, если не сработает>` in `## Сквозные аспекты`.
2. **A proposed default is mandatory.** You drafted the design — you have an opinion; state it. A question without a default hands the reviewer a design task instead of a decision. If you cannot propose anything, the item is under-explored: go back to Step 3 or ask the user right here.

Then apply the per-profile cap from the Profiles table — over it, keep the most decision-critical questions and fold the rest into assumptions.

### Step 7: Save document

Slug: `--slug` if given, else auto-generate from the topic (lowercase latin, hyphens, ≤50 chars — transliterate or pick 2–3 key English words). Directory: `docs/tech-designs/<YYYY-MM-DD>-<slug>/`, date = today.

**Collision.** If the directory exists, ask: «Папка docs/tech-designs/<YYYY-MM-DD>-<slug>/ уже существует. Что делаем?» — «Открыть существующий документ в update-режиме (рекомендуется)» / «Использовать другой slug» / «Перезаписать существующий tech-design.md» / «Отмена». Overwrite requires a second confirmation.

Then `mkdir -p` the directory and `Write` the document per `references/TEMPLATE.md` with the profile from Step 1 — that file owns the section order, the per-profile presence rules and the S/M rollout fallback. Init fills `slug`, `status: draft`, `created`, and `spec` when `--spec` was given; the remaining frontmatter keys stay `null`. Before the `Write`, verify the draft against «Conformance checklist» in the template and fix violations there and then.

The user may set `supersedes: <old-path>` manually if this DR replaces an earlier decision — Step 8 then reminds about flipping the old DR via update mode. The DR lives only at this path — no side-effect writes elsewhere.

### Step 7.5: Close out what is still open

Runs only when `## Открытые вопросы` in the saved document still carries `[ ] open` items; with none, go to Step 8 without saying anything. Step 6 asked the questions — this pass makes sure not one of them leaves the run without a way to be settled.

Walk the remaining items once and fix what is not decision-shaped:

1. **Each item states a decision, not a topic.** «Что делать с ретраями?» is a topic; «ретраим 3 раза с backoff или отдаём ошибку сразу» is a decision. A reviewer must be able to close it in the meeting with one sentence.
2. **The `предлагаю:` default is the fallback, and says so.** If the meeting never gets to this question, that default is what ships. A default nobody could live with is not a default — replace it with one you would defend.
3. **`нужно решение:` names a person or a role and a moment** («команда Bookings до старта разработки»), never «обсудить».

Then take the items that do **not** actually need the meeting — one the user can answer right now, or one that appeared after Step 6 and was never put to them — and offer resolutions, not questions, in **one** AskUserQuestion session, ≤4 items:

```
AskUserQuestion: Перед встречей осталось <N> вопросов, часть можно закрыть сейчас. Что берём?

Options (по каждому вопросу):
1. <предложенный дефолт> (рекомендую)
2. <альтернатива из проработанных вариантов>
3. Оставить на встречу — решает <кто>
```

**Never re-ask what Step 6 already put to the user.** An item they deliberately sent to the meeting stays open — asking it twice in one run reads as not listening.

Both the rewrites above and the answers are applied to the saved file with `Edit`, surgically: an answered item becomes `- [x] answered: <вопрос> — <ответ> (решение пользователя, до встречи)`, and whatever the answer really changes changes with it — `## Решение`, `## Сквозные аспекты`, a variant's `API / данные`. Re-check the touched parts against the conformance checklist afterwards: an answer that moves the concept usually moves the target diagram too.

### Step 8: Next steps

Print a short summary: the document path, the proposed variant with its one-line rationale (a proposal, not a decision), what the review is asked to confirm, and the questions still open after Step 7.5 — each with the default that ships if the meeting does not decide it and the name of whoever decides.

Then AskUserQuestion: «Документ дизайн-ревью готов. Что дальше?» — «Скинуть документ команде на ревью (рекомендуется)» / «Запланировать встречу» / «После встречи — обновить документ (/tl-tech-design --update <path>)» / «Перейти к /tl-plan напрямую (если уверен в варианте)». If the user picks update, print the exact command with the real path. After update the natural follow-up is `/tl-plan --tech-design <path>` (add `--spec <path>` when the DR grew out of a spec — the flags are compatible: spec = WHAT, DR = HOW).

---

## Running as a chain step

When the run context carries an `autonomy` value (the shared axis defined in `references/execution-modes.md`), this skill is a step of `/tl-workflow` and the orchestrator already knows what comes next. In that case:

- **Skip the «Что дальше?» question of Step 8 / U.4 entirely** — asking it stalls the chain, and in `full` autonomy nobody is there to answer.
- **Step 7.5 still runs, but asks nothing** — every open question is brought to decision shape with a fallback default and a named decider; only its AskUserQuestion session is skipped. In a chain the leftovers travel in the document, not in a prompt.
- Print the summary, then return the result: the document path, the resulting `status` (`draft` after init, `decided` after update) and the variant — proposed or chosen — as `variant-N`. A `draft` status is reported honestly; the chain decides by its own autonomy whether to plan from a design nobody has agreed to yet, and hiding it would make that decision for the user.
- Everything else is unchanged: the same profile, the same ≥2 variants, the same checklist walkthrough, the same resolve step. Rule 8 still holds — the orchestrator runs the next step, this skill never does.

---

## Update mode

Triggered by `--update <path>`. It fills the post-meeting fields and flips the document to `status: decided`.

**Read-only contract.** MUST NOT change: `# <Title>`, `## Проблема`, `## Goals & Non-Goals`, the comparison table in `## Варианты`, the bodies of `### Вариант N {#variant-N}` (description, diagram, pros/cons, API/данные) — only their trailing `Status:` / `Reason:` lines change. MAY change, in the `--update` file only: frontmatter; variant `Status:`/`Reason:` lines; `## Решение` in full, including its target diagram; `## Сквозные аспекты`; `## Открытые вопросы`; `## Rollout & метрики`. Another file — only via Step U.5. If the user wants to revise the problem statement, add a variant or rewrite Goals, that is a new design review (init with a new slug; Step U.5 marks the old one if replaced) — never retroactively rewrite read-only sections.

### Step U.1: Read and validate

`Read` the file. Missing → fail: «Не нашёл документа по `<path>`. Проверь путь или запусти init без `--update`, если документа ещё нет.»

Parse the frontmatter, every `### Вариант N: … {#variant-N}` heading with its anchor, and the `## Открытые вопросы` list. **Shape validation is mandatory** — refuse arbitrary markdown: frontmatter must carry `slug` and `status`, and the body must have ≥1 variant heading with the exact `{#variant-N}` anchor. Otherwise stop: «Файл не выглядит как tech-design (нет frontmatter `slug`/`status` или вариантов с anchor-ID `{#variant-N}`). Запусти init-режим без `--update` или проверь путь.»

Then branch on `status`: `draft` / `in-review` → normal flow; `decided` → ask «Документ уже в статусе `decided`. Это re-update (правка решения после повторной встречи)?» — «Да, re-update» / «Нет, отмена» (if the old decision must stay as an audit trail, recommend a new DR + Step U.5 instead); `superseded` / `abandoned` → refuse: «Документ помечен как `<status>` и больше не редактируется. Если решение пересматривается — заведи новый DR через init-режим, при необходимости поставь `supersedes: <этот path>` во frontmatter нового документа.» If fewer than 2 variants were found, warn: «В документе только один вариант. По канону DR должно быть ≥2 — проверь, не вырезали ли альтернативы вручную. Продолжаем?» — «Продолжить» / «Отмена».

### Step U.2: Gather the decision

**Chosen variant.** Single-select AskUserQuestion: «Какой вариант выбран на встрече?» — the variant list plus «Гибрид / правка одного из вариантов». For a hybrid ask «Какой вариант берём за основу и что меняется?»; `chosen_variant` still points at the base variant and the divergence goes into `## Решение` → Почему.

**Session A** — one AskUserQuestion, ≤4 questions:

1. Почему выбрали — 1–3 предложения (ключевой tradeoff).
2. Кто участвовал — имена/роли через запятую (или «решение автора единолично»).
3. Rollout и метрики успеха — фазы, feature-flag, rollback trigger, owner; 1–4 метрики с target и периодом. Если катим без поэтапной выкатки — явно зафиксировать это и причину. (Skip when the meeting didn't discuss rollout and the profile is S/M.)
4. Новые вопросы, всплывшие на встрече — список или «нет новых».

**Session B** — only when `## Открытые вопросы` has `[ ] open` items: multiSelect «Какие вопросы закрыли на встрече?»; for each selected — «ответ + кто ответил/где зафиксировано». Unselected items stay `[ ] open` unless the user explicitly parks them.

**Hints.** From the chosen variant (description, diagram, API/data changes) generate 3–8 bullets for `## Решение` — each a short sentence about a meaningful chunk of work plus a link to `#variant-N` or a concrete module/path. Component-level granularity, not a step-by-step recipe; `/tl-plan --tech-design <path>` uses them by judgement.

### Step U.3: Apply the changes with `Edit`

**Use `Edit` for surgical changes — never `Write`.** Rewriting the file would break the read-only contract; those sections must stay byte-identical.

- **Frontmatter:** `status` → `decided`; `decided_on` → today; `chosen_variant` → `variant-N`.
- **Variant Status lines:** chosen → `Status: chosen`; each discarded → `Status: discarded` + an appended `Reason: <короткая причина>`.
- **`## Решение`:** replace the proposal header (`**Предлагается:** …` + «Что нужно от ревью» + `Статус: …`) with Выбрано / Почему / Участники + the hints. Keep the concept paragraph, the target diagram and «Что принимаем как плату» — they describe the design, not the pre-meeting state. If the meeting chose another variant or a hybrid, redraw the diagram and rewrite the concept for what was actually chosen: a stale diagram is worse than none.
- **`## Открытые вопросы`:** answered → `[x] answered: … — <ответ + кто/где>`; parked → `[-] parked: … — <причина + до какого момента>`; new ones appended as `[ ] open: <вопрос> — предлагаю: <дефолт>; нужно решение: <кто>` — the default rule holds post-meeting too, and anything still open after the meeting goes through the Step 7.5 walkthrough (decision-shaped wording, fallback default, named decider) before the edits are applied.
- **`## Сквозные аспекты`:** when an answer or a meeting decision settles a cross-cutting concern (rollback, monitoring, security, compatibility), add or refresh that line.
- **Rollout:** in L replace the `TBD` in `## Rollout & метрики`; in S/M add «**Выкатка:**» / «**Метрики успеха:**» lines to `## Сквозные аспекты` when the meeting produced them — no separate section.

Before applying any `Edit`, render a concise diff-summary — frontmatter keys before → after, variant status flips, sections filled, questions closed/parked/added — and ask: «Применить эти изменения к документу?» — «Применить» / «Отменить» / «Изменить — спросить, что поправить». On «Изменить», return to the relevant U.2 question instead of re-running the whole flow.

### Step U.4: Next steps

Report that the document is now `status: decided` and that the next step is the implementation plan: `/tl-plan --tech-design @docs/tech-designs/<YYYY-MM-DD>-<slug>/tech-design.md`. The plan lands in `docs/plans/` with `Tech design:` and `Chosen variant:` lines in its header.

### Step U.5 (optional): Mark the old DR as superseded

Only when the user says this DR replaces a prior decision (`supersedes` was set manually, or they mention it in Step U.2). Ask: «Зафиксировать замену старого DR?» — «Да — обновить старый DR (status: superseded, superseded_by: <этот path>) (рекомендуется)» / «Нет — оставить старый DR как есть». If yes: `Read` the old path (abort with a clear message if missing or invalid), `Edit` it to `status: superseded` + `superseded_by: <current path>`, and set `supersedes` in the current document if it isn't set yet. **This is the only step in update mode allowed to modify a file other than the one passed via `--update`.**

---

## Important Rules

1. **Minimum 2 variants, always.** A sure thing still records the rejected alternative with reasons — that is what makes the document a design review instead of an announcement.
2. **`## Решение` is never a placeholder.** A document whose concept can only be reconstructed from `## Варианты` is not reviewable by humans — that is the failure this rule exists to prevent.
3. **Reviewer-facing first, detail after.** Section order is fixed: `## Решение` → `## Варианты` → `## Открытые вопросы` → `## Сквозные аспекты`.
4. **Frontmatter is exactly the 8 keys of `references/TEMPLATE.md`,** and the status lifecycle is linear: `draft` after init; `decided` only once update mode has set `chosen_variant` + `decided_on`; `superseded` requires `superseded_by` (Step U.5); `abandoned` needs a clear note in the file. Participants, discard reasons and story links live in the body, never as new keys; unfilled values are `null`.
5. **Anchor-IDs `{#variant-N}` are load-bearing and permanent.** `## Решение` and `chosen_variant` reference variants by ID. Never rename one; a discarded variant keeps its anchor, and a retired number is never reused by a later variant.
6. **Read-only / plan-mode harnesses.** This skill writes files starting at Step 7. If the host denies a mutating call, do NOT bypass it — stop and ask: «Чтобы продолжить, переключи агента в режим, разрешающий запись (выйди из read-only / plan mode), и запусти `/tl-tech-design` ещё раз — скиллу нужно записать документ дизайн-ревью.»
7. **No open question leaves the run without a way out.** Step 7.5 is the guarantee: every `[ ] open` item ends decision-shaped, with the default that ships if the meeting never reaches it and the person who decides otherwise. A question the document cannot answer and nobody owns is how a DR stalls for a sprint.
8. **Never start executing on your own.** This skill produces a design-review document, not code. It MUST NOT call `/tl-plan`, `/tl-implement` or otherwise begin execution — Step 8 / U.4 only name the next command; the user (or, in a chain, the orchestrator) runs it.
