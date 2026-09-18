# Backend: Linear

The official Linear MCP server. Discover the exact tool names from the MCP tool list at runtime,
typically `list_issues`, `get_issue`, `create_issue`, `update_issue`, `create_comment`,
`list_comments`, and a tool that lists the team's workflow statuses. Do not call a name that is not
in the list. Scope every call with `linear_team` and `linear_project` from
`docs/dev-agents/config.md`.

## What has actually been tested

Nothing in this file has been run against a live Linear workspace. Be precise about what that means,
because the three sources here are not equally reliable:

| Part | Status |
|---|---|
| The two findings under "Three findings to respect" | Observed in a real dogfood run of the predecessor toolkit. Trust these. |
| `list_issues` pagination | Carried over from the same source by analogy, not observed here. |
| Everything else: tool names, state types, relation tools, project milestones, the verb mapping | **Written from the Linear API's documented shape and never executed.** Treat as a first draft. |

The first session on a real workspace is the validation, not a smoke test. Expect tool names to be
wrong and expect at least one mapping to need correcting, and report what you find rather than
working around it silently.

## Resolve the workflow states first

Do this once per session, before any other call. List the team's workflow statuses and map the
seven names onto them **by state type**, not by state name:

| Status | Linear state type | Usual name |
|---|---|---|
| `backlog` | `triage` and `backlog` | Triage, Backlog |
| `ready` | `unstarted` | Todo |
| `in-progress` | `started` | In Progress |
| `in-review` | `started` | In Review |
| `done` | `completed` | Done |
| `cancel` | `canceled` | Canceled |
| `duplicate` | `canceled`, the team's duplicate state if it has one | Duplicate |

Name matching is what breaks first. A team that renamed Done to `Released` or Todo to `Up next` is
normal, and reading by name would report those tickets as `backlog`. Read by type and keep the
resolved names for the rest of the session.

## Ambiguity is a hard stop

A write needs exactly one target state. When the type does not identify one, **stop and ask**. Do
not pick by position, by name similarity, or by which one looks likeliest. A status written to the
wrong state is invisible: the call succeeds, the ticket moves somewhere nobody is looking, and the
next `list` simply does not return it.

Resolve each write target by counting the states of its type:

- **Exactly one:** that is the mapping. Continue.
- **None:** stop. Name the status that cannot be mapped and the types the team does have.
- **More than one:** stop. List every candidate with its Linear name and type, and ask which one
  this status means.

`started` is the type that will actually hit this, because `in-progress` and `in-review` share it.
Two `started` states is the common shape and still needs confirming once, since nothing in the API
says which is which. Order in the workflow is a convention, not a guarantee, and a team with a third
`started` state such as QA makes position meaningless.

The answer is recorded in `docs/dev-agents/config.md`, not re-derived every session:

```yaml
linear_states:
  in-progress: 'In Progress'
  in-review: 'In Review'
  duplicate: 'Duplicate'
```

Only the statuses that were ambiguous need a line. On the next session, a state named there is used
directly and no question is asked. A name in that map that no longer exists in the team's workflow
is itself a hard stop: report it rather than falling back to type resolution, because a renamed
state is exactly the case where guessing goes wrong quietly.

Reads are different from writes. `backlog` deliberately reads from every `triage` and `backlog`
state at once, and that is a union, not an ambiguity. Ambiguity only blocks the verb that has to
choose one state to write.

`backlog` is the one status that reads as more than one state. A team with a triage inbox lands new
issues there, including the ones a human files by hand, so `list backlog` queries every state of
type `triage` and every state of type `backlog`. Reading only the `backlog`-type state hides exactly
the human-filed decision tickets that `list backlog` exists to surface. `create` still writes the
`backlog`-type state explicitly.

A state that resolves to none of the seven, a third `started` state named QA for instance, is not
folded into `backlog`. Report such a ticket by its Linear state name and type and leave it out of
the status filters. Folding it into `backlog` would make `show` call it `backlog` while
`list backlog` never returned it, which is the inconsistency this file exists to avoid.

Two cases need a human rather than a substitute, because workflow edits are a human decision:

- Only one state of type `started`: ask for an In Review state instead of picking one.
- No state of type `canceled` at all: stop. `cancel` and `duplicate` both have nowhere to go, and
  neither is a status to approximate. A team whose duplicate handling is only a `canceled` state
  plus a comment is a supported shape, recorded through `linear_states` above; a team with no
  `canceled` state is not.

## Milestones

A milestone in this skill's vocabulary is a **project milestone** inside the configured
`linear_project`, not a cycle. Cycles are time boxes that move on their own schedule; a milestone
here names a body of work and does not expire, which is the same thing GitHub milestones and the
`local` backend's `milestone` field mean.

`create` sets it, `list <milestone>` scopes by it. A name that matches no milestone in the project
is a stop, not a silent unscoped list: returning every ticket in the project when the caller asked
for a subset is the kind of wrong answer that looks like a right one.

If the MCP server exposes no way to read or set project milestones, say so once and carry on without
them. Unlike dependencies, nothing computes on a milestone, so losing it degrades the answer rather
than corrupting it.

## Dependencies

Dependencies are native "blocked by" issue relations. The official MCP server may expose no tool
that reads or writes them. Check the tool list at session start:

- No relation tool: `link` stops and reports that this workspace cannot record dependencies through
  MCP, and `next` stops with the same hard error the GitHub backend raises on a missing `blockedBy`.
  It does not fall back to a `Blocked by` line in the description, and it does not return a frontier
  it could not verify. `list`, `show`, `create`, `claim`, `comment`, and `move` still work, except
  that `move <id> duplicate <original>` cannot set the native duplicate relation either and falls
  back to the same comment naming the original.
- A relation tool is present: use it for `link`, for the edges `create` writes, and for the
  duplicate relation.

## Per verb

| Verb | Linear |
|---|---|
| `list` | `list_issues` with an explicit state filter, one call per state, scoped by milestone when one was given. `list backlog` covers every `triage` and `backlog` state, so it is one call per state and the results are merged |
| `show` | `get_issue`, plus `list_comments` |
| `next` | `list_issues` filtered to the resolved `ready` state and unassigned, then drop anything with an open "blocked by" relation, lowest issue number first |
| `create` | `create_issue` into the configured team and project at the resolved `backlog` state, then one relation per `## Blocked by` entry, then move it to the requested state |
| `claim` | `get_issue` and require the `ready` state with no assignee; `update_issue` setting assignee to self and state to `in-progress`; `get_issue` again and require that the assignee is you. See below |
| `comment` | `create_comment`, then `list_comments` and find the exact body |
| `move` | `get_issue` first and refuse any move out of `done`, `cancel`, or `duplicate`; otherwise `update_issue` with the exact resolved state name, then `get_issue` to confirm. Moving to `backlog` also clears the assignee; moving to `duplicate` sets the native duplicate relation to the original |
| `link` | A native "blocked by" issue relation, then re-read the relations and find the blocker |

Every mutating row ends in a read, and on this backend that read is not a formality. A status write
with a state name that is not exact returns success and changes nothing, so the verification read is
the only thing that distinguishes a write that landed from one that did not.

## Claiming, where Linear differs

A Linear issue has one assignee, not a list, so the "more than one assignee" race check in
`SKILL.md` can never fire here. Two sessions that write the field both succeed and the last write
wins. The check that replaces it: the re-read has to name **you**. A different name means you lost
the race, so leave the issue alone, report it, and take another ticket. Do not write anything back.

That check is weaker than the GitHub one, and honestly so. A write that lands between your write and
your re-read is invisible, and both sessions can report success with only one of them holding the
issue. It is the same class of blind spot as two sessions authenticated as the same user, and the
branch and the open pull request are the real collision signal.

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
