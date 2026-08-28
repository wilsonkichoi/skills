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

Tags are what make pinned installs possible. Adopters install the tip with
`npx skills@latest add wilsonkichoi/skills`, or a pinned version with
`npx skills@latest add wilsonkichoi/skills@v0.0.3 -s setup`. The `-s` is not optional: the installer
reads the `@ref` as a skill filter as well as a git ref.

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
```

Skills in this project are only triggered manually. Every harness reads its own setting, so each
skill carries all of them:
- claude code: `SKILL.md` frontmatter `disable-model-invocation: true`
- codex cli: `agents/openai.yaml` -> `policy: allow_implicit_invocation: false`
- kiro cli: no documented setting exists. `SKILL.md` frontmatter carries
  `metadata: allow_implicit_invocation: "false"` in case a harness starts reading it. Nothing is
  known to read it today, so a Kiro user can still trigger a skill by conversation alone.

Every `SKILL.md` body opens with the same doc block, so a reader knows what a skill needs and what
it leaves behind before reading any step. The skeleton is in [Skill template](#skill-template).

No scripts unless a skill genuinely cannot be written as prose. Script sprawl and the build steps
around it are the main reason the previous toolkit became unmaintainable.

Inputs and outputs between skills stay loose. A skill states what it expects and what it produces,
but does not reject work over formatting. Following rigid steps for ceremony is not the point.

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
`npx skills add <gh-handle>/<skills-repo> -l`: nothing named `skill-name` may appear in that list.

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
merge to `main` unless the human explicitly asks. The branch protection that would enforce this is
not applied yet; `CONTRIBUTING.md` holds the one-time maintainer setup that applies it.

## Porting a skill from agent-toolkit

The skills come from `wilsonkichoi/agent-toolkit` one at a time, one pull request each, so every
one gets read and validated by hand before the next starts. `README.md` holds the roster and the
order.

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
6. **Validate by hand** in a throwaway repo: install with the installer, run the skill on Claude
   Code, on Codex, and on Kiro CLI, read the output.
7. **Run the pre-commit checklist**, then branch, push, and open the pull request.

Renaming a skill or adding one that is not on the roster is expected. Update the `README.md` roster
row in the same pull request and note the rename in `CHANGELOG.md`.

## Pre-commit checklist

Before any commit that adds, removes, or modifies files under `skills/`:

1. Version bumped in `VERSION`
2. Append short summary to `CHANGELOG.md` using this format `{version} {ISO 8601 standard with local time offset e.g. 2026-08-21T17:16:30-07:00} {change summary}`
3. `README.md` (repo root) and `AGENTS.md` updated if skill behavior/description changed
4. `README.md` roster row added or updated when a skill is added, renamed, or removed

Do not commit skill changes without completing this checklist. Read the checklist, don't rely on memory.
