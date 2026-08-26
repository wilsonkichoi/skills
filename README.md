# skills

Skills for an AI software development lifecycle: research, architecture, planning, ticketing,
implementation, review, and release. They are small, hand-maintainable markdown files rather than a
framework. Nothing here fires on its own; every skill runs only when you invoke it by name.
note: Kiro has no setting to suppress automatic activation.

## Install

```
npx skills@latest add wilsonkichoi/skills
```

Pin a version instead of tracking the tip:

```
npx skills@latest add wilsonkichoi/skills@v0.0.2
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

Uninstalling is deleting `docs/dev-agents/` and that one reference line.
