# Backend: local markdown

One file per ticket under the configured `issues_dir`, named `NNN-slug.md`. No CLI, no server,
nothing to authenticate.

`local` is single session. An assignment made on a branch is invisible from `main` until that branch
merges, so two sessions working the same repository at once need `github` or `linear`. `setup` says
this when the user picks local.

## File shape

```markdown
---
id: '012'
title: 'CSV export endpoint'
status: 'ready'        # backlog | ready | in-progress | in-review | done | cancel | duplicate
assignee: ''           # git config user.name, or empty
blocked_by: ['010', '011']
duplicate_of: ''       # only when status is duplicate
milestone: ''
created: '2026-09-18'
---

## What to build
…

## Acceptance criteria
- [ ] …

## Blocked by
- 010
- 011

## Related
- 031

## Notes
…

## Comments

### 2026-09-18 implement
Comments are append-only, newest last, one `### <date> <author>` heading each. The author is the
skill that wrote it, or `tracker` when a person invoked this skill directly.
```

**Where the frontmatter ends.** It is the block between the **first** `---` line and the **next**
one. Everything after that second line is body, and no verb parses it as YAML, ever. A body is free
to contain a `---` of its own, as a horizontal rule or inside a pasted diff or config, and a reader
that splits on every `---`, or that takes the last block rather than the first, turns an ordinary
ticket into a parse error or, worse, reads somebody's pasted YAML as the ticket's state.

## Quoting

**Every string value in the frontmatter is single-quoted, always, with no exceptions for values that
look safe.** To quote a value, wrap it in `'` and double every `'` already inside it. That is the
whole rule, and it is the entire YAML escaping story for single-quoted scalars: nothing else inside
them is special.

```
title: 'It''s a "mixed" quote: 100% and 日本語 ✅'
```

Quote unconditionally rather than case by case, because the values that break are the ones that look
harmless:

| Written unquoted | What a YAML parser returns |
|---|---|
| `id: 0123` | `83`, parsed as octal |
| `status: null` | a null, not the string |
| `assignee: true` | a boolean |
| `created: 2026-09-18` | a date object, not the string |
| `title: Fix: colon in title` | parse error |
| `title: - leading dash` | parse error |
| `title: [bracketed] {braced}` | parse error |
| `title: 'trailing spaces   '` unquoted | trailing whitespace stripped |

A title is one line. Strip any newline out of it before writing, since a multi-line value needs a
block scalar and nothing here needs one. Unicode needs no escaping at all: the file is UTF-8 and
single quotes carry it through unchanged.

Round-tripped through a YAML parser across 23 titles covering colons, hashes, `@`, apostrophes,
double quotes, percent signs, leading dashes and question marks, brackets and braces, leading and
trailing spaces, backslashes, pipes, angle brackets, tabs, anchors and aliases, the bare words
`null` and `true`, a leading-zero number, a date, CJK, accented Latin, an emoji, and a mixed case
combining several at once. All 23 came back byte-identical.

**The frontmatter is the state.** `blocked_by` is the only dependency list any verb reads. The
`## Blocked by` section in the body is there for a human reading the file: `create` writes it, and
`link` keeps it in step when the file has one, but nothing ever reads it back. Two readers of one
fact is exactly what the skill's own rules forbid, so there is one reader. A file with no such
section is not missing anything, and no verb adds one to a body a human wrote.

`## Related` has no frontmatter field and needs none. Nothing computes on it, so there is nothing to
keep in step: `create` writes whatever the ticket gave it and every other verb leaves it alone.

**Identity.** There is no user account on this backend, so `assignee` is the value of
`git config user.name`. When that is unset, stop and say so rather than writing an empty name. An
explicit `assign <id> <who>` writes the name as given, since there is no account here to check it
against and no way to tell a typo from a colleague who has never touched this repository.

**Ids.** Compare ids numerically. `12`, `012`, and `#12` are the same ticket, in an argument, in
`blocked_by`, and in the body section. Write them as the zero-padded three-digit form. A new id is
the highest existing number plus one. Two files sharing a leading number is a repository someone
merged badly: report both paths and do not pick one.

**Filenames.** The slug is the title, lowercased, with every run of non-alphanumeric characters
collapsed to a single hyphen and no leading or trailing hyphen, cut at roughly 50 characters on a
word boundary. Alphanumeric means a Unicode letter or digit, not `[a-z0-9]`, so `日本語` and
`Ünïcödé` survive into the name while `✅`, `%` and punctuation collapse:
`émoji ✅ and 日本語 and Ünïcödé` gives `émoji-and-日本語-and-ünïcödé`. Reading it as ASCII gives
`-and--and-` instead, which is a different filename for the same ticket.

It is decoration. Nothing reads it, and renaming a file does not change the ticket. The algorithm is
written out anyway so that two sessions filing the same ticket produce the same name.

**Missing fields.** A ticket with no `status` reads as `backlog`. A file a human wrote by hand with
no frontmatter at all is still a valid ticket: its id is the leading number of the filename and its
status is `backlog`. A write verb on such a file adds a frontmatter block with only the fields that
verb sets, leaving the body exactly as the human wrote it. Do not backfill the rest of the shape,
and do not reformat what is there.

That leaves a file whose frontmatter is real but partial, which is the ordinary state of a
hand-written ticket a verb has touched once. Every rule above still applies field by field: a
missing `id` comes from the filename exactly as it does when there is no frontmatter at all, a
missing `status` reads as `backlog`, and a missing `assignee` is unassigned. The frontmatter is
authoritative for what it contains and silent about the rest; it is never evidence that a field was
deliberately cleared.

## Per verb

| Verb | File operation |
|---|---|
| `list` | Read the frontmatter of every file in `issues_dir` and filter |
| `show` | Read the one file whole |
| `next` | Read every frontmatter; keep `status: ready` with an empty `assignee` and every `blocked_by` id in a terminal status; sort by id |
| `create` | Write a new file with `status: backlog`, the ticket shape, and `blocked_by`, then apply the requested status last |
| `assign` | Bare: require `status: ready` with an empty `assignee`, then set `status: in-progress` and `assignee` in the same write. Explicit: set `assignee` only, refuse a terminal status, and refuse an existing holder the caller did not name with `from` |
| `comment` | Append under `## Comments` |
| `move` | Read `status` first and refuse any move out of `done`, `cancel`, or `duplicate`; otherwise edit `status`. Moving to `backlog` or to `ready` also sets `assignee: ''`; moving to `duplicate` sets `duplicate_of` |
| `link` | Refuse a self-link, and walk the blocker's `blocked_by` through every file that is not terminal: reaching the blocked id is a cycle, so refuse and name the path. Otherwise add the blocker id to `blocked_by`. Rewrite the `## Blocked by` section to match when the file has one, and leave the body alone when it does not |

For `next`, "in a terminal status" means `done`, `cancel`, or `duplicate`. A `blocked_by` id with no
file behind it is an open blocker: the ticket stays off the frontier and the report names the
missing id.

When the frontier is empty, the same pass over every frontmatter holds the whole explanation: each
`ready` ticket left out, its `assignee` or its open `blocked_by` ids, each blocker's `status` and
`assignee`, and the edges to walk for a cycle. No second read is needed.

There is no milestone registry here, so the milestones are the distinct non-empty `milestone` values
across the files. `list <status> <milestone>` reads them all anyway, so collect that set in the same
pass: a name not in it is a stop naming the milestones that exist, never an empty list.

## Verifying a write

A file write has no exit code worth trusting either. After every mutating verb, re-read the file
from disk and parse its frontmatter again. Checking the string you were about to write is not a
verification; the failure this catches is a value that did not survive the round trip, which is
exactly what the quoting rule above exists to prevent and exactly what a naive check would miss.

| Verb | What the re-read must show |
|---|---|
| `create` | the file exists at the new id, `status` is what was asked for, and `blocked_by` holds every entry from `## Blocked by` |
| `link` | the blocker id is in `blocked_by`, and the blocker's own `blocked_by` is unchanged |
| `assign` | `assignee` holding exactly the name asked for, and `status: 'in-progress'` as well on the bare form |
| `comment` | the comment body is under `## Comments` |
| `move` | `status` is the target, and `assignee` is empty after a move to `backlog` or to `ready` |

Re-parse rather than re-read as text. A `title` that comes back as `83`, `None`, or a date object
means the value was written unquoted, and the ticket is now lying about itself in a way no string
comparison against the original will catch.

## The tracker does not commit

Edit the files and stop there. Never run `git add`, `git commit`, or `git push` from this skill.
The edit lands with whatever commit the session makes next, alongside the work it describes.

Committing the assignment on `main` before branching, which is what the predecessor did, is a direct
push to `main` and a pull-request-gated repository rejects it. Do not reach for it.
