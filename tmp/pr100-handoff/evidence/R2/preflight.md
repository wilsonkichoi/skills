# R2 preflight

Driver: Claude cloud session (this session), 2026-11-05. Result: **blocked at P5**. No case ran.

- **P1 Packet: PASS.** Skills checkout on `test/pr100-r2-claude-cloud` at `ca04b9c`. HANDOFF.md read
  whole (606 lines), then R2.md and MCP-TRANSPORT.md.
- **P2 Fixture: PASS.** `$HOME/r2/coord` cloned; `main` is `9c91299018cb5091d6ebb21dc777a4bd2966f469`;
  `diff -r skills/<name> $HOME/r2/coord/.claude/skills/<name>` clean for all seven skills.
- **P3 Driver MCP: PASS with one missing operation.** Table in `preflight-mcp.md`. Login
  `wilsonkichoi`. #13 read with both comments (`Run: 15`, the `needs-decision`). PR #14 open, not
  draft, head `4bba7952512975dee2cca2770acd31a9adff5c4a`. #7's native blockers: **not readable**,
  no MCP tool returns blocked-by (`r2-evidence:raw/p3-issue-7-blockers.json`). Native blocker writes
  are missing too. Per MCP-TRANSPORT.md, an arm that needs either is SKIP with the operation named;
  this bears on Y31 spent (reads #7's blocker #9), not decided here because no case ran.
- **P4 Draft probe: PASS.** Branch `r2-probe` (`4f310e7`, one empty commit) pushed; PR #16 opened
  ready, converted to draft (read back `draft: true`), back to ready (`false`), closed unmerged
  (`state: closed`, `merged: false`). Branch left in place. `r2-evidence:raw/p4-draft-probe.json`.
- **P5 Nested coordinator probe: BLOCKED.** The launch line in R2.md (`setsid claude -p --model opus
  --effort high --dangerously-skip-permissions --settings '{"sandbox":{"enabled":false}}' ...`) was
  refused by the driver session's own Claude Code auto-mode permission classifier
  (`[Create Unsafe Agents]`) before the process started. No nested session ran, so no GitHub tool
  names, title, auth output, or `modelUsage` were recorded, and no session is counted.
  `r2-evidence:raw/p5-probe.denied.txt`. Every R2 case launches its coordinator with that same line,
  so no case can start until the person allows it.
- **P6 Environment: recorded.** `claude`, `make`, `sh`, `git` present; `gitleaks` installed with
  `go install ...gitleaks/v8@v8.21.2` after `apt-get` failed. `ANTHROPIC_BASE_URL` is set in this
  container (adapters.md's headless pre-launch check needs it unset; that would explain a refused
  headless worker, not change it). No settings file sets `sandbox.enabled`,
  `disableBypassPermissionsMode`, or `apiKeyHelper`. `r2-evidence:raw/p6-environment.txt`.

AI sessions used: 0.
