# ADR-003: The reviewer fixes its own findings, in fresh-context rounds

Date: 2026-10-20. Status: accepted, amended by [ADR-005](./ADR-005-review-rounds-improve-code.md) (suggestions, counting, independence)

## Context

PR #30 dropped `wkc-fix`. Correcting review findings was left to the `wkc-implement` port, with a
rerun on the same PR as the likely answer. The maintainer prefers the reviewer to fix what it found,
because it already understands the finding (2026-10-20). The rule that a review must run in a
context separate from the one that wrote the code still holds ([PR #30](https://github.com/wilsonkichoi/skills/pull/30)).

## Options

1. **The reviewer fixes, and every round is a fresh context.** A round reviews the whole PR, fixes
   its blocking findings, and pushes. A fix is never approved by the context that made it; the next
   round reviews it. Gains: no handoff back to the implementer; the finding's author applies the
   fix. Costs: a reviewer that fixes can drift into fixing suggestions, so the rule limits it to
   blocking findings.
2. **`wkc-implement` reruns on the PR to fix findings.** Gains: only one skill edits code. Costs: the
   implementer re-reads findings it did not write, and every round needs a handoff back.

## Decision

Option 1. A round's verdict is `approve` (nothing blocking, nothing changed), `fixed` (blocking
findings fixed, another round needed), or `stopped`. `max_fix_attempts`, default 3, counts the
rounds that fix code. After the last allowed fix, one review-only round always runs and ends in
`approve` or `stopped`; with `0`, the first round is review-only. A finding that returns after
being fixed also stops review. Suggestions are reported,
never applied. `max_fix_attempts` is a config field by the maintainer's choice, replacing the
AGENTS.md porting rule that cut it as a tuning knob.

## Consequences

- An approval applies only to the head it reviewed. A merge of any other head needs another round,
  including a clean update from `main`; that round only confirms the change from the approved head
  is `main`'s.
- In a manual session, a review in the context that wrote the code says it is not independent.
  `wkc-yolo` starts each round in a fresh context.
- AGENTS.md porting step 3 must stop listing `max_fix_attempts` as a knob to cut, in the PR that
  adds the field.
