# skills

Skills for an AI software development lifecycle: research, architecture, planning, ticketing,
implementation, review, and release. They are small, hand-maintainable markdown files rather than a
framework. Nothing here fires on its own; every skill runs only when you invoke it by name.
note: Kiro has no setting to suppress automatic activation.

## Install

Name the agents you want with `-a`, and create their project directories first:

```
mkdir -p .claude .kiro
npx skills@latest add wilsonkichoi/skills -a claude-code -a codex -a kiro-cli
```

Both halves are needed. A project-scope install skips the symlink for any non-universal agent whose
directory does not already exist in the repo, even when you selected that agent by hand, and it
reports success either way ([vercel-labs/skills#2071](https://github.com/vercel-labs/skills/issues/2071)).
Codex is unaffected because it reads the universal `.agents/skills/`, and `.claude/` is exempt by
name in the installer, so in practice `.kiro/` is the one that has to exist beforehand. A global
install (`-g`) skips the gate entirely.

Pin a version instead of tracking the tip:

```
npx skills@latest add wilsonkichoi/skills@v0.0.2 -a claude-code -a codex -a kiro-cli
```

The installer writes the skills into your repo as ordinary files you own and can edit. It supports
Claude Code, Codex, Kiro CLI, and other agents. Tags come from the release process in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Quickstart

Run `setup` once per repository:

| Harness | Invocation |
|---|---|
| Claude Code | `/setup` |
| Codex | `$setup` |
| Kiro CLI | `/setup` (2.1 or later) |

It interviews you about your issue tracker and your product docs, writes
`docs/dev-agents/config.md`, and adds one reference line to your `AGENTS.md` or `CLAUDE.md` so
every session loads that config. Every other skill reads the same file.

## Skills

The roster below is the plan, not a promise. Skills arrive one at a time so each one gets read and
validated before the next starts. See [AGENTS.md](./AGENTS.md) for how a skill is ported.

| Skill | What it does | Status |
|---|---|---|
| [`setup`](./skills/setup/SKILL.md) | Configure a repository to use these skills | shipped |
| `tracker` | Read and write issues against GitHub, Linear, or local markdown | next |
| `research` | Gather raw material, transcripts, and prior art into notes | planned |
| `architect` | Turn product intent into `SPEC.md` | planned |
| `plan` | Break a spec into milestones and tasks with dependencies | planned |
| `create-ticket` | Write one well-formed ticket into the tracker | planned |
| `backlog` | Groom, refine, and re-order the queue | planned |
| `implement` | Take a ticket to a pull request | planned |
| `code-review` | Review a pull request against its ticket | planned |
| `verify` | Check the work against the ticket's acceptance criteria | planned |
| `git-fu` | Branch, rebase, merge, and conflict work | planned |
| `release` | Cut a tagged release | planned |
| `yolo` | Run the loop unattended across several tickets | planned |

## What `setup` writes

```
docs/dev-agents/
  config.md      # tracker choice, doc paths, project conventions
  rules/         # promoted learnings, one file per rule
  issues/        # only when the tracker is local markdown
```

Plus one line in your `AGENTS.md` or `CLAUDE.md` pointing at `config.md`. `PRD.md`, `SPEC.md`, and
`ROADMAP.md` live wherever you tell `setup` they live, and are written by `research`, `architect`,
and `plan` rather than by `setup`.

## Uninstall

Name the skills and the agents you installed to:

```
npx skills@latest remove setup -a claude-code -a codex -a kiro-cli
```

The other forms are documented under
[`skills remove`](https://github.com/vercel-labs/skills#skills-remove). Then delete what `setup`
wrote: `docs/dev-agents/` and the one reference line it added to your `AGENTS.md` or `CLAUDE.md`.

Do not run `npx skills remove --all`, and do not leave `-a` off, inside a repository that keeps its
own skills in a top-level `skills/` directory. OpenClaw's project path is a bare `skills/`, so a
removal that sweeps every agent resolves to `<repo>/skills/<name>` and deletes the real source,
untracked files included, even for skills that were never installed for that agent
([vercel-labs/skills#1771](https://github.com/vercel-labs/skills/issues/1771)). Against skills
1.5.23 both `remove --all` and `remove setup` with no `-a` destroy `skills/setup/`, while the
explicit `-a` list above leaves it alone. A project that only consumes skills is unaffected; this
repository and any other skill-authoring repository are exactly the layout that gets hit.
