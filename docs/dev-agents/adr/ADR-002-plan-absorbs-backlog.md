# ADR-002: wkc-plan absorbs wkc-backlog

Date: 2026-10-20. Status: accepted

## Context

PR #30 planned `wkc-backlog` to take a request or change between planning runs, judge whether it
touches tickets, the SPEC, or the PRD, route document changes, and change tickets through
`wkc-tracker`. `wkc-implement` and `wkc-code-review` will also find work outside their ticket's
scope and need somewhere to send it. `wkc-plan` already reads the PRD, SPEC, ROADMAP, and tracker,
and already writes tickets, checks the dependency graph, and publishes through `wkc-tracker`
([wkc-plan](../../../skills/wkc-plan/SKILL.md)).

## Options

1. **Fold backlog into `wkc-plan`.** Gains: one place for ticket-writing rules (criteria,
   `## After merge`, edges, publishing), so the rules cannot drift between two skills; one entry
   point for any change to the ticket graph. Costs: `wkc-plan` is already 211 lines, over the
   150-line guide, and grows further.
2. **Ship `wkc-backlog` as planned.** Gains: each skill stays smaller. Costs: two skills read the
   same documents and write tickets by the same rules, and the copies drift.

## Decision

Option 1 (maintainer, 2026-10-20). `wkc-plan` takes either a milestone to plan or one change: a
request, discovered work, or a refinement, split, re-block, or cancel of existing tickets. Both run
the same read, draft, graph check, approval, and publish steps. Document changes still go to
`wkc-research` and `wkc-architect`; `wkc-plan` writes only the ROADMAP and tickets.

## Consequences

- The README roster drops `wkc-backlog`, and the `wkc-plan` row grows.
- `wkc-plan` stays one `SKILL.md`, about 250 lines, past the 150-line guide and within the spec's
  500. Supporting files per mode were rejected: the maintainer has seen models skip instructions
  reached through a second reference, and repeated reminders did not fix it.
- "Never change a reused ticket" becomes "an existing ticket changes only as shown in the approved
  draft", for every run. The draft names the holder of any `in-progress` or `in-review` ticket it changes.
- `wkc-plan` is the only skill that creates or edits tickets beyond a ticket's own state and comments.
  `wkc-implement` and `wkc-code-review` hand discovered work to it.
- Considered and rejected on 2026-10-20: `wkc-plan` handing every ticket to a revived `wkc-backlog`
  to create. Each planned milestone would cost a second skill load, a second read of the same
  documents, and a handoff, with nothing gained.
- The maintainer's untracked drafts for `wkc-backlog` and `wkc-create-ticket` become input for this change.
