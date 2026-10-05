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
No operation means read-only `status`. Natural-language requests can select `add`, `update`, or `remove`.
Status shows installation locations and the recorded `ref` from `skills-lock.json`, without network access.
A missing `ref` means “Unpinned, default branch”; it does not identify the installed commit or prove current `main` content.
One lock entry covers every copy of a skill, so its recorded version does not verify each copy’s contents.

Additions and updates default to GitHub’s designated Latest release. An explicit release uses a direct lookup and its exact tag.
Request `main` explicitly for an unpinned installation. Public access requires no GitHub login or release-history scan.
Updates preserve installed names, locations, and copy or symlink mode. They replace local edits without backups or content comparisons.
Fresh installations use the installer’s default mode unless copies are requested.
`add all` selects public skills and excludes `wkc-skills-release`; that maintainer skill can be installed explicitly.

The manager checks source ownership and requires a compatible lock before writes.
An existing lock must have numeric top-level `version: 1`, a `skills` mapping, and usable entries.
Existing destinations without collection ownership are left untouched.
Removal uses explicit names and harnesses. Retained placements block selective removal because shared files or lock ownership can be lost.
The installer can exit zero after printing failures, so any reported failure makes the result incomplete.
Results are reported in the conversation. There are no saved reports, automatic migrations, or recovery workflows.
See [the manager](skills/wkc-manage/SKILL.md) and [its validation runbook](validation/wkc-manage.md).

### Bootstrap legacy installations

Version `v0.0.8` ships `setup` and `tracker`. Install the manager separately from a published release containing it.
The first expected release is `v0.0.14`, pending merge and publication; `v0.0.13` does not contain the manager.
Replace `vX.Y.Z` below with that release’s tag and select the harnesses you use.
Before installation, check that any existing lock has numeric `version: 1` and that the manager destination is unoccupied.

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#vX.Y.Z' --skill wkc-manage -a claude-code -a codex -a kiro-cli -y
```

The manager can report and remove legacy entries belonging to this collection. It does not rename them automatically.
To replace `setup` and `tracker`, request installation of `wkc-setup` and `wkc-tracker`, then separately request removal of the legacy skills.
Removal retains the same restrictions on shared placements and leaves generated project configuration intact.

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
| [`wkc-manage`](./skills/wkc-manage/SKILL.md) | Show recorded versions and install, update, or remove project skills | shipped |
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

Use `wkc-manage remove` to remove collection skills with explicit names and harnesses and report the result.
For direct installer removal, name the skills and the agents you installed to:

```
npx skills@1.7.0 remove wkc-setup wkc-tracker wkc-workflow-diagram wkc-manage -a claude-code -a codex -a kiro-cli
```

If you explicitly installed the internal release skill, remove it separately:

```sh
npx skills@1.7.0 remove wkc-skills-release -a claude-code -a codex -a kiro-cli
```

Removing setup preserves the configuration and context reference it previously wrote.
For a full uninstall, manually delete `docs/dev-agents/` and remove its reference line from `AGENTS.md` or `CLAUDE.md`.
Selective removal stops when another placement of the same skill must remain, including independent copies sharing the lock entry.
The manager does not convert copies or reinstall retained placements to work around that restriction.
Other detected harnesses can cause the installer to retain canonical files even after reporting success.
The manager reports remaining files or ownership as incomplete removal and does not delete canonical files manually.
The other installer forms are documented under [`skills remove`](https://github.com/vercel-labs/skills#skills-remove).

Do not run `npx skills@1.7.0 remove --all`, and do not leave `-a` off, inside a repository that keeps its
own skills in a top-level `skills/` directory. OpenClaw's project path is a bare `skills/`, so a
removal that sweeps every agent resolves to `<repo>/skills/<name>` and deletes the real source,
untracked files included, even for skills that were never installed for that agent
([vercel-labs/skills#1771](https://github.com/vercel-labs/skills/issues/1771)). Against skills
1.5.23 both `remove --all` and `remove setup` with no `-a` destroy `skills/setup/`, while the
explicit `-a` list above leaves it alone. A project that only consumes skills is unaffected; this
repository and any other skill-authoring repository are exactly the layout that gets hit.
