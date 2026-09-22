# Backend: GitHub Issues

Use the `gh` CLI. Resolve `OWNER/REPO` once from the `origin` remote and pass `--repo` on every
command.

Native issue dependencies are required, exposed as the `blockedBy` JSON field. If `blockedBy` is
`null`, stop, say this host lacks issue dependencies, and suggest the `local` backend. Never parse
`Blocked by #N` out of issue bodies.

## Statuses

The open statuses are labels: `backlog`, `ready`, `in-progress`, `in-review`. The terminal ones are
close reasons: `done` is `COMPLETED`, `cancel` is `NOT_PLANNED`, `duplicate` is `DUPLICATE` with
`--duplicate-of` naming the original. Every other label is a topic label, GitHub's own `duplicate`
label included.

Read a status only through this `jq` prelude. Every `--jq` below that says `<prelude>` starts with
it. Never re-implement the test inline.

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

- Never pass `--label`, `--milestone`, or `--search` to `gh issue list`: they read a lagging search
  index. Read the unfiltered list with `--state`, and filter and sort in `jq`.
- Verify every write with `gh issue view <n>`, never by finding the issue in a list.
- Every list query emits `rows`, the count before filtering. When `rows` equals `--limit`, raise the
  limit and run again. Never report a list, an empty frontier, or a missing cycle from a full page.
- Pass bodies with `--body-file`, never `--body`.

## list

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,stateReason,assignees,labels,milestone,blockedBy \
  --jq '<prelude> {rows: length,
         tickets: [.[] | select(status == "<wanted>")],
         inconsistent: [.[] | select(status == "inconsistent") | .number]}'
```

With no status, select `status != "inconsistent"` in `tickets`, so an inconsistent issue appears
only under `inconsistent`. For a terminal status, use `--state closed` and drop `inconsistent`.

For a milestone, resolve the title first:

```
gh api 'repos/<owner>/<repo>/milestones?state=all' --jq '.[] | select(.title == "<title>") | .number'
```

Empty output means no such milestone; the same call with `--jq '.[].title'` lists the ones that
exist. Otherwise add `select(.milestone.title == "<title>")` to the list query. `gh issue create` and
`gh issue edit` accept only an open milestone.

## show

```
gh issue view <n> --repo <owner/repo> \
  --json number,title,body,state,stateReason,assignees,labels,milestone,blockedBy,comments \
  --jq '<prelude> {number, title, status: status, labels: [.labels[].name],
         assignees: [.assignees[].login], milestone: .milestone.title,
         blockers: [.blockedBy.nodes[] | {number, state}],
         body, comments: [.comments[] | {author: .author.login, createdAt, body}]}'
```

Never use the `--comments` flag. For an `inconsistent` issue, name both status labels and point at
`move <id> <status>`.

## next

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

Run it as written. Never soften the `error()` with `?` or `// []`, and never test blockers with
`totalCount` alone: it counts closed blockers.

For an empty frontier, report `held`. Look up each blocker in `open` for its status and holder, and
walk `open` for cycles. Read a blocker missing from `open` with `gh issue view` before naming its
status.

When `assign` refuses a frontier candidate, take the next one.

## create

```
gh issue create --repo <owner/repo> --title "<title>" --body-file <file> [--milestone "<title>"]
```

Create with no status label, run `link` once per `## Blocked by` entry without the cycle walk, then
add the requested status label. When the requested status is `backlog`, add no label. Verify by
number:

```
gh issue view <n> --repo <owner/repo> --json number,title,labels,blockedBy
gh issue view <n> --repo <owner/repo> --json body | jq --rawfile sent <file> -e '.body == $sent'
```

The first must show every blocker and the requested status label, or no status label for
`backlog`. The second must print `true`. Compare
exactly this way, never through a shell variable or `--jq .body`.

## assign, bare form

`assign <id>` or `assign <id> me`, no `from`:

```
gh issue view <n> --repo <owner/repo> --json state,assignees,labels
gh issue edit <n> --repo <owner/repo> --add-assignee @me --remove-label ready --add-label in-progress
gh issue view <n> --repo <owner/repo> --json assignees,labels
```

The first read must show an open issue with exactly one status label, `ready`, and no assignee.
Otherwise write nothing.

The re-read must show `in-progress` as the only status label and you as the only assignee. Check in
this order:

1. Any other status labels: take back what you added, and report.

   ```
   gh issue edit <n> --repo <owner/repo> --remove-assignee @me --remove-label in-progress
   ```

2. More than one assignee: the login that sorts first, case-insensitively, keeps it. If that is not
   you, remove only yourself and leave the labels:

   ```
   gh issue edit <n> --repo <owner/repo> --remove-assignee @me
   ```

## assign, explicit forms

`assign <id> <who>`, `assign <id> <who> from <holder>`, and `assign <id> none`. Never touch a label.

```
gh issue view <n> --repo <owner/repo> --json state,assignees,labels
gh issue edit <n> --repo <owner/repo> --remove-assignee <each holder except the target> --add-assignee <who>
gh issue view <n> --repo <owner/repo> --json assignees
```

For `none`, drop `--add-assignee` and remove every holder. Refuse a closed issue. Refuse any holder
other than the target that `from` does not name. Never put the target in the removal list.

The re-read must show exactly the target, or nobody for `none`. Otherwise report what the issue
carries and that the assignment did not land. `gh` exits 0 when it drops a user without push access.

## move, to an open status

```
gh issue view <n> --repo <owner/repo> --json state,stateReason,assignees,labels
gh issue edit <n> --repo <owner/repo> --remove-label <every status label found except the target> --add-label <target>
```

Refuse a closed issue. Never put the target in the removal list, and never remove a topic label.
Moving to `backlog` or `ready` also adds `--remove-assignee <login>` for every login the read found.

## move, to a terminal status

After the same read and refusal, close first, then strip the status labels:

```
gh issue close <n> --repo <owner/repo> --reason "completed"
gh issue close <n> --repo <owner/repo> --reason "not planned"
gh issue close <n> --repo <owner/repo> --reason "duplicate" --duplicate-of <original number>
gh issue edit <n> --repo <owner/repo> --remove-label <each status label the read found>
```

## Verifying a move

```
gh issue view <n> --repo <owner/repo> --json state,stateReason,assignees,labels
```

An open target: exactly one status label, the target. A terminal target: `CLOSED`, the requested
`stateReason`, and no status label.

## comment

```
gh issue comment <n> --repo <owner/repo> --body-file <file>
gh issue view <n> --repo <owner/repo> --json comments --jq '[.comments[].body]'
```

The exact body must be in the list. Before retrying, read the list; the first attempt may have
landed.

## link

Refuse a self-link. For a cycle, run the `next` query and walk `open` from the blocker through each
entry's `blockers`. Read a blocker missing from `open` with `gh issue view --json state,blockedBy`
and keep walking only if it is open. Reaching the blocked issue is a cycle: refuse and name the
path. GitHub refuses only self-links and two-issue cycles.

The endpoint takes the blocker's database id, not its number or `node_id`:

```
gh api repos/<owner>/<repo>/issues/<blocker number> --jq .id
gh api --method POST repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<that id>
gh issue view <n> --repo <owner/repo> --json blockedBy --jq '[.blockedBy.nodes[].number]'
```

The blocker's number must be in the list.
