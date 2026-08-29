# Contributing

Solo-maintained repository. The rules here exist so an AI agent and a human follow the same path.
Authoring conventions live in [AGENTS.md](./AGENTS.md); this file covers the repository mechanics.

## Branch and pull request

Never commit or push directly to `main`.

```
git checkout main && git pull
git checkout -b docs/some-slug
```

Branch names are `<type>/<slug>`: `docs/`, `feat/`, `fix/`, `chore/`. Commit on the branch, push it,
and open a pull request against `main`:

```
gh pr create --base main --fill
```

Merging is a human decision. An agent prepares the branch and the pull request and stops there.

## Before you commit

Run the pre-commit checklist in [AGENTS.md](./AGENTS.md#pre-commit-checklist). It covers the
`VERSION` bump, the `CHANGELOG.md` entry, and the `README.md` roster row. Do not restate it here;
one copy only.

## Rulesets and settings

Two repository rulesets are applied and active, both with an empty `bypass_actors`, so they bind the
owner too. Recorded here so the configuration is readable without opening GitHub settings, and
reproducible if the repository is ever recreated.

`main pull request gate`, target branch `~DEFAULT_BRANCH`:

```
gh api repos/wilsonkichoi/skills/rulesets -X POST --input - <<'JSON'
{
  "name": "main pull request gate",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash", "merge", "rebase"]
      }
    }
  ]
}
JSON
```

Zero required approvals, so you can open a pull request and merge it yourself. The gate is on using
a pull request at all, not on getting a review. GitHub adds
`require_extra_approval_for_unattributed_changes: true` to the payload on its own; it is their
default and it does nothing at zero approvals.

`Immutable release tags`, target tag `refs/tags/v*`:

```
gh api repos/wilsonkichoi/skills/rulesets -X POST --input - <<'JSON'
{
  "name": "Immutable release tags",
  "target": "tag",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "update" }
  ]
}
JSON
```

No `creation` rule, so a release tag can be pushed but never moved or deleted afterwards. That is
what makes a pinned install a pin.

Verify enforcement by attempting the thing that should fail, not by trusting that the POST returned
201. A direct push to `main` gets `GH013 ... Changes must be made through a pull request`, a
`git push --force` at an existing `v*` tag gets `Cannot update this protected ref`, and
`git push origin :refs/tags/vX.Y.Z` gets `Cannot delete this tag`.

There is no CI in this repository and no validation workflow. Adding one is a decision to maintain
it; the previous toolkit died of exactly that. Note that a `required_status_checks` rule naming a
job that never reports would leave every pull request unmergeable, with no bypass actor to rescue
it, so a check gets added to a ruleset only after its workflow has run green on a real pull request.

Two plain repository settings, which live in GitHub's Settings page rather than in a ruleset:

- **Automatically delete head branches** (`delete_branch_on_merge`) is off, deliberately. A merge is
  sometimes what triggers the thing you are verifying, and the branch has to survive until that
  verification comes back. Delete it yourself once you are done, and do not reach for
  `gh pr merge --delete-branch` as a reflex.
- **Wikis** (`has_wiki`) is off. Unused surface on a public repository.

## Releasing

A version becomes a release when it is tagged at its merged commit. After the pull request lands:

```
git checkout main && git pull
git tag "v$(cat VERSION)"
git push origin "v$(cat VERSION)"
gh release create "v$(cat VERSION)" --title "v$(cat VERSION)" --notes "$(grep -m1 "^$(cat VERSION) " CHANGELOG.md)"
```

The tag is what a pinned install points at:
`npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#vX.Y.Z'`, quoted because `#`
starts a shell comment. The `owner/repo@vX.Y.Z` shorthand does not pin, since `@` selects a skill
name. See the install section in `README.md`.

The tag ruleset blocks moving or deleting it once pushed, so read `VERSION` and the `CHANGELOG.md`
line before the `git push origin`. A wrong release is fixed by cutting the next patch version.
