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
