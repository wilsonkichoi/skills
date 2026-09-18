# Backend: GitHub Issues

`gh` CLI, no MCP. Resolve `OWNER/REPO` once from the configured remote and pass `--repo` on every
command, so nothing depends on the working directory.

Native issue dependencies are required, not optional. Tested with `gh` 2.97.0, which exposes them
as the `blockedBy` JSON field. If `blockedBy` comes back `null`, this host does not have them: stop
and report that, and use the `local` backend instead. There is no fallback to parsing
`Blocked by #N` out of issue bodies. Nothing in this skill set writes that text, so a fallback
would make `next` wrong rather than degraded.

## Status mapping

The four open states are labels, created once by `setup`: `backlog`, `ready`, `in-progress`,
`in-review`.

The three terminal states are close reasons, not labels:

| Status | How GitHub records it |
|---|---|
| `done` | closed, `stateReason: COMPLETED` |
| `cancel` | closed, `stateReason: NOT_PLANNED` |
| `duplicate` | closed, `stateReason: DUPLICATE`, with `--duplicate-of` naming the original |

Reading a status back:

- open with one status label: that status.
- open with no status label: `backlog`. Every human-created and every reopened issue lands here.
- open with two or more status labels: inconsistent. It has no status, and no query returns it as
  though it did.
- closed: read `stateReason`. A closed issue carries no status label.

Why close reasons rather than seven labels: a `done` label on an issue closed as `not planned` is
two sources of truth that will eventually disagree, and GitHub already stores the reason natively.
This is a deliberate departure from a flat seven-label scheme, and it is reversible for the cost of
three `gh label create` lines.

## Status validation

Those four rules are written once, as a `jq` prelude, and every query below prepends it. Do not
re-implement the test inline: a second copy is how `list` and `next` came to disagree about what
`ready` means.

```
def STATUS: ["backlog","ready","in-progress","in-review"];
def status_labels: [.labels[].name] - ([.labels[].name] - STATUS);
def status: status_labels
  | if length > 1 then "inconsistent"
    elif length == 0 then "backlog"
    else .[0] end;
```

`status_labels` is the intersection of the issue's labels with the four status names, so `bug`,
`enhancement`, and every other topic label a repository carries are invisible to it. `status` turns
that into exactly one of the four names, or `inconsistent`.

Every query then filters with `select(status == "<wanted>")` and reports the inconsistent issues
separately in the same pass:

```
--jq '<prelude> {rows: length,
       tickets: [.[] | select(status == "ready")],
       inconsistent: [.[] | select(status == "inconsistent") | .number]}'
```

Three properties this buys, and all three are the point:

- **An issue with two status labels is never returned as a ticket.** `--label ready` matches an
  issue carrying `ready` and `in-progress` both, so the server-side filter alone would hand
  `next` a ticket whose status nobody can name.
- **It is never silently dropped either.** `inconsistent` carries its number, so the caller can say
  so and `move <id> <status>` is the repair.
- **`list backlog` stops being a special case.** `status` already resolves an unlabelled issue to
  `backlog`, so the same expression serves all four open statuses.

Verified against the eight label shapes a repository actually produces: no labels, `backlog` alone,
`ready` alone, a topic label alone, a topic label beside `backlog`, `backlog` with `ready`, `ready`
with `in-progress` and a topic label, and `in-review` alone. The first five resolve to a status, the
two multi-status shapes resolve to `inconsistent`, and no shape returns the wrong name.

## Truncation

`--limit` defaults to 30 and `gh` returns newest first, so a plain list silently drops the oldest
issues, which are the lowest-numbered ones. Two rules:

- Whenever the number of rows returned equals `--limit`, the result is incomplete. Raise the limit
  and run it again before trusting it. Never report a filtered list or an empty frontier from a
  result that hit its own limit. Every `--jq` below that filters rows also emits `rows`, the count
  before filtering, because that is the only number this rule can be applied to. A filter that
  collapses a full page to `[]` looks identical to an empty repository without it.
- Push the ordering to the server with `--search "sort:created-asc"` whenever lowest id first is
  what you want. Issue numbers are handed out in creation order, so that is ascending issue number,
  and it means truncation drops the tickets `next` cares about least rather than the ones it needs.

## Per verb

**list.** One shape for all four open statuses, `backlog` included. Always list every open issue and
let `status` do the filtering: `--label <status>` would miss the unlabelled issues that read as
`backlog`, and would over-match the inconsistent ones.

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,stateReason,assignees,labels,milestone,blockedBy \
  --jq '<prelude> {rows: length,
         tickets: [.[] | select(status == "<wanted>")],
         inconsistent: [.[] | select(status == "inconsistent") | .number]}'
```

Add `--milestone <title>` to scope. With no status argument, drop the `select` and return every open
issue, still reporting `inconsistent`.

For a terminal status, query `--state closed` and filter on `stateReason`, which is on the list
payload, so `list done`, `list cancel`, and `list duplicate` each read back in one call with no
per-issue fan-out. `COMPLETED` is `done`, `NOT_PLANNED` is `cancel`, `DUPLICATE` is `duplicate`.
Status labels do not apply to a closed issue, so there is no `inconsistent` bucket here:

```
gh issue list --repo <owner/repo> --state closed --limit 200 \
  --json number,title,stateReason,assignees,labels \
  --jq '{rows: length, tickets: [.[] | select(.stateReason == "COMPLETED")]}'
```

**show.**

```
gh issue view <n> --repo <owner/repo> --comments
gh issue view <n> --repo <owner/repo> \
  --json number,title,body,state,stateReason,assignees,labels,milestone,blockedBy
```

Resolve the status with the same `status` definition, so `show` and `list` can never disagree about
one issue. An issue carrying two status labels reports as inconsistent here, naming both labels, and
`move <id> <status>` is how it gets repaired.

**next.** The whole frontier is one command. `no:assignee` and `sort:created-asc` do the assignee
filter and the ordering on the server.

```
gh issue list --repo <owner/repo> --state open --label ready \
  --search "no:assignee sort:created-asc" --limit 100 \
  --json number,title,assignees,labels,blockedBy \
  --jq '<prelude> {rows: length,
         frontier: [.[]
           | if .blockedBy == null
             then error("blockedBy is null: this host does not expose issue dependencies")
             else . end
           | select(status == "ready")
           | select(.blockedBy.totalCount == (.blockedBy.nodes | length))
           | select([.blockedBy.nodes[] | select(.state == "OPEN")] | length == 0)],
         inconsistent: [.[] | select(status == "inconsistent") | .number]}'
```

`--label ready` is a server-side prefilter and nothing more. It can only over-include, because an
issue whose status is `ready` must carry that label, so narrowing it further with `select(status ==
"ready")` is safe and necessary: without it an issue carrying `ready` and `in-progress` both would
enter the frontier and get claimed, and `claim`'s pre-read would then refuse it.

Five things that query is doing on purpose:

1. **`select(status == "ready")` is the shared status test**, the same one `list` uses, and it is
   what keeps an inconsistent issue out of the frontier. The server-side `--label ready` cannot do
   this on its own.
2. **The `error()` is the guard for a host without dependency support**, and it has to be written
   out. It cannot be left implicit in the filters below it: `null.totalCount` is `null` and
   `null.nodes | length` is `0` in `jq`, so a null row compares false against the 50-node check and
   is dropped silently, exit 0. On a host with no dependencies every row is null, the frontier comes
   back empty, and `next` is wrong forever with nothing to show for it. Let the error through, and
   never patch it with `?` or `// []` for the same reason.
3. **It filters on `blockedBy.nodes[].state`, never on `blockedBy.totalCount`.** Verified
   2026-09-18 against `gh` 2.97.0: `totalCount` counts closed blockers too and stays at 1 after the
   blocker is closed, so a `totalCount == 0` filter would keep every unblocked ticket off the
   frontier forever. The GraphQL schema says the same thing: `issueDependenciesSummary` carries
   both `blockedBy`, which is open blockers only, and `totalBlockedBy`, documented as "open and
   closed".
4. **The `totalCount` comparison is the 50-node guard.** `gh` caps `blockedBy.nodes` at 50, so a
   `totalCount` above the number of nodes returned means the list is truncated and an open blocker
   may be hidden. Such a ticket is held off the frontier rather than trusted. This is a query, not a
   note, because an unattended run will not compare the two counts by hand. Use `show <id>` to
   inspect a ticket held back this way.
5. **`rows` is the pre-filter count**, and it is the only thing the truncation rule can read. A page
   of 100 `ready` tickets that are all blocked yields an empty `frontier`, which is indistinguishable
   from a repository with no `ready` tickets unless `rows` is there to say otherwise.

Results come back in ascending issue number, so do not re-sort. When `rows` reaches `--limit`, the
frontier's head is still correct because the ordering is ascending, but say the list was truncated
rather than presenting it as the whole frontier.

The frontier is a list of candidates, not a set of facts. `--search` goes through the eventually
consistent search API, so a ticket claimed seconds ago can still appear here and a ticket just moved
to `ready` can be missing. `claim`'s pre-read is what settles it: a refusal on the first candidate
right after `next` is the system working, so take the next candidate rather than retrying the same
one.

**create.** Use `--body-file` or a heredoc; a multi-line body does not survive `--body`.

```
gh issue create --repo <owner/repo> --title "<title>" --body-file <file> [--milestone "<title>"]
```

Create it with no status label, which reads as `backlog`. Then run `link` once per entry in the
ticket's `## Blocked by` section. Only then apply the requested status label. Labelling `ready`
before the edges exist puts the ticket on the frontier unblocked, where another session can claim
it.

Verify by number, not from the URL `gh issue create` printed:

```
gh issue view <n> --repo <owner/repo> --json number,title,body,labels,blockedBy
```

The body must match what you sent, every `## Blocked by` entry must appear in `blockedBy.nodes`, and
the status label must be the one requested. A filtered `gh issue list` is not a verification here,
because the search API is eventually consistent and a ticket created seconds ago can be missing from
it. Read it by number.

**claim.** Read, edit, re-read. The read is not optional: `--remove-label` on a label the issue does
not carry exits 0 and changes nothing, so a blind claim on an `in-review` ticket would add
`in-progress` beside `in-review` and report success.

```
gh issue view <n> --repo <owner/repo> --json state,assignees,labels
gh issue edit <n> --repo <owner/repo> --add-assignee @me --remove-label ready --add-label in-progress
gh issue view <n> --repo <owner/repo> --json assignees,labels
```

The first read must show an open issue, exactly one status label and that label `ready`, and no
assignee. Anything else, stop and write nothing. Only the four status labels count here: `bug`,
`enhancement`, and every other topic label a repository carries are ignored, and a claim that
refused because a ticket also had `bug` on it would refuse every claim in a real repository.

The re-read must show exactly one status label, `in-progress`, and exactly one assignee, you. Any
other set of status labels is the inconsistent case: a human moved the ticket while you were
writing. Take back exactly what you added and nothing else, then report:

```
gh issue edit <n> --repo <owner/repo> --remove-assignee @me --remove-label in-progress
```

`in-progress` is yours, added two commands ago, so leaving it behind would hand the next reader a
two-label ticket that `claim` created and `move` has to repair. Whatever label the human set is
theirs and stays. The command is safe in all three shapes the re-read can return, `in-progress`
beside their label, their label alone because they stripped yours, or no status label at all,
because removing a label an issue does not carry exits 0 and changes nothing. It has no add side,
so it cannot hit the concurrent-mutation race that `move` has to work around.

More than one assignee means the login that sorts
first, compared case-insensitively because GitHub logins are, keeps the ticket; if that is not you,
remove only your own assignment:

```
gh issue edit <n> --repo <owner/repo> --remove-assignee @me
```

Do not touch the labels on the way out. The winner is working on that ticket and `in-progress` is
theirs. Stripping it back to `ready` would leave the ticket assigned to the winner but reading as
unclaimed, off the frontier and wrong for whoever reads it next, and with three racers it would be
flipped twice.

**move, open state to open state.** Read the current status first, because the edit names the label
being removed.

```
gh issue view <n> --repo <owner/repo> --json state,stateReason,assignees,labels
gh issue edit <n> --repo <owner/repo> --remove-label <every status label found except the new one> --add-label <new>
```

The removal list is every status label the read found **minus the target**, never one guessed name
and never the target itself. `gh` sends the additions and the removals as two concurrent GraphQL
mutations with no ordering between them, so a label named in both lists ends in whichever mutation
lands last. Measured against `gh` 2.97.0, `--remove-label ready --add-label ready` on a `ready`
ticket stripped the label in eight runs out of eight, exit 0, leaving an unlabelled issue that reads
as `backlog`. That is the most common move a skill makes, a no-op `move <id> ready` on a ticket
already there, so keep the two lists disjoint and do not fold them back together.

Subtracting the target also makes the repair fall out: an issue a human left carrying `backlog` and
`ready` that is moved to `ready` removes `backlog` and adds `ready`, so `move` is how an
inconsistent ticket gets fixed rather than something that refuses to touch it. Adding a label the
issue already carries is a no-op, so the re-run is a bare `--add-label`. Topic labels are never
removed.

A closed issue on that first read is in a terminal state: refuse the move and report. Moving to
`backlog` clears every assignee, so pass `--remove-assignee` once per login found on the read, not
just `@me`.

**move, open state to a terminal state.** The same read comes first, and it is the only guard there
is. `gh issue close` on an already-closed issue prints "is already closed", **exits 0, and leaves
the existing reason untouched**, so a second terminal move reports success while changing nothing.

Close first, strip the leftover label second.

```
gh issue close <n> --repo <owner/repo> --reason "completed"
gh issue close <n> --repo <owner/repo> --reason "not planned"
gh issue close <n> --repo <owner/repo> --reason "duplicate" --duplicate-of <original number>
gh issue edit <n> --repo <owner/repo> --remove-label <each status label the read found>
```

The order is load bearing. A failed strip leaves a closed issue carrying a stale label, which no
open-state query sees. The other order would leave an open, unlabelled issue, and that now reads as
`backlog`.

**Verifying either kind of move.** One read, after the write, whatever the exit codes said:

```
gh issue view <n> --repo <owner/repo> --json state,stateReason,assignees,labels
```

For an open-state move, expect exactly one status label and that label the target. For a terminal
move, expect `CLOSED`, the `stateReason` you asked for, and no status label at all. A `stateReason`
that is not the one you passed means the issue was already closed and `gh` kept the original reason,
which it does at exit 0.

**comment.** Write, then read the comments back and find yours.

```
gh issue comment <n> --repo <owner/repo> --body-file <file>
gh issue view <n> --repo <owner/repo> --json comments --jq '[.comments[].body]'
```

The exact body must be in that list. Comments are append-only, so a duplicate on a retry is worse
than a missing one: check before re-posting, since the first attempt may have landed and only the
response been lost.

**link.** The endpoint takes the blocker's numeric database id, which is not the `#number` and not
the `node_id`. Read both ids, POST, then read the edge back.

```
gh api repos/<owner>/<repo>/issues/<blocker number> --jq .id
gh api --method POST repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<that id>
gh issue view <n> --repo <owner/repo> --json blockedBy --jq '[.blockedBy.nodes[].number]'
```

The blocker's number must be in that list. This verification is what `create` depends on: a ticket
whose edge silently failed goes to `ready` and onto the frontier as though nothing blocked it, which
is the one wrong answer `next` must never give.

## Consistent reads

Every filtered `gh issue list` (`--label`, `--milestone`, `--search`) goes through GitHub's search
API, which is eventually consistent. An issue created or edited seconds earlier can be missing from
the result. A missing ticket in a list is never proof the create failed: re-read it by number with
`gh issue view`, which hits the primary store.

No sub-issues. Nothing in this skill set creates them until `plan` is ported; add the endpoint then.
