# ADR-004: wkc-backlog owns tickets, wkc-plan owns the ROADMAP

Date: 2026-10-21. Status: accepted, amended 2026-10-24 by [SPEC Invocation](../SPEC.md#invocation) (`wkc-plan` opts into model invocation again, beside `wkc-backlog`). Supersedes [ADR-002](./ADR-002-plan-absorbs-backlog.md).

## Context

ADR-002 folded the planned `wkc-backlog` into `wkc-plan`, and
[PR #41](https://github.com/wilsonkichoi/skills/pull/41) built it: one `SKILL.md` that writes the
ROADMAP, drafts one milestone's tickets, and takes one change at a time. Building and reviewing it
showed costs that ADR-002 did not weigh:

- **Two approvals in one question.** The ROADMAP and the tickets shared one set of options. The
  pilot session showed the change options for a milestone and published at `backlog` (S1), and the
  final review found the options inconsistent once the ROADMAP was approved
  ([wkc-plan runbook](../../../validation/wkc-plan.md#dated-report-2026-10-21)).
- **Compression.** The file reached 249 lines, and fitting it under 250 narrowed four rules: draft
  ids kept apart from tracker ids, waves for one ticket, generated files as a coordination risk,
  and the `next` tie-break.
- **Invocation.** Discovered work needs a skill a model can call, so PR #41 opted `wkc-plan` into
  model invocation. The same skill writes the ROADMAP, a product document, and the SPEC keeps
  product-document writers manual (SPEC Invocation).
- **Ownership.** Every other lifecycle document has one owner: `wkc-research` the PRD,
  `wkc-architect` the SPEC. `wkc-plan` owned the ROADMAP and every ticket mutation.

## Options

1. **Keep ADR-002.** Gains: no new skill, no handoff. Costs: the four problems above stay.
2. **`wkc-plan` with mode files** (`roadmap.md`, `tickets.md`). Gains: one entry point. Costs: the
   maintainer has seen models skip instructions behind a second reference (ADR-002), and the
   invocation conflict stays.
3. **Separate skills.** `wkc-plan` writes the ROADMAP and reads the tracker; `wkc-backlog` drafts,
   checks, and publishes every ticket write. Gains: one owner per artifact, one approval per skill,
   model invocation only where tickets need it. Costs: one more skill on the roster; a milestone's
   tickets need a second skill load.

## Decision

Option 3 (maintainer, 2026-10-21). `wkc-backlog` takes a milestone or one change, and owns the
ticket templates, the dependency graph, the edge order, approval, publishing, and recovery, as
PR #41 built them. `wkc-plan` writes only the ROADMAP, reads the tracker through `wkc-tracker`, and
after approval can hand a milestone to `wkc-backlog` in the same session. `wkc-tracker` keeps ticket
storage and its verbs, unchanged.

ADR-002's arguments, checked again:

- **Duplicated ticket-writing rules.** Still applies. Only `wkc-backlog` carries the templates, the
  graph rules, and the publish steps; `wkc-plan` carries none, so nothing can drift.
- **Repeated document reads.** Partly applies. Both skills read the PRD, SPEC, and ROADMAP, which
  is a few short reads, not shared logic. When `wkc-plan` hands over in the same session,
  `wkc-backlog` skips a document already read and unchanged.
- **Extra handoffs.** Applies only to milestone planning: one skill load after the ROADMAP is
  approved, started by the user's option 1. Change handling has no extra hop: discovered work goes
  to `wkc-backlog` as it went to `wkc-plan`.
- **Models skipping supporting files.** Still applies, and is why this is two skills, not one skill
  with mode files. Each is one `SKILL.md` with no supporting files.

## Consequences

- The README roster gains `wkc-backlog`; the `wkc-plan` row shrinks to the ROADMAP.
- `wkc-plan` returns to manual invocation. `wkc-backlog` opts into model invocation in its place,
  for `wkc-implement`, `wkc-code-review`, and `wkc-yolo`.
- SPEC references to `wkc-plan` as the ticket writer, the discovered-work receiver, and the
  `wkc-yolo` callee now name `wkc-backlog`. The ROADMAP's M1 delivers `wkc-backlog`.
- No generic framework, shared include, or orchestration layer is added for the shared reads.
- PR #41's validation tested the combined skill. It is kept as history and is not evidence for
  either separated skill.
- The SPEC-gap failure on `notes list` (PR #41, S2 and S10) is not addressed by this split. It stays
  a regression case in the `wkc-backlog` runbook.
