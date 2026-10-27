# ADR-009: Bound additional work, continue review changes, and select worker models

Date: 2026-10-27. Status: proposed for final review. The maintainer requested these outcomes on
2026-10-27 and asked to apply the planning handoff. This ADR makes their contract details explicit.
Amends [ADR-003](./ADR-003-review-and-fix-rounds.md),
[ADR-005](./ADR-005-review-rounds-improve-code.md),
[ADR-007](./ADR-007-run-branch-and-run-config.md), and
[ADR-008](./ADR-008-run-completes-its-tickets.md).

## Context

The maintainer expects research, design, planning, and kickoff approval to keep unexpected work
small. They want a safeguard against additional execution, with a configurable default of five
tickets, while retaining `max_fix_attempts`. They declined an elapsed-time run budget.

Human review normally asks for a few corrections. Completed work should stay completed on the
same run branch and PR. The old design described abandonment and supersession but did not define
renewed scope or grants on an open PR. Its one immutable config could not change after kickoff.
The GitHub-variable store used the branch name as its unique key and deleted the value on close.

The maintainer reports good results from Opus 5.5 implementation followed by GPT-6.1 Sol review/fix
and then a fresh Opus 5.5 review/fix. They want project defaults and ticket overrides for both
manual and YOLO work. Claude Code coordinates because their subscription-backed `codex exec`
works and `claude -p` is unreliable in their setup. This is reported operating experience, not a
general claim about either subscription product. No live mixed-provider test ran for this ADR.

## Options

For additional work:

1. Limit additional admissions beyond a frozen initial scope. This preserves the approved
   milestone and bounds surprises. It needs an explicit list of initial IDs.
2. Limit total tickets. This is easy to count but can block a large milestone already approved.
3. Limit elapsed time or tokens. These can bound different kinds of usage but elapsed time was
   declined and a shared enforceable token counter is not part of this design.

For human review changes:

1. Continue on the same branch/PR with an immutable config per explicitly renewed phase. This
   preserves work and authority history. Readers must understand phase membership.
2. Edit the original config. This is shorter but defeats its edit detection and hides changed
   authority from a resumed worker.
3. Always start another run and PR. This keeps one config per run but fragments ordinary review
   corrections and makes accepted work harder to follow.

For model selection:

1. Claude Code dispatches native Claude agents and `codex exec` workers using the existing skills.
   This fits the requested subscriptions and preserves skill ownership. It requires a narrow
   exception to cross-harness rules and careful manual-question forwarding.
2. Require a person to launch each provider. This keeps execution simple but leaves the requested
   YOLO sequence unattended only in name.
3. Add a generic runner or API gateway. This could support more providers but adds runtime,
   billing, packaging, and configuration that the request does not need.

## Decision

Use option 1 in each group. The requested outcomes are settled; this planning PR presents the
following contract details for final review:

- `max_additional_tickets` is a non-negative project config integer, default 5. Initial scope
  includes approved dependent tickets. Only additional admissions consume it; filing backlog
  discoveries does not. Deduplication and serialized admission prevent double spending.
- Resume does not reset admissions. Cancel, park, split, or transfer does not refund a slot.
  Extra split children count unless originally approved. A valid split replaces the remaining
  deliverable in readiness, never claims the canceled parent is done.
- Initial and admitted work can finish after the allowance is spent. A required unadmitted
  prerequisite or repair keeps the PR draft. There is no elapsed-time run budget.
- Human review corrections reuse the branch and PR. Reuse existing authority where sufficient;
  otherwise the person approves a continuation phase. `Continues` differs from `Supersedes`.
  Every phase remains part of final readiness, and existing review/fix counts remain.
- Keep predecessor configs while the PR is open. Give GitHub variables unique phase suffixes.
  Verify outcome comments naming the carrying PR and config refs before retirement so delivery
  can be checked without a deleted config. A closed run can be reopened with fresh authority
  using those records; no old grant is reconstructed as new permission.
- Project `implementation_model` and `review_models` select an exact model and optional effort
  per role. Ticket `## Execution` values replace named roles. Setup offers Opus 5.5 for build and
  Sol 6.1/Opus 5.5 for review. Effort has no collection default. An absent manual route preserves
  the current harness. Only a person changes selections; technical delegation is not model escalation.
- Alternate by completed review round, including confirming rounds. An approval stops the loop.
  Duplicate verdicts and failed launches do not advance it. Every review uses a fresh context,
  even when returning to the implementation model. `max_fix_attempts` keeps its existing meaning.
- The main Claude Code session dispatches all workers. Workers never delegate or launch another
  harness. Native and external workers share limits. Use subscription login, not API or provider
  fallback. A permission refusal or unavailable model is reported, never bypassed.
- Manual calls keep their step boundaries and questions. Non-interactive execution grants no
  autonomous authority. `--run` remains the only unattended-call marker.
- Model-routing integration validation needs explicit approval of its fixture, session count,
  and concurrency. General cross-harness testing remains prohibited.

The SPEC's Model selection and dispatch and wkc-yolo run sections own the field and record
contracts. Setup writes each field in the same implementation PR as its first consumer. No new
skill, runtime framework, shipped agent-definition tree, or script is introduced by this ADR.

## Consequences

The allowance bounds scope growth, not tokens. A hard ticket can still use significant resources;
review limits, repeated-failure stops, and account limits remain separate controls.

The person can review one evolving PR without losing completed work. Phase records add lookup
work, especially for variable stores. They also prevent a restart from granting itself another
allowance or silently renewing deployment access.

Configured routing changes where a skill executes, not what it is allowed to do. Both providers
must honor push checks, fresh-context review, tracker verification, and human default-branch
merge. Runtime model evidence may be unavailable; records distinguish requested from observed.

Installed harness capabilities and the manual-question path still need a controlled integration
pilot. Read-only CLI help and documentation support the interface choice but do not prove
subscription access or end-to-end behavior. The model-routing ticket owns that validation.

## Evidence

- Maintainer instructions on 2026-10-27 and the planning handoff in that conversation.
- [Codex non-interactive reference](https://learn.chatgpt.com/docs/developer-commands#codex-exec)
  and local `codex-cli 0.164.0` help, read 2026-10-27: model selection, working directory, stdin,
  JSON output, and last-message output are exposed. No model session was launched.
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) and
  [model configuration](https://code.claude.com/docs/en/model-config), read 2026-10-27: native
  non-fork agents have fresh contexts, model selection is supported, and effort controls depend
  on installed version. Account access and exact runtime settings require validation.
