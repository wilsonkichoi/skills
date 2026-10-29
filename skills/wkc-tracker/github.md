# Backend: GitHub Issues

## Contents
- Running the backend
- Verbs
- Input
- Output and exit codes
- What the script holds to
- Not in the script

Every verb runs through `github.py`, in the directory this file is in. It reads, checks the verb's
precondition, writes, and verifies with a separate read, so the safeguards in SKILL.md hold on every
call. Never write a `gh` or `jq` query in its place, even a shorter one that looks equivalent: a
hand-written query drops the checks that live in the script. In validation, a session that had
read the earlier, query-by-query version of this file in full still counted a milestone with its
own `jq` and no completeness check.

## Running the backend

```
uv run --script "<skill dir>/github.py" --repo <owner/repo> <verb> [args]
```

`<skill dir>` is the directory holding this file, as an absolute path, such as
`/path/to/project/.claude/skills/wkc-tracker`. `--repo` is the `origin` remote's `OWNER/REPO`;
without it, the script reads `origin` in the current directory. The script works from any
directory.

It needs `uv` and an authenticated `gh` against a host with native issue dependencies. `uv` runs
the script in an environment it manages; there is no virtual environment to create or activate, and
the script uses only the Python standard library. When a host lacks issue dependencies, every read
stops with exit 4 and suggests the `local` backend.

## Verbs

| SKILL.md verb | `github.py` arguments |
|---|---|
| `list [status] [milestone]` | `list [--status <status>] [--milestone <title>]` |
| `show <id>` | `show <n>` |
| `next` | `next` |
| `create <ticket>` | `create --title <title> --body-file <file> [--blocked-by <ref>]... [--milestone <title>]` |
| `edit <id> <changes>` | `edit <n> [--title <title>] [<one body change>] [--blocked-by <ref>... \| --no-blockers] [--milestone <title> \| --no-milestone]` |
| `assign <id>`, `assign <id> me` | `assign <n>` |
| `assign <id> <who> [from <holder>]` | `assign <n> <who> [--from <holder>]...` |
| `assign <id> none [from <holder>]` | `assign <n> none [--from <holder>]...` |
| `comment <id> <body>` | `comment <n> --body-file <file>` |
| `move <id> <status> [original]` | `move <n> <status> [--original <ref>]` |
| `link <id> blocked-by <id>` | `link <n> <blocker ref>` |
| `unlink <id> blocked-by <id>` | `unlink <n> <blocker ref>` |
| `milestone <name>` | `milestone ensure <title>` |
| `milestone close <name>` | `milestone close <title>` |
| `milestone list` | `milestone list` |
| `milestone show <name>` | `milestone show <title>` |
| `run create <text>` (store `tracker`) | `run create --run-branch <branch> --body-file <file>` |
| `run show <ref>`, `run close <ref>` | `run show <n>`, `run close <n>` |

## Input

- `<status>` is one of the seven names exactly. Turning a person's words into one, or asking when
  they name none, stays with you, as SKILL.md's `move` row says.
- Text goes in a file, never on the command line: a ticket body, a comment, a run config, and an
  edit's text. `-` reads standard input, for one file per call.
- The script treats ticket text as opaque. It never reads Markdown, so it never finds a section or
  a dependency in a body. You read the ticket, decide what changes, and pass exact text and
  explicit edges.
- Native issue dependencies are the edge record. `## Blocked by` in a body is for readers; keep it
  in step with the edges you pass. For `create`, pass one `--blocked-by` per entry of the body's
  `## Blocked by`, or none. For `edit`, `--blocked-by` given one or more times is the new edge set,
  `--no-blockers` removes every edge, and neither leaves the edges alone. Update the body's
  `## Blocked by` in the same call when it changes.
- An edit takes at most one body change:
  - `--old-text-file <a> --new-text-file <b>` replaces text that appears exactly once in the body.
    Copy it from `show`'s `body`, line endings included. To change a section, the old text is that
    whole section as SKILL.md defines it; to add a section, use an anchor that appears once, such
    as the section it goes after, and give the anchor plus the new section as the new text.
  - `--append-file <file>` adds the text at the end of the body, exactly as given; include the
    blank line it needs.
  - `--body-file <file> --expected-sha256 <digest>` replaces the whole body. The digest is
    `body_sha256` from the `show` you read it with.
  `--expected-sha256` also works with the other two. A missing or repeated old text, or a body
  whose digest differs, is refused and nothing is written: read the ticket again and decide.
- A blocker ref, `--blocked-by`, and `--original` take `#12`, `12`, `owner/repo#12`, or an issue
  URL; a bare number is this repository. Repository names are case-insensitive. A pull request URL is refused.
- `run create` titles the issue `Run config: <branch>`, from the config's `Run branch`.

## Output and exit codes

The script prints one JSON object. `ok` is `true` on success, with the verb's result. On failure,
`error` and `message` say what stopped it, plus any details, such as the milestones that exist or
the cycle's path.

| Exit | `error` | Meaning |
|---|---|---|
| 0 | | The read succeeded, or the write verified |
| 1 | `refused` | A precondition failed. Nothing was written |
| 2 | | Usage error, on standard error |
| 3 | `unverified` | A write ran, and the re-read does not match or only part landed. Details report confirmed effects when known |
| 4 | `read_failed` | `gh` failed, or data was missing, malformed, or incomplete. Nothing was written |

Report a `refused` or `read_failed` result as the stop SKILL.md describes. For `unverified`, read
the ticket before anything else: the script never retries a write that may have landed, such as a
comment or a create. A failure after any write request exits 3, including a failed verification
read or a claim that lost its tie-break.

`list` gives each ticket's number, title, status, assignees, milestone, and blockers, and the
inconsistent tickets apart. `show` adds the body, its `body_sha256`, comments, labels, each
blocker's verdict, and a duplicate's chain. `edit` returns the new `body_sha256`. `next` gives
`frontier`, `held` with each unmet blocker's status, holder, and reason, `inconsistent`,
`open_counts`, `cycles`, and `blocker_graph`. The graph includes transitive blockers and
unreadable references. Cycles use issue numbers within this repository and full refs
when they cross repositories. An empty frontier is explained from these.
`milestone show` gives `total`, `counts` for every status, and `open_or_unclean`. Whether that
means `wkc-plan close` is the caller's call: the script never closes a milestone it shows.
`run show` gives the config's `text` and its `state`. A closed run config stays readable with
`run show`, so `run close` verifies the `CLOSED` state. The script never reads a run config's
comments: on a public repository anyone can comment.

## What the script holds to

- Lists read every issue unfiltered, never through `--label`, `--milestone`, or `--search`, and
  raise the limit until a page comes back short. Run configs, labeled `wkc-run`, never appear in a
  list, the frontier, or a count, and a ticket verb refuses one.
- Ticket verbs refuse pull request numbers before writing. `gh issue view` can return a pull
  request, so the script checks its URL before treating it as a ticket.
- A milestone is matched by exact title against every milestone, closed ones included, read in full.
- A blocker is met only when it is `done`, or a duplicate whose chain ends at `done`. Blockers are
  read in full with their repository; a duplicate chain that loops or breaks is unmet.
- `link` and an `edit` that adds edges walk the blockers first and refuse a cycle with its path.
- Ticket text is never parsed. Edges come only from explicit arguments, and a body change is
  an exact replacement, an append, or a whole body checked against its digest. Every other byte
  of the body stays as it was.
- An edit applies its body change to a read taken right before the write and checks it again
  there. GitHub has no conditional write, so a change another session makes between that read
  and the write can still be lost; the digest and the exact old text narrow that window, they do
  not close it.
- A closed issue carries no status label; `done`, `cancel`, and `duplicate` are close reasons.
- Writes send text through standard input, never through a shell or a query string.
- A comment verifies only when the number of comments with its exact body increases. An earlier
  identical comment cannot verify a dropped write or count as a new comment after a failed request.
- Text is UTF-8 everywhere, as `gh` uses it: the script's input and output and what it exchanges
  with `gh`. A non-UTF-8 locale, such as a Windows code page, changes none of it. Files and
  standard input keep their line endings, and an edit keeps the rest of the body byte for byte.

`tools/wkc-tracker/test_github.py` in the source repository tests each of these.

## Not in the script

- The `github-variable` and `command` run config stores in SKILL.md section 6 are not this
  backend: run their `gh variable` or `<cmd>` commands as SKILL.md gives them.
- Pull request reads, such as `gh pr view`, belong to the calling skill, not to a tracker verb.
