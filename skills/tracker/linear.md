# Backend: Linear

The official Linear MCP server. Discover the exact tool names from the MCP tool list at runtime,
typically `list_issues`, `get_issue`, `create_issue`, `update_issue`, `create_comment`,
`list_comments`. Do not call a name that is not in the list. Scope every call with `linear_team`
and `linear_project` from `docs/dev-agents/config.md`.

## Status mapping

| Status | Linear workflow state |
|---|---|
| `backlog` | `Backlog` |
| `ready` | `Todo` |
| `in-progress` | `In Progress` |
| `in-review` | `In Review` |
| `done` | `Done` |
| `cancel` | `Canceled` |
| `duplicate` | The team's duplicate state, plus Linear's native duplicate relation pointing at the original |

A team with no `In Review` state needs one. Workflow edits are a human decision, so ask rather than
picking a substitute. A team with no duplicate state falls back to `Canceled` plus a comment naming
the original ticket, and the report says that is what happened.

Read status back from the issue's workflow state. An issue whose state is not in the table reads as
`backlog`.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with an explicit state filter, one call per status |
| `show` | `get_issue`, plus `list_comments` |
| `next` | `list_issues` filtered to `Todo`, unassigned, then drop anything with an open "blocked by" relation, lowest issue number first |
| `create` | `create_issue` into the configured team and project, then one "blocked by" relation per `## Blocked by` entry |
| `claim` | `update_issue` setting assignee to self and state to `In Progress`, then `get_issue` to confirm |
| `comment` | `create_comment` |
| `move` | `update_issue` with the exact state name from the table, then `get_issue` to confirm. Moving to `backlog` also clears the assignee |
| `link` | A native "blocked by" issue relation |

Dependencies are native "blocked by" relations. If the MCP server exposes no way to read them,
`next` stops and reports that, the same as on GitHub. It does not fall back to text in the
description.

## Two findings from running this for real

Keep both. They cost one extra call each and they caught bugs that were otherwise invisible.

- **A status write with a state name that is not exact fails silently.** The call returns success
  and the state does not change. Use only the exact names in the table above, and re-read the issue
  after every transition, not just after `claim`.
- **An unfiltered `list_issues` can omit issues that a filtered call returns.** Always query with an
  explicit state filter, and confirm a specific issue with `get_issue` rather than by its presence
  in a list result.
