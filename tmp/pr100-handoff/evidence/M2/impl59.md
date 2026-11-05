# implement 59: Outside-run blocker on a run branch (M2, Claude cloud)

Result: **SKIP**, no session. The case needs ticket B natively blocked by ticket A. The GitHub MCP
tools have no operation to add a native issue dependency (blocked-by edge), and none to read one
(`preflight-mcp.md`, rows "Add a native blocker" and "Read an issue's native blockers"). M2.md P3
and the maintainer's instruction (2026-11-05) make the arm SKIP, naming the missing operation; the
edge is not staged as text. Missing operation: add (and read) a native blocked-by edge.
Nothing was staged for this case.
