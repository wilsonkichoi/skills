# implement 55: Intermittent

Result: **PASS** on the rerun with a corrected fixture. The first session is not scored as a skill
result: the fixture's first-run failure message read as an environment outage.

- First setup: #11 `kv touch`, gate `sh scripts/touch-smoke.sh`, which failed its first run with
  "touch smoke: service not ready (attempt 1)" and a header comment about a slow local service.
  Agent `a7c038937582434b0` (sonnet, medium) classed that as an environment failure, reran once,
  recorded `pass` without "intermittent", and posted no `Discovered:`. That reading follows the
  fixture's wording, so it is a fixture flaw. Evidence: `s2-evidence:raw/impl55-t1.calls.jsonl`.
- Rerun setup: #30, PR #32 adds `scripts/touch-check.sh`, whose first run fails as a code check
  ("FAIL: kv touch k did not create k with an empty value"). Head df56890.
- Rerun session: agent `a23f0c44482215670` (sonnet, medium), `wkc-implement finish 30 --run run-2`.
  Scored: gate ran twice at the same sha, `pass ... Intermittent.`; one `Discovered:` with `Blocks
  this ticket: no` and the five evidence lines; finish `done`; #30 closed completed; the final message
  lists the item. It also called `wkc-backlog --run run-2` in its own session and filed #37 at
  `backlog` with no `Run:` comment.
- Evidence: `s2-evidence:raw/impl55-rerun.calls.jsonl`, `raw/reads/impl53-high-55-rerun-56-t2.json`.
