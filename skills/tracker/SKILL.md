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

Read, write, then re-read. A zero exit code from `gh`, an MCP call, or a file write is not proof
the state changed, and several of these commands succeed while doing nothing.

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

There is no `blocked` status. Anything that blocks a ticket, whether that is other work or a
decision only a human can make, becomes its own ticket with a `link` edge pointing at it. A
decision ticket sits in `backlog`, unassigned, with the question in its body, and `list backlog` is
what shows a human what is waiting on them. The blocked ticket keeps its own status and drops off
the frontier on its own, because it now has an open blocker.

## 3. Verbs

| Verb | Semantics |
|---|---|
| `list [status] [milestone]` | Tickets with id, title, status, assignee, and blockers. Both arguments are optional filters, and an argument that is not one of the seven status names is a milestone. With no status, open tickets only. |
| `show <id>` | One ticket in full: body, comments, labels, blockers, assignee. |
| `next` | The frontier. See below. |
| `create <ticket> [status]` | One ticket from the shape in section 4, plus its dependency edges. The status is one of the four open ones and defaults to `backlog`. See below. |
| `claim <id>` | Take the ticket. See below. |
| `comment <id> <body>` | Append a comment. Never edit or delete an existing one. |
| `move <id> <status> [original]` | Transition, including the terminal close with its reason. See below. |
| `link <id> blocked-by <id>` | Record that the first ticket is blocked by the second. |

Ticket ids are compared numerically and written however the backend writes them. Accept `12`,
`012`, and `#12` as the same ticket.

**`next`** returns the frontier: every ticket that is `ready`, has no assignee, and has no open
blocker, lowest id first. When the frontier is empty, return nothing and say so. When the backend
cannot report blockers at all, stop with an error naming that. An empty frontier is never inferred
from a query that could not see the dependency edges, nor from a result that came back truncated.

**`create`** writes the ticket at `backlog` unless one of the four open statuses is given, then
writes one `link` edge per entry in its `## Blocked by` section, then moves it to the requested
status last. That order is the point: a ticket that reaches `ready` before its edges exist sits on
the frontier and gets claimed as though nothing blocked it. A failure partway leaves a real ticket
at `backlog` with some of its edges, so report the id, which edges landed, and that the status was
not applied.

**`claim`** is three steps and every one matters.

1. Read the ticket. Claim only when the status is exactly `ready` with no assignee. Anything else
   means someone got there first, so stop and report without writing anything. Do not skip this
   read: on GitHub, removing a label the ticket does not carry still succeeds, so a blind claim on
   an `in-review` ticket would quietly add `in-progress` beside it.
2. Assign self and move `ready` → `in-progress`.
3. Re-read. Expect exactly `in-progress` and exactly one assignee, you. More than one assignee
   means another session raced you, and the assignee whose login sorts first keeps the ticket. If
   that is not you, remove your own assignment, leave the status alone, and report. The tie-break
   is deterministic so that a race ends with one owner instead of none, and the status stays put
   because the winner really is working on it.

The tie-break does not care whether the other assignee is a session or a person: a human who
assigns themselves by hand and sorts first simply wins. Two sessions authenticated as the same
tracker user cannot be told apart at all, and there the branch and the open pull request are the
collision signal, which the skill doing the work owns.

**`move`** reads the current status first, because the write needs it and because nothing else
guards the terminal states. Refuse any move out of `done`, `cancel`, or `duplicate`.
`move <id> duplicate <original>` needs the id of the ticket it duplicates. `move <id> backlog`
clears every assignee, not only yours, which is what puts the ticket back in front of a human.

## 4. Ticket shape

The body `create` writes and `show` expects:

```markdown
## What to build
One to three sentences on what exists when this is done.

## Acceptance criteria
- [ ] Checkable, one per line.

## Blocked by
- #12
- #14

## Notes
Spec references, with the load-bearing excerpt inlined so nobody has to go fetch it.
```

This is loose on purpose. Other skills may add sections, and no verb rejects a ticket over
formatting. A human-written ticket that is one line long is valid input: `implement` drafts what it
needs and asks, which is that skill's problem and not a gate here.

## 5. Rules

- A closed ticket is done. `done` never means "merged soon".
- The tracker owns state. Never keep a parallel status file, no `PLAN.md` checkboxes, no
  `PROGRESS.md`.
- The product docs (`prd_file`, `spec_file`, `roadmap_file`) own intent. The tracker owns state
  only.

## 6. Report

Say what you read or changed, with the ticket URL for `github` and `linear` or the file path for
`local`. On a write that only half landed, say which half, and what state the ticket is in now. On
a read that came back truncated or inconsistent, say that instead of reporting a result.
