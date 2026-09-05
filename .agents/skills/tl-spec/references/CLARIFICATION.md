# tl-spec — Clarification: blocking test, delegation routing, coverage

What `SKILL.md` Step 4 needs and does not restate: how to decide whether an unknown is worth a question, what to do when the user hands the decision back, and what a round must have looked at before it stops.

Agent-facing rules are English; everything quoted to the user stays Russian, обращение на «ты».

---

## Coverage dimensions

Derive the questions from the drafted requirements and from the code read in Step 3 — a question is worth asking only if no file in the repository answers it. Before closing the loop, check that each drafted requirement has been looked at from these eight angles: **actors** / **triggers** / **data** / **boundaries (non-goals)** / **errors** / **NFR** / **integrations** / **acceptance**. A dimension with nothing to ask is skipped silently; a dimension nobody looked at is a hole.

**A requirement without failure behaviour is half a requirement** — «errors» is the dimension people drop, and `## Non-goals` is the one that lets the spec grow silently between the rounds and the plan.

**Ledger seeds.** A drafted requirement is a question candidate when it shows any of: a quantifier without a number («быстро», «много»); a passive without an actor («данные загружаются»); an «и/или» bundling two independent behaviours into one `REQ-NN`; an implied default nobody stated; no failure behaviour; no falsifiable criterion («работает корректно»); an undefined domain term; a clash with what the code was observed doing; or a premise the inputs asserted that Step 2.5 found `устарело` / `противоречит` in the code.

---

## Blocking test

An unknown is **blocking** when the answer changes the substance of the spec, not its phrasing. Guessing a blocking unknown produces a spec that plans and implementations follow into the wrong place, so it holds the document in `status: clarifying`.

Do not judge blocking-ness by feel. Run this test:

1. Write out the requirement **twice** — once assuming answer A, once assuming answer B (the two most plausible answers).
2. Compare the two versions on exactly three axes:
   - **Scope** — does a requirement appear or disappear, or does a bullet move between `## Scope` and `## Non-goals`?
   - **Acceptance criteria** — is the Given/When/Then set different?
   - **«Текущее состояние»** — would the gap-analysis verdict for this requirement differ?
3. If any axis differs → **blocking**. Ask it.
4. If only the wording differs → **non-blocking**. It goes straight to `- [ ] open:` in `## Открытые вопросы` and never delays the document.

**Blocking — worked example.** «Первая ошибочная строка останавливает импорт или обрабатываем остальные?» Version A (stop): the requirement demands a full rollback; acceptance criteria describe an empty result and one error message. Version B (continue): the requirement demands a partial import plus an error report; acceptance criteria describe imported rows, skipped rows, and the report contents. Different acceptance criteria and a different requirement count → **blocking**.

**Non-blocking — worked example.** «Кнопка называется “Загрузить” или “Импортировать”?» Both versions have the same scope, the same acceptance criteria and the same «Текущее состояние»; only one label string differs → **non-blocking**, recorded as `- [ ] open:` while the loop keeps going.

---

## Delegation routing — «не знаю» / «решай сам» / «мне всё равно»

These mean the user delegated the decision. They do **not** mean «invent something». Route each through this tree:

1. **A justified default exists** — a project convention, the behaviour already in the code (from the gap analysis), or an industry norm.
   → Take it. Record `- [assumed] <default> — основание: <why>; влияет на: REQ-NN` in `## Допущения`. The requirement is written in full, **without** `TBD`, and the unknown leaves the ledger. Say the default out loud so the user can object.
2. **No justified default and the unknown is blocking.**
   → Write `TBD` inside the requirement text at the exact spot the answer would fill, add `- [ ] open: <вопрос> — предлагаю: <решение>; нужно решение: <кто>` to `## Открытые вопросы`, keep `status: clarifying`.
3. **No justified default and the unknown is non-blocking.**
   → Add the `- [ ] open: …` item only; the requirement is written without caveats and without `TBD`, and the question does not block `status: ready`.

**No defensible default is still not «no opinion».** Outcome (1) means the default is good enough to write into the requirement; outcomes (2) and (3) mean it is not — but the item still carries the resolution the agent would pick, as `предлагаю:`, plus who decides. The difference is where the proposal lives: inside the requirement and `## Допущения` in (1), next to the question in (2) and (3). SKILL.md Step 7.5 revisits every one of these before the run ends.

**(1) versus (2) — the split that matters.** Both look the same from the user's side; they route to opposite outcomes:

> **Агент.** Сколько непринятых строк считаем допустимым, прежде чем считать импорт неудачным?
> **Пользователь.** Не знаю, решай сам.
> **Агент.** Тогда беру дефолт от соседнего импорта остатков: долю не ограничиваем, импорт доводим до конца и показываем отчёт (`src/import/stock/runner.ts:88`). Записал отдельным пунктом `- [assumed]` в `## Допущения`, влияет на REQ-01 и REQ-02 — скажи, если не подходит.

> **Агент.** Что делать при повторном импорте того же файла — блокировать или перезаписывать цены?
> **Пользователь.** Это к владельцу каталога, а он в отпуске до понедельника.
> **Агент.** Ок, придумывать не буду. В REQ-04 оставил `TBD` на месте поведения и завёл открытый вопрос — с предложением блокировать повторный импорт и пометкой, что решает владелец каталога. Спека сохранена со статусом `clarifying` — как ответ будет, добери её через `/tl-spec --update <path>`.

**The difference is the absence of a defensible default, not the user's wording.** In the first case a neighbouring module decides it; in the second nothing in the codebase or the conventions does, and the answer changes REQ-04's acceptance criteria — so it stays visible as `TBD` plus an open question.

**«Решай сам» is permission to take a default and show it**, never permission to invent a requirement and never permission to hide the chosen default inside a requirement's wording — that is what `## Допущения` exists for.
