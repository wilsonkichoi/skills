# Batch R2 evidence

Every result is labelled **subagent coordinator, workers unavailable**: after P5 (the nested
`claude -p` gets no GitHub MCP tools), the person chose native subagent coordinators for the
arms that need no worker (2026-11-05).

- `preflight.md`, `preflight-mcp.md`: preflight, P5 and P5b probes, and the MCP operation map.
- `Y27.md`: PASS.
- `Y31.md`: PARTIAL, no FAIL (parked, spent t1, change t1 PASS; ready, spent t2, change t2 SKIP).
- `Y23.md`: PARTIAL, no FAIL (t1 PASS; t2 to t8 SKIP).
- `setup/`: the packet preparer's seeding records (not model evidence).
- Raw: fixture branch `r2-evidence`, `raw/`. Coordinator turns are kept as `<label>.calls.md`
  (ordered tool calls with time, tool, key inputs, write bodies, plus the final message), not as raw
  transcripts, by the person's instruction and because the permission classifier refused copying
  a raw subagent transcript out.
