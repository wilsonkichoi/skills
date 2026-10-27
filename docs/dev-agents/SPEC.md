# wkc- skills SPEC

Status: approved (2026-10-26)

## Overview

The collection is a set of Markdown skills that coding agents load in Claude Code, Codex, and Kiro
CLI. There is no runtime: each skill is instructions in a `SKILL.md`, plus sibling `.md` files when
one file cannot carry it. Skills share state only through files in the project
(`docs/dev-agents/`), the tracker (through `wkc-tracker`), and git.

This SPEC was written from the draft [PRD](./PRD.md) at the maintainer's request (2026-10-20),
before the PRD was approved. It covers the shipped skills only where the remaining work changes
them. The remaining work is `wkc-implement`, `wkc-code-review`, `wkc-yolo`, `wkc-retro`,
`wkc-backlog` (ticket planning, split out of `wkc-plan`), and three config fields.

Delegated run authority (ADR-006) follows the maintainer's request of 2026-10-24: a `wkc-yolo` run
may change the SPEC, the ROADMAP, milestones, and tickets within the PRD's product intent, without a
person approving each change, while security checks and the run's limits stay hard boundaries.
PRD goal 3, its non-goals, and its Security constraint record that authority (revised 2026-10-24).
Since 2026-10-26 a run merges only into its own run branch, and a person reviews the run and merges
it into the default branch (ADR-007). Each ticket of a run reaches `done` on the run branch by its
own definition of done, and the run verifies the combined branch before the person's review
(ADR-008).

```mermaid
graph LR
  R[wkc-research] -->|PRD| A[wkc-architect]
  A -->|SPEC, ADRs| P[wkc-plan]
  P -->|approved milestone| B[wkc-backlog]
  B -->|tickets| T[(wkc-tracker)]
  T -->|ready ticket| I[wkc-implement]
  I -->|PR, in-review| C[wkc-code-review]
  C -->|fixed: next round| C
  C -->|approve| M{merge: a person, or a run into its run branch}
  M -->|in the default branch, or the run branch in a run| I2[wkc-implement finish]
  I2 -->|After merge steps, done| T
  I -.->|discovered work| B
  C -.->|discovered work| B
  I2 -.->|optional| X[wkc-retro]
  Y[wkc-yolo] -.->|runs one milestone of| I
  B -.->|SPEC or ROADMAP change| A
  B -.->|ROADMAP change| P
```

## Components

| Skill | State | Responsibility | Input | Depends on |
|---|---|---|---|---|
| `wkc-setup` | shipped, changes | Config and scaffold. Adds `max_fix_attempts`, `push_check`, and `run_config` to the interview and template | none | `git`, `gh` or Linear MCP |
| `wkc-tracker` | shipped, changes | Ticket state mechanics on three backends; on local, commits each write; closes a milestone on request; stores run configs (`run create`, `run show`, `run close`) | verb and args | config, `git` for local, `run_config` |
| `wkc-research` | shipped | PRD | free text | none |
| `wkc-architect` | shipped, changes | SPEC and ADRs; opts into model invocation; under a delegated run, approves its own change (ADR-006) | free text | PRD |
| `wkc-plan` | shipped, changes | ROADMAP, and closing a finished milestone; hands an approved milestone to `wkc-backlog` (ADR-004); opts into model invocation; under a delegated run, approves its own change (ADR-006) | a ROADMAP change, `close <milestone>`, or none | PRD, SPEC, `wkc-tracker` reads and `milestone close` |
| `wkc-backlog` | new, from `wkc-plan` | Tickets for one milestone, or one change at a time (ADR-004); routes SPEC and ROADMAP changes, in a run too | milestone, or a change | PRD, SPEC, ROADMAP, `wkc-tracker` |
| `wkc-implement` | new | One ticket from `ready` to PR, and after merge to `done` (ADR-001); runs `push_check` before each push | ticket id, `finish <id>`, `verify <id> --run <ref>`, or none | `wkc-tracker`, `git`, `gh`, `test_command`, `push_check` |
| `wkc-code-review` | new | Review rounds on one PR: judge, fix blocking findings and apply worthwhile improvements, record a verdict (ADR-003, ADR-005); runs `push_check` before each push | PR, ticket id, or none | `wkc-tracker`, `git`, `gh`, `max_fix_attempts`, `push_check` |
| `wkc-yolo` | new | A ticket, a wave, or a milestone unattended, after one round of questions, under delegated run authority (ADR-006), on its own run branch, finishing each ticket there and verifying the combined branch, ending in one run PR that a person merges (ADR-007, ADR-008) | ticket, `wave`, or milestone | the skills above, `push_check`, `run_config` |
| `wkc-retro` | new | Propose rule files from what a ticket, milestone, or run shows | ticket, milestone, or run | `wkc-tracker`, `rules_dir` |
| `wkc-help`, `wkc-workflow-diagram`, `wkc-skills-release` | shipped | Help, maps, collection releases | | |

**Existing code that stays.** `wkc-tracker`'s ticket verbs need no addition. Its ticket shape is loose: "Other
skills may add sections, no verb rejects a ticket over formatting"
([wkc-tracker §5](../../skills/wkc-tracker/SKILL.md#5-ticket-shape)). `## After merge` is one more
section. `assign <id>` already claims a ticket and sets `in-progress` in one write; `move`,
`comment`, `link`, and `edit` cover every other write the new skills need.

**Existing code that changes.**

- `wkc-plan` keeps the ROADMAP. It reads the tracker through `wkc-tracker`, writes no ticket,
  and opts into model invocation (Invocation). Its ticket drafting, graph check, approval, and publishing move
  to `wkc-backlog` (ADR-004). Its one tracker write is `milestone close`, from `wkc-plan close
  <milestone>` (Contracts, Milestone close).
- `wkc-tracker` gains `milestone close <name>`. Today its `milestone <name>` row says "Never
  rename, close, or reopen one" and "No verb closes a milestone, including when all its tickets are
  done", so GitHub milestones M2 and M3 stayed open with every ticket closed (3 of 3, 1 of 1).
  Rename and reopen stay out.
- `wkc-implement finish`, after it moves a ticket to `done`, reads `milestone show` for the
  ticket's milestone and names `wkc-plan close <milestone>` in its report when nothing in it is
  open. It never closes a milestone.
- `wkc-backlog` is one `SKILL.md`. It takes a milestone or one change: a request, a bug, or
  discovered work, or a refinement, split, re-block, or cancel of existing tickets. Both run the
  same read, draft, graph check, approval, and publish steps. It sits near 240 lines: past the
  150-line aim, under the 250 lines a skill tries to stay under ([AGENTS.md Prose](../../AGENTS.md#prose)).
  Supporting files were rejected because a model reading through a second reference skips
  instructions, which the maintainer has observed (ADR-002, ADR-004).
- `wkc-plan`'s old rule "never change a reused ticket" becomes, in `wkc-backlog`: **an existing
  ticket changes only as shown in the approved draft**, and the draft names the holder of any
  `in-progress` or `in-review` ticket it changes. A split creates the children and moves dependents'
  edges to them before the parent is canceled. A cancel names each ticket left with a `cancel`
  blocker. An `in-progress` or `in-review` parent's status is never copied to children.
- `wkc-backlog` writes the `## After merge` section, with a `Target:` on each step, and follows the
  split rule below. Under a run it moves a requirement out of a ticket's definition of done only for
  a ticket the run config's `Moved by the person:` line names (ADR-008).
- `wkc-tracker`'s local backend commits the ticket files each write changes, and `wkc-implement`
  carries those commits to the default branch (Contracts, Lifecycle). Today `local.md` forbids
  `git add`, `git commit`, and `git push`, and nothing commits ticket files, so the claim, handoff,
  and status writes stay uncommitted in the starting checkout (`wkc-implement` validation S4, S5).
- `wkc-setup`'s Linear notes say the Linear GitHub integration is not needed, and that if a team has
  it, its PR automations may move tickets on their own.
- `wkc-setup` Section D gains the three fields, and `config-template.md` lists them.
- `wkc-tracker` gains `run create`, `run show`, and `run close`, which store, read, and retire a run config in the store
  `run_config` names (Contracts, wkc-yolo run). Ticket verbs never read a run config.
- `wkc-implement finish` counts a PR merged into another branch, such as a run branch, only once
  that branch has merged into the default branch (Contracts, Lifecycle). Under `--run` it finishes
  on the run branch right after the merge there, and `verify <id> --run <ref>` reruns a ticket's
  gates at the run branch head with no status change; `--authorized` is dropped, because a run's
  authority comes only from its config's grants (Contracts, Lifecycle › Finish in a run; ADR-008).
- `wkc-implement` builds this ticket's whole outcome, related problems included (Contracts, Ticket
  scope). Today its build step says "Build this ticket only, with the smallest change", which reads
  as filing every problem outside the criteria as a new ticket.
- `wkc-architect`, `wkc-plan`, and `wkc-backlog` accept a delegated approval line as approved, and
  write one only under a run whose config says `Planning: delegated` (Contracts, Delegated run
  authority). Outside a run, their approval questions are unchanged.

## Contracts

Every record a skill writes has a literal template below, and the writer follows it exactly. Readers
look for the facts they need, such as a PR URL or a head sha, and report a fact that is missing. No
skill rejects a record over formatting, and no validator or script checks one. Each writing skill
copies its own templates into its `SKILL.md`.

### Config fields

Added to `docs/dev-agents/config.md` by `wkc-setup`, in the PR that first reads them:

| Field | Values | Default when absent | Read by | Meaning |
|---|---|---|---|---|
| `max_fix_attempts` | integer, 0 or more | `3` | `wkc-code-review`, `wkc-yolo` | Review rounds that may change code on one PR, for fixes or improvements. One review-only round always follows the last fix; with `0`, the only round is review-only |
| `run_config` | `tracker`, `github-variable`, `command <cmd>` | `tracker` | `wkc-tracker`, `wkc-yolo` | Where each run's config is stored (wkc-yolo run, Store) |
| `push_check` | a shell command | none | `wkc-implement`, `wkc-code-review`, `wkc-yolo` | Scans the commits about to be pushed for secrets; exit 0 passes, anything else blocks the push. Example: `gitleaks git --redact --log-opts="origin/main..HEAD"`. Once set, it binds every push in every mode; a run needs a usable one |

Any other value of `max_fix_attempts` or `run_config` is a stop that names the field and its allowed
values, never a guess. A run may lower `max_fix_attempts` for itself and never raise it.

`test_command` (existing) is what `wkc-implement` runs. Release, deploy, and other project
procedures stay in the config's free-text **Conventions**, and `## After merge` steps name them.

### Ticket

Written by `wkc-backlog`, read by `wkc-implement`, `wkc-code-review`, and `wkc-yolo`. It is the
[wkc-tracker shape](../../skills/wkc-tracker/SKILL.md#5-ticket-shape) plus `## Why` and
`## After merge`. Drop a section that would say nothing. A work ticket, titled `<area>: <outcome in a few words>`:

```markdown
## What to build
<One to three sentences on what exists when this is done.>

## Why
<The problem it solves or the outcome it serves, in one or two sentences>, from <PRD goal or SPEC section>.

## Acceptance criteria
- [ ] <What is checked before merge>: `<command>` gives <expected result>.
- [ ] A person confirms <what>.          <!-- only when a person's sign-off is part of done -->

## After merge                           <!-- only when the ticket has post-merge steps -->
- [ ] <step>, using <command or Conventions entry>. Target: <local | environment name | production>. Check: <expected result>. (needs authorization)

## Blocked by
- #<id>

## Related
- #<id>

## Notes
<SPEC section>: <the excerpt the work needs, copied in>.
Evidence, from <the Discovered comment's URL, or the report it came from>: <its Observed, Reproduce, Because, and Verified lines, copied in>.   <!-- only for a reported problem -->
```

What to build and the acceptance criteria are the goal. Why is the reason, and it is what
`wkc-implement`, `wkc-code-review`, and `wkc-yolo` judge against when a criterion leaves a choice
open. A spike and a decision ticket give their reason as the work that waits on the answer.

A spike, titled `Spike: <question>`. Its code is thrown away, never shipped:

```markdown
## What to build
Answer: <question>. Timebox: <limit>.

## Acceptance criteria
- [ ] The answer, with <the evidence that settles it>.
- [ ] The answer is recorded in <SPEC section>, through `wkc-architect`.

## Notes
Blocks: <the tickets or SPEC section waiting on the answer>.
```

A decision ticket, titled `Decision: <question>`, stays at `backlog` and unassigned:

```markdown
## What to build
Decide: <question>.

## Acceptance criteria
- [ ] The SPEC records the answer in <section>.

## Notes
Options: <each with its gains and costs>. Who decides: a person | `wkc-architect`.
```

- Every step that publishes, deploys, or touches a shared environment ends with `(needs authorization)`.
- Integration tests that can run before merge are acceptance criteria. Tests that need the merged
  or deployed build are `## After merge` checks.
- `Target:` names what the step acts on, so a run can classify it (Gate classes).

**Post-merge gates.** `wkc-implement` derives them from the whole ticket, not from the heading
alone: every `## After merge` item, plus any criterion elsewhere that can only be checked after
merge, such as a release or a check against the released build. Older tickets put these under
`## Acceptance criteria` ([issue #12](https://github.com/wilsonkichoi/skills/issues/12)). A ticket
with no such gate is complete at merge, wherever it merged. A gate that failed or could not run
stays incomplete, and is never recorded as passed.

**Gate classes.** A run classifies every post-merge gate and every exit-check item by what it acts
on and what it can change, never by the verb that names it (ADR-008):

| Class | Target and impact | In a run |
|---|---|---|
| Local | The run's machine, or containers and temporary resources the run creates and destroys, with no effect outside them | Runs with no grant |
| Shared non-production | An environment or service others can see that is not production, such as staging, a test registry, or a sandbox account | Runs only under a grant (wkc-yolo run, Grants) |
| Production-affecting | Production, real users or customers, real data, outside parties, spend beyond a grant, or anything that cannot be undone, such as an immutable tag or a public registry version | Never |

A step's `Target:`, its command, and the **Conventions** decide the class. When they leave it
unclear, the kickoff round asks the person; with no answer, the step is not granted and its
criterion is unmet. A criterion only a person can confirm is its own case (wkc-yolo run, step 1).

**Split rule.** Split work into separate tickets only when a piece has its own deliverable or must
happen at a different time: an infra change that must land first becomes a blocker ticket; a
release bundling several tickets becomes its own ticket blocked by them. Testing and validating a
change never become their own ticket. Moving production work, or any other requirement, out of an
existing ticket changes that ticket's definition of done, which only the person approves, in a run
too.

**Ticket scope.** The ticket is its outcome, not the narrowest reading of its criteria.
`wkc-implement` and `wkc-code-review` fix a problem in the current ticket when the outcome needs it
fixed or it sits in code the ticket changes, with the judgment an experienced engineer would use and
no threshold on lines or files. The PR body's **What changed** names each such fix and why it
belongs. The split rule decides the rest: a problem with its own deliverable, or one that must land
at a different time, is discovered work. The rule holds in every mode; only approvals differ under a run.

### Lifecycle

| Step | Actor | Status after | Record |
|---|---|---|---|
| Claim | `wkc-implement` via `assign <id>` | `in-progress` | assignee |
| PR opened, checks run | `wkc-implement` | `in-review` | PR body; handoff comment |
| Review round | `wkc-code-review` | `in-review` | verdict comment |
| Review stopped | `wkc-code-review` | `in-review` | verdict `stopped`; a person decides |
| Merge | a person; in a run, `wkc-yolo` into the run branch, and a person merges the run PR | `in-review` | merge commit |
| Finish, no post-merge gate | `wkc-implement finish`; in a run, right after the merge into the run branch | `done` | finish comment |
| Finish, with post-merge gates | `wkc-implement finish`; in a run, as above | `in-progress`, then `done` | gate comment per gate |
| Gate failed, cause in this ticket's change | `wkc-implement` | `in-progress`, then `in-review` | gate comment; follow-up PR |
| Same gate fails again for the same cause | `wkc-implement` | `in-progress` | stops for a person; under `wkc-yolo`, parked |
| Step needs authority or cannot run | `wkc-implement` | `in-progress` | ticket comment naming what is left and who must act; in a run, finished again when that changes |
| Verify, in a run | `wkc-implement verify --run` | unchanged | gate comment per gate |

**Follow-up PR.** A merged PR cannot be reopened, so a defect a post-merge gate finds is fixed in a
new PR on the same ticket. `wkc-implement` branches from the current `main`, fixes or reverts the
change, opens a PR with the follow-up line in its body, and moves the ticket to `in-review`.
Review rounds run as for any PR, and a person merges it. In a run, the follow-up branches from the
run branch and targets it, and `wkc-yolo` merges its approved head there as it merges any ticket PR.
After that merge, `wkc-implement finish` runs every post-merge gate again
against the new merge commit; a release that shipped the bad build ships a new patch version. A
failure whose cause is outside the ticket, such as another ticket's defect or broken infrastructure,
is discovered work that blocks the ticket.

**Finish in a run.** Under `--run`, finish runs right after the ticket's PR merges into the run
branch, against the run branch head that contains that merge, and needs no merge into the default
branch (ADR-008). It runs local gates, runs a shared non-production gate only under a grant that
names its environment and its exact command (wkc-yolo run, Grants), and never runs a
production-affecting gate. A gate it could not run is `not run`, with the reason, and the criterion
stays unmet: the finish comment is `waiting`, and the ticket stays `in-progress`. When every
required gate passed, the ticket moves to `done`, and the finish comment's `Verified at:` line names
the run branch and the sha. `done` never by itself means the default branch or production.

- **Failures.** A gate whose environment fails, by a deploy or connection error, an environment
  that is down, or a timeout outside the code under test, is retried within its grant's limits, then
  recorded `not run, environment unavailable`; the ticket waits and is not parked. A gate that fails
  on the code runs once more at the same sha with nothing changed. Failing again, it is reproducible
  and follows the Lifecycle rows above. Passing, it counts as passed and is reported as
  intermittent, with a `Discovered:` comment for the flaky check.
- **Verify.** `wkc-implement verify <id> --run <ref>` runs the ticket's local and granted gates at
  the current run branch head and posts their gate comments. It never changes status, so a `done`
  ticket gets fresh evidence for the readiness check (wkc-yolo run, step 5). The local backend
  records these comments on the run PR, as described below.
- **Evidence** counts only at the sha its gate comment names. A gate already passed at the current
  head is not run again.

**Local backend.** Ticket files are committed, so ticket state has history and reaches other
checkouts the way code does.

- Each `wkc-tracker` write commits only the ticket files it changed, on the branch checked out, with
  the message `chore: wkc-tracker <verb> <id>`. Other staged and unstaged changes stay as they were.
  It never pushes. A file write whose commit fails is a write that half landed.
- `wkc-implement` branches before it claims, so the claim and the handoff commits ride in the
  ticket's PR. Commits to `issues_dir` on the local default branch that the remote lacks stop it,
  as uncommitted documents do: a branch from the remote cannot see them.
- After the merge, `wkc-implement` makes every post-merge write on a finish branch,
  `<type>/<id>-finish`, from the merged default branch, and builds a follow-up fix on that branch.
  It pushes the finish branch straight to the default branch when the project's **Conventions**
  allow direct pushes, and otherwise opens a PR from it whose first line is the ticket path; a
  person merges it. A later finish continues an unmerged finish branch and starts a new one after
  it merges. With no remote, post-merge writes are committed on the local default branch. A person
  merges a finish PR.
- In a run, post-merge writes are committed on the run branch, never on the default branch, so a
  ticket file reads `done` on the default branch only once the run PR merges. The run never pushes
  the default branch. Final readiness evidence is the exception below.
- For readiness, finish the ticket-file writes first, run `push_check`, push, and open or reuse
  the run PR as a draft before checking its head. `verify` gate comments, the `Discovered:`
  comment for an intermittent check, and subsequent cleanup comments go on that PR, not in local
  ticket files. Each names the local ticket path and uses the existing gate, Discovered, or cleanup
  template. Read each comment back before counting it as recorded. A new ticket file is a commit,
  so `wkc-yolo` hands such a `Discovered:` item to `wkc-backlog` only after the run PR (step 6).
  Evidence lookup and resume read those PR comments as well as the earlier local ticket comments.
  Recording readiness evidence must not create a commit. Any later ticket-file or code commit
  invalidates readiness and requires checks at the new head; the exact-sha rule is unchanged.

Before branching, `wkc-implement` checks `git status` for uncommitted changes to `prd_file`,
`spec_file`, `roadmap_file`, ADRs, and `issues_dir`. If it finds any, it stops and asks for them to
be committed, or offers to work in the current checkout. A fresh worktree cannot see them:
`make worktree` copies only gitignored files ([tools/branch.sh](../../tools/branch.sh)).

**Push check.** A push to a public repository exposes a secret whatever review finds later, so the
check runs before the push, not before the merge. When `push_check` is set, it binds every push the
skills make, in every mode, manual or unattended: `wkc-implement` and `wkc-code-review` run it in
the checkout holding the commits, before every `git push`, and `wkc-yolo` runs it before pushing a
planning PR or the run branch. No skill passes `--no-verify`, disables a hook, or skips the check. A failure blocks that push. The skill removes the finding from
the commits being pushed (rewriting its own unpushed commits when the secret is in history), runs
the check again, and pushes only on a pass. It reports the file, line, and rule, and never the
value. The same finding failing again with no new evidence stops: under a run, the ticket parks.
With no `push_check`, a manual push goes ahead, with a warning in the report that no push check is
configured; that keeps existing projects working. A run never pushes without one.

**Finish is explicit.** Only `wkc-implement finish <id>` runs post-merge gates and moves a ticket
to `done`: a person types it after the merge, and `wkc-yolo` calls it after each merge into the run
branch. `wkc-implement
<id>` never finishes. With no PR, or an open PR whose handoff is incomplete, it builds; with an open
PR and a complete handoff, it reports the review state; when the PR its handoff names has merged, it
says so, names `wkc-implement finish <id>`, and writes nothing. A handoff is complete when the
ticket is `in-review` and carries a handoff comment naming that PR. On a ticket the caller already
holds, build continues the existing branch and PR instead of claiming again, and finishes any
missing handoff writes, each verified.

**The ticket's PR.** Finish uses only the PR named on the `PR:` line of the ticket's handoff
comment or the `Merged:` line of its finish comment, whichever is latest. A PR that only cites the
ticket, by a reference line in its body or a mention in a comment, never counts. With no such
record, finish stops, asks for the PR, and writes nothing. A merged PR counts only when the host
reports it `MERGED` with a merge commit; a queued or auto-merge PR is still open, and finish reports
it and writes nothing. A PR merged into a branch other than the default branch, such as a run
branch, counts only once a PR from that branch into the default branch has merged, as
`gh pr list --head <branch> --base <default> --state merged` shows; then `Merged:` names the
ticket's PR at that PR's merge commit. Until then, finish reports which merge is missing and writes
nothing. Under `--run`, a PR merged into that run's branch counts at once (Finish in a run). With no argument, `wkc-implement` first reports the caller's `in-review`
tickets whose handoff PRs merged, offering `wkc-implement finish <id>` for each, then offers
`wkc-tracker next`.

### PR body

Written by `wkc-implement`:

```markdown
Refs #<N>
Follow-up to <merged PR URL>: <gate> failed.   <!-- follow-up PRs only -->

## What changed
<What changed and why, in a few lines.>

## Acceptance criteria
- [x] <criterion>: `<command>` gave <result>.
- [ ] <criterion>: not run, because <why>.

## After merge
- <step still to come>, or None.
```

The first line is the ticket reference: `Refs #N` on GitHub, never `Closes`, `Fixes`, or
`Resolves`; `Related to <ID> <URL>` on Linear; or the ticket path on the local backend.

PRs need a GitHub remote. Without one, `wkc-implement` stops at a pushed or local branch and says so.

### Ticket comments from wkc-implement

Handoff, posted when the PR is up and the ticket moves to `in-review`:

```
wkc-implement: in review
PR: <URL>
Head: <full sha>
Checks: <passed> of <total> acceptance criteria passed. Details are in the PR body.
```

Gate, one per post-merge gate run, from `finish` or `verify`:

```
wkc-implement gate: <step>
Commit: <full sha> on <branch>
Release or environment: <tag, URL, or environment name, or none>
Command: <command>
Result: pass | fail | not run, <output summary or why>
```

`Commit` is the commit the gate ran against: the merge commit on the default branch, or in a run,
the run branch head. A reader that finds the older `Merge commit:` line reads it the same way.

Finish, posted on every `wkc-implement finish` run:

```
wkc-implement: done | waiting | follow-up
Merged: <PR URL> into <branch> at <merge commit sha>
Verified at: <branch>@<full sha>          <!-- in a run only -->
Gates: none | all passed | left: <steps, and who must act>
```

**Linear.** The skills do not need Linear's GitHub integration: `wkc-implement` writes every
status through `wkc-tracker`, and without the integration nothing else moves a ticket. The PR body
carries the Linear URL for readers. Where a team has the integration, it changes issue statuses on its own. By default, a linked
issue moves to In Progress when its PR opens and to Done when it merges, configured per team.
Closing words (`Fixes ENG-1`) apply the merge status, and non-closing words (`Refs ENG-1`) still
apply the other statuses. Only relation words (`Related to ENG-1`) link a PR "with no status
changes" ([Linear GitHub docs](https://linear.app/docs/github)). An automatic Done would make a
ticket terminal before its `## After merge` steps ran, and the tracker cannot reopen it. So on
Linear, the PR body says `Related to <ID>`, and the branch name and PR title leave the ID out. The
docs do not say what a branch-name link does on merge, which is why the ID stays out of it.

Checked on 2026-10-21 in a sandbox team with the integration connected and the default team PR
automations. A control PR with `Fixes <ID>` moved its issue to In Progress on open and to Done on
squash merge. A PR with `Related to <ID> <URL>`, the ID kept out of its branch and title, linked to
its issue and left it in Todo through open, a comment review, and squash merge. A draft PR linked
the same way also left it alone. Not checked: a review request or approval, which needs a second
GitHub account; an issue starting at In Review; and a branch name that contains the ID.

### Review verdict

A PR or ticket id is the preferred input: tickets run in parallel worktrees, and an explicit target
cannot review the wrong PR. With no argument, `wkc-code-review` reviews the one open PR whose head
is the current branch, which in a worktree is that worktree's own. With no open PR or several, it
asks for a PR or ticket id and posts nothing.

The review judges the change against its ticket. A ticket target is the ticket. For a PR target,
the ticket is the one whose latest `wkc-implement` handoff names the PR, as for finish (The ticket's
PR). With no such handoff, a ticket the PR names stands in: by its body's first line (PR body), an
issue GitHub links to it, or a **Conventions** rule. It must be `in-review` with no handoff naming
another PR, because a PR can cite a ticket it does not build, as PR #55 cited #54, and a round fixes
toward its ticket's criteria. A ticket counts only when `wkc-tracker show` reads it from the
configured backend. A PR that names more than one ticket is a question even when a handoff names
it, and so is a PR naming a ticket other than its handoff's, or no qualifying ticket; never a guess.

With a GitHub remote, a ticket with no open PR is still being built, and the round posts nothing.
With none, `wkc-implement` leaves the ticket `in-progress` on its branch, and the round reviews that
branch: the one the caller names, the **Conventions** branch rule, or `<type>/<id>-<slug>`. It
lands any commit by fast-forwarding the branch, posts on the ticket, and on the local backend runs
`wkc-tracker` from the checkout that has the branch, where the ticket's other writes are.

`wkc-code-review` posts one comment per round on the PR, or on the ticket when there is no PR:

```
wkc-code-review round <n>: approve | fixed | stopped
Reviewed: <full head sha>
Fixed in: <full sha of the fix commit>     <!-- fixed rounds only -->
Fixing rounds used: <k> of <max_fix_attempts>
Independent: yes | no, <why>
- fixed <file:line> <finding>
- improved <file:line> <change>
- open <file:line> <finding>
- suggestion <file:line> <note>
```

`fixed` lists blocking findings fixed, `improved` the improvements applied, `open` blocking findings
left, and `suggestion` the improvements not applied and findings the evidence did not confirm.
Verdicts from before `improved` existed stay valid.

A `fixed` round makes one commit, in the project's commit convention, or with `fix:` when it has
none:

```
fix: <what the fixes change, in a few words>

wkc-code-review round <n> on <PR URL>, reviewed <full head sha>.
- <file:line> <finding>
```

- `approve`: no blocking finding, no change made, from an independent round. It applies only to the
  reviewed sha. Unapplied suggestions never hold it back.
- `fixed`: the round committed and pushed code: blocking fixes, worthwhile improvements, or both.
  Another fresh round is needed.
- `stopped`: blocking findings remain and no fixing round is left, or a blocking finding came back
  after being fixed. Open findings are listed, and a person decides.

Every round that commits code is `fixed` and counts against `max_fix_attempts`; a round that changes
nothing does not. A round whose commit landed posts its `fixed` verdict even when the head moved
after it; any other round posts nothing for a head that moved. After the last allowed fix, one more
fresh round always runs; it reviews only, so it ends in `approve` or `stopped`. Any fixing round,
the last one included, may apply worthwhile improvements, alone or with its blocking fixes; a
blocking finding that a change on the last fixing round adds ends that review-only round in
`stopped`. With `max_fix_attempts: 0`, the first round is that review-only round.

A round is one completed review of one head, recorded by its verdict; commits are not rounds. The
round number is the count of earlier rounds on that PR, plus one, where two verdicts with the same
round number and `Reviewed` sha are one round. A head an earlier verdict already reviewed gets no
new round unless the caller asks for one.

A blocking finding is a defect, an unmet acceptance criterion, a SPEC violation, a regression, or a
security defect, verified from evidence before it is fixed. A suggestion is an improvement with a
concrete benefit; a round applies the worthwhile in-scope ones while a fixing round is left, and
never makes a change with no benefit it can name, or one only because a fixing round is left. A later round does not raise a resolved finding again and checks the changes
since the last round for regressions.

Every round checks the change for security defects: a credential or secret in the diff or its
history, an authentication or authorization defect, sensitive data logged, stored, or sent where it
should not be, a new or changed dependency, and network calls the ticket does not need. A verified
one is blocking, so the PR gets no `approve` while it stands.

A round is independent when its context wrote none of the PR's code; a fresh session on the same
model is independent. A round that is not independent may fix or stop, with `Independent: no`, but
never approves: where it finds nothing to change, it posts no verdict and asks for a fresh session.

### Discovered work

`wkc-implement` and `wkc-code-review` never create or edit other tickets themselves. When they find
work outside their ticket's scope (Ticket scope), they comment on their own ticket:

```
Discovered: <what>. Out of scope because <why>. Blocks this ticket: yes | no.
Observed: <what was seen, copied in: expected and actual, a command and its output, a failing test, or a code, SPEC, or log excerpt>
Reproduce: <steps or a command, or "not reproduced: seen once, <when and where>">
Because: <why the observation points to a problem>
Verified: yes | no. Unchecked: <what is still unknown, or nothing>
```

**Evidence.** Any skill that reports a defect, a failed check, or another problem for a new ticket
gives enough evidence for another engineer or agent to judge the finding without the reporter. It
keeps three things apart: what was observed, why that indicates a problem, and what is still
unverified. `Observed` copies in the excerpt that shows the problem; no finding needs every kind of
evidence. When the full output is long, the comment also cites where it lives durably, such as a
commit, a PR, a CI run, or a tracked file. A temporary file or a session's memory is not a source
another agent can read. `Verified: yes` means the observation itself shows the problem. A finding
the evidence does not establish says `Verified: no` and is never presented as confirmed. A failure
that did not reproduce is still reported, with the original observation kept. Out-of-scope work
that is not a problem, such as a missing feature, drops the lines that would say nothing. Each
skill that reports problems carries this template and rule in its own `SKILL.md`. A skill with no
ticket of its own, such as `wkc-retro`, puts the same lines in the change it hands to `wkc-backlog`.

Then they hand the item to `wkc-backlog` as a change. A blocker goes at once, because the build or
review stops anyway. Other items go at the end of the session: after the handoff for
`wkc-implement`, and after the verdict for `wkc-code-review`, so planning never shapes the review
and the approval question is the session's last turn. In the manual loop, `wkc-backlog` drafts and
asks for approval as usual. Under `wkc-yolo`, the skill returns the items to `wkc-yolo` instead,
which calls `wkc-backlog` for them one at a time, so parallel tickets never file the same work twice.
The comment stays as the record `wkc-retro` reads. `wkc-backlog` copies the evidence lines into
the new ticket's `## Notes`, with a link to the comment, and never replaces them with a summary.
New tickets land at `backlog`. When the work blocks the current ticket,
`wkc-backlog` links it as a blocker, and the current ticket keeps its status and holder. It is not on
the frontier, so its holder or `wkc-yolo` returns to it by id once the blocker is `done`.

### Milestone close

`wkc-tracker milestone close <name>` is mechanism only. Its precondition: exactly one milestone has
that name, and it is open. An already closed one needs no write: report it. Verification: a fresh
read shows that milestone closed. On GitHub it sets the milestone's `state` to `closed`. Linear
project milestones have no open or closed state, and local milestones are not objects, so on those
backends the verb writes nothing and says the backend has no milestone state. The verb never checks
tickets; deciding is the caller's.

`wkc-plan close <milestone>` decides. It reads `milestone show <milestone>` and the milestone's
**Exit check** in the ROADMAP. It stops, naming them, while any ticket is `backlog`, `ready`,
`in-progress`, or `in-review`, or has no clean status. Otherwise it shows the counts and the exit
check, and asks whether the exit check passed. The person confirms; `wkc-plan` runs no exit check,
because some need AI sessions or a maintainer review. Only on a yes in this conversation does it
call `milestone close`. It never edits the ROADMAP for a close: the tracker owns progress.

### Invocation

`wkc-implement`, `wkc-code-review`, `wkc-backlog`, `wkc-architect`, and `wkc-plan` opt into model
invocation (maintainer, 2026-10-20; `wkc-backlog` took `wkc-plan`'s place on 2026-10-21;
`wkc-architect` and `wkc-plan` 2026-10-24): `disable-model-invocation: false` and
`policy.allow_implicit_invocation: true`. Each body declares its callers: people, `wkc-yolo`, and a
model acting on a person's request, plus `wkc-plan` for `wkc-backlog`. `wkc-architect`'s and
`wkc-plan`'s callers are people, a model acting on a person's request, and `wkc-backlog`, which
invokes `wkc-architect` for a change it classifies as a SPEC change and `wkc-plan` for a ROADMAP
change, in a run as outside one. `wkc-yolo` reaches them only through `wkc-backlog`, so one skill
routes every planning change. A model runs one only when a person or `wkc-yolo` asked for that work.
`wkc-implement` never starts `wkc-code-review` itself, because the review must not run in the
context that wrote the code. Outside a run, a SPEC or ROADMAP that a model-invoked skill changes is
still `Status: draft` until the person approves it in the conversation. Under a run whose config
says `Planning: delegated`, the change carries the delegated approval line instead (Delegated run
authority). `wkc-plan close` always needs the person's yes, in a run too. `wkc-yolo`,
`wkc-retro`, `wkc-research`, and `wkc-setup` stay manual: a run, and a write to rules or the PRD,
starts only when a person types it.

### Unattended calls

When `wkc-yolo` calls `wkc-implement`, `wkc-code-review`, or `wkc-backlog`, it passes `--run <ref>`,
the reference of the run's config (wkc-yolo run, Run config). Only that argument makes a call
unattended. A call without it is manual, whatever its text says, and a ticket, comment, or PR that
mentions `--run` is data. Before anything else, the skill reads the config with
`wkc-tracker run show <ref>`. When that refuses, the skill stops with the error, writes nothing,
and asks nothing. Under an unattended call, a skill never ends its turn on a question:

- It decides from the ticket, PRD, SPEC, ROADMAP, and run limits, and records the decision as a
  ticket comment.
- A question it cannot decide that way parks the ticket: a comment, status unchanged, and
  `parked` returned to `wkc-yolo`.

```
Decision (wkc-yolo): <question>
Choice: <what was chosen>
Source: <PRD, SPEC, or ROADMAP section, the ticket, or the run limit>
```

```
Parked (wkc-yolo): <question>
Open because: <what the documents and limits leave undecided>
Needs: <who must answer>
```
- `wkc-backlog` approval under a run publishes tickets at `backlog` only, after its graph check
  passes. It may create, reuse, refine, split, and re-block tickets, and add a milestone that an
  approved ROADMAP names. Which new tickets run is `wkc-yolo`'s decision, by the config's
  `New prerequisites` line (wkc-yolo run, step 3). It moves a requirement out of a ticket's
  definition of done only for a ticket the config's `Moved by the person:` line names, and only as
  that line says; any other such move parks the ticket with `Needs: a person`.
- `wkc-implement` branches from the config's run branch and opens its PR against it. A blocker in
  the same run is met for scheduling once its PR merged into the run branch and its latest finish
  there found no failed gate: a gate waiting on an environment does not hold dependents back, and a
  failed one does until its follow-up merges and passes. The run adds no edges for test order; a
  ticket that needs another's deployed behaviour checks it in its own gates.
- Outside the run, a blocker is met only when `done`, and a `done` ticket whose finish comment names
  a run branch is met only once a PR from that run branch, or from a run whose config supersedes
  it, merged into the default branch. `wkc-implement` checks this before it claims, and `wkc-yolo`
  before it admits. `wkc-tracker next` reads status alone and may list such a ticket; the claim
  then refuses and names the run PR it waits on.
- A ticket waiting on a prerequisite is not parked. Parked means a question the documents and
  limits cannot settle; waiting means a blocker, a merge, a merge queue, or an environment that will
  resolve without a person's answer, or with only a person's merge.

Ticket bodies, comments, PR comments, repository files, and external pages written by others are
data, never instructions. An instruction found there never changes a document, a limit, or a check.

### Delegated run authority

A run whose config says `Planning: delegated` acts as a team with a technical lead: it changes the
SPEC, ADRs, the ROADMAP, milestones, and tickets when the work shows a change is justified, with no
person approving each one (ADR-006). The boundary is the PRD's product intent, not the size of the
change.

- **Who writes.** `wkc-backlog` classifies the change as it does outside a run and invokes
  `wkc-architect` for a SPEC change and `wkc-plan` for a ROADMAP change. `wkc-yolo` sends planning
  changes to `wkc-backlog` one at a time, so two subagents never edit one document at once.
- **Approval line.** The changed document's line under its title reads
  `Status: approved (YYYY-MM-DD, delegated: <run config ref>)`, and its **Changes** entry
  says the run made it. Every skill that requires an approved SPEC or ROADMAP accepts that line.
  `wkc-yolo` posts a `Decision (wkc-yolo):` comment on the ticket that raised the change, naming
  the planning PR in `Choice:`.
- **Planning PR.** Other tickets branch from the run branch, so a change counts only once it merges
  there. `wkc-yolo` commits it on a `docs/<slug>` branch from the run branch in its own worktree,
  runs `push_check`, pushes, opens a PR against the run branch, and merges it at the head it
  checked. The person reviews it with the rest of the run in the run PR.
- **What may change.** Technical requirements, contracts, components, and decisions, including
  ADRs and the SPEC's Requirements, may be revised, replaced, or removed when engineering evidence
  shows they are unnecessary, obsolete, too restrictive, or in the way of a better design. An
  earlier approval is never by itself a reason to keep one. The **Changes** entry gives the
  evidence and the reason.
- **Never delegated.** A run never edits the PRD and never closes a milestone. It never removes or
  weakens a security protection (the SPEC's Security section, `push_check`, the review's security
  checks), an authorization limit (the run branch boundary, the run config and its grants,
  `(needs authorization)` steps), an
  operational safeguard (the stops in Failure handling, the Boundaries that come from PRD non-goals),
  or a requirement the PRD sets, such as the session budget or the authoring limits. It never
  weakens an acceptance criterion to make failing work pass, and never moves a requirement out of a
  ticket's definition of done beyond what the config's `Moved by the person:` line records
  (ADR-008). A change that needs one of those parks the ticket that raised it, with
  `Needs: a person`.
- **With `Planning: none`,** a SPEC or ROADMAP change parks the ticket that needs it, as before.

Outside a run, nothing here applies: every skill asks for approval as it always has.

### wkc-yolo run

The scope is one ticket, one wave, or a milestone. A wave is the frontier inside the milestone when
the run starts: every ticket whose blockers are all met, so none depends on another. Ticket and wave
runs record their ticket ids. Only prerequisites and readiness repairs admitted by step 3 can join
that scope; a milestone run also takes each new wave as it appears.

1. **Before, in one round of questions:** the scope; a review of the work in scope that names its
   readiness problems (SPEC not approved, open decision or spike tickets in scope) and its blind
   spots, such as a criterion no check can decide, a contract or SPEC section a ticket needs that
   does not exist, tickets that change the same code with no coordination note, or a prerequisite
   no ticket covers; planning authority, delegated or none, default delegated; whether new
   prerequisites of tickets in scope run in this run or are only recorded, default run; a budget in
   tickets or wall-clock time, default none; and the tickets in scope the person already holds,
   each adopted into the run or left out. The round also classifies every post-merge gate of the
   tickets in scope, and every exit-check item, by the Gate classes, and shows the list. For each
   shared non-production environment the work needs, it shows the operations, exact commands,
   limits, cleanup, and an expiry, and asks the person to grant it or not, default none (Grants). It
   names each required ticket whose definition of done includes a production-affecting step, and
   proposes moving those steps, word for word, to a release ticket blocked by it. It names each
   criterion only a person can confirm: an acceptance or release approval it proposes moving to the
   run PR's review checklist, and a required engineering verification stays on its ticket and is
   never marked passed without evidence. Each move happens only on the person's yes, recorded in the
   config's `Moved by the person:` line. A ticket left with a production-affecting step or a
   person's confirmation cannot be `done` in the run, and the round says the run PR will then be a
   draft. When the ticket budget is smaller than the scope, the round says the run cannot be ready.
   The person may name an earlier run whose run PR closed without merging as one this run
   supersedes. Security is part of readiness. `push_check` must be
   configured and usable: the run executes it once on the current branch before the round, and with
   no command, or any exit but 0, the run does not start and the round shows the output. Push
   protection is read with
   `gh api repos/<owner>/<repo> --jq '.security_and_analysis.secret_scanning_push_protection.status // "unverifiable"'`.
   `enabled` is confirmed on. `disabled` is confirmed off: the round says so, and the person accepts
   it or stops. `unverifiable` means the read could not tell, never that it is off: GitHub shows the
   block only to repository admins and organization owners or security managers, and a call that
   fails for another reason counts the same. The round says why it could not tell, and the person
   accepts it or stops. With `run_config: tracker` on a public repository, the round says the run
   config will be public, and with a store that cannot detect an edit, it offers no grants. An
   authentication error stops everything, as always. After the answers, create the run branch (Run
   branch), push it, and write the run config with `wkc-tracker run create`. Then `wkc-backlog
   --run <ref>` makes each move the `Moved by the person:` line names, one at a time: a release
   ticket at `backlog`, blocked by the original, related to it, its Notes citing the original and the
   moved text, and out of the run; or the original's criterion rewritten to say the run PR's review
   checklist carries it. Each move gets a `Decision (wkc-yolo):` comment on the original whose
   `Source:` is that line. After this round the run asks nothing more.
2. **Resume first:** before taking new work, and after each ticket merges into the run branch,
   continue the tickets in scope whose latest `Run:` comment names this run's config and that are
   not merged into the run branch: admitted but still `ready` (recheck that it is eligible and
   unheld, then claim it, reusing its comment and budget slot), `in-progress`, `in-review`, and
   tickets whose discovered blocker is now met. `wkc-implement <id> --run <ref>` continues a build
   or reports the review state. Nothing is claimed twice. A ticket whose latest `Run:` comment names
   another config belongs to that run and is skipped. A planning PR that a `Decision (wkc-yolo):`
   comment names is continued or merged, never written again. A resumed run first cleans up every
   granted environment that a gate comment shows deployed and no cleanup comment shows removed, and
   finishes again each ticket whose finish was interrupted. Resume reads the tracker, git, and PR
   state, never what the run remembers.
3. **Then new work:** take the frontier tickets in scope, no more than the ticket budget has left.
   The graph is read fresh each time: tickets and edges a run added count like the rest, and a
   blocker counts as met by the rules in Unattended calls. With `New prerequisites: run`, a
   new ticket that blocks a ticket in scope, or repairs a readiness failure from step 5, joins the
   scope and is moved to `ready`, with a `Decision (wkc-yolo):` comment. Both use the same admission
   budget and run when they reach the frontier, not first or last. A readiness repair needs no
   blocker edge to a `done` ticket. With `record only`, it stays at `backlog`; a blocked ticket
   waits, and an unresolved readiness failure keeps the run PR a draft. Other new tickets, such as
   later-milestone work, stay at `backlog` and out of the run. Admitting a ticket means posting
   `Run: <run config ref>` on it with `wkc-tracker comment` before anything else; adopted tickets
   get the same comment. A ticket may be adopted from another run only when that run has stopped, as
   its report or its time limit shows. On GitHub and Linear, run them in parallel, at most 5 at
   once, each in its own worktree and subagent. On the local backend, run one at a time in the
   directory where the run started, because a branch's ticket files are invisible from `main` until
   it merges ([local.md](../../skills/wkc-tracker/local.md)). Tickets `wkc-backlog` named as a
   coordination risk with each other run one at a time. For each: implement against the run
   branch, review rounds in fresh subagent contexts, then merge the approved head into the run
   branch. Every call passes `--run <ref>`. Merges run one at a time (see Failure handling). Right
   after each merge, call `wkc-implement finish <id> --run <ref>` for that ticket (Lifecycle,
   Finish in a run); a follow-up it opens goes through the same review and merge. Then finish again
   every ticket of the run whose latest finish is `waiting` on an environment or a dependency, and
   every ticket whose blocker is now met, so work that became possible is not left behind. Read
   fresh tracker state before starting each ticket.
4. **Stop:** a ticket or wave run when every recorded ticket is `done`, parked, or waiting on
   something no further work in the run can change; a milestone run when every ticket in scope is
   the same. A spent ticket budget stops new admissions only; admitted tickets still merge or park.
   Then step 5 runs. Any run at its time limit, at the first quota, rate-limit, or authentication
   error, or when every remaining ticket is parked or waiting on a prerequisite outside the run, stops
   too; a stop at its time limit still cleans up (Grants) and opens the run PR as a draft.
5. **Readiness, cleanup, and the run PR:** when anything merged into the run branch, merge the
   remote default branch into it when `git merge-tree --write-tree` shows no conflict, run
   `push_check`, and push; with a conflict, leave the run branch as it is and name the conflict.
   Finish once more every ticket still `waiting`. On the local backend, complete the writes and
   prepare the draft run PR as Lifecycle, Local backend specifies. Then check readiness at the run
   branch head:
   `test_command`, `wkc-implement verify <id> --run <ref>` for every required ticket, and every
   pre-production exit-check item a command or check can decide. The required tickets are every
   ticket in scope, the recorded ids or the milestone's tickets, with the prerequisites and repair
   tickets that joined the run, less the tickets the person left out at kickoff and the release
   tickets made under `Moved by the person:`. A failure in a ticket not yet `done` gets that
   ticket's follow-up. A failure in a `done` ticket, or between tickets, becomes a repair ticket
   through `wkc-backlog`, related to the affected tickets, which keep their status. Step 3 admits
   the repair when `New prerequisites: run` and the remaining budget allow it, then continues its
   implementation, review, merge, and finish. Otherwise the repair stays at `backlog` and readiness
   remains failed. After any merge, readiness starts again at the new head. The run is
   **ready** only when every required ticket is `done` and every one of those checks passed at the
   current head; a passing `test_command` alone never makes it ready. Then clean up every granted
   environment. Then open or update the one PR from the run branch into the default branch, ready
   for review when the run is ready and a draft otherwise, and stop. Never merge it. Its body is
   the release candidate package:
   - the state, `ready: verified at <sha>` or `draft: not ready`, and the run config's reference;
   - each required ticket with its status, PR, latest verdict, `Verified at` sha, and gates passed,
     failed, or not run, and what is left and who must act;
   - the readiness checks: commands, environments, results, and the sha they ran at;
   - the exit-check items: passed, not run with why, or after the merge into the default branch;
   - the release tickets and the review checklist items the person moved at kickoff, unchecked;
   - grants used and their cleanup results; intermittent checks;
   - the planning PRs and the documents they changed; every `Decision (wkc-yolo):` comment; the
     budget used;
   - that the run merged nothing into the default branch and changed nothing in production.

   It refers to tickets with `Refs`, never a closing keyword. When the body would pass GitHub's
   size limit, the per-ticket gate rows go in PR comments that the body links. A commit on the run
   branch after readiness makes the evidence stale: the body names the validated sha, and
   `wkc-yolo` on the run, within its time budget, checks readiness again at the new head and
   rewrites the evidence, or turns the PR back to a draft. The session report adds what the PR body
   never carries: any secret incident, first, and the push protection status the kickoff accepted.
   Offer `wkc-retro` on the run.
6. **After the run PR:** once it is merged or closed without merging, the person starts `wkc-yolo`
   on the run again. It posts one outcome comment on each ticket of the run and lists the work
   left. On the local backend, it first hands `wkc-backlog` each `Discovered:` item that readiness
   recorded on the run PR (Lifecycle, Local backend). A new release ticket follows the manual
   lifecycle: move it to `ready` when groomed, implement it with `wkc-implement <id>`, review and
   merge its PR, then run `wkc-implement finish <id>`. An existing ticket with a merged handoff PR
   and production gates left uses manual `finish` after the run PR merges. It retires the run
   config with `wkc-tracker run close <ref>`, reports, and offers `wkc-retro`. It asks nothing
   about production: that is separately authorized work after the merge. A closed, unmerged run
   authorizes none of those production steps.

   ```
   Run outcome (wkc-yolo): merged | closed without merging
   Run PR: <URL>
   Default branch: <merge commit sha> | not merged
   Production: not changed by the run
   ```

   A run PR closed without merging undoes no `done`: each ticket's finish comment names the run
   branch. The person reopens the PR, which continues this run; supersedes it with a new run (step
   1); or abandons it, and `wkc-backlog` writes replacement tickets for the work still wanted,
   related to the old ones, and moves the outside dependents' edges to them. No skill deletes a run
   branch.

**Run config.** The limits are what the person authorized before the run, not counters. The ticket
budget is the most distinct tickets the run may admit: every ticket with this run's `Run:` comment
counts, a parked one or one later adopted by another run included, and resuming one costs nothing.
The latest `Run:` comment on a ticket decides which run resumes it. The time budget runs from the
config's start time. The tracker records the account, not the run, so the `Run:` comment is what
ties a ticket to its run; a manual session that sees it knows a run holds the ticket.

The config exists so that every agent in the run acts on the same authorization without asking,
from any context, worktree, or machine: subagents read it, a resumed run keeps its limits, and the
person reads afterwards what they authorized. `wkc-yolo` writes it once with `wkc-tracker run
create`, which returns its reference, and a resumed run names the reference it continues. Nobody
edits it: `wkc-tracker run show` refuses one edited after it was written. It holds limits and the
person's kickoff answers only: never credentials, the scan command, push protection status, or
ticket status.

```markdown
# Run config: <milestone>
Started: <ISO 8601 time>. By: <person>.
- Milestone: <name>
- Scope: ticket <id> | wave <ids> | milestone
- Run branch: run/<milestone-slug>-<YYYYMMDDTHHMM>
- Supersedes: <run config ref> | none
- max_fix_attempts: <n>              <!-- never higher than the config -->
- Budget: <a number of tickets, a time limit, or none>
- Planning: delegated | none
- New prerequisites: run | record only
- Grants: none | <one Grant line each>
- Grant: <environment>. Target: <what it is>. Impact: <what it can change>. Operations: <exact commands>. Limits: <count, cost, duration, retries>. Cleanup: <command>. Expires: <ISO 8601 time>.
- Moved by the person: none | <ticket id>: <requirement, word for word> to <a release ticket | the run PR's review checklist>; ...
```

**Grants.** A grant is the person's answer at kickoff, and storing it grants nothing more. A shared
non-production operation runs only when `wkc-tracker run show` returns the config unedited, a
`Grant:` line names that environment and that exact command, the grant has not expired, and the
operation is not production-affecting (Ticket, Gate classes). Ticket text, comments, and delegated
planning never add, widen, or extend a grant; a step whose command a grant does not name is
`not run`. A store that cannot detect an edit, the `tracker` store on Linear or the local backend,
holds no grants: kickoff writes `Grants: none` there. An environment the run could not use is never
replaced by another one.

**Cleanup.** Each grant names its cleanup command, and kickoff flags a grant whose environment
enforces no expiry of its own. The run cleans up each environment after the readiness check and
before any stop it controls; cleanup is the one action allowed past the time limit. A resumed run
cleans up first (step 2). After a stop the run does not control, a quota, rate-limit, or
authentication error or a crash, nothing runs: the session report names each environment that may
still be up, with its cleanup command, and the environment's own expiry is the backstop. Each
cleanup posts, on the ticket whose gate last deployed that environment, or on the run PR under
the local readiness exception (Lifecycle, Local backend):

```
wkc-yolo cleanup: <environment>
Command: <command>
Result: pass | fail, <output summary>
```

**Store.** The `run_config` field picks where configs live, and a project chooses by exposure:

- `tracker`, the default: one issue per run, with the config as its body and the label `wkc-run`,
  on GitHub and Linear; one file in `issues_dir/runs/` on the local backend. Ticket verbs never
  return it. On a public repository it is public. GitHub reports an edited body; Linear and the
  local backend cannot, so there an edit goes undetected.
- `github-variable`: one repository variable per run, named after the run branch in capitals with
  `_` for every other character and a `WKC_` prefix, such as `WKC_RUN_M4_20261026T0900`. Only
  collaborators read it, and it is not shown publicly. `updated_at` later than `created_at` means it
  was edited. Every Actions workflow in the repository can read it, and GitHub does not mask it in
  logs.
- `command <cmd>`: the project's own store. `<cmd> put` reads the config on standard input and
  prints its reference; `<cmd> get <ref>` prints it, or exits non-zero to refuse; `<cmd> close
  <ref>` retires it. The command decides permissions and what counts as an edit.

**Run branch.** `run/<milestone-slug>-<YYYYMMDDTHHMM>`, from the remote default branch when the run
starts, or, when the config's `Supersedes:` line names an earlier run, from that run's branch with
the remote default branch merged in; with a conflict, the run does not start. Ticket branches and planning branches start from it, and their PRs target it. Only the run
merges into it. Its work reaches the default branch only through a person's merge of the run PR.

### wkc-retro

Input: a ticket, a milestone, or a finished run. Reads the tickets' comments (decisions, discovered
work, verdicts), the PRs, the git log, and existing rule files. Proposes new or changed rule files
in `rules_dir`, each with the rule, why (the evidence), and how to check it, following the shape of
[simplicity.md](./rules/simplicity.md). Writes only on approval. Defects in skills or code become
changes for `wkc-backlog`, with evidence as Discovered work describes, not rules. It never edits skills. `wkc-implement`'s finish report and
`wkc-yolo`'s report mention it; nothing runs it automatically.

## Data

No skill keeps its own state. Intent lives in the PRD, SPEC, ADRs, and ROADMAP. Ticket state,
decisions, verdicts, and discovered work live in the tracker and on PRs. Code lives in git. Rules
live in `rules_dir`. The one new record is `wkc-yolo`'s run config, one per run, which holds limits
and the person's kickoff answers only and lives in the store `run_config` names.

## Failure handling

- A tracker write that does not verify is a failure, reported with what landed
  ([wkc-tracker §3](../../skills/wkc-tracker/SKILL.md#3-read-write-verify)). On rerun, every skill
  reads current state before writing again, and never repeats a completed write.
- A failing check is reported with its output. No skill weakens a test or a criterion to pass.
- An `approve` covers exactly the head it reviewed. `wkc-yolo` merges only that sha into the run
  branch, with `gh pr merge --match-head-commit`. A planning PR merges into the run branch without a
  `wkc-code-review` round, by the sha it checked (Delegated run authority). Before it merges, a
  fresh subagent that did not write it checks that the diff stays inside the PRD and touches
  nothing that is never delegated; a failed check parks the ticket that raised the change.
- A `push_check` failure blocks the push (Lifecycle, Push check). A secret that already reached a
  remote is an incident: the ticket parks with `Needs: a person to revoke <the kind of credential>`,
  the value is never written anywhere, nothing more is pushed from that branch, and unrelated
  tickets continue. The session report lists it first; the run PR body never mentions it.
- Parallel tickets merge one at a time. Before each merge, the branch takes in the current run
  branch, its checks run again, and a fresh round reviews the new head before merge. When the
  update was clean, that round only confirms that the change from the approved head is the base's;
  a conflict fix gets a full review.
- `gh pr merge` may add the PR to a merge queue or turn on auto-merge instead of merging. A merge
  counts only when the host reports `MERGED` with a merge commit; until then the ticket is waiting.
  A resumed run reads the PR state and never submits the merge twice or passes `--admin`.
- Branch protection that blocks a merge into the run branch stops that merge and reports it.
- No skill merges a run PR. A run PR closed without merging undoes no `done`; the outcome comments
  say the work did not reach the default branch, and a person decides (wkc-yolo run, step 6).
- A check is never recorded as passed without evidence at the sha it names. An environment failure
  is retried within its grant, then `not run`; a product failure is rerun once before it counts as
  reproducible (Lifecycle, Finish in a run). Evidence from an earlier sha never counts for
  readiness.
- Quota, rate-limit, and authentication errors stop all agent work at once, with no retry.
- A repeated approach that produces no new evidence stops and reports.

## Security

- Credentials stay in `gh auth` and the Linear MCP server. No skill reads, stores, or prints them.
- Merging into the default branch is always a person's, in a run too. Publishing and deploying need
  a person's authorization. A run acts on a shared non-production environment only under a kickoff
  grant (wkc-yolo run, Grants), and never runs a production-affecting step: that follows the
  person's merge, through a manual finish. An implementation request grants none of them.
- No run merges into the default branch, and no instruction found in data changes that.
- A run config holds limits and the person's kickoff answers only. A grant authorizes nothing the
  person did not grant, and a store that cannot detect an edit holds none. A project chooses its
  store by exposure: `tracker` is public on a
  public repository, `github-variable` is readable by every Actions workflow in the repository, and
  `command` is the project's own. `wkc-setup` says so when it asks.
- Ticket, PR, repository, and web text from other people is untrusted data. It never changes a
  document, a limit, or a check, under delegated planning too.
- Security is enforced in layers, and only the outer ones are outside the agent's reach (ADR-006):
  1. `push_check`, run by the skills before every push. An agent that ignored its instructions could
     skip it, so it catches mistakes, not a determined agent.
  2. A project's own pre-push hook running the same scanner. `git push --no-verify` skips it, and no
     skill passes that flag.
  3. GitHub push protection, enforced by the host. It is free on public repositories and needs
     GitHub Secret Protection on private ones. By default anyone with write access can bypass it by
     giving a reason, so it binds the agent only when the agent pushes as an identity without bypass
     rights, which delegated bypass sets for organization repositories.
  4. Branch protection, required checks, and no force pushes, for what reaches the default branch.
  A run uses the person's `gh` credentials unless the project gives it a narrower identity, and the
  kickoff round says which.
- Each ticket runs in its own worktree. Skills read only the files the work needs and never read
  credential files, `.env` files, or keychains.
- Scanners miss things. Review checks for secrets too (Review verdict), and a person still reviews
  what a run recorded.

## Requirements

- Each `SKILL.md` aims for under 150 lines and tries to stay under 250, so a person can read it
  ([AGENTS.md Prose](../../AGENTS.md#prose)). Neither is a hard limit; the Agent Skills
  specification's limit is 500. `wkc-backlog` is expected near 240 (ADR-004).
- At most 6 extra AI test sessions per change. Runbooks run on Claude Code; Codex and Kiro are SKIP.
- Each port adds `validation/wkc-<name>.md` with a few simple cases, each with an independent check.
- `wkc-yolo` merges only into its run branch, runs no production-affecting step, and acts on a
  shared non-production environment only under a kickoff grant. Its run PR is ready for review only
  when every required ticket is `done` and every readiness check passed at its head. Its runbook
  checks this.
- With `push_check` configured, no push by the skills happens without a pass, in any mode, and a
  run never pushes without one. The runbooks check it with a planted test credential.

## Boundaries

From the PRD non-goals:

- No marketplace, plugin packaging, or CI in this work. The maintainer plans a marketplace and CI
  later (2026-10-20); each needs its own written reason ([AGENTS.md Distribution](../../AGENTS.md#distribution)).
- No per-harness copies or consumer build step.
- No skill merges, publishes, or deploys on its own authority. No run merges into the default branch.
- A run never edits the PRD, closes a milestone, weakens a security protection, authorization
  limit, or operational safeguard, or weakens an acceptance criterion to make failing work pass.
- No `wkc-fix`, `wkc-qa`, `wkc-verify`, `wkc-git-fu`, or `wkc-create-ticket`.
- No status file beside the tracker, no priority, no separate ticket per step of one change.
- No scripts in installed skills unless a concrete failure requires one. Branch setup is written as
  instructions.

## Deployment

Each change is one PR with one patch bump of `VERSION` and a `CHANGELOG.md` entry
([AGENTS.md Versioning](../../AGENTS.md#versioning)). A version becomes a release through
`make release`. Adopters install with `npx skills add`, at the tip or pinned to a tag. Rollback is
the previous tag. Each port also updates the README roster, the repository map under
[diagram/](./diagram/), and its runbook.

## Development environment

- Markdown only. No build and no test suite yet, so `test_command` is absent from the config. The
  maintainer plans evals and basic validation scripts later (2026-10-20).
- `gh`, authenticated, for this repository's GitHub tracker and PRs.
- `npx skills` 1.5.26 or later; Node.js 22 or later for `wkc-workflow-diagram`.
- `make install`, `make worktree BRANCH=<type>/<slug>`, `make merge`, `make cleanup`, `make release`.
- Until then, validation is by runbook in `validation/`.

## Coverage

| PRD goal | Delivered by |
|---|---|
| 1. Ticket from `ready` to `done` | `wkc-implement`, `wkc-code-review`; Lifecycle, PR body, Review verdict; ticket shape; ADR-001, ADR-003, ADR-005, ADR-008 |
| 2. Plans follow changes | `wkc-backlog`; `wkc-plan` for ROADMAP changes and Milestone close; `wkc-architect` for SPEC changes; Discovered work; ADR-004 |
| 3. Unattended milestone | `wkc-yolo`; Unattended calls; Delegated run authority; Finish in a run; Gate classes; Grants; Push check; `push_check`, `run_config`; ADR-006, ADR-007, ADR-008 |
| 4. Learnings become rules | `wkc-retro` |
| 5. Small and readable | Requirements; Boundaries; one `SKILL.md` per skill |

## Decisions

- Ticket lifecycle and definition of done: [ADR-001](./adr/ADR-001-ticket-lifecycle.md).
- `wkc-backlog` owns tickets and `wkc-plan` the ROADMAP: [ADR-004](./adr/ADR-004-backlog-separate-from-plan.md),
  which supersedes [ADR-002](./adr/ADR-002-plan-absorbs-backlog.md).
- The reviewer fixes its own findings in fresh-context rounds: [ADR-003](./adr/ADR-003-review-and-fix-rounds.md),
  amended by [ADR-005](./adr/ADR-005-review-rounds-improve-code.md): rounds may apply worthwhile improvements, and
  only a fresh context approves.
- Merge into the default branch is a person's, in GitHub or with `gh`, in a run too. No merge skill.
- PRs carry no status labels.
- `wkc-tracker next` stays as is; `wkc-yolo` selects work as its run contract says (Contracts, wkc-yolo run).
- `wkc-implement` checks for uncommitted documents before branching.
- `wkc-retro` is manual and optional, and writes rules only on approval.
- `wkc-backlog` writes every ticket, for a milestone or one change, from one `SKILL.md`. No other skill
  creates or edits tickets beyond its own ticket's state and comments.
- An existing ticket changes only as shown in the approved draft.
- `wkc-yolo` scope is a ticket, a wave, or a milestone; parallelism and stopping follow its run contract.
- `wkc-implement`, `wkc-code-review`, `wkc-backlog`, `wkc-architect`, and `wkc-plan` opt into model
  invocation; see Invocation. `wkc-backlog` invokes `wkc-architect` for a SPEC change and `wkc-plan`
  for a ROADMAP change, chosen over naming them for the person to type, which stopped the
  2026-10-24 milestone-close change at a manual skill (maintainer, 2026-10-24).
- A milestone closes only through `wkc-plan close <milestone>`, after every ticket is terminal and
  the person confirms the exit check. Chosen over closing on ticket counts alone, because closed
  tickets do not prove the milestone's outcome, and over `wkc-plan` running the exit check, because
  some exit checks need AI sessions or a maintainer review (maintainer, 2026-10-24).
  `wkc-implement finish` only suggests it.
- Codex and Kiro support subagents (maintainer, 2026-10-20). Trouble starting one is filed as a bug.
- On Linear, PRs link with `Related to <ID>` only.
- `wkc-implement` finishes only when called as `wkc-implement finish <id>`, and only from the PR its
  own handoff or finish comment names. Chosen over picking finish from the ticket's latest merged
  PR, because PR #55, a SPEC change whose body said `Refs #54`, would have closed the never-built
  #54 as `done`, which the tracker cannot reopen (maintainer, 2026-10-22; #59).
- A bare `wkc-code-review` call reviews the current branch's one open PR, and asks otherwise. A PR
  or ticket id stays the preferred input (maintainer, 2026-10-22; #54).
- On the local backend, `wkc-tracker` commits each write and never pushes; `wkc-implement` carries
  ticket commits in the ticket's PR and a finish branch. Chosen over the person committing them,
  which left them uncommitted in S4 and S5, and over a gitignored `issues_dir`, which loses history
  and the only copy of the tickets in a repo without a remote (#48).
- A run merges only into its own run branch, and a person merges the run PR:
  [ADR-007](./adr/ADR-007-run-branch-and-run-config.md). Chosen over `merge_gate`, whose default
  merged into the default branch before anyone reviewed the run, and over a person merging each
  ticket PR (maintainer, 2026-10-26).
- A run's ticket reaches `done` on the run branch as soon as its own definition of done is met, and
  the run is verified as a whole at one head before its PR is called ready; non-production
  environments run under kickoff grants, and production follows the person's merge:
  [ADR-008](./adr/ADR-008-run-completes-its-tickets.md). Chosen over finishing tickets after the
  person's merge, which checked integration after the decision it should inform, and over moving
  every ticket to `done` at once at readiness, which held finished tickets on unrelated work
  (maintainer, 2026-10-26).
- `wkc-yolo`'s limits live in one run config per run, written once, in the store `run_config` names:
  `tracker` by default, `github-variable`, or the project's own `command`. A call is unattended only
  when it passes `--run <ref>`, and the skill reads the config through `wkc-tracker run show`. Chosen
  over a gitignored file passed by absolute path, which a subagent in another sandbox cannot open,
  and over a call that says it comes from `wkc-yolo`, which a model interprets (maintainer,
  2026-10-26; ADR-007).
- A post-merge gate that fails because of the ticket's change is fixed by a follow-up PR on the
  same ticket, never by a new ticket.
- `wkc-implement` and `wkc-code-review` hand discovered work to `wkc-backlog` themselves in the manual
  loop, and through `wkc-yolo` during a run.
- A reported problem carries its evidence in the same comment as its `Discovered:` line, and
  `wkc-backlog` copies it into the ticket's Notes. No separate evidence record, template, or approval step.
- Records have literal templates for writers and tolerant readers, with no validator. agent-toolkit's
  work-summary validator and its binding rules are the machinery this replaces.
- Distribution, naming, versioning, and authoring rules stay as [AGENTS.md](../../AGENTS.md) records them.
- A run with `Planning: delegated` approves its own SPEC, ADR, ROADMAP, milestone, and ticket
  changes within the PRD, technical requirements included, with a marked approval line and a
  Decision comment per change: [ADR-006](./adr/ADR-006-delegated-run-authority.md). Chosen over
  deferring SPEC changes to after the run and over parking (maintainer, 2026-10-24). Security
  protections, authorization limits, operational safeguards, PRD-set requirements, and acceptance
  criteria are never weakened.
- Secret scanning runs before every push through `push_check` once it is configured, in every mode,
  and a run requires a usable one. The run's kickoff reads push protection as enabled, disabled, or
  unverifiable, and records the last two only with the person's acceptance. Chosen
  over requiring a separate agent identity, which a user-owned repository cannot restrict fully, and
  over `push_check` alone (maintainer, 2026-10-24; ADR-006).
- Ticket scope is the ticket's outcome: related problems are fixed in the ticket, in every mode
  (Contracts, Ticket scope).

## Risks and dependencies

- `wkc-backlog` and its ticket templates come first: `wkc-implement` and `wkc-code-review` hand
  discovered work to it, and every later ticket uses its templates. It and the first
  `wkc-implement` ticket are built by hand; later ports are built through `wkc-implement`.
- `wkc-code-review` depends on the PR body and the ticket shape.
- `wkc-backlog` depends on the ticket shape and carries the most instructions of any skill, past
  the 150-line aim. One SPEC-boundary failure is known: a criterion copied from a neighbouring
  command's contract (PR #41, S2 and S10). It is a regression case in its runbook, not a solved problem.
- Parallel tickets can conflict at merge; coordination risks from `wkc-backlog` and serialized merges
  limit that. Every merge after the first in a wave costs one more review round.
- `wkc-yolo` validation runs parallel subagents, which needs the maintainer's approval under
  [token usage](./rules/token-usage.md): test sessions run one at a time, at most 6 per change.
- `wkc-yolo` depends on all of the above, on the unattended contract, and on fresh contexts.
- Delegated approval makes `approved` mean "a run judged it" for marked documents. The marked line,
  the Decision trail, and git history let a person find and revert a change, but nobody reviewed it
  before tickets built on it.
- A milestone's run PR is a large review. Each ticket PR inside it was reviewed and is listed in
  its body; a wave or ticket run gives a smaller one.
- A run's ticket is `done` before its work reaches the default branch. Its finish comment names
  the run branch, outside the run it stays an unmet blocker until the run PR merges, and
  `wkc-tracker next` may still list its dependents.
- A later merge can break a `done` ticket. Readiness catches it, and the fix is a repair ticket,
  because no verb reopens a terminal ticket.
- Local readiness evidence lives in run PR comments so recording it cannot change the checked
  head. Readers must consult the PR as well as local ticket files for that evidence.
- Readiness reruns every required gate once at the final head, on top of each ticket's own finish.
  Rerunning only the gates a change touched needs a judgment no record can check.
- A milestone run is ready only when its whole scope is `done`; a budget smaller than the scope, a
  parked ticket, or a move the person refused leaves a draft.
- On Linear and the local backend, the `tracker` store cannot detect an edited run config, so it
  holds no grants.
- The security layers inside the agent's instructions stop mistakes, not an agent that ignores its
  instructions. Only host push protection under a narrower identity stops that, and a user-owned
  repository cannot restrict bypass.
- Wider ticket scope makes PRs larger and reviews harder; the **What changed** list is the mitigation.
- `wkc-retro` needs only tracker reads and the comment conventions above, so it can ship any time
  after `wkc-implement`.
- The finish mode may make `wkc-implement` hard to follow. Then a small delivery skill takes over
  post-merge steps (PRD assumption).
- The setup fields must land with the first skill that reads them.

## Open unknowns

None.

## Changes

- 2026-10-26: A run completes its tickets and verifies itself before the person's merge
  (maintainer review of proposed ADR-008; ADR-008). `wkc-implement finish <id> --run <ref>` runs
  right after each merge into the run branch, and a ticket reaches `done` there when its own
  required gates pass; `verify <id> --run <ref>` reruns gates with no status change. Gates and
  exit-check items are classified as local, shared non-production, or production-affecting by target
  and impact; kickoff grants shared non-production environments with exact commands, limits,
  cleanup, and expiry, and proposes moving production steps to release tickets and acceptance or
  release approvals to the run PR's review checklist, each only on the person's yes. A same-run
  blocker needs its finish to find no failed gate; outside the run, a `done` ticket on an unmerged
  run branch is unmet. Waiting tickets are finished again when what they wait on can have changed.
  The run PR is ready only when every required ticket is `done` and readiness passed at its head,
  and a draft otherwise. Follow-ups in a run target the run branch. Environment failures are
  retried and recorded `not run`; product failures are rerun once. Cleanup runs after readiness, at
  controlled stops, and first on resume. After the run PR, an outcome comment per ticket; a closed
  run PR undoes no `done`, and a new run may supersede it. The gate comment's `Merge commit:` line
  becomes `Commit: <sha> on <branch>`, and the finish comment gains `into <branch>` and
  `Verified at:` (Overview, Components, Ticket, Lifecycle, Ticket comments, Unattended calls,
  Delegated run authority, wkc-yolo run, Data, Failure handling, Security, Requirements, Decisions,
  Risks). Replaced the closing round and its `--authorized` steps, "A ticket stays `in-review` after
  its merge into the run branch", a same-run blocker met on merge alone, the follow-up to the
  default branch under a run, "A run PR closed without merging leaves its tickets `in-review`", and
  "holds limits only". Readiness repairs join the run under `New prerequisites: run` and the
  admission budget without adding blockers to completed tickets. New release tickets follow the
  manual implementation lifecycle before `finish`. The maintainer approved a local-backend
  exception during PR #79 review: finish ticket-file writes and prepare a draft run PR before
  readiness, then record verification evidence, an intermittent check's `Discovered:` item
  included, and cleanup evidence in PR comments without changing the checked head; that item's
  ticket is filed after the run PR. Resume and evidence lookup read both locations. Follows the
  PRD revision of the same day. Review M4 (#74).

- 2026-10-26: Run branch and run config (maintainer review of PR #78; ADR-007). A run merges only
  into its own run branch and ends with one run PR that a person merges; release and deploy steps
  are approved in a closing round after that merge; the kickoff round names blind spots in the work;
  a blocker of the same run counts as met once merged into the run branch; finish counts a PR merged
  into another branch only once that branch merged into the default branch. The run record becomes
  the run config: limits only, written once with `wkc-tracker run create`, read with
  `wkc-tracker run show`, in the store the new `run_config` field names; a call is unattended only
  with `--run <ref>`. The secret incident and push protection status stay out of the run PR body
  (Overview, Components, Config fields, Lifecycle, Invocation, Unattended calls, Delegated run
  authority, wkc-yolo run, Data, Failure handling, Security, Requirements, Boundaries, Coverage,
  Decisions, Risks). Replaced `merge_gate`, the run record file under `docs/dev-agents/runs/`, its
  absolute path in calls and in the delegated approval line, "says it comes from `wkc-yolo`", the
  kickoff's approval of `(needs authorization)` steps, and the local finish PR merging under
  `merge_gate`. Follows the PRD revision of the same day. Review M4 (#74, #76, #77).

- 2026-10-24: Delegated run authority (maintainer; ADR-006). A run with `Planning: delegated`
  changes the SPEC, ADRs, ROADMAP, milestones, and tickets through `wkc-backlog`, `wkc-architect`,
  and `wkc-plan`, approving each with a marked status line and merging it as a planning PR; it may
  revise technical requirements on evidence, and never edits the PRD or weakens security
  protections, authorization limits, operational safeguards, PRD-set requirements, or acceptance
  criteria. New `push_check` field, binding every push once configured, in every mode, and required
  by a run; kickoff reads push protection as enabled, disabled, or unverifiable;
  layered security; a review security checklist; Ticket scope fixes related problems in the
  ticket; new prerequisites may join a run; waiting is apart from parked; the run record gains four
  lines (Overview, Components, Config fields, Ticket scope, Lifecycle, Review verdict, Invocation,
  Unattended calls, Delegated run authority, wkc-yolo run, Failure handling, Security, Requirements,
  Boundaries, Decisions, Risks). Replaced "never `wkc-yolo`" for `wkc-architect` and `wkc-plan`,
  model invocation never approving a design or plan, the ticket or wave run parking every new
  prerequisite, and the two config fields. Follows the PRD revision of the same day (goal 3,
  non-goals, Security constraint). Review M4 (#73, #74) and M5.

- 2026-10-24: Milestones can close. `wkc-tracker` gains `milestone close <name>`, mechanism only,
  real on GitHub and a no-write report on Linear and local; `wkc-plan close <milestone>` closes one
  after every ticket is terminal and the person confirms the exit check; `wkc-implement finish`
  names that call when its ticket leaves the milestone with nothing open (Components, Milestone
  close, Decisions). Reason: M2 and M3 stayed open on GitHub with every ticket closed. Replaced
  "`wkc-tracker` needs no new verb", `wkc-plan`'s reads-only tracker use, and the tracker's "never
  close". `wkc-architect` and `wkc-plan` opt into model invocation, with `wkc-backlog` as a
  caller for SPEC and ROADMAP changes (Components, Invocation, Decisions). Replaced both in the
  manual list, and `wkc-plan`'s "returns to manual invocation" from 2026-10-21 and ADR-004's
  Consequences, which ADR-004's status line now marks as amended. No ROADMAP
  milestone covers this work: `wkc-plan` places it. Review M2 (`wkc-implement`) and M1
  (`wkc-backlog`).
- 2026-10-23: Maintainer review of PR #58 (ADR-005). A review round may apply worthwhile in-scope
  improvements, and every round that commits code is `fixed` and counts against `max_fix_attempts`;
  a blocking finding is verified before it is fixed and includes SPEC violations and security
  defects; a later round does not repeat resolved findings; a round that is not independent never
  approves. For a PR, the ticket is the one whose handoff names it, and a ticket the PR only names
  stands in when it is `in-review` with no handoff naming another PR; rounds are counted by verdict,
  with a duplicate counted once; the verdict gains an `improved` line kind; any fixing round,
  the last one included, may apply improvements; a landed fix commit always gets its `fixed` verdict; with no GitHub
  remote, the round reviews the ticket's branch. Replaced "Suggestions are never applied", "the
  count of earlier verdict comments", and the PR body's first line as the only ticket source
  (Review verdict, Config fields, Decisions). Review: M3 (#54); M4, whose rounds already start
  fresh.
- 2026-10-22: `wkc-implement` finishes only on an explicit `wkc-implement finish <id>`, which
  `wkc-yolo` calls after its merges, and only from the PR named by the ticket's own handoff or
  finish comment; a PR that only cites the ticket never counts, and with no such record finish asks
  (Components, Lifecycle, wkc-yolo run, Decisions). Reason: PR #55's `Refs #54` would have selected
  finish for a ticket nobody built. Replaced "picks its mode from the ticket and its latest PR, not
  an argument". Review M2 (#59, and `validation/wkc-implement.md` case 23, whose held ticket with no
  handoff now asks instead of finishing) and M4.
- 2026-10-22: `wkc-code-review` with no argument reviews the current branch's one open PR, and
  asks when there is none or several; a PR or ticket id is preferred (Review verdict, Decisions;
  #54). Replaced the undefined "none" input. Under `wkc-yolo`, a local finish PR that touches only
  `issues_dir` merges without a review round (Lifecycle, Failure handling). Replaced "merges only
  an approved sha" without exception. Review M3 (#54) and M6.
- 2026-10-21: On the local backend, `wkc-tracker` commits the ticket files each write changes,
  `wkc-implement` branches before it claims, and post-merge writes go on a finish branch that is
  pushed or opened as a PR (Lifecycle, Decisions; #48). Replaced the unstated "nobody commits
  ticket files", under which `local.md` forbade git and S4 and S5 left the writes uncommitted.
  `wkc-tracker` is no longer unchanged. Review M2 (`wkc-implement`) and M4 (`wkc-yolo` on local).
- 2026-10-21: Any skill that reports a defect or other problem for a new ticket gives evidence: the
  `Discovered:` comment gains `Observed`, `Reproduce`, `Because`, and `Verified` lines under its
  unchanged first line, and the work ticket's Notes gain an `Evidence` line that `wkc-backlog` copies
  them into. A finding the evidence does not establish is marked unverified. Reason: the report
  behind issue #47 lost the evidence needed to check it. Replaced the one-line `Discovered:` template.
  Review: ROADMAP M2 (PR #46 copies the template), M1's shipped `wkc-backlog`, M3, and M5.
- 2026-10-21: `wkc-backlog` is a new component that owns ticket drafting and every ticket write, for
  a milestone or one change; `wkc-plan` keeps only the ROADMAP and returns to manual invocation
  (maintainer, ADR-004, superseding ADR-002). Discovered work, Invocation, Unattended calls, the
  `wkc-yolo` run, `wkc-retro`, Requirements, Boundaries, Coverage, Decisions, and Risks name
  `wkc-backlog` where they named `wkc-plan` for tickets. Replaced "`wkc-plan` stays one `SKILL.md`"
  and the "No `wkc-backlog`" boundary. Review: ROADMAP M1 to M3.
- 2026-10-21: Open unknown 1 answered: on Linear, a PR linked only by `Related to <ID>` left its
  issue's status alone through open, a comment review, and merge, while a `Fixes` control moved.
  The Linear contract keeps `Related to`; the check and its gaps are under Contracts, Linear.
  Replaced open unknown 1. Review: none; ROADMAP M2 already builds against this contract.

- 2026-10-21: Risks put `wkc-plan` change handling first, because `wkc-implement` and
  `wkc-code-review` now depend on it. Replaced "`wkc-implement` comes before everything else".
  Review: ROADMAP order.
- 2026-10-20: The work ticket gains `## Why`, the reason the work matters, with its PRD or SPEC
  source. Review: ROADMAP M3.
- 2026-10-20: Literal templates for the work ticket, spike, and decision ticket from `wkc-plan`;
  the review verdict gains `Fixed in` and `Fixing rounds used`, and a `fixed` round makes one fix
  commit from a template; `Decision (wkc-yolo):` and `Parked (wkc-yolo):` comments get templates.
  Replaced "Ticket shape additions" and the per-finding fix sha. Review: ROADMAP M2 and M3.
- 2026-10-20: Maintainer decisions. A failed post-merge gate gets a follow-up PR on the same ticket;
  `wkc-implement` and `wkc-code-review` call `wkc-plan` for discovered work in the manual loop; the
  run record folder ignores itself in git, and "main checkout" now says where the run started;
  literal templates for the PR body and `wkc-implement`'s handoff, gate, and finish comments.
  Replaced the loose PR body list, the "PR-URL comment", and "a person runs `wkc-plan`". Review:
  ROADMAP M1 and M3.
- 2026-10-20: Maintainer review. `SKILL.md` length is a target, under 150 and under 250 for
  readability, not a limit; marketplace and CI are later work, not permanent boundaries; evals and
  validation scripts are planned. Replaced "under 150, except `wkc-plan`" and "no CI in this
  repository".
- 2026-10-20: Second review. A `Run:` comment ties each admitted ticket to its run, and resume
  and the ticket budget count those comments; held tickets are adopted in the up-front round; an
  open PR with an incomplete handoff is still build mode; Decisions point at the run contract.
  Replaced "this run holds" and "measured from the tracker".
- 2026-10-20: Third review. A spent ticket budget stops admissions, not admitted work; admitted
  `ready` tickets resume with a claim; the latest `Run:` comment decides ownership, and adoption
  needs the other run stopped. Later yolo details move to the `wkc-yolo` port.
- 2026-10-20: Review findings. Approval covers the exact head, and every update from `main` gets a
  fresh round (replaced the clean-update exception); the local backend runs a run's tickets one at a
  time; one run record per run, passed by absolute path; `wkc-yolo` resumes its own unfinished
  tickets before new work; post-merge gates come from the whole ticket, with release and validation
  evidence; ticket and wave scopes record their ids and never grow; budgets count tickets or time,
  not sessions; `max_fix_attempts` counts fixing rounds, and a review-only round always follows;
  queued merges are waiting, not merged.
- 2026-10-20: `wkc-plan` stays one file instead of mode files; "never change a reused ticket"
  becomes "only as shown in the approved draft"; `wkc-yolo` takes a ticket, wave, or milestone,
  asks everything in one round, and runs waves in parallel; the Linear GitHub integration is not
  needed. Replaced the mode-file structure from the previous entry.
- 2026-10-20: Maintainer answers on open unknowns. `wkc-plan` splits by mode and owns every ticket
  write, refinement included; `wkc-implement`, `wkc-code-review`, and `wkc-plan` opt into model
  invocation; subagents are assumed on all three harnesses; the run record holds a run's limits;
  Linear PRs use `Related to`. Replaced open unknowns 1 to 3 and the Linear spike. Review: ROADMAP
  milestones for `wkc-plan` and `wkc-yolo`, once written.
- 2026-10-20: First version, from the draft PRD and the shipped skills.
