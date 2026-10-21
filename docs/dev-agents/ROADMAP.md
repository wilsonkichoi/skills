# wkc- skills ROADMAP

Status: draft

Planned from the draft [SPEC](./SPEC.md) at the maintainer's request (2026-10-20), before the SPEC
was approved. Every milestone needs the PRD, SPEC, ADRs, and this ROADMAP merged to `main` first:
`wkc-implement` stops on uncommitted planning documents, and a fresh worktree cannot see them.

Validation for every milestone runs on Claude Code; Codex and Kiro cases are SKIP (PRD Constraints).
Fixtures that write tickets or PRs use a throwaway GitHub repository, never this one.

## M1: Ticket to done by hand
Outcome: A person runs `wkc-implement <id>` on a `ready` ticket and gets an open PR with the acceptance checks run and the ticket at `in-review`. After they merge it, a rerun runs the ticket's `## After merge` steps and moves it to `done`.
Scope: PRD goal 1 (the implement half). SPEC Lifecycle with follow-up PRs, PR body, ticket comments from `wkc-implement`, Linear, the `Discovered:` comment, Invocation for `wkc-implement`; ADR-001. Delivers what issue #15 asks for. Until M3, the report lists discovered items instead of calling `wkc-plan`.
Depends on: the planning documents merged to `main`.
Exit check: the `wkc-implement` runbook passes on Claude Code, and this milestone's second ticket is itself taken from `ready` to `done` by `wkc-implement`, with each status confirmed by `gh issue view`.

## M2: Independent review with fixes
Outcome: A person runs `wkc-code-review` in a fresh session on a PR from `wkc-implement`. It posts a verdict, fixes its blocking findings, and a further fresh round approves the fixed head or stops at `max_fix_attempts`.
Scope: PRD goal 1 (the review half). SPEC Review verdict, `max_fix_attempts` config field, Invocation for `wkc-code-review`; ADR-003.
Depends on: M1.
Exit check: in a throwaway repository, a PR with a planted defect gets a `fixed` verdict, then an `approve` from a second fresh session naming the new head; a defect that comes back after its fix gets `stopped`. The PRs for this milestone are opened by `wkc-implement`.

## M3: Plans follow changes
Outcome: A person gives `wkc-plan` a bug, a request, or a `Discovered:` comment, and gets tickets drafted, approved, and published. They can ask it to refine, split, re-block, or cancel existing tickets with the same draft and approval.
Scope: PRD goal 2. SPEC changes to `wkc-plan` (one change at a time, the edit rule, `## After merge`, the split rule), Discovered work including the hand-off from `wkc-implement` and `wkc-code-review` to `wkc-plan`, Invocation for `wkc-plan`; ADR-002.
Depends on: M1, because the exit check uses real `wkc-implement` comments. Ordered after M2 so it is built through `wkc-implement` and reviewed by `wkc-code-review`. Until it ships, a discovered blocker is linked by hand with `wkc-tracker link`.
Exit check: on a local-tracker fixture, `wkc-plan` turns one bug into one `backlog` ticket; `wkc-implement` hands a `Discovered:` item to `wkc-plan` at handoff without a person typing it, and it becomes a `backlog` ticket on approval; `wkc-plan` links a discovered blocker to the ticket it blocks; splits a ticket so its dependents move to the children before the parent is canceled; and writes `## After merge` for a ticket with a release step. Ticket files are checked with a YAML parser, not from the report.

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

- 2026-10-20: SPEC maintainer decisions. M1 adds follow-up PRs and the `wkc-implement` comment templates; M3 adds the hand-off of discovered work from `wkc-implement` and `wkc-code-review` to `wkc-plan`, replacing a person running `wkc-plan` on the comment.
- 2026-10-20: Review findings. M4's exit check adds a resumed run and names its session-approval need; M5 is delivered by a `wkc-yolo` run as PRD outcome 2 and depends on M4; M5 no longer requires a rule from a real retro.
- 2026-10-20: First version, from the draft SPEC.
