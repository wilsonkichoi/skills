# ADR-011: The GitHub tracker backend runs through one approved Python script

Date: 2026-10-29. Status: accepted.

## Context

`wkc-tracker`'s GitHub backend was a Markdown file of `gh` and `jq` commands, one block per verb,
with a shared `jq` prelude pasted in by placeholder. In #88's validation, a Sonnet session that had
read `github.md` in full read tickets with its own field lists and counted a milestone with its own
`jq`: no `rows` completeness check, no `wkc-run` exclusion, no exact title lookup. The outcome was
right on a 20-issue fixture and would not be on a larger one
([#94](https://github.com/wilsonkichoi/skills/issues/94)).

The first fix for #94 told sessions, in three places, to run the backend's commands as written. The
next session read that wording twice and still rewrote every `jq` program that began with the
`<prelude>` placeholder, while copying every command it could run unchanged. Wording did not fix it.

## Options

1. **Wording only.** Gains: no code. Costs: observed not to work.
2. **Each query written out in full, prelude included.** Gains: one Markdown file, every command
   runnable unchanged. Costs: five or six copies of the same `jq` definitions that can drift, and a
   session still assembles multi-step verbs, such as a claim's tie-break or a cycle walk, by hand.
3. **One shared `prelude.jq` file.** Gains: one copy of the status rules. Costs: still a code file,
   and it covers only the `jq` half; the write, verify, and cycle steps stay hand-run.
4. **One Python script that runs every GitHub verb.** Gains: the agent runs one command per verb, and
   the reads, checks, writes, and verification are the same on every call and testable without a
   model. Fewer tokens per verb. Costs: code in an installed skill, against the no-scripts default,
   and `uv` becomes a prerequisite of the GitHub backend.

## Decision

Option 4, approved by the maintainer for #94. `skills/wkc-tracker/github.py` is one standard-library
Python file run with `uv run --script`, with PEP 723 inline metadata and no package, build step, or
virtual environment. It covers `list`, `show`, `next`, `create`, `edit`, `assign`, `move`,
`comment`, `link`, `unlink`, the four milestone verbs, and the `tracker` run config store. It prints
one JSON object and exits 0 (done), 1 (refused, nothing written), 2 (usage), 3 (a write did not
verify), or 4 (a read failed, nothing written).

The split of responsibility stays: `SKILL.md` owns what each verb means, `github.md` maps verbs to
the script's arguments, and the script carries them out. The agent still chooses the verb, turns a
person's words into a status, decides when to ask, and decides what a result means; the script
never closes a milestone because its counts look complete, and never retries a write that may have
landed.

The agent decides what needs to happen; the script guarantees how it is carried out. The agent reads
and writes ticket Markdown. The script treats ticket text as opaque: it takes dependency edges only
as explicit arguments, and changes a body only by an exact replacement of text that appears once, an
append, or a whole body checked against the SHA-256 of the body the agent read. Native issue
dependencies are the edge record; a body's `## Blocked by` mirrors them for readers.

`AGENTS.md` changes the no-scripts rule to no new helper scripts without a person's explicit
approval, Python preferred, and records this script as an exception.

## Consequences

- The GitHub backend needs `uv` as well as `gh`. `wkc-setup` checks for it.
- Contract tests live in `tools/wkc-tracker/test_github.py`, outside the installed skill, behind
  `make test-tracker`. A behaviour change to the GitHub backend changes the script and its tests.
- Linear and local backends are unchanged. The `github-variable` and `command` run config stores
  stay as `SKILL.md` writes them.
- Validation of the GitHub backend checks that a session runs the script, not which `gh` commands
  it typed.
- An agent keeps a body's `## Blocked by` in step with the edges it passes. The script cannot catch
  a mismatch, by design.
- GitHub has no conditional issue update. The script applies a body change to a read taken right
  before the write and checks the exact old text or the digest there, which narrows a concurrent
  edit's window but cannot close it.

## Amendment: ticket text is opaque (2026-10-29)

The first version parsed Markdown: `create` took edges from the body's `## Blocked by`, and `edit`
replaced whole `## ` sections it found. Ten review rounds on PR #95 kept finding parser defects:
fence lines with trailing text, indented and closed headings, tab-indented fences, fences opened on
a list item's line, and next HTML comments, each able to drop an edge or delete sections while
exiting 0. A hand-written parser cannot match GitHub's rendering, and interpreting a document is
the agent's job, not the script's.

Options: a CommonMark library such as `markdown-it-py` would end the parser defects but keeps
document interpretation in the script and adds a dependency; refusing bodies the parser is unsure
of keeps the parser and refuses valid tickets. The maintainer chose neither: the parser is removed,
and the agent passes explicit edges and exact text, as the Decision above now says.
