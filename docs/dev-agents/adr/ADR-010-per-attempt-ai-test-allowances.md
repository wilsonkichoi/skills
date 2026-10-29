# ADR-010: Each attempt has its own AI test allowance, and five fixing rounds by default

Date: 2026-10-28. Status: accepted. Amends [ADR-003](./ADR-003-review-and-fix-rounds.md) (the `max_fix_attempts` default).

## Context

The token-usage rule allowed 6 additional AI test sessions per change. The initial build usually
spent them, so later fixing rounds had no allowance to test their own fixes. The maintainer asked
for separate allowances for the initial implementation, each fixing round, and the final review,
configurable for this project and adopting projects ([#91](https://github.com/wilsonkichoi/skills/issues/91)).
They also raised the default fixing rounds from 3 to 5.

## Options

1. **One allowance per change (the old rule).** Gains: one number bounds the whole loop. Costs: a
   fixing round late in the loop cannot test its fix, which is the gap the maintainer reported.
2. **One pooled allowance per pull request, shared by every attempt.** Gains: a fixed ceiling.
   Costs: an early attempt can still starve a late one, and the pool needs a running counter that
   every restart must reconstruct.
3. **An allowance per attempt.** Each `wkc-implement` build and each `wkc-code-review` round,
   the final review-only round included, gets `max_ai_test_sessions_per_attempt`, default 6. Gains:
   every attempt can test its own change, and the ceiling for a loop is still known: 6 × (1 + 5 +
   1) = 42 with the defaults. Costs: a full loop may spend more sessions than option 1.

## Decision

Option 3, the maintainer's choice. `max_fix_attempts` defaults to 5. Both fields accept integers
of zero or more, and any other value stops before a test starts. The allowance is a ceiling: direct
checks come first, and no AI test session starts when they suffice.

Each skill posts an `AI test session:` comment on the ticket before every start, naming the
attempt. The count for an attempt is its records, so a failed start counts, and a resumed or
restarted attempt keeps its usage without a counter in any session. Unused allowance does not carry
forward. Fixing rounds already used stay counted against the new default, because the count comes
from `fixed` verdicts, never from the limit a verdict printed.

## Consequences

- SPEC Config fields gain `max_ai_test_sessions_per_attempt`, and a new AI test sessions contract
  holds the record template. The handoff and verdict templates gain an `AI test sessions:` line.
- The token-usage rule counts per attempt instead of per change. Concurrency, cross-harness, nested
  worker, and quota, rate-limit, and authentication stops are unchanged.
- One ticket comment per AI test session. With the defaults that is at most 42 on one ticket, and
  usually far fewer, since most changes need none.
