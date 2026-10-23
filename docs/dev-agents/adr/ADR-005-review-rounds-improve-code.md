# ADR-005: Review rounds may apply worthwhile improvements, and only a fresh context approves

Date: 2026-10-23. Status: accepted. Amends [ADR-003](./ADR-003-review-and-fix-rounds.md).

## Context

ADR-003 let the reviewer fix its own blocking findings and kept suggestions report-only, because a
reviewer that fixes "can drift into fixing suggestions". The maintainer's review of PR #58, with
Anthropic's write-up of how the Claude Code team runs code review
([blog](https://claude.dev/blog/solving-code-review-at-anthropic/)), found two costs in that rule:

- **Actionable suggestions go nowhere.** An AI reviewer can make a worthwhile in-scope improvement
  as cheaply as it can describe one. A report-only suggestion needs a person or another session to
  act on it, and in an unattended run nobody does.
- **Approval by the authoring context is allowed.** ADR-003 says "A fix is never approved by the
  context that made it", and also that a review in the context that wrote the code runs and says it
  is not independent. The skill took the second sentence: validation run S1 posted a verdict from
  the session that ran `wkc-implement` (`validation/wkc-code-review.md`). Nothing stopped that
  verdict from being `approve`.

The write-up also names what keeps review rounds converging: verify a finding before acting on it,
do not repeat findings a later round already resolved, and review the changes since the last round
for regressions.

## Options

1. **Keep ADR-003.** Gains: the smallest fix commits. Costs: worthwhile improvements stay unmade, and
   the independence conflict stays open.
2. **Apply worthwhile in-scope improvements, count every code-changing round, and approve only from
   a fresh context.** Gains: a review round improves the code as well as judging it, and approval
   always comes from a context that wrote none of the code. Costs: fix commits grow, and a change made
   only for an improvement costs one fixing round and one more review round.

## Decision

Option 2.

- A round may apply worthwhile in-scope improvements, alongside its blocking fixes or on their own.
  An improvement names its concrete benefit. Purely subjective changes, reversals of earlier style
  choices without a reason, and refactoring with no identifiable benefit stay suggestions. Blocking
  findings come first. The last fixing round fixes blocking findings only, because only a
  review-only round follows it, and a regression an improvement added there could only end in
  `stopped`. So an improvement-only round needs two fixing rounds left.
- Every round that commits code is `fixed` and uses one of `max_fix_attempts`, whatever the change
  was for. A round that changes nothing uses none. The field keeps its values and default.
- A blocking finding is verified before it is fixed: the round confirms the defect from the code,
  a reproduction, a test, CI output, or the SPEC, and reports what it could not confirm.
- A later round reads the earlier verdicts, does not raise a resolved finding again, and checks the
  changes since the last round for regressions. A blocking finding that came back after being fixed
  still stops review. An improvement that is undone is not a returned finding.
- A round in a context that wrote any of the PR's code may fix or stop, and says `Independent: no`.
  It never approves: where its review finds nothing to change, it posts no verdict and asks for a
  fresh session.

ADR-003's other decisions stand: the reviewer fixes its own findings, `approve`, `fixed`, and
`stopped` stay the verdicts, a review-only round always follows the last fix, and an approval
applies only to the head it reviewed.

## Consequences

- The verdict comment keeps its format and gains one line kind, `- improved <file:line> <change>`,
  so the returned-finding rule can tell blocking fixes from improvements. Earlier verdicts stay valid.
- SPEC Review verdict, the `max_fix_attempts` meaning, and #54's criteria that kept the nit out of
  the fix commit and allowed a non-independent verdict change in the same PR.
- `wkc-yolo` already starts each round in a fresh context, so this needs no change there.
- A round now fixes toward its ticket's unmet criteria, so the wrong ticket does harm. For a PR, the
  SPEC takes the ticket whose handoff names it, and a ticket the PR only cites counts only when it is
  `in-review` with no handoff naming another PR.

## Left out

The review notes behind this ADR proposed more. These were not done here:

- Wider PR discovery for `wkc-implement` finish, such as GitHub-linked issues or branch names:
  declined by the maintainer on 2026-10-23. Finish keeps using only its own handoff record, as #60
  decided, because a wrong PR there moves a ticket to `done`, which the tracker cannot undo.
- Comparing Claude Code's local `/code-review` with this skill, a skill evaluation framework, and
  risk-based review policies: not started. The first needs a spike ticket; the other two need a
  person's decision first, because they add product scope or a new merge-approval contract.
- Linear issue associations as a ticket source: `wkc-tracker`'s Linear backend has no verb that
  reads a PR's linked issues, so on Linear the ticket comes from the handoff or the `Related to
  <ID>` line.
