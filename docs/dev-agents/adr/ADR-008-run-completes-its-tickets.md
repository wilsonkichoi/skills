# ADR-008: A run completes its tickets and verifies itself before the person's merge

Date: 2026-10-26. Status: accepted. Amends [ADR-007](./ADR-007-run-branch-and-run-config.md): the
closing round, finish after the run PR merges, and a same-run blocker met on merge alone are
replaced. Amends [ADR-001](./ADR-001-ticket-lifecycle.md) and
[ADR-006](./ADR-006-delegated-run-authority.md).

## Context

ADR-007 kept every ticket of a run `in-review` until a person merged the run PR. Only then did a
closing round approve `(needs authorization)` steps and `wkc-implement finish` run the post-merge
gates. That put more than production behind the person's merge. Integration checks that need the
merged build also waited, so a milestone of 30 tickets could reach the person's review with none
of them run. A ticket merged into the run branch unblocked its dependents before anything checked
it there, and a follow-up for a failed gate targeted the default branch.

The maintainer's intent (review of the proposed design, 2026-10-26): hand a run a milestone once;
it implements, integrates, tests, and completes each ticket by the ticket's own definition of done,
verifies the assembled milestone in non-production settings the person authorized, and hands over
one tested pull request. Merging it into the default branch stays the person's decision, and in
some projects that merge starts production delivery.

Facts that shape any design:

- `done`, `cancel`, and `duplicate` are terminal. No verb reopens a ticket
  ([wkc-tracker statuses](../../../skills/wkc-tracker/SKILL.md#2-statuses)).
- GitHub and Linear hold ticket state outside git, so a `done` written during a run is visible at
  once, wherever the code is. The local backend commits ticket files on the branch checked out.
- The tracker store on Linear and the local backend cannot detect an edited run config.

## Options

1. **Finish after the person's merge** (ADR-007). Gains: `done` always means on the default
   branch. Costs: integration work is checked after the decision it should inform.
2. **Verify each ticket in the run; move every ticket to `done` at once when the whole run
   passes.** Gains: no terminal ticket can be broken by a later merge. Costs: a ticket whose own
   definition of done is met waits on unrelated work, and one failure holds every ticket open.
3. **Each ticket reaches `done` when its own definition of done is met on the run branch; the run
   is verified as a whole, separately, before it is called ready.** Gains: ticket state is true to
   each ticket; readiness is true to the combined branch. Costs: a later merge can break a `done`
   ticket, which then needs a repair ticket; records must say where `done` was verified.

## Decision

Option 3 (maintainer, 2026-10-26).

- **Ticket completion.** `wkc-implement finish <id> --run <ref>` runs right after the ticket's PR
  merges into the run branch, against the run-branch commit that contains it. When every required
  gate passes, the ticket moves to `done`. The finish comment names the run branch and the sha it
  verified. `done` never by itself means the default branch or production.
- **Classification by target and impact.** Every post-merge gate and exit-check item is local (the
  run's machine, or containers and temporary resources the run creates and destroys), shared
  non-production (others can see it, but it is not production), or production-affecting
  (production, real users, real data, outside parties, spend beyond a grant, or anything that
  cannot be undone). The verb that names a step does not decide it. Unclear means the kickoff round
  asks, and no answer means not granted.
- **Grants.** Kickoff asks once for each shared non-production environment the work needs, with its
  exact commands, limits, cleanup, and expiry, default none. The run config records the grants. A
  stored grant is not authority by itself: an operation runs only when the config is unedited, a
  grant names that environment and command, and it has not expired. Ticket text and delegated
  planning never add or widen a grant. A store that cannot detect an edit holds no grants.
- **Production-dependent and person-confirmed criteria.** Kickoff names each required ticket whose
  definition of done needs production, and each criterion that needs a person's confirmation. It
  proposes moving the production work, word for word, to a release ticket blocked by the original,
  and an acceptance or release approval to the run PR's review checklist. Only the person's
  approval moves either, and the config records it. A required engineering verification is never
  moved to a checklist or marked passed without evidence. Moving a requirement out of a ticket's
  definition of done is never delegated.
- **Scheduling.** Inside the run, a blocker is met for scheduling once its PR merged into the run
  branch and its latest finish found no failed gate. A gate waiting on an environment does not hold
  dependents; a failed one does. The run adds no tracker edges for test ordering. Outside the run, a
  `done` ticket whose work is only on an unmerged run branch is unmet until a PR from that run
  branch, or from a run that supersedes it, merges into the default branch.
- **Waiting is revisited.** A ticket left `waiting` on an environment or a dependency is finished
  again after each merge into the run branch, after a blocker it waits on is met, and once more
  before the readiness check.
- **Readiness.** The run PR is ready for review as a verified release candidate only when every
  ticket the run must complete is `done`, and `test_command`, every required local and granted gate,
  and every pre-production exit-check item pass at the current head. Evidence counts only at the sha
  it names. Otherwise the PR is a draft that names what is unfinished and who must act.
  `wkc-implement verify <id> --run <ref>` reruns a ticket's gates at the head without a status
  change, so a `done` ticket gets fresh evidence.
- **Failures.** An environment failure is retried within the grant, then recorded `not run`, and
  the ticket waits. A product failure is rerun once at the same sha: reproduced, it gets a follow-up
  PR from and into the run branch, reviewed and merged like any ticket PR, and the ticket is
  finished again; passing on the rerun, it counts as passed and is reported as intermittent, with a
  `Discovered:` item. A readiness failure in a `done` ticket gets a repair ticket through
  `wkc-backlog`; the `done` ticket stays `done`. With `New prerequisites: run` and admission budget
  left, the repair joins the run without a blocker edge to the completed ticket. Otherwise it
  stays at `backlog` and the run PR stays a draft.
- **Cleanup.** Each grant names its cleanup. The run cleans up after readiness and before any stop
  it controls, also past its time limit. After a stop it does not control, the report names what
  may still be up, and a resumed run cleans up first.
- **Outcome.** After the run PR merges or closes, `wkc-yolo` on the run posts a
  `Run outcome (wkc-yolo):` comment on each ticket and closes the config. A closed run PR undoes no
  `done`; the person reopens it, supersedes the run with a new run based on its branch, or abandons
  it, with replacement tickets from `wkc-backlog`.
- **Manual calls are unchanged.** `wkc-implement finish <id>` without `--run` still needs the merge
  into the default branch, and a step that needs authorization still needs it in the conversation.
  `--authorized` is dropped: grants come only from the run config.

## Consequences

- The person reviews one PR that is either a verified release candidate at a named sha or a draft
  that says what is unfinished. A passing test suite alone never makes it look ready.
- A ticket on GitHub or Linear closes during the run. Its finish comment, and later its outcome
  comment, say where the work is. On the local backend, `done` reaches the default branch only with
  the run PR.
- A later merge can break a `done` ticket. Readiness catches it, and the fix is a repair ticket,
  because no verb reopens a terminal ticket.
- A milestone run is ready only when its whole scope is done. A ticket budget smaller than the
  scope, a parked ticket, or a refused split leaves a draft; kickoff warns about the budget.
- Delegated planning narrows: `wkc-backlog` under a run may still split tickets, but not move a
  requirement out of a ticket's definition of done unless the config names that ticket.
- Projects whose run config lives in a store that cannot detect edits run without shared
  environments, or choose the `command` store.
- Readiness reruns every required gate at the final head once, on top of each ticket's own run.
  Rerunning only the gates a later change touched was rejected because it needs a judgment no
  record can check.
- `wkc-implement` grows. If it becomes hard to follow, post-merge work moves to a small delivery
  skill, as the PRD's assumption allows; not one named `wkc-verify`, which the PRD rules out.
