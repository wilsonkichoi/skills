# Backend: Linear

The official Linear MCP server. Scope every call with `linear_team` from
`docs/dev-agents/config.md`, and `linear_project` where the verb takes one.

**Statuses belong to the team, not the project.** `list_issue_statuses` takes a team, and every
project in that team shares one status list. Changing a status to suit one project changes it for
every other project and every human on the team, which is why `setup` asks a person to do it rather
than doing it itself.

## What has been tested

Verified 2026-09-18 against a live workspace, one team with seven statuses:

| Part | Status |
|---|---|
| Tool names, status shapes, relation shapes, milestones, filtering by name and by category | Read directly from a live server. Trust these. |
| The two findings under "Findings to respect" | Observed in a real dogfood run of the predecessor toolkit. |
| Every write path: `save_issue`, `save_comment`, claiming, the silent bad-state-name failure | **Not executed.** Read paths only were exercised. |

## Statuses

There is no per-workspace mapping and no config field for one. The seven statuses map onto seven
Linear statuses by **exact name**, and those names are Linear's own defaults, so most teams already
match without changing anything:

| Status | Linear status | Category (`type`) |
|---|---|---|
| `backlog` | Backlog | `backlog` |
| `ready` | Todo | `unstarted` |
| `in-progress` | In Progress | `started` |
| `in-review` | In Review | `started` |
| `done` | Done | `completed` |
| `cancel` | Canceled | `canceled` |
| `duplicate` | Duplicate | `duplicate` |

**Operate by name.** `state` on `save_issue` and `list_issues` accepts a type, a name, or an id.
Always pass the name from this table. It is exact, it is unambiguous, and it never needs a
tie-break: `in-progress` and `in-review` share the category `started`, so the category cannot tell
them apart and the name can.

**The category is for validation, not for operating.** `setup` checks it once, because the category
is the only way to notice a status this table does not cover. A team with a second `completed`
status has somewhere our single `done` cannot represent, and no comparison of names would reveal
it. Nothing at run time filters or writes by category.

If a status from this table is missing at run time, stop. Say the team's workflow no longer matches
the config and that `setup` should be re-run. Never fall back to the category, never pick a
same-category status by similarity, and never create a status: a status written to the wrong place
succeeds silently and the ticket lands where nobody is looking.

A status the table does not cover is reported by its Linear name, never folded into one of the
seven. `setup` warns about extras and records them in the config body, so a ticket parked in one is
visible as unmapped rather than silently absent.

## Tools

Real names, read from the server. There is no `create_issue` or `update_issue`.

| Job | Tool |
|---|---|
| Create or update an issue | `save_issue`, with `id` to update and without it to create |
| Read one issue | `get_issue`, with `includeRelations: true` when blockers matter |
| List issues | `list_issues` |
| Comment | `save_comment` with `issueId`, then `list_comments` to verify |
| Team statuses | `list_issue_statuses` |
| Project milestones | `list_milestones`, and `milestone` on `save_issue` |

`list_issue_statuses` returns statuses in no meaningful order. Do not read position as workflow
order.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with `state` set to the status name, plus `project` and `milestone` to scope |
| `show` | `get_issue` with `includeRelations: true`, plus `list_comments` |
| `next` | See below |
| `create` | `save_issue` with `team`, `title`, `description`, and `state: 'Backlog'`; then the blocker relations; then `save_issue` again to set the requested status |
| `claim` | See below |
| `comment` | `save_comment`, then `list_comments` and find the exact body |
| `move` | `get_issue` first and refuse any move out of `done`, `cancel`, or `duplicate`; otherwise `save_issue` with the exact status name, then `get_issue` to confirm. Moving to `backlog` also sets `assignee: null`; moving to `duplicate` sets `duplicateOf` |
| `link` | `save_issue` with `blockedBy`, then `get_issue` with `includeRelations: true` to confirm the edge |

`save_issue` creates and updates, so a verification read after a write is not optional here: the
same call shape does both, and its result is not evidence that the state changed.

Relations are native parameters on `save_issue`: `blockedBy`, `blocks`, `relatedTo`, `duplicateOf`,
and the `remove*` forms for each. There is no fallback to text in the description, and none is
needed.

## `next` costs more here than on GitHub

`list_issues` cannot return relations, and a relation carries only the blocker's id and title, not
its status. So the frontier is not one query:

1. `list_issues` with `state: 'Todo'` and `assignee: null`, scoped to the project.
2. For each result, `get_issue` with `includeRelations: true`.
3. For each `blockedBy` entry, read that issue's status. A blocker in `done`, `cancel`, or
   `duplicate` is satisfied; anything else still blocks.
4. Keep the issues with no unsatisfied blocker, lowest issue number first.

That is one call per candidate plus one per distinct blocker. Cache blocker statuses within the
run, since the same blocker often holds up several tickets. On a large backlog, say so in the
report rather than quietly taking a long time.

Never report an empty frontier from a page that came back full, and never from a step that failed.

## Claiming, where Linear differs

A Linear issue has one assignee, not a list, so the "more than one assignee" race check in
`SKILL.md` cannot fire here. Two sessions that write the field both succeed and the last write
wins. The check that replaces it: the verification read has to name **you**. A different name means
you lost, so leave the issue alone, report it, and take another ticket. Write nothing back.

That check is weaker than the GitHub one, and honestly so. A write landing between your write and
your read is invisible, and both sessions can report success while only one holds the issue. It is
the same blind spot as two sessions on one account, and the branch and the open pull request are
the real collision signal.

## Milestones

A milestone is a **project milestone** inside the configured `linear_project`, not a cycle. Cycles
are time boxes that move on their own schedule; a milestone names a body of work and does not
expire, which is what GitHub milestones and the `local` backend's `milestone` field also mean.

`save_issue` takes `milestone`, and `list_milestones` takes a project. A milestone name that
matches nothing in the project is a stop, not a silently unscoped list: returning every ticket in
the project when the caller asked for a subset is a wrong answer shaped like a right one.

## Findings to respect

Both came out of running the predecessor for real. Each costs one extra call and each caught a bug
that was otherwise invisible.

- **A status write with a name that is not exact fails silently.** The call returns success and the
  status does not change. Use only the names in the table above, and re-read after every
  transition, not just after `claim`.
- **An unfiltered `list_issues` can omit issues that a filtered call returns.** Always query with an
  explicit `state`, and confirm a specific issue with `get_issue` rather than by its presence in a
  list result.

`list_issues` also paginates. A full page is an incomplete answer, the same as hitting `--limit` on
GitHub: page through it with the returned cursor before reporting a list.
