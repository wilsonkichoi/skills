# M2 preflight: MCP operation map

Read 2026-11-05 in the M2 driver session (GitHub MCP server `github`, login `wilsonkichoi`).

| Operation | Skill source | MCP tool, or missing |
|---|---|---|
| Current login | `gh api user`; the `By:` check | `get_me` |
| Read an issue: title, body, labels, state, close reason, milestone, assignees | `wkc-tracker show` | `issue_read` method `get` (labels also `get_labels`) |
| Read every comment on an issue or PR, with author, time, and URL, complete | `show`, `run tickets`, `verdicts` | `issue_read` `get_comments` (paged); PR conversation comments `pull_request_read` `get_comments` |
| List issues, open and closed, with milestone | `list`, `run tickets` | `list_issues` (cursor paging; milestone not in its `fields` list, read per issue with `issue_read`) |
| Read an issue's native blockers | `show` blockers | missing (no blocked-by read; only sub-issue hierarchy) |
| Collaborator permission of a login | writer checks | `list_repository_collaborators` (gives `role_name`) |
| Edit an issue body, then read it back | `run edit`, `edit` | `issue_write` `update` + `issue_read` `get` |
| Add and remove labels | `move` | `issue_write` `update` with `labels` (replaces the set) |
| Comment on an issue or PR | `comment`, records | `add_issue_comment` |
| Close an issue as completed or not planned | `run close`, `move cancel` | `issue_write` `update` `state`/`state_reason` |
| Create an issue in a milestone | `create` (backlog publish) | `issue_write` `create` with `milestone` |
| Add a native blocker | `link` | missing (`sub_issue_write` is hierarchy, not blocked-by) |
| Read a PR: state, draft flag, head sha, base, mergeable, body | `gh pr view` | `pull_request_read` `get` |
| List PRs by head or base branch | PR lookup | `list_pull_requests` (`head`, `base`, `state`) |
| Create a PR, draft or ready | `gh pr create` | `create_pull_request` (`draft`) |
| Edit a PR body | `gh pr edit` | `update_pull_request` `body` |
| Convert a PR to draft, and back to ready | `gh pr ready --undo`, `gh pr ready` | `update_pull_request` `draft` (not needed by M2, not exercised) |
| Merge a PR with a merge commit | `gh pr merge` | `merge_pull_request` `merge_method: merge` |
| Close a PR without merging | `gh pr close` | `update_pull_request` `state: closed` |
| Read an issue's edit history (last editor) | `run show` editor check on GitHub | missing |
| Merge a PR into `main`, merge or squash | tester merges | `merge_pull_request` (`merge` or `squash`) |
| Linear issues and comments | Linear backend | not needed by M2 |

Consequence (M2.md P3): implement 59 needs "Add a native blocker" and "Merge a PR". "Add a native
blocker" is missing, so **implement 59 is SKIP** (missing operation: add a native blocked-by edge;
also no read of native blockers).
