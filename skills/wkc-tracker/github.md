# Backend: GitHub Issues

## Contents
- Statuses
- Reading rules
- list, show, next, create, edit
- milestone: ensure, close, list, show
- assign, bare and explicit forms
- move, to an open or a terminal status, then verifying a move
- comment, link, unlink
- Blockers and duplicate originals
- Run configs

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
  if .state == "CLOSED" then CLOSED[.stateReason // ""] // "closed, no reason"
  else status_labels
    | if length > 1 then "inconsistent" elif length == 0 then "backlog" else .[0] end
  end;
def open_blockers: [.blockedBy.nodes[] | select(.state == "OPEN") | .number];
def closed_blockers: [.blockedBy.nodes[] | select(.state != "OPEN") | .number];
def truncated: .blockedBy.totalCount != (.blockedBy.nodes | length);
```

An open blocker is unmet. A closed one is met only when the blocker query in **Blockers and
duplicate originals** shows it `done`, or a duplicate whose originals end at `done`. Never judge a
closed blocker by looking its number up in this repository: the number may belong to another
repository, and the list does not say why it closed.

A title, a milestone name, or any other value from the user never goes inside a `jq` program. Pipe
`gh` into `jq --arg t '<title>'` and compare with `$t`. Write each value as one single-quoted shell
word, with each `'` inside it written as `'\''`.

## Reading rules

- Never pass `--label`, `--milestone`, or `--search` to `gh issue list`: they read a lagging search
  index. Read the unfiltered list with `--state`, and filter and sort in `jq`.
- Verify every write with `gh issue view <n>`, never by finding the issue in a list.
- Every list query emits `rows`, the count before filtering. When `rows` equals `--limit`, raise the
  limit and run again. Never report a list, an empty frontier, or a missing cycle from a full page.
- Pass bodies with `--body-file`, never `--body`.
- An issue labeled `wkc-run` is a run config, never a ticket. Drop it from every list, the
  frontier, and milestone counts, and refuse a ticket verb on one.

## list

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,stateReason,assignees,labels,milestone,blockedBy \
  --jq '<prelude> length as $rows | map(select(all(.labels[]; .name != "wkc-run"))) |
       {rows: $rows,
         tickets: [.[] | select(status == "<wanted>")],
         inconsistent: [.[] | select(status == "inconsistent") | .number]}'
```

With no status, select `status != "inconsistent"` in `tickets`, so an inconsistent issue appears
only under `inconsistent`. For a terminal status, use `--state closed` and drop `inconsistent`.

For a milestone, resolve the title first:

```
gh api --paginate 'repos/<owner>/<repo>/milestones?state=all&per_page=100' \
  | jq --arg t '<title>' '.[] | select(.title == $t) | .number'
```

Empty output means no such milestone; the same call with `--jq '.[].title'` lists the ones that
exist. Otherwise pipe the list query into `jq --arg t '<title>'` instead of using `--jq`, and add
`select(.milestone.title == $t)`. `gh issue create` and
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
`move <id> <status>`. For a `duplicate`, name its original from the issue query in **Blockers and
duplicate originals**. Give each closed blocker its repository and status from the blocker query.

## next

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,assignees,labels,blockedBy \
  --jq '<prelude> length as $rows | map(select(all(.labels[]; .name != "wkc-run"))) |
       {rows: $rows,
         frontier: [.[]
           | if .blockedBy == null
             then error("blockedBy is null: this host does not expose issue dependencies")
             else . end
           | select(status == "ready")
           | select((.assignees | length) == 0)
           | select(truncated | not)
           | select((open_blockers | length) == 0 and (closed_blockers | length) == 0)]
           | sort_by(.number),
         check: [.[] | select(status == "ready")
           | select((.assignees | length) == 0 and (truncated | not))
           | select((open_blockers | length) == 0 and (closed_blockers | length) > 0)
           | {number, closed: closed_blockers}]
           | sort_by(.number),
         inconsistent: [.[] | select(status == "inconsistent") | .number],
         held: [.[] | select(status == "ready")
           | select((.assignees | length) > 0 or (open_blockers | length) > 0 or truncated)
           | {number, assignees: [.assignees[].login], blockers: open_blockers,
              truncated: truncated}]
           | sort_by(.number),
         open: (map({key: (.number | tostring),
                     value: {status: status, assignees: [.assignees[].login],
                             blockers: open_blockers}})
                | from_entries)}'
```

Run it as written. Never soften the `error()` with `?` or `// []`, and never test blockers with
`totalCount` or the blocker's `state` alone: the count includes closed blockers, and a closed one
may be canceled.

Each ticket in `check` has only closed blockers. Run the blocker query on it. When every blocker is
met, the ticket joins the frontier in id order; otherwise it is held, with each unmet blocker's
repository, number, and reason.

For an empty frontier, report `held` and the `check` tickets left out. Look up each open blocker in
`open` for its holder, and walk `open` for cycles. An open blocker missing from `open` is in another
repository: read it with the issue query.

When `assign` refuses a frontier candidate, report why. Which ticket to take instead is the caller's choice.

## create

```
gh issue create --repo <owner/repo> --title "<title>" --body-file <file> [--milestone '<milestone>']
```

With a milestone, first run the ensure form's read: it must print exactly one milestone, `open`.
`gh` matches a milestone title loosely, so never let `--milestone` decide. Create with no status
label, then run `link` once per `## Blocked by` entry without the cycle walk. Verify by number:

```
gh issue view <n> --repo <owner/repo> --json number,title,labels,blockedBy,milestone \
  | jq --arg m '<milestone>' '{number, title, labels: [.labels[].name],
      blockers: [.blockedBy.nodes[].number], milestone: .milestone.title,
      milestone_ok: (.milestone.title == $m)}'
gh issue view <n> --repo <owner/repo> --json body | jq --rawfile sent <file> -e '.body == $sent'
```

The first must show every blocker, no status label, and `milestone_ok: true`; with no milestone
given, `milestone: null`. The second must print `true`. Compare exactly this way, never through a
shell variable or `--jq .body`.

## edit

```
gh issue view <n> --repo <owner/repo> --json number,title,body,state,stateReason,assignees,labels,milestone,blockedBy
gh issue edit <n> --repo <owner/repo> [--title '<title>'] [--body-file <file>] [--milestone '<milestone>' | --remove-milestone]
```

Pass `--body-file` only when the edit gives a section, `## Blocked by` included. A title or
milestone edit sends no body. With a section, write the body the read returned to a file, replace
or add only the given sections, and pass that file. GitHub has no conditional write, so a body
change someone makes between the read and the write is lost: run the write right after the read.
Resolve a milestone with the ensure form's read first: exactly one, `open`. Apply a changed
`## Blocked by` with the `unlink` and `link` commands below, one per edge that differs. A closed
issue takes the edit and stays closed with its reason.

Verify with the read again: the given title and milestone, or `milestone: null` for `none`; the
blockers exactly the new set; `state`, `stateReason`, labels, and assignees as the first read found
them. When a section was given, compare the body with `--rawfile` against the file you wrote, as
`create` does. Otherwise the write sent no body, so there is nothing to compare.

## milestone

Every milestones read passes `state=all`, `per_page=100`, and `--paginate`. Without `state=all` a
closed milestone is invisible, and without paging the read stops at the first page.

`milestone <name>`, the ensure form:

```
gh api --paginate 'repos/<owner>/<repo>/milestones?state=all&per_page=100' \
  | jq --arg t '<title>' '.[] | select(.title == $t) | {number, state}'
gh api repos/<owner>/<repo>/milestones -f title='<title>'
```

Run the read first. An open match needs no write; a closed one is a stop; two matches are a stop
that names both. Otherwise create it, and verify by running the read again: it must print exactly
one milestone, `open`. The ensure form never passes `-f state` and never PATCHes an existing
milestone.

`milestone close <name>`:

```
gh api --paginate 'repos/<owner>/<repo>/milestones?state=all&per_page=100' \
  | jq --arg t '<title>' '.[] | select(.title == $t) | {number, state}'
gh api --method PATCH repos/<owner>/<repo>/milestones/<number> -f state=closed
gh api repos/<owner>/<repo>/milestones/<number> --jq '{title, state}'
```

Run the read first. No match is a stop that names the milestones that exist, from the same call with
`--jq '.[].title'`; two matches are a stop that names both; a closed match needs no write. Otherwise
PATCH only `state`, then verify with the last read: the same title, `closed`. Never touch an issue.

`milestone list`:

```
gh api --paginate 'repos/<owner>/<repo>/milestones?state=all&per_page=100' \
  --jq '.[] | {number, title, state, url: .html_url}'
```

Report every line, sorted by number. No output means the repository has no milestones.

`milestone show <name>`: resolve the title with the ensure form's read, then count its issues from
the unfiltered list, by the reading rules:

```
gh issue list --repo <owner/repo> --state all --limit 1000 \
  --json number,state,stateReason,labels,milestone \
  | jq --arg t '<title>' '<prelude> length as $rows | map(select(all(.labels[]; .name != "wkc-run"))) |
       {rows: $rows,
         counts: ([.[] | select(.milestone.title == $t) | status]
                  | group_by(.) | map({key: .[0], value: length}) | from_entries)}'
```

When `rows` equals the limit, rerun with a higher one; never report counts from a full page. The
total is the sum of `counts`, and an empty milestone has a total of zero. Report `inconsistent` and
`closed, no reason` on their own lines.
Never use the milestone's `open_issues` or `closed_issues`: they count pull requests, and a closed
issue is not necessarily `done`.

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
entry's `blockers`, then its closed blockers from the blocker query. Stop at `done` or `cancel`; for
a `duplicate`, continue at its `duplicateOf`. Reaching the blocked issue is a cycle: refuse and name
the path. GitHub refuses only self-links and two-issue cycles.

The endpoint takes the blocker's database id, not its number or `node_id`:

```
gh api repos/<owner>/<repo>/issues/<blocker number> --jq .id
gh api --method POST repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<that id>
gh issue view <n> --repo <owner/repo> --json blockedBy --jq '[.blockedBy.nodes[].number]'
```

The blocker's number must be in the list.

## unlink

```
gh issue view <n> --repo <owner/repo> --json blockedBy --jq '[.blockedBy.nodes[] | {number, url}]'
gh api repos/<blocker owner>/<blocker repo>/issues/<blocker number> --jq .id
gh api --method DELETE repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by/<that id>
gh issue view <n> --repo <owner/repo> --json blockedBy --jq '[.blockedBy.nodes[] | {number, url}]'
```

The first read must list the blocker; its `url` names the blocker's repository. Otherwise write
nothing: the DELETE returns `200 OK` for an edge that does not exist, and so does
`gh issue edit --remove-blocked-by`. The last read must lack the blocker and keep every other one.

## Blockers and duplicate originals

`gh issue list` cannot say why a blocker closed, which repository it is in, or which issue a
duplicate duplicates. GraphQL can. The blocker query reads one ticket's blockers:

```
gh api graphql -f owner='<owner>' -f repo='<repo>' -F n=<number> -f query='
  query($owner: String!, $repo: String!, $n: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $n) {
        blockedBy(first: 50) { totalCount nodes {
          number state stateReason(enableDuplicate: true) repository { nameWithOwner }
          duplicateOf { number repository { nameWithOwner } } } } } } }'
```

The issue query reads one issue, in whatever repository `nameWithOwner` names:

```
gh api graphql -f owner='<owner>' -f repo='<repo>' -F n=<number> -f query='
  query($owner: String!, $repo: String!, $n: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $n) {
        number state stateReason(enableDuplicate: true) repository { nameWithOwner }
        duplicateOf { number repository { nameWithOwner } } } } }'
```

Name every issue by `nameWithOwner` and number, never by number alone. A blocker is met when it is
`CLOSED` with `COMPLETED`. A `DUPLICATE` is met when its `duplicateOf` chain, followed with the issue
query, ends at an issue closed as `COMPLETED`. Everything else is unmet: `OPEN`, `NOT_PLANNED`, no
close reason, a duplicate with no `duplicateOf`, a query that fails, a chain that reaches an issue
already in it, and a blocker list longer than its `nodes`. Name where it stopped.

## Run configs

`run create`: when `gh label list --repo <owner/repo> --limit 200 --json name --jq '.[].name'` lacks
`wkc-run`, create it with `gh label create wkc-run --repo <owner/repo> --description "wkc-yolo run config"`.
Then, with the text on standard input:

```
gh issue create --repo <owner/repo> --title 'Run config: <Run branch>' --label wkc-run --body-file -
```

Give it no status label, milestone, or assignee. Its number is the reference.

`run show <n>`:

```
gh api graphql -F o=<owner> -F r=<repo> -F n=<n> -f query='query($o:String!,$r:String!,$n:Int!){
  repository(owner:$o,name:$r){issue(number:$n){body lastEditedAt labels(first:50){nodes{name}}}}}'
```

Refuse when the issue is missing, lacks `wkc-run`, or `lastEditedAt` is not null, which means its
body was edited after it was written. Never read its comments: on a public repository anyone can
comment.

`run close <n>`: `gh issue close <n> --repo <owner/repo> --reason completed`. A closed run config
stays readable with `run show`.
