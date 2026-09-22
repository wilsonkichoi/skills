# Backend: Linear

Use the official Linear MCP server. Scope every call with `linear_team` from
`docs/dev-agents/config.md`, and with `linear_project` wherever the tool takes a project.

Statuses belong to the team, not the project. Every project in a team shares one status list, so
changing a status for one project changes it for everyone on the team. That is why `setup` asks a
person to change statuses rather than doing it itself.

## Statuses

The seven statuses map onto Linear statuses by **exact name**:

| Status | Linear status | Category (`type`) |
|---|---|---|
| `backlog` | Backlog | `backlog` |
| `ready` | Todo | `unstarted` |
| `in-progress` | In Progress | `started` |
| `in-review` | In Review | `started` |
| `done` | Done | `completed` |
| `cancel` | Canceled | `canceled` |
| `duplicate` | Duplicate | `duplicate` |

A new Linear team has six of these by default. In Review is not a default, so a person usually adds
it before `setup` finishes.

**Operate by name.** `state` on `save_issue` and `list_issues` accepts a type, a name, or an id.
Always pass the name from this table. `in-progress` and `in-review` share the category `started`, so
only the name tells them apart. Names match case-insensitively. An unknown name fails with
`Could not find state "<name>"`.

`setup` checks the category once, to find statuses this table does not cover. At run time only
`list` with no status reads categories, to find the open statuses. Nothing writes by category.

If a status from this table is missing at run time, stop. Say the team's workflow no longer matches
the config and that `setup` should be re-run. Never fall back to the category, never pick a similar
status, and never create one.

A ticket in a status this table does not cover is reported by its Linear name, never folded into one
of the seven.

A Linear issue has exactly one status, so the `inconsistent` case in `SKILL.md` cannot happen here.

## Tools

There is no `create_issue` or `update_issue`.

| Job | Tool |
|---|---|
| Create or update an issue | `save_issue`, with `id` to update and without it to create |
| Read one issue | `get_issue`, with `includeRelations: true` when blockers matter |
| List issues | `list_issues` |
| Comment | `save_comment` with `issueId`; read back with `list_comments` |
| Team statuses | `list_issue_statuses`, in no meaningful order |
| Project milestones | `list_milestones`, and `milestone` on `save_issue` |

Relations are native `save_issue` parameters: `blockedBy`, `blocks`, `relatedTo`, `duplicateOf`,
and a `remove*` form of each.

**Read the `warnings` in every `save_issue` result.** Some refusals arrive as an ordinary success
with the reason in `warnings`, so a result without its warnings is not evidence of anything. And
because `save_issue` both creates and updates, only a separate `get_issue` shows what changed.

## Reading rules

- **Always pass an explicit `state` to `list_issues`.** An unfiltered call can omit issues that a
  filtered call returns. `list` with no status therefore reads `list_issue_statuses` and makes one
  call per team status whose `type` is not `completed`, `canceled`, or `duplicate`. That includes
  statuses the table above does not cover, so an issue in one is still listed, by its Linear name.
  Confirm a specific issue with `get_issue`, never by its presence in a list.
- **`list_issues` paginates.** A page with `hasNextPage: true` is incomplete. Follow the cursor to the
  end before reporting a list or an empty frontier.
- **`list_issues` skips archived issues by default.** Linear archives completed issues on its own
  after a period of inactivity, and a deleted issue is archived too. The tools cannot tell the two
  apart, so report "archived" with the date and do not guess which.
  - `list done`, `list cancel`, and `list duplicate` pass `includeArchived: true`, request
    `archivedAt` in `fields`, and mark each result that has one as archived.
  - The open statuses and `next` keep the default, so a deleted issue is never offered as work.
  - `get_issue` returns an archived issue in full. Say that it is archived and when.
- **The description does not round-trip.** Linear turns plain issue ids into rich links and adds
  blank lines around headings. Compare the sections and what is in them, never the bytes.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with `state` set to the status name and `project` set. For a milestone, see Milestones |
| `show` | `get_issue` with `includeRelations: true`, plus `list_comments` |
| `next` | See below |
| `create` | See below |
| `assign` | See below |
| `comment` | `save_comment`, then `list_comments` and find the exact body. Before retrying, check whether the first attempt landed |
| `move` | `get_issue`, refuse any move out of Done, Canceled, or Duplicate, then `save_issue` with the status name and `get_issue` to confirm. Moving to `backlog` or `ready` also sets `assignee: null`. Moving to `duplicate` has its own section below |
| `link` | See Links |

### next

`list_issues` cannot return relations, and a relation names its blocker without the blocker's
status. So the frontier takes several calls:

1. `list_issues` with `state: 'Todo'` and `project`, paged to the end. An issue with an assignee is
   held, reserved for that person, and needs no more reads.
2. For each unassigned issue, `get_issue` with `includeRelations: true`.
3. For each `blockedBy` entry, read that issue's status. A blocker in Done, Canceled, or Duplicate
   no longer blocks. Anything else does.
4. Keep the issues with no open blocker, lowest issue number first.

Cache blocker statuses within the run, because one blocker often holds up several issues. That is
one call per candidate plus one per distinct blocker, so on a large backlog, say how many reads it
took.

When step 4 keeps nothing, the reads above already name each held issue's assignee or open blockers
and each blocker's status. For each open blocker's assignee and for the cycle walk, `get_issue` it
with `includeRelations: true` and follow its own open `blockedBy`, using the cache.

Never report an empty frontier from a page that had more pages, or from a step that failed.

### create

Skip the cycle walk: nothing can be blocked by an issue that does not exist yet. Create at Backlog,
with the edges in the same call:

```
save_issue { team, project, title, description, state: 'Backlog', blockedBy, milestone }
```

Check `warnings`, then verify with `get_issue` and `includeRelations: true`: every `blockedBy` entry
and the description's sections. A relation Linear rejects comes back as a success with the reason
in `warnings`, so the issue exists without that edge. That is why the requested status waits for
this read. When every edge is there and the requested status is not Backlog, apply it with
`save_issue { id, state }` and read the status back.

### Links

For `link <A> blocked-by <B>`, refuse a self-link before calling anything. Then walk for a cycle:
`get_issue` B with `includeRelations: true`, then each of its `blockedBy` entries that is not Done,
Canceled, or Duplicate, and so on. If the walk reaches A, refuse and name the path.

Linear's own checks are not enough:

- **A reverse edge replaces the existing one, with no warning.** Linear keeps one relation per pair
  of issues. With B blocked by A, writing A blocked by B succeeds and leaves B blocked by nothing.
- **A longer cycle is accepted.**
- **A self-link is refused only in `warnings`.** The call still returns success.

Then `save_issue` A with `blockedBy: [B]`, and `get_issue` both issues with `includeRelations: true`.
A must list B. B's own `blockedBy` must be unchanged, which is the check that catches a reversed
edge.

### Assigning

The bare form is one call: `save_issue` with `state: 'In Progress'` and `assignee: 'me'`. The
explicit forms are the same call with `assignee` alone and no `state`. `assign <id> none` and moves
to `backlog` or `ready` use `assignee: null`.

A Linear issue has one assignee, not a list, so the tie-break in `SKILL.md` cannot fire. When two
sessions write at once, both succeed and the last write wins. The verification read replaces the
tie-break:

- On the bare form, a status other than In Progress means a person moved the issue while you were
  writing. If the assignee is still you, set `assignee: null`, leave the status, and report.
- The assignee must be whoever you set. A different name means another session won. Write nothing
  back, report it, and take another ticket.

This check is weaker than GitHub's. A write that lands between your write and your read is
invisible, and both sessions can report success. The branch and the open pull request are the real
collision signal.

`from <holder>` is checked against the read and never used to build the write, since there is only
one holder to replace.

### Milestones

A milestone is a **project milestone** in `linear_project`, not a cycle. A cycle is a time box; a
milestone names a body of work, the same as a GitHub milestone.

`save_issue` takes `milestone`. `list_issues` has no milestone filter, and passing one fails with
`Unrecognized key: "milestone"`. Scope a list in three steps:

1. `list_milestones` with `linear_project`, and match the name. It returns completed milestones too.
2. `list_issues` with `project`, the requested `state`, and `projectMilestone` in `fields`, paged to
   the end.
3. Keep the issues whose `projectMilestone` is the one from step 1.

A name that matches nothing in step 1 is a stop that names the milestones that do exist. Do not use
`list_projects` with `includeMilestones: true` instead, because it fails on a large workspace with
`query is too complex`.

### The duplicate transition

`move <id> duplicate <original>` is one call:

```
save_issue { id: <id>, duplicateOf: <original> }
```

Setting `duplicateOf` moves the status to Duplicate by itself. Do not pass `state`:

- Creating an issue in a duplicate state fails with `Cannot create an issue in a duplicate state.`
- Setting `state: 'Duplicate'` before the relation exists fails with
  `Issues can only be moved to a duplicate state when a duplicate issue relation exists.`

**The transition silently clears the issue's other relations**, such as `relatedTo`, with no error.
Read the relations before the move, and name the ones that will be lost before making it.
