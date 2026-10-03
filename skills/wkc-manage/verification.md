# Verification and optional reports

Read this for status, content verification, or reconciliation.

## Provenance and complete content

Schema `1` entries identify `source`, `sourceType`, `skillPath`, `computedHash`, and optionally `ref`.
The installer hash is useful local evidence, not proof of a release or selected harnesses.
Resolve each owned entry's recorded tag or commit independently of the proposed update target.
Require a published stable release before calling a tag a managed release identity.
Do not infer a pin from equal content, a branch name, or an unpinned source.
Unpinned content may match a known commit while historical release identity remains unverified.

Fetch needed objects into a temporary checkout outside the working repository and discovery roots.
Resolve the exact remote tag to its commit. Use `git archive` of that commit as the comparison source.
For a source file read, use braces before colons, for example:

```sh
git show "${commit}:VERSION"
```

Compare the complete shipped directory recursively against every actual installation.
Resolve external placement symlinks first and report broken links without following them for mutation.
Include supporting files, hidden files, extra files, missing files, file types, and internal link relationships.
Use recursive file comparisons and filesystem inspection, not just `SKILL.md` or the installer's hash.
An independent copy can diverge while its canonical copy remains correct. Inspect both.
Record the command, archive commit, resolved paths, differences, and outcome.
After mutation, also require the prepared harness accessibility, mode, lock owner, skill path, and exact ref.
Verify unrelated files and lock entries against the pre-operation evidence.

Without network access, report locally observed refs and available comparisons.
Label remote release identity and tag verification unverified; never claim fresh remote verification from cached evidence.
For absent files with surviving lock entries, report stale provenance rather than an installation.

## Reconcile

`reconcile` inspects current state. It does not install, repair, or infer desired state.
Validate the raw lock before changing exclusions or writing any report.
The report path is `docs/dev-agents/installed-skills.local.md`, relative to the project root.
Resolve the exclusion file through Git, including in linked worktrees:

```sh
git rev-parse --git-path info/exclude
```

Inspect the resolved exclusion file and preserve its existing entries.
Inspect the report and its parent paths for tracked files, symlinks, or paths outside the project.
Stop on a tracked report or conflicting destination; do not untrack it or redirect writes through a link.
Add only the exact anchored repository-relative report path to the local exclusion file if needed.
Finish that write, then independently check `git check-ignore` and `git ls-files` for the report path.
Require the report to be ignored and untracked before creating or replacing it.
For a missing report, use Git's path checks without requiring the file to exist.
Stop on any failed check. Do not use a worktree's assumed `.git/info/exclude` path.

Write inspection time, source identity, recorded refs, archive commits, comparisons, and remote verification limits.
Include actual paths, accessible harnesses, copy and link relationships, differences, and unresolved ownership.
Report a common release only if all managed installations have verified provenance and complete matching content.
An empty managed set does not establish a common release.
Verify the report remains ignored and untracked after writing.
Ordinary sessions do not load it. Status always recomputes evidence, and mutations do not refresh it.
