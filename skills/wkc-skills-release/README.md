# wkc-skills-release

This is the collection maintainer's release skill. Adopting projects keep their own release and deployment processes.
The release rules live in `tools/release.mjs` in the collection repository, behind `make release`.
The skill runs the plan, asks for authorization, and runs the publish command the plan printed.
A maintainer can run the same two commands without the skill.

## Install explicitly

The boolean `metadata.internal: true` hides this skill from ordinary installer discovery and bulk installation.
It remains available by exact name. This is an installation convenience, not an authorization boundary.

```sh
npx skills add wilsonkichoi/skills --skill wkc-skills-release -a claude-code -a codex -a kiro-cli -y
```

To install every public skill and this one in a single command, set `INSTALL_INTERNAL_SKILLS=1`.
Replace `vX.Y.Z` with a release tag, or use `wilsonkichoi/skills` for the default branch:

```sh
INSTALL_INTERNAL_SKILLS=1 npx skills add 'https://github.com/wilsonkichoi/skills.git#vX.Y.Z' -s '*' -a claude-code -a codex -a kiro-cli -y
```

The variable comes from the installer's source, not its `--help`, so a later version can drop it.
Without it, `-s '*'` leaves this skill out. Verified on `skills` 1.7.1.

## Running a release

From a clean `main` checkout of the collection that matches `origin/main`:

```sh
make release
```

It prints the tag, commit, preceding release, notes, and Latest decision, and writes nothing.
It ends with the exact publish command, which names the tag and the full commit SHA:

```sh
make release TAG=vX.Y.Z PUBLISH=<full sha>
```

The script runs from the release checkout's own `tools/`, so the code that publishes `main` is `main`'s code.

## Recovery

Matching local and remote lightweight tags resume at the same commit, even after main advances.
A missing remote tag is pushed from a verified local tag. A missing local tag is recreated from a verified remote tag.
A matching stable release is unchanged. Conflicts stop without moving tags or editing releases.
Matching requires the notes heading and the complete deterministic body.
Releases published by hand before this process, `v0.0.3` to `v0.0.12`, have no notes heading and are conflicts.
A target draft or prerelease is also a conflict; the script never publishes beside it or replaces it.
A pushed mistake needs a new patch version through the normal pull request process.

Notes come from the target commit's changelog and cover every version since the preceding published stable release.
The notes heading records that boundary, so later publication of an older tagged version keeps a correct release a no-op.
An older interrupted release uses `--latest=false` when a higher stable release exists, and keeps the previous Latest.
