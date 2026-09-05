# Skill Context — Shared Layer

Single source of truth for the cross-skill «project overrides» rule. A skill declares this file in its `skill.json` (`sharedReferences`) and the CLI copies it into that skill's `references/` on install. Consumers point here instead of restating the rules.

`docs/skill-context/<skill>/SKILL.md` carries the project's own rules for that skill. Read it at the start of a run when it exists; when it does not, continue without it.

- Treat those rules as **project-level overrides** of the skill's general instructions.
- On conflict the project rule wins: the more specific instruction beats the broader one, the same way a nested per-directory instruction file beats a root-level one.
- Without a conflict, apply both — the skill's general rules plus the project's.
- The overrides cover every output of the skill, including generated artifacts and any template the skill fills in. A template shipped in `references/` is a base structure: extend it when a project rule asks for an extra section, field or check.
- Verify the result against the project rules before showing it to the user; a violation is a defect and is fixed before the result is presented.
