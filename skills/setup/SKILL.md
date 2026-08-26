---
name: setup
description: >
  Configure this project to utilize skills for AI-SDLC.
  Scaffolds the project layout, selects the tracker backend, and writes docs/dev-agents/config.md
disable-model-invocation: true
---

# Setup

- **What it does:** interviews the user about this repository, scaffolds `docs/dev-agents/`, and
  writes `docs/dev-agents/config.md`, which every other skill reads.
- **When to use it:** once per repository, before any other skill in this set. Re-run it to change
  the tracker or bring an older config up to the current fields.
- **Dependencies:** `git`. `gh` for the GitHub tracker, the Linear MCP server for the Linear
  tracker, neither for the local tracker.
- **How to call it:** Claude Code `/setup`, Codex `$setup`.
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
- `git remote -v`, to know whether there is a GitHub remote.
- `AGENTS.md` and `CLAUDE.md` at the root, to know which context file already exists.
- Any product-intent docs already present (`docs/PRD.md`, `docs/product/`, a spec in `AGENTS.md`).
- The project's test command, from its manifest (`package.json` scripts, `pyproject.toml`,
  `Makefile`).

## 2. Interview

Summarise what's present and what's missing. Then take the sections in order. One section, one
answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line
explainer only when the choice genuinely branches; skip the section entirely when exploration
already settled it.

**Section A: Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Most skills will use the
> `tracker` skill to read from and write to it. Currently support `github` / `linear` / `local`.
> Pick the place you actually track work for this repo.

- **GitHub**: issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **Linear**: issues live in linear.app (uses the Linear MCP server). Ask for the team key and the
  project name; both go in the config.
- **Local markdown**: issues live as files under `docs/dev-agents/issues/` in this repo (good for
  solo projects or repos without a remote)
- **Other** (Jira, GitLab, etc.): ask the user to describe the workflow in one paragraph; record it
  as freeform text in the config body and set `issue_tracker: other`

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

- **github:** confirm `gh auth status` succeeds and the repo has a GitHub remote. Create the status
  labels with `gh label create`, skipping any that already exist: `backlog`, `ready`,
  `in-progress`, `in-review`, `done`, `cancel`, `duplicate`. If the authenticated user cannot write
  to the repository, create nothing and report the exact commands a maintainer needs to run.
- **linear:** confirm the Linear MCP server is connected. If it is not, tell the user how to add it
  and stop before writing Linear fields into the config.
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
