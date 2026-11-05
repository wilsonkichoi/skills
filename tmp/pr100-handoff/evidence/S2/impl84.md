# implement 84: Covered gates at readiness

Result: **PASS**, with one deviation in arm 1 and a setup limit on the non-writer arm (below).

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
- Arm 3: `wchoi42` (no write access) posted a readiness record for H3 = a1d2f2e (PR #6 comment
  6652477692); the driver then pushed H3 (README-only). Same agent (SendMessage): all three gates ran
  at H3; the `make test` comment says the record "is from an account without write access, and bin/kv,
  a file of PR #5, changed after its merge, so it was not used". Setup limit: because PR #23 changed
  `bin/kv` after PR #5's merge, a writer's record at H3 would not have covered these gates either, so
  this arm shows the session refusing the non-writer record by its stated reason, not by an outcome
  only that rule produces.
- Evidence: `s2-evidence:raw/impl84-t1t2t3.calls.jsonl`, `raw/reads/impl84.json`, `raw/reads/asks-authors.json`.
