---
name: tracker
description: Read and write ticket state in this project's issue tracker, whether that is GitHub Issues, Linear, or local markdown files. Use it to list, show, create, claim, comment on, move, or link a ticket, and to ask what to work on next.
disable-model-invocation: true
metadata:
  allow_implicit_invocation: "false"
---

# Tracker

- **What it does:** reads and writes ticket state against the backend named by `issue_tracker` in
  `docs/dev-agents/config.md`: GitHub Issues, Linear, or local markdown files.
- **When to use it:** any time a skill or a person needs to see or change ticket state. Every other
  skill in this set goes through these verbs instead of touching the backend directly.
- **Dependencies:** `docs/dev-agents/config.md` with `issue_tracker` set, written by `setup`. For
  GitHub, an authenticated `gh` against a host that exposes native issue dependencies, tested with
  `gh` 2.97.0. For Linear, the Linear MCP server. For local, nothing.
- **How to call it:** Claude Code `/tracker <verb> [args]`, Codex `$tracker <verb> [args]`,
  Kiro CLI `/tracker <verb> [args]`.
- **Input:** one verb and its arguments.
- **Output:** the tickets asked for, or the changed ticket state plus its URL or file path.

Every mutating verb is read, write, verify. A zero exit code is not proof the state changed, and
several of these commands succeed while doing nothing.

## 1. Resolve the backend

Read `issue_tracker` from `docs/dev-agents/config.md`, then read exactly one sibling file, all the
way through, before running anything:

- `github` → [github.md](./github.md)
- `linear` → [linear.md](./linear.md)
- `local` → [local.md](./local.md)
- `other` → no sibling file. Follow the workflow the user wrote into the config body.

Never read more than one. Resolve `OWNER/REPO` once from the repository's configured remote and
pass it explicitly on every command; never let `gh` infer a different repository from the working
directory.

## 2. Statuses

Seven names. Every skill in this set speaks these, whatever the backend calls them underneath.

| Status | What it means | Who moves a ticket into it |
|---|---|---|
| `backlog` | Captured, not committed to. | a human, or any skill filing something for later |
| `ready` | Committed to and groomed. Safe to pick up. | `plan`, `create-ticket`, a human |
| `in-progress` | One session is implementing it. | `claim` |
| `in-review` | The work is up and waiting on review. | `implement`, once the pull request is open |
| `done` | Merged and verified. | `verify` |
| `cancel` | Deliberately not doing it. | a human, or a skill on instruction |
| `duplicate` | Another ticket already covers it. | whoever finds the duplicate |

Transitions between the four open states are any-to-any. There is no state machine here, so move a
ticket to where the work actually is and say what you moved. Do not refuse a move because it skips
a state.

The three terminal states are terminal. No verb moves a ticket out of one, and no verb reopens;
that is a human decision.

A ticket with no recorded status is `backlog`. That covers every human-created ticket and every
reopened one, so `list backlog` has to find them whether or not anyone labelled them.

A ticket the backend records as being in two statuses at once has **no** status. `list` and `next`
never return it as though it did, and never silently drop it either: they name it as inconsistent
alongside their results, and `move <id> <status>` is the repair. Each backend resolves status
through one shared test used by every verb, so `show`, `list`, and `next` cannot disagree about the
same ticket.

There is no `blocked` status. Anything that blocks a ticket, whether that is other work or a
decision only a human can make, becomes its own ticket with a `link` edge pointing at it. A
decision ticket sits in `backlog`, unassigned, with the question in its body, and `list backlog` is
what shows a human what is waiting on them. The blocked ticket keeps its own status and drops off
the frontier on its own, because it now has an open blocker. The **frontier** is the set of tickets
that could be started right now, and `next` is the verb that returns it.

## 3. Read, write, verify

`create`, `claim`, `comment`, `move`, and `link` all mutate, and all five run the same three steps.
`list`, `show`, and `next` read only and skip it.

1. **Read.** Fetch the current state and check the precondition this verb needs. A verb whose
   precondition fails writes nothing at all and says why.
2. **Write.** One command where possible, so there is no half-applied state to reason about.
3. **Verify.** A *separate* read, and this is the step that matters. Check the postcondition against
   what the backend now says, never against what the write returned. The write's own exit code, its
   printed URL, and its response body are all things that come back looking correct when nothing
   changed. Three `gh` commands in this skill do exactly that.

When verification fails, report the verb, the ticket, what you expected, what the backend actually
says, and what you did about it. A verb that cannot confirm its own write has failed, whatever its
exit code said.

| Verb | Precondition read | Verification read |
|---|---|---|
| `create` | none | the ticket exists by id, with the body and the status intended |
| `link` | both tickets exist | the edge appears on the blocked ticket's dependency list |
| `claim` | status is `ready`, no assignee | status is `in-progress` and the only assignee is you |
| `comment` | the ticket exists | the comment body is present on the ticket |
| `move` | current status, and it is not terminal | the new status is what the backend reports |

## 4. Verbs

| Verb | Semantics |
|---|---|
| `list [status] [milestone]` | Tickets with id, title, status, assignee, and blockers. Both arguments are optional filters, and an argument that is not one of the seven status names is a milestone. With no status, open tickets only. |
| `show <id>` | One ticket in full: body, comments, labels, blockers, assignee. |
| `next` | The frontier. See below. |
| `create <ticket> [status]` | One ticket from the shape in section 5, plus its dependency edges. The status is one of the four open ones and defaults to `backlog`. See below. |
| `claim <id>` | Take the ticket. See below. |
| `comment <id> <body>` | Append a comment. Never edit or delete an existing one. |
| `move <id> <status> [original]` | Transition, including the terminal close with its reason. See below. |
| `link <id> blocked-by <id>` | Record that the first ticket is blocked by the second. |

Ticket ids are compared numerically and written however the backend writes them. Accept `12`,
`012`, and `#12` as the same ticket.

A milestone argument that matches no milestone is a stop on every backend, never an empty list and
never the whole set unscoped. Resolve the name against the backend's own list of milestones before
querying with it: an answer shaped like a right one is the failure this rule exists to prevent.

**`next`** returns the frontier: every ticket that is `ready`, has no assignee, and has no open
blocker, lowest id first. When the frontier is empty, return nothing and say so. When the backend
cannot report blockers at all, stop with an error naming that. An empty frontier is never inferred
from a query that could not see the dependency edges, nor from a result that came back truncated,
nor from a read that is not the backend's authoritative one. A backend whose fast query lags behind
its own writes cannot answer this verb: a ticket made `ready` a second ago is exactly the ticket
`next` exists to return, so read the store that already knows about it.

**`create`** writes the ticket at `backlog` unless one of the four open statuses is given, then
writes one `link` edge per entry in its `## Blocked by` section, then moves it to the requested
status last. That order is the point: a ticket that reaches `ready` before its edges exist sits on
the frontier and gets claimed as though nothing blocked it. A failure partway leaves a real ticket
at `backlog` with some of its edges, so report the id, which edges landed, and that the status was
not applied.

**`claim`** runs section 3's three steps, and its own detail is what happens when they disagree.

Claim only from `ready` with no assignee. Anything else means someone got there first: stop and
write nothing.

On the verification read, any status other than `in-progress` means a human moved the ticket while
you were writing. Take back exactly what you wrote and report; the backend file gives the command.
More than one assignee means another session raced you, and the assignee whose login sorts first,
compared without regard to case, keeps the ticket. If that is not you, remove your own assignment,
leave the status alone, and report. On a backend with a single assignee field there is nothing to
compare: the read simply has to name you. The tie-break is deterministic so a race ends with one
owner instead of none, and the status stays put because the winner really is working on it.

The tie-break does not care whether the other assignee is a session or a person: a human who
assigns themselves by hand and sorts first simply wins. Two sessions authenticated as the same
tracker user cannot be told apart at all, and there the branch and the open pull request are the
collision signal, which the skill doing the work owns.

**`move`** reads the current status first, because the write needs it and because nothing else
guards the terminal states. Refuse any move out of `done`, `cancel`, or `duplicate`.
`move <id> duplicate <original>` needs the id of the ticket it duplicates. `move <id> backlog`
clears every assignee, not only yours, which is what puts the ticket back in front of a human.

## 5. Ticket shape

The body `create` writes and `show` expects:

```markdown
## What to build
One to three sentences on what exists when this is done.

## Acceptance criteria
- [ ] Checkable, one per line.

## Blocked by
- #12
- #14

## Related
- #31

## Notes
Spec references, with the load-bearing excerpt inlined so nobody has to go fetch it.
```

`## Blocked by` and `## Related` are not the same kind of thing. `create` turns every `## Blocked by`
entry into a real dependency edge, because `next` computes on it and a lossy copy would make the
frontier wrong. `## Related` is a reference for whoever reads the ticket: nothing parses it, no verb
writes it, and no query uses it. Write the ids plainly and let the backend render them.

This is loose on purpose. Other skills may add sections, and no verb rejects a ticket over
formatting. A human-written ticket that is one line long is valid input: `implement` drafts what it
needs and asks, which is that skill's problem and not a gate here.

## 6. Rules

- A closed ticket is done. `done` never means "merged soon".
- The tracker owns state. Never keep a parallel status file, no `PLAN.md` checkboxes, no
  `PROGRESS.md`.
- The product docs (`prd_file`, `spec_file`, `roadmap_file`) own intent. The tracker owns state
  only.

## 7. Report

Say what you read or changed, with the ticket URL for `github` and `linear` or the file path for
`local`. On a write that only half landed, say which half, and what state the ticket is in now. On
a read that came back truncated or inconsistent, say that instead of reporting a result.
