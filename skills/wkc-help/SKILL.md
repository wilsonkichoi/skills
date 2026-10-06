---
name: wkc-help
description: Answer questions about the wkc- skills, including what each one does, how to call it, which version is installed, and how to install, pin, update, or remove them. Use when someone asks about these skills or how to manage them.
argument-hint: "[question]"
disable-model-invocation: false
---

# wkc-help

- **What it does:** answers questions about the `wkc-` skills from `wilsonkichoi/skills`, and gives
  or runs the installer commands that manage them.
- **When to use it:** any question about these skills or their installation. Callers are people and
  models. A model may answer on its own, but runs a command that changes files only when a person
  asked for that change.
- **Dependencies:** the installed `wkc-` skills. Node.js, npm, and Git to run installer commands.
  `gh` is optional, for release lookups.
- **Input:** a question in plain words. With no question, give a short overview of the installed
  skills and how to update them.
- **Output:** an answer with the exact commands, or the result of commands the person asked you to run.

## 1. Questions about a skill

The installed skills sit in sibling directories next to this one. Read the `SKILL.md` of the skill
in question and answer from it, not from memory. When showing how to call a skill, use the syntax of
the harness you are running in. When a skill is not installed, say so and show how to add it.

## 2. Installation

The installer is `skills@1.7.0`, the version this collection is tested with. `-a` names the harnesses;
`claude-code`, `codex`, and `kiro-cli` are the tested ones. Use the ones the person names, or the
ones the project already has.

Install every public skill, either from the default branch or from a release tag:

```
npx skills@1.7.0 add wilsonkichoi/skills -s '*' -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#vX.Y.Z' -s '*' -a claude-code -a codex -a kiro-cli -y
```

A tag needs the full git URL, quoted, because `#` starts a shell comment. Replace `-s '*'` with
`-s <name> ...` for some skills only. `'*'` leaves out the internal `wkc-skills-release`, which
installs only by exact name. By default each harness links to one copy in `.agents/skills/`;
`--copy` gives each harness its own copy instead.

The latest release is at https://github.com/wilsonkichoi/skills/releases/latest, or
`gh release view --repo wilsonkichoi/skills`. Add a tag to that command to read one release's notes.

## 3. Versions and updates

Each skill's `ref` in `skills-lock.json` at the project root is the tag or branch it was installed
from. No `ref` means the default branch; the lock does not record which commit.

`npx skills@1.7.0 update -p` refetches each installed skill from its recorded `ref`. An unpinned
install gets the newest default branch. A tag-pinned install stays where it is, because tags never
move. To change releases, rerun `add` with the new tag, the same skills and harnesses, and `--copy`
if it was used before. `update` refreshes only skills already in the lock; add new ones by name.

## 4. Removal

```
npx skills@1.7.0 remove wkc-setup wkc-tracker -a claude-code -a codex -a kiro-cli
```

Always name the skills and the harnesses. Never run `remove --all`, or `remove` without `-a`, in a
repository with its own top-level `skills/` directory: the installer treats a bare `skills/` as
OpenClaw's project path and deletes it. A full uninstall also deletes `docs/dev-agents/`, which
`wkc-setup` wrote, and its reference line in `AGENTS.md` or `CLAUDE.md`.

## 5. Running commands

Show the exact command first. Run it only when the person asks you to. Afterwards, read the
installer's output, `skills-lock.json`, and the installed directories, and report what changed. The
installer can print a failure and still exit 0, so a zero exit alone does not mean success.
