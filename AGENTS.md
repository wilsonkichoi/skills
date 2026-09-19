# AGENTS.md

Authoring conventions for this repository - the single source of truth for every harness.

## Versioning

`VERSION`

All version fields use semver (`major.minor.patch`). Always use the minimum increment:
- Bug fixes, typos, doc updates: patch (`0.0.1` → `0.0.2`)
- New skills, features, non-breaking additions: minor (`0.0.2` → `0.1.0`)
- Breaking changes (renamed skills, removed features, restructured plugin): major

For now, use patch for everything including new features. Save minor/major bumps for after the plugin has real consumers.
A version becomes a release when it is tagged `X.Y.Z` at its merged commit and published as a GitHub Release.

A tag marks a release for people reading the history, and it is what a pinned install points at.
A pushed `v*` tag cannot be moved or deleted, so a bad release costs a new patch version, never a
re-tag.
Pinning takes the full git URL with a `#ref`, quoted:
`npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#v0.0.3'`. A missing ref fails
loudly. The `owner/repo@v0.0.3` shorthand is not a pin, because `@` selects a skill name there.
Adopters who want the tip use `npx skills@latest add wilsonkichoi/skills`.

## Distribution

This repository ships as plain skill directories, installed with one command:

```
npx skills add wilsonkichoi/skills -a claude-code -a codex -a kiro-cli
```

There is no `.claude-plugin/`, no `marketplace.json`, no per-harness distribution tree, and no
build step. Adding one of those is a decision to maintain a second copy of every skill, so do not
add one without a written reason.

The installer copies and symlinks the same directory into whichever harness the user named:
`.claude/skills/` for Claude Code, `.agents/skills/` for Codex, `.kiro/skills/` for Kiro CLI. One
source tree, no per-harness variants.

## Skills

Each skill is a directory under `skills/<skill-name>/`:

```
skills/<skill-name>/
  SKILL.md              # frontmatter: name, description, disable-model-invocation: true
  agents/openai.yaml    # interface + policy.allow_implicit_invocation: false
  <supporting>.md       # templates and references, linked relatively from SKILL.md
  README.md             # optional, only when the skill needs explaining beyond SKILL.md
```

Documentation *about* a skill lives in that skill's directory. When `SKILL.md` cannot carry an
explanation without growing past its own length budget, the answer is `skills/<skill-name>/README.md`.
Be deliberate about one: the installer copies the **whole skill directory** into every consumer, so
a README ships with it. Write it for someone using the skill. Anything written for someone changing
the skill belongs in this file instead.

The one thing that does not live there is the skill's validation runbook, which is big, goes stale
on its own schedule, and is of no use to an adopter. Runbooks live in [`validation/`](./validation/),
one file per skill, named after it.

Adding any *other* top-level directory is a decision about the shape of the repository. It is the
maintainer's call and not a thing to do in passing.

Skills in this project are only triggered manually. Every harness reads its own setting, so each
skill carries all of them:
- claude code: `SKILL.md` frontmatter `disable-model-invocation: true`
- codex cli: `agents/openai.yaml` -> `policy: allow_implicit_invocation: false`
- kiro cli: no documented setting exists. `SKILL.md` frontmatter carries
  `metadata: allow_implicit_invocation: "false"` in case a harness starts reading it. Nothing is
  known to read it today, so a Kiro user can still trigger a skill by conversation alone.

Every `SKILL.md` body opens with the same doc block, so a reader knows what a skill needs and what
it leaves behind before reading any step. The skeleton is in [Skill template](#skill-template).

`description` goes on one unquoted physical line, however long.

No scripts unless a skill genuinely cannot be written as prose. Script sprawl and the build steps
around it are the main reason the previous toolkit became unmaintainable.

Inputs and outputs between skills stay loose. A skill states what it expects and what it produces,
but does not reject work over formatting. Following rigid steps for ceremony is not the point.

A skill that asks the user something stops work at the question. Use a structured question tool
only when the active harness and mode show its options for direct selection. An asynchronous
question queue is not a direct picker. Otherwise, number the options, state the default, and accept
a single digit. Do not continue work while a question is outstanding. Every skill on the
roster interviews somebody, so this rule applies to all of them.

## Skill template

[`skill-template/`](./skill-template/) holds the copyable skeleton: `SKILL.md`, `agents/openai.yaml`,
and a `README.md` that writes out the Agent Skills specification rules in full, so working in this
repository never requires fetching the spec. Read it when creating a skill, checking an existing
one, or porting one in. Do not read it unless knowing the spec and folder structure is needed;
that is the point of it being a separate folder.

```
cp -r skill-template skills/<skill-name>
mv skills/<skill-name>/SKILL.md.template skills/<skill-name>/SKILL.md
```

Follow the instructions from `skill-template/README.md`.

`skill-template/` is authoring material, not a shipped skill. The installer finds skills by looking
for `SKILL.md` anywhere in the repository, not by reading `skills/`, so the skeleton is named
`SKILL.md.template` to stay out of the install. Verify with
`npx skills add <gh-handle>/<skills-repo> -l`: nothing named `skill-name` may appear in that list,
and the count must equal the number of shipped skills.

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
   sibling `.md` in the skill directory, replace it with a call to the `tracker` skill, or drop it.
   A ported script needs a written reason.
3. **Rewrite, do not copy.** Cut agent-toolkit-specific policy on sight: fork contributions,
   canonical-repository permission boundaries, version migration sections, tuning knobs like
   `work_in_progress_limit` and `max_fix_attempts`. Something re-earns its place only when its
   absence breaks the skill.
4. **Apply the conventions above**: the [Skill template](#skill-template), every invocation setting,
   `agents/openai.yaml`.
5. **Feed the contract back into `setup`.** A new config field means editing
   `skills/setup/config-template.md` and the setup interview in the same pull request. No skill
   reads a field `setup` never writes.
6. **Validate** in a throwaway repo: install with the installer, then work through the skill's
   runbook at `validation/<skill-name>.md` on Codex, on Claude Code, and on Kiro CLI. A runbook is a
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

1. Version bumped in `VERSION`
2. Append short summary to `CHANGELOG.md` using this format `{version} {ISO 8601 standard with local time offset e.g. 2026-08-21T17:16:30-07:00} {change summary}`
3. `README.md` (repo root) and `AGENTS.md` updated if skill behavior/description changed
4. `README.md` roster row added or updated when a skill is added, renamed, or removed
5. `validation/<skill-name>.md` updated when a verb, a command, or a guarantee changed. A runbook
   that still tests the old behaviour is worse than none, because it reports PASS

Do not commit skill changes without completing this checklist. Read the checklist, don't rely on memory.
