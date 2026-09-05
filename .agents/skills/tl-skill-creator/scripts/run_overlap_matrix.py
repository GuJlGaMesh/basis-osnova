#!/usr/bin/env python3
"""Run overlap matrix evaluation across all skills.

For each ambiguous query, tests which skills would trigger. Outputs a matrix
showing conflicts and a summary of overlapping pairs.
"""

import argparse
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


CLASSIFICATION_PROMPT = """\
You are evaluating whether a Claude Code skill should be triggered for a user query.

Skill name: {skill_name}
Skill description: {skill_description}

User query: {query}

Would you invoke this skill (via the Skill tool) to handle this query? \
Consider ONLY whether the query matches the skill's purpose as described. \
Do not consider whether you could handle it without the skill.

Reply with EXACTLY one word: YES or NO"""


def classify(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    model: str | None = None,
) -> bool:
    """Ask Claude if a skill should trigger for a query."""
    prompt = CLASSIFICATION_PROMPT.format(
        skill_name=skill_name,
        skill_description=skill_description,
        query=query,
    )

    cmd = [
        "claude", "-p", prompt,
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
            cmd, capture_output=True, text=True, timeout=timeout, env=env,
        )
        if result.returncode != 0:
            return False
        answer = result.stdout.strip().upper()
        return "YES" in answer and "NO" not in answer
    except Exception:
        return False


def run_overlap_matrix(
    queries: list[dict],
    skills: list[dict],
    num_workers: int,
    timeout: int,
    model: str | None = None,
    verbose: bool = False,
) -> dict:
    """Run all queries against all skills, return matrix."""
    # matrix[query_text] = {skill_name: True/False}
    matrix: dict[str, dict[str, bool]] = {}
    query_meta: dict[str, dict] = {}

    total_calls = len(queries) * len(skills)
    completed = 0

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        future_to_info = {}
        for q in queries:
            query_text = q["query"]
            matrix[query_text] = {}
            query_meta[query_text] = q
            for skill in skills:
                future = executor.submit(
                    classify,
                    query_text,
                    skill["name"],
                    skill["description"],
                    timeout,
                    model,
                )
                future_to_info[future] = (query_text, skill["name"])

        for future in as_completed(future_to_info):
            query_text, skill_name = future_to_info[future]
            try:
                triggered = future.result()
            except Exception:
                triggered = False
            matrix[query_text][skill_name] = triggered
            completed += 1
            if verbose and completed % 10 == 0:
                print(f"  Progress: {completed}/{total_calls}", file=sys.stderr)

    # Analyze overlaps
    results = []
    for q in queries:
        query_text = q["query"]
        triggered_skills = [s for s, v in matrix[query_text].items() if v]
        expected = q.get("expected_skill")
        results.append({
            "query": query_text,
            "expected_skill": expected,
            "triggered": triggered_skills,
            "trigger_count": len(triggered_skills),
            "correct": expected in triggered_skills if expected else None,
        })

    # Find overlapping pairs
    overlap_counts: dict[str, int] = {}
    for q in queries:
        query_text = q["query"]
        triggered = [s for s, v in matrix[query_text].items() if v]
        if len(triggered) > 1:
            for i, a in enumerate(triggered):
                for b in triggered[i + 1:]:
                    pair = tuple(sorted([a, b]))
                    key = f"{pair[0]} <-> {pair[1]}"
                    overlap_counts[key] = overlap_counts.get(key, 0) + 1

    # Sort overlaps by frequency
    sorted_overlaps = sorted(
        overlap_counts.items(), key=lambda x: x[1], reverse=True,
    )

    # Skill trigger frequency
    skill_freq: dict[str, int] = {}
    for q in queries:
        query_text = q["query"]
        for s, v in matrix[query_text].items():
            if v:
                skill_freq[s] = skill_freq.get(s, 0) + 1

    return {
        "results": results,
        "overlap_pairs": [{"pair": k, "count": v} for k, v in sorted_overlaps],
        "skill_frequency": dict(sorted(
            skill_freq.items(), key=lambda x: x[1], reverse=True,
        )),
        "summary": {
            "total_queries": len(queries),
            "queries_with_no_trigger": sum(
                1 for r in results if r["trigger_count"] == 0
            ),
            "queries_with_single_trigger": sum(
                1 for r in results if r["trigger_count"] == 1
            ),
            "queries_with_overlap": sum(
                1 for r in results if r["trigger_count"] > 1
            ),
            "unique_overlap_pairs": len(sorted_overlaps),
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run overlap matrix across all skills",
    )
    parser.add_argument(
        "--queries", required=True,
        help="Path to JSON file with ambiguous queries",
    )
    parser.add_argument(
        "--skills", required=True,
        help="Path to JSON file with skill names and descriptions",
    )
    parser.add_argument("--num-workers", type=int, default=5)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--model", default=None)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    queries = json.loads(Path(args.queries).read_text())
    skills = json.loads(Path(args.skills).read_text())

    if args.verbose:
        print(
            f"Overlap matrix: {len(queries)} queries × {len(skills)} skills "
            f"= {len(queries) * len(skills)} classifications",
            file=sys.stderr,
        )

    output = run_overlap_matrix(
        queries=queries,
        skills=skills,
        num_workers=args.num_workers,
        timeout=args.timeout,
        model=args.model,
        verbose=args.verbose,
    )

    if args.verbose:
        s = output["summary"]
        print(f"\nResults:", file=sys.stderr)
        print(f"  No trigger: {s['queries_with_no_trigger']}", file=sys.stderr)
        print(f"  Single trigger: {s['queries_with_single_trigger']}", file=sys.stderr)
        print(f"  Overlap (>1): {s['queries_with_overlap']}", file=sys.stderr)
        print(f"\nTop overlapping pairs:", file=sys.stderr)
        for pair in output["overlap_pairs"][:10]:
            print(f"  {pair['count']}x {pair['pair']}", file=sys.stderr)

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
