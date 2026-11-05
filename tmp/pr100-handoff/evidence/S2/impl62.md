# implement 62: `Run PR:` after the run PR opens

Result: **SKIP**. The case needs `run show` on a `run_config: tracker` GitHub config to check that its
last editor is its `By:` login, and no GitHub MCP tool reads an issue's edit history (P3). No session
was started. Related coverage: the `command` store configs here had `Run PR:` set by `run edit`
(run-1) and builds and verifies read it (implement 84), but that is not this case's editor check.
