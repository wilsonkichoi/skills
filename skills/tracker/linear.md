# Backend: Linear

The official Linear MCP server. Discover the exact tool names from the MCP tool list at runtime,
typically `list_issues`, `get_issue`, `create_issue`, `update_issue`, `create_comment`,
`list_comments`, and a tool that lists the team's workflow statuses. Do not call a name that is not
in the list. Scope every call with `linear_team` and `linear_project` from
`docs/dev-agents/config.md`.

This backend has not been run end to end. Treat the first session on a new workspace as the
validation, and report anything that does not match what is written here.

## Resolve the workflow states first

Do this once per session, before any other call. List the team's workflow statuses and map the
seven names onto them **by state type**, not by state name:

| Status | Linear state type | Usual name |
|---|---|---|
| `backlog` | `backlog` | Backlog |
| `ready` | `unstarted` | Todo |
| `in-progress` | `started` | In Progress |
| `in-review` | `started`, the one after In Progress | In Review |
| `done` | `completed` | Done |
| `cancel` | `canceled` | Canceled |
| `duplicate` | `canceled`, the team's duplicate state if it has one | Duplicate |

Name matching is what breaks first. A team that renamed Done to `Released` or Todo to `Up next` is
normal, and reading by name would report those tickets as `backlog`. Read by type and keep the
resolved names for the rest of the session.

Two cases need a human rather than a substitute, because workflow edits are a human decision:

- No state of type `started` beyond In Progress: ask for an In Review state instead of picking one.
- No duplicate state: fall back to the `canceled` state plus a comment naming the original, and say
  in the report that is what happened.

A state that resolves to none of the seven reads as `backlog`.

## Dependencies

Dependencies are native "blocked by" issue relations. The official MCP server may expose no tool
that reads or writes them. Check the tool list at session start:

- No relation tool: `link` stops and reports that this workspace cannot record dependencies through
  MCP, and `next` stops with the same hard error the GitHub backend raises on a missing `blockedBy`.
  It does not fall back to a `Blocked by` line in the description, and it does not return a frontier
  it could not verify. `list`, `show`, `create`, `claim`, `comment`, and `move` still work.
- A relation tool is present: use it for `link`, and for the edges `create` writes.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with an explicit state filter, one call per status |
| `show` | `get_issue`, plus `list_comments` |
| `next` | `list_issues` filtered to the resolved `ready` state and unassigned, then drop anything with an open "blocked by" relation, lowest issue number first |
| `create` | `create_issue` into the configured team and project at the resolved `backlog` state, then one relation per `## Blocked by` entry, then move it to the requested state |
| `claim` | `get_issue` and require the `ready` state with no assignee; `update_issue` setting assignee to self and state to `in-progress`; `get_issue` again to confirm |
| `comment` | `create_comment` |
| `move` | `get_issue` first and refuse any move out of `done`, `cancel`, or `duplicate`; otherwise `update_issue` with the exact resolved state name, then `get_issue` to confirm. Moving to `backlog` also clears the assignee; moving to `duplicate` sets the native duplicate relation to the original |
| `link` | A native "blocked by" issue relation |

`create_issue` lands in the team's default state when no state is given, and on many teams that is
Triage rather than Backlog. Always pass the resolved `backlog` state explicitly.

## Three findings to respect

The first two came out of running this for real. Both cost one extra call and both caught bugs that
were otherwise invisible.

- **A status write with a state name that is not exact fails silently.** The call returns success
  and the state does not change. Use only the names resolved at session start, and re-read the
  issue after every transition, not just after `claim`.
- **An unfiltered `list_issues` can omit issues that a filtered call returns.** Always query with an
  explicit state filter, and confirm a specific issue with `get_issue` rather than by its presence
  in a list result.
- **`list_issues` paginates.** A full page of results is an incomplete answer, the same as hitting
  `--limit` on GitHub. Page through it before reporting a list, and never report an empty frontier
  from a page that came back full.
