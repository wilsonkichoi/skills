# Backend: Linear

## Contents
- Statuses
- Tools
- Reading rules
- Per verb: next, create, edit, link, unlink, assign, milestones (ensure, close, list, show), duplicate
- Run configs

Use the official Linear MCP server. Scope every call with `linear_team` from
`docs/dev-agents/config.md`, and with `linear_project` wherever the tool takes a project. Never
create, rename, or edit a team status; `wkc-setup` asks a person to.

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
team, which shows as `Could not find state "<name>"`, stop and say to re-run `wkc-setup`; never
substitute a similar status. Report an issue in any other status by its Linear name. Linear issues cannot be `inconsistent`.

## Tools

| Job | Tool |
|---|---|
| Create or update | `save_issue`, with `id` to update |
| Read one issue | `get_issue`, with `includeRelations: true` when blockers matter |
| List issues | `list_issues` |
| Comment | `save_comment` with `issueId`; read back with `list_comments` |
| Team statuses | `list_issue_statuses` |
| Milestones | `list_milestones` and `get_milestone` to read; `save_milestone` with `project` and `name`, and no `id`, to create; `milestone` on `save_issue` |

A server that names these tools differently is fine: use the tool that does the job. When none
does, stop and say which job has no tool.

Relations are `save_issue` parameters. `blockedBy`, `blocks`, and `relatedTo` only add;
`removeBlockedBy`, `removeBlocks`, and `removeRelatedTo` remove; `duplicateOf` takes `null`.

Read `warnings` in every `save_issue` result: a success can carry a refusal. Verify every write with
`get_issue`.

## Reading rules

- Always pass `state` to `list_issues`. For `list` with no status, read `list_issue_statuses` and make
  one call per status whose `type` is not `completed`, `canceled`, or `duplicate`.
- Follow `hasNextPage` to the end before reporting a list or an empty frontier.
- For `done`, `cancel`, and `duplicate`, pass `includeArchived: true`, request `archivedAt`, and mark
  archived results with the date. Leave it unset for open statuses and `next`. When `get_issue`
  returns an archived issue, say so and when. Never say whether an archived issue was completed or
  deleted; the tools cannot tell.
- Compare a description by its sections and their content, never byte for byte. Linear turns bare
  issue ids into links and adds blank lines around headings; neither is a mismatch.
- Confirm a specific issue with `get_issue`, never by its presence in a list.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with `state` and `project` |
| `show` | `get_issue` with `includeRelations: true`, plus `list_comments`. Name the project milestone, and a duplicate's `duplicateOf` |
| `comment` | `save_comment`, then find the exact body with `list_comments`. Before retrying, check whether the first attempt landed |
| `move` | `get_issue`, refuse a move out of Done, Canceled, or Duplicate, then `save_issue` with the status name, then `get_issue`. Moving to `backlog` or `ready` also sets `assignee: null`. For `duplicate`, follow its own section below instead |

### next

1. `list_issues` with `state: 'Todo'` and `project`. An issue with an assignee is held and needs no more
   reads.
2. For each unassigned issue, `get_issue` with `includeRelations: true`.
3. For each `blockedBy` entry, read its status. Only Done meets it. For Duplicate, `get_issue` its
   `duplicateOf`, and that issue's when it is a Duplicate too; it is met only when the chain ends at
   Done. Canceled, any other status, a Duplicate with no `duplicateOf`, a read that fails, and a
   chain that comes back to an issue already in it are unmet.
4. Keep issues with every blocker met, lowest number first.

Setting `duplicateOf` moves the duplicate's relations onto the original (see below), so a dependent
usually ends up blocked by the original itself. The chain rule covers the edges that did not move.

Cache blocker statuses within the run, and on a large backlog say how many reads it took. For an
empty frontier, `get_issue` each unmet blocker for its assignee, and follow unmet `blockedBy` entries
for cycles. Never report an empty frontier after a failed step.

### create

Without the cycle walk:

```
save_issue { team, project, title, description, state: 'Backlog', blockedBy, milestone }
```

With a milestone, first find exactly one project milestone of that name with `list_milestones`;
otherwise write nothing. Check `warnings`, then `get_issue` with `includeRelations: true`: every
`blockedBy` entry, every section, the project, and exactly that project milestone, or none when none
was given. Report any edge that did not land, and a milestone that differs as a partial write.

### edit

`get_issue` with `includeRelations: true`, then one call:

```
save_issue { id, title, patch, milestone, blockedBy: <added>, removeBlockedBy: <removed> }
```

Pass only what changes. For each given section, a `patch` op: `replace` with `old_string` set to that
section exactly as `get_issue` returned it, over the span SKILL.md's `edit` defines, `###`
subsections included, or `append` for a section the issue lacks. One failed match aborts the whole
call. Resolve a milestone as `create` does.
`milestone none` is a stop: the tools cannot clear a milestone. An empty string changes nothing,
and `null` is read as a name. Done, Canceled, and Duplicate issues take the edit and keep their
status.

Verify with `get_issue`: title, sections as the reading rules compare them, `projectMilestone`,
`blockedBy` exactly the new set, and status and assignee unchanged.

### link

For `link <A> blocked-by <B>`, refuse a self-link before any call. Walk from B through `get_issue`
with `includeRelations: true`, following `blockedBy` entries not in Done or Canceled, and a
Duplicate's `duplicateOf`. If the walk reaches A, refuse and name the path. Linear accepts long
cycles, and replaces an existing reverse edge without warning.

Then `save_issue` A with `blockedBy: [B]`, and `get_issue` both. A must list B, and B's `blockedBy`
must be unchanged.

### unlink

`get_issue` A with `includeRelations: true`: B must be in its `blockedBy`. Otherwise write nothing:
`removeBlockedBy` with an edge that does not exist succeeds with no warning. Then
`save_issue { id: A, removeBlockedBy: [B] }`, and `get_issue` A: B is gone, every other blocker is
still there.

### assign

Bare form: one `save_issue` with `state: 'In Progress'` and `assignee: 'me'`. Explicit forms:
`assignee` alone, no `state`. `none` is `assignee: null`. Check `from <holder>` against the read.

Verify with `get_issue`:

- Bare form with a status other than In Progress: if you are still the assignee, set
  `assignee: null`, leave the status, and report.
- An assignee other than the one you set: another session won. Write nothing and report. Which
  ticket to take instead is the caller's choice.

An issue holds one assignee, so the `SKILL.md` tie-break never fires here.

### Milestones

A milestone is a project milestone in `linear_project`, never a cycle. To scope a list:

1. `list_milestones` with `linear_project`; match the name.
2. `list_issues` with `project`, `state`, and `projectMilestone` in `fields`.
3. Keep the issues whose `projectMilestone` matches.

Never pass `milestone` to `list_issues`, and never use `list_projects` with `includeMilestones`.

For the `milestone` verb, read `list_milestones` with `linear_project` first and compare names
exactly. One match needs no write; two are a stop that names both. Only on no match, create it:

```
save_milestone { project: <linear_project>, name: <name> }
```

Never pass `id`, which updates an existing milestone. Then read `list_milestones` again: exactly one
milestone has that name. If the server offers no tool that creates one, write nothing and ask the
person to add the milestone to the project in Linear.

`milestone close <name>` writes nothing: Linear project milestones have no open or closed state. Say
the backend has no milestone state. Never update, archive, or delete the milestone in its place.

`milestone list` is `list_milestones` with `linear_project`, following `hasNextPage`: report each
milestone's name and id. Linear project milestones have no open or closed state, so report none;
`progress` is Linear's own figure, not a ticket status. No milestones is an explicit empty result.

`milestone show <name>` matches the name exactly in `list_milestones`, or reads it with
`get_milestone`, then counts the project's issues in that milestone: `list_issues` with `project`
and `projectMilestone` in `fields`, once per team status from `list_issue_statuses`, terminal ones
included with `includeArchived: true`, following `hasNextPage`. Count each issue under its status
from the table above, and any issue in an unmapped status under its Linear name. A milestone with no
issues shows zero. If `list_milestones` is missing or fails, stop and say so; never report a
milestone, or zero tickets, from a read that did not run.

### duplicate

Setting `duplicateOf` moves the issue's `blockedBy`, `blocks`, and `relatedTo` relations onto the
original. It drops a relation to the original itself, and one to a ticket the original already has a
relation with. Nothing in the response says so.

Before the write, `get_issue` both issues with `includeRelations: true`. Name each relation that
will move and each that will be dropped, and say that every moved `blockedBy` entry now blocks the
original. Treat each `blockedBy` entry that will move as `link <original> blocked-by <it>`, and
each `blocks` entry that will move as `link <it> blocked-by <original>`, and run the `link` cycle
walk on each. A cycle refuses the move: write nothing and name the path. Then one call, with no
`state`:

```
save_issue { id: <id>, duplicateOf: <original> }
```

Verify with `get_issue` on both: the issue is Duplicate with `duplicateOf` set, and the original
carries every relation you said would move.

## Run configs

An issue with the label `wkc-run` is a run config, never a ticket. Drop it from every list, the
frontier, and milestone counts, and refuse a ticket verb on one.

`run create`: when the team lacks the `wkc-run` label, create it. Then `save_issue` in `linear_team`
with the title `Run config: <Run branch>`, the label, the text as its description, and no project,
milestone, or assignee. Its identifier is the reference.

`run show <id>`: `get_issue`. Refuse when it is missing or lacks the label. Compare the text by
meaning, as **Reading rules** says. The tools cannot show whether a description was edited, so an
edit goes undetected; `wkc-setup` says so when it asks for `run_config`.

`run close <id>`: move it to `Done`. It stays readable with `run show`.
