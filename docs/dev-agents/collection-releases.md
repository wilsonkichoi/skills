# Collection releases

Read this before changing release tooling, `wkc-skills-release`, or a skill's `metadata`.
[AGENTS.md Versioning](../../AGENTS.md#versioning) owns version numbers, tags, and pins.

`wkc-skills-release` publishes this collection only; adopting projects keep their existing release
and deployment processes. The release rules are code in [`tools/release.mjs`](../../tools/release.mjs),
run by `make release`, and its `REPO` constant is the one repository identity. The skill is a thin
entry point: it runs the plan, asks for authorization, and runs the publish command the plan printed.
There is no generic release config because setup config belongs to adopting projects, not collection
publication.
The collection uses one `VERSION` and immutable tags for complete snapshots. Per-skill version stamps
would create competing version records and cannot improve a pin that already selects the entire tree.
The script runs from the release checkout's own `tools/`, so the code that publishes `main` is
`main`'s code, with no installed copy to bootstrap or verify. No release hooks, build system, or
per-harness copies are needed.

`metadata` normally maps strings to strings under the Agent Skills specification. The sole exception
is `wkc-skills-release`'s boolean `metadata.internal: true`, because the `skills` installer checks
`metadata.internal === true` to hide it from public discovery and bulk installation. A string
`"true"` does not work. Explicit installation by name includes it; visibility does not authorize release writes.
Codex, Claude Code, and Kiro CLI loaded the boolean in the recorded validation runs.
Recheck compatibility when metadata or supported harness versions change. If a supported harness rejects the boolean,
remove it from the one shared source and document that direct bulk installation includes the maintainer skill.
Unavailable checks are SKIP, not proof of incompatibility. Record results in its validation runbook.
