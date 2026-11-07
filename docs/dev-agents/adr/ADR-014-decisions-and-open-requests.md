# ADR-014: Decide when the documents settle it, and record every open request one way

Date: 2026-11-03. Status: accepted (maintainer, PR #100 review notes 13, 19, 22, and 23).
Amends [ADR-009](./ADR-009-run-budgets-continuations-and-model-routing.md) ("Manual calls keep
their step boundaries and questions") and the review verdict of
[ADR-003](./ADR-003-review-and-fix-rounds.md) and [ADR-005](./ADR-005-review-rounds-improve-code.md).

## Context

- **Manual calls stopped to ask what the documents already settled** (note 19). A run decided from
  the ticket, PRD, SPEC, ROADMAP, and limits and posted a Decision. A manual call ended its turn on
  the question, and in practice the person asked for the agent's recommendation and took it.
- **A request for a person hid in a verdict's details** (note 22). Alternating manual reviews in
  Claude Code and Codex kept posting `fixed` with no new commit. An earlier round needed a person's
  decision, such as more AI test sessions or approval of an unverified fix. That request sat in the
  verdict's item list, so each new round ran anyway until one hit `stopped`.
- **`waiting` meant two things** (note 23). A finish comment's `waiting` covered "a person must
  act" and "the run will retry on its own", so a person skimming outcomes could not tell them
  apart.
- **A park had no defined answer** (note 13). Nothing said how a person answers so a resumed run
  sees it.

## Options

1. One token for every open request, one answer record, and decide-first in every mode.
2. A separate vocabulary per skill. Each is clear alone, and no single search finds every request.
3. Keep today's records, and fix only the `fixed` rule.

## Decision

Option 1.

- **Decide first, in every mode.** When the ticket, PRD, SPEC, ROADMAP, and limits settle a
  choice, the skill decides, acts, and posts a Decision comment. A manual call lists its Decisions
  in its report, so the person can reverse one. It asks only when the documents are silent or
  conflict, or the choice is costly or hard to undo, such as a data migration, a public
  interface, or an irreversible step. It asks with a recommendation and its reasons. `(needs
  authorization)` steps are unchanged: deciding never authorizes a merge, publish, or deploy.
- **`Decision (<skill>):`** names the skill that decided: `wkc-implement`, `wkc-code-review`,
  `wkc-backlog`, or `wkc-yolo`. Its `Question:`, `Choice:`, and `Source:` lines are the same
  everywhere.
- **`needs-decision`** is the one token for a request only a person can answer:
  - the park record, `needs-decision (<skill>): <question>`, with `Open because:`,
    `Recommendation:`, and `Needs:` lines. It replaces `Parked (wkc-yolo):`;
  - a review verdict, `wkc-code-review round <n>: needs-decision, <what>`;
  - a finish state, `wkc-implement: needs-decision, <what>`.
  Under `--run`, a `needs-decision` record is the park.
- **`waiting`** means nobody needs to act and the run retries by itself, such as an environment
  that is unavailable within its grant.
- **`Answer:`**, with a `To:` line linking the request, answers it. Only a record from an account
  with write access counts ([ADR-013](./ADR-013-one-run-config-per-run.md)). A request is open
  until an `Answer:` follows it, or a head or config change resolves it.
- **Review rounds.** `fixed` is posted only when its `Fixed in:` commit is an ancestor of the
  head. A round first reads the latest verdict. An open `needs-decision` there makes the round
  report the request and post nothing. Open requests and SKIP checks go on their own lines right
  after the verdict's first line. Under `--run`, the round decides instead. Limits stay ceilings:
  with the AI test sessions spent, a check is SKIP and an unconfirmed finding is a suggestion.
  `needs-decision` is left for a choice the documents and limits leave undecided.
- **Finish.** `needs-decision`: an unauthorized `(needs authorization)` step, a
  production-affecting gate, an unclear gate class, a missing grant, the same gate failing again
  after a follow-up, or a shared gate's rerun past its grant. `waiting`: an environment
  unavailable within its grant.

## Consequences

Manual calls make more choices without asking, and each one is recorded and reported. One search
for `needs-decision` finds every open request on a ticket or a PR, and `Answer:` closes it.

Readers stay tolerant of older records: `Parked (wkc-yolo):` reads as `needs-decision`,
`Decision (wkc-yolo):` reads as a Decision, and a finish `waiting` written before this change
reads as it was written.

## Evidence

- The PR #100 review notes 13, 19, 22, and 23, and the maintainer's approval on 2026-11-03.
- The maintainer's observation of alternating manual reviews posting `fixed` with no commit
  (note 22).
