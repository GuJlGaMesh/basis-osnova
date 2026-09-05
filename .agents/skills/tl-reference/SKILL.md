---
name: tl-reference
description: >-
  Fetches an external URL or document into a structured knowledge reference in docs/references/. Not for: the project's own documentation → tl-docs. Use when: создай справочник, загрузи документацию по ссылке, сохрани знания.
argument-hint: "<url|path> [url2|path2] [--name <ref-name>] [--update]"
allowed-tools: Read Write Edit Glob Grep Bash(mkdir *) Bash(ls *) Bash(wc *) WebFetch WebSearch AskUserQuestion
disable-model-invocation: false
---

# Reference Creator

You create structured knowledge references from external sources (URLs, documents, files) and store them in `docs/references/` so that AI agents can use this knowledge in future conversations.

### Project Context

**Project overrides:** read `docs/skill-context/tl-reference/SKILL.md` if it exists — its rules override this skill's own instructions on conflict. How to apply them: `references/skill-context.md`.

---

## Argument Detection

```
Check $ARGUMENTS:
├── Contains "--update"         → Update Mode: refresh existing reference
├── Contains URLs (http/https)  → URL Mode: fetch and process web sources
├── Contains file paths         → File Mode: process local documents
├── "list"                      → List existing references
├── "show <name>"               → Show reference content
├── "delete <name>"             → Delete a reference (with confirmation)
└── Empty                       → Interactive: ask what to create
```

## Workflow

### Step 0: Setup

Ensure `docs/references/` exists:
```bash
mkdir -p docs/references
```

Check for existing references to avoid duplicates:
```bash
ls docs/references/
```

If `--name <ref-name>` is provided in arguments, use that as the reference name.
If `--update` is provided, find and update the existing reference instead of creating new.

### Step 1: Collect Sources

**For URLs:**

For EACH URL provided:

1. **Fetch the page** using `WebFetch`:
   ```
   WebFetch(url, "Extract ALL key information from this page:
   - Main topic and purpose; key concepts, terms and definitions
   - Code examples and patterns (preserve exactly)
   - API methods with parameters, return types and full signatures
   - Configuration options with defaults; error handling and edge cases
   - Best practices; version and compatibility notes; links to critical sub-pages
   Provide a comprehensive, structured extraction. Preserve code examples verbatim.")
   ```

2. **Assess depth** — if the page references critical sub-pages (API reference, detailed guides, changelogs), fetch those too (up to 8 additional pages per source URL, prioritize by relevance to the core topic).

3. **Search for gaps** — run 1-2 targeted `WebSearch` queries if the fetched content has obvious gaps:
   - `"<topic> API reference complete"` — for API docs
   - `"<topic> migration guide"` or `"<topic> changelog"` — for version-specific info

**For local files:**

1. Read each file with the `Read` tool
2. If the file references other local files, read those too (up to 5 levels of includes)
3. Identify the file format (markdown, HTML, JSON, YAML, plain text) and extract accordingly

**For interactive mode (no arguments):**

Ask the user (in Russian, addressing as «ты»):
1. «По какой теме / технологии нужен справочник?»
2. «У тебя есть URL или локальные файлы, или мне поискать?»
3. «Какие аспекты важнее всего для твоего кейса?»

If the user wants you to search, use `WebSearch` to find authoritative sources, then proceed with URL mode.

**Unreachable source:** if a URL needs authentication, errors out or renders empty, report it to the user and leave it out of `Source:` — never fill the gap from memory.

### Step 2: Synthesize Reference

Transform collected material into a structured reference document.

**Read `references/TEMPLATE.md` before writing the file** — it owns the header, the core and conditional sections, the skeleton, the quality rules and the conformance checklist. Do not reconstruct the shape from memory, and run its checklist against the draft before the `Write`.

Two rules that decide whether the result is usable, both easy to violate while paraphrasing:

- **Code examples are copied verbatim from the source, never paraphrased.** A rewritten snippet looks right and silently drifts from the real API — and a reference exists precisely so nobody has to double-check it against the docs.
- **A «best practice» carries its reason** («… because …»). Without the reason the reader cannot tell whether it still applies in their case, and the line becomes noise the next reader deletes.

### Step 3: Name and Save

**Naming convention:**
- Derive from topic: `react-hooks.md`, `fastapi-endpoints.md`, `docker-compose.md`
- Use lowercase, hyphens, `.md` extension
- If `--name` was provided, use that (with `.md` extension if missing)
- Avoid generic names like `reference.md` or `docs.md`

**Save to:** `docs/references/<name>.md`

### Step 4: Register in Index

Add or update the row for this reference in `docs/references/INDEX.md`, creating the file if it is missing. The index format is in `references/TEMPLATE.md` → Index entry — read that section whenever you create or edit the index.

### Step 5: Report

Tell the user: the reference name and path, its size in lines, which sections it ended up with, the sources used, and that other skills can now read `docs/references/<name>.md`.

---

## Update Mode (`--update`)

When `--update` is present:

1. Find the existing reference (by `--name` or by matching source URLs in the header)
2. Re-fetch the source URLs from the reference header
3. Compare with existing content — only update sections that changed
4. Preserve the `Created:` date, update `Updated:` date
5. Report what changed

---

## List / Show / Delete

**`/tl-reference list`** — read and display `docs/references/INDEX.md` or list files in the directory.

**`/tl-reference show <name>`** — read and display the reference content. Add `.md` if missing.

**`/tl-reference delete <name>`** — ask for confirmation, then delete the file and update INDEX.md.

---

## Integration With Other Skills

Everything in `docs/references/` is readable by any skill — `/tl-plan` and `/tl-implement` pull it in for domain context, `/tl-research` cites it during investigation. To point them at a specific file, add a line under a `## References` heading in `AGENTS.md`: `- For <topic> details, see docs/references/<name>.md`.

---

## Artifact Ownership

- **Primary ownership:** `docs/references/` (all files)
- **Shared ownership:** `docs/references/INDEX.md`, `AGENTS.md` (References section)
- **Read-only:** all other project files

---

## Pitfalls

### 1. Hallucinations Instead of Facts

**Symptom:** AI adds information that was not in the sources.

**What to do:** Strictly follow the rule — if information is not found in the sources, **omit the section**, do not invent. Every statement must be backed by a source.

**Example:**
```
❌ "Zod also supports custom error messages in 10 languages" — this was not in the documentation
✅ Only include what is in the source
```

### 2. Incomplete API Signatures

**Symptom:** API methods without parameter types or return values.

**What to do:** Always include FULL signatures with types. If the source has `z.string().min(n: number, message?: string): ZodString` — copy it in full.

### 3. Outdated References

**Symptom:** Stale information, the library has been updated but the reference has not.

**What to do:** Always include `Source:` in the header. The user can run `/tl-reference --update --name <name>` to refresh.

### 4. Oversized References

**Symptom:** Reference is 2000+ lines, impossible to quickly find what you need.

**What to do:** Split into multiple files by subtopics. Create a directory `docs/references/<topic>/` with an `INDEX.md` inside.

### 5. Duplicate References

**Symptom:** Two references `react-hooks.md` and `hooks-react.md` with overlapping content.

**What to do:** Before creating, check `docs/references/INDEX.md` for similar topics. If one exists — suggest updating the existing one instead of creating a new one.
