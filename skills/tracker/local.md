# Backend: local markdown

One file per ticket under `issues_dir`, named `NNN-slug.md`. One session at a time.

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

## Blocked by
- 010
- 011

## Comments

### 2026-09-18 implement
Append-only, newest last. The author is the calling skill, or `tracker`.
```

The frontmatter is the block between the first `---` line and the next one. Never parse anything
after it as YAML.

`blocked_by` is the only dependency list any verb reads. `create` writes a `## Blocked by` section,
and `link` updates it when the file has one. Never add one to a body a person wrote.

Single-quote every string value, doubling any `'` inside it. Nothing else inside single quotes is
special: write backslashes and Unicode as they are, never escaped. Titles are one line.

## Identity

`assignee` is `git config user.name`; if it is unset, stop. `me` means that value in every form;
never write the word `me`. Any other `<who>` is written as given.

## Ids and filenames

Write ids as three zero-padded digits. A new id is
the highest plus one. When two files share a number, report both and pick neither.

The slug is a short, lowercase, hyphenated form of the title. It carries no meaning; never look a
ticket up by it.

## Missing fields

A hand-written file may lack fields. No `id`: the filename's number. No `status`: `backlog`. No
`assignee`: unassigned. A write adds only the fields its verb sets, in a new frontmatter block if
needed, and leaves everything else untouched.

## Per verb

Terminal statuses are `done`, `cancel`, and `duplicate`.

| Verb | File operation |
|---|---|
| `list` | Read every frontmatter in `issues_dir` and filter |
| `show` | Read the one file whole |
| `next` | Keep `status: ready` with an empty `assignee` and every `blocked_by` id terminal. Sort by id |
| `create` | Write one file with `status: 'backlog'` and its `blocked_by`, in one write. No cycle walk |
| `assign` | Bare: require `ready` with no `assignee`, then set `in-progress` and `assignee` in one write. Explicit: set `assignee` only, `''` for `none`. Refuse a terminal status and an unnamed holder |
| `comment` | Append under `## Comments`, adding the heading if missing |
| `move` | Refuse a move out of a terminal status. `backlog` or `ready` also sets `assignee: ''`; `duplicate` also sets `duplicate_of` |
| `link` | Refuse a self-link. Walk the blocker's `blocked_by` through non-terminal files; reaching the blocked id is a cycle, so refuse and name the path. Otherwise add the id |

A `blocked_by` id with no file is an open blocker; name the missing id. For an empty frontier, the
same pass names each held ticket's holder or open blockers, each blocker's status and assignee, and
any cycle. Milestones are the distinct non-empty `milestone` values.

## Verifying a write

Re-read the file and parse its frontmatter with a YAML parser.

| Verb | The parse must show |
|---|---|
| `create` | the new id, `status: 'backlog'`, every blocker in `blocked_by` |
| `link` | the blocker in `blocked_by`, and the blocker's own `blocked_by` unchanged |
| `assign` | `assignee` exactly as asked, or empty; on the bare form, `in-progress` |
| `comment` | the body under `## Comments` |
| `move` | the target `status`; an empty `assignee` after `backlog` or `ready` |

Never run `git add`, `git commit`, or `git push`.
