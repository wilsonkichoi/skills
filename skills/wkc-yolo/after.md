# wkc-yolo after the run PR

Read this file whole when [SKILL.md](./SKILL.md) section 1 finds the run PR merged, closed, or with
requested changes. The templates are in SKILL.md section 5.

## Contents

- 1. Outcome after a merge or a close
- 2. Requested changes on an open run PR

## 1. Outcome after a merge or a close

Read the run PR with `gh pr view`: `MERGED` with a merge commit, or `CLOSED` without merging.

1. Post one `Run outcome (wkc-yolo):` comment on every ticket of the run, required tickets and
   carried superseded ones, and read each back. `Run config:` names this run's ref and every
   superseded config whose work this PR carries. A ticket that already has the outcome for this PR
   gets none.
2. List what is left. A parked or waiting ticket keeps its status and its question. A release
   ticket follows the manual path: `ready`, `wkc-implement`, review, a person's merge, and finish.
   Only an existing ticket whose handoff PR merged and that has production gates left goes straight
   to `wkc-implement finish <id>`, after the run PR merged. Production stays a person's to authorize.
3. On the local backend, hand each `Discovered:` item recorded on the run PR to `wkc-backlog` now.
4. Retire the config only after every outcome landed and names the run branch, the run PR, and
   every ref it carries: `wkc-tracker run close <ref>`. The host's merged PR is what confirms
   delivery, so no later blocker check needs a retired config. Never close it while its run PR is
   open.

Closing without merging undoes no `done`, and no skill deletes the run branch. Offer the person
three ways on: reopen the PR and resume while the config is readable; supersede it with
`wkc-yolo <scope>`, naming this run in the kickoff round; or abandon it, with `wkc-backlog` writing
replacement tickets and redirecting outside dependents. Then report, and offer `wkc-retro` when it
is installed.

## 2. Requested changes on an open run PR

1. Mark the PR draft with `gh pr ready --undo` before anything changes its result.
2. Show the person the reviews and comments, as input, with the config's current settings. Ask
   them, as one numbered question, to state or confirm the corrections and any setting to change,
   and end the turn. A review comment alone creates no ticket and changes no config.
3. When unfinished tickets already required in the run cover every correction and its grants
   still cover the work, post a `Decision (wkc-yolo):` on each such ticket naming the correction.
4. Otherwise send the corrections to `wkc-backlog`, called without `--run`, so the person approves
   its draft. It creates correction tickets in the same milestone, or reuses unfinished ones that
   already cover the work. `done` tickets stay done. A PRD change still needs the person.
5. Write what the person confirmed into the same config with one `wkc-tracker run edit`, from the
   text `run show` returned: correction tickets join `Initial tickets:`, so they spend no slot; a
   raised `max_additional_tickets` stays within the project config; a new or renewed grant is a new
   `Grant <n>:` entry, never an edit of one; and a `Changes:` line records it. Post a
   `Decision (wkc-yolo):` comment for the change, and one holding each new grant entry word for
   word on the ticket whose gate needs it. Read both back, then go to SKILL.md section 2.

Correction PRs use the same run branch and run PR. Review rounds, `max_fix_attempts` usage, and
each attempt's AI test sessions never reset. Readiness covers every required ticket at the new
head, and never reuses an earlier ready marker or validated sha.
