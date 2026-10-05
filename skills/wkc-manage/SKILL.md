---
name: wkc-manage
description: Manage this collection's project installations. Use when you want to see recorded versions, install, update, or remove wkc-* skills.
argument-hint: "[status | add | update | remove] [skills, harnesses, release or main]"
disable-model-invocation: true
---

# wkc-manage

- **What it does:** manages this collection's project installations through `npx skills@1.7.0`.
- **When to use it:** explicit invocation in a project. Callers are people.
- **Dependencies:** filesystem access; Node.js, npm, and Git for installation; network access for installer commands and release lookup.
- **Input:** an operation, optional skill names, harnesses, and a release or `main`. Natural language is accepted; omission means `status`.
- **Output:** recorded versions and installation locations, or a summary of changes and any incomplete operation.

**Repository identity:** `wilsonkichoi/skills`

Use that field as `repo`. Manage project installations for Claude Code, Codex, and Kiro CLI.
Leave collection sources, unrelated skills, global installations, and generated project configuration untouched.
Ask only for missing choices that affect the request. Honor existing authorization without redundant confirmation.
End questions on numbered options, recommended option first, and accept a digit.

## 1. Inspect and show status

Read the project’s `skills-lock.json` and relevant paths under `.agents/skills/`, `.claude/skills/`, and `.kiro/skills/`.
An entry belongs to this collection when its `source` matches `repo`, including legacy unprefixed names.
A `wkc-` prefix alone does not establish ownership. Report other existing destinations as unmanaged or unknown.
Inspect directories and symlinks to identify locations and copy or symlink mode; the lock records neither.
Canonical `.agents/skills/` files are visible to Codex, including when other harnesses link to them.

Report each skill’s **recorded version**, using its `ref` exactly as stored.
A missing `ref` means “Unpinned, default branch”; it does not identify a commit or prove current `main` content.
Show different refs separately. Flag missing installations and broken links instead of presenting them as installed.
One lock entry covers all copies of a skill; it does not prove that every copy has identical content.
Report a missing, unreadable, or unsupported lock without inventing versions or ownership.
For `status`, stop here after reporting. Make no network requests or file changes.

## 2. Choose the operation

| Operation | Scope |
|---|---|
| `add` | Requested skills, or all public skills when explicitly requested. |
| `update` | Requested installed collection skills, or all installed collection skills when names are omitted. |
| `remove` | Requested collection skills and harnesses; ask if the removal scope is unclear. |

For fresh installations, ask which harnesses to use unless specified. Use the installer’s default mode unless copies are requested.
For existing installations, preserve locations and mode unless the user requests a change.
Updates replace installed files, including local edits, and do not add newly published skills.
Do not create backups, compare source archives, or run automatic migration or recovery workflows.
Before writes, require any existing lock to contain numeric `version: 1`, a `skills` mapping, and usable entries.
Stop on malformed or unsupported locks. A missing lock permits installation only into unoccupied destinations.
Never overwrite a destination whose ownership is unknown, including a canonical directory used by symlink installation.

For `add` and `update`, resolve one target:

- Default to GitHub’s designated Latest release through `/repos/{repo}/releases/latest`.
- Look up an explicit release through `/repos/{repo}/releases/tags/{tag}`; require a published, non-prerelease result.
- For an explicit `main` request, use the unpinned repository source, which follows this repository’s default branch.

Public access needs no login. Use anonymous HTTPS; existing authentication is optional, with anonymous fallback if rejected.
Return only the selected tag and necessary diagnostics. Do not list release history or load release bodies.
A failed release lookup stops installation; do not silently fall back to `main`.
Use installer discovery at the chosen source to resolve requested names or enumerate public skills for `add all`.
Exclude internal skills and `wkc-skills-release` by name from `add all`; allow explicit installation of the maintainer skill.
If a selected name is absent from the target, report it and stop. Do not infer a rename or silently drop it.

## 3. Run the installer

Show the selected source or tag, skill names, harnesses, and any requested mode change before running commands.
Use `npx skills@1.7.0` with explicit skill names and explicit `-a` arguments for every write.
Never use wildcard selection, `--all`, global flags, or removal without `-a`.
Broad removal can delete real source directories under `skills/` through the installer’s OpenClaw project path.

Use scoped `add` for both installation and update, not the installer’s generic update command.
Group calls by skill names, harnesses, and mode. For a release, substitute the selected tag and requested names:

```sh
npx skills@1.7.0 add "https://github.com/${repo}.git#${tag}" --skill wkc-setup -a claude-code -a codex -a kiro-cli -y
```

For `main`, replace the URL with `"${repo}"`. Add `--copy` for independent copies.
Symlink installation writes canonical files even without Codex selected; include those effects in the stated scope.

Before removal, check whether any placement of a selected skill must remain, including known consumers of shared paths.
If so, stop: the installer can delete canonical files or shared lock ownership, even with retained independent copies.
Explain this selective-removal limit without converting copies, reinstalling retained skills, or inspecting global detection settings.
Do not broaden the requested harness list or delete canonical files manually to bypass the limit.
Otherwise, remove the requested names, for example:

```sh
npx skills@1.7.0 remove wkc-setup -a claude-code -a codex -a kiro-cli -y
```

## 4. Check and report the result

After each command, inspect requested paths, links, and relevant lock entries, including source and recorded ref.
Report actual installation locations, modes, recorded versions, and completed changes. Do not claim content verification.
The installer can retain canonical files after reporting success. Report remaining files or ownership as incomplete removal.
It can also print failed skills and exit zero. An existing path and an advanced ref then do not prove that placement changed.
On any reported failure, nonzero exit, or unexpected result, stop further changes.
Report the operation as incomplete with the remaining state, without automatic rollback.
After updating this manager, state that the current session still follows its previously loaded instructions.
Keep the report in the conversation; do not create installation reports or change Git exclusions.
