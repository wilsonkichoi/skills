# Backend: GitHub Issues

`gh` CLI, no MCP. Resolve `OWNER/REPO` once from the configured remote and pass `--repo` on every
command, so nothing depends on the working directory.

Native issue dependencies are required, not optional. `gh` 2.97.0 or later exposes them as the
`blockedBy` JSON field. If `blockedBy` comes back `null` on any issue, this host does not have
them: stop and report that, and use the `local` backend instead. There is no fallback to parsing
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

- open with a status label: that status.
- open with no status label: `backlog`. Every human-created and every reopened issue lands here.
- closed: read `stateReason`. A closed issue carries no status label.

Why close reasons rather than seven labels: a `done` label on an issue closed as `not planned` is
two sources of truth that will eventually disagree, and GitHub already stores the reason natively.
This is a deliberate departure from a flat seven-label scheme, and it is reversible for the cost of
three `gh label create` lines.

## Per verb

**list.** Add `--label <status>` for one open status and `--milestone <title>` to scope. `--limit`
defaults to 30, so pass one high enough for the repository.

```
gh issue list --repo <owner/repo> --state open --limit 200 \
  --json number,title,state,stateReason,assignees,labels,milestone,blockedBy
```

For a terminal status, query `--state closed` and filter on `stateReason`. That field is on the
list payload, so `list done`, `list cancel`, and `list duplicate` each read back in one call with
no per-issue fan-out.

**show.**

```
gh issue view <n> --repo <owner/repo> --comments
gh issue view <n> --repo <owner/repo> \
  --json number,title,body,state,stateReason,assignees,labels,milestone,blockedBy
```

**next.** The whole frontier is one command.

```
gh issue list --repo <owner/repo> --label ready --state open --limit 200 \
  --json number,title,assignees,blockedBy \
  --jq '[.[] | select((.assignees|length)==0)
             | select([.blockedBy.nodes[] | select(.state=="OPEN")] | length == 0)]
        | sort_by(.number)'
```

Three guards before you trust that output:

1. A `null` `blockedBy` on any element means the host does not expose dependencies. Stop and report
   it. The `select` would silently match nothing, and `next` must never report an empty frontier
   because the query could not see the edges.
2. Filter on `blockedBy.nodes[].state`, never on `blockedBy.totalCount`. Verified 2026-09-18
   against `gh` 2.97.0: `totalCount` counts closed blockers too, so it stays at 1 after the blocker
   is closed, and a `totalCount == 0` filter would keep every unblocked ticket off the frontier
   forever. The GraphQL schema says the same thing: `issueDependenciesSummary` carries both
   `blockedBy`, which is open blockers only, and `totalBlockedBy`, which is documented as "open and
   closed".
3. `gh` caps `blockedBy.nodes` at 50. When `totalCount` is larger than the number of nodes returned
   the list is truncated and an open blocker may be hidden, so treat that ticket as blocked and say
   why rather than putting it on the frontier.

**create.** Use `--body-file` or a heredoc; a multi-line body does not survive `--body`.

```
gh issue create --repo <owner/repo> --title "<title>" --body-file <file> \
  [--label ready] [--milestone "<title>"]
```

Then run `link` once per entry in the ticket's `## Blocked by` section.

**claim.** One edit, then a re-read.

```
gh issue edit <n> --repo <owner/repo> --add-assignee @me --remove-label ready --add-label in-progress
gh issue view <n> --repo <owner/repo> --json assignees,labels
```

More than one assignee on the re-read means another session won the race. Remove yourself, move the
ticket back to `ready`, and report.

**move, open state to open state.** One edit.

```
gh issue edit <n> --repo <owner/repo> --remove-label <old> --add-label <new>
```

Moving to `backlog` adds `--remove-assignee @me` to the same edit.

**move, open state to a terminal state.** Close first, strip the leftover label second.

```
gh issue close <n> --repo <owner/repo> --reason "completed"
gh issue close <n> --repo <owner/repo> --reason "not planned"
gh issue close <n> --repo <owner/repo> --reason "duplicate" --duplicate-of <original number>
gh issue edit <n> --repo <owner/repo> --remove-label <whichever status label remains>
```

The order is load bearing. A failed strip leaves a closed issue carrying a stale label, which no
open-state query sees. The other order would leave an open, unlabelled issue, and that now reads as
`backlog`.

**comment.**

```
gh issue comment <n> --repo <owner/repo> --body-file <file>
```

**link.** The endpoint takes the blocker's numeric database id, which is not the `#number` and not
the `node_id`.

```
gh api repos/<owner>/<repo>/issues/<blocker number> --jq .id
gh api --method POST repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<that id>
```

## Consistent reads

Every filtered `gh issue list` (`--label`, `--milestone`, `--search`) goes through GitHub's search
API, which is eventually consistent. An issue created or edited seconds earlier can be missing from
the result. A missing ticket in a list is never proof the create failed: re-read it by number with
`gh issue view`, which hits the primary store.

No sub-issues. Nothing in this skill set creates them until `plan` is ported; add the endpoint then.
