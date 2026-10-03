---
name: wkc-skills-release
description: Publish this collection's tags and GitHub Releases. Use when the maintainer asks to release merged work or resume an interrupted publication.
argument-hint: "[vX.Y.Z]"
disable-model-invocation: true
metadata:
  internal: true
---

# wkc-skills-release

- **What it does:** publishes lightweight tags and stable GitHub Releases for this collection.
- **When to use it:** explicit invocation by the maintainer, including recovery after a failed publication. Callers are people.
- **Dependencies:** Git, authenticated GitHub CLI (`gh`), network access, and a clean collection checkout on synchronized `main`.
- **Input:** an optional exact `vX.Y.Z` tag. Omission selects `VERSION` on synchronized `main`; an existing tag selects its committed version.
- **Output:** a verified tag and release URL, a verified no-op, or a refusal naming the conflict and any completed publication step.

**Repository identity:** `wilsonkichoi/skills`

Use that field as `repo` throughout. Require no setup skill or project configuration.
Publish merged work only. Never change versions, create commits or pull requests, or merge branches.
Never move or delete tags, edit releases, or use force pushes to repair a conflict.

## 1. Verify the checkout

Run `gh auth status`. Resolve the checkout root, origin fetch and push URLs, and GitHub repository identity.
Require both origin URLs to identify the repository above on `github.com`; reject forks and other hosts.
Inspect every configured fetch and push URL, not only the first.
Verify with `gh repo view "$repo" --json nameWithOwner,url`.
Stop on authentication, access, identity, or command failure. Never interpret an access failure as missing data.

Require branch `main` and empty `git status --porcelain --untracked-files=all`, regardless of `status.showUntrackedFiles`.
Fetch origin's `main` with `--no-tags` into `refs/remotes/origin/main`, preserving the checkout and local tags.
Require `HEAD`, local `main`, and `origin/main` to identify the same commit; record its full SHA.
Do not switch branches, reset, pull, or stash to satisfy this requirement.

## 2. Resolve the target

Accept only `v` followed by three dot-separated nonnegative decimal integers, without leading zeroes except `0`.
No suffixes or shorthand. `VERSION` must contain the corresponding bare version and one optional final newline.
For omitted input, read `VERSION` at the recorded main commit and add `v`.

Read the exact local tag ref and exact remote tag ref independently, including their object types.
Use `git ls-remote --tags origin "refs/tags/$tag" "refs/tags/$tag^{}"` for the remote.
Fetch needed remote objects with `--no-tags` into `FETCH_HEAD`, without replacing local refs.
Existing target tags must be lightweight commit refs; annotated tags are conflicts.
If both refs exist, require identical SHAs. A missing ref is recoverable; a conflicting ref stops all publication.

With neither ref present, require the requested version to equal `VERSION` at synchronized main.
The target is that main commit. Refuse historical backfill even when the requested version once existed on main.
With either ref present, use its SHA, even after main advances.
Record whether the target exists remotely. A local-only tag is not evidence of prior remote publication.
Require the target to be an ancestor of recorded main, and its committed `VERSION` to equal the tag's version.
Read `VERSION` and `CHANGELOG.md` using `git show "${target}:VERSION"` and `git show "${target}:CHANGELOG.md"`.
Never use working-copy release data for an older target.

## 3. Prepare notes and Latest

Require authenticated push access from `gh api "repos/$repo"` so release listings include drafts; otherwise stop.
Read every release page, not a fixed-size release list. Any API failure, including 404, stops publication:

```sh
gh api --paginate "repos/$repo/releases?per_page=100"
```

Find all exact target-tag matches in this complete list before excluding drafts and prereleases.
Only a successful complete list with no target match means absent; a tag-endpoint 404 cannot establish absence.
Multiple target matches, or any matching draft or prerelease, are conflicts. Stop without publication or release edits.
Exclude drafts and prereleases from version comparisons and the notes boundary.
Require stable release tags to use canonical `vX.Y.Z`; otherwise stop and name the unsupported tag.
Compare integer `(major, minor, patch)` tuples, never text order or publication dates.
Exclude the target's own release. For publication, the preceding release is the greatest stable version below the target.
For an existing stable target release, read its original boundary from the notes heading instead.
Require that boundary to have been published by the target's publication time; reject a greater lower version published strictly earlier.
Later publication of an older tagged version must not change a correct existing release's notes boundary.
Resolve that release's remote tag to its commit and require it to be a strict ancestor of the target.
Stop on a missing or conflicting boundary; never silently choose another release.

Parse the target changelog's version lines, preserving their complete text and newest-first order.
Require unique canonical versions, valid ISO 8601 timestamps with offsets, decreasing versions, and the target entry.
Require the preceding release's entry when a preceding release exists.
Select every entry above the boundary and at or below the target, including versions without tags.
With no preceding release, select all entries at or below the target.
Write deterministic notes: `## Changes since <preceding-tag>`, one blank line, then the selected lines separated by newlines.
With no preceding release, use `## Changes (first release)`; an existing release's first-release claim must satisfy the same time check.
Use a temporary notes file outside the checkout; preserve it for recovery until the result is verified.

Set `latest_flag=--latest` only if the target is greater than every other existing stable release.
Otherwise set `latest_flag=--latest=false`. Record the current Latest release through the `/releases/latest` endpoint.
A confirmed 404 means none; authentication, network, and other API failures stop publication.

## 4. Check recovery and authorization

For an existing release, require a matching remote tag, title equal to the tag,
prepared notes equal to its body (ignore only a final newline), and `draft=false`, `prerelease=false`.
A matching release is a no-op, including after main or Latest advances. Report its current Latest status without changing it.
Any mismatch is a conflict. Stop without altering the release or either tag.

Show repository, tag, full target SHA, preceding release, complete notes, and intended Latest status before publication.
For a local-only target older than main, prominently flag that it was never remotely published and is not main's tip.
Explain that ancestry and matching VERSION do not prove this is the intended merged release commit.
Honor existing explicit authorization for this repository, tag, and commit; do not ask twice.
Otherwise end the turn on a numbered question: publish this target (recommended), or stop.
Creating a pull request, approving a merge, or testing the skill does not authorize a collection release.

## 5. Publish and verify

Finish and check each read before issuing the write it permits. Never batch or parallelize that read with its write.
Immediately before writing, repeat the checkout, tag, release, and stable-release reads.
Use `git status --porcelain --untracked-files=all` again for checkout revalidation.
If main changed for a new tag, the target changed, or notes or intended Latest changed, stop and prepare the new result.
Authorization for an old target does not authorize another commit.
For an existing target, main may advance only if the target remains its ancestor and the checkout is synchronized.
If a concurrent publisher completed the matching release, report the verified no-op.

Create a missing local lightweight tag with signing explicitly disabled:

```sh
git -c tag.gpgSign=false tag --no-sign "$tag" "$target"
```

Push only a missing remote tag, never branches or all tags. Disable followed tags regardless of `push.followTags`:

```sh
git push --no-follow-tags origin "refs/tags/${tag}:refs/tags/${tag}"
```

Re-read the remote tag and require its SHA and lightweight type to match the target before creating the release.
Re-read the complete release list, including target drafts, and Latest before release creation; stop on conflict or changed preparation.
Use the prepared file and explicit Latest flag:

```sh
gh release create "$tag" --repo "$repo" --verify-tag --title "$tag" --notes-file "$notes_file" "$latest_flag"
```

Re-read the remote tag, release, and Latest independently. Require the same tag commit, title, notes, and stable publication state.
Use the complete release list for every target-release recheck, including recovery after a command failure.
For `--latest`, Latest must be this tag. For `--latest=false`, Latest must equal the recorded prior Latest, or remain absent.
On a command failure, read the actual tag and release state before reporting or retrying.
Resume only matching state. Never roll back a pushed tag or repair a conflicting release.

## 6. Report

Report repository, tag, full commit, release URL, included versions, and observed Latest status.
Distinguish newly published, resumed, and unchanged results.
On failure, name the failed check, completed steps, actual remote state, and the exact remaining action.
Remove the temporary notes file after verified success; retain and report its path after an interrupted publication.
