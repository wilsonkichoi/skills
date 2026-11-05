# R2 preflight

Driver: Claude cloud session (this session), 2026-11-05. Result: **blocked at P5** (nested coordinator has no GitHub MCP tools). No case ran.

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
- **P5 Nested coordinator probe: BLOCKED, the stop outcome.** First attempt: the driver session's
  own auto-mode permission classifier refused the R2.md launch line (`[Create Unsafe Agents]`)
  before any process started; no session. The person then chose to allow the launch (reply `1`),
  and the same line ran: session `f06fecae-6195-4b94-9eb0-f20aabe86d03`, `claude-opus-5-5`, exit 0.
  - GitHub MCP tool names: **none**. The nested session's init line lists only plugin MCP servers;
    `plugin:engineering:github` is `failed` ("Dynamic Client Registration rejected (HTTP 403) ...
    sessions are bound to their configured repositories"). The `github` server that serves this
    driver's `mcp__github__*` tools is not passed to a nested `claude -p`.
  - Issue #1 title: **not read**. The session cited the fixture `AGENTS.md` transport rule and did
    not fall back to `gh`, `curl`, or WebFetch.
  - `claude auth status --json`: `loggedIn: true`, `authMethod: oauth_token`, `apiProvider:
    firstParty`. adapters.md's headless pre-launch check wants `authMethod: claude.ai`.
  - Agent tool: says it can start an agent with `model: sonnet`; none started.
  - `modelUsage`: `claude-opus-5-5` only, 777 output tokens, $0.18.
  - Evidence: `r2-evidence:raw/p5-probe.jsonl`, `p5-probe.stderr`, `p5-probe.denied.txt`.

  R2.md: "No GitHub MCP tools in the nested session, or no title read: stop, blocked. That is the
  one outcome R2 cannot work around." Both conditions hold, so R2 stops here.
- **P6 Environment: recorded.** `claude`, `make`, `sh`, `git` present; `gitleaks` installed with
  `go install ...gitleaks/v8@v8.21.2` after `apt-get` failed. `ANTHROPIC_BASE_URL` is set in this
  container (adapters.md's headless pre-launch check needs it unset; that would explain a refused
  headless worker, not change it). No settings file sets `sandbox.enabled`,
  `disableBypassPermissionsMode`, or `apiKeyHelper`. `r2-evidence:raw/p6-environment.txt`.

AI sessions used: 1 (P5 probe).

## P5b: subagent coordinator probe (person's suggestion, 2026-11-05)

The person asked whether a subagent could take the coordinator's place. One read-only native agent
from this driver session, `general-purpose`, model `opus`, effort `high` (observed
`claude-opus-5-5`, `spawnDepth: 1`), agent `a026c58ec92d7f8c6`, same probe questions as P5.

- GitHub MCP tools: **yes**, the full `mcp__github__*` set as deferred tools. Read #1's title:
  "docs: usage page for kv help".
- Agent tool: **none**. It cannot start a worker. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`.
  It has `SendMessage`, so the driver can continue it for a later turn.
- So a subagent coordinator can do every GitHub step but cannot start workers through
  `adapters.md`: native start needs an Agent tool, and a headless `claude -p` worker has no GitHub
  MCP tools (P5) and fails the pre-launch check (`authMethod: oauth_token`, `ANTHROPIC_BASE_URL` set).
- Evidence: `r2-evidence:raw/p5b-subagent-probe.meta.json`, `p5b-subagent-probe.report.md`. The full
  transcript stays in the driver container: the permission classifier refused copying it out,
  because it carries the driver session's context.
