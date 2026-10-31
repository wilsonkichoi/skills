# Backend: local markdown

## Contents
- File shape
- Identity
- Ids and filenames
- Missing fields
- Per verb
- Verifying a write
- Run configs

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

### 2026-09-18 wkc-implement
Append-only, newest last. The author is the calling skill, or `wkc-tracker`.
```

The frontmatter is the block between the first `---` line and the next one. Never parse anything
after it as YAML.

`blocked_by` is the only dependency list any verb reads. `create` writes a `## Blocked by` section,
and `link` and `unlink` update it when the file has one. Never add one to a body a person wrote,
unless `edit` was given one.

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
| `list` | Read every frontmatter in `issues_dir` and filter. Only files directly in it are tickets, never `runs/` |
| `show` | Read the one file whole. For a duplicate, name its `duplicate_of` |
| `next` | Keep `status: ready` with an empty `assignee` and every `blocked_by` id met. Sort by id |
| `create` | Write one file with `status: 'backlog'`, its `blocked_by`, and its `milestone` when given, in one write. No cycle walk. When no other file carries that milestone, say the ticket starts it and name the milestones that exist, so a typo shows |
| `assign` | Bare: require `ready` with no `assignee`, then set `in-progress` and `assignee` in one write. Explicit: set `assignee` only, `''` for `none`. Refuse a terminal status and an unnamed holder |
| `comment` | Append under `## Comments`, adding the heading if missing |
| `move` | Refuse a move out of a terminal status. `backlog` or `ready` also sets `assignee: ''`; `duplicate` also sets `duplicate_of` |
| `milestone <name>` | Write nothing: a milestone exists once a ticket carries it. Report the tickets that already carry it, or that `create` starts it |
| `milestone close` | Write nothing, and say the backend has no milestone state: a milestone is only a value tickets carry |
| `milestone list` | The distinct non-empty `milestone` values across every file, terminal tickets included, each with its ticket count. There is no milestone object, so no id, no state, and no empty milestone: one exists only while a ticket carries it |
| `milestone show` | The files whose `milestone` matches exactly, counted by `status`, terminal ones included |
| `edit` | Set `title`, `milestone` (`''` for `none`, checked as `create` does), and `blocked_by` as given, after the `link` walk on each added id. Replace each given section over the span SKILL.md's `edit` defines, `###` subsections included; add a missing one before `## Comments`. Refuse a `## Comments` section: no verb edits a comment. Leave every other byte alone, in one write |
| `unlink` | Require the id in `blocked_by`, or write nothing and say so. Remove it there, and from `## Blocked by` when that lists it |
| `link` | Refuse a self-link. Walk the blocker's `blocked_by` through files that are not `done` or `cancel`, and from a `duplicate` to its `duplicate_of`; reaching the blocked id is a cycle, so refuse and name the path. Otherwise add the id |

A `blocked_by` id is met when its file is `done`, or `duplicate` with a `duplicate_of` chain that
ends at a `done` file. It is unmet when the file is missing, open, inconsistent, or `cancel`, or the
chain has an empty `duplicate_of`, a missing file, or an id already in it. Name the missing id or
where the chain stopped.

For an empty frontier, the same pass names each held ticket's holder or unmet blockers, each
blocker's status and assignee, and any cycle. Milestones are the distinct non-empty `milestone` values.

## Verifying a write

Re-read the file and parse its frontmatter with a YAML parser.

| Verb | The parse must show |
|---|---|
| `create` | the new id, `status: 'backlog'`, every blocker in `blocked_by`, and `milestone` exactly as given, or empty |
| `edit` | every given field and section as given; every other field, section, and comment unchanged |
| `link` | the blocker in `blocked_by`, and the blocker's own `blocked_by` unchanged |
| `unlink` | the id gone from `blocked_by`, and every other id still there |
| `assign` | `assignee` exactly as asked, or empty; on the bare form, `in-progress` |
| `comment` | the body under `## Comments` |
| `move` | the target `status`; an empty `assignee` after `backlog` or `ready` |

Never run `git add`, `git commit`, or `git push`.

## Run configs

A run config is a file in `issues_dir/runs/`, never a ticket. `run create` writes the text to
`issues_dir/runs/<Run branch with each / as ->.md`, such as `runs/run-m4-20261026T0900.md`, and
refuses when the file exists. A continuation, whose `Continues:` names a prior config, adds
`-phase-<n>` before `.md`, where `<n>` counts the configs in its chain, itself included, such as
`runs/run-m4-20261026T0900-phase-2.md`. The path is the reference. `run show` reads it, and refuses when it is
missing. Nothing shows whether it was edited, so an edit goes undetected. `run close` writes
nothing: the file stays as the run's record.
