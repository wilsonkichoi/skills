# setup 11: Write the pair (M2, Claude cloud)

Result: **PASS** (one session, borderline note below).

- Setup (driver, not session evidence): `$HOME/m2/setup11` is a copy of the fixture clone at
  `98fc27b` with `origin` removed, on `main`; commit `33c5869` removes `execution_models` and
  `headless_workers` from `docs/dev-agents/config.md`. Every other field stayed
  (`max_parallel_workers: 3`, `run_config: tracker`, `security_scan` gitleaks).
- Session: native subagent `general-purpose`, sonnet, effort medium, agent `af1fe4349a485e09c`
  (transcript model `claude-sonnet-5-5`), invocation `/wkc-setup`. Five turns. Driver answers:
  t2 "keep the GitHub tracker; this throwaway copy stays without a remote; skip label setup";
  t3 `1` (Section D); t4 `1` (Section F: default pair and default workers); t5 `1` (commit).
- Scored from `git` in the copy (`raw/setup11-diff.txt`, `raw/setup11-config-after.md`) and the
  tool-call extract `raw/setup11.calls.jsonl` on fixture branch `m2-evidence`.

PASS list: "the written config parses as case 10's template values".

- PyYAML parses `execution_models` as `claude-code`/`opus`/`medium` then `codex`/`gpt-6.1-sol`/`medium`
  and `headless_workers` as `[claude-code, codex, kiro-cli]`: PASS.
- Committed `d856583`: only those two keys added to the frontmatter, no duplicate keys, other values
  unchanged (`max_parallel_workers` still `3`), body byte-identical; `AGENTS.md` gained the reference
  line. Nothing pushed (no remote).

Borderline, for Review (not a PASS-list item): the session read `config.md` with `| head`, saw 10
lines, and reported `max_additional_tickets`, `max_parallel_workers`, `run_config`, and
`security_scan` missing. It asked Section D for two fields the config already had, and on the
answer `1` appended `max_additional_tickets: 5` and `max_parallel_workers: 5` (06:42:07Z), then
noticed the duplicate keys and the conflict with `3`, ran `git checkout docs/dev-agents/config.md`
(06:42:21Z), and told the person. Rule touched: SKILL.md section 1 "read the files, don't assume",
and section 3 "an existing config.md keeps the choices the project already made". The final file
keeps them. The Section F question offered the pair and `headless_workers` as one numbered option.
Evidence: `raw/setup11.calls.jsonl`.
