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
`npx skills@latest add wilsonkichoi/skills@v0.0.2`.

## Distribution

This repository ships as plain skill directories, installed with the
[vercel-labs/skills](https://github.com/vercel-labs/skills) installer. There is no
`.claude-plugin/`, no `marketplace.json`, no per-harness distribution tree, and no build step.
Adding one of those is a decision to maintain a second copy of every skill, so do not add one
without a written reason.

The installer copy and symlink the same directory into whichever harness the user has: `.claude/skills/`
for Claude Code, `.agents/skills/` for Codex, `.kiro/skills/` for Kiro CLI. One source tree, no
per-harness variants.

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
- kiro cli: no setting exists yet 

Every `SKILL.md` body opens with a doc block, one short line per item:

- **What it does**
- **When to use it**
- **Dependencies**: other skills, CLIs, MCP servers, config fields it reads
- **How to call it**: every harness invocation, e.g. `/setup` on Claude Code and Kiro CLI, `$setup` on Codex
- **Input**: what the user or the calling skill supplies
- **Output**: files written, tracker state changed, what the next skill can expect

No scripts unless a skill genuinely cannot be written as prose. Script sprawl and the build steps
around it are the main reason the previous toolkit became unmaintainable.

Inputs and outputs between skills stay loose. A skill states what it expects and what it produces,
but does not reject work over formatting. Following rigid steps for ceremony is not the point.

## Prose

- No em-dash. Use a comma, a period, a colon, or parentheses.
- Plain words: "use" not "utilize", "start" not "initiate", "before" not "prior to".
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
4. **Apply the conventions above**: doc block, every invocation setting, `agents/openai.yaml`.
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
