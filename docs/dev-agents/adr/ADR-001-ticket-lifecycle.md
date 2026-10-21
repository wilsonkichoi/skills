# ADR-001: Ticket lifecycle and definition of done

Date: 2026-10-20. Status: accepted

## Context

[Issue #15](https://github.com/wilsonkichoi/skills/issues/15) asks for the `wkc-implement` lifecycle
contract: assignment timing, PR references, PR labels, review handoff, and completion after merge or
deployment. Its observed failure: an implementation session skipped the `in-review` move, and the PR
for #12 needed a non-closing `Refs #12` because #12 still had a release and a pin check after merge.

The tracker defines `done` as "Merged and verified. Never merged soon"
([wkc-tracker statuses](../../../skills/wkc-tracker/SKILL.md#2-statuses)). PR #30 removed the
`wkc-verify` skill that used to decide it. Done differs by ticket (maintainer, 2026-10-20): review
and tests only; plus integration tests; or plus merging to a branch, publishing, deploying, and
testing the release. The maintainer also wants agent merges in trusted projects and a person's
merge in compliance projects.

## Options

1. **The ticket defines done; `wkc-implement` owns the ticket from claim to `done`; merge is a
   gate.** Gains: one owner per ticket, the same path on GitHub, Linear, and local, `done` always
   checked against the ticket. Costs: one rerun of `wkc-implement` after each manual merge; the
   skill gains a second mode. Rules out: closing keywords.
2. **Closing keywords close the ticket on merge when merge is the last step.** Gains: no extra step
   on GitHub. Costs: two paths; Linear and local still need option 1; Linear's GitHub integration
   is untested here.
3. **A separate delivery skill runs post-merge steps.** Gains: deploy authority stays out of the
   skill that writes code. Costs: one more skill, against PR #30's goal of fewer entry points.

## Decision

Option 1. The maintainer chose to try the rerun first and add a small delivery skill only if the
rerun makes `wkc-implement` hard to follow.

- **Done lives in the ticket.** `## Acceptance criteria` is everything checked before merge,
  including a person's sign-off when one is needed. An optional `## After merge` lists the steps
  and checks that run after merge. `wkc-implement` takes post-merge gates from the whole ticket,
  because older tickets put them under `## Acceptance criteria` (issue #12). A ticket with no
  post-merge gate is complete at merge.
- **States.** `wkc-implement` claims (`ready` to `in-progress`), opens the PR, and moves the ticket
  to `in-review`. It stays `in-review` through review rounds. After merge, a rerun moves it to
  `done`, or to `in-progress` while its post-merge gates run and then to `done`. Each gate's
  evidence names the merge commit, the release or environment, and the validation result. A gate
  that lacks authority or cannot run leaves it `in-progress` with a comment naming what is left.
- **Failed gates.** A merged PR cannot be reopened. A gate that fails because of the ticket's
  change gets a follow-up PR on the same ticket, from the current `main`, reviewed like any PR;
  after it merges, every post-merge gate runs again (maintainer, 2026-10-20). A cause outside the
  ticket is discovered work that blocks it. The same gate failing again for the same cause stops
  for a person.
- **References.** PRs never use closing keywords or Development associations. GitHub tickets use
  `Refs #N`.
- **Labels.** PRs carry no status labels. The ticket's status is the state.
- **Merge.** A merge counts only when the host reports `MERGED` with a merge commit; a queued or
  auto-merge PR is still waiting. Outside `wkc-yolo`, a person merges. Inside a run, `merge_gate` in the config decides:
  `agent` (default) lets `wkc-yolo` merge an approved head, `human` makes it stop. A run can tighten
  the gate, never loosen it.

## Consequences

- Every ticket `wkc-backlog` writes must state its post-merge steps, or have none. (This named
  `wkc-plan` until [ADR-004](./ADR-004-backlog-separate-from-plan.md) moved ticket writing to
  `wkc-backlog`.)
- A merged ticket stays `in-review` until someone reruns `wkc-implement`. `wkc-tracker list in-review`
  shows them.
- Publishing and deploying keep their own authorization; an implementation request does not grant it.
- Issue #15's remaining acceptance criteria (validation cases, tracked documentation) are delivered
  with the `wkc-implement` port.
