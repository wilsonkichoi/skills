# wkc- skills ROADMAP

Status: approved (2026-10-21)

Planned from the [SPEC](./SPEC.md), approved 2026-10-21. Every milestone needs the PRD, SPEC, ADRs, and this ROADMAP merged to `main` first:
`wkc-implement` stops on uncommitted planning documents, and a fresh worktree cannot see them.

Validation for every milestone runs on Claude Code; Codex and Kiro cases are SKIP (PRD Constraints).
Fixtures that write tickets or PRs use a throwaway GitHub repository, never this one.

## M1: Plans follow changes
Outcome: A person gives `wkc-backlog` a milestone, a bug, a request, or a `Discovered:` comment, and gets tickets drafted from the SPEC's ticket templates, approved, and published. They can ask it to refine, split, re-block, or cancel existing tickets with the same draft and approval. `wkc-plan` writes only the ROADMAP.
Scope: PRD goal 2. SPEC components `wkc-backlog` and `wkc-plan` (one change at a time, the edit rule, the Ticket templates with `## Why` and `## After merge`, the split rule), Discovered work as `wkc-backlog` receives it, Invocation for `wkc-backlog` and `wkc-plan`; ADR-004.
Depends on: the planning documents merged to `main`. Built by hand, because `wkc-implement` and `wkc-code-review` do not exist yet.
Exit check: on a local-tracker fixture, `wkc-plan` writes a ROADMAP and creates no ticket; `wkc-backlog` turns one bug into one `backlog` ticket in the work-ticket template, `## Why` included; turns a fixture `Discovered:` comment into a `backlog` ticket, and links a discovered blocker to the ticket it blocks; splits a ticket so its dependents move to the children before the parent is canceled; and writes `## After merge` for a ticket with a release step. Ticket files are checked with a YAML parser, not from the report.

## M2: Ticket to done by hand
Outcome: A person runs `wkc-implement <id>` on a `ready` ticket and gets an open PR with the acceptance checks run and the ticket at `in-review`. After they merge it, a rerun runs the ticket's `## After merge` steps and moves it to `done`. Work it finds out of scope goes to `wkc-backlog`.
Scope: PRD goal 1 (the implement half). SPEC Lifecycle with follow-up PRs, PR body, ticket comments from `wkc-implement`, Linear, Discovered work with the hand-off to `wkc-backlog`, Invocation for `wkc-implement`; ADR-001. Delivers what issue #15 asks for.
Depends on: M1, because `wkc-implement` hands discovered work to `wkc-backlog` and reads tickets in M1's templates.
Exit check: the `wkc-implement` runbook passes on Claude Code; on a local-tracker fixture, a `Discovered:` item reaches `wkc-backlog` at handoff without a person typing it; and this milestone's second ticket is itself taken from `ready` to `done` by `wkc-implement`, with each status confirmed by `gh issue view`.

## M3: Independent review with fixes
Outcome: A person runs `wkc-code-review` in a fresh session on a PR from `wkc-implement`. It posts a verdict, fixes its blocking findings, and a further fresh round approves the fixed head or stops at `max_fix_attempts`.
Scope: PRD goal 1 (the review half). SPEC Review verdict and fix commit, `max_fix_attempts` config field, Discovered work with the hand-off to `wkc-backlog`, Invocation for `wkc-code-review`; ADR-003.
Depends on: M2, because it reviews PRs from `wkc-implement`; M1, for the hand-off.
Exit check: in a throwaway repository, a PR with a planted defect gets a `fixed` verdict, then an `approve` from a second fresh session naming the new head; a defect that comes back after its fix gets `stopped`. The PRs for this milestone are opened by `wkc-implement`.

## M4: Unattended runs
Outcome: A person runs `wkc-yolo` on a ticket, a wave, or a milestone, answers one round of questions, and the run finishes without asking anything more. It merges where `merge_gate` allows and stops at each merge where it does not.
Scope: PRD goal 3. SPEC Unattended calls, `wkc-yolo` run, run record, `merge_gate` config field, Failure handling for parallel merges.
Depends on: M1, M2, M3.
Exit check: in a throwaway GitHub repository, a milestone of two independent tickets and one ticket blocked by both runs to `done` after one round of questions, with the two independent tickets running in parallel. The same run with `merge_gate: human` stops at the first merge. A run stopped partway and started again finishes its claimed tickets without claiming them twice. Every decision appears as a `Decision (wkc-yolo):` comment. This validation runs parallel subagents and more than one session at a time, so the runbook states its session count first and needs the maintainer's approval under the token-usage rule.

## M5: Learnings become rules
Outcome: After a ticket, milestone, or run, a person runs `wkc-retro` and gets proposed rule files backed by evidence, written to `rules_dir` only once they approve.
Scope: PRD goal 4 and outcome 2. SPEC `wkc-retro`.
Depends on: M4, because this milestone is delivered by a `wkc-yolo` run: the first real unattended milestone, PRD outcome 2.
Exit check: this milestone's tickets reach `done` through one `wkc-yolo` run on this repository, and the maintainer reviews its `Decision (wkc-yolo):` comments. On a fixture with a known lesson that no rule covers, `wkc-retro` proposes a rule citing that evidence, writes nothing before approval, and writes exactly the approved file after it. Run on a real finished milestone, it may conclude that no rule change is justified.

## Changes

- 2026-10-21: M1 delivers a new `wkc-backlog`, which owns tickets for a milestone and for one change, and narrows `wkc-plan` to the ROADMAP (ADR-004). M2 and M3 hand discovered work to `wkc-backlog`. Replaced `wkc-plan` as the ticket writer in M1 to M3 and ADR-002 in M1's scope. No milestone was added, removed, or reordered, but M1's outcome, scope, and exit check changed, so the ROADMAP is back to draft under `wkc-plan`'s approval rule.
- 2026-10-21: The SPEC is approved, so the opening note cites it as approved. Replaced "Planned from the draft SPEC ... before the SPEC was approved". No milestone changed.
- 2026-10-21: `wkc-plan` change handling and the ticket templates move first (M1), ahead of `wkc-implement` (M2) and `wkc-code-review` (M3), because both now hand discovered work to `wkc-plan` and every ticket after M1 uses its templates. M1's exit check uses a fixture `Discovered:` comment. Replaced the order M1 implement, M2 review, M3 plan, and the "until M3" interim rules.
- 2026-10-20: SPEC templates. M2 adds the fix commit template; M3 adds the ticket templates.
- 2026-10-20: SPEC maintainer decisions. M1 adds follow-up PRs and the `wkc-implement` comment templates; M3 adds the hand-off of discovered work from `wkc-implement` and `wkc-code-review` to `wkc-plan`, replacing a person running `wkc-plan` on the comment.
- 2026-10-20: Review findings. M4's exit check adds a resumed run and names its session-approval need; M5 is delivered by a `wkc-yolo` run as PRD outcome 2 and depends on M4; M5 no longer requires a rule from a real retro.
- 2026-10-20: First version, from the draft SPEC.
