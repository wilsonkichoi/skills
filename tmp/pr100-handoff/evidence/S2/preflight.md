# S2 preflight (2026-11-05)

Driver: Claude cloud session, Opus, effort high. Candidate 0e649b298b9790ac8db31a80f2652f7f63177c40.

- **P1 Packet.** PASS. On branch `test/pr100-s2-claude-cloud` at c0bc924. Read HANDOFF.md whole, S2.md, MCP-TRANSPORT.md.
- **P2 Fixtures.** PASS. Cloned under `/root/s2/`:
  - `wkc-yolo-fixture-s2-cloud-20261104` main `00a6b47` (matches).
  - `wkc-yolo-fixture-s2-local-cloud-20261104` main `82068a8` (matches).
  - `diff -r skills/<name> <clone>/.claude/skills/<name>` clean for all seven installed skills
    (wkc-architect, wkc-backlog, wkc-code-review, wkc-implement, wkc-plan, wkc-tracker, wkc-yolo) in both.
- **P3 MCP.** See `preflight-mcp.md`. No MCP tool reads an issue's edit history (last editor), so
  implement 62 is SKIP (missing operation: issue edit history / last editor). No native-blocker read
  or write. No Linear tool: `plugin:engineering:linear` needs OAuth and is not connected, so
  implement 64's Linear arm is SKIP.
- **P4 Probe.** PASS. One subagent (general-purpose, sonnet, medium), agent `a3235b2755416b2bd`.
  It listed the `mcp__github__*` tools, no Linear tool, and read issue #1 on the S2 GitHub fixture
  with `mcp__github__issue_read`: 404 Not Found (no issues yet). Extract:
  `s2-evidence:raw/p4-probe.calls.jsonl` on the local fixture.
- **P5 Environment.** `make`, `sh`, `git`, `sha256sum` present. `gitleaks` was missing; apt has no
  package, and a release-binary download was refused by this session's permission policy, so it was
  installed with `go install github.com/zricethezav/gitleaks/v8@v8.21.2` (`/root/go/bin/gitleaks`,
  linked from `/usr/local/bin/gitleaks`). Its `version` prints "version is set by build process".
