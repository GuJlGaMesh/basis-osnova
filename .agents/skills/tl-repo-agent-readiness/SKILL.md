---
name: tl-repo-agent-readiness
description: >-
  Scores how ready a repository is for AI coding agents and writes a markdown report. Use when: готовность репозитория для агента, проверь репозиторий для AI, аудит репозитория.
argument-hint: "[report-path]"
allowed-tools: Read Glob Grep Bash Write
disable-model-invocation: true
---

# Repository Agent Readiness

Use this skill when the user wants a real repository assessment, not a lint-style scan.
Your job is to review the repository the way an experienced AI-native code reviewer would:

1. Inspect the codebase structure and the highest-signal files.
2. Judge the repo against the rubric in `references/rubric.md`.
3. Produce two outputs:
   - a short in-chat summary in Russian
   - a full markdown report written into the repository

Use the bundled report structure in `references/report-template.md`.

## Default output path

- If the user passed an argument, treat it as the report path relative to the current repo root.
- If no argument was passed, write the report to `tl-repo-agent-readiness-report.md`.
- Never write outside the current repository.
- Reject absolute paths and parent traversal such as `../`.

## Repository snapshot

Start from a repository snapshot, then inspect the most important files it points you to.
Do not stop at filenames; validate claims by reading file contents.

Run the bundled script from the skill directory:

```bash
node scripts/repo-context.mjs .
```

If your harness runs commands from the repository root and cannot resolve the relative script path, resolve `scripts/repo-context.mjs` relative to this `SKILL.md` file first, then run it with the repository root as the first argument.

## Assessment rules

- This is a judgment-based review. Do not outsource the score to filenames alone.
- Use evidence from real files: docs, manifests, configs, workflows, representative source files, and representative tests.
- Focus on whether an AI coding agent can understand, run, test, and modify the repo safely with limited human rescue.
- Calibrate expectations to the repo type. A small CLI and a large monorepo should not be judged by the same practical bar.
- Missing polish is not the same as blocked agent progress. Score based on actual operating friction.
- Call out uncertainty explicitly when the evidence is thin.
- Use `0.5` score increments for category scores and the overall score. Avoid false precision.
- Do not execute repository-controlled commands or scripts as part of the assessment.
- Do not run package scripts, task runners, builds, tests, or repo binaries during the assessment.
- Never open or quote secret-bearing files such as `.env`, `.npmrc`, private keys, cloud credentials, or other credential/config material that appears sensitive.

## .NET / C# repositories

For .NET repositories, do not rely only on the automatic `repoType` and `test` classification from the snapshot.

Treat the repository as `service` or `monorepo` when evidence includes:

- `*.sln` or `*.slnx`
- multiple `*.csproj`, `*.fsproj`, or `*.vbproj`
- top-level folders such as `Libs/`, `Modules/`, `Web/`, `Services/`, `Hosting/`, `Workers/`, `Api/`, or `Apps/`
- ASP.NET Core, workers, Service Fabric, or multiple deployable hosts

Treat tests as present when evidence includes:

- `Tests/**/*.csproj` or `Test/**/*.csproj`
- projects named `*.Tests` or `*.Test`
- files named `*Test.cs` or `*Tests.cs`
- xUnit, NUnit, or MSTest package references in project files

If the snapshot disagrees with this evidence, record the mismatch in Evidence Notes and score from inspected repository evidence, not from the snapshot alone.

## Tooling and agent-generated surfaces

Some repositories include agent or tool-generated folders. Use them as evidence for agent guidance or tooling, but do not treat them as ordinary product code.

- Use `agentGuidanceFiles` for `AGENTS.md`, installed skill instructions, and similar guidance.
- Use `toolingInternalFiles` for generated harness/config surfaces such as `.claude/**`, `.codex/**`, `.agents/**`, `.opencode/**`, and `.tl-ai-kit/**`.
- Do not let tooling-internal files inflate source, docs, config, or convention scores for the product itself.
- If tooling files are important to the assessment, cite them under agent guidance or tooling evidence explicitly.

## Secret and local config evidence

Treat local, environment-specific, or credential-like config as excluded evidence unless the user explicitly asks for a secret/config review.

- Do not read `.env*`, `.npmrc`, private keys, token files, service-account files, or deployment files with `secret`, `token`, `credential`, or similar names.
- For .NET projects, do not read local/secret-like `appsettings` files such as `appsettings.Local.json`, `appsettings.*.local.json`, `appsettings.*.secrets.json`, or environment-specific configs that appear to contain production credentials.
- Safe templates such as `appsettings.example.json`, `appsettings.template.json`, or clearly documented sample configs may be read as setup evidence.
- Record excluded sensitive/config files in the report rather than silently ignoring them.

## Non-Negotiable SOP

1. Read `references/rubric.md`.
2. Read `references/report-template.md`.
3. Build an evidence log before scoring anything.
4. Inspect the mandatory evidence set from the snapshot:
   - README / core docs
   - agent instructions such as `AGENTS.md` or equivalent
   - root manifest(s) and lockfile(s)
   - build, test, lint, and typecheck config
   - CI / workflow files
   - at least 2 representative core source files
   - at least 1 representative test file if tests exist
5. For medium or large repos, extend the inspection set:
   - at least 3 representative source files
   - at least 2 representative tests if tests exist
   - at least 1 additional workflow/config file
6. If an expected evidence type is absent, record that absence explicitly in the report instead of silently skipping it.
7. If a file appears secret-bearing or credential-like, skip it and record that it was intentionally excluded from model-visible evidence.
8. Score every rubric category from `0.0` to `10.0` using `0.5` increments only.
9. For each category, cite at least one concrete evidence point:
   - an exact file path
   - or an explicit absence such as "no CI workflow found"
10. Do not award `9.0+` to a category unless there are at least 2 strong, non-conflicting evidence points for it.
11. Treat `CICD` as informational only. Inspect and report it, but do not include it in the final score calculation and do not apply overall score caps based only on CI/CD evidence.
12. Apply the overall score caps from `references/rubric.md` before finalizing the overall score.
13. Decide the final overall readiness score and rating using the rubric guidance.
14. Write the full report locally.
15. Reply in chat with a compact Russian summary:
   - overall score and rating
   - 3 strongest areas
   - 3 biggest risks
   - first fixes to make
   - a clickable markdown file link to the saved report

## Evidence discipline

- Keep a running evidence log while reading.
- Prefer direct file evidence over inference.
- If you infer something from structure or naming rather than explicit docs/config, say that it is an inference.
- If evidence coverage is thin, reduce confidence and avoid top-end scores.
- Treat secret-bearing files as out of scope for model inspection unless the user explicitly asks for secret review.

## Score discipline

- Category scores should follow the rubric anchors, not your general vibe.
- `9.0+` means clearly strong, repeatable evidence with little ambiguity.
- `10.0` should be extremely rare.
- If setup, validation, or agent guidance is materially weak, do not let polish in other areas inflate the overall score.

## Report requirements

- Keep the full report concrete and evidence-backed.
- Reference exact files whenever possible.
- Present the saved report path as a markdown file link using an absolute filesystem target, for example `[tl-repo-agent-readiness-report.md](/absolute/path/to/repo/tl-repo-agent-readiness-report.md)`.
- Include strengths, weaknesses, likely agent failure modes, and practical fixes.
- Make the recommendations sequenced, not generic.
- If the repo is obviously missing enough structure to assess reliably, say so and explain the limiting factors.
- Explicitly note any applied score cap or gating reason.
