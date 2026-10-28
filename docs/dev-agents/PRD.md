# wkc- skills PRD

Status: approved (2026-10-28)

## Problem

An AI coding agent does better work when it knows the project's intent (product, design, plan),
the state of its tickets, and its conventions, and when it can take a ticket to a reviewed pull
request without a person driving every step. The earlier toolkit, `agent-toolkit`, did this, but it
became hard to maintain. It had per-harness plugin packaging and generated copies, a script
collection, runtime contracts, rigid packet parsers, and tuning knobs
([agent-toolkit](https://github.com/wilsonkichoi/agent-toolkit), [AGENTS.md Distribution](../../AGENTS.md#distribution)).
Its replacement here was over-built once too: the first `wkc-manage` design grew to 335 lines across
five runtime files before it was cut back ([simplicity rule](./rules/simplicity.md#why)).

The collection is half built. Seven skills are shipped. The skills that turn a plan into merged and
delivered work are not: `wkc-implement`, `wkc-code-review`, and `wkc-yolo`
([README roster](../../README.md#skills)). Nothing turns what a project learns into rules either.
Today a person carries each ticket from the tracker to a pull request by hand. The observed failure
in [issue #15](https://github.com/wilsonkichoi/skills/issues/15) shows the cost: an implementation
session skipped the review status change, and the maintainer set it by hand.

## Who it is for

- **The maintainer** (decided 2026-10-20), first. They use the skills on their own projects and use
  them to build the rest of this collection.
- **Adopting projects** that install the skills with `npx skills add`. Earlier examples were
  `the_beautiful_game`, `sekai-kb`, and `lagunabeach-md` (maintainer). Some need a person's final
  approval for compliance (decided 2026-10-20), and a person approves what reaches the default
  branch in every project (decided 2026-10-26).
- **Agents** in Claude Code, Codex, and Kiro CLI, which read the skills
  ([README Install](../../README.md#install)).

Not for:

- Teams that want a framework or a consumer build step. One shared skill tree replaced those on
  purpose ([AGENTS.md Distribution](../../AGENTS.md#distribution)).
- Anyone who wants merges, releases, or deploys with no gate they control. Merging into the default
  branch is always a person's call; a run merges only into its own run branch
  ([AGENTS.md Git workflow](../../AGENTS.md#git-workflow)).
- Teams that need ticket priority or a scheduling engine. `wkc-tracker next` returns every eligible
  ticket, lowest id first, by design ([CHANGELOG 0.0.22](../../CHANGELOG.md)).

## Outcomes

Decided by the maintainer on 2026-10-20:

1. **The manual loop works on this repository.** The remaining work is planned and built with the
   shipped skills: this PRD, then a SPEC from `wkc-architect`, a ROADMAP from `wkc-plan`, tickets
   from `wkc-backlog`, pull requests from `wkc-implement`, and reviews from `wkc-code-review`. A
   person merges.
2. **One milestone runs unattended.** `wkc-yolo` takes a milestone of a real project from the tracker
   frontier to its exit check. It uses only `wkc-` skills. It merges reviewed tickets into its own
   run branch, completes each ticket there by the ticket's own definition of done, and verifies the
   combined run branch before handing it over. A person reviews the whole run, its decisions,
   document changes, and test evidence included, and merges it into the default branch (decided
   2026-10-24, revised 2026-10-26).
3. **Validation stays proportionate.** Each port has a runbook with simple checks that decide PASS
   or FAIL. A simple check that the skill works is enough. Do not build broad test matrices that
   try to cover everything and burn tokens.

## Goals

Ranked. Ranking is importance, not delivery order; the ROADMAP sets the order.

1. **A ticket goes from `ready` to `done`.** `wkc-implement` takes one ticket to a pull request:
   branch, build, stay current with `main`, resolve conflicts, run the acceptance checks, and hand
   off for review with the tracker updated. `wkc-code-review` judges that pull request against its
   ticket in a fresh context, fixes the blocking findings it raised, and applies worthwhile in-scope
   improvements, with each change reviewed again by a fresh context. Projects can select an
   ordered pair of models: the first builds, and each review uses the other model from the
   preceding build, update, or review step, so the first review uses the second. Each ticket can
   override the pair.
   The same selection works for manual calls and unattended runs. A configured manual call still
   performs only its requested step and keeps its approval boundaries (decided 2026-10-27).
   After the merge, `wkc-implement
   finish <id>` runs the ticket's post-merge steps and moves it to `done`; in a run, that merge is
   into the run branch and the steps run there. Each ticket carries its own definition of done,
   because done differs by ticket: review and tests only, plus integration tests, plus a deployment
   to a non-production environment, or plus release, deployment, and testing the release (decided
   2026-10-20, revised 2026-10-26). `done` means the ticket's definition of done was met where the
   ticket merged. It never by itself means the work is on the default branch or in production.
2. **Plans follow changes between planning runs.** `wkc-backlog` turns a ROADMAP milestone into
   tickets, and also takes a single request or a piece of discovered work: it judges whether it
   touches tickets, the ROADMAP, the SPEC, or the PRD, sends ROADMAP changes to `wkc-plan` and
   document changes to `wkc-research` or `wkc-architect`, and creates, edits, splits, or cancels
   tickets through `wkc-tracker`. `wkc-plan` keeps the ROADMAP (decided 2026-10-21; replaces
   `wkc-plan` absorbing `wkc-backlog`, [ADR-004](./adr/ADR-004-backlog-separate-from-plan.md)).
3. **A ticket, a wave, or a milestone runs without a person at each step.** `wkc-yolo` asks
   everything in one round before the run: scope, readiness and the blind spots it finds in the
   work, security posture, and the permissions it needs: whether it holds delegated planning
   authority, and each non-production environment and operation its tickets need, with commands,
   limits, cleanup, and expiry, which the person grants or refuses. Then it asks nothing more
   (decided 2026-10-20, revised 2026-10-26). During the run it works as an engineering team with a technical lead. Within the
   PRD's product intent it makes implementation and architecture decisions. With delegated
   authority it also changes the SPEC and its technical requirements, ADRs, the ROADMAP, future
   milestones, tickets, and dependencies when engineering evidence justifies it, with no person
   approving each change (decided 2026-10-24). It records every decision and its reason, and stops
   at the exit check or a limit ([PR #30](https://github.com/wilsonkichoi/skills/pull/30)). The
   approved initial ticket scope does not spend its allowance for additional tickets. That
   configurable allowance, `max_additional_tickets`, defaults to five. Discovered prerequisites,
   readiness repairs, and new replacement or split tickets spend it when admitted for execution.
   Filing backlog work does not.
   A restart preserves admissions and remaining allowance. The coordinator records each admission
   before dispatch, so parallel workers cannot spend the same slot. There is no elapsed-time run
   budget. Review/fix limits and non-production grant expiry still apply (decided 2026-10-27). It works
   on its own run branch and merges each reviewed ticket there; it never merges into the default
   branch. Each ticket reaches `done` in the run once its own definition of done is met on the run
   branch or in a granted non-production environment. At kickoff the run names each ticket whose
   definition of done needs production and proposes moving that work to a separate release ticket;
   only the person's approval moves it, and a ticket that still needs production stays open. It
   also names each criterion that needs a person's confirmation. Only the person's approval moves an
   acceptance or release approval to the run pull request's review checklist; a required
   verification stays on its ticket and is never marked passed without evidence. The run then
   verifies the combined run branch against the milestone's pre-production criteria, with evidence
   tied to the commit it tested, and opens one pull request from the run branch. It marks that pull
   request ready, as a verified release candidate, only when every ticket the run must complete is
   `done` and every required check passed at the current head; otherwise the pull request is a
   draft that names what is unfinished. A person reviews it and makes the final call to merge.
   Release, production deployment, and anything else that affects production happen only after that
   merge, as separate work a person authorizes. A run pull request closed without merging leaves
   completed tickets `done`, and the run's records show the work never reached the default branch
   or production (decided 2026-10-26). Requested changes on an open run PR normally continue
   on that branch and PR. Completed tickets and their evidence remain intact. Corrections become
   new tickets in the same milestone, or reuse unfinished tickets that already cover them.
   Required planning changes use their responsible skills. The PR returns to draft while its
   result changes, and readiness is checked again at its new head. A person explicitly approves
   an immutable continuation config when new scope or grants need approval. A restart never resets
   budgets, consumed fixing rounds, or grants (decided 2026-10-27). Product intent,
   security protections, authorization limits, and operational safeguards are outside its
   authority: a person sets them and reviews the outcome.
4. **What a project learns becomes rules.** An optional `wkc-retro` reviews a finished ticket,
   milestone, or run and proposes rule files for `rules_dir`, written only on approval (decided
   2026-10-20).
5. **The collection stays small and readable.** Each skill is one `SKILL.md`, ideally under 150
   lines and under 250 so a person can read it, with no
   scripts, agent definitions, or packaging unless a concrete failure requires them
   ([simplicity rule](./rules/simplicity.md)).

## Non-goals

- No marketplace, plugin packaging, or CI in this work. The maintainer plans a marketplace and CI
  later (decided 2026-10-20).
- No per-harness copies or consumer build step.
- No skill merges, releases, or deploys on its own authority. `wkc-yolo` merges only into its own
  run branch, never into the default branch. A run acts on a non-production environment only within
  what the person granted at kickoff, and never on production. A step that affects production runs
  only after the change reached the default branch and a person authorized it (decided 2026-10-26).
- No run edits the PRD, closes a milestone, weakens a security protection, authorization limit, or
  operational safeguard, or weakens an acceptance criterion to make failing work pass (decided
  2026-10-24). No run moves a requirement out of a ticket's definition of done without the
  person's approval (decided 2026-10-26). That holds on the run branch too.
- No `wkc-fix`, `wkc-qa`, `wkc-verify`, `wkc-git-fu`, or `wkc-create-ticket` skill.
  `wkc-backlog` handles changes between planning runs, and `wkc-code-review` fixes its own findings.
  PR #30 folded verify, git-fu, and create-ticket into the planned skills and left fix and QA off
  the roster ([PR #30](https://github.com/wilsonkichoi/skills/pull/30)).
- No separate ticket per step of one change. Testing and validating a change belong to the ticket
  that makes it.
- No ticket priority.
- No progress in the PRD, SPEC, or ROADMAP. The tracker owns ticket state.
- No verification, backup, recovery, migration, or audit machinery unless the user asks for it.
- No per-skill version stamps or generic release configuration.
- No exhaustive validation. See outcome 3.

## Constraints

- **Harnesses:** Claude Code, Codex, and Kiro CLI, from one source tree, through the `npx skills`
  installer with each agent named by `-a` ([AGENTS.md Distribution](../../AGENTS.md#distribution)).
- **Validation harness:** runbooks run on Claude Code by default. Unrun Codex and Kiro cases are
  SKIP. The maintainer uses them while dogfooding and feeds failures back as fixes (decided
  2026-10-20). Integration validation for the approved Claude Code-to-Codex workflow is a narrow
  exception that needs explicit approval and follows the existing session limits (decided
  2026-10-27).
- **AI session budget:** at most 6 extra AI test sessions per change. Arbitrary cross-harness
  launches and nested workers remain prohibited. The approved model-routing workflow permits
  Claude Code to coordinate native Claude agents and non-interactive `codex exec` workers, and,
  under the `headless_workers` opt-in, `claude -p` workers or a Codex coordinator. Every worker
  counts against the same concurrency and session limits. Workers cannot delegate or launch another
  harness ([token usage](./rules/token-usage.md), [AI harness testing](./rules/ai-harness-testing.md);
  decided 2026-10-27).
- **Model selection** (decided 2026-10-27): the default pair is the latest Opus, selected by the
  `opus` alias, then `gpt-6.1-sol`. Opus builds, and each review uses the other model from the
  preceding step: with no update in between, reviews alternate `gpt-6.1-sol` and a fresh
  latest-Opus context, beginning with Sol. The alias follows each new Opus release by the
  maintainer's choice; that is their selection, not automatic substitution. A pinned ID such as
  `claude-opus-5-5` is valid where the harness can honor it. Approval ends the loop. Effort defaults
  to `medium` for both models, and a selection may name another supported value. Project and ticket
  selections may change the next dispatch. The ticket owns its selection, and a run never freezes
  it. They do not reset review limits or grant unattended authority. Projects without routing
  configuration keep their existing manual behavior in Claude Code, Codex, or Kiro CLI. A
  `wkc-yolo` run without a pair runs every role on its own harness and model, each build and review
  in a fresh session: a native subagent first, otherwise that harness's own headless CLI
  (maintainer, 2026-10-28). More harnesses, such as Kiro CLI or OpenCode, may join the routed
  workflow later.
- **Subscription execution** (maintainer, 2026-10-27): Claude Code on the latest Opus coordinates
  the mixed-model workflow. Claude work uses its native agents. Codex work uses `codex exec` with
  the user's existing subscription login. The maintainer reports that `codex exec` works and
  `claude -p` is unreliable with their subscription. This is their operating constraint, not a
  universal product claim. The workflow does not use API billing fallback, authentication
  changes, or automatic model substitution. `claude -p` runs only when the project lists
  `claude-code` in `headless_workers`, which is off by default. That opt-in accepts the login
  `claude -p` uses, API billing included; it is the person's choice, not a fallback. It lets a
  Codex session coordinate Claude workers and a Claude Code coordinator pass a pinned Claude model
  ID. The maintainer's projects leave it off and use native agents (maintainer, 2026-10-28).
  Unsupported settings or coordinators
  produce a blocked result or concrete manual handoff. Quota, rate-limit, or authentication errors
  stop all worker dispatch. Workers run with full permissions and no sandbox (maintainer,
  2026-10-27). No skill can read its session's permission mode, so the person launches the
  coordinator with full permissions, and adopter documentation says how. The secret scan,
  independent review, and the person's merge remain the safeguards.
- **Authoring:** `wkc-` identifiers, the five opening fields, manual invocation by default, and a
  `SKILL.md` ideally under 150 lines and under 250 for a person reading it. Neither is a hard
  limit; the Agent Skills specification allows 500 (decided 2026-10-20). A skill has no
  supporting files for its main path, because a model skips instructions behind a second
  reference; a skill that outgrows one file splits by responsibility
  ([AGENTS.md Skills](../../AGENTS.md#skills), [ADR-004](./adr/ADR-004-backlog-separate-from-plan.md)).
- **Tracker backends:** GitHub Issues, Linear, and local markdown, all through `wkc-tracker`.
- **Compliance:** a person merges every change into the default branch, and no run may override that
  (decided 2026-10-26).
- **Security** (decided 2026-10-24): where a project configures a secret scan, every push by the
  skills runs it first, in every mode, and a failed scan blocks the push. An unattended run does not
  start without a working scan. Host push protection and branch protection are separate layers. A
  project without a scan keeps working manually, with a warning. A run's config holds its limits
  and the non-production grants the person made at kickoff, never credentials or security posture,
  and each project chooses where it is stored. A stored grant authorizes nothing the person did not
  grant (decided 2026-10-26).
- **Delivery:** one port per pull request, validated before the next starts. One patch version per
  pull request ([AGENTS.md Versioning](../../AGENTS.md#versioning)).
- **Cost:** development cost carries little weight. The maintainer's usage limits do.

## Assumptions

- The shipped `wkc-research`, `wkc-architect`, and `wkc-plan` can plan their own successors. Writing
  this PRD is the first test of that.
- The first port is built without `wkc-implement`, because it does not exist yet. Each later port
  can use the ones before it.
- Adopting projects need what the maintainer needs. No adopter feedback is recorded.
- Problems that appear on Codex or Kiro during dogfooding are rare enough to fix as they appear.
- A rerun of `wkc-implement` can carry post-merge steps without making the skill hard to follow. If
  it cannot, a small delivery skill takes them over (decided 2026-10-20).

## Open questions

1. **Delivery order.** Settled 2026-10-21: the ROADMAP ships `wkc-backlog` change handling first (M1),
   then `wkc-implement` (M2) and `wkc-code-review` (M3), because both hand discovered work to
   `wkc-backlog` and every later ticket uses its templates.
2. **Where outcome 2 runs.** Settled 2026-10-20: the ROADMAP's M5 in this repository is delivered
   by a `wkc-yolo` run.

## Evidence

- The maintainer's planning notes, not tracked: a port plan, one draft per planned or folded
  skill, a source-versus-port review of the shipped lifecycle skills, and a record of retained
  decisions. This PRD, the [SPEC](./SPEC.md), and the [ADRs](./adr/) replace them, and they were
  archived on 2026-10-20.
- The maintainer's original workflow sketch, not tracked. It names the roster, the ticket statuses,
  and "following rigid rules or steps for ceremonial purpose is bad engineering".
- [agent-toolkit](https://github.com/wilsonkichoi/agent-toolkit): the earlier toolkit, with its
  plugin packaging, scripts, and runtime contracts.
- [PR #30](https://github.com/wilsonkichoi/skills/pull/30): the roster folds and the `wkc-yolo` scope.
- [README](../../README.md), [AGENTS.md](../../AGENTS.md), [CHANGELOG](../../CHANGELOG.md), and
  [rules](./rules/): the shipped state and the conventions.
- [Issue #15](https://github.com/wilsonkichoi/skills/issues/15): the `wkc-implement` lifecycle
  contract and its observed failure.
- The maintainer's answers on 2026-10-20 to the `wkc-research` and `wkc-architect` interviews.
- The `agent-toolkit` sources linked from the drafts were not read for this PRD.
- The maintainer's confirmed decisions on 2026-10-27, recorded in the planning handoff for bounded
  additional admissions, review continuations, and per-ticket implementation and review models.
  [ADR-009](./adr/ADR-009-run-budgets-continuations-and-model-routing.md) records their proposed
  technical contract. These decisions do not approve this draft or authorize integration tests.
- The maintainer's architecture change request of 2026-10-24 for full engineering autonomy under
  `wkc-yolo`, and their answers on [PR #75](https://github.com/wilsonkichoi/skills/pull/75): delegated
  planning, required secret scanning for runs, and push protection as a separate layer.

## Notes for architecture

The [SPEC](./SPEC.md) and its ADRs answer the design questions this section listed: the lifecycle
contract from issue #15, commit before handoff, correcting review findings, the merge gate, and
discovered work, how `wkc-yolo` calls the other skills, and where a run's limits are kept. Still
open there: a first real check of the Linear integration. Delegated run authority and the security
layers are answered by SPEC Delegated run authority and
[ADR-006](./adr/ADR-006-delegated-run-authority.md). The 2026-10-27 requirements for additional
admissions, continuation authority, model dispatch, and manual approval boundaries are specified
in [ADR-009](./adr/ADR-009-run-budgets-continuations-and-model-routing.md). Their implementation
and integration validation remain downstream work.

## Changes

- 2026-10-28: The maintainer approved the PRD, SPEC, and ROADMAP as merged in #82. No
  requirement changed.

- 2026-10-28: Maintainer decisions after the planning review. `headless_workers` lets a project
  opt into `claude -p`, off by default, which also allows a Codex coordinator. A run without a
  pair runs each role on its own harness in fresh sessions. The person launches the coordinator
  with full permissions, and documentation tells adopters how. Replaced "does not use
  `claude -p`" and the deferred Codex coordinator. Status stays draft.

- 2026-10-28: Planning review of `5677c39`. Goal 1 and the Model selection constraint state the
  preceding-step reviewer rule instead of unconditional alternation, which a pre-merge update
  breaks. Status stays draft.

- 2026-10-27: Added a default allowance of five additional executed tickets beyond the approved
  initial scope, same-PR review continuations that preserve completed work, and project/ticket model
  selection for manual and unattended work. Recorded Claude Code coordination, subscription
  execution, alternating independent reviews, a `medium` effort default, and the narrow
  cross-harness exception (maintainer decisions). Replaced the blanket cross-harness constraint and
  unbounded scope-expansion wording. No elapsed-time run budget is added. Review: SPEC Config
  fields, Ticket, Review verdict, Unattended calls, wkc-yolo run, Run config/stores, Failure
  handling, Security; ROADMAP M4; ADR-003, ADR-005, ADR-007, ADR-008, ADR-009; #74, #76, #77, #80
  and the model-routing implementation ticket. Status is draft pending final review.

- 2026-10-26: A run completes each ticket by its own definition of done on the run branch or in a
  non-production environment granted at kickoff, verifies the combined run branch with evidence tied
  to the tested commit, and marks its pull request ready only when every ticket it must complete is
  `done` and every required check passed at the head, otherwise a draft; kickoff proposes moving
  production work out of tickets that need it, and moving an acceptance or release approval to the
  run pull request's review checklist, and only the person's approval moves either; a required
  verification is never marked passed without evidence; production-affecting work follows a
  person's merge as separate authorized work; a run pull request closed without merging leaves
  completed tickets `done` with records showing the work is not on the default branch (maintainer,
  review of proposed ADR-008). Replaced "After that merge it asks one closing round, which release
  or deploy steps may run, and then finishes the tickets", "asks nothing until a person merges its
  run", "in a run after the person merged the run", and "holds its limits only". Review: SPEC
  Ticket, Lifecycle, Unattended calls, Delegated run authority, wkc-yolo run, Failure handling,
  Security, Requirements; ROADMAP M4; ADR-001, ADR-006, ADR-007; #74.

- 2026-10-26: A run merges only into its own run branch, and a person reviews and merges the run
  into the default branch; release and deploy steps are approved in a closing round after that
  merge; the kickoff round names the blind spots it finds; a run's config holds limits only, in a
  store the project chooses (maintainer, PR #78, ADR-007). Replaced "Whether it may merge is a
  per-project setting", outcome 2's "merges on its own where the project allows that", the
  non-goal's "where the project allows agent merges" and "or the run's limits", and the compliance
  constraint's "must be able to require". Review: SPEC Unattended calls, Delegated run authority,
  wkc-yolo run, Config fields, Lifecycle, Failure handling, Security; ROADMAP M4; #74, #76, #77.

- 2026-10-24: Goal 3: with delegated authority, a run changes the SPEC and its technical
  requirements, ADRs, ROADMAP, future milestones, tickets, and dependencies without per-change
  approval, and its kickoff covers security posture and planning authority; outcome 2: a person
  reviews the run's document changes too; new non-goal on what no run may edit or weaken; new
  Security constraint for secret scanning (maintainer, PR #75, ADR-006). Replaced "During the run it
  decides from the PRD, SPEC, ROADMAP, and milestone goal". Review: SPEC Delegated run authority,
  Push check, Security, and Boundaries; ROADMAP M4; #73 and #74.

- 2026-10-23: Outcome 1: a review round also applies worthwhile in-scope improvements, and each
  change is reviewed by a fresh context (maintainer, ADR-005). Post-merge steps run from
  `wkc-implement finish <id>`, as the SPEC says since #60. Replaced "fixes the blocking findings it
  raised" as the whole of the review's changes, and "a rerun of `wkc-implement`" in outcome 1.
  Review: SPEC Review verdict; ROADMAP M3.
- 2026-10-21: Goal 2 moves to a new `wkc-backlog`, which owns tickets for a milestone and for one
  change; `wkc-plan` keeps the ROADMAP (maintainer, ADR-004). Outcome 1, open question 1, the
  `wkc-backlog` non-goal, and the authoring constraint follow. Replaced "`wkc-plan` also takes a
  single request" and the "No `wkc-backlog`" non-goal. Review: the SPEC components, Discovered
  work, and Invocation; ROADMAP M1 to M3.
- 2026-10-21: Open question 1 settled again: `wkc-plan` change handling ships first. Replaced
  "`wkc-implement` and `wkc-code-review` first". No goal changed.
- 2026-10-20: Evidence cites tracked sources; the untracked planning notes are archived. Open
  question 1 is settled by the ROADMAP. No goal changed.
- 2026-10-20: Maintainer review. `SKILL.md` length is a target, not a limit; marketplace and CI
  are later work, not "not for" or permanent non-goals. Replaced "near 100 lines" and "well under
  150". Review: SPEC Requirements and Boundaries.
- 2026-10-20: Review findings. The authoring constraint names the `wkc-plan` size exception;
  open question 2 is settled by the ROADMAP's M5. No goal changed.
- 2026-10-20: Goal 3 widened from a milestone to a ticket, wave, or milestone, with every question
  asked before the run. Review: the SPEC's `wkc-yolo` run.
- 2026-10-20: **Notes for architecture** now lists only the Linear check as open; the SPEC settled
  the rest. No goal changed.
- 2026-10-20: Maintainer decisions from the SPEC interview. `wkc-backlog` folds into `wkc-plan`;
  `wkc-code-review` fixes its own findings; `wkc-yolo` may merge where the project allows it, and a
  project can require a person's merge; done is defined per ticket and reached through a rerun of
  `wkc-implement`; new optional `wkc-retro`. Replaced the "no skill merges" non-goal, the backlog
  goal, and outcome 2's "a person merges". Review: the SPEC, and the README roster rows for
  `wkc-backlog` and `wkc-retro`.
- 2026-10-20: First version, ported from the `.local/` planning material.
