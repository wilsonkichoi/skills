# R2 GitHub transport

R2 runs in a Claude cloud session. Its GitHub proxy blocks GraphQL, so `github.py` reads and
`gh pr` and `gh issue` fail there. The maintainer chose (2026-11-04) that every session in R2 does
every GitHub read and write through the GitHub MCP tools, and only through them. The `wkc-*` skills
are the workflow reference: what to read and write, in what order, and which checks and
confirmations come first. They are not the transport.

- No `github.py`, no `gh` commands, and no REST or GraphQL calls of your own, for the driver, the
  coordinator, or any worker.
- `git` stays for local work: clone, commit, branch, worktree, and branch push to `origin`. A push
  is git, not a GitHub API call. The proxy refuses branch deletion and tag pushes; that is fine.
- A step the MCP tools cannot do is not done another way. It is reported as blocked, and the case
  arm that needs it is SKIP with the missing operation named.
- The fixture's `AGENTS.md` carries the same rule for the coordinator and workers, because they
  never read this packet.

What this changes in the results: R2 tests the skills' workflow and judgment on Claude, with an
MCP transport. It does not test `github.py`, its digests, or its paging. Say so in the row.

## Operations the cases need

The preflight (R2.md, step P3 and P4) maps each row to an MCP tool name, or marks it missing.
Save the table, filled in, as `evidence/R2/preflight-mcp.md`.

| Operation | Skill source | Needed by |
|---|---|---|
| Current login | `gh api user`; the `By:` check | Y27, every run config write |
| Read an issue: title, body, labels, state, close reason, milestone, assignees | `wkc-tracker show` | every case |
| Read every comment on an issue or PR, with author, time, and URL, complete | `show`, `run tickets`, `verdicts` | every case |
| List issues, open and closed, with milestone | `list`, `run tickets` | every case |
| Read an issue's native blockers | `show` blockers | Y31 spent |
| Collaborator permission of a login | writer checks | every case (fixture `AGENTS.md` states the answer if missing) |
| Edit an issue body, then read it back | `run edit`, `edit` | Y23, Y31 |
| Add and remove labels | `move` | Y23, Y31 ready |
| Comment on an issue or PR | `comment`, records | every case |
| Close an issue as completed or not planned | `run close`, `move cancel` | Y23 |
| Create an issue in a milestone | `create` (backlog publish) | Y23 |
| Add a native blocker | `link` | Y23, Y31 spent, if a worker files one |
| Read a PR: state, draft flag, head sha, base, mergeable, body | `gh pr view` | Y23, Y31 ready |
| List PRs by head or base branch | PR lookup | every case |
| Create a PR, draft or ready | `gh pr create` | Y23, Y31 ready |
| Edit a PR body | `gh pr edit` | Y23 |
| Convert a PR to draft, and back to ready | `gh pr ready --undo`, `gh pr ready` | Y23 (its first step) |
| Merge a PR with a merge commit | `gh pr merge` | Y23 (held, see below) |
| Close a PR without merging | `gh pr close` | Y23 retirement (driver) |

Known risk: GitHub exposes draft conversion only through GraphQL. If the MCP tools cannot convert
a PR to draft, Y23 cannot start, because its first required step is "draft first". Then Y23 is SKIP
for that reason, and R2 still runs Y27 and Y31.

Merge hold: the fixture has `allow_merge_commit` off from setup (squash and rebase on), as R's
hold had it. A merge-commit merge fails, so a reviewed Y23 correction ticket stays unfinished for
the round check. The driver never changes repository settings.

## Scoring reads

The runbook says to score from `github.py show` and `gh pr view`. In R2 the driver uses the MCP
reads above instead. For each check, save the MCP result as JSON under `raw/`, with the issue or
PR number and the time read. A run config "no change" check compares the body text read before
and after, by `sha256sum` of the text, as `text_sha256` would.
