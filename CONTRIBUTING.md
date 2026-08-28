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

## One-time maintainer setup

**Not applied yet.** The branch protection described in `AGENTS.md` is a convention today, not an
enforced rule: `gh api repos/wilsonkichoi/skills/rulesets` currently returns an empty list, so a
direct push to `main` would succeed. To apply it, run:

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

An empty `bypass_actors` means the rule applies to the owner too. Once this is applied, update the
Git workflow section of `AGENTS.md` to say the gate is enforced.

There is no CI in this repository and no validation workflow. Adding one is a decision to maintain
it; the previous toolkit died of exactly that.

## Releasing

A version becomes a release when it is tagged at its merged commit. After the pull request lands:

```
git checkout main && git pull
git tag "v$(cat VERSION)"
git push origin "v$(cat VERSION)"
gh release create "v$(cat VERSION)" --title "v$(cat VERSION)" --notes "$(grep -m1 "^$(cat VERSION) " CHANGELOG.md)"
```

The tag is what makes `npx skills@latest add wilsonkichoi/skills@vX.Y.Z -s <skill>` resolve to a fixed
version.
