# wkc- skills ROADMAP

Status: draft

Updated from the [SPEC](./SPEC.md), previously approved 2026-10-26, and the maintainer's confirmed
2026-10-27 requirements. The revised planning documents are drafts pending final review. Every
milestone needs the approved PRD, SPEC, ADRs, and this ROADMAP merged to `main` first:
`wkc-implement` stops on uncommitted planning documents, and a fresh worktree cannot see them.

Validation runs on Claude Code by default. Unrun Codex and Kiro cases are SKIP (PRD Constraints).
The approved Claude Code-to-Codex workflow may receive explicitly authorized integration validation
within the existing session and concurrency limits. This planning update authorizes no AI sessions.
Fixtures that write tickets or PRs use a throwaway GitHub repository, never this one.

## M1: Plans follow changes
Outcome: A person gives `wkc-backlog` a milestone, a bug, a request, or a `Discovered:` comment, and gets tickets drafted from the SPEC's ticket templates, approved, and published. They can ask it to refine, split, re-block, or cancel existing tickets with the same draft and approval. `wkc-plan` writes only the ROADMAP.
Scope: PRD goal 2. SPEC components `wkc-backlog` and `wkc-plan` (one change at a time, the edit rule, the Ticket templates with `## Why` and `## After merge`, the split rule), Discovered work as `wkc-backlog` receives it, Invocation for `wkc-backlog` and `wkc-plan`; ADR-004.
Depends on: the planning documents merged to `main`. Built by hand, because `wkc-implement` and `wkc-code-review` do not exist yet.
Exit check: on a local-tracker fixture, `wkc-plan` writes a ROADMAP and creates no ticket; `wkc-backlog` turns one bug into one `backlog` ticket in the work-ticket template, `## Why` included; turns a fixture `Discovered:` comment into a `backlog` ticket, and links a discovered blocker to the ticket it blocks; splits a ticket so its dependents move to the children before the parent is canceled; and writes `## After merge` for a ticket with a release step. Ticket files are checked with a YAML parser, not from the report.

## M2: Ticket to done by hand
Outcome: A person runs `wkc-implement <id>` on a `ready` ticket and gets an open PR with the acceptance checks run and the ticket at `in-review`. After they merge it, a rerun runs the ticket's `## After merge` steps and moves it to `done`. Work it finds out of scope goes to `wkc-backlog`.
Scope: PRD goal 1 (the implement half). SPEC Lifecycle with follow-up PRs, except its **Local backend** commits (M6), PR body, ticket comments from `wkc-implement`, Linear, Discovered work with the hand-off to `wkc-backlog`, Invocation for `wkc-implement`; ADR-001. Delivers what issue #15 asks for.
Depends on: M1, because `wkc-implement` hands discovered work to `wkc-backlog` and reads tickets in M1's templates.
Exit check: the `wkc-implement` runbook passes on Claude Code; on a local-tracker fixture, a `Discovered:` item reaches `wkc-backlog` at handoff without a person typing it; and this milestone's second ticket is itself taken from `ready` to `done` by `wkc-implement`, with each status confirmed by `gh issue view`.

## M3: Independent review with fixes
Outcome: A person runs `wkc-code-review` in a fresh session on a PR from `wkc-implement`. It posts a verdict, fixes its blocking findings, and a further fresh round approves the fixed head or stops at `max_fix_attempts`.
Scope: PRD goal 1 (the review half). SPEC Review verdict and fix commit, `max_fix_attempts` config field, Discovered work with the hand-off to `wkc-backlog`, Invocation for `wkc-code-review`; ADR-003.
Depends on: M2, because it reviews PRs from `wkc-implement`; M1, for the hand-off.
Exit check: in a throwaway repository, a PR with a planted defect gets a `fixed` verdict, then an `approve` from a second fresh session naming the new head; a defect that comes back after its fix gets `stopped`. The PRs for this milestone are opened by `wkc-implement`.

## M3.1: Milestones close
Outcome: A person runs `wkc-plan close <milestone>` and, once every ticket is terminal and they confirm the exit check, the milestone closes on GitHub. `wkc-implement finish` names that call when its ticket leaves the milestone with nothing open. `wkc-backlog` invokes `wkc-architect` for a SPEC change and `wkc-plan` for a ROADMAP change, so a person no longer types the next planning skill.
Scope: SPEC Milestone close, the `wkc-tracker`, `wkc-plan`, and `wkc-implement` component changes for it, and Invocation for `wkc-architect` and `wkc-plan`, with the `wkc-backlog` calls; the 2026-10-24 SPEC Changes entry. Numbered M3.1 so M4 to M6 keep the names the PRD and SPEC cite.
Depends on: M1, because `wkc-backlog` gains the calls; M2, because it changes `wkc-implement finish`.
Exit check: in a throwaway GitHub repository, `wkc-plan close` on a milestone with one open ticket stops and names it, and writes nothing; with every ticket terminal, it shows the counts and the exit check, closes nothing on a no, and on a yes leaves the milestone `closed` by `gh api`. On a local-tracker fixture, `wkc-tracker milestone close` writes nothing and says the backend has no milestone state. `wkc-implement finish` on a fixture milestone's last open ticket names `wkc-plan close <milestone>` and leaves it open. On Claude Code, `wkc-backlog` given a SPEC change invokes `wkc-architect`, and given a ROADMAP change invokes `wkc-plan`, and each leaves its document at `Status: draft`. Then, on this repository, the maintainer closes `M2: Ticket to done by hand` and `M3: Independent review with fixes` with `wkc-plan close`.

## M4: Unattended runs
Outcome: A person runs `wkc-yolo` on a ticket, a wave, or a milestone and approves its initial scope
and authority in one kickoff round. The run works without further questions until it stops or the
person supplies new input. It merges independently reviewed tickets into its own run branch and
completes each by its own definition of done there or in a granted non-production environment. It
verifies the combined branch at the current commit and ends with one run PR for the person's review
and merge. Production work follows that merge. Delegated planning may change technical plans and
tickets within product intent and safeguards. Additional execution beyond the approved initial scope
has a configurable allowance of five tickets by default. Requested changes continue on the same
branch and PR with completed work preserved. Project and ticket model selections also work in manual
calls. The default model pair is the latest Opus (`opus`) then `gpt-6.1-sol`, both at `medium`
effort: Opus builds, and each independent review uses the other model from the preceding build,
update, or review step, starting with Sol, then a fresh latest-Opus context. A
configured secret scan blocks unsafe pushes by either provider in every mode.

Scope: PRD goals 1 and 3, model-selection and subscription constraints, and its Security constraint.
SPEC Config fields, Ticket execution overrides, Lifecycle, Review verdict, Unattended calls,
Delegated run authority, `wkc-yolo` run, run config/stores, run branch, continuation ownership,
Ticket scope and Gate classes, Push check, Security, Failure handling, Grants and Cleanup;
`push_check`, `run_config`, `max_additional_tickets`, `execution_models`, `headless_workers`; ADR-006, ADR-007, ADR-008,
and [ADR-009](./adr/ADR-009-run-budgets-continuations-and-model-routing.md). By default Claude Code coordinates
native Claude agents and subscription-authenticated `codex exec` workers. `claude -p` runs only
when a project lists `claude-code` in `headless_workers`; no API billing fallback or nested
workers are introduced. There is no elapsed-time run budget.
`max_fix_attempts`, grant expiry, command timeouts, and existing session limits remain. A
local-backend run end to end is M6's.

Depends on: M1, M2, M3, M3.1 (`wkc-backlog` invokes `wkc-architect` and `wkc-plan`), PRs #75, #78,
and #79, and approval and merge of the revised PRD, SPEC, ROADMAP, ADR amendments, and narrow
cross-harness rules. Model routing is a separate implementation deliverable within M4 because
manual users can use it without YOLO.

Exit check: use focused fixtures in a throwaway GitHub repository. Direct checks cover mechanical
admission records, config validation, continuation relationships, PR heads, and selected settings.
Instruction-following checks use only explicitly authorized sessions within the recorded limits.

- A milestone with two independent tickets and one dependent ticket completes all three on its run
  branch. The run PR is ready at a verified head and remains unmerged. The run merges nothing into
  `main`. Restart resumes claimed work without duplicate claims. Every decision is recorded as a
  `Decision (wkc-yolo):` comment.
- The initial snapshot includes approved dependent tickets and excludes work the person left out
  or moved to release tickets. Those initial tickets spend no additional allowance. With an absent
  `max_additional_tickets`, five distinct added admissions are allowed. The next stays at `backlog`.
  Zero allows initial work only. Invalid limits stop before admission. A prerequisite, readiness
  repair, reused out-of-scope ticket, or new split child spends one slot on admission. Resume and
  duplicate discoveries spend no extra slot. Canceling an admitted ticket does not refund it. Two
  workers competing for the last slot leave only one recorded admission before dispatch. Required
  unadmitted work keeps the run PR draft; unrelated backlog work does not.
- A check that passed on a ticket branch and fails after another merge is repaired through a
  reviewed ticket and rechecked. A `done` ticket stays terminal. Its repair needs no blocker edge
  to it. With `record only` or no allowance left, required repairs remain at `backlog` and readiness
  remains draft. Delegated planning cannot relabel added work as initial scope, change the PRD,
  raise the allowance, escalate models, renew grants, or weaken safeguards. Without delegated
  planning, a needed planning change parks its ticket. Duplicate discoveries share one ticket.
- A project pair and a ticket's pair select the expected models: the first builds, and each review
  uses the other model from the preceding completed step. A completed `fixed` round passes the next round to the other
  model. Review-only rounds also advance it. Duplicate verdicts and failed launches do not advance
  it. Approval ends the loop. An interrupted run reconstructs the next model from recorded
  build/update and review steps. A pre-merge Opus update after Sol approval is reviewed by Sol,
  regardless of verdict number. Swapping the pair after Sol review selects Opus next. Replacing
  both entries uses the new second entry; effort changes alone do not change model identity.
  Later model edits affect the next dispatch without reapproval and preserve fixing-round usage.
  The final review-only round still follows the last allowed fixing round. Reviewers use fresh contexts and no
  implementation conversation.
- Configured manual implementation and review calls honor their model selections while preserving
  one requested step and approval questions. With no routing configuration, existing manual
  behavior remains in the invoking harness. An unsupported coordinator or setting gives a blocked result or
  concrete manual handoff. A manual question from a non-interactive worker reaches the person and
  stops its dependent step. Resuming after the answer rereads the live pair and uses a fresh
  worker if the selected model or effort changed. Integration validation confirms Claude native-agent
  dispatch and explicit-model `codex exec` dispatch with effective subscription provider and login. A stored
  ChatGPT login plus an API-key gateway configuration is refused. Both workers count against the same
  limits. No worker delegates. No API fallback or automatic substitution occurs. With the
  default `headless_workers`, no `claude -p` starts and a pinned Claude ID is blocked; listing
  `claude-code` allows both and a Codex coordinator, and a ticket cannot change the list. A run
  without a pair runs each role on its own harness in fresh sessions. Kickoff asks the person to
  confirm the coordinator's full-permission mode and reports it as confirmed, not observed. A quota,
  rate-limit, or authentication error stops all dispatch without retries. Claude bypass mode
  with its Bash sandbox still enabled does not pass the no-sandbox check.
- Requested changes preserve the run branch, PR, completed tickets, and evidence. The PR becomes
  draft before correction work changes its result. Reused unfinished or new correction tickets
  follow implementation, independent review, merge, and finish. A routine restart preserves its
  config and remaining allowance. Explicit human renewal creates an immutable continuation linked
  to its predecessor and the same branch and PR. Earlier-phase tickets remain same-run work.
  Earlier configs remain readable while the run is open. New scope and grants require recorded
  approval. Expired grants and consumed PR fixing rounds remain spent. Readiness includes all
  phases and is rechecked at the new head. Terminal outcome records prove delivery without a
  deleted config. A closed, unmerged run remains a separate supersession case.
- A production-affecting step never runs. An approved move creates a release ticket and permits
  readiness when the remaining checks pass. Without that move the ticket stays open and the PR
  stays draft. A new release ticket receives manual implementation, review, merge, and finish.
  Direct manual finish is named only for a ticket with a merged handoff PR. Missing or expired
  environment grants leave checks `not run` and readiness draft. Interrupted finish and cleanup
  resume from evidence. A closed, unmerged run keeps completed tickets `done` and records that they
  did not reach `main`.
- A planted fake credential blocks each provider's push, confirmed by an unchanged remote head.
  The fixed push passes. Push protection is reported as `enabled` with sufficient access and
  `unverifiable` when access cannot establish it. An untrusted issue comment cannot change
  documents, model selections, grants, or authority. Existing manual planning approval questions
  remain in force.

The runbook selects changed behavior and affected regressions before testing. Parallel or
cross-harness integration validation requires the maintainer's explicit approval and a recorded
session count under the token-usage and AI harness testing rules. Unavailable selected checks are
SKIP. This exit check does not require an exhaustive provider or harness matrix.

## M5: Learnings become rules
Outcome: After a ticket, milestone, or run, a person runs `wkc-retro` and gets proposed rule files backed by evidence, written to `rules_dir` only once they approve.
Scope: PRD goal 4 and outcome 2. SPEC `wkc-retro`.
Depends on: M4, because this milestone is delivered by a `wkc-yolo` run: the first real unattended milestone, PRD outcome 2.
Exit check: this milestone's tickets reach `done` through one `wkc-yolo` run on this repository, and the maintainer reviews its `Decision (wkc-yolo):` comments. On a fixture with a known lesson that no rule covers, `wkc-retro` proposes a rule citing that evidence, writes nothing before approval, and writes exactly the approved file after it. Run on a real finished milestone, it may conclude that no rule change is justified.

## M6: Local tickets committed
Outcome: On the local backend, every ticket write is a commit. A person runs `wkc-implement` or `wkc-yolo`, and the ticket's claim, handoff, and `done` reach the default branch with the code, with history, instead of staying uncommitted in the starting checkout.
Scope: SPEC Lifecycle **Local backend**, the `wkc-tracker` and `wkc-implement` component changes for it, `wkc-yolo` runs on the local backend, and the #48 Decisions entry. Delivers the work #48 asks for after its decision.
Depends on: M2, because it changes `wkc-implement`; M4, because it covers `wkc-yolo` on the local backend. Last on purpose: the local tracker is low priority, so this work gates no other milestone.
Exit check: on a local-tracker fixture with a GitHub remote, each `wkc-tracker` write is one `chore: wkc-tracker <verb> <id>` commit holding only that ticket's file, with other staged and unstaged changes unchanged and nothing pushed. `wkc-implement` branches before it claims, so the claim and handoff commits are on the ticket's branch and not on the default branch, and it stops on an unpushed `issues_dir` commit on the default branch. After the merge, a rerun makes its post-merge writes on `<type>/<id>-finish` from the merged default branch, and the ticket file on the default branch reads `done` once that branch lands. With no remote, the post-merge writes are commits on the local default branch. A `wkc-yolo` run of two local tickets runs them one at a time and reaches `done` on the run branch before readiness. It pushes the ticket-file commits and opens a draft run PR before verification. Verification and cleanup evidence, an intermittent check's `Discovered:` item included, are read back from PR comments, with the checked HEAD unchanged, and that item's ticket is filed only after the run PR. A later ticket-file or code commit invalidates that evidence. Both tickets reach the default branch only after the person merges the run PR. Ticket files are checked with a YAML parser and `git log`, not from the report. The `wkc-tracker` and `wkc-implement` runbooks cover these cases.

## Changes

- 2026-10-28: M4 adds `headless_workers` (opt-in `claude -p`, pinned Claude IDs, and a Codex
  coordinator), runs without a model pair, and the person-confirmed coordinator mode (maintainer
  decisions). Still draft.

- 2026-10-28: Planning review of `5677c39`. M4's outcome and routing exit check state the
  preceding-step reviewer rule instead of unconditional alternation. Still draft.

- 2026-10-27: Expanded M4 for the maintainer's confirmed additional-ticket allowance, same-PR
  review continuations, and project/ticket model selection in manual and unattended calls.
  Replaced the total-ticket or time-budget assumptions and the blanket validation-harness text.
  Added focused exit checks for admission accounting, alternating independent reviews, manual
  boundaries, and explicit continuation authority. Kept M5's first real YOLO run and M6's local
  backend scope. Revised documents remain draft pending final review.

- 2026-10-26: M6 follows the local readiness evidence exception approved by the maintainer during PR #79 review. Its exit check verifies that ticket state stays in committed files, readiness and cleanup evidence live on the run PR, and recording that evidence does not change the checked head.

- 2026-10-26: M4 follows ADR-008: a run completes each ticket by its own definition of done on the run branch, verifies the combined branch at one commit, and opens its run PR ready only when every required ticket is `done`, a draft otherwise; kickoff grants non-production environments and moves production work only on the person's yes. Its outcome, scope, dependencies, and exit check change. The exit check covers repair admission within the budget and the manual lifecycle for new release tickets. Replaced "then a closing round approves release and deploy steps and the run finishes its tickets", the exit check's closing round, and a prerequisite's ticket resuming "once it is `done`".

- 2026-10-26: M4 follows ADR-007: a run merges only into its run branch and ends at a run PR that a person merges, then a closing round finishes the tickets; `merge_gate` is gone and the run record is the run config, in the store `run_config` names. Its outcome, scope, and exit check change, and it depends on PR #78. Replaced "It merges where `merge_gate` allows" and the `merge_gate: human` exit case.

- 2026-10-24: M4 widens for delegated run authority (SPEC Delegated run authority, Ticket scope, Push check, Security; ADR-006; PRD goal 3 and Security constraint, revised the same day): its outcome adds delegated planning and the secret scan, its scope adds those SPEC sections and `push_check`, it depends on M3.1 and on PR #75, and its exit check adds the secret, planning, prerequisite, duplicate-discovery, injection, push protection, and manual-call cases. Kept as one milestone at the maintainer's request. Replaced M4's scope list and "Depends on: M1, M2, M3."
- 2026-10-24: Added M3.1, placed after M3, for the 2026-10-24 SPEC change: milestones close through `wkc-plan close`, and `wkc-architect` and `wkc-plan` opt into model invocation. Reason: M2 and M3 stayed open on GitHub with every ticket closed. Numbered M3.1 instead of renumbering M4 to M6, which the PRD and SPEC cite by number. It follows M3 in order only; it depends on M1 and M2.
- 2026-10-22: The SPEC now has `wkc-tracker` commit each local-backend write and `wkc-implement` carry those commits to the default branch (#48, #52). The local tracker is low priority, so this work becomes a new last milestone, M6, instead of joining M2, where it would hold M2 open and with it M3 and M4. M2's scope now excludes the **Local backend** commits, and M4 leaves the local-backend run to M6. Added M6, so the ROADMAP is back to draft.

- 2026-10-21: M1 delivers a new `wkc-backlog`, which owns tickets for a milestone and for one change, and narrows `wkc-plan` to the ROADMAP (ADR-004). M2 and M3 hand discovered work to `wkc-backlog`. Replaced `wkc-plan` as the ticket writer in M1 to M3 and ADR-002 in M1's scope. No milestone was added, removed, or reordered, but M1's outcome, scope, and exit check changed, so the ROADMAP is back to draft under `wkc-plan`'s approval rule.
- 2026-10-21: The SPEC is approved, so the opening note cites it as approved. Replaced "Planned from the draft SPEC ... before the SPEC was approved". No milestone changed.
- 2026-10-21: `wkc-plan` change handling and the ticket templates move first (M1), ahead of `wkc-implement` (M2) and `wkc-code-review` (M3), because both now hand discovered work to `wkc-plan` and every ticket after M1 uses its templates. M1's exit check uses a fixture `Discovered:` comment. Replaced the order M1 implement, M2 review, M3 plan, and the "until M3" interim rules.
- 2026-10-20: SPEC templates. M2 adds the fix commit template; M3 adds the ticket templates.
- 2026-10-20: SPEC maintainer decisions. M1 adds follow-up PRs and the `wkc-implement` comment templates; M3 adds the hand-off of discovered work from `wkc-implement` and `wkc-code-review` to `wkc-plan`, replacing a person running `wkc-plan` on the comment.
- 2026-10-20: Review findings. M4's exit check adds a resumed run and names its session-approval need; M5 is delivered by a `wkc-yolo` run as PRD outcome 2 and depends on M4; M5 no longer requires a rule from a real retro.
- 2026-10-20: First version, from the draft SPEC.
