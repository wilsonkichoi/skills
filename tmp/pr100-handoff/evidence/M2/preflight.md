# M2 preflight (2026-11-05)

Driver: Claude cloud session, Opus, effort high. Candidate 0e649b298b9790ac8db31a80f2652f7f63177c40.

- **P1 Packet.** PASS. Branch `test/pr100-m2-claude-cloud` at c0bc924; HANDOFF.md read whole
  (lines 1 to 607), M2.md, MCP-TRANSPORT.md.
- **P2 Fixture.** PASS. Cloned to `$HOME/m2/fixture`; `main` is `98fc27b`. `diff -r skills/<name>
  $HOME/m2/fixture/.claude/skills/<name>` is clean for wkc-yolo, wkc-implement, wkc-code-review,
  wkc-backlog, wkc-architect, wkc-plan, wkc-tracker, and wkc-setup. `git rev-parse HEAD:skills`
  equals `0e649b2:skills` (aef787f).
- **P3 MCP.** Done, see `preflight-mcp.md`. "Merge a PR" is present (`merge_pull_request`); "Add a
  native blocker" is missing, so implement 59 is SKIP. Also missing: read native blockers, read an
  issue's edit history. Collaborators: only `wilsonkichoi` (`admin`). The fixture had 0 issues;
  status labels `ready`, `in-review`, and `wkc-run` exist.
- **P4 Probe.** PASS. Native subagent `general-purpose`, model sonnet, effort medium, agent
  `ab68a2216d3b51bbb`; transcript model `claude-sonnet-5-5`. It listed the `mcp__github__*` tools
  and read 0 issues with `list_issues`. Extract: fixture branch `m2-evidence`, `raw/P4-probe.calls.jsonl`.
- **P5 Environment.** PASS after install. `make`, `sh`, `git`, `uv` present. `gitleaks` was missing;
  apt has no package, so `go install github.com/zricethezav/gitleaks/v8@v8.21.2`, linked at
  `/usr/local/bin/gitleaks`.
