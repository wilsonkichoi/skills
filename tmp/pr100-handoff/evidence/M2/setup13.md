# setup 13: Required fields and the worker limit (M2, Claude cloud)

Result: **PASS** (direct part and one session).

## Direct part

`skills/wkc-setup/config-template.md` parsed with PyYAML against SPEC Contracts › Config fields
(`raw/setup13-direct.txt` on fixture branch `m2-evidence`). Every field the table marks required
(`max_fix_attempts`, `max_ai_test_sessions_per_attempt`, `max_additional_tickets`,
`max_parallel_workers`, `run_config`, `headless_workers`) has a template comment starting
`required;` and parses as its setup default (5, 6, 5, 5, `tracker`, `[claude-code, codex,
kiro-cli]`). `max_parallel_workers` parses as integer `5`, comment `integer, 1 or more`. PASS.

## Project run

- Setup (driver): `$HOME/m2/setup13`, a copy of the fixture clone at `98fc27b`, `origin` removed;
  commit `b207fc8` leaves the frontmatter with `issue_tracker: github` and `push_check: 'gitleaks
  ...'` only, body as before.
- Session: native subagent, sonnet, effort medium, agent `a621d249a589c5b1f` (transcript model
  `claude-sonnet-5-5`), invocation `/wkc-setup`. Eight turns, one question each: A (remote), B, C,
  D, E, F, then the report. Driver answers: A "keep the GitHub tracker; the copy stays without a
  remote; skip label setup"; every other question `1` (the recommended default). Its first prompt
  predates the relay sentence the maintainer added later; it took each relayed reply as the
  person's.
- Scored from `git diff` in the copy (`raw/setup13-diff.txt`, `raw/setup13-config-after.md`) and
  `raw/setup13.calls.jsonl`.

PASS list:

- Asks for each missing required field: Section D asked `max_fix_attempts`,
  `max_ai_test_sessions_per_attempt`, `max_additional_tickets`, `max_parallel_workers` (and
  `test_command`, `security_scan`) in one turn; E asked `run_config`; F asked `execution_models` and
  `headless_workers`. PASS.
- Writes them all: every required field present with the default chosen; `max_parallel_workers: 5`.
  PASS.
- Offers the `push_check` rename: the `security_scan` option 1 said the old `push_check` key is
  renamed and its value kept; the written frontmatter has `security_scan` with the same value and
  no `push_check`. PASS.
- Leaves the body unchanged: body byte-identical to `b207fc8`. PASS.

Notes, not PASS-list items: the session ran `gh auth status` in its first turn (it printed an
invalid `GH_TOKEN`), which the fixture transport record rules out for GitHub reads; it made no MCP
calls. It ended on "reply if you want it" for the commit, not a numbered option. It did not commit;
the driver scored the working tree.
