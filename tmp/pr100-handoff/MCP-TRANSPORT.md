# Cloud GitHub transport (R2, S2, M2)

R2, S2, and M2 run in Claude cloud sessions. Its GitHub proxy blocks GraphQL, so `github.py` reads and
`gh pr` and `gh issue` fail there. The maintainer chose (2026-11-04) that every session in these batches does
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

What this changes in the results: each batch tests the skills' workflow and judgment on Claude, with an
MCP transport. It does not test `github.py`, its digests, or its paging. Say so in the row.

## Operations the cases need

Each batch's preflight maps each row to an MCP tool name, or marks it missing.
Save the table, filled in, as `evidence/<batch>/preflight-mcp.md`. Rows a batch does not need may stay blank.

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
| Close a PR without merging | `gh pr close` | Y23 retirement (driver), M2 implement 59 (driver) |
| Read an issue's edit history (last editor) | `run show` editor check on GitHub | R2 every case, S2 implement 62 |
| Merge a PR into `main`, merge or squash | tester merges | M2 implement 59, 60 (driver) |
| Linear issues and comments | Linear backend | S2 implement 64, Linear arm only |

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

## S2 and M2 differences

- Test sessions are native subagents of the driver (`model: sonnet`, `effort: medium`), not
  `claude -p`, because a nested `claude -p` has no GitHub MCP tools in the cloud (R2, P5). A
  subagent has no Agent tool (R2, P5b), so a step a skill runs in its own session is not started.
- S2's GitHub fixture keeps run configs in a `command` store (`scripts/run-store.sh`), because
  without an edit-history read a GitHub tracker config cannot hold grants. See S2.md, Run configs.
- A raw subagent transcript carries the driver's context, and R2's push of one was refused. The
  batches push ordered tool-call extracts instead, to a private fixture branch.
