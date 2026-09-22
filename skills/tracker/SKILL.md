---
name: tracker
description: Read and write ticket state in this project's issue tracker, whether that is GitHub Issues, Linear, or local markdown files. Use it to list, show, create, assign, comment on, move, or link a ticket, and to ask what to work on next.
disable-model-invocation: true
metadata:
  allow_implicit_invocation: "false"
---

# Tracker

- **What it does:** reads and writes ticket state against the backend named by `issue_tracker` in
  `docs/dev-agents/config.md`: GitHub Issues, Linear, or local markdown files.
- **When to use it:** any time a skill or a person needs to see or change ticket state. Every other
  skill in this set goes through these verbs instead of touching the backend directly.
- **Dependencies:** `docs/dev-agents/config.md` with `issue_tracker` set, written by `setup`.
  For GitHub, an authenticated `gh` against a host with native issue dependencies. For Linear, the
  Linear MCP server. For local, nothing.
- **How to call it:** Claude Code `/tracker <verb> [args]`, Codex `$tracker <verb> [args]`,
  Kiro CLI `/tracker <verb> [args]`.
- **Input:** one verb and its arguments.
- **Output:** the tickets asked for, or the changed ticket state plus its URL or file path.

## 1. Resolve the backend

Read `issue_tracker` from `docs/dev-agents/config.md`, then read exactly one backend file, all the
way through, before running anything:

- `github` → [github.md](./github.md)
- `linear` → [linear.md](./linear.md)
- `local` → [local.md](./local.md)
- `other` → no backend file. Follow the workflow the user wrote into the config body.

Stop when the config cannot name a backend: the file does not exist, it has no `issue_tracker`
field, or the value is not one of the four above. Write nothing, create no file or directory, and
read no backend file. Say which of the three it was, and ask the user to run `setup` first:
Claude Code `/setup`, Codex `$setup`, Kiro CLI `/setup`. Never use another tool's config or ticket
format instead, even when one is in the repository. No verb here can see a ticket written there.

## 2. Statuses

| Status | Meaning |
|---|---|
| `backlog` | Captured, not committed to. |
| `ready` | Committed to and groomed. Safe to pick up. |
| `in-progress` | One session is implementing it. |
| `in-review` | The work is up and waiting on review. |
| `done` | Merged and verified. Never "merged soon". |
| `cancel` | Deliberately not doing it. |
| `duplicate` | Another ticket already covers it. |

A ticket can move between the four open statuses in any direction. Do not refuse a move because it
skips a status.

The three terminal statuses are final. No verb moves a ticket out of one or reopens it; that is a
person's decision.

A ticket with no recorded status is `backlog`, so `list backlog` finds tickets nobody labelled.

A ticket recorded in two statuses at once is **inconsistent** and has no status. `list` and `next`
never return it as a normal ticket and never drop it silently: they name it separately, and
`move <id> <status>` repairs it. Each backend file defines one status test, and every verb uses it.

There is no `blocked` status. Anything that blocks a ticket, other work or a decision only a person
can make, becomes its own ticket, joined with `link`. A decision ticket sits in `backlog`,
unassigned, with the question in its body. The blocked ticket keeps its status and leaves the
frontier because it has an open blocker. The **frontier** is the set of tickets that could be
started right now, and `next` returns it.

## 3. Read, write, verify

`create`, `assign`, `comment`, `move`, and `link` change state, and all five run three steps:

1. **Read.** Fetch the current state and check this verb's precondition. If it fails, write nothing
   and say why.
2. **Write.** One command where possible, so nothing is half applied.
3. **Verify.** A separate read, checked against what the backend now says. Never trust the write's
   exit code, printed URL, or response: several backend commands return success and change nothing.

When verification fails, report the verb, the ticket, what you expected, what the backend says, and
what you did about it. A verb that cannot confirm its own write has failed.

| Verb | Precondition | Verification |
|---|---|---|
| `create` | none | the ticket exists by id, with the intended status and every section it was given. The backend file says how to compare the body |
| `link` | both tickets exist, they differ, and the edge would not close a cycle | the edge is on the blocked ticket, and the blocker's own blockers are unchanged |
| `assign` | not terminal. The bare form also needs `ready` with no assignee. Any other holder must be named | the assignee is exactly the one asked for, or nobody for `none`. The bare form also shows `in-progress` |
| `comment` | the ticket exists | the comment body is on the ticket |
| `move` | the current status is not terminal | the backend reports the new status |

## 4. Verbs

| Verb | Semantics |
|---|---|
| `list [status] [milestone]` | Tickets with id, title, status, assignee, and blockers. Both filters are optional. An argument that is not a status name is a milestone. With no status, open tickets only |
| `show <id>` | One ticket in full: body, comments, labels, blockers, assignee |
| `next` | The frontier |
| `create <ticket> [status]` | One ticket in the shape from section 5, plus its dependency edges. The status is an open one and defaults to `backlog` |
| `assign <id> [who] [from <holder>]` | Set who holds the ticket |
| `comment <id> <body>` | Append a comment. Never edit or delete an existing one |
| `move <id> <status> [original]` | Change status, including a terminal close |
| `link <id> blocked-by <id>` | Record that the first ticket is blocked by the second |

`12`, `012`, and `#12` are the same ticket. Compare ids numerically, and write them the way the
backend does.

A milestone argument that matches no milestone is a stop that names the milestones that exist.
Never return an empty list, and never return the unscoped set.

**`next`** returns every ticket that is `ready`, has no assignee, and has no open blocker, lowest id
first. Never report an empty frontier from a read that could not see dependency edges, that came
back truncated, or that lags behind recent writes. If the backend cannot report blockers at all,
stop with an error that says so.

**An empty frontier says why.** Say the frontier is empty, then name every `ready` ticket left off
and the reason:

- its assignee, when the ticket is reserved;
- each open blocker, with that blocker's status and assignee;
- a blocker list the backend truncated.

Walk each held ticket's open blockers through their own open blockers, and name any cycle as its
path, such as `#12 → #14 → #15 → #12`. With no `ready` ticket at all, say so and count the open
tickets in each other status. "Nothing to do" and "everything is stuck" must never give the same
answer.

**`create`** writes the ticket at `backlog`, then one `link` per `## Blocked by` entry, then the
requested status last. A ticket that reaches `ready` before its edges exist can be picked up as
though nothing blocked it. A backend may write the edges together with the `backlog` status, but it
applies the requested status only after a read confirms every edge. If a step fails, report the id,
which edges landed, and that the status was not applied.

**`link`** refuses a self-link and any edge that would close a cycle. Before writing
`link <A> blocked-by <B>`, start at B and follow its open blockers, then theirs, and so on. If the
walk reaches A, refuse, write nothing, and name the path. A ticket in a terminal status ends that
branch of the walk. Run the check yourself: no backend refuses every cycle. `create` skips the
walk, because no ticket can be blocked by one that does not exist yet.

**`assign`** has four forms. Only the bare form changes status:

| Form | What it does |
|---|---|
| `assign <id>`, `assign <id> me` | Take the ticket: requires `ready` with no assignee, and sets you and `in-progress` in one write |
| `assign <id> <who>` | Give the ticket to someone. Status unchanged |
| `assign <id> <who> from <holder>` | Take the ticket from `<holder>`. Status unchanged, also when `<who>` is `me` |
| `assign <id> none [from <holder>]` | Unassign. Needs `from <holder>` unless the holder is you |

The bare form sets both fields in one write because it is the only form that races another session.
The explicit forms only record who holds the ticket, because handing work over does not mean it
has started.

**A `ready` ticket with an assignee is reserved.** `assign <id> <who>` on a `ready` ticket keeps it
off the frontier for that person, and `show` and `list` name the holder. Moving a ticket into
`ready` means the opposite, that nobody holds it, so `move` clears the assignee.

**A holder who is not you must be named.** Any form that would replace an existing assignee refuses
unless `from <holder>` names them, compared case-insensitively. The write removes every holder the
read found except the new one.

**The bare form's tie-break.** Check the verification read in this order:

1. A status other than `in-progress` means a person moved the ticket while you were writing. Take
   back exactly what you wrote and report. The backend file gives the command.
2. More than one assignee means another session wrote at the same time. The assignee whose login
   sorts first, compared case-insensitively, keeps the ticket. If that is not you, remove your own
   assignment, leave the status, and report.

This is not mutual exclusion. Two sessions can both pass the precondition and both write. The
tie-break only makes them agree afterwards on one owner. It needs a backend that stores a list of
assignees and sessions on distinct accounts; the backend file says when it cannot fire. Where it
cannot, and on the explicit forms, the branch and the open pull request are the collision signal.

**`move`** reads the current status first, because the write needs it and because nothing else
protects the terminal statuses. Refuse any move out of `done`, `cancel`, or `duplicate`.
`move <id> duplicate <original>` needs the id of the original ticket.

| Target | Assignees |
|---|---|
| `backlog`, `ready` | Cleared, every one of them, not only yours |
| `in-progress`, `in-review` | Unchanged. Say who holds it when that is not you, and say when nobody does |
| `done`, `cancel`, `duplicate` | Unchanged. They record who did the work |

`ready` must clear the assignee, because `next` requires `ready` **and** no assignee. Without the
clear, a ticket handed back with the last person's name on it is off the frontier, and nobody works
on it.

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
Spec references, with the key excerpt copied in so nobody has to fetch it.
```

`create` turns every `## Blocked by` entry into a real dependency edge, because `next` computes on
the edges. `## Related` is only for readers: no verb parses it, writes it, or queries it. Write the
ids plainly and let the backend render them.

The shape is loose. Other skills may add sections, no verb rejects a ticket over formatting, and a
one-line ticket a person wrote is valid.

## 6. Rules

- The tracker owns ticket state. Never keep a parallel status file, such as `PLAN.md` checkboxes or a
  `PROGRESS.md`.
- The product docs (`prd_file`, `spec_file`, `roadmap_file`) own intent.

## 7. Report

Say what you read or changed, with the ticket URL for `github` and `linear` or the file path for
`local`. When a write only half landed, say which half and what state the ticket is in now. When a
read came back truncated or inconsistent, say that instead of reporting a result.
