# S2 MCP transport table (2026-11-05)

| Operation | MCP tool |
|---|---|
| Current login | `mcp__github__get_me` (wilsonkichoi) |
| Read an issue: title, body, labels, state, close reason, milestone, assignees | `mcp__github__issue_read` method `get` |
| Read every comment on an issue or PR, with author, time, and URL, complete | `mcp__github__issue_read` method `get_comments` (paged, `perPage` up to 100); PR conversation comments also `mcp__github__pull_request_read` method `get_comments` |
| List issues, open and closed, with milestone | `mcp__github__list_issues` (both states by default; its `fields` has no milestone, so milestone comes from `issue_read get`) |
| Read an issue's native blockers | missing (only sub-issues: `issue_read get_sub_issues`) |
| Collaborator permission of a login | `mcp__github__list_repository_collaborators` (gives `role_name`; only wilsonkichoi, admin) |
| Edit an issue body, then read it back | `mcp__github__issue_write` method `update`, then `issue_read get` |
| Add and remove labels | `mcp__github__issue_write` method `update` with the whole `labels` list |
| Comment on an issue or PR | `mcp__github__add_issue_comment` |
| Close an issue as completed or not planned | `mcp__github__issue_write` `state: closed`, `state_reason` |
| Create an issue in a milestone | `mcp__github__issue_write` method `create` with `milestone` |
| Add a native blocker | missing |
| Read a PR: state, draft flag, head sha, base, mergeable, body | `mcp__github__pull_request_read` method `get` |
| List PRs by head or base branch | `mcp__github__list_pull_requests` (`head`, `base`, `state`) |
| Create a PR, draft or ready | `mcp__github__create_pull_request` (`draft`) |
| Edit a PR body | `mcp__github__update_pull_request` |
| Convert a PR to draft, and back to ready | `mcp__github__update_pull_request` `draft` (not needed by S2) |
| Merge a PR with a merge commit | `mcp__github__merge_pull_request` `merge_method: merge` |
| Close a PR without merging | `mcp__github__update_pull_request` `state: closed` |
| Read an issue's edit history (last editor) | missing: implement 62 SKIP |
| Merge a PR into `main`, merge or squash | `mcp__github__merge_pull_request` (not needed by S2) |
| Linear issues and comments | missing: no Linear connector (OAuth not authorized); implement 64 Linear arm SKIP |

Not tested by S2: `github.py`, its digests, paging, `author_can_write` computation, and `verdicts`/`run tickets` scripts. The sessions compute those with MCP reads.
