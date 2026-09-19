# tracker

Read and write ticket state, against GitHub Issues, Linear, or markdown files in your own repository,
through one set of verbs that does not change when the backend does.

This is the explainer. [`SKILL.md`](./SKILL.md) is what the agent actually follows, and the three
backend files beside it hold the commands for one backend each.

## Why it exists

Every other skill in this set needs to ask what to work on and record what happened. Without one
place to do that, each of them grows its own idea of what "done" means, and the answer ends up
scattered across a `PLAN.md`, some checkboxes, and a tracker that disagrees with both.

So: the tracker owns **state**, your product docs own **intent**, and nothing keeps a second copy of
either.

## Setup

Run `setup` once. It writes `docs/dev-agents/config.md`, and the field that matters here is
`issue_tracker`, one of `github`, `linear`, `local`, or `other`. Everything below behaves the same
whichever you picked.

| Harness | How you call it |
|---|---|
| Claude Code | `/tracker list` |
| Codex | `$tracker list` |
| Kiro CLI | `/tracker list` |

Examples below use the Claude Code prefix. Substitute yours.

## The seven statuses

| Status | Means |
|---|---|
| `backlog` | Captured. Nobody has committed to it. |
| `ready` | Groomed and committed to. Safe to pick up. |
| `in-progress` | Someone is working on it now. |
| `in-review` | The work is up and waiting on review. |
| `done` | Merged and verified. |
| `cancel` | Deliberately not doing it. |
| `duplicate` | Another ticket already covers it. |

The four open states move any-to-any. Skipping one is allowed, because a ticket should say where the
work actually is rather than where a state machine thinks it should be.

The three terminal states are terminal. Nothing reopens a ticket automatically; that is a decision
you make yourself, in the tracker.

A ticket nobody has labelled reads as `backlog`. That is deliberate: it means an issue a colleague
filed by hand in the web UI is a real ticket immediately, with no import step.

## The eight verbs

```
tracker list [status] [milestone]
tracker show <id>
tracker next
tracker create <ticket> [status]
tracker assign <id> [who] [from <holder>]
tracker comment <id> <body>
tracker move <id> <status> [original]
tracker link <id> blocked-by <id>
```

**`list`** shows tickets with their id, title, status, assignee, and blockers. Both arguments are
optional filters. `list ready` narrows by status, `list "Milestone 2"` narrows by milestone, and
`list` on its own gives you every open ticket. A milestone name nothing matches stops and tells you
the ones that exist, rather than handing you an empty list that looks like a finished milestone.

**`show`** is one ticket in full: the body, its comments, its labels, who has it, and what is
blocking it.

**`next`** is the interesting one, and the reason the rest exists. See below.

**`create`** makes a ticket from the shape below. It lands in `backlog` unless you name one of the
four open statuses. If the body has a `## Blocked by` section, `create` writes those dependency
edges too, and it writes them *before* applying the status, so a new ticket never appears as
workable during the second it has no blockers recorded yet.

**`assign`** says who holds a ticket. Bare, `tracker assign 42`, it takes the ticket for you: it
requires `ready` with nobody on it, and sets the assignee and `in-progress` together. That is the
one form that changes status, because a ticket that is assigned but still `ready` belongs to nobody
and shows up in nobody's queue.

The other forms only move the name. `tracker assign 42 wilson` hands it over, `tracker assign 42
none` clears it, and taking a ticket away from whoever has it needs them named:
`tracker assign 42 me from alex`. That last one is deliberate. Picking up free work and taking work
out of someone's hands are different acts, and the second should have to be spelled out.

Handing a `ready` ticket to someone reserves it: it drops off the frontier, so nobody else picks it
up, and it waits for them. That is the one case where `ready` and an assignee go together on
purpose.

**`comment`** appends to a ticket. It never edits or deletes an existing comment.

**`move`** changes status, including closing. Moving to `backlog` or to `ready` also clears the
assignee, which is how you hand work back when you cannot finish it, or take it off someone who
did half of it. `ready` has to clear it: `next` looks for `ready` with nobody assigned, so a
`ready` ticket with a name still on it is invisible to the frontier and to that person both. Marking a duplicate takes the original's id:
`tracker move 42 duplicate 17`.

**`link`** records that one ticket is blocked by another: `tracker link 42 blocked-by 17`.

## `next`, and the frontier

`next` answers "what should I work on". It returns the **frontier**: every ticket that is `ready`,
has nobody assigned, and has no unfinished blocker, lowest id first.

That is the whole scheduling model. There is no priority field. Tickets are written in dependency
order, so their numbers already encode the order you meant, and a ticket becomes workable the moment
its last blocker closes, without anyone re-grooming the queue.

When the frontier is empty, `next` says so. What it will never do is report an empty frontier
because a query failed: if the backend cannot tell it what is blocking what, it stops with an error
instead. An empty answer and an unanswerable question look identical from the outside, and only one
of them means you have nothing to do.

The same care goes into which read it uses. GitHub has a fast search index and a primary store, and
the index runs seconds behind: the ticket you made `ready` a moment ago is exactly the one it has
not caught up with, and exactly the one you are asking for. `next` reads the store that already
knows, and sorts and filters locally, so asking straight after a write gives you the ticket rather
than an empty frontier.

## There is no `blocked` status

Because "blocked" is not a state of the work, it is a relationship between two tickets.

If something blocks a ticket, it becomes its own ticket, and you `link` them. That works whether the
blocker is more work or a decision only a person can make. A decision gets a ticket in `backlog`,
unassigned, with the question in the body, and `list backlog` is where someone finds it waiting for
them.

The blocked ticket keeps whatever status it had and simply drops off the frontier, because it now
has an open blocker. When the blocker closes, it reappears. Nobody has to remember to unblock it.

## Ticket shape

```markdown
## What to build
One to three sentences on what exists when this is done.

## Acceptance criteria
- [ ] Checkable, one per line.

## Blocked by
- #12

## Related
- #31

## Notes
Spec references, with the load-bearing excerpt inlined.
```

This is loose on purpose. Add sections if you want them. No verb rejects a ticket over formatting,
and a one-line ticket a teammate typed in a hurry is valid input.

`## Blocked by` and `## Related` look alike and are not. Blockers become real dependency edges,
because `next` computes on them and has to be right. Related is a note to a human: nothing reads it,
nothing acts on it, and it exists because tickets often touch each other without one waiting on the
other. On GitHub and Linear, writing the id there also makes each ticket show up in the other's
timeline, which is most of the value for none of the machinery.

## What each backend does underneath

| | GitHub | Linear | Local |
|---|---|---|---|
| Ticket | Issue | Issue | `NNN-slug.md` under `issues_dir` |
| Open statuses | Labels | Workflow states | `status` in frontmatter |
| Terminal statuses | Close reasons, not labels | Workflow states | `status` in frontmatter |
| Blockers | Native issue dependencies | "Blocked by" relations | `blocked_by` in frontmatter |
| Multiple sessions | Safe | Safe | **One session at a time** |

Two consequences worth knowing:

On GitHub a closed issue carries no status label, because its close reason already records whether
it was completed, not planned, or a duplicate. Two sources of truth for one fact will eventually
disagree, so there is only one.

The `local` backend edits files and never commits them. Your changes land with whatever commit you
make next, alongside the work they describe. It also means an assignment made on a branch is invisible
from `main` until you merge, which is why it is single-session: use `github` or `linear` if two
people or two agents share the repository.

## Why writes take an extra step

Every verb that changes something reads first, writes, then reads again to confirm, and that last
read is a fresh query rather than a look at what the write returned.

That is not caution for its own sake. Three of the commands underneath report success while doing
nothing at all: removing a label a ticket does not have, closing an issue that is already closed,
and setting a Linear status by a name that is slightly wrong. All three exit cleanly. The
verification read is the only thing that tells them apart from a write that worked.

If a verb cannot confirm its own change, it tells you what it expected, what the backend actually
says, and what it did about it.

## Things it will not do

- Reopen a terminal ticket. Terminal is terminal.
- Guess. If two sessions race for the same free ticket, or a Linear workflow has two states it
  could plausibly mean, it stops and says so instead of picking.
- Keep a second copy of status anywhere. No `PLAN.md` checkboxes, no `PROGRESS.md`.
- Commit anything, on any backend.
