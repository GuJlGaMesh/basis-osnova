# Report Format — Shared Layer

Single source of truth for the cross-skill «how a report marks a status» rule. A skill declares this file in its `skill.json` (`sharedReferences`) and the CLI copies it into that skill's `references/` on install. Consumers point here instead of defining their own set of marks.

Read it **before printing a report**. What a skill reports on — which sections it has, which checks it runs, what its verdict means — stays in that skill; this file fixes only how a status is spelled and what is allowed to appear in the output at all.

The file is self-contained: an agent handed only this file knows how to mark a status, when to drop a section, and what it may not claim.

Instructions to the agent are written in English; a report is user-facing and therefore Russian with «ты»-form, per the localization rules in the root `AGENTS.md`.

## One status triple

`✅ / ⚠️ / ❌` — the same three marks in every skill of the kit.

| Mark | Meaning | Blocks? |
|---|---|---|
| `✅` | Checked and clean — the check ran and passed, or the item is fully done. | no |
| `⚠️` | Checked with a caveat — it works, but something is worth knowing: a non-blocking finding, a partial result, a step deliberately skipped. | no |
| `❌` | Checked and broken — a failed check, a blocking finding, or work that is not done. | yes |

- **These three and nothing else.** No colour circles (`🔴 🟡 🟢`), no letter grades, no 1–5 scores, no fourth mark for «не применимо» — the triple reads unambiguously without colour, which is what survives being pasted into a ticket or an email. A check that did not apply is not printed at all (see the next section).
- **A mark never stands alone.** `❌` and `⚠️` name the concrete place (`file:line`, a path, a task id) and the concrete failure or caveat. A mark with no location and no failure mode is decoration, not a finding.
- **Order findings by severity** — every `❌` before any `⚠️`, so the reader hits the blockers first.
- **A summary line uses the same triple** and takes the worst mark present: `❌` if anything blocks, `⚠️` if only non-blocking items remain, `✅` if there are none.

**One documented exception — a severity scale is not a status.** `tl-security-review` grades findings `Critical / High / Medium / Low`, because a security finding carries a fix deadline and a blast radius, not a pass/fail. That scale answers «насколько это опасно», the triple above answers «прошло или нет»; they are different questions and a skill may carry both. Do not collapse one into the other, and do not invent a third scale for anything else.

## A section with no content is not printed

An empty section is not printed empty, and it is not padded to look filled: it is left out of the report entirely. A heading with «нет» under it, a table with no rows, a «Замечания» list invented so the shape would look complete — each costs the reader a stop and tells them nothing.

The exception is a skill whose report is a fixed record by design (a completion table with one row per unit, for example). Such a skill says so in its own body; without that, the rule above applies.

## No emoji in headings

A heading (`#` … `######`) carries no emoji — not in a report, not in a generated artifact, not in an example the skill prints. Two reasons, both structural: an emoji heading is the most recognisable marker of machine-written text, and it stops being a heading for anything that parses one — anchors, tables of contents, outline navigation, screen readers.

Emoji inside a line of body text is fine. The status marks above are body text: a table cell, a bullet, a summary line — never the heading itself.

## Never assert what you did not verify

A report states only what this run actually established.

- A check that was not run is reported as not run, or left out — never as `✅`. Asserting a negative that was never verified («тесты проходят», «уязвимостей нет») is fabrication, even when it happens to be true.
- A check that could not run — no test command, a missing tool, a PR that is not checked out — is stated as such in one line, with the reason. That is information; a silent `✅` in its place is not.
- The same holds for scope: say what was looked at. A verdict over a diff is not a verdict over the project.
