# Backend: local markdown

One file per ticket under the configured `issues_dir`, named `NNN-slug.md`. No CLI, no server,
nothing to authenticate.

`local` is single session. An assignment made on a branch is invisible from `main` until that branch
merges, so two sessions working the same repository at once need `github` or `linear`.

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

**Where the frontmatter ends.** The frontmatter is the block between the **first** `---` line and
the **next** one. Everything after that is body, and no verb parses the body as YAML. A body may
contain its own `---`, as a horizontal rule or inside a pasted diff or config. Never split on every
`---`, and never take the last block.

**The frontmatter is the state.** `blocked_by` is the only dependency list any verb reads. The
`## Blocked by` section is for a person reading the file: `create` writes it, and `link` keeps it in
step when the file has one, but no verb reads it. No verb adds that section to a body a person wrote.
`## Related` has no frontmatter field, because nothing computes on it.

## Quoting

**Single-quote every string value in the frontmatter, always.** Wrap the value in `'` and double
every `'` inside it. Nothing else inside single quotes is special.

```
title: 'It''s a "mixed" quote: 100% and 日本語 ✅'
```

Quote every value, because the values that break look harmless:

| Written unquoted | What a YAML parser returns |
|---|---|
| `id: 0123` | `83`, parsed as octal |
| `status: null` | a null, not the string |
| `assignee: true` | a boolean |
| `created: 2026-09-18` | a date object, not the string |
| `title: Fix: colon in title` | parse error |
| `title: - leading dash` | parse error |
| `title: [bracketed] {braced}` | parse error |
| `title: trailing spaces   ` | trailing whitespace stripped |

A title is one line, so remove any newline before writing it. Unicode needs no escaping, because the
file is UTF-8.

## Identity

There is no user account on this backend, so `assignee` is the value of `git config user.name`.
When that is unset, stop and say so rather than writing an empty name. `me` means that value in
every form, `assign <id> me from <holder>` included; never write the word `me`. Any other `<who>`
is written as given, because there is no account list to check it against.

## Ids and filenames

Compare ids numerically. `12`, `012`, and `#12` are the same ticket, in an argument, in
`blocked_by`, and in the body section. Write them as three zero-padded digits. A new id is the
highest existing number plus one. When two files share a leading number, report both paths and do
not pick one.

The slug is the title, lowercased, with every run of non-alphanumeric characters collapsed to one
hyphen, no hyphen at either end, and cut at about 50 characters on a word boundary. Alphanumeric
means any Unicode letter or digit, not `[a-z0-9]`. So `émoji ✅ and 日本語 and Ünïcödé` becomes
`émoji-and-日本語-and-ünïcödé`. No verb reads the slug, and renaming a file does not change the
ticket. The rule is exact only so that two sessions produce the same name.

## Missing fields

A person may write a ticket by hand, with partial frontmatter or none. Read each field on its own:

- No `id`: the leading number of the filename.
- No `status`: `backlog`.
- No `assignee`: unassigned.

A missing field is never evidence that someone cleared it on purpose.

A write verb on such a file adds only the fields that verb sets, in a new frontmatter block if there
is none. Leave the body exactly as it was. Do not fill in the rest of the shape, and do not reformat
what is there.

## Per verb

| Verb | File operation |
|---|---|
| `list` | Read the frontmatter of every file in `issues_dir` and filter |
| `show` | Read the one file whole |
| `next` | Read every frontmatter. Keep `status: ready` with an empty `assignee` and every `blocked_by` id in a terminal status. Sort by id |
| `create` | Write one new file with the requested `status`, the ticket shape, and `blocked_by`. No cycle walk, since no file can name the new id yet |
| `assign` | Bare: require `status: ready` with an empty `assignee`, then set `status: in-progress` and `assignee` in one write. Explicit: set `assignee` only, or `''` for `none`. Refuse a terminal status, and refuse an existing holder the caller did not name with `from` |
| `comment` | Append under `## Comments`, adding the heading if the file has none |
| `move` | Read `status` and refuse any move out of `done`, `cancel`, or `duplicate`, then set `status`. Moving to `backlog` or `ready` also sets `assignee: ''`. Moving to `duplicate` also sets `duplicate_of` |
| `link` | Refuse a self-link. Walk the blocker's `blocked_by` through every file that is not terminal; reaching the blocked id is a cycle, so refuse and name the path. Otherwise add the blocker id to `blocked_by`, and update the `## Blocked by` section if the file has one |

`create` needs only one write, because `status` and `blocked_by` sit in the same frontmatter and land
together.

The terminal statuses are `done`, `cancel`, and `duplicate`. A `blocked_by` id with no file behind
it is an open blocker: the ticket stays off the frontier and the report names the missing id.

When the frontier is empty, the same pass over every frontmatter explains it: each held `ready`
ticket, its `assignee` or open `blocked_by` ids, each blocker's `status` and `assignee`, and the
edges to walk for a cycle.

There is no milestone list, so the milestones are the distinct non-empty `milestone` values across
the files. Collect them in the same pass as `list`. A name not among them is a stop that names the
ones that exist.

## Verifying a write

After every mutating verb, re-read the file from disk and parse its frontmatter again with a YAML
parser. Checking the string you meant to write does not count. The failure this catches is a value
that did not survive parsing: a `title` that comes back as `83`, `None`, or a date was written
unquoted.

| Verb | What the re-read must show |
|---|---|
| `create` | the file exists at the new id, `status` is what was asked for, and `blocked_by` holds every `## Blocked by` entry |
| `link` | the blocker id is in `blocked_by`, and the blocker's own `blocked_by` is unchanged |
| `assign` | `assignee` is exactly the name asked for, or empty for `none`, and on the bare form `status` is `in-progress` |
| `comment` | the comment body is under `## Comments` |
| `move` | `status` is the target, and `assignee` is empty after a move to `backlog` or `ready` |

## No commits

Edit the files and stop. Never run `git add`, `git commit`, or `git push` from this skill. The edit
lands with the session's next commit, beside the work it describes. Committing on `main` would also
be a direct push, which a pull-request-gated repository rejects.
