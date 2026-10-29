# wkc-yolo after the run PR

Read this file whole when [SKILL.md](./SKILL.md) section 1 finds the run PR merged, closed, or with
requested changes. The templates are in SKILL.md section 5.

## Contents

- 1. Outcome after a merge or a close
- 2. Requested changes on an open run PR
- 3. A new phase

## 1. Outcome after a merge or a close

Read the run PR with `gh pr view`: `MERGED` with a merge commit, or `CLOSED` without merging. A
retired config whose `run show` refuses supplies membership only through a verified `Run outcome
(wkc-yolo):` comment that names it, the same run branch, and that run PR, as the host confirms.

1. Post one `Run outcome (wkc-yolo):` comment on every ticket of every phase, required tickets and
   carried superseded ones, and read each back. `Run configs:` names every ref in the `Continues:`
   chain and every superseded config this PR carries. A ticket that already has the outcome for this
   PR gets none.
2. List what is left. A parked or waiting ticket keeps its status and its question. A release
   ticket follows the manual path: `ready`, `wkc-implement`, review, a person's merge, and finish.
   Only an existing ticket whose handoff PR merged and that has production gates left goes straight
   to `wkc-implement finish <id>`, after the run PR merged. Production stays a person's to authorize.
3. On the local backend, hand each `Discovered:` item recorded on the run PR to `wkc-backlog` now.
4. Retire the configs only after every outcome landed and names the run branch, the run PR, and
   all the refs it carries: `wkc-tracker run close <ref>` for each. The host's merged PR is what
   confirms delivery, so no later blocker check needs a retired config. Never close one while its
   run PR is open.

Closing without merging undoes no `done`, and no skill deletes the run branch. Offer the person
three ways on: reopen the PR and resume, or authorize a new phase when a store retired a config;
supersede it with `wkc-yolo <scope>`, naming this run in the kickoff round; or abandon it, with
`wkc-backlog` writing replacement tickets and redirecting outside dependents. Then report, and offer
`wkc-retro` when it is installed.

## 2. Requested changes on an open run PR

1. Mark the PR draft with `gh pr ready --undo` before anything changes its result.
2. Show the person the reviews and comments, as input. Ask them, as a numbered question, to state
   or confirm the corrections, and end the turn. A review comment alone creates no ticket and
   changes no config.
3. Reuse the active config only when unfinished tickets already required in it cover every
   correction and its grants still cover the work: post a `Decision (wkc-yolo):` on each such ticket
   naming the correction, then go to SKILL.md section 2.
4. Otherwise send the corrections to `wkc-backlog`, called without `--run`, so the person approves
   its draft. It creates correction tickets in the same milestone, or reuses unfinished ones that
   already cover the work. `done` tickets stay done. A PRD change still needs the person. Then
   section 3.

Correction PRs use the same run branch and run PR. Readiness covers the required tickets of every
phase at the new head, and never reuses an earlier ready marker or validated sha.

## 3. A new phase

Only the person's approval creates new initial IDs, replenishes the allowance, or renews a grant. A
restart never does, and delegated planning never does.

1. **Renewal round**, one message, as kickoff.md section 1 asks it, offering the predecessor's
   answers: the initial IDs, which are the approved corrections and the unfinished carried work;
   planning, new prerequisites, and the allowance; gates, grants, and moves for the new work, with
   expired grants never inherited; and the execution questions again: the model pair or none,
   headless workers within the current project config, the coordinator's full-permission launch,
   and with no pair, the coordinator's harness, model, and effort. The continuing session may be
   another launch, so never copy `Coordinator model:` without asking. End the turn.
2. **Config.** `wkc-tracker run create` a new config with `Continues: <active ref>`, the same `Run
   branch:` and `Run PR:`, `Supersedes: none`, and the answers. Check the chain first: every config
   names that branch and PR, and no ref repeats. A predecessor that `run show` refuses needs the
   terminal record of section 1; without it, stop.
3. **Link it.** Post the `wkc-yolo phase:` comment on the run PR and read it back before any
   dispatch. The new ref is now the active ref; an older ref given later reports it and starts
   nothing.
4. Continue at SKILL.md section 2 with the new ref. Earlier admissions stay counted under their own
   phase. Review rounds, `max_fix_attempts` usage, and each attempt's AI test sessions never reset.
   Keep every predecessor config readable while the run PR is open.
