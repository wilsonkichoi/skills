---
issue_tracker: github
context_file: AGENTS.md
rules_dir: docs/dev-agents/rules/
prd_file: docs/dev-agents/PRD.md
spec_file: docs/dev-agents/SPEC.md
roadmap_file: docs/dev-agents/ROADMAP.md
test_command: "make test"
max_fix_attempts: 3
max_ai_test_sessions_per_attempt: 0
max_additional_tickets: 5
max_parallel_workers: 3
run_config: tracker
security_scan: 'gitleaks git --redact --log-opts="origin/main..HEAD"'
execution_models:
  - harness: claude-code
    model: sonnet
    effort: medium
  - harness: claude-code
    model: opus
    effort: medium
headless_workers: [claude-code]
---

# Project development conventions

## Conventions

See `AGENTS.md`. "Done" means `make test` passes on the branch the ticket merged into and every
`## After merge` step passed there.
