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
assignee: ""
blocked_by: ["010", "011"]
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
Comments are append-only, newest last, one `### <date> <skill>` heading each.
```

`blocked_by` in the frontmatter is what the verbs read. The `## Blocked by` section in the body is
what a human reads; `create` writes both from the same list, and `link` updates both.

A ticket whose frontmatter has no `status` reads as `backlog`. A file a human wrote by hand with no
frontmatter at all is still a valid ticket: treat its filename number as the id and its status as
`backlog`.

## Per verb

| Verb | File operation |
|---|---|
| `list` | Read the frontmatter of every file in `issues_dir` and filter |
| `show` | Read the one file whole |
| `next` | Read every frontmatter; keep `status: ready` with an empty `assignee` and every `blocked_by` id in a terminal status; sort by id |
| `create` | New id is the highest existing number plus one, zero-padded to three. Write the file with the ticket shape and the `blocked_by` list |
| `claim` | Set `status: in-progress` and `assignee`, then re-read the file to confirm |
| `comment` | Append under `## Comments` |
| `move` | Edit `status`. Moving to `backlog` also sets `assignee: ""` |
| `link` | Add the blocker id to `blocked_by` and to the `## Blocked by` section |

For `next`, "in a terminal status" means `done`, `cancel`, or `duplicate`. A blocker file that does
not exist is an open blocker: the ticket stays off the frontier and the report names the missing id.

## The tracker does not commit

Edit the files and stop there. Never run `git add`, `git commit`, or `git push` from this skill.
The edit lands with whatever commit the session makes next, alongside the work it describes.

Committing the claim on `main` before branching, which is what the predecessor did, is a direct
push to `main` and a pull-request-gated repository rejects it. Do not reach for it.
