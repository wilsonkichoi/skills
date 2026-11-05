# Batch M2: manual calls, Claude cloud (2026-11-05)

Driver: this Claude cloud session (Opus, effort high). Candidate 0e649b2 (`skills/` tree aef787f).
Fixture: private `wilsonkichoi/wkc-yolo-fixture-m2-cloud-20261104`, main `98fc27b` at preflight,
then `23788cd` (tester PR #9: `bin/kv` was mode 100644, so `make test` failed on `main`) and
`41411fb` (tester merge of PR #13, implement 60 setup). GitHub only through the GitHub MCP tools;
git for clones, commits, and pushes.

| Case | Result | Sessions | Report |
|---|---|---|---|
| implement 42 | PARTIAL: arm A (open question, text says it comes from wkc-yolo, no `--run`) FAIL at medium, PASS on the effort-high rerun; arm B (SPEC-settled choice) PASS | 3 | `impl42.md` |
| implement 59 | SKIP: no MCP operation adds or reads a native blocked-by edge | 0 | `impl59.md` |
| implement 60 | PASS | 2 | `impl60.md` |
| implement 78 | PASS (arm 2 borderline: built on the open PR before the handoff); case 68 arm scored as a focused subcheck | 2 | `impl78.md` |
| code-review 67 | PASS | 1 | `cr67.md` |
| setup 11 | PASS (borderline: a truncated config read led to a reverted duplicate-key write) | 1 | `setup11.md` |
| setup 13 | PASS (direct part and project run) | 1 | `setup13.md` |

Sessions: 11 (1 preflight probe, 10 case sessions), all native `general-purpose` subagents, sonnet,
effort medium except the implement 42 rerun at effort high. Every transcript reports model
`claude-sonnet-5-5`. One at a time; none started a worker.

Evidence: reports here; tool-call extracts (`raw/<label>.calls.jsonl`), MCP scoring reads, and
setup notes on the fixture branch `m2-evidence`, `raw/`.

Limits of this batch:

- MCP transport: it does not test `github.py`, its digests, or its paging; sessions did the
  `wkc-tracker` verbs by hand with MCP tools. No native blocker read or write, no issue edit
  history read (implement 59 SKIP).
- Subagent route: installed-invocation coverage is not claimed (each session read `SKILL.md` by
  path). Sessions cannot start subagents; no M2 case needed one. Replies went by `SendMessage`;
  setup 11 and setup 13 started before the maintainer's relay sentence was added to the first
  prompt and still took each relayed reply as the person's; later sessions had the sentence and
  needed no reply.
- Fixture: driver tester fix PR #9 (mode bit) before the implement cases; recorded in
  `impl42.md` and the setup note.
- No real quota, rate-limit, or authentication error. One MCP `list_pull_requests` timeout on a
  driver scoring read, read again.
