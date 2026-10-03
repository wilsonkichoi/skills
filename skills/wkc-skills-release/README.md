# wkc-skills-release

This is the collection maintainer's release skill. Adopting projects keep their own release and deployment processes.
The skill releases the repository identified in `SKILL.md`, without reading a dev config or invoking another skill.
It publishes already merged work and requires explicit authorization for the concrete release target.

## Install explicitly

The boolean `metadata.internal: true` hides this skill from ordinary installer discovery and bulk installation.
It remains available by exact name. This is an installation convenience, not an authorization boundary.

```sh
npx skills@1.7.0 add wilsonkichoi/skills --skill wkc-skills-release -a claude-code -a codex -a kiro-cli -y
```

Invoke `$wkc-skills-release` in Codex, or `/wkc-skills-release` in Claude Code and Kiro CLI.
An optional exact tag resumes publication for that version. Omission selects the version on synchronized main.
Use a clean main checkout of the collection, with Git and authenticated GitHub CLI available.
Cleanliness checks explicitly include untracked files even when `status.showUntrackedFiles=no`.
Tag pushes use `--no-follow-tags`, so `push.followTags=true` cannot publish unrelated annotated tags.

## Bootstrap after merge

The first published version containing this skill cannot supply its own bootstrap installation.
Resolve the current main SHA from origin, record it, and use the unpinned installation command above.
Use a separate consumer directory if necessary, so installation does not dirty the release checkout.

Compare the complete installed directory against `skills/wkc-skills-release/` at the recorded commit.
Use a Git archive of that commit and a recursive diff; check all files, not only `SKILL.md`.
If main advanced during installation, stop and resolve a new SHA before repeating installation and verification.
Do not invoke an installed copy whose source has not been verified.

Prepare the concrete tag, SHA, notes, and Latest decision through the installed skill.
Publish only through an explicitly authorized invocation for that target.
After publication, reinstall from the immutable tag, replacing `vX.Y.Z` with the verified tag:

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#vX.Y.Z' --skill wkc-skills-release -a claude-code -a codex -a kiro-cli -y
```

Verify the remote tag's SHA and compare every installed file against the tagged skill directory.
Record the tag, SHA, exact installer command, file comparison, and each harness's resolved installation path.
An installer success message or lock entry alone does not establish the pin.

## Recovery

Matching local and remote lightweight tags resume at the same commit, even after main advances.
A missing remote tag can be pushed from a verified local tag. A missing local tag can be recreated from a verified remote tag.
A matching stable release is unchanged. Conflicts stop without moving tags or editing releases.
Matching requires the skill's notes heading and complete deterministic body.
Earlier manually published releases without that heading are conflicts, even when their tags and versions are correct.
A target draft or prerelease is also a conflict; the skill never publishes beside it or replaces it.
A pushed mistake needs a new patch version through the normal pull request process.
For an older local-only tag, the approval screen flags that the commit was never remotely published and differs from main's tip.

Notes come from the target commit's changelog and cover every version since the preceding published stable release.
The notes heading records that boundary, so later publication of an older tagged version preserves a correct release's no-op behavior.
An older interrupted release uses `--latest=false` when a higher stable release exists.
The skill verifies that publication preserves the previous Latest release in that case.
