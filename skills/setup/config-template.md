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
---

# Project development conventions

Drop any field above that does not apply to this project. The `prd_file`, `spec_file`, and
`roadmap_file` paths are where those documents belong; `research`, `architect`, and `plan` create
them later, so they can point at files that do not exist yet.

## Conventions

Free text. Anything the fields cannot capture: branch naming, review expectations, deploy steps,
who merges, what "done" means here.

## Rules

Every Markdown file under the configured `rules_dir` is a discovered rule file. There is no
registry: nothing has to point at a rule for it to be found, and dropping a file into `rules_dir`
is the whole act of adding a rule.
