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
and adds its `CHANGELOG.md` line. Later commits on that branch keep the version and rewrite that
line so it describes the branch as a whole. A version names what merges to `main`, not each step
taken to get there.
A version becomes a release when it is tagged `vX.Y.Z` at its merged commit and published as a GitHub Release.

A tag marks a release for people reading the history, and it is what a pinned install points at.
A pushed `v*` tag cannot be moved or deleted, so a bad release costs a new patch version, never a
re-tag.
Pinning takes the full git URL with a `#ref`, quoted:
`npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.3'`. A missing ref fails
loudly. The `owner/repo@v0.0.3` shorthand is not a pin, because `@` selects a skill name there.
Adopters who want the tip use `npx skills@1.7.0 add wilsonkichoi/skills`.

## Distribution

This repository ships as plain skill directories, installed with one command:

```
npx skills@1.7.0 add wilsonkichoi/skills -a claude-code -a codex -a kiro-cli
```

There is no `.claude-plugin/`, no `marketplace.json`, no per-harness distribution tree, and no
consumer build step. Adding one of those is a decision to maintain a second copy of every skill,
so do not add one without a written reason.

The installer copies and symlinks the same directory into whichever harness the user named:
`.claude/skills/` for Claude Code, `.agents/skills/` for Codex, `.kiro/skills/` for Kiro CLI. One
source tree, no per-harness variants.

### Collection releases

`wkc-skills-release` publishes this collection only. Its one repository identity field lives in its
`SKILL.md`; adopting projects keep their existing release and deployment processes. There is no
generic release config because setup config belongs to adopting projects, not collection publication.
The collection uses one `VERSION` and immutable tags for complete snapshots. Per-skill version stamps
would create competing version records and cannot improve a pin that already selects the entire tree.
No release hooks, helper scripts, build system, or per-harness copies are needed.
Runtime publication rules live in [`skills/wkc-skills-release/SKILL.md`](./skills/wkc-skills-release/SKILL.md).

`metadata` normally maps strings to strings under the Agent Skills specification. The sole exception
is `wkc-skills-release`'s boolean `metadata.internal: true`, because `skills@1.7.0` checks
`metadata.internal === true` to hide it from public discovery and bulk installation. A string
`"true"` does not work. Explicit installation by name includes it; visibility does not authorize release writes.
Codex, Claude Code, and Kiro CLI loaded the boolean in the recorded validation runs.
Recheck compatibility when metadata or supported harness versions change. If a supported harness rejects the boolean,
remove it from the one shared source and document that direct bulk installation includes the maintainer skill.
Recheck `wkc-manage`'s explicit internal-skill exclusion in its validation runbook when applying that fallback.
Unavailable checks are SKIP, not proof of incompatibility. Record results in its validation runbook.

## Skills

`wkc-manage` is a manually invoked public skill. Keep its runtime management rules in its skill and sibling references.
Record installer compatibility observations and behavioral results in `validation/wkc-manage.md`, not in authoring policy.

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

A skill may explicitly opt into model invocation, one skill at a time. `wkc-tracker` does. Authors
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
Do not promise that Codex or Kiro displays them. Keep harness prefix guidance in the root README's invocation table.

`description` goes on one unquoted physical line, however long.

No scripts unless a skill genuinely cannot be written as prose. Script sprawl and the build steps
around it are the main reason the previous toolkit became unmaintainable.
`wkc-workflow-diagram` is the one recorded exception. Its reason and maintainer build live in
[`tools/workflow-diagram/README.md`](./tools/workflow-diagram/README.md), outside the installed skill.
Renderer changes must preserve visible keyboard focus when closing details after node navigation.

Inputs and outputs between skills stay loose. A skill states what it expects and what it produces,
but does not reject work over formatting. Following rigid steps for ceremony is not the point.

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
`npx skills@1.7.0 add <gh-handle>/<skills-repo> -l`: nothing named `wkc-skill-name` may appear in that list.
The public discovery count equals shipped skills minus skills with boolean `metadata.internal: true`.
List each internal skill explicitly with `--skill <name> -l` and verify it installs by exact name.
Count all source `SKILL.md` files separately to verify total shipped skills; ordinary discovery is not that total.

That rule is why `validation/` is safe as a sibling of `skills/`: its files are named after the
skill, never `SKILL.md`, so nothing there is discovered or installed. Any future top-level
directory has to clear the same check before it is added.

## Prose

- No em-dash. Use a comma, a period, a colon, or parentheses.
- Write the way you would explain it to the person sitting next to you.
- Keep skills short. A `SKILL.md` past roughly 150 lines is usually carrying policy that belongs
  to the project, not to the skill.

## Git workflow

Never commit or push directly to `main`, on any harness, even with admin rights. Always:

1. Branch from an up-to-date `main` (`git checkout -b <type>/<slug>`, e.g. `docs/...`, `feat/...`).
2. Commit on the branch, push it, open a pull request against `main`.
3. Keep the branch current: merge or rebase `origin/main` in whenever GitHub reports it out of date.

Merging is a human decision. An AI agent may prepare the branch and the pull request, but must not
merge to `main` unless the human explicitly asks. GitHub enforces the pull request step: a direct
push to `main` is rejected with `GH013`, for the owner too. `CONTRIBUTING.md` records the rulesets.

A merged branch is not a dead branch. GitHub does not delete it on merge, on purpose, because
merging is sometimes what triggers the check you are waiting on. Delete it once the work is
verified, not as part of merging.

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
   `work_in_progress_limit` and `max_fix_attempts`. Something re-earns its place only when its
   absence breaks the skill.
4. **Apply the conventions above**: the [Skill template](#skill-template), every invocation setting,
   `agents/openai.yaml`.
5. **Feed the contract back into `wkc-setup`.** A new config field means editing
   `skills/wkc-setup/config-template.md` and the `wkc-setup` interview in the same pull request. No skill
   reads a field `wkc-setup` never writes.
6. **Validate** in a throwaway repo: install with the installer, then work through the skill's
   runbook at `validation/wkc-<name>.md` on Codex, on Claude Code, and on Kiro CLI. A runbook is a
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
2. That version's `CHANGELOG.md` line added, or rewritten to cover this commit, using this format `{version} {ISO 8601 standard with local time offset e.g. 2026-08-21T17:16:30-07:00} {change summary}`
3. `README.md` (repo root) and `AGENTS.md` updated if skill behavior/description changed
4. `README.md` roster row added or updated when a skill is added, renamed, or removed
5. `validation/wkc-<name>.md` updated when a verb, a command, or a guarantee changed. A runbook
   that still tests the old behaviour is worse than none, because it reports PASS

Do not commit skill changes without completing this checklist. Read the checklist, don't rely on memory.

Read dev workflow for AI-SDLC from docs/dev-agents/config.md
