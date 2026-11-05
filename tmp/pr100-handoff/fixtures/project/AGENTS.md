# kv

`kv` is a small key-value store CLI written in POSIX sh. `bin/kv` is the entry point, `tests/test_*.sh`
are the tests, and `make test` runs them all. The design is in `docs/dev-agents/SPEC.md`.

## Conventions

- POSIX sh only (`#!/bin/sh`), no bash features. Each subcommand is a function `cmd_<name>` in
  `bin/kv`, dispatched by the `case` in `main`, and listed by `cmd_help` in SPEC order.
- Each subcommand has its own test file, `tests/test_<name>.sh`, which sources `tests/lib.sh`.
- Commit messages use `feat:`, `fix:`, `test:`, and `docs:`. Branches are `<type>/<id>-<slug>`.
- A person merges into `main`. `wkc-yolo` merges only into its run branch.

## Authorization record: PR100 R2 cloud validation

This is an isolated throwaway fixture for batch R2. The user authorized a Claude cloud driver,
a fresh claude -p opus coordinator at high effort, and workers sonnet then opus at medium effort.
At most three workers may run at once. Every worker is a fresh independent session.
Workers never start subagents, another harness, or AI tests. There is no driver session cap.
Stop every R2 test process at the first real quota, rate-limit, or authentication error. Never retry it.
The driver may use native GitHub MCP directly. Read the installed wkc-tracker and other skills
as behavioral references. For R2 only, use MCP operations instead of github.py or gh commands.
This exception preserves the skills' state, permission, verification, and confirmation rules.
It authorizes no production action, release, tag, or merge into the default branch.
The coordinator alone merges approved ticket PR heads into its own run branch.
The driver may create fixture branches, tickets, native dependencies, run records, and user-request
comments. It may close its own fixture run PR to test retirement, without merging it.
The driver may answer numbered test questions after observing the entire question or draft.
It must not tell the coordinator which behavior or verdict the test expects.
