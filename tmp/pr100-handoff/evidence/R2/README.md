# Batch R2 evidence

Every result is labelled **subagent coordinator, workers unavailable**: after P5 (the nested
`claude -p` gets no GitHub MCP tools), the person chose native subagent coordinators for the
arms that need no worker (2026-11-05).

- `preflight.md`, `preflight-mcp.md`: preflight, P5 and P5b probes, and the MCP operation map.
- `Y27.md`: PASS.
- `Y31.md`: PARTIAL, no FAIL. Parked, spent t1 and t2, and change t1 and t2 PASS (t2s in the relay retry); unchanged-ready SKIP.
- `Y23.md`: FAIL. t1 PASS in both attempts; the retry's t2 changed #15's text with a `Changes:` entry for a covered correction; t3 to t8 SKIP.
- `setup/`: the packet preparer's seeding records (not model evidence).
- Raw: fixture branch `r2-evidence`, `raw/`. Coordinator turns are kept as `<label>.calls.md`
  (ordered tool calls with time, tool, key inputs, write bodies, plus the final message), not as raw
  transcripts, by the person's instruction and because the permission classifier refused copying
  a raw subagent transcript out.
