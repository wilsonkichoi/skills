# ADR-006: Delegated run authority, with security enforced in layers

Date: 2026-10-24. Status: accepted

## Context

The maintainer asked for `wkc-yolo` runs with near-full engineering autonomy: change the SPEC,
the ROADMAP, milestones, tickets, and the dependency graph when the work justifies it, without a
person approving each change, while security, operational limits, and independent review stay
hard boundaries (request of 2026-10-24).

The approved SPEC forbade that. `wkc-architect` and `wkc-plan` named "never `wkc-yolo`" as a
caller, and a document a model-invoked skill changed stayed `Status: draft` until a person approved
it. Under a run, `wkc-backlog` only named a SPEC or ROADMAP change in its return, so the ticket
parked. A ticket or wave run parked every ticket that needed a new prerequisite.

Two facts shape any design:

- The SPEC and ROADMAP are files in git. `wkc-implement` branches from the remote default branch,
  so a planning change reaches other tickets only after it merges.
- The skills are instructions. An agent runs them with the person's `gh` credentials, so whatever
  the person can bypass, the agent can too. GitHub push protection is free on public repositories
  and needs GitHub Secret Protection on private ones. By default anyone with write access can bypass
  it by giving a reason. Delegated bypass, which restricts that, is an organization control
  ([GitHub docs](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection)).
  A pre-push hook is skipped by `git push --no-verify`.

## Options

Planning authority:

1. **Delegated approval.** The run writes the change through `wkc-architect` or `wkc-plan`, marks
   it approved by the run, merges it as a planning PR, and continues. Gains: meets the request, and
   milestones and contracts can change mid-run. Costs: `approved` no longer always means a person
   read it; nobody reviews a change before tickets build on it.
2. **Run-local decisions.** The run records the choice as a Decision comment and opens a draft SPEC
   PR for after the run. Gains: approval keeps its meaning. Costs: the SPEC lags the code during
   the run, and a run cannot add a milestone or change a contract other tickets read.
3. **Park.** Today's rule. Gains: nothing changes. Costs: the run stops on every planning gap.

Security boundary:

1. **`push_check` required, push protection read at kickoff.** Every push runs a configured scanner
   first; a run cannot start without one, and absent push protection needs the person's acceptance
   in the kickoff round. Gains: blocks mistakes and planted test secrets on every repository, with
   no account setup. Costs: an agent that ignored its instructions could skip the scanner and, with
   the person's credentials, bypass push protection.
2. **Option 1 plus a separate agent identity without bypass rights.** Gains: the host enforces the
   boundary. Costs: a bot account or app per project, and full bypass restriction only in
   organization repositories.
3. **`push_check` only.** Gains: least setup. Costs: no host layer at all.

## Decision

Planning option 1 and security option 1 (maintainer, 2026-10-24).

- A run's record says `Planning: delegated` or `none`. Under `delegated`, `wkc-backlog` invokes
  `wkc-architect` and `wkc-plan` as it does outside a run; the changed document reads
  `Status: approved (YYYY-MM-DD, delegated: <run record path>)`; `wkc-yolo` merges it as a planning
  PR under `merge_gate`, after a fresh subagent checks the diff stays inside the PRD and touches
  nothing that is never delegated.
- Never delegated: the PRD, closing a milestone, and removing or weakening the SPEC's Security,
  Boundaries, or Requirements, `merge_gate`, a run limit, or a check. Product intent is the
  boundary, not the size of a change.
- `push_check` runs before every push in `wkc-implement` and `wkc-code-review`, and a run requires
  it. Security is layered: `push_check`, a project's own hook, host push protection, and branch
  protection. The SPEC says which layers the agent can get around.
- Outside a run nothing changes: every approval question stays.

## Consequences

- A person can find every delegated change by its status line, its **Changes** entry, and its
  Decision comment, and can revert its planning PR. Review happens after, not before.
- With `merge_gate: human`, planning PRs wait for a person, so delegation adds little there.
- The inner security layers stop mistakes, not an agent that ignores its instructions. A project
  that needs that guarantee gives runs a narrower identity, which option 2 would have required.
- Revisit planning option 2 if delegated changes turn out to need frequent reverts; revisit
  security option 2 if a run ever pushes a secret that `push_check` should have caught.
