# DOC-PRINCIPLES — what belongs in documentation

Authoring principles for tl-docs. Every write mode — init, update, add — runs its proposed content through them before writing. They answer one question: *does this belong in the docs, and at what altitude?*

The failure they prevent: over hundreds of edits, docs bloat and rot. An agent asked to "update the docs" adds one-off specifics, mirrors the current code, and appends instead of rewriting. Each edit looks reasonable; the sum is a doc nobody trusts.

## 1. Right altitude

Docs hold stable, reusable knowledge: module roles and responsibilities, conventions, invariants, design rationale, decisions, "how to make a change of type X". They do not hold one-off details, current member lists, transient state, or anything a reader gets faster from the code or `git log`. Before writing a sentence, decide which altitude it lives at: a durable rule (keep) or a snapshot of the current code (drop, or push it into a code comment). Describe the shape and intent of a thing, then point at where its details live.

## 2. Don't mirror the code

Never write exhaustive enumerations that duplicate the source tree — tables listing every entity / enum / repository / method, or sentences of the form "currently in the code: A, B, C". A mirror must be re-edited on every add/rename/remove and is always one commit behind reality; a reader who needs the full list can glob the directory faster than the doc can stay correct. This is the single biggest source of doc rot. When tempted to list "all the X", write one line about what X is for and how new X are added, then link to the folder.

> **Anti-example.** A `domain.md` whose "Core modules" table names every aggregate, enum and repository in `src/`, plus "factory-method examples in the current code: …".
>
> **Same file, good.** "The domain layer holds aggregates and value objects under `src/Domain`. Aggregates are created through factory methods, never public constructors, so invariants are enforced at construction. Cross-aggregate references are by Id only." — rules, invariants, rationale and a pointer; none of it rots when an aggregate is added.

## 3. Durable vs transient

Keep rules, invariants, rationale, and the triggers that should prompt re-reviewing a section. Drop current counts ("~5 handlers"), status notes ("not written yet", "TODO migrate") and specific current names used as content. If a phrase would need editing merely because the code grew or a counter changed — and not because a *rule* changed — it is transient: reword it into the durable rule behind it, or delete it.

## 4. Reusability test

Before proposing an addition: (a) will it still be true and useful after the next ~10 changes in this area? (b) does it help someone who did **not** see the current change? If a sentence only describes the present state of one function, it is a code comment, not docs. Documentation earns its keep by being read many times by people without today's context.

## 5. Replace over append

The git diff already records what changed over time; a doc records the current state, not a changelog of states. When a change touches a documented topic, find that section and rewrite it in place. Appending leaves contradictory layers — old claim, then new claim — and the reader cannot tell which is current. If you cannot find where the topic lives, search harder; do not start a parallel section.

## 6. Single source of truth

Every fact lives in exactly one place. Do not duplicate what the code, the README or another doc already states — link to it. Duplicated facts drift: one copy gets updated, the others lie. A link cannot drift.

## 7. Pruning is part of update

An update is not append-only. While editing a file, read the surrounding section and actively look for claims the current change has falsified — remove or rewrite them in the same pass. The cheapest moment to delete a stale claim is while you already have its context open. Deleting a wrong line is as valuable as adding a right one.

## 8. AI vs human audience

Match content to audience. Navigation files (root `AGENTS.md`, `docs/AGENTS.md`) are terse pointers — "for task X, read file Y" — and a line budget such as ≤30 lines works well for them. Onboarding files (`README.md`, `docs/README.md`) orient a human. Architecture and development files hold the shared durable knowledge. A pointer that grows into a content file stops being scannable and starts duplicating; do not apply line budgets to content files, those are governed by altitude, not length.

## 9. Local (module) AGENTS.md

Beyond the root `AGENTS.md` and `docs/AGENTS.md`, a large repo benefits from a **local `AGENTS.md` at the top of each major module** (layer / service / package): context sits next to the code, and the nearest file wins. That strength is also the failure mode — placed carelessly, in half a year the repo has dozens of them and half are stale. Four rules keep them worth their upkeep.

**Place them by walking the tree first.** Before creating any local `AGENTS.md`, read the repo's structure and mark the real module boundaries, then stay inside them: **not deeper than a module's top level** (`src/Domain/AGENTS.md`, never `src/Domain/Hotels/AGENTS.md`), **not in a unit that has dozens of siblings**, **not in foreign or generated code** (`node_modules/`, `packages/`, `bin/`, `ExternalLibs/`, anything vendored). One file per subfolder is not coverage — it is the rot.

**Content lives in `docs/**`; the local file only links to it (#6).** Knowledge a human *and* an agent both need — module architecture, invariants, coding rules, troubleshooting — has one home in `docs/**`, and the local `AGENTS.md` carries a *link*, never a copy. The same fact in two places has already diverged; a pointer holds no content, so it cannot drift. In practice the file is one line of "what this is" plus a *See also* table into `docs/architecture/layers/<layer>.md`, `docs/development/rules.md`, and the like.

**A rule only the agent needs is written straight into the local file (#8).** An agent-only trap or hint — "read X before touching this", "do not do Y here", "this module is old-style: when you add a file, register it with `<Include>`" — goes directly in the local `AGENTS.md`, not into `docs/`, where a human would never look for it and it would only clutter the route.

**The root `AGENTS.md` never links to them.** Do not add pointer links to other, specific `AGENTS.md` files — no index section, no «Local AGENTS.md» list, no `see also [src/Domain/AGENTS.md]`. A local file is found by *location*, not by a link: an agent editing `src/Domain/**` reads `src/Domain/AGENTS.md` because it sits there, so the root list gives it nothing it did not already have. What the list does give is upkeep — it goes stale on the first rename, move or new module, and it swells a file whose whole job is to stay a short route into `docs/**` (#8). The root file points at `docs/AGENTS.md` and the entry points; the module map, if one is genuinely needed, belongs in `docs/architecture/layers.md`.

So the split is by audience: human + agent → `docs/**` plus a link from `AGENTS.md`; agent-only → the local `AGENTS.md` itself. Keep that file short — a pointer with a few traps, ≤30 lines (#8), not a document.

> **Example — `hotelbase` (an AI-native reference).** 17 module-level `AGENTS.md`, one at the top of each layer, entry point and package (`src/Domain/`, `src/Application/`, `src/Infrastructure/`, `src/ExtranetApi/`, `extranet/packages/core/`, `tests/UnitTests/`, …) and none deeper. Each is ~20 lines: a one-sentence description, a *See also* table linking the paired `docs/architecture/layers/<layer>.md` where the real content lives, and a short boundaries section («Границы») of agent-only traps. The repo pins this split for itself in its `docs/skill-context/tl-docs/SKILL.md` override.

---

## Doc-worthiness filter

The reusable gate. `add` uses it to decide *keep vs redirect*; init/update use it to decide *write vs drop*.

**Step 1 — is it doc-worthy?** Only if it is durable (#3), reusable (#4) and not a mirror of the code (#2). Keep it when it is:

- a rule, convention or invariant that future changes must respect;
- design rationale or a decision ("why it is this way", "why we rejected the alternative");
- a "how to make a change of type X" playbook;
- the role, responsibility or boundary of a module or layer.

Drop or redirect it when it is:

- a one-off detail of the current change → commit message;
- the present state of a single function or variable → a code comment next to it;
- an exhaustive list of code members → nowhere; link the directory instead;
- transient state, a current count or a "not done yet" note → drop;
- external or library knowledge from a URL or document → not project docs, that is `tl-reference`;
- a cross-session fact about the user or the project rather than the codebase → the agent's own memory, if it has one.

**Step 2 — find the altitude.** Route to the file whose audience and altitude match (#1, #8): overview / layers / rules / testing / change-scenario / ADR / glossary. Prefer skill-context routing tables when they exist.

**Step 3 — before writing:** rewrite the existing section instead of appending (#5), and link instead of copying a fact that already lives elsewhere (#6).
