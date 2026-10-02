---
issue_tracker: github                       # github / linear / local / other
context_file: AGENTS.md                     # project entry point for coding agents: AGENTS.md or CLAUDE.md
rules_dir: docs/dev-agents/rules/           # promoted learnings, one file per rule
prd_file: docs/dev-agents/PRD.md
spec_file: docs/dev-agents/SPEC.md
roadmap_file: docs/dev-agents/ROADMAP.md
---

# Project development conventions

The `prd_file`, `spec_file`, and `roadmap_file` paths are where those documents belong; the
`wkc-research`, `wkc-architect`, and `wkc-plan` skills create them later, so they can point at
files that do not exist yet.

There is no `test_command`. This repository ships skills as Markdown with no build step and no
test suite. Validation is manual, through the runbooks in `validation/`.

## Conventions

Issues live in GitHub Issues on `wilsonkichoi/skills`, the `origin` remote.

`AGENTS.md` owns the rest: branch naming, the pull request workflow, versioning, the pre-commit
checklist, and the rule that only a human merges to `main`.

## Rules

Every Markdown file under the configured `rules_dir` is a discovered rule file. There is no
registry: nothing has to point at a rule for it to be found, and dropping a file into `rules_dir`
is the whole act of adding a rule.
