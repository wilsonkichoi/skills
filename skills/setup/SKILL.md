---
name: setup
description: Configure this project to utilize skills for AI-SDLC. Scaffolds the project layout, selects the tracker backend, and writes docs/dev-agents/config.md
disable-model-invocation: true
metadata:
  allow_implicit_invocation: "false"
---

# Setup

- **What it does:** interviews the user about this repository, scaffolds `docs/dev-agents/`, and
  writes `docs/dev-agents/config.md`, which every other skill reads.
- **When to use it:** once per repository, before any other skill in this set. Re-run it to change
  the tracker or bring an older config up to the current fields.
- **Dependencies:** `git`. `gh` for the GitHub tracker, the Linear MCP server for the Linear
  tracker, neither for the local tracker.
- **How to call it:** Claude Code `/setup`, Codex `$setup`, Kiro CLI `/setup`.
- **Input:** the current repository, plus the user's answers to the interview.
- **Output:** `docs/dev-agents/config.md`, `docs/dev-agents/rules/`, one reference line in the
  project's context file, and any one-time tracker setup.

Idempotent: safe to re-run; never overwrite existing files without asking.

## 1. Detect mode

Inspect the current directory to determine the state (read the files, don't assume):

- **Greenfield:** empty or near-empty (no source tree).
- **Brownfield:** existing code (source dirs, package manifests, git history).

Also read, before asking anything:

- An existing `docs/dev-agents/config.md`. It keeps the choices the project already made; the
  interview only fills what is missing.
- `git rev-parse --git-dir`, to know whether this is a git repository at all.
- `git remote -v`, to know whether there is a GitHub remote.
- `AGENTS.md` and `CLAUDE.md` at the root, to know which context file already exists.
- Any product-intent docs already present (`docs/PRD.md`, `docs/product/`, a spec in `AGENTS.md`).
- The project's test command, from its manifest (`package.json` scripts, `pyproject.toml`,
  `Makefile`).

**No git repository is the first thing to settle.** Offer `git init` before the interview starts.
Every backend ends at step 7 offering a commit, and the `github` backend cannot have a remote
without a repository to attach it to, so discovering this three sections later means unwinding the
interview.

## 2. Interview

Summarise what's present and what's missing. Then take the sections in order. One section, one
answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line
explainer only when the choice genuinely branches; skip the section entirely when exploration
already settled it.

**Offer the choices, do not make the user type them.** Use a structured question tool only when
the active harness exposes a direct picker. In Codex, use `request_user_input` whenever the active
session permits it, including Default mode with the feature enabled. For Section A, call it with
one question and three options. This example is for a repository without a GitHub remote:

```
request_user_input({
  questions: [{
    header: "Tracker",
    id: "tracker",
    question: "Where should issues live?",
    options: [
      { label: "Local markdown (Recommended)", description: "Store issue files in this repo." },
      { label: "GitHub", description: "Use GitHub Issues." },
      { label: "Linear", description: "Use Linear." }
    ]
  }]
})
```

For a GitHub remote, put GitHub first and mark it `(Recommended)` instead. The Codex picker adds a
free-form choice for Other. Do not use `request_user_input_async` as a substitute: it queues the
question behind `⌥ + ↑ to answer`. In Codex CLI, if the direct tool is unavailable, show this
launch command. It enables the direct picker in Default mode, verified with CLI 0.155.1:

```
codex --enable default_mode_request_user_input
```

Do not change the user's mode or configuration automatically. If continuing without a direct
picker, use the text fallback below. Show all four options, state the recommended default, and
accept one digit as the answer. Never ask anyone to retype a path already on screen: show it and
accept a bare yes.

**Stop at each question.** A text question ends the turn: no tool call after it and no work started
while it is outstanding. A direct picker waits for its answer within the tool call. One section,
one question, one answer.

**Section A: Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Most skills will use the
> `tracker` skill to read from and write to it. Currently support `github` / `linear` / `local`.
> Pick the place you actually track work for this repo.

- **GitHub**: issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **Linear**: issues live in linear.app (uses the Linear MCP server). Ask for the team key and the
  project name; both go in the config.
- **Local markdown**: issues live as files under `docs/dev-agents/issues/` in this repo (good for
  solo projects or repos without a remote). One session at a time: a claim made on a branch is
  invisible from `main` until that branch merges
- **Other** (Jira, GitLab, etc.): ask the user to describe the workflow in one paragraph; record it
  as freeform text in the config body and set `issue_tracker: other`

With no direct picker, ask Section A in this form. Replace the default with the backend supported
by the existing config or repository; use GitHub for a GitHub remote and Local markdown otherwise.
Put that backend first, so `1` always accepts the default.

```
Where should issues live? Default: 1 (GitHub). Reply with one digit.
1. GitHub: GitHub Issues.
2. Linear: linear.app.
3. Local markdown: files in docs/dev-agents/issues/.
4. Other: describe your tracker.
```

**Settle the backend's prerequisites here, before Section B.** A missing prerequisite is a question
to ask now, not a fact to report at the end of the run. The user just chose this backend and is
sitting right there; carrying the problem to step 5 means they answer three more sections without
knowing whether the first one will work.

| Backend | Check | When it is missing |
|---|---|---|
| `github` | `gh auth status`, and a GitHub remote in `git remote -v` | Ask which repository, and offer both answers: an existing one is `git remote add origin <url>`, a new one is `gh repo create <name> --private --source=. --remote=origin`. Creating a repository is the user's call, so offer it and wait for an answer. |
| `linear` | the Linear MCP server answers `list_teams` | Stop. Say how to connect it, and write no Linear fields into the config until it answers. |
| `local` | nothing | |

Write the resolved `OWNER/REPO`, or the resolved team and project, into the config. Never record an
intention to set one up later.

**Section B: Product-intent documents.** Where do the product requirements, the spec, and the
roadmap live? These paths go into the config so later skills read the right files. Defaults are
`docs/dev-agents/PRD.md`, `docs/dev-agents/SPEC.md`, `docs/dev-agents/ROADMAP.md`. For some
projects `AGENTS.md` or `CLAUDE.md` is the doc; point the field at it. Never guess a path into
configuration.

**Section C: Context file.** Which file is this project's entry point for coding agents? Default
`AGENTS.md`. Choose `CLAUDE.md` for a deliberately Claude-Code-only project. A project that already
has a convention keeps it: set `context_file` to the file every harness ultimately reaches, and
never invert an existing direction.

**Section D: Test command.** Confirm the command inferred in step 1, or ask for it. It is what
later skills run before handing work back.

## 3. Scaffold

Everything the dev skills own lives under `docs/dev-agents/`; the project owns everything else.
Create only what is missing:

```
docs/dev-agents/
docs/dev-agents/config.md             # entry point on how to use these skills for AI-SDLC
docs/dev-agents/rules/                # promoted learnings, one file per rule
docs/dev-agents/issues/               # only when issue_tracker: local
```

Add `docs/dev-agents/rules/.gitkeep` so git tracks the directory before the first rule lands.

Do not create empty `PRD.md`, `SPEC.md`, or `ROADMAP.md`. Their paths are recorded in the config;
`research`, `architect`, and `plan` write them. The one exception is step 5, which writes a spec
from an existing codebase.

**Template:** write `docs/dev-agents/config.md` using
[config-template.md](./config-template.md). Keep it simple, drop whatever is not useful, only add
what is necessary. Every field must come from the interview or from step 1; never guess a path into
configuration.

**Existing projects:** an existing `config.md` keeps the choices the project already made. Add the
fields it is missing and report what changed; do not rewrite the body.

**Ownership rule:** the project owns `AGENTS.md` and `CLAUDE.md`. Setup adds at most the single
step 4 reference line there and never moves, consolidates, or rewrites project rules or
context-file content. `rules_dir` defaults to `docs/dev-agents/rules/`; a project with an existing
rules convention may point the field elsewhere instead (for example `.claude/rules/`, which Claude
Code auto-loads natively). Respect the project's choice, and never migrate rule files between
locations uninvited.

## 4. Add the reference line

Add one line to the configured `context_file` so every session loads the dev config:

```
Read dev workflow for AI-SDLC from docs/dev-agents/config.md
```

Skip this step when the line is already there; a re-run must not add a second copy. Brownfield:
append it and touch nothing else. Greenfield with no context file at all: create a lean
one (under 50 lines) naming the project, the tracker backend, and the product-doc paths, with the
reference line at the end.

Claude Code does not auto-load `AGENTS.md`. When `context_file: AGENTS.md` and Claude Code is or
may be in use, also ensure `CLAUDE.md` contains an `@AGENTS.md` import line: create a one-line
`CLAUDE.md` when none exists, append the line when one exists, and never replace an existing body.

## 5. Tracker setup

One-time work for the chosen backend. Report what you did; do not treat a failure here as a reason
to abandon the rest of setup.

- **github:** the remote and `gh auth status` were settled in Section A. Create the four status
  labels with `gh label create`, skipping any that already exist: `backlog`, `ready`,
  `in-progress`, `in-review`. There is no label for `done`, `cancel`, or `duplicate`; those three
  are GitHub close reasons, which is what `tracker` reads and writes. If the authenticated user
  cannot write to the repository, create nothing and report the exact commands a maintainer needs
  to run.
- **linear:** the MCP connection was settled in Section A. Check the team's statuses with
  `list_issue_statuses`, which are per team and shared by every project in it. Seven are required,
  each with the category shown:

  | Required status | Category |
  |---|---|
  | Backlog | `backlog` |
  | Todo | `unstarted` |
  | In Progress | `started` |
  | In Review | `started` |
  | Done | `completed` |
  | Canceled | `canceled` |
  | Duplicate | `duplicate` |

  **Expect In Review to be missing.** A team created from Linear's default template has six
  statuses and no In Review, so this is the ordinary first run rather than an edge case. Say so
  plainly instead of treating it as the user having done something wrong.

  **Any missing one is a stop.** There is no MCP tool that creates or renames a status, so name
  exactly what to add in the team's settings, under which category, and do not write the Linear
  fields into the config until it matches. Do not invent a mapping onto whatever the team happens
  to have: a ticket written to the wrong status lands where nobody is looking.

  **An extra status is a warning, not a stop.** Report it loudly, by name and category, and say that
  tickets parked there are invisible to the frontier and will be reported as unmapped. Then write it
  into the config body under **Tracker notes**, so it is a decision the user can come back to with
  the AI rather than something they have to remember.
- **local:** create `docs/dev-agents/issues/.gitkeep`.
- **other:** nothing to set up. The workflow the user described is the contract.

## 6. Brownfield: architecture archaeology

Offer (do not force) to reverse-engineer the current state into the configured `spec_file`:

1. Survey the codebase: entry points, components, external services, data stores, contracts between
   components, test layout, build and deploy path.
2. Write the spec describing the **current** architecture: components, interfaces, data flow, known
   debt and gaps, marked clearly as debt rather than requirements.
3. Do not invent forward-looking requirements. That is `architect`'s job.

## 7. Report

Offer to commit the scaffold and config. In a fresh repo this creates the root commit that later
task branches need.

Then summarize: mode, tracker backend, files created, one-time tracker setup performed, and
anything the user still has to do themselves.

Next step: confirm the backend responds, using this project's harness. Claude Code `/tracker list`,
Codex `$tracker list`, Kiro CLI `/tracker list`.
