# AGENTS.md

Authoring conventions for this repository - the single source of truth for every harness.

## Versioning

`VERSION`

All version fields use semver (`major.minor.patch`). Always use the minimum increment:
- Bug fixes, typos, doc updates: patch (`0.0.1` → `0.0.2`)
- New skills, features, non-breaking additions: minor (`0.0.2` → `0.1.0`)
- Breaking changes (renamed skills, removed features, restructured plugin): major

For now, use patch for everything including new features. Save minor/major bumps for after the plugin has real consumers.

One version per pull request. The first commit on a branch that touches `skills/` bumps `VERSION`
and adds its `CHANGELOG.md` entry. Later commits on that branch keep the version and rewrite that
entry so it describes the branch as a whole. A version names what merges to `main`, not each step
taken to get there.
A version becomes a release when it is tagged `vX.Y.Z` at its merged commit and published as a GitHub Release.

A tag marks a release for people reading the history, and it is what a pinned install points at.
A pushed `v*` tag cannot be moved or deleted, so a bad release costs a new patch version, never a
re-tag.
Pinning takes the full git URL with a `#ref`, quoted:
`npx skills add 'https://github.com/wilsonkichoi/skills.git#v0.0.3'`. A missing ref fails
loudly. The `owner/repo@v0.0.3` shorthand is not a pin, because `@` selects a skill name there.
Adopters who want the tip use `npx skills add wilsonkichoi/skills`.

## Distribution

This repository ships as plain skill directories, installed with one command:

```
npx skills add wilsonkichoi/skills -a claude-code -a codex -a kiro-cli
```

There is no `.claude-plugin/`, no `marketplace.json`, no per-harness distribution tree, and no
consumer build step. Adding one of those is a decision to maintain a second copy of every skill,
so do not add one without a written reason.

The installer copies and symlinks the same directory into whichever harness the user named:
`.claude/skills/` for Claude Code, `.agents/skills/` for Codex, `.kiro/skills/` for Kiro CLI. One
source tree, no per-harness variants.

### Collection releases

`wkc-skills-release` publishes this collection only; adopting projects keep their existing release
and deployment processes. The release rules are code in [`tools/release.mjs`](./tools/release.mjs),
run by `make release`, and its `REPO` constant is the one repository identity. The skill is a thin
entry point: it runs the plan, asks for authorization, and runs the publish command the plan printed.
There is no generic release config because setup config belongs to adopting projects, not collection
publication.
The collection uses one `VERSION` and immutable tags for complete snapshots. Per-skill version stamps
would create competing version records and cannot improve a pin that already selects the entire tree.
The script runs from the release checkout's own `tools/`, so the code that publishes `main` is
`main`'s code, with no installed copy to bootstrap or verify. No release hooks, build system, or
per-harness copies are needed.

`metadata` normally maps strings to strings under the Agent Skills specification. The sole exception
is `wkc-skills-release`'s boolean `metadata.internal: true`, because the `skills` installer checks
`metadata.internal === true` to hide it from public discovery and bulk installation. A string
`"true"` does not work. Explicit installation by name includes it; visibility does not authorize release writes.
Codex, Claude Code, and Kiro CLI loaded the boolean in the recorded validation runs.
Recheck compatibility when metadata or supported harness versions change. If a supported harness rejects the boolean,
remove it from the one shared source and document that direct bulk installation includes the maintainer skill.
Unavailable checks are SKIP, not proof of incompatibility. Record results in its validation runbook.

## Skills

Every skill identifier must start with `wkc-`. Use the same identifier for the directory,
frontmatter `name`, `interface.display_name`, main heading, invocations, and references between skills.

Each skill is a directory under `skills/wkc-<name>/`:

```
skills/wkc-<name>/
  SKILL.md              # frontmatter: name, description, disable-model-invocation (see below)
  agents/openai.yaml    # interface + policy.allow_implicit_invocation (see below)
  <supporting>.md       # templates and references, linked relatively from SKILL.md
  README.md             # optional, only when the skill needs explaining beyond SKILL.md
```

Documentation *about* a skill lives in that skill's directory. When `SKILL.md` cannot carry an
explanation without growing past its own length budget, the answer is `skills/wkc-<name>/README.md`.
Be deliberate about one: the installer copies the **whole skill directory** into every consumer, so
a README ships with it. Write it for someone using the skill. Anything written for someone changing
the skill belongs in this file instead.

The one thing that does not live there is the skill's validation runbook, which is big, goes stale
on its own schedule, and is of no use to an adopter. Runbooks live in [`validation/`](./validation/),
one file per skill, named after it.

Adding any *other* top-level directory is a decision about the shape of the repository. It is the
maintainer's call and not a thing to do in passing.

Manual invocation is the default. A manually invoked skill keeps these settings:

- claude code: `SKILL.md` frontmatter `disable-model-invocation: true`
- codex cli: `agents/openai.yaml` -> `policy: allow_implicit_invocation: false`

A skill may explicitly opt into model invocation, one skill at a time. `wkc-tracker`, `wkc-help`, `wkc-architect`, `wkc-plan`, `wkc-backlog`, `wkc-implement`, and `wkc-code-review` do. Authors
must declare the intended callers in the skill body: people, models, or named skills. Enable
supported invocation settings for each harness when models are intended callers:

- Claude Code: set `disable-model-invocation: false` or omit the restriction.
- Codex implicit selection: set `policy.allow_implicit_invocation: true` or use its documented default, `true`.

Dependencies must name the exact `wkc-` identifier. Report an unavailable or blocked dependency
instead of substituting an unprefixed skill. A dependency declaration does not bypass invocation settings.

Every `SKILL.md` body opens with five fields, in order: **What it does**, **When to use it**,
**Dependencies**, **Input**, and **Output**. The skeleton is in [Skill template](#skill-template).
**Input** explains accepted arguments, their meanings, required context, and existing behaviour
when arguments are omitted. Do not invent arguments or defaults while documenting them.

Optional `argument-hint` frontmatter is a Claude Code extension, outside the Agent Skills standard.
Quote its string value; use `[]` for optional arguments and `<>` for required values.
Replace the template placeholder with accepted arguments, or remove the field when arguments are unnecessary.
Hints guide autocomplete; they do not validate arguments or change runtime behaviour.
Do not promise that Codex or Kiro displays them.
Skill files name skills without a harness prefix, such as `wkc-tracker list`. Keep prefix guidance in the root README's invocation table.

`description` goes on one unquoted physical line, however long.

No scripts unless a skill genuinely cannot be written as prose. Script sprawl and the build steps
around it are the main reason the previous toolkit became unmaintainable.
`wkc-workflow-diagram` is the one recorded exception. Its reason and maintainer build live in
[`tools/workflow-diagram/README.md`](./tools/workflow-diagram/README.md), outside the installed skill.
Maintainer scripts are a separate case. Each one starts from an action repeated by hand, never from a
guess, and lives in `tools/` behind a `Makefile` target. Keep each one a single readable file whose
structure follows the process it replaces, so it can be checked against that process and fixed in
one place. A skill may call one only when the skill runs in this repository, as `wkc-skills-release` does.
Renderer changes must preserve visible keyboard focus when closing details after node navigation.
Details open at half the desktop canvas width with region accents and a darkened backdrop. Selection only centers the card in available space and preserves zoom.
Closing slides details away and keeps the current card position and zoom. Region boxes group cards from the same lane.
Preserve desktop panel resizing by pointer and keyboard, width limits, and the full-width mobile details sheet.
`wkc-workflow-diagram` authors skill cards only, with source-backed action arrows between skills.
Systems, outputs, results, and prerequisites stay in skill summaries or details. Explicit requests can select another arrow meaning, including artifact dataflow.
Updates preserve authored content, edge meaning, and layout. A new default alone never authorizes changing existing edges.

Inputs and outputs between skills stay loose. A skill states what it expects and what it produces,
but does not reject work over formatting. Following rigid steps for ceremony is not the point.
`wkc-backlog` copies a `Discovered:` item's evidence into ticket Notes from the original comment
returned by `wkc-tracker show`, including handoffs from `wkc-code-review`.

`wkc-tracker milestone close <name>` closes exactly one open GitHub milestone with that name and
verifies it with a fresh read. It never checks tickets; the caller decides whether to close.
An already closed milestone needs no write. Linear and local have no milestone state, so the verb
writes nothing and says so. The ensure form, `milestone <name>`, never renames or reopens one.
`wkc-plan close <milestone>` is the caller that decides: it stops while any ticket is open, and
closes only on the person's yes to the milestone's exit check. `wkc-implement finish` only names it.

The lifecycle documents (PRD, SPEC, ROADMAP) are optional, not a pipeline. Each skill uses whatever
exists, and work that fits the current intent skips the earlier stages: do the work, then update the
documents it changed. Document outlines are guidance, scaled to the work, not required headings.

`wkc-implement <id>` builds or reports. Only `wkc-implement finish <id>` runs post-merge gates and
moves a ticket to `done`. The handoff or finish comment identifies the ticket's pull request.
A pull request that merely cites the ticket cannot replace that record. An open follow-up to the
recorded merged pull request can continue an incomplete handoff. Its review state reports the
latest `wkc-code-review` verdict and GitHub's `reviewDecision` as separate records, and offers the
merge step only for an `approve` on the current head; a person merges.

A call is unattended when it says it comes from `wkc-yolo` and gives the run record's absolute path.
Under one, `wkc-implement`, `wkc-code-review`, and `wkc-backlog` never end a turn on a question.
Each decides from the ticket, PRD, SPEC, ROADMAP, and run limits and posts `Decision (wkc-yolo):`,
or parks the ticket with `Parked (wkc-yolo):` and returns `parked`. Discovered work goes back to
`wkc-yolo`, never to `wkc-backlog`. Each skill copies both templates from the SPEC into its own `SKILL.md`.

A skill that asks the user something ends its turn on the question. Asking and then carrying on
leaves the harness working, and a working harness cannot take a plain reply. Make the answer cheap
too: numbered options with the recommended one first, and a digit accepted. Use a harness's own
picker only where it has one that a skill can actually invoke, which most do not. Every skill on
the roster interviews somebody, so this belongs to all of them rather than to `wkc-setup`.

A picker that takes several questions at once, as Claude Code's does, does not reorder the
interview. It asks one step faster; it does not turn a sequence of questions into one screen. Only
questions whose answers cannot change each other share a call, and a question that decides whether
the later ones are worth asking is settled before they are presented.

## Skill template

[`skill-template/`](./skill-template/) holds the copyable skeleton: `SKILL.md.template`, `agents/openai.yaml`,
and a `README.md` that writes out the Agent Skills specification rules in full, so working in this
repository never requires fetching the spec. Read it when creating a skill, checking an existing
one, or porting one in. Do not read it unless knowing the spec and folder structure is needed;
that is the point of it being a separate folder.

```
cp -r skill-template skills/wkc-<name>
mv skills/wkc-<name>/SKILL.md.template skills/wkc-<name>/SKILL.md
```

Follow the instructions from `skill-template/README.md`.

`skill-template/` is authoring material, not a shipped skill. The installer finds skills by looking
for `SKILL.md` anywhere in the repository, not by reading `skills/`, so the skeleton is named
`SKILL.md.template` to stay out of the install. Verify with
`npx skills add <gh-handle>/<skills-repo> -l`: nothing named `wkc-skill-name` may appear in that list.
The public discovery count equals shipped skills minus skills with boolean `metadata.internal: true`.
List each internal skill explicitly with `--skill <name> -l` and verify it installs by exact name.
Count all source `SKILL.md` files separately to verify total shipped skills; ordinary discovery is not that total.

That rule is why `validation/` is safe as a sibling of `skills/`: its files are named after the
skill, never `SKILL.md`, so nothing there is discovered or installed. Any future top-level
directory has to clear the same check before it is added.

## Prose

- No em-dash. Use a comma, a period, a colon, or parentheses.
- Write the way you would explain it to the person sitting next to you.
- Keep skills short. Aim for a `SKILL.md` under 150 lines, and try to keep it under 250 so a person
  can read it. Neither is a hard limit; the Agent Skills specification's limit is 500. Past 150,
  check whether the skill carries policy that belongs to the project, not to the skill.

## Validation

Runbooks are case catalogs, not mandatory full test sequences for every change.
For a new skill or port, plan baseline coverage across supported harnesses and relevant backends.
For later changes, select changed behavior and directly affected regressions.
State selected cases or subchecks, backends, and harnesses before testing.
Wording and formatting changes need static checks unless they change instruction interpretation.
Use direct checks for installer behavior, file preservation, API handling, schemas, and renderer behavior.
Use model invocation only for instruction following or harness loading that direct checks cannot establish.
Reuse evidence only when the relevant instructions, fixture, and tool or harness configuration remain unchanged; cite its source.
Unavailable required checks within the selected scope are SKIP, never PASS. Cases outside that scope are not new SKIPs.
Identify focused subchecks explicitly; a passing subcheck is not a full-case PASS.
Do not claim complete compatibility from focused checks or count direct checks as model behavior.
New AI sessions run within the standing session limit in [Token usage](docs/dev-agents/rules/token-usage.md).
Validation requirements do not authorize sessions past that limit or cross-harness launches.

Prepare only fixtures needed by selected cases. Use local or controlled HTTP fixtures for mechanical checks.
Use real service fixtures when testing service integration; reuse suitable existing fixtures before creating new ones.
Read case headings and relevant report sections, not entire historical logs.
Keep tracked reports concise: source and fixture identifiers, selected cases, independent checks, observed outcomes, and unresolved limits.
Keep raw logs and repeated setup details outside tracked reports; preserve concise evidence of prior failures and skips.

## Git workflow

Never commit or push directly to `main`, on any harness, even with admin rights. Always:

1. Start the branch in its own worktree from an up-to-date `main`, with `make worktree
   BRANCH=<type>/<slug>` (e.g. `docs/...`, `feat/...`). The main checkout stays on `main`.
2. Commit on the branch, push it, open a pull request against `main`.
3. Keep the branch current: merge or rebase `origin/main` in whenever GitHub reports it out of date.

Merging is the human's call. An AI agent merges to `main` only when the human asked for it, directly
in the task or in the recorded limits of an autonomous run the human started. Otherwise it prepares
the branch and the pull request and stops there. GitHub enforces the pull request step: a direct
push to `main` is rejected with `GH013`, for the owner too. `CONTRIBUTING.md` records the rulesets.

A merged branch is not a dead branch. GitHub does not delete it on merge, on purpose, because
merging is sometimes what triggers the check you are waiting on. Delete it once the work is
verified, not as part of merging.

The Makefile scripts these steps: `make worktree BRANCH=<type>/<slug>` starts a branch in its own
worktree with the gitignored files `.worktreeinclude` lists, `make merge [PR=<n>]` squash-merges,
and `make cleanup BRANCH=<type>/<slug>` removes a merged branch's worktree and branches. `make
merge` follows the merge rule above: run it only when the human asked for the merge.

## Porting a skill from agent-toolkit

The skills come from `wilsonkichoi/agent-toolkit` one at a time, one pull request each, so every
one gets read and validated against its runbook before the next starts. `README.md` holds the roster
and the order.

1. **Read the source** `SKILL.md` and list its dependencies: runtime contracts, `scripts/*.py`,
   subagent definitions, `assets/`.
2. **Rule on each dependency** before writing anything. Inline it into `SKILL.md`, keep it as a
   sibling `.md` in the skill directory, replace it with a call to the `wkc-tracker` skill, or drop it.
   A ported script needs a written reason.
3. **Rewrite, do not copy.** Cut agent-toolkit-specific policy on sight: fork contributions,
   canonical-repository permission boundaries, version migration sections, tuning knobs like
   `work_in_progress_limit`. `max_fix_attempts` is the exception, kept as a config field by
   [ADR-003](docs/dev-agents/adr/ADR-003-review-and-fix-rounds.md). Something re-earns its place only when its
   absence breaks the skill.
4. **Apply the conventions above**: the [Skill template](#skill-template), every invocation setting,
   `agents/openai.yaml`.
5. **Feed the contract back into `wkc-setup`.** A new config field means editing
   `skills/wkc-setup/config-template.md` and the `wkc-setup` interview in the same pull request. No skill
   reads a field `wkc-setup` never writes.
6. **Validate** under [Validation](#validation): establish baseline coverage with the skill's
   runbook at `validation/wkc-<name>.md`, including installed invocation on each supported harness where available.
   Run installer and filesystem checks directly in throwaway projects. A runbook is a
   numbered list of cases, each with an independent check that decides PASS or FAIL, ending in a
   report. A case that could not run is SKIP and never PASS: an untested claim recorded as a pass is
   how a defect reaches a user. Cases needing a second terminal, a second account, or a service with
   no credentials here are marked `[MANUAL]` and are expected to be skipped on an unattended run.
   Write one for every skill that gets ported.

   Runbooks are tracked and public on purpose. A reviewer can read what the skill was tested against
   without installing anything, and disagree with the coverage rather than only with the code. The
   cost is that a runbook rots like any other checked-in file, which is what pre-commit item 5 is
   for: a stale runbook is worse than none, because it reports PASS.
7. **Run the pre-commit checklist**, then branch, push, and open the pull request.

Renaming a skill or adding one that is not on the roster is expected. Update the `README.md` roster
row in the same pull request and note the rename in `CHANGELOG.md`.

## Pre-commit checklist

Before any commit that adds, removes, or modifies files under `skills/`:

1. Version bumped in `VERSION`, once per pull request (see [Versioning](#versioning))
2. That version's `CHANGELOG.md` entry added, or rewritten to cover this commit: a `## {version} ({ISO 8601 standard with local time offset e.g. 2026-08-21T17:16:30-07:00})` heading, one blank line, then one `- ` bullet per change
3. `README.md` (repo root) and `AGENTS.md` updated if skill behavior/description changed
4. `README.md` roster row added or updated when a skill is added, renamed, or removed
5. `validation/wkc-<name>.md` updated when a verb, a command, or a guarantee changed. A runbook
   that still tests the old behaviour is worse than none, because it reports PASS
6. Every supporting `.md` file in a changed skill that is now over 100 lines has a `## Contents`
   list naming its current `##` sections (see [`skill-template/README.md`](./skill-template/README.md#authoring-guidance)).
   `SKILL.md` is exempt: it loads whole

Do not commit skill changes without completing this checklist. Read the checklist, don't rely on memory.

Read dev workflow for AI-SDLC from docs/dev-agents/config.md
