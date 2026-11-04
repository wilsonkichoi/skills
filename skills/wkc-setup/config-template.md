---
issue_tracker: github                       # github / linear / local / other
linear_team: "TEAM"                         # only for issue_tracker: linear
linear_project: "Project name"              # only for issue_tracker: linear
context_file: AGENTS.md                     # project entry point for coding agents: AGENTS.md or CLAUDE.md
rules_dir: docs/dev-agents/rules/           # promoted learnings, one file per rule
issues_dir: docs/dev-agents/issues/         # only for issue_tracker: local
prd_file: docs/dev-agents/PRD.md
spec_file: docs/dev-agents/SPEC.md
roadmap_file: docs/dev-agents/ROADMAP.md
test_command: "npm test"                    # run before handing work back
max_fix_attempts: 5                         # required; integer, 0 or more. Review rounds that may change code on one PR
max_ai_test_sessions_per_attempt: 6         # required; integer, 0 or more. AI test sessions one build or one review round may launch
max_additional_tickets: 5                   # required; integer, 0 or more. Tickets a wkc-yolo run may admit beyond its approved initial tickets
max_parallel_workers: 5                     # required; integer, 1 or more. Fresh sessions a wkc-yolo run keeps running at once
run_config: tracker                         # required; tracker / github-variable / command <cmd>. Where wkc-yolo stores run configs
security_scan: 'gitleaks git --redact --log-opts="origin/main..HEAD"'  # optional; absent means no scan. Scans the commits about to be pushed for secrets; exit 0 passes, anything else blocks the push
execution_models:                           # optional; absent means no pair. Used by wkc-yolo runs: the first builds; each review uses the other model from the step before. effort defaults to medium
  - harness: claude-code                    # claude-code / codex / kiro-cli
    model: opus                             # claude-code: opus / sonnet / haiku / fable, or a pinned ID; codex: the exact ID codex exec -m takes; kiro-cli: an ID kiro-cli chat --list-models lists
    effort: medium
  - harness: codex
    model: gpt-6.1-sol
    effort: medium
headless_workers: [claude-code, codex, kiro-cli]  # required; claude-code / codex / kiro-cli. Headless CLIs a wkc-yolo run may start, each only after its subscription-login check passes
---

# Project development conventions

Drop an optional field above that does not apply to this project. Keep every required field: a
skill that reads one and finds it missing stops and asks for `wkc-setup`. The `prd_file`, `spec_file`, and
`roadmap_file` paths are where those documents belong; the `wkc-research`, `wkc-architect`, and `wkc-plan` skills create
them later, so they can point at files that do not exist yet.

## Conventions

Free text. Anything the fields cannot capture: branch naming, review expectations, deploy steps,
who merges, what "done" means here.

## Tracker notes

Anything about this project's tracker that does not match what the skills expect, written down so
it is a decision you can come back to rather than a surprise later. `wkc-setup` adds a note here when
it finds something, and leaves the section out when it does not.

The case that produces one today: a Linear team carrying a status outside the seven this skill set
uses. Tickets parked in it are invisible to `next` and are reported as unmapped, so the note names
the status and what it means for the project. Resolve it by deleting the status in Linear, by
folding those tickets into one of the seven, or by deciding to live with it.

## Rules

Every Markdown file under the configured `rules_dir` is a discovered rule file. There is no
registry: nothing has to point at a rule for it to be found, and dropping a file into `rules_dir`
is the whole act of adding a rule.
