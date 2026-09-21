# Backend: Linear

The official Linear MCP server. Scope every call with `linear_team` from
`docs/dev-agents/config.md`, and `linear_project` where the verb takes one.

**Statuses belong to the team, not the project.** `list_issue_statuses` takes a team, and every
project in that team shares one status list. Changing a status to suit one project changes it for
every other project and every human on the team, which is why `setup` asks a person to do it rather
than doing it itself.

## What has been tested

Verified 2026-09-18 against two live workspaces: one established team with seven statuses, and one
freshly created sandbox team. Read and write paths were both executed.

| Part | Status |
|---|---|
| Tool names, status and relation shapes, milestones, filtering by name and by category | Read from a live server. |
| `save_issue` create and update, status writes, assignment, relations, the duplicate transition | Executed against the sandbox. Findings below. |
| `save_comment` and `list_comments` | **Not executed.** |
| Two sessions racing the bare `assign` | **Not executed.** Needs two identities. |

## Statuses

There is no per-workspace mapping and no config field for one. The seven statuses map onto seven
Linear statuses by **exact name**:

| Status | Linear status | Category (`type`) |
|---|---|---|
| `backlog` | Backlog | `backlog` |
| `ready` | Todo | `unstarted` |
| `in-progress` | In Progress | `started` |
| `in-review` | In Review | `started` |
| `done` | Done | `completed` |
| `cancel` | Canceled | `canceled` |
| `duplicate` | Duplicate | `duplicate` |

**A new Linear team does not have all seven.** Six of these names are Linear's own defaults, and
**In Review** is not one of them: a team created from the default template has six statuses and no
In Review, verified on a team created the same day. So the missing-status stop below is the ordinary
first run, not an edge case. Expect most adopters to add In Review by hand before `setup` will write
the Linear config.

**Operate by name.** `state` on `save_issue` and `list_issues` accepts a type, a name, or an id.
Always pass the name from this table. It is unambiguous, and it never needs a tie-break:
`in-progress` and `in-review` share the category `started`, so the category cannot tell them apart
and the name can.

Name matching is case-insensitive: `in progress` resolves to `In Progress`. A name that matches
nothing is a loud error, `Could not find state "<name>"`, not a silent no-op.

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
| `list` | `list_issues` with `state` set to the status name and `project` to scope. A milestone is not an argument to this tool, so scoping to one is the procedure under Milestones below. A terminal status needs `includeArchived: true`, under Archived issues below |
| `show` | `get_issue` with `includeRelations: true`, plus `list_comments` |
| `next` | See below |
| `create` | One `save_issue` with `team`, `title`, `description`, `state`, and `blockedBy`. Relations apply on create here, unlike GitHub, so the edges and the status land together |
| `assign` | See below |
| `comment` | `save_comment`, then `list_comments` and find the exact body |
| `move` | `get_issue` first and refuse any move out of `done`, `cancel`, or `duplicate`; otherwise `save_issue` with the status name, then `get_issue` to confirm. Moving to `backlog` or to `ready` also sets `assignee: null`. Moving to `duplicate` is its own shape, above |
| `link` | The cycle check under Links below, then `save_issue` with `blockedBy`, then `get_issue` with `includeRelations: true` on both issues to confirm the edge and that the blocker's own `blockedBy` did not change |

`create` needs no second call to apply the requested status. GitHub's create-link-then-label order
exists because a GitHub edge is a separate API call that can fail after the label lands; here both
go in one request, so a ticket never sits on the frontier without its edges.

`save_issue` creates and updates, so a verification read after a write is not optional here: the
same call shape does both, and its result is not evidence that the state changed.

Relations are native parameters on `save_issue`: `blockedBy`, `blocks`, `relatedTo`, `duplicateOf`,
and the `remove*` forms for each. There is no fallback to text in the description, and none is
needed.

## `next` costs more here than on GitHub

`list_issues` cannot return relations, and a relation carries only the blocker's id and title, not
its status. So the frontier is not one query:

1. `list_issues` with `state: 'Todo'`, scoped to the project. An issue with an assignee is held,
   reserved for that person, and needs no further reads.
2. For each unassigned result, `get_issue` with `includeRelations: true`.
3. For each `blockedBy` entry, read that issue's status. A blocker in `done`, `cancel`, or
   `duplicate` is satisfied; anything else still blocks.
4. Keep the issues with no unsatisfied blocker, lowest issue number first.

When step 4 keeps nothing, the reads above already hold most of the explanation: each held issue,
its assignee or its open blockers, and each blocker's status. For the blocker's assignee and for
the cycle walk, `get_issue` each open blocker with `includeRelations: true` and follow its own open
`blockedBy`, reusing the cache.

That is one call per candidate plus one per distinct blocker. Cache blocker statuses within the
run, since the same blocker often holds up several tickets. On a large backlog, say so in the
report rather than quietly taking a long time.

Never report an empty frontier from a page that came back full, and never from a step that failed.

## Links

Check for a cycle before writing `link <A> blocked-by <B>`. `get_issue` B with
`includeRelations: true`, then each of its `blockedBy` entries that is not in a terminal status,
and so on. If the walk reaches A, refuse and name the path.

Linear will not do this for you, measured 2026-09-21 on team `c-leg`:

- **A two-issue cycle silently reverses the existing edge.** With CLE-5 blocked by CLE-4,
  `save_issue` on CLE-4 with `blockedBy: ["CLE-5"]` returned success with no warning. Afterwards
  CLE-4 was blocked by CLE-5, and CLE-5 was blocked by nothing. Linear keeps one relation per pair
  of issues, so the new edge replaced the old one instead of joining it. That is why the
  verification reads the blocker too.
- **A longer cycle is accepted.** CLE-5 → CLE-6 → CLE-4 → CLE-5 was written and read back intact.
- **A self-link is refused only in `warnings`.** The response is an ordinary success carrying
  `Could not add CLE-6 to blockedBy: Argument Validation Error - relatedIssueId cannot have the same value as issueId.`
  Refuse it before the call, and never read a `save_issue` result without its `warnings`.

## Assigning, where Linear differs

The bare form is one call, verified: `save_issue` with `state: 'In Progress'` and `assignee: 'me'`
sets both. `assignee: null` clears it, which is what `move <id> backlog` and `move <id> ready` use.
The explicit forms are the same call with the assignee alone and no `state`.

A Linear issue has one assignee, not a list, so the tie-break in `SKILL.md` cannot fire here at all.
Two sessions that write the field both succeed and the last write wins. The check that replaces it:
the verification read has to name **whoever you set**. A different name means you lost, so leave the
issue alone, report it, and take another ticket. Write nothing back.

That check is weaker than the GitHub one, and honestly so. A write landing between your write and
your read is invisible, and both sessions can report success while only one holds the issue. It is
the same blind spot as two sessions on one account, and the branch and the open pull request are
the real collision signal.

The single field also makes the explicit forms cheaper than GitHub's: there is no set of holders to
subtract, so `from <holder>` is purely the confirmation that the caller knows who is being
displaced, checked against the read and never used to build the write.

## Milestones

A milestone is a **project milestone** inside the configured `linear_project`, not a cycle. Cycles
are time boxes that move on their own schedule; a milestone names a body of work and does not
expire, which is what GitHub milestones and the `local` backend's `milestone` field also mean.

`save_issue` takes `milestone`, so writing one is direct. **Reading one is not: `list_issues` has
no milestone filter.** Its `projectMilestone` is a field you ask for in the result, not an argument
you scope by, and passing `milestone` to it is rejected with `Unrecognized key: "milestone"`.
Scoping a list to a milestone is three steps:

1. `list_milestones` with the configured `linear_project`, and match the requested name against
   what comes back.
2. `list_issues` with `project` and the requested `state`, with `projectMilestone` named in
   `fields`, paged to the end.
3. Keep the issues whose `projectMilestone` is the one resolved in step 1.

`list_milestones` takes only a project and has no state or archived filter, and it needs none for a
completed milestone: one whose sole issue was moved to `done` came back from the next call with
`progress: 100`, so finishing the work does not hide the milestone from the resolver. This is the
opposite of GitHub, where the endpoint drops closed milestones unless the call asks for them. A
milestone inside an archived project has not been measured.

A milestone name that matches nothing in step 1 is a stop that names the milestones that do exist.
It is never a silently unscoped list: returning every ticket in the project when the caller asked
for a subset is a wrong answer shaped like a right one. It is never an empty list either, since
that reads as a real milestone nobody has filed against.

`list_projects` with `includeMilestones: true` is not a shortcut around step 1. On a real workspace
it failed with `query is too complex, Complexity: 15879, Maximum allowed: 10000`, and the
complexity is the workspace's size rather than anything the caller passed.

## Archived issues

`list_issues` takes `includeArchived` and **defaults it to `false`**, and an archived issue is
still a real issue with a real status. On a team whose only `done` ticket was archived, the
default read returned `{"issues":[],"hasNextPage":false}`: an empty page that reports itself as
complete and is indistinguishable from a team that has closed nothing.

So the three terminal statuses read differently from the four open ones:

- `list done`, `list cancel`, and `list duplicate` pass `includeArchived: true`, ask for
  `archivedAt` in `fields`, and mark every result that has one as archived. A closed ticket is a
  record of work, and omitting it silently is the worse answer.
- The four open statuses and `next` keep the default. A frontier that offers a ticket somebody
  deleted is worse than one that comes back short, and a deleted ticket is archived too.
- `show` works on an archived issue: `get_issue` returns it in full, comments included. Say that it
  is archived and when, because a verb that writes to it is working on something nobody can see.

Two things arrive at `archivedAt`, and this server tells them apart nowhere. Linear archives
completed issues on its own after a period of inactivity, and a user deleting an issue soft-deletes
it into Recently deleted with the same field set. No tool here returns a `trashed` flag, and
`get_team` returns no auto-archive period, so the report says archived and dated and does not
guess which one happened.

## The duplicate transition is destructive

**Marking an issue as a duplicate silently clears its other relations.** Reproduced twice: an issue
holding `relatedTo` came back with `relatedTo: []` after the duplicate transition, with no error and
no mention of it in the response.

Read the relations before the move, and report what was lost. If those edges matter, say so before
doing it rather than after.

`move <id> duplicate <original>` is one call, and not the call you would guess:

```
save_issue { id: <id>, duplicateOf: <original> }
```

Setting `duplicateOf` moves the status to Duplicate on its own. Do not pass `state` as well. Two
things fail if you try:

- Creating an issue directly in a duplicate state is rejected: `Cannot create an issue in a
  duplicate state.`
- Setting `state: 'Duplicate'` before the relation exists is rejected: `Issues can only be moved to
  a duplicate state when a duplicate issue relation exists.`

This is the reverse of GitHub, where the close carries the reason and the duplicate reference
together.

## Findings to respect

- **An unfiltered `list_issues` can omit issues that a filtered call returns.** From a real dogfood
  run of the predecessor. Always query with an explicit `state`, and confirm a specific issue with
  `get_issue` rather than by its presence in a list result.
- **`list_issues` paginates.** A full page is an incomplete answer, the same as hitting `--limit` on
  GitHub: page through it with the returned cursor before reporting a list.
- **The body does not round-trip.** Linear rewrites a plain `WKC-5` in a `## Blocked by` section
  into a rich issue link, and inserts blank lines around headings. A 228-byte ticket body came back
  as 487 bytes with every section, its code fence, and its non-ASCII text intact. The frontmatter
  equivalent here is the relation, which is what every verb reads, so this costs nothing. Do not
  compare a description you sent against the one that comes back and call the difference a failure.
  Compare the sections and what is inside them.

The predecessor also recorded that a status write with an inexact name fails silently. **That did
not reproduce.** This server errors loudly on an unknown name and matches case-insensitively. The
verification read stays mandatory anyway, because the duplicate transition above loses data without
saying so, which is the same class of failure arriving through a different door.
