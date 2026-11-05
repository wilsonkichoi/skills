# implement 84: Covered gates at readiness

Result: pending the non-writer arm (see asks.md). Arms 1 and 2 below.

- Setup: #4 `kv del` done (PR #5, merge 71aac9a); gates `make test`, `sh tests/test_del.sh`,
  `sh scripts/del-gate.sh`. H1 = 1a102e7 (README-only). Run PR #6 with a writer readiness record for
  `make test` at H1 whose output names `ok tests/test_del.sh`.
- Arm 1, agent `a7edc9e64242a8e9c` (sonnet, medium), `wkc-implement verify 4 --run run-1` in
  `/root/s2/cloud-b`: `make test` and `sh tests/test_del.sh` posted `pass, covered by
  .../pull/6#issuecomment-6651668445`; `del-gate.sh` ran. Deviation: it also ran `sh tests/test_del.sh`
  directly and said so in the covered gate's result, although run.md **Verify** says a covered gate
  "is not run either".
- Tester merged PR #23 (changes `bin/kv`, a PR #5 file), H2 = 71e14b5, new writer readiness record.
- Arm 2, same agent (SendMessage): all three gates ran at H2, each naming why the record did not cover it. PASS.
- Evidence: `s2-evidence:raw/impl84-t1t2.calls.jsonl`, `raw/reads/impl84.json`.
