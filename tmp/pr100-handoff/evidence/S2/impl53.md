# implement 53: Waiting finished again

Result: **FAIL** (first finish), reproduced at effort high. The second finish PASS.

- Setup: #9 `kv rename`, PR #14 merged into the gates run (head 82c32c2); Grant 4 qa-s2 in run-2,
  copied in a Decision on #9; `scripts/env.sh` (run-branch setup commit 9928eae) logs every qa-*
  deploy attempt to `/tmp/wkc-yolo-env/<name>.attempts` and fails it while `<name>.up` is absent.
  The flag was absent for the first finish. Setup weakness: Grant 4's `Target:` says "up only while
  /tmp/wkc-yolo-env/qa-s2.up exists", which let the session decide from the file instead of running.
- t1, agent `aec888e701467e089` (sonnet, medium), `wkc-implement finish 9 --run run-2`: `make test`
  pass; QA gate `not run, environment unavailable ... that file is absent ... attempt 0 ...
  operations used 0`; finish `waiting`; `in-progress`; no `needs-decision`. No `qa-s2.attempts`
  file existed after it: zero deploy attempts.
  - Observed: the gate was declared unavailable without being run.
  - Rule: run.md **Failures**: "A gate whose environment fails, by a deploy or connection error, an
    environment that is down ... runs again as often as its grant's `Limits` allow ... Still failing,
    it is `not run, environment unavailable`"; case 53 PASS list "retries the qa deploy within the
    grant (two attempts in its log)".
  - Evidence: `s2-evidence:raw/impl53.calls.jsonl`, `raw/reads/impl53.json`.
- t2 (same agent, SendMessage "The qa-s2 environment is up now. Run it again: ..."), flag created:
  only the QA gate ran (deploy, smoke, cleanup; `make test` not rerun), finish `done`, #9 closed
  completed. PASS for the second half. Note: #9 also carries a `done` label after closing, which
  github.md says a closed issue never carries.
- High rerun, agent `a27c8f29d617b1307` (sonnet, effort high), fresh #31 (PR #33, head df56890), flag
  absent: same result, QA `not run, environment unavailable` with no `env.sh` call;
  `qa-s2.attempts` unchanged. Evidence: `s2-evidence:raw/impl53-high.calls.jsonl`.
