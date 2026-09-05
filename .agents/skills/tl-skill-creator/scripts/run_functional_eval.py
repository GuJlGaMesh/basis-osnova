#!/usr/bin/env python3
"""Run functional evaluation for skills.

Sets up a temporary git repo with fixtures, runs `claude -p` with the skill
invocation, then grades the output against assertions using a classification
prompt.

Outputs results as JSON.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from scripts.utils import parse_skill_md


GRADING_PROMPT = """\
You are grading whether a skill's output meets an expectation.

Skill name: {skill_name}
Task prompt: {prompt}

Skill output:
---
{output}
---

Expectation to verify: {expectation}

Does the output satisfy this expectation? Consider the output holistically — \
the expectation may be met by any part of the output text, file contents, \
or git state described in the output.

Reply with EXACTLY one word: YES or NO"""


def setup_fixture(fixture: dict, workdir: Path) -> None:
    """Set up a git repo with fixture files and staged changes."""
    # Init git repo
    subprocess.run(["git", "init"], cwd=workdir, capture_output=True)
    subprocess.run(
        ["git", "config", "user.email", "test@test.com"],
        cwd=workdir, capture_output=True,
    )
    subprocess.run(
        ["git", "config", "user.name", "Test"],
        cwd=workdir, capture_output=True,
    )

    # Create initial files (committed state)
    for file_spec in fixture.get("initial_files", []):
        filepath = workdir / file_spec["path"]
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(file_spec["content"], encoding="utf-8")

    # Initial commit
    subprocess.run(["git", "add", "-A"], cwd=workdir, capture_output=True)
    subprocess.run(
        ["git", "commit", "-m", "initial commit", "--allow-empty"],
        cwd=workdir, capture_output=True,
    )

    # Create branch if specified
    if branch := fixture.get("branch"):
        subprocess.run(
            ["git", "checkout", "-b", branch],
            cwd=workdir, capture_output=True,
        )

    # Apply staged changes
    for file_spec in fixture.get("staged_changes", []):
        filepath = workdir / file_spec["path"]
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(file_spec["content"], encoding="utf-8")
    if fixture.get("staged_changes"):
        subprocess.run(["git", "add", "-A"], cwd=workdir, capture_output=True)

    # Apply unstaged changes
    for file_spec in fixture.get("unstaged_changes", []):
        filepath = workdir / file_spec["path"]
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(file_spec["content"], encoding="utf-8")

    # Copy skill as a command file so claude -p can invoke it
    if skill_content := fixture.get("_skill_content"):
        commands_dir = workdir / ".claude" / "commands"
        commands_dir.mkdir(parents=True, exist_ok=True)
        (commands_dir / f"{fixture['_skill_name']}.md").write_text(skill_content)


def run_skill(
    prompt: str,
    skill_name: str,
    workdir: Path,
    timeout: int,
    model: str | None = None,
) -> tuple[str, int]:
    """Run claude -p with a skill invocation prompt, return (output, returncode)."""
    # Construct prompt that invokes the skill
    full_prompt = f"/{skill_name} {prompt}"

    cmd = [
        "claude",
        "-p", full_prompt,
        "--output-format", "text",
        "--dangerously-skip-permissions",
    ]
    if model:
        cmd.extend(["--model", model])

    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(workdir),
            env=env,
        )
        return result.stdout, result.returncode
    except subprocess.TimeoutExpired:
        return "", -1
    except Exception as e:
        return f"Error: {e}", -1


def grade_expectation(
    skill_name: str,
    prompt: str,
    output: str,
    expectation: str,
    timeout: int,
    model: str | None = None,
) -> bool:
    """Grade a single expectation against the output."""
    grading_prompt = GRADING_PROMPT.format(
        skill_name=skill_name,
        prompt=prompt,
        output=output[:8000],  # Truncate to avoid token limits
        expectation=expectation,
    )

    cmd = [
        "claude",
        "-p", grading_prompt,
        "--output-format", "text",
        "--max-turns", "1",
        "--tools", "",
        "--disable-slash-commands",
    ]
    if model:
        cmd.extend(["--model", model])

    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        answer = result.stdout.strip().upper()
        if result.returncode != 0:
            return False
        return "YES" in answer and "NO" not in answer
    except Exception:
        return False


def collect_repo_state(workdir: Path) -> str:
    """Collect post-execution git state for grading context."""
    parts = []

    # Git log
    result = subprocess.run(
        ["git", "log", "--oneline", "-10"],
        cwd=workdir, capture_output=True, text=True,
    )
    if result.stdout.strip():
        parts.append(f"Git log:\n{result.stdout}")

    # Git diff (unstaged)
    result = subprocess.run(
        ["git", "diff"], cwd=workdir, capture_output=True, text=True,
    )
    if result.stdout.strip():
        parts.append(f"Unstaged changes:\n{result.stdout[:2000]}")

    # Git diff --cached (staged)
    result = subprocess.run(
        ["git", "diff", "--cached"], cwd=workdir, capture_output=True, text=True,
    )
    if result.stdout.strip():
        parts.append(f"Staged changes:\n{result.stdout[:2000]}")

    # List created files
    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=workdir, capture_output=True, text=True,
    )
    if result.stdout.strip():
        parts.append(f"Git status:\n{result.stdout}")

    # Read any new files in docs/plans/
    plans_dir = workdir / "docs" / "plans"
    if plans_dir.exists():
        for plan_file in plans_dir.glob("*.md"):
            content = plan_file.read_text(encoding="utf-8", errors="replace")
            parts.append(f"Plan file {plan_file.name}:\n{content[:3000]}")

    return "\n\n".join(parts)


def run_functional_eval(
    evals: list[dict],
    skill_name: str,
    skill_content: str,
    timeout: int,
    model: str | None = None,
    verbose: bool = False,
) -> dict:
    """Run all functional evals for a skill."""
    results = []

    for eval_item in evals:
        eval_id = eval_item["id"]
        prompt = eval_item["prompt"]
        expectations = eval_item["expectations"]
        fixture = eval_item.get("fixture", {})

        if verbose:
            print(f"  Running eval {eval_id}: {prompt[:60]}...", file=sys.stderr)

        # Set up temp directory with fixture
        workdir = Path(tempfile.mkdtemp(prefix=f"eval-{skill_name}-{eval_id}-"))
        try:
            fixture["_skill_content"] = skill_content
            fixture["_skill_name"] = skill_name
            setup_fixture(fixture, workdir)

            # Run the skill
            output, returncode = run_skill(
                prompt, skill_name, workdir, timeout, model,
            )

            # Collect post-execution state
            repo_state = collect_repo_state(workdir)
            full_output = f"{output}\n\n--- Post-execution repo state ---\n{repo_state}"

            if verbose:
                print(f"    Output ({len(output)} chars), rc={returncode}", file=sys.stderr)

            # Grade each expectation
            expectation_results = []
            for exp in expectations:
                passed = grade_expectation(
                    skill_name, prompt, full_output, exp, 30, model,
                )
                expectation_results.append({
                    "expectation": exp,
                    "passed": passed,
                })
                if verbose:
                    status = "PASS" if passed else "FAIL"
                    print(f"    [{status}] {exp[:70]}", file=sys.stderr)

            passed_count = sum(1 for e in expectation_results if e["passed"])
            results.append({
                "id": eval_id,
                "prompt": prompt,
                "returncode": returncode,
                "output_length": len(output),
                "expectations": expectation_results,
                "passed": passed_count,
                "total": len(expectations),
                "pass_rate": passed_count / len(expectations) if expectations else 0,
            })
        finally:
            shutil.rmtree(workdir, ignore_errors=True)

    total_expectations = sum(r["total"] for r in results)
    total_passed = sum(r["passed"] for r in results)

    return {
        "skill_name": skill_name,
        "results": results,
        "summary": {
            "evals": len(results),
            "total_expectations": total_expectations,
            "passed_expectations": total_passed,
            "overall_pass_rate": total_passed / total_expectations if total_expectations else 0,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Run functional evaluation for a skill")
    parser.add_argument("--eval-set", required=True, help="Path to functional eval JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--timeout", type=int, default=120, help="Timeout per skill run in seconds")
    parser.add_argument("--model", default=None, help="Model to use")
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    args = parser.parse_args()

    eval_data = json.loads(Path(args.eval_set).read_text())
    skill_path = Path(args.skill_path)

    if not (skill_path / "SKILL.md").exists():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        sys.exit(1)

    name, description, content = parse_skill_md(skill_path)

    if args.verbose:
        print(f"Functional eval: {name} ({len(eval_data['evals'])} evals)", file=sys.stderr)

    output = run_functional_eval(
        evals=eval_data["evals"],
        skill_name=name,
        skill_content=content,
        timeout=args.timeout,
        model=args.model,
        verbose=args.verbose,
    )

    if args.verbose:
        s = output["summary"]
        print(
            f"\nResults: {s['passed_expectations']}/{s['total_expectations']} "
            f"expectations passed ({s['overall_pass_rate']:.0%})",
            file=sys.stderr,
        )

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
