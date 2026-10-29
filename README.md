# skills

Skills for an AI software development lifecycle: research, architecture, planning, ticketing,
implementation, review, and release. They are small, hand-maintainable markdown files rather than a
framework. Manual invocation is the default. `wkc-setup`, `wkc-workflow-diagram`, and `wkc-skills-release`
require explicit invocation on Claude Code and Codex; Kiro has no documented setting to suppress automatic activation.
`wkc-tracker` opts into model invocation, so a model or another skill can read and
change ticket state without a typed command. `wkc-help` does too, so a plain question about these
skills or their installation reaches it. `wkc-backlog` does too, so a model can hand it a change when
a person or `wkc-yolo` asked for that work. `wkc-architect` and `wkc-plan` do too, so a model, or
`wkc-backlog` with a change it classifies as a SPEC or ROADMAP change, can start them when a person
asked for that work; `wkc-yolo` never does. The SPEC or ROADMAP stays `Status: draft` until the
person approves it. `wkc-implement` does too, so a model can take a ticket to
a pull request when a person or `wkc-yolo` asked for it. `wkc-code-review` does too, so a model can
run a review round on that pull request when a person or `wkc-yolo` asked for it.

`wkc-code-review` also accepts a ticket id and follows its implementation handoff to the pull request.

All skill identifiers use `wkc-` to distinguish this repository's skills from similarly named skills.
Version 0.0.9 makes the breaking rename from `setup` and `tracker` to `wkc-setup` and `wkc-tracker`,
without compatibility aliases. Future skills can opt into model invocation individually; authors
must declare their intended callers and settings as described in [AGENTS.md](./AGENTS.md#skills).

## Install

Name the agents you want with `-a`:

```
npx skills add wilsonkichoi/skills -s '*' -a claude-code -a codex -a kiro-cli -y
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
npx skills add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' -s '*' -a claude-code -a codex -a kiro-cli -y
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
Install it explicitly by name when releasing this collection, or run `make release` without it. See its
[README](skills/wkc-skills-release/README.md).
Release checks include untracked files, and publication pushes only the authorized tag regardless of Git configuration.

### Update

`npx skills update -p` refetches each installed skill from the `ref` recorded in
`skills-lock.json`. An unpinned install gets the newest default branch. A tag-pinned install stays
on its tag, because tags never move; rerun the pinned `add` above with the new tag instead. `update`
refreshes only skills already installed. Ask `wkc-help` for the details, or to run these commands.

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
| [`wkc-tracker`](./skills/wkc-tracker/SKILL.md) | Read and write issues against GitHub, Linear, or local markdown. `milestone close <name>` closes one GitHub milestone with an exact title match; Linear and local report no milestone state and write nothing. `run create`, `run show`, and `run close` store a `wkc-yolo` run config in the store `run_config` names. Ticket lists and milestone counts exclude run configs. On GitHub, every verb runs through the bundled `github.py`, which needs `uv` and an authenticated `gh` | shipped |
| [`wkc-workflow-diagram`](./skills/wkc-workflow-diagram/SKILL.md) | Create and update offline maps of actual project skills | shipped |
| [`wkc-help`](./skills/wkc-help/SKILL.md) | Answer questions about these skills, and install, pin, update, or remove them | shipped |
| [`wkc-research`](./skills/wkc-research/SKILL.md) | Turn research and an interview into the product requirements document (`PRD.md`) | shipped |
| [`wkc-architect`](./skills/wkc-architect/SKILL.md) | Turn approved product intent and the existing code into the technical specification (`SPEC.md`) and ADRs | shipped |
| [`wkc-plan`](./skills/wkc-plan/SKILL.md) | Turn an approved spec into ordered milestones (`ROADMAP.md`), each with an outcome and an exit check, then hand an approved milestone to `wkc-backlog`. Writes no tickets. `wkc-plan close <milestone>` closes a finished milestone once every ticket is terminal and the person confirms its exit check | shipped |
| [`wkc-backlog`](./skills/wkc-backlog/SKILL.md) | Turn one ROADMAP milestone into tickets with dependencies, or take one change between planning runs (a request, a bug, or work discovered during a ticket), and refine, split, re-block, or cancel existing tickets. Writes every ticket from the SPEC's work-ticket, spike, and decision templates, through `wkc-tracker`. Under a call from `wkc-yolo`, marked by `--run <ref>`, it publishes the change's new tickets at `backlog` with no approval question, and decides or parks the ticket instead of asking. Each `## After merge` step names its `Target:`. Under a run, it moves a requirement out of a ticket only as the run config's `Moved by the person:` line says, and parks any other such move | shipped |
| [`wkc-implement`](./skills/wkc-implement/SKILL.md) | Take one `ready` ticket to a pull request: claim it, branch, build, run the ticket's acceptance checks, open the pull request, and hand it to review at `in-review`. Run `wkc-implement finish <id>` after a person merges to run the ticket's post-merge steps and move it to `done`, or open a follow-up pull request when one fails because of the change. After the move to `done`, it reads and names the ticket's milestone through `wkc-tracker show <id>`. When the milestone has nothing open, it names `wkc-plan close <milestone>`. Fixes a problem the ticket's outcome needs fixed, or one in code it changes, in the same pull request, and hands other out-of-scope work to `wkc-backlog`. Under a call from `wkc-yolo`, marked by `--run <ref>`, it works against the run's branch, decides or parks the ticket instead of asking, returns discovered work to `wkc-yolo`, and on request merges the base branch into an approved pull request and reruns its checks. Under a run, `wkc-implement finish <id> --run <ref>` runs right after the merge into the run branch, at its head: local gates run, a shared non-production gate runs only under a grant in an edit-detecting active config store and within its remaining limits, a production gate never runs, and a follow-up for a failed gate targets the run branch. A code failure with no authorized rerun stays failed, waits for authority, and holds dependents. A new phase has its own grant allowance. Predecessor attempts do not consume it. Command-store grants trust the store's successful `get`. Continuations resolve an initial unnamed PR and require verified terminal evidence for a retired predecessor. `wkc-implement verify <id> --run <ref>` runs a ticket's gates again at the run branch head with no status change. A manual finish counts a pull request merged into a run branch only once that branch has merged into the default branch, and a claim waits on a `done` blocker whose work is only on a run branch. Delivery evidence must show that the carrying PR's merged head contains the blocker's recorded commit, including after a squash merge or config retirement. When the project sets `push_check`, every push runs it first, and a failure blocks the push until the finding is out of the unpushed commits; without one, a manual push warns. A build may start at most `max_ai_test_sessions_per_attempt` additional AI test sessions (default 6), recorded on the ticket before each start, and the handoff reports their use | shipped |
| [`wkc-code-review`](./skills/wkc-code-review/SKILL.md) | Run one review round on a pull request from `wkc-implement`: judge the implementation and its tests against its ticket, acceptance criteria, and the SPEC, fix the verified blocking findings and apply worthwhile in-scope improvements in one commit, and post a verdict comment of `approve`, `fixed`, or `stopped`. Each change is reviewed by another round in a fresh session, up to the project's `max_fix_attempts` (default 5), and only a fresh session approves. Each round may start at most `max_ai_test_sessions_per_attempt` additional AI test sessions (default 6), recorded on the ticket before each start so a restart keeps the count; direct checks come first. A round works in the worktree that has the pull request's branch checked out when that worktree is clean and idle, fast-forwarding it to the reviewed head without overwriting ignored files, and otherwise in a temporary detached worktree it removes afterwards. A failed fast-forward also uses that fallback. A round after a clean update from the base branch only confirms it; a conflict fix gets a full review. A defect in code the pull request changes is a blocking finding; each related fix and why it belongs goes in the PR body's **What changed**. Every round checks the change for secrets, authentication and authorization defects, leaked sensitive data, unneeded network calls, and new dependencies, and the project's `push_check` runs before its fix commit is pushed. Other out-of-scope work goes to `wkc-backlog`, or back to `wkc-yolo` under a run, which never gets a question | shipped |
| [`wkc-skills-release`](./skills/wkc-skills-release/SKILL.md) | Publish this collection's tags and GitHub Releases | shipped, internal |
| `wkc-yolo` | Ask everything up front for a ticket, a wave, or a milestone (readiness, blind spots, security, permissions), then run it unattended on its own run branch: run `wkc-implement` and `wkc-code-review` on each ticket, merge each approved ticket into the run branch, decide what the code reveals from the PRD, SPEC, ROADMAP, and milestone goal, and record each decision. It ends with one run pull request that a person reviews and merges, then asks which release and deploy steps may run and finishes the tickets. The SPEC's run contract says how it selects, parallelizes, and resumes work | planned |
| `wkc-retro` | Review a finished ticket, milestone, or run, and propose rule files for `rules_dir` from what worked and what did not; writes them only on approval | planned |

`wkc-create-ticket`, `wkc-verify`, and `wkc-git-fu` were folded into the rows above.
A milestone or one request becoming tickets, and changing existing tickets, belong to `wkc-backlog`. Running the acceptance checks belongs to the skill that
writes the code, and judging them belongs to the review. Branch and conflict work is part of taking
a ticket to a pull request. `wkc-yolo` follows the implementation, review, and planning skills it
composes, because it only runs skills that already work by hand. It keeps its state in the tracker and git, not in one session, so a run can stop and
resume. Once the run starts, it asks nothing; the decisions it records are what a person reviews
afterwards.

For reported problems, `wkc-backlog` copies the evidence lines into ticket Notes from the original
`Discovered:` comment returned by `wkc-tracker show`, including handoffs from `wkc-code-review`.

## Workflow diagrams

`wkc-workflow-diagram` reads actual definitions and preserves authored content when updating an existing diagram.
Every authored card represents a shipped skill. Systems, outputs, results, and notes appear in that skill's summary or details.
Arrows default to workflow actions and runtime interactions between skills, directed from actor to target when definitions establish the action.
Prerequisites and configuration dependencies stay in node details. Installation and shared configuration do not imply automatic skill invocation.
Only shipped skills are included; internal shipped skills are eligible when requested.
An explicit request can select another arrow meaning, including artifact dataflow. Updates preserve existing edge meaning and layout.
When a changed definition contradicts existing text, it reports the conflict with suggested wording instead of rewriting it.
It does not invoke diagrammed skills. Node.js 22 or newer is required; consumers need no npm installation.
Details open at half the desktop canvas width and use the selected region's colors over a darkened map.
The default zoom is 70%, or smaller when needed to fit the map. Selection centers the card in available space without changing zoom.
Closing slides details away and preserves card position, zoom, and keyboard focus.
Drag the details panel's left edge to resize it on desktop, or focus the edge and use Left/Right, Home, or End.

Inputs, offline HTML, notes, screenshots, and temporary files stay under `docs/dev-agents/diagram/` in the target project.
See [this repository's map](docs/dev-agents/diagram/README.md) and the
[diagram reference](skills/wkc-workflow-diagram/README.md).

## What `wkc-setup` writes

```
docs/dev-agents/
  config.md      # tracker choice, doc paths, review and AI test limits, project conventions
  rules/         # promoted learnings, one file per rule
  issues/        # only when the tracker is local markdown
```

Plus one line in your `AGENTS.md` or `CLAUDE.md` pointing at `config.md`. `PRD.md`, `SPEC.md`, and
`ROADMAP.md` live wherever you tell `wkc-setup` they live, and are written by `wkc-research`, `wkc-architect`,
and `wkc-plan` rather than by `wkc-setup`.

## Uninstall

Name the skills and the agents you installed to:

```
npx skills remove wkc-setup wkc-tracker wkc-workflow-diagram wkc-help wkc-research wkc-architect wkc-plan wkc-backlog wkc-implement wkc-code-review -a claude-code -a codex -a kiro-cli
```

If you explicitly installed the internal release skill, remove it separately:

```sh
npx skills remove wkc-skills-release -a claude-code -a codex -a kiro-cli
```

The other forms are documented under
[`skills remove`](https://github.com/vercel-labs/skills#skills-remove). Then delete what only the
skills read: `docs/dev-agents/config.md` and the one reference line `wkc-setup` added to your
`AGENTS.md` or `CLAUDE.md`. Keep the rest of `docs/dev-agents/` unless you mean to discard it. With
the default paths it holds your PRD, SPEC, ROADMAP, ADRs, rules, local tickets, and workflow diagram.

Do not run `npx skills remove --all`, and do not leave `-a` off, inside a repository that keeps its
own skills in a top-level `skills/` directory. OpenClaw's project path is a bare `skills/`, so a
removal that sweeps every agent resolves to `<repo>/skills/<name>` and deletes the real source,
untracked files included, even for skills that were never installed for that agent
([vercel-labs/skills#1771](https://github.com/vercel-labs/skills/issues/1771)). Against skills
1.5.23 both `remove --all` and `remove setup` with no `-a` destroy `skills/setup/`, while the
explicit `-a` list above leaves it alone. A project that only consumes skills is unaffected; this
repository and any other skill-authoring repository are exactly the layout that gets hit.

`add` has the same hazard. Against skills 1.7.1, `add -a '*'` (and so `add --all`) replaces
`skills/<name>/` with a link into `.agents/skills/`, deleting the source and its untracked files,
and exits 0. Always name the agents with `-a` on `add` too.
