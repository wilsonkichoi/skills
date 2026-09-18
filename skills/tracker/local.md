# Backend: local markdown

One file per ticket under the configured `issues_dir`, named `NNN-slug.md`. No CLI, no server,
nothing to authenticate.

`local` is single session. A claim made on a branch is invisible from `main` until that branch
merges, so two sessions working the same repository at once need `github` or `linear`. `setup` says
this when the user picks local.

## File shape

```markdown
---
id: "012"
title: CSV export endpoint
status: ready          # backlog | ready | in-progress | in-review | done | cancel | duplicate
assignee: ""           # git config user.name, or empty
blocked_by: ["010", "011"]
duplicate_of: ""       # only when status is duplicate
milestone: ""
created: 2026-09-18
---

## What to build
…

## Acceptance criteria
- [ ] …

## Blocked by
- 010
- 011

## Notes
…

## Comments

### 2026-09-18 implement
Comments are append-only, newest last, one `### <date> <author>` heading each. The author is the
skill that wrote it, or `tracker` when a person invoked this skill directly.
```

**The frontmatter is the state.** `blocked_by` is the only dependency list any verb reads. The
`## Blocked by` section in the body is there for a human reading the file: `create` writes it, and
`link` keeps it in step when the file has one, but nothing ever reads it back. Two readers of one
fact is exactly what the skill's own rules forbid, so there is one reader. A file with no such
section is not missing anything, and no verb adds one to a body a human wrote.

**Identity.** There is no user account on this backend, so `assignee` is the value of
`git config user.name`. When that is unset, stop and say so rather than claiming with an empty
name.

**Ids.** Compare ids numerically. `12`, `012`, and `#12` are the same ticket, in an argument, in
`blocked_by`, and in the body section. Write them as the zero-padded three-digit form. A new id is
the highest existing number plus one. Two files sharing a leading number is a repository someone
merged badly: report both paths and do not pick one.

**Filenames.** The slug is the title, lowercased, with every run of non-alphanumeric characters
collapsed to a single hyphen and no leading or trailing hyphen, cut at roughly 50 characters on a
word boundary. It is decoration. Nothing reads it, and renaming a file does not change the ticket.

**Missing fields.** A ticket with no `status` reads as `backlog`. A file a human wrote by hand with
no frontmatter at all is still a valid ticket: its id is the leading number of the filename and its
status is `backlog`. A write verb on such a file adds a frontmatter block with only the fields that
verb sets, leaving the body exactly as the human wrote it. Do not backfill the rest of the shape,
and do not reformat what is there.

## Per verb

| Verb | File operation |
|---|---|
| `list` | Read the frontmatter of every file in `issues_dir` and filter |
| `show` | Read the one file whole |
| `next` | Read every frontmatter; keep `status: ready` with an empty `assignee` and every `blocked_by` id in a terminal status; sort by id |
| `create` | Write a new file with `status: backlog`, the ticket shape, and `blocked_by`, then apply the requested status last |
| `claim` | Read the file and require `status: ready` with an empty `assignee`; set `status: in-progress` and `assignee`; re-read to confirm |
| `comment` | Append under `## Comments` |
| `move` | Read `status` first and refuse any move out of `done`, `cancel`, or `duplicate`; otherwise edit `status`. Moving to `backlog` also sets `assignee: ""`; moving to `duplicate` sets `duplicate_of` |
| `link` | Add the blocker id to `blocked_by`. Rewrite the `## Blocked by` section to match when the file has one, and leave the body alone when it does not |

For `next`, "in a terminal status" means `done`, `cancel`, or `duplicate`. A `blocked_by` id with no
file behind it is an open blocker: the ticket stays off the frontier and the report names the
missing id.

## The tracker does not commit

Edit the files and stop there. Never run `git add`, `git commit`, or `git push` from this skill.
The edit lands with whatever commit the session makes next, alongside the work it describes.

Committing the claim on `main` before branching, which is what the predecessor did, is a direct
push to `main` and a pull-request-gated repository rejects it. Do not reach for it.
