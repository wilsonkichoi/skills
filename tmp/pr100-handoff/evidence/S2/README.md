# S2 evidence

Batch S2, Claude cloud, GitHub through MCP only. Candidate 0e649b2. See preflight.md, setup.md, one file per case.
Process evidence: tool-call extracts and MCP scoring reads on the local fixture's orphan branch
`s2-evidence` (`raw/<label>.calls.jsonl`, `raw/reads/`, `raw/setup/`).

## Session ledger (copied into HANDOFF.md at the end)

- 2026-11-05, S2, P4 probe, subagent sonnet medium, probe (no skill), agent a3235b2755416b2bd, `s2-evidence:raw/p4-probe.calls.jsonl`
- 2026-11-05, S2, implement 35, subagent sonnet medium, `wkc-implement 1 --run run-1`, agent a4e7e9361b1336d71, `s2-evidence:raw/impl35.calls.jsonl`
- 2026-11-05, S2, implement 36 t1, subagent sonnet medium, `wkc-implement 2 --run run-1` (parked), agent a91f328020af5e77d, `s2-evidence:raw/impl36-t1.calls.jsonl`
- 2026-11-05, S2, implement 83, subagent sonnet medium, routed `wkc-implement 3 --run run-1`, agent a7aff74385999c6f5, `s2-evidence:raw/impl83-medium.calls.jsonl`
- 2026-11-05, S2, implement 83 rerun at effort high, subagent sonnet high, routed `wkc-implement 18 --run run-1`, agent acb8f780d7cfbb15f, `s2-evidence:raw/impl83-high.calls.jsonl`
- 2026-11-05, S2, implement 52, subagent sonnet medium, `wkc-implement finish 8 --run run-2 --authorized ...`, agent ac81e0e9af5a16163, `s2-evidence:raw/impl52.calls.jsonl`
- 2026-11-05, S2, implement 84 arms 1 and 2, subagent sonnet medium, `wkc-implement verify 4 --run run-1` (two turns), agent a7edc9e64242a8e9c, `s2-evidence:raw/impl84-t1t2.calls.jsonl`
- 2026-11-05, S2, implement 53, subagent sonnet medium, `wkc-implement finish 9 --run run-2` (two turns), agent aec888e701467e089, `s2-evidence:raw/impl53.calls.jsonl`
- 2026-11-05, S2, implement 54, subagent sonnet medium, `wkc-implement finish 10 --run run-2`, agent a012c67af7c8159ba, `s2-evidence:raw/impl54.calls.jsonl`
- 2026-11-05, S2, implement 55 (fixture flaw, not scored), subagent sonnet medium, `wkc-implement finish 11 --run run-2`, agent a7c038937582434b0, `s2-evidence:raw/impl55-t1.calls.jsonl`
- 2026-11-05, S2, implement 56, subagent sonnet medium, `wkc-implement verify 12 --run run-2` (two turns), agent a292d3e825e00aa6e, `s2-evidence:raw/impl56-t1t2.calls.jsonl`
- 2026-11-05, S2, implement 55 rerun (fixed fixture), subagent sonnet medium, `wkc-implement finish 30 --run run-2`, agent a23f0c44482215670, `s2-evidence:raw/impl55-rerun.calls.jsonl`
- 2026-11-05, S2, implement 53 rerun at effort high, subagent sonnet high, `wkc-implement finish 31 --run run-2`, agent a27c8f29d617b1307, `s2-evidence:raw/impl53-high.calls.jsonl`
