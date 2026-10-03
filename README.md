# skills

Skills for an AI software development lifecycle: research, architecture, planning, ticketing,
implementation, review, and release. They are small, hand-maintainable markdown files rather than a
framework. Manual invocation is the default. `wkc-setup`, `wkc-workflow-diagram`, `wkc-manage`, and `wkc-skills-release`
require explicit invocation on Claude Code and Codex; Kiro has no documented setting to suppress automatic activation.
`wkc-tracker` opts into model invocation, so a model or another skill can read and
change ticket state without a typed command.

All skill identifiers use `wkc-` to distinguish this repository's skills from similarly named skills.
Version 0.0.9 makes the breaking rename from `setup` and `tracker` to `wkc-setup` and `wkc-tracker`,
without compatibility aliases. Future skills can opt into model invocation individually; authors
must declare their intended callers and settings as described in [AGENTS.md](./AGENTS.md#skills).

## Install

Name the agents you want with `-a`:

```
npx skills@1.7.0 add wilsonkichoi/skills --skill wkc-setup wkc-tracker wkc-workflow-diagram wkc-manage -a claude-code -a codex -a kiro-cli
```

The installer creates each agent's directory itself. It did not always: a project-scope install
used to skip the symlink for any non-universal agent whose directory did not already exist in the
repo, even when you selected that agent by hand, and reported success either way
([vercel-labs/skills#2071](https://github.com/vercel-labs/skills/issues/2071)). That is fixed in
skills 1.5.26, verified both ways: 1.5.25 leaves no `.kiro/` at all, 1.5.26 creates it with the
symlink. Pinned below 1.5.26, run `mkdir -p .kiro` first or upgrade.

Tracking the tip is fine for now. To pin a version, pass the full git URL with a `#ref`, quoted
because `#` starts a comment in most shells:

```
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' --skill wkc-setup wkc-tracker wkc-workflow-diagram -a claude-code -a codex -a kiro-cli
```

A ref that does not exist fails loudly, which is how you know the pin took effect. The
`wilsonkichoi/skills@v0.0.3` shorthand is not a pin: `@` selects a skill name there, so it either
errors with "No matching skills found for: v0.0.3" or, once you add `-s`, quietly installs from the
default branch. Tags come from the release process in [CONTRIBUTING.md](./CONTRIBUTING.md).

The installer writes the skills into your repo as ordinary files you own and can edit. It supports
Claude Code, Codex, Kiro CLI, and other agents. Tags come from the release process in
[CONTRIBUTING.md](./CONTRIBUTING.md).

The maintainer skill `wkc-skills-release` is hidden from ordinary discovery and bulk installation
through boolean `metadata.internal: true`. Public discovery excludes internal skills; the roster identifies all shipped skills.
Install it explicitly by name when releasing this collection. See its
[bootstrap and pin instructions](skills/wkc-skills-release/README.md).
Release checks include untracked files, and publication pushes only the authorized tag regardless of Git configuration.

### Manage installations

Invoke `$wkc-manage` in Codex, or `/wkc-manage` in Claude Code and Kiro CLI.
No operation means read-only `status`. Natural-language requests can also select `update`, `add`, `remove`, or `reconcile`.
Updates select the highest published stable version, preserve the installed set and placement, and reinstall from its exact tag.
Additions name selected skills; `add all` selects public skills and explicitly excludes `wkc-skills-release`, including under the metadata fallback.

Management supports only raw project lock schema `1`. Malformed locks and other versions stop every operation.
The installer can discard older locks or modify newer ones, so the manager checks before invoking it.
Ownership comes from the lock's source repository. Existing files without that evidence are not claimed by their names.
Copy or symlink mode and accessible harnesses come from the filesystem, because the lock records neither.
Local edits, divergent copies, unknown destinations, and unintended downgrades stop for a concrete decision.
Content verification compares every installed file with an archive of the exact tag, including supporting files.
Offline status reports local evidence with remote identity unverified.

`reconcile` explicitly creates the optional `docs/dev-agents/installed-skills.local.md` diagnostic report.
It uses Git's resolved local exclusion file, including in linked worktrees. The report is not project configuration.
Ordinary sessions do not load it, status recomputes evidence, and mutations do not refresh it.
See [the manager](skills/wkc-manage/SKILL.md) and [its validation report](validation/wkc-manage.md).

### Bootstrap legacy installations

Version `v0.0.8` ships `setup` and `tracker`. Bootstrap only the manager from a published release containing it.
The first expected release is `v0.0.14`, pending merge and publication; `v0.0.13` does not contain the manager.
Replace `vX.Y.Z` below with a verified published tag containing `wkc-manage`:

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#vX.Y.Z' --skill wkc-manage -a claude-code -a codex -a kiro-cli -y
```

Compare the complete installed manager against that tag's Git archive before invocation.
The manager reads migration guidance from the target release, backs up, and verifies replacements before removing legacy names.
Migration requires confirmation for `setup` to `wkc-setup` and `tracker` to `wkc-tracker`.

## Quickstart

Run `wkc-setup` once per repository:

| Harness | `wkc-setup` | Any other skill |
|---|---|---|
| Claude Code | `/wkc-setup` | `/wkc-tracker list` |
| Codex | `$wkc-setup` | `$wkc-tracker list` |
| Kiro CLI | `/wkc-setup` (2.1 or later) | `/wkc-tracker list` |

Codex uses `$name`, not `/name`. Every example below is written for Claude Code; substitute the
prefix for your harness.

Optional `argument-hint` metadata is a Claude Code extension that describes existing arguments during
autocomplete. It does not validate arguments or change skill behaviour. `wkc-tracker` shows
`<verb> [args]`; `wkc-setup` needs no invocation arguments and has no hint.
`[]` marks optional arguments, and `<>` marks required values. Hint display in Codex or Kiro is not promised.

`wkc-setup` interviews you about your issue tracker and your product docs, writes
`docs/dev-agents/config.md`, and adds one reference line to your `AGENTS.md` or `CLAUDE.md` so
every session loads that config. Workflow diagrams can also be created without setup or config.

Then run `wkc-tracker list` in your harness, with the prefix from the table above, to confirm the
backend answers.

## Skills

The roster below is the plan, not a promise. Skills arrive one at a time so each one gets read and
validated before the next starts. See [AGENTS.md](./AGENTS.md) for how a skill is ported.

| Skill | What it does | Status |
|---|---|---|
| [`wkc-setup`](./skills/wkc-setup/SKILL.md) | Configure a repository to use these skills | shipped |
| [`wkc-tracker`](./skills/wkc-tracker/SKILL.md) | Read and write issues against GitHub, Linear, or local markdown | shipped |
| [`wkc-workflow-diagram`](./skills/wkc-workflow-diagram/SKILL.md) | Create and update offline maps of actual project skills | shipped |
| `wkc-research` | Gather raw material, transcripts, and prior art into notes | planned |
| `wkc-architect` | Turn product intent into `SPEC.md` | planned |
| `wkc-plan` | Break a spec into milestones and tasks with dependencies | planned |
| `wkc-create-ticket` | Write one well-formed ticket into the tracker | planned |
| `wkc-backlog` | Groom, refine, and re-order the queue | planned |
| `wkc-implement` | Take a ticket to a pull request | planned |
| `wkc-code-review` | Review a pull request against its ticket | planned |
| `wkc-verify` | Check the work against the ticket's acceptance criteria | planned |
| `wkc-git-fu` | Branch, rebase, merge, and conflict work | planned |
| [`wkc-skills-release`](./skills/wkc-skills-release/SKILL.md) | Publish this collection's tags and GitHub Releases | shipped, internal |
| [`wkc-manage`](./skills/wkc-manage/SKILL.md) | Inspect, update, add, remove, migrate, and verify project installations | shipped |
| `wkc-yolo` | Run the loop unattended across several tickets | planned |

## Workflow diagrams

Invoke `$wkc-workflow-diagram` in Codex or `/wkc-workflow-diagram` in Claude Code and Kiro CLI.
The skill reads actual definitions and preserves authored content when updating an existing diagram.
When a changed definition contradicts existing text, it reports the conflict with suggested wording instead of rewriting it.
It does not invoke diagrammed skills. Node.js 22 or newer is required; consumers need no npm installation.
Closing diagram details restores the previous view before returning keyboard focus, including after Previous/Next navigation.

Inputs, offline HTML, notes, screenshots, and temporary files stay under `docs/dev-agents/diagram/` in the target project.
See [this repository's map](docs/dev-agents/diagram/README.md) and the
[diagram reference](skills/wkc-workflow-diagram/README.md).

## What `wkc-setup` writes

```
docs/dev-agents/
  config.md      # tracker choice, doc paths, project conventions
  rules/         # promoted learnings, one file per rule
  issues/        # only when the tracker is local markdown
```

Plus one line in your `AGENTS.md` or `CLAUDE.md` pointing at `config.md`. `PRD.md`, `SPEC.md`, and
`ROADMAP.md` live wherever you tell `wkc-setup` they live, and are written by `wkc-research`, `wkc-architect`,
and `wkc-plan` rather than by `wkc-setup`.

## Uninstall

Use `wkc-manage remove` for dependency checks, backups, shared-file checks, and independent verification.
For direct installer removal, name the skills and the agents you installed to:

```
npx skills@1.7.0 remove wkc-setup wkc-tracker wkc-workflow-diagram wkc-manage -a claude-code -a codex -a kiro-cli
```

If you explicitly installed the internal release skill, remove it separately:

```sh
npx skills@1.7.0 remove wkc-skills-release -a claude-code -a codex -a kiro-cli
```

Removing setup preserves the configuration and context reference it previously wrote.
Removing a runtime dependency requires informed confirmation.
Codex-only removal with retained Claude Code or Kiro links requires approved conversion to independent copies.
The installer can retain canonical files because other detected harnesses share them, even after reporting success.
Detection uses harness configuration locations; an absent global skill copy does not establish that a harness is absent.
The manager reports that layout constraint instead of claiming removal succeeded.
Backups use `~/.cache/wkc-manage/backups/`, outside checkout and discovery roots, and survive failed operations.
The other installer forms are documented under [`skills remove`](https://github.com/vercel-labs/skills#skills-remove).

Do not run `npx skills@1.7.0 remove --all`, and do not leave `-a` off, inside a repository that keeps its
own skills in a top-level `skills/` directory. OpenClaw's project path is a bare `skills/`, so a
removal that sweeps every agent resolves to `<repo>/skills/<name>` and deletes the real source,
untracked files included, even for skills that were never installed for that agent
([vercel-labs/skills#1771](https://github.com/vercel-labs/skills/issues/1771)). Against skills
1.5.23 both `remove --all` and `remove setup` with no `-a` destroy `skills/setup/`, while the
explicit `-a` list above leaves it alone. A project that only consumes skills is unaffected; this
repository and any other skill-authoring repository are exactly the layout that gets hit.
