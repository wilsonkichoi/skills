# S2 evidence

Batch S2, Claude cloud, GitHub through MCP only. Candidate 0e649b2. See preflight.md, setup.md, one file per case.
Process evidence: tool-call extracts and MCP scoring reads on the local fixture's orphan branch
`s2-evidence` (`raw/<label>.calls.jsonl`, `raw/reads/`, `raw/setup/`).

## Results (2026-11-05)

| Case | Result | File |
|---|---|---|
| implement 35 | PASS | impl35.md |
| implement 36 | PASS | impl36.md |
| implement 52 | PASS | impl52.md |
| implement 53 | FAIL (first finish never attempted the QA deploy), reproduced at high; second finish PASS | impl53.md |
| implement 54 | PASS | impl54.md |
| implement 55 | PASS on the rerun with a corrected fixture | impl55.md |
| implement 56 | PASS | impl56.md |
| implement 57 | FAIL at medium (mismatched grant ran), PASS at high | impl57.md |
| implement 58 | SKIP (no native-dependency operation in MCP) | impl58.md |
| implement 62 | SKIP (no last-editor read in MCP) | impl62.md |
| implement 64 | FAIL at medium (tracker store granted), PASS at high; command arms PASS; Linear SKIP | impl64.md |
| implement 65 | PARTIAL (repeat finish posted no finish comment; dependent arms SKIP) | impl65.md |
| implement 70 | PASS | impl70.md |
| implement 83 | FAIL at medium (seen defect not recorded); high rerun found no item | impl83.md |
| implement 84 | PASS (arm 1 also ran a covered gate; arm 3 setup cannot isolate the non-writer rule) | impl84.md |
| code-review 62 | PASS | cr62.md |
| code-review 64 | PASS | cr64.md |
| code-review 65 | PASS, deviation: reused round 1 on the same sha | cr65.md |
| code-review 66 | PASS (arm 2 on a rerun with a corrected fixture) | cr66.md |

Sessions: 30 subagent launches (26 sonnet medium, 4 sonnet high reruns), 45 turns counting
SendMessage continuations; one launch stopped by the driver after reads only; two launches not scored
(driver fixture flaws). No quota, rate-limit, or authentication error. Installed-invocation coverage
is not claimed: each session hand-read the installed SKILL.md. Not tested: `github.py`, its digests,
paging, `verdicts`, and `run tickets` (sessions used MCP reads instead).

## Session ledger (copied into HANDOFF.md at the end)

- 2026-11-05, S2, P4 probe, subagent sonnet medium, probe (no skill), agent a3235b2755416b2bd, `s2-evidence:raw/p4-probe.calls.jsonl`
- 2026-11-05, S2, implement 35, subagent sonnet medium, `wkc-implement 1 --run run-1`, agent a4e7e9361b1336d71, `s2-evidence:raw/impl35.calls.jsonl`
- 2026-11-05, S2, implement 36, subagent sonnet medium, `wkc-implement 2 --run run-1` (three turns: park, non-writer Answer, writer Answer), agent a91f328020af5e77d, `s2-evidence:raw/impl36-t1t2t3.calls.jsonl`
- 2026-11-05, S2, implement 83, subagent sonnet medium, routed `wkc-implement 3 --run run-1`, agent a7aff74385999c6f5, `s2-evidence:raw/impl83-medium.calls.jsonl`
- 2026-11-05, S2, implement 83 rerun at effort high, subagent sonnet high, routed `wkc-implement 18 --run run-1`, agent acb8f780d7cfbb15f, `s2-evidence:raw/impl83-high.calls.jsonl`
- 2026-11-05, S2, implement 52, subagent sonnet medium, `wkc-implement finish 8 --run run-2 --authorized ...`, agent ac81e0e9af5a16163, `s2-evidence:raw/impl52.calls.jsonl`
- 2026-11-05, S2, implement 84, subagent sonnet medium, `wkc-implement verify 4 --run run-1` (three turns), agent a7edc9e64242a8e9c, `s2-evidence:raw/impl84-t1t2t3.calls.jsonl`
- 2026-11-05, S2, implement 53, subagent sonnet medium, `wkc-implement finish 9 --run run-2` (two turns), agent aec888e701467e089, `s2-evidence:raw/impl53.calls.jsonl`
- 2026-11-05, S2, implement 54, subagent sonnet medium, `wkc-implement finish 10 --run run-2`, agent a012c67af7c8159ba, `s2-evidence:raw/impl54.calls.jsonl`
- 2026-11-05, S2, implement 55 (fixture flaw, not scored), subagent sonnet medium, `wkc-implement finish 11 --run run-2`, agent a7c038937582434b0, `s2-evidence:raw/impl55-t1.calls.jsonl`
- 2026-11-05, S2, implement 56, subagent sonnet medium, `wkc-implement verify 12 --run run-2` (two turns), agent a292d3e825e00aa6e, `s2-evidence:raw/impl56-t1t2.calls.jsonl`
- 2026-11-05, S2, implement 55 rerun (fixed fixture), subagent sonnet medium, `wkc-implement finish 30 --run run-2`, agent a23f0c44482215670, `s2-evidence:raw/impl55-rerun.calls.jsonl`
- 2026-11-05, S2, implement 53 rerun at effort high, subagent sonnet high, `wkc-implement finish 31 --run run-2`, agent a27c8f29d617b1307, `s2-evidence:raw/impl53-high.calls.jsonl`
- 2026-11-05, S2, implement 57, subagent sonnet medium, `wkc-implement verify 21 --run run-3` (two turns), agent aa5b0f36c2c60b4b1, `s2-evidence:raw/impl57-t1t2.calls.jsonl`
- 2026-11-05, S2, implement 57 mismatch arm rerun at effort high, subagent sonnet high, `wkc-implement verify 21 --run run-3`, agent a783d4690f4336f6f, `s2-evidence:raw/impl57-high.calls.jsonl`
- 2026-11-05, S2, implement 65 arm A, subagent sonnet medium, `wkc-implement finish 25 --run run-4`, agent ae7c7f3c2244aafea, `s2-evidence:raw/impl65-A.calls.jsonl`
- 2026-11-05, S2, implement 65 arm B, subagent sonnet medium, `finish 26`, `finish 26` again, `verify 26` (`--run run-4`, three turns), agent a5d23afac60bb30c9, `s2-evidence:raw/impl65-B-t1t2t3.calls.jsonl`
- 2026-11-05, S2, implement 65 arm C, subagent sonnet medium, `finish 27` then `verify 27` (`--run run-4`, two turns), agent ae1533ef04c3e934c, `s2-evidence:raw/impl65-C-t1t2.calls.jsonl`
- 2026-11-05, S2, implement 64 arm A (tracker store, local), subagent sonnet medium, `wkc-implement finish 003 --run docs/dev-agents/issues/runs/run-s2-local64-20261105T0800.md`, agent ae2799cfdce8806da, `s2-evidence:raw/impl64-A.calls.jsonl`
- 2026-11-05, S2, implement 70, subagent sonnet medium, `wkc-implement 001` then `wkc-implement 002` (two turns), agent a8ce5ad03e473fce6, `s2-evidence:raw/impl70-arm1arm2.calls.jsonl`
- 2026-11-05, S2, implement 64 tracker arm rerun at effort high, subagent sonnet high, `wkc-implement finish 004 --run <tracker path>`, agent abc1906b47aa2aa7f, `s2-evidence:raw/impl64-A-high.calls.jsonl`
- 2026-11-05, S2, implement 64 command arms (tampered, then restored), subagent sonnet medium, `wkc-implement finish 005 --run run-5` (two turns), agent a5648bc2787e4d835, `s2-evidence:raw/impl64-BC.calls.jsonl`
- 2026-11-05, S2, code-review 66 arm 1, subagent sonnet medium, `wkc-code-review 42 --run run-1`, agent a0e7a03f5b5869868, `s2-evidence:raw/cr66-arm1.calls.jsonl`
- 2026-11-05, S2, code-review 66 arm 2 (fixture flaw, not scored), subagent sonnet medium, `wkc-code-review 43 --run run-1`, agent a53a75424957d136a, `s2-evidence:raw/cr66-arm2-flawed.calls.jsonl`
- 2026-11-05, S2, code-review 62, subagent sonnet medium, routed `Invocation: 7 --run run-1`, then manual `wkc-code-review 7` (two turns), agent a3869c9a6c56a4928, `s2-evidence:raw/cr62-t1t2.calls.jsonl`
- 2026-11-05, S2, code-review 64 arm 1 (launched before the push-URL setup, stopped by the driver after 4 reads, no writes), subagent sonnet medium, `wkc-code-review 16`, agent a1ee4562e047cf678, `s2-evidence:raw/cr64-aborted.calls.jsonl`
- 2026-11-05, S2, code-review 64 arm 1, subagent sonnet medium, `wkc-code-review 16` with the push URL broken, agent a588aced041636a4f, `s2-evidence:raw/cr64-arm1.calls.jsonl`
- 2026-11-05, S2, code-review 66 arm 2 rerun, subagent sonnet medium, `wkc-code-review 45 --run run-1`, agent a9ec01f2cee49bb91, `s2-evidence:raw/cr66-arm2-rerun.calls.jsonl`
- 2026-11-05, S2, code-review 64 arm 2, subagent sonnet medium, `wkc-code-review 47` with max_fix_attempts 0, agent abf1f71720d1009e5, `s2-evidence:raw/cr64-arm2.calls.jsonl`
- 2026-11-05, S2, code-review 65, subagent sonnet medium, `wkc-code-review 20` (three turns: open request, non-writer Answer, writer Answer), agent acd3d3711a22320be, `s2-evidence:raw/cr65-t1t2t3.calls.jsonl`
