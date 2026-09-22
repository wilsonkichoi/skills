# Backend: Linear

Use the official Linear MCP server. Scope every call with `linear_team` from
`docs/dev-agents/config.md`, and with `linear_project` wherever the tool takes a project. Never
create, rename, or edit a team status; `setup` asks a person to.

## Statuses

| Status | Linear status | Category (`type`) |
|---|---|---|
| `backlog` | Backlog | `backlog` |
| `ready` | Todo | `unstarted` |
| `in-progress` | In Progress | `started` |
| `in-review` | In Review | `started` |
| `done` | Done | `completed` |
| `cancel` | Canceled | `canceled` |
| `duplicate` | Duplicate | `duplicate` |

Pass `state` as the name from this table, never a category or id. If a name is missing from the
team, stop and say to re-run `setup`; never substitute a similar status. Report an issue in any other
status by its Linear name. Linear issues cannot be `inconsistent`.

## Tools

| Job | Tool |
|---|---|
| Create or update | `save_issue`, with `id` to update |
| Read one issue | `get_issue`, with `includeRelations: true` when blockers matter |
| List issues | `list_issues` |
| Comment | `save_comment` with `issueId`; read back with `list_comments` |
| Team statuses | `list_issue_statuses` |
| Milestones | `list_milestones`; `milestone` on `save_issue` |

Relations are `save_issue` parameters: `blockedBy`, `blocks`, `relatedTo`, `duplicateOf`, and a
`remove*` form of each.

Read `warnings` in every `save_issue` result: a success can carry a refusal. Verify every write with
`get_issue`.

## Reading rules

- Always pass `state` to `list_issues`. For `list` with no status, read `list_issue_statuses` and make
  one call per status whose `type` is not `completed`, `canceled`, or `duplicate`.
- Follow `hasNextPage` to the end before reporting a list or an empty frontier.
- For `done`, `cancel`, and `duplicate`, pass `includeArchived: true`, request `archivedAt`, and mark
  archived results with the date. Leave it unset for open statuses and `next`. When `get_issue`
  returns an archived issue, say so and when.
- Compare a description by its sections and their content, never byte for byte.
- Confirm a specific issue with `get_issue`, never by its presence in a list.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with `state` and `project` |
| `show` | `get_issue` with `includeRelations: true`, plus `list_comments` |
| `comment` | `save_comment`, then find the exact body with `list_comments`. Before retrying, check whether the first attempt landed |
| `move` | `get_issue`, refuse a move out of Done, Canceled, or Duplicate, then `save_issue` with the status name, then `get_issue`. Moving to `backlog` or `ready` also sets `assignee: null` |

### next

1. `list_issues` with `state: 'Todo'` and `project`. An issue with an assignee is held.
2. For each unassigned issue, `get_issue` with `includeRelations: true`.
3. For each `blockedBy` entry, read its status. Done, Canceled, and Duplicate no longer block.
4. Keep issues with no open blocker, lowest number first.

Cache blocker statuses within the run, and on a large backlog say how many reads it took. For an
empty frontier, `get_issue` each open blocker for its assignee, and follow open `blockedBy` entries
for cycles. Never report an empty frontier after a failed step.

### create

Without the cycle walk:

```
save_issue { team, project, title, description, state: 'Backlog', blockedBy, milestone }
```

Check `warnings`, then `get_issue` with `includeRelations: true`: every `blockedBy` entry and every
section. Only then, if the requested status is not Backlog, `save_issue { id, state }` and read the
status back. A missing edge stops there, at Backlog.

### link

For `link <A> blocked-by <B>`, refuse a self-link before any call. Walk from B through `get_issue`
with `includeRelations: true`, following `blockedBy` entries not in Done, Canceled, or Duplicate. If
the walk reaches A, refuse and name the path. Linear accepts long cycles, and replaces an existing
reverse edge without warning.

Then `save_issue` A with `blockedBy: [B]`, and `get_issue` both. A must list B, and B's `blockedBy`
must be unchanged.

### assign

Bare form: one `save_issue` with `state: 'In Progress'` and `assignee: 'me'`. Explicit forms:
`assignee` alone, no `state`. `none` is `assignee: null`. Check `from <holder>` against the read.

Verify with `get_issue`:

- Bare form with a status other than In Progress: if you are still the assignee, set
  `assignee: null`, leave the status, and report.
- An assignee other than the one you set: another session won. Write nothing, report, and take
  another ticket.

### Milestones

A milestone is a project milestone in `linear_project`, never a cycle. To scope a list:

1. `list_milestones` with `linear_project`; match the name. No match is a stop that names the ones
   that exist.
2. `list_issues` with `project`, `state`, and `projectMilestone` in `fields`.
3. Keep the issues whose `projectMilestone` matches.

Never pass `milestone` to `list_issues`, and never use `list_projects` with `includeMilestones`.

### duplicate

Read the issue's relations first, and name the ones the move will clear. Then one call, with no
`state`:

```
save_issue { id: <id>, duplicateOf: <original> }
```
