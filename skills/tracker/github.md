# Backend: GitHub Issues

Use the `gh` CLI, not an MCP server. Resolve `OWNER/REPO` once from the `origin` remote and pass
`--repo` on every command, so nothing depends on the working directory.

Native issue dependencies are required. `gh` exposes them as the `blockedBy` JSON field. If
`blockedBy` comes back `null`, this host does not have them: stop, say so, and suggest the `local`
backend. Never fall back to parsing `Blocked by #N` out of issue bodies.

## Status mapping

The four open statuses are labels, created once by `setup`: `backlog`, `ready`, `in-progress`,
`in-review`.

The three terminal statuses are close reasons, not labels:

| Status | How GitHub records it |
|---|---|
| `done` | closed, `stateReason: COMPLETED` |
| `cancel` | closed, `stateReason: NOT_PLANNED` |
| `duplicate` | closed, `stateReason: DUPLICATE`, with `--duplicate-of` naming the original |

To read a status back, check `state` first:

- Open with one status label: that status.
- Open with no status label: `backlog`. Every human-created and every reopened issue lands here.
  A reopened issue also reports `stateReason: REOPENED`. Ignore it, because it is not a status.
- Open with two or more status labels: `inconsistent`. It has no status.
- Closed: the status comes from `stateReason`, and any status label left on it is ignored.

Every other label (`bug`, `enhancement`, GitHub's own `duplicate` label) is a topic label and never
a status.

## The prelude

The rules above are written once, as a `jq` prelude. Every `--jq` in this file that says
`<prelude>` starts with it. Never re-implement the status test inline, because two copies drift and
then `list`, `show`, and `next` disagree about one issue.

```
def STATUS: ["backlog","ready","in-progress","in-review"];
def CLOSED: {"COMPLETED": "done", "NOT_PLANNED": "cancel", "DUPLICATE": "duplicate"};
def status_labels: [.labels[].name] - ([.labels[].name] - STATUS);
def status:
  if .state == "CLOSED" then CLOSED[.stateReason]
  else status_labels
    | if length > 1 then "inconsistent" elif length == 0 then "backlog" else .[0] end
  end;
def open_blockers: [.blockedBy.nodes[] | select(.state == "OPEN") | .number];
```

## Reading rules

**Read the primary store, never the search index.** `gh issue list` picks its backend from the
flags:

| Invocation | Backend | Consistency |
|---|---|---|
| no filter, `--state`, `--assignee` | the repository's issue list | immediate |
| `--label`, `--milestone`, `--search` | the search index | seconds behind, or more |
| `gh issue view <n>` | the issue by number | immediate |

An issue made `ready` a second ago is missing from `--label ready`, and an empty result looks the
same as a repository with nothing `ready`. So every query here reads the unfiltered list and filters
in `jq`. `--milestone <number>` is not a way around it, because `gh` turns it back into a title
search. Verify every write with `gh issue view <n>`, never by finding the issue in a list.

**A full page is an incomplete answer.** `--limit` defaults to 30 and results arrive newest first,
so truncation drops the oldest, lowest-numbered issues first. Every filtering query emits `rows`, the
count before filtering. When `rows` equals `--limit`, raise the limit and run it again. Never report
a filtered list, an empty frontier, or the absence of a cycle from a page that hit its limit. Sort in
`jq`: sorting on the server needs `--search`, which is the search index again.

## Per verb

### list

All four open statuses, `backlog` included, use one query:

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,stateReason,assignees,labels,milestone,blockedBy \
  --jq '<prelude> {rows: length,
         tickets: [.[] | select(status == "<wanted>")],
         inconsistent: [.[] | select(status == "inconsistent") | .number]}'
```

With no status argument, drop the `select` from `tickets` and keep `inconsistent`.

For `done`, `cancel`, or `duplicate`, use the same query with `--state closed` and drop
`inconsistent`, since a closed issue is never inconsistent.

**Scoping to a milestone.** Resolve the title first, then filter in `jq`. Never pass `--milestone`
to `gh issue list`.

```
gh api 'repos/<owner>/<repo>/milestones?state=all' --jq '.[] | select(.title == "<title>") | .number'
```

`state=all` is required, because the endpoint otherwise returns open milestones only. Empty output
is a stop: say the milestone does not exist and name the ones that do, from the same call with
`--jq '.[].title'`. A name that resolves adds one more filter to the list query:

```
select(.milestone.title == "<title>")
```

`gh issue create --milestone` and `gh issue edit --milestone` accept only an **open** milestone. On
a closed one they exit 1 with `'<title>' not found`.

### show

```
gh issue view <n> --repo <owner/repo> \
  --json number,title,body,state,stateReason,assignees,labels,milestone,blockedBy,comments \
  --jq '<prelude> {number, title, status: status, labels: [.labels[].name],
         assignees: [.assignees[].login], milestone: .milestone.title,
         blockers: [.blockedBy.nodes[] | {number, state}],
         body, comments: [.comments[] | {author: .author.login, createdAt, body}]}'
```

Use the `comments` JSON field, never the `--comments` flag. The flag replaces the issue with its
comments, and on an issue with none it prints nothing at exit 0. When `status` is `inconsistent`,
name both status labels and point at `move <id> <status>` as the repair.

### next

The frontier is one query:

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,assignees,labels,blockedBy \
  --jq '<prelude> {rows: length,
         frontier: [.[]
           | if .blockedBy == null
             then error("blockedBy is null: this host does not expose issue dependencies")
             else . end
           | select(status == "ready")
           | select((.assignees | length) == 0)
           | select(.blockedBy.totalCount == (.blockedBy.nodes | length))
           | select(open_blockers | length == 0)]
           | sort_by(.number),
         inconsistent: [.[] | select(status == "inconsistent") | .number],
         held: [.[] | select(status == "ready")
           | select((.assignees | length) > 0
                    or (open_blockers | length) > 0
                    or .blockedBy.totalCount != (.blockedBy.nodes | length))
           | {number, assignees: [.assignees[].login], blockers: open_blockers,
              truncated: (.blockedBy.totalCount != (.blockedBy.nodes | length))}]
           | sort_by(.number),
         open: (map({key: (.number | tostring),
                     value: {status: status, assignees: [.assignees[].login],
                             blockers: open_blockers}})
                | from_entries)}'
```

What the query depends on:

- **Keep the `error()`.** Without it, a `null` `blockedBy` passes every filter below it as though
  the issue had no blockers, or drops it silently, at exit 0. Never soften it with `?` or `// []`.
- **Filter on the blocker's `state`, never on `totalCount`.** `totalCount` counts closed blockers
  too, so a `totalCount == 0` test keeps every once-blocked issue off the frontier forever.
- **Compare `totalCount` with the node count.** `gh` returns at most 50 blocker nodes. When the
  counts differ, an open blocker may be hidden, so the issue is held and marked `truncated`.
- **`held` and `open` explain an empty frontier.** `held` is every `ready` issue left off, with its
  assignees and open blockers. `open` maps every open issue to its status, assignees, and open
  blockers. Look up each blocker in `open` to report its status and holder, and walk `open` to find
  a cycle. A blocker missing from `open` is closed, in another repository, or beyond the page: read
  it with `gh issue view` before naming its status.

The frontier is a list of candidates. Another session can take one between this read and the
`assign`. When `assign` refuses the first candidate, take the next one; do not retry the same one.

### create

Write the body to a file and pass `--body-file`. A multi-line body does not survive `--body`.

```
gh issue create --repo <owner/repo> --title "<title>" --body-file <file> [--milestone "<title>"]
```

Create it with no status label. Then run `link` once per `## Blocked by` entry. Skip the cycle walk,
because nothing can be blocked by an issue that did not exist a moment ago. Apply the requested
status label last.

Verify by number, not from the URL `gh issue create` printed:

```
gh issue view <n> --repo <owner/repo> --json number,title,labels,blockedBy
gh issue view <n> --repo <owner/repo> --json body | jq --rawfile sent <file> -e '.body == $sent'
```

The first read must show every `## Blocked by` entry in `blockedBy.nodes` and the requested status
label. GitHub stores the body unchanged, so the second must print `true` at exit 0. Compare with
`jq` as written. `--jq .body > file` adds a trailing newline and `"$(...)"` strips one, so both
report a difference on an identical body.

### assign, the bare form

`assign <id>` and `assign <id> me`, with no `from`. Read, write, re-read:

```
gh issue view <n> --repo <owner/repo> --json state,assignees,labels
gh issue edit <n> --repo <owner/repo> --add-assignee @me --remove-label ready --add-label in-progress
gh issue view <n> --repo <owner/repo> --json assignees,labels
```

The first read must show an open issue whose status is `ready` (exactly one status label, and that
label `ready`) and no assignee. Otherwise stop and write nothing. The read is not optional:
`--remove-label` on a label the issue does not carry exits 0 and changes nothing, so a blind write on
an `in-review` issue leaves it carrying both `in-review` and `in-progress`.

The re-read must show `in-progress` as the only status label and you as the only assignee. Check the
labels first, then the assignees:

1. **Any other set of status labels** means a person moved the issue while you were writing. Take
   back exactly what you added, leave their label alone, and report:

   ```
   gh issue edit <n> --repo <owner/repo> --remove-assignee @me --remove-label in-progress
   ```

2. **More than one assignee** means another session pulled at the same time. The login that sorts
   first, compared case-insensitively, keeps the issue. If that is not you, remove only your own
   assignment and leave the labels alone, because `in-progress` now belongs to the winner:

   ```
   gh issue edit <n> --repo <owner/repo> --remove-assignee @me
   ```

The tie-break needs distinct accounts. Two sessions on one account read the same single login and
both believe they won.

### assign, the explicit forms

`assign <id> <who>`, `assign <id> <who> from <holder>`, and `assign <id> none`. These set the
assignee and never touch a label.

```
gh issue view <n> --repo <owner/repo> --json state,assignees,labels
gh issue edit <n> --repo <owner/repo> --remove-assignee <each holder except the target> --add-assignee <who>
gh issue view <n> --repo <owner/repo> --json assignees
```

For `none`, drop `--add-assignee` and remove every holder.

A closed issue on the first read is terminal: refuse. Every assignee the read found other than the
target must be named by `from`, compared case-insensitively. An unnamed holder is a refusal, never a
silent removal. Never put the target in the removal list: `gh` sends additions and removals as two
unordered mutations, so a name in both lists ends up in whichever lands last.

The re-read must show exactly the target, or nobody for `none`. It is the only check that catches
this:

| `--add-assignee` argument | Exit | Result |
|---|---|---|
| a login that does not exist | 1 | `Could not resolve to a user or bot with the login '<x>'` |
| a real user without push access | **0** | the URL is printed and **nobody is assigned** |

On a mismatch, say what the issue carries now and that the assignment did not land.

### move, to an open status

```
gh issue view <n> --repo <owner/repo> --json state,stateReason,assignees,labels
gh issue edit <n> --repo <owner/repo> --remove-label <every status label found except the target> --add-label <target>
```

A closed issue on the read is terminal: refuse.

The removal list is every status label the read found **minus the target**. Never guess a name, and
never put the target in both lists: `gh` sends the two as unordered mutations, and
`--remove-label ready --add-label ready` usually strips the label at exit 0. That is the most common
move there is, `move <id> ready` on an issue already `ready`. Subtracting the target also repairs an
inconsistent issue: one carrying `backlog` and `ready`, moved to `ready`, loses `backlog`. Topic
labels are never removed.

Moving to `backlog` or `ready` also clears every assignee: add `--remove-assignee <login>` for each
login the read found, not only `@me`.

### move, to a terminal status

The read above is the only guard. `gh issue close` on an issue that is already closed prints "is
already closed", exits 0, and keeps the old reason.

Close first, then strip the status labels:

```
gh issue close <n> --repo <owner/repo> --reason "completed"
gh issue close <n> --repo <owner/repo> --reason "not planned"
gh issue close <n> --repo <owner/repo> --reason "duplicate" --duplicate-of <original number>
gh issue edit <n> --repo <owner/repo> --remove-label <each status label the read found>
```

In this order, a failed strip leaves a closed issue with a stale label, which the prelude ignores.
The other order can leave an open, unlabelled issue, which reads as `backlog`.

### Verifying a move

```
gh issue view <n> --repo <owner/repo> --json state,stateReason,assignees,labels
```

For an open status, expect exactly one status label, the target. For a terminal status, expect
`CLOSED`, the `stateReason` you asked for, and no status label.

### comment

```
gh issue comment <n> --repo <owner/repo> --body-file <file>
gh issue view <n> --repo <owner/repo> --json comments --jq '[.comments[].body]'
```

The exact body must be in the list. Before retrying a failed comment, read the list first: the first
attempt may have landed, and a duplicate comment cannot be taken back.

### link

Refuse a self-link. Then check for a cycle: run the `next` query, keep only `open`, and walk from
the blocker through each entry's `blockers`. If the walk reaches the blocked issue, refuse and name
the path. A blocker missing from `open` is closed or in another repository: read it with
`gh issue view --json state,blockedBy` and keep walking only if it is open. GitHub itself refuses
only a self-link and a two-issue cycle, with HTTP 422. It accepts a longer cycle.

The endpoint takes the blocker's numeric database id, which is neither the `#number` nor the
`node_id`:

```
gh api repos/<owner>/<repo>/issues/<blocker number> --jq .id
gh api --method POST repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<that id>
gh issue view <n> --repo <owner/repo> --json blockedBy --jq '[.blockedBy.nodes[].number]'
```

The blocker's number must be in the list. An edge that failed without a check would let `create`
put the issue on the frontier as though nothing blocked it.
