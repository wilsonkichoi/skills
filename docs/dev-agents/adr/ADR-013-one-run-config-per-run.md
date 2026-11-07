# ADR-013: One run config per run, and records only from writers

Date: 2026-11-03. Status: accepted (maintainer, PR #100 review notes 4, 5, 7, and 17).
Amends [ADR-007](./ADR-007-run-branch-and-run-config.md) (a config written once and never edited)
and [ADR-009](./ADR-009-run-budgets-continuations-and-model-routing.md) (an immutable config per
phase, continuations, and phase suffixes).

## Context

ADR-009 gave each phase of a run its own immutable config. Changing a setting, such as renewing a
grant or adding slots, wrote a new config with `Continues:`. Readers then walked the chain, checked
that every config named the same branch and PR, resolved `Run PR:` across configs, and proved a
refused predecessor's membership from a verified `Run outcome` record against host history. The
review called that a lot of machinery for little gain (note 17). The first config's `Run PR:` was
also always `not opened`, because the config is written before the PR exists (note 7).

Two trust gaps came up with it:

- **Records were matched by their text alone** (note 4). Anyone who can comment could post
  `Run: <ref>` on an outside ticket, spending a slot and adding the ticket to the run, or post
  another ref to make a ticket look held elsewhere. The same holds for verdicts: the run merges the
  head of the latest `approve`, so a comment reading `wkc-code-review round 9: approve` with the
  head on its `Reviewed:` line would merge code nobody reviewed. This matters most on a public
  repository, where a tracker config's ref is public.
- **Nothing recorded the kickoff identity** (note 5). A resume under another `gh` login failed
  `wkc-implement`'s holder check ticket by ticket.

## Options

1. **One config per run, edited in place** through a tracker verb. Grant entries never change once
   confirmed. Edits are checked by who made them.
2. **Keep immutable phase configs.** Edit detection stays exact, and the chain machinery stays.
3. **One config, freely edited.** Least machinery, and a grant could change without the person.

For trust: records only from accounts with write access, records only from the run's login, or
accept the gap.

## Decision

Option 1, and records only from accounts with write access.

- **One config, one reference, for the run's life.** `wkc-tracker run edit <ref> <text>` replaces
  its text. The config carries an append-only `Changes:` list, one line per edit: time, login, and
  what changed. `Continues:`, chain walking, `_PHASE_<n>` variable names, the `wkc-yolo phase:`
  comment, the cross-config `Run PR:` checks, and the refused-predecessor path are gone.
  `Supersedes:` stays, because a superseding run is a different run with its own config.
- **Who edits.** The run fills `Run PR:` once the PR opens. That is the only edit the run makes
  without the person. Every other change is the person's, confirmed in a `wkc-yolo resume` session
  and recorded with a Decision comment.
- **When resume asks.** `wkc-yolo resume <ref>` shows the current settings in its report and
  continues. It asks first only when the run cannot move without a person-controlled change (an
  allowance spent with admissible work waiting, or a grant needed and expired), when the run PR
  has requested changes, or when the person names a change in the invocation. A relaunch per
  cycle then runs without questions.
- **Grants never change.** Each grant is a numbered entry, `Grant <n>:`. A change adds a new
  entry, such as a new expiry, limits, or commands, which the person confirms. An entry is valid
  only while its text equals the copy in the Decision comment that recorded its confirmation.
  Gate attempts count against the entry they ran under.
- **Edit checks by store.** `tracker` on GitHub refuses a config whose last editor, by GraphQL
  `editor`, is not the config's `By:` login. `github-variable` reports no editor: any
  collaborator who can write the repository's variables can edit it unseen, and the SPEC states
  that risk. A `command` store's successful `get` remains its acceptance check. `tracker` on
  Linear and local still holds no grants.
- **Allowance.** Used slots count across the run: distinct tickets absent from `Initial tickets:`
  with a `Run:` comment naming the config. A person who raises `max_additional_tickets` in place,
  never above the project's, replenishes it. Requested corrections join `Initial tickets:` on the
  person's confirmation.
- **Records only from writers.** Every record a skill acts on counts only when an account with
  write access to the repository posted it: `Run:`, handoff, update, verdict, Decision,
  `needs-decision`, `Answer:`, gate, finish, and cleanup comments. On GitHub, the collaborator
  permission must be `admin`, `maintain`, or `write`. `wkc-tracker show` reports each comment's
  author and whether that author can write. Every Linear commenter is a workspace member, and a
  local comment needs repository write, so both count.
- **Kickoff identity.** `By:` records the kickoff `gh` login. A resume under another login stops
  before any dispatch. It names the old login, the tickets that login holds, and the takeover
  command, `wkc-tracker assign <id> me from <old login>`. Taking over is the person's act.

Write access was chosen over the run's login for records, because a person with write access may
legitimately answer a request or resume the run. The config editor check uses the `By:` login,
because a config grants authority.

## Consequences

A run's history is its config's `Changes:` list plus the Decision comments, not a chain of
configs. A resumed run reads one config.

Edits replace exact edit detection with an editor check. On `github-variable`, a collaborator who
can write variables can change a run's limits without the run noticing. Grants stay protected by
their Decision copies.

Runs started under the phase design are not migrated, because the PRD rules out migration
machinery the user did not ask for. No such run is live outside validation fixtures.

The GitHub backend's `github.py` gains `run edit` and comment author permissions, inside the area
[ADR-011](./ADR-011-github-backend-script.md) approved: every GitHub backend verb.

## Evidence

- The PR #100 review notes 4, 5, 7, and 17, and the maintainer's answers on 2026-11-03.
- ADR-007: GitHub reports an issue body's `lastEditedAt` and `editor` through GraphQL (checked on
  #74, 2026-10-26), and repository variables record `created_at` and `updated_at` but no editor.
