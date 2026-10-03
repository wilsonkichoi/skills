---
name: wkc-manage
description: Manage this collection's project installations. Use when you want installation status, updates, additions, removals, rename migration, or a local verification report.
argument-hint: "[status | update | add | remove | reconcile] [skills, harnesses, release]"
disable-model-invocation: true
---

# wkc-manage

- **What it does:** manages this collection's project installations through `npx skills@1.7.0`.
- **When to use it:** explicit invocation for inspection or management in an adopting project. Callers are people.
- **Dependencies:** Git and filesystem access; Node.js and npm for mutations; authenticated `gh` and network access for remote verification and installation.
- **Input:** an operation, optional skill names, harnesses, and a published release, including natural-language requests. Omission means read-only `status`.
- **Output:** current installation evidence, verified changes, or an optional local report from `reconcile`; failures identify completed steps and recovery evidence.

**Repository identity:** `wilsonkichoi/skills`

Use that field as `repo` throughout. Require no setup skill or project configuration.
Manage project installations for Claude Code, Codex, and Kiro CLI, not global installations or plugin caches.
Leave unrelated skills, collection sources, and generated project configuration intact.
When unsure about intent or affected placements, ask before changing them.
Every question ends the turn: numbered options, recommended option first, and a digit accepted.

## 1. Inspect the project

Resolve the project root and linked-worktree context. Inspect `git status --porcelain --untracked-files=all`.
A dirty project is allowed; preserve unrelated work and detect concurrent changes to affected files.
Before every lock read or write, inspect raw `skills-lock.json` at the project root.
Accept only a well-formed schema `1` lock, with a skills mapping and usable source evidence for each entry.
Stop on malformed content or any other schema, including for `status` and `reconcile`.
Never pass an incompatible lock to the installer: it discards older schemas and accepts newer ones without validation.
A missing lock permits fresh installation but establishes no ownership of existing files.

Ownership comes from an entry's source repository matching the identity field, including legacy unprefixed names.
Pinned full Git URL installations record the same owner as shorthand installations, plus `ref`.
A skill name, prefix, hash, or matching content alone does not establish ownership.
Report unowned destinations and stale lock entries. Do not overwrite or remove them as managed installations.

Inspect `.agents/skills/`, `.claude/skills/`, and `.kiro/skills/`, including links, resolved targets, and independent copies.
The lock records source, optional ref, skill path, and content hash; it records neither harnesses nor installation mode.
Record actual accessibility. Canonical files make a skill visible to Codex even if Codex was never selected.
Check other consumers of canonical files and links outside these roots before changing shared content.
Installer removal also considers other detected harnesses, including detection through their global directories.
It can delete canonical files and ownership for retained but undetected harnesses; predict both outcomes using `removal.md`.
Do not alter those global directories to influence removal.

## 2. Resolve evidence and a target

For file comparisons and reports, read [verification.md](./verification.md).
Read-only `status` recomputes evidence; it never installs, repairs, writes a report, or changes exclusions.
Offline status reports local provenance, placement, and available comparisons as unverified remotely.
Authentication, API, or network failure never means absence. Stop mutations; status may report local evidence with the failure.

Network operations require `gh auth status` and access to the identified repository.
Read every release page, not `/releases/latest` or `/releases/tags/X`:

```sh
gh api --paginate "repos/${repo}/releases?per_page=100"
```

Exclude drafts and prereleases. Compare stable `vX.Y.Z` versions as integer `(major, minor, patch)` tuples.
Report unsupported stable tags rather than guessing their ordering.
Omitted release selects the greatest published stable version; explicit input must identify a published stable release.
A tag without a published release is ineligible. Failure to list releases stops target selection.
Resolve one exact tag and remote commit for the operation, then fetch and archive it outside the project.
Read the target's skill definitions and migration guidance from that archive.

Compare installed refs and verified versions with the target before writing.
Stop on an unintended downgrade; show the evidence and ask whether the exact downgrade is intended.
Unpinned or unresolved provenance cannot establish an installed version or authorize overwriting unknown content.
Compare affected installations with their recorded sources before changing them.
Stop on local edits, divergent copies, broken links, destination conflicts, or unexplained content.
Show affected files and ask for a concrete resolution. Do not discard edits under a generic update request.

## 3. Plan the operation

| Operation | Result |
|---|---|
| `status` | Report ownership, recorded refs, placement, accessibility, versions, and content differences. |
| `update` | Reinstall the installed owned set from the resolved release, preserving accessibility and mode. |
| `add` | Install requested skills, or the target's public set, into selected harnesses. |
| `remove` | Remove requested owned placements after dependency and shared-file checks. |
| `reconcile` | Verify current installations and explicitly save the optional local report. |

Update does not add newly published skills. Report them without expanding the installed set.
For `add all`, enumerate public target skills, excluding internal metadata and `wkc-skills-release` by name.
Explicit installation of the maintainer skill is allowed. Visibility does not authorize publication.
Resolve fresh-install harness choices and copy or symlink mode from user intent; ask when unspecified.
For existing installations, preserve observed placements and mode unless a concrete change is confirmed.
Group installer calls by skill set, harness set, and mode. Check effects across groups sharing canonical files.
If the target replaces installed identifiers, read [migration.md](./migration.md) before preparing mutations.
For removal, read [removal.md](./removal.md), including self-removal and canonical layout constraints.

Show the exact release commit, names, affected harnesses, placement changes, and dependency effects before mutation.
Honor existing authorization for that concrete operation. Migration, edit replacement, and copy conversion require informed confirmation.
Approval of a concrete copy conversion also authorizes its necessary removal and reinstallation; do not request redundant approval.
If authorization is missing, end on a numbered question. Do not create backups or begin mutation while awaiting an answer.

## 4. Apply and verify

Read [recovery.md](./recovery.md) before any mutation; back up existing affected installations and lock evidence.
Finish and check each permitting read before its write. Never batch a permitting read with the dependent write.
Recheck the raw lock, affected files, links, release, and remote tag immediately before each installer call.
Stop if preparation changed. Preserve unrelated concurrent changes.
Use explicit skill names and explicit `-a` arguments for every mutation, including fresh installation and recovery.
Never use wildcard selection, broad removal, `--all`, global flags, or removal without `-a`.
Use only `npx skills@1.7.0`; do not use its generic update command to manage this collection.

For installation, use the full Git URL with the resolved exact tag. For example, after substituting prepared values:

```sh
npx skills@1.7.0 add "https://github.com/${repo}.git#${tag}" --skill wkc-setup -a claude-code -a codex -a kiro-cli -y
```

Add `--copy` only for groups requiring independent copies. Codex's own copy still lives in `.agents/skills/`.
Symlink installation writes canonical files even without Codex in the selected harness list.
Re-read and validate the raw lock after each call, even if the command failed.
Independently inspect actual files and links; success messages and lock entries do not prove the result.
Compare each complete installed directory with the exact target archive, including supporting files and independent copies.
Require intended refs, ownership, accessibility, mode, and unchanged unrelated files and lock entries.
On partial failure, stop subsequent changes and use recovery evidence. Never hide a failed comparison or claim partial success as completion.

## 5. Report

Report source identity, recorded refs, exact target and commit when used, affected paths, modes, and verified accessibility.
Distinguish verified release identity, content match, local modification, unknown ownership, and offline or remote failure.
Claim a common release only when every managed installation verifies against that release.
Report actual changes, skipped new skills, unresolved constraints, partial steps, and any retained backup path.
After any installer call writing the manager's own placement, including same-version reinstallation or recovery, state that this session still follows the previously loaded instructions.
Only `reconcile` writes `docs/dev-agents/installed-skills.local.md`; other operations never create or refresh it.
This report is optional diagnostic evidence for the user or an agent explicitly asked to inspect it, not shared configuration.
