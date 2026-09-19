# Tracker validation runbook

A repeatable run, driven by Codex, that ends in a PASS or FAIL line per case and a report at the
bottom. Written for Codex because it is the harness this repository has verified least; run it on
Claude Code or Kiro CLI by swapping the prefix in the table below.

| Harness | Prefix | Example |
|---|---|---|
| Codex | `$` | `$tracker list ready` |
| Claude Code | `/` | `/tracker list ready` |
| Kiro CLI | `/` | `/tracker list ready` |

Every `$tracker ...` below is the skill under test. Every `gh`, `cat`, or `jq` line is the
**independent check**, and it is what decides PASS or FAIL. Never score a case on what the skill
reported about itself: the whole point is that this skill's failure mode is reporting success while
the backend disagrees.

## How to score

Each case states its check and its expected result. Record exactly one verdict:

- `PASS` the check ran and matched.
- `FAIL` the check ran and did not match. Record actual versus expected.
- `SKIP` the case could not run. Record why.

**A case that cannot run is SKIP, never PASS.** A SKIP is an untested claim, and an untested claim
reported as a pass is how a defect reaches a user. The report at the end counts the three separately
and never folds SKIP into PASS.

Cases marked **[MANUAL]** need a human: a second terminal, a second account, a web UI action, or a
service this repository has no credentials for. They are expected to be SKIP on an unattended run,
and the report says so rather than treating the suite as green.

## Report format

End every run with exactly this, filled in:

```
TRACKER VALIDATION
backend: <github|local|linear>   harness: <codex|claude-code|kiro-cli>
date: <ISO 8601>                 skill ref: <git sha or tag installed>

PASS  n
FAIL  n
SKIP  n

failures:
  <case id>  expected <x>  actual <y>
skipped:
  <case id>  <reason>

VERDICT: <GREEN if FAIL is 0 and no non-[MANUAL] case was skipped, otherwise RED>
```

`GREEN` requires zero failures **and** that every non-manual case actually ran. A run whose manual
cases are all skipped is still GREEN, and the skipped list is what tells you what remains unproven.

---

## Setup, once per backend

```
mkdir -p ~/tmp/tracker-val && cd ~/tmp/tracker-val
npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#feat/tracker' -a claude-code -a codex -a kiro-cli
```

**S1 install layout.** Check: `ls .agents/skills/tracker/`. Expect `SKILL.md`, `README.md`,
`github.md`, `linear.md`, `local.md`, `agents`. The `README.md` is there on purpose: the installer
copies the whole skill directory, so the human-facing explainer ships to every consumer.

**S2 sibling resolution.** Check: `head -1 .claude/skills/tracker/github.md` and the same under
`.kiro/`. Expect `# Backend: GitHub Issues` from both.
Both directories have to have been created by the installer, since nothing here pre-creates them.

**S3 one skill per name.** Check:
`npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#feat/tracker' -l`.
Expect exactly 2 skills and nothing named `skill-name`. Nothing from `validation/` may appear
either.

---

## A. GitHub backend

Setup has three starting states. A1 and A2 are the awkward ones and A3 is what most people actually
have; the rest of the leg runs against A3's repository. The install block deliberately does not run
`git init`, because the installer does not need one and because A1 has to find a directory without
one.

**A1 setup offers to create the git repository.** In this directory, which has no `.git`, run
`$setup`.
Expect it to say there is no git repository and offer `git init` before the interview reaches
Section B. Nothing else in the run works without one: the `github` backend has nowhere to attach a
remote, and step 7 has nothing to commit to.
Check: `git rev-parse --git-dir` succeeds before setup reports.

**A2 setup resolves a missing remote in Section A.** Carry on from A1, whose repository has no
remote, and answer `github`.
Expect it to ask which repository right there, offering both an existing one and
`gh repo create`. A run that notes the missing remote and moves on to Section B is a FAIL: the user
answers three more sections without knowing whether the backend they picked will work at all.
Check: `git remote -v` names a GitHub remote, and `docs/dev-agents/config.md` records the resolved
repository rather than an intention to add one.

**A3 an existing repository asks nothing.** In a fresh directory, clone a repository you already
own, empty or not, install the skills into it, and run `$setup`. This is the ordinary case, and the
two above are the edge cases.
Expect Section A to ask for the backend and nothing else: the repository and the remote are already
there, so there is nothing left to resolve.
Check: `git remote -v` is unchanged by the run, and the config names that repository.

Run the rest of the leg here. `<R>` below is this repository's `OWNER/REPO`.

**A4 four labels, not seven.**
Check: `gh label list --repo <R> --json name --jq '[.[].name]|sort|join(" ")'`
Expect `backlog`, `in-progress`, `in-review`, and `ready` present, and `done` and `cancel` absent.
`duplicate` proves nothing either way: it ships in GitHub's own default label set, so a repository
created through the web UI already has one before setup runs. What matters is that setup did not
create it and that nothing reads it as a status, which A11 covers.

**A5 create writes the ticket.** `$tracker create` with ticket A, from a body file you keep.
Check the labels with `gh issue view <A> --repo <R> --json title,labels`, and the body with a byte
comparison rather than by eye:

```
gh issue view <A> --repo <R> --json body | jq --rawfile sent <the body file> -e '.body == $sent'
```

Expect no status label, since `create` defaults to `backlog`, and `true` at exit 0 from the
comparison. Do not substitute `--jq .body > file` or `"$(...)"` for that command: the first appends
a newline and the second strips one, so both report a difference on a byte-identical body and score
a correct `create` as FAIL.

**A6 create writes the edge.** `$tracker create` with ticket B naming `#<A>` under `## Blocked by`.
Check: `gh issue view <B> --repo <R> --json blockedBy --jq '[.blockedBy.nodes[].number]'`
Expect `[<A>]`. This is the edge `create` writes as a second call; its own exit code says nothing
about it.

**A7 link is its own verb.** Create E with no blockers, then `$tracker link <E> blocked-by <A>`.
Check: `gh issue view <E> --repo <R> --json blockedBy --jq '[.blockedBy.nodes[].number]'`
Expect `[<A>]`. The dependency endpoint takes the blocker's numeric **database** id, which is
neither `#<A>` nor its `node_id`, so a skill that passed the issue number here either errors or
writes an edge to some unrelated issue. Check which one you got.

**A8 Related is a reference, not an edge.** `$tracker create` with ticket F naming `#<A>` under
`## Related` and nothing under `## Blocked by`.
Check: `gh issue view <F> --repo <R> --json body,blockedBy`
Expect the `## Related` line present in the body and `blockedBy.nodes` **empty**. A `## Related`
entry that became a dependency edge is a FAIL: it would drop F off the frontier over a reference
nothing is supposed to compute on.

**A9 frontier excludes the blocked ticket.** `$tracker move <A> ready`, `$tracker move <B> ready`,
then `$tracker next`.
Expect A and not B.

**A10 closed blocker releases the frontier.** `$tracker move <A> done`, then `$tracker next`.
Expect B.
Check the reason by hand:
`gh issue list --repo <R> --state open --json number,blockedBy --jq '.[]|select(.number==<B>)'`
Expect `blockedBy.totalCount` still `1` with the node `CLOSED`. A `next` that filtered on
`totalCount` would never return this ticket.

**A11 topic labels do not block a claim, including one named after a status.**
`gh issue edit <B> --repo <R> --add-label bug --add-label duplicate`, then `$tracker claim <B>`.
Check: `gh issue view <B> --repo <R> --json assignees,labels`
Expect `bug`, `duplicate`, and `in-progress`, one assignee, you. A refusal means the pre-read counts
topic labels as status labels. `duplicate` is the sharp half: it is a GitHub default label and it
shares a name with one of the seven statuses, but only the four open statuses are labels at all, so
it has to read as an ordinary topic label and survive every write untouched.

**A12 multi-status issue never reaches a result, and all three verbs agree.**
`gh issue create --repo <R> --title "two statuses" --body x --label ready --label in-progress`
then `$tracker next`, `$tracker list ready`, `$tracker list backlog`, and `$tracker show <that id>`.
Expect the issue in none of the three result sets, named as inconsistent by all four verbs, and both
labels named by `show`. A verb that reports it as `ready`, as `backlog`, or not at all is a FAIL:
one shared status test is supposed to make disagreement impossible.

**A13 multi-status issue is repairable.** `$tracker move <that id> ready`.
Check: `gh issue view <that id> --repo <R> --json labels --jq '[.labels[].name]|sort'`
Expect exactly `ready`.

**A14 the no-op move keeps its label.** `$tracker move <B> in-progress` on a ticket already there.
Check: `gh issue view <B> --repo <R> --json labels --jq '[.labels[].name]|sort'`
Expect `bug`, `duplicate`, and `in-progress` all three. A missing `in-progress` means the add and
remove lists overlapped; a missing topic label means the move touched labels that were not its own.

**A15 terminal move records the reason and strips the label.** `$tracker move <B> done`.
Check: `gh issue view <B> --repo <R> --json state,stateReason,labels`
Expect `CLOSED`, `COMPLETED`, no status label, and both `bug` and `duplicate` retained. A ticket
closed as `COMPLETED` while still carrying a `duplicate` label is correct: the label is a topic and
the close reason is the status.

**A16 duplicate records its original.** Create C and D, then `$tracker move <D> duplicate <C>`.
Check: `gh issue list --repo <R> --state closed --json number,stateReason`
Expect D as `DUPLICATE`.

**A17 terminal is terminal.** `$tracker move <D> ready`.
Expect a refusal. `gh issue close` on a closed issue exits 0 and keeps the old reason, so the
pre-read is the only guard.

**A18 human-made ticket reads as backlog.** Create an issue in the web UI, no label, one-line body.
`$tracker show <id>` expect `backlog`; `$tracker next` expect it absent; `$tracker list backlog`
expect it present.

**A19 reopened ticket reads as backlog.** Reopen a closed issue in the web UI.
`$tracker show <id>` expect `backlog`.

**A20 backing off clears the assignee.** `$tracker claim <some ready ticket>`, then
`$tracker move <it> backlog`.
Check: `gh issue view <it> --repo <R> --json assignees`
Expect empty.

**A21 stale label stays invisible.**
`gh issue create --repo <R> --title stale --body x --label ready` then
`gh issue close <it> --repo <R> --reason completed`.
`$tracker list ready` and `$tracker next` expect it in neither.

**A22 comment lands and is verified.** `$tracker comment <some id> "runbook note"`.
Check: `gh issue view <it> --repo <R> --json comments --jq '[.comments[].body]'`
Expect the exact body present exactly once.

**A23 a milestone scopes the list.** `gh api repos/<R>/milestones -f title=M1`, put one `ready`
ticket in it with `gh issue edit <id> --repo <R> --milestone M1`, then `$tracker list ready M1`.
Expect only that ticket, with the second argument read as a milestone rather than rejected as an
unknown status. Then `$tracker list ready no-such-milestone`: expect a stop naming the milestones
that do exist, not the whole `ready` list unscoped and not an empty list at exit 0.

**A23b a closed milestone still scopes the list.** `gh api repos/<R>/milestones -f title=M2`, put
another `ready` ticket in it with `gh issue edit <id> --repo <R> --milestone M2`, close the
milestone with `gh api --method PATCH repos/<R>/milestones/<its number> -f state=closed`, then
`$tracker list ready M2`.
Expect that ticket. This is the half a title lookup cannot do: `gh issue list --milestone M2`
returns `[]` at exit 0 once the milestone is closed, while `--milestone <its number>` returns the
ticket, so a skill that passes the title straight through reports "no tickets" for a milestone that
has them. An empty result here and a stop here are both FAIL, and they are different bugs: empty
means the title was passed through, a stop means the resolver read open milestones only.

**A24 [MANUAL] claim race.** Two terminals, one `ready` unassigned ticket, `$tracker claim <id>` in
both at once. Expect the loser to remove only its own assignment, leave `in-progress` alone, and
report. Needs a second terminal, and ideally a second GitHub account.

**A25 [MANUAL] host without issue dependencies.** Run `$tracker next` against a GitHub Enterprise
host that does not expose `blockedBy`. Expect a loud stop, never an empty frontier. Needs such a
host.

Tear down: delete the issues and the four labels, or delete the repository with
`gh repo delete <R>` if the run created it. Do not delete a repository you already had; A3 is
written so the leg can run against one you keep.

---

## B. Local backend

Fresh scratch repo, `$setup`, answer `local`.

**B1 scaffold.** Check `docs/dev-agents/issues/` exists and the config carries `issue_tracker:
local` and `issues_dir`.

**B2 create writes a parseable file.** `$tracker create` with ticket A.
Check: parse the frontmatter with a real YAML parser, not by eye:
`uv run --with pyyaml python -c "import yaml,sys;print(yaml.safe_load(open(sys.argv[1]).read().split('---')[1]))" docs/dev-agents/issues/001-*.md`
Expect a dict whose `id` is the string `'001'` and whose `status` is the string `'backlog'`.

**B3 quoting round trip.** This is the case the quoting rule exists for. Create tickets with each of
these titles, then parse each file back and compare byte for byte with what you sent:

```
Fix: colon in title
It's got an apostrophe
She said "quoted" loudly
[bracketed] {braced}
- leading dash
0123
null
2026-09-18
émoji ✅ and 日本語 and Ünïcödé
It's a "mixed" quote: 100% and 日本語 ✅
```

Expect all ten to parse and to come back identical. A title returning `83`, `None`, or a date object
is a FAIL, and it is the specific failure unquoted YAML produces.

**B4 edges live in the frontmatter.** `$tracker create` ticket B naming A under `## Blocked by`.
Check the file: `blocked_by` holds A's id, and the `## Blocked by` body section matches.

**B5 Related has no frontmatter field.** `$tracker create` ticket F naming A under `## Related` and
nothing under `## Blocked by`.
Check the file: the `## Related` section is in the body, `blocked_by` is empty, and no `related`
key was invented in the frontmatter. Nothing computes on `## Related`, so anything that parsed it
into state is a FAIL.

**B6 link keeps the body in step.** `$tracker link <F> blocked-by <A>`.
Check the file: `blocked_by` now holds A's id **and** the `## Blocked by` section lists it, since
this file has one. Then hand-write a file with no `## Blocked by` section, link it, and check that
`blocked_by` changed and the body was left alone.

**B7 frontier.** `$tracker move <A> ready`, `$tracker move <B> ready`, `$tracker next`.
Expect A only.

**B8 claim resolves an identity.** `$tracker claim <A>`.
Check the file: `status: 'in-progress'` and `assignee` equal to `git config user.name`. An empty
assignee is a FAIL; the skill should have stopped and said the identity was unresolvable.

**B9 terminal releases the frontier.** `$tracker move <A> done`, then `$tracker next`. Expect B.

**B10 comment.** `$tracker comment <B> "a note"`. Check the file: the body is under `## Comments`
with a `### <date> <author>` heading.

**B11 the tracker never commits.** Check: `git status --porcelain`.
Expect the ticket files listed as uncommitted. A clean tree is a FAIL.

**B12 hand-written file.** `printf '# just a title\n\nsome prose\n' > docs/dev-agents/issues/099-hand.md`
then `$tracker show 99`. Expect `backlog` rather than an error.
Then `$tracker move 99 ready` and check the file gained a frontmatter block carrying only the fields
that verb sets, with the prose untouched.

**B13 id forms are interchangeable.** `$tracker show 99`, `$tracker show 099`, `$tracker show '#99'`.
Expect the same ticket three times.

**B14 an unknown milestone is a stop here too.** Give one ticket `milestone: 'M1'`, then
`$tracker list ready M1` and `$tracker list ready no-such-milestone`.
Expect the ticket from the first, and a stop naming `M1` from the second. There is no milestone
registry in this backend, so the set of milestones is whatever the files carry; an empty list for a
name nothing carries is the same wrong answer GitHub gives, in a place where the whole set was
already read.

---

## C. Linear backend

Needs the Linear MCP server connected and a scratch team. Read-only cases can run against any team
you have access to; the cases that add or remove a status need Linear's settings UI, so they are
`[MANUAL]`.

The read and write paths in `linear.md` have both been executed against a live workspace, so a
failure here is a regression rather than an expected gap. Two things in that file are still
unproven and are marked in the case list: the comment path, and a claim race needing two identities.

**C1 a fresh team is missing In Review.** Run `$setup` against a newly created Linear team.
Check: `list_issue_statuses` returns six statuses, no In Review.
Expect a stop naming In Review and the `started` category, and **no** Linear fields in the config.
This is the ordinary first run, not an edge case: Linear's default template does not include it.
Add In Review in team settings, re-run, and expect setup to complete with no mapping questions.

**C2 [MANUAL] a missing status is a stop.** Rename or delete the team's `In Review`, then re-run
`$setup`.
Expect a refusal that names the missing status and says what to add in team settings, and **no**
Linear fields written to the config. A skill that invents a substitute here is the failure this case
exists for.

**C3 [MANUAL] an extra status warns and is recorded.** Add a status such as `Ready to Merge` under
`Started`, then re-run `$setup`.
Expect setup to complete, warn loudly by name and category, and write a note under **Tracker notes**
in `docs/dev-agents/config.md`. Check the file, not just the report.
Then park an issue in that status and run `$tracker list` and `$tracker next`: it must be reported
as unmapped by its Linear name, never counted as one of the seven and never silently dropped.

**C4 operate by name.** `$tracker list ready`, then `$tracker move <id> in-progress`.
Check with `get_issue`: the status is exactly `In Progress`. Nothing should be resolved by category
at run time.

**C5 [MANUAL] a renamed status is a stop, not a fallback.** Rename `Done` to `Released` after setup
has run, then `$tracker move <id> done`.
Expect a stop saying the workflow no longer matches the config and to re-run `$setup`. A skill that
finds `Released` by its `completed` category and writes to it anyway has absorbed a drift it should
have surfaced.

**C6 a bad status name errors rather than failing silently.** Write a status using a name no status
has, for instance `in reviewww`.
Expect `Could not find state "in reviewww"` and no change. Then write `in progress` in lower case:
expect it to resolve to `In Progress`, since matching is case-insensitive.
The predecessor recorded this as a silent failure. It did not reproduce against a live server;
record what you see, since a regression either way matters.

**C7 the frontier reads blocker statuses.** Create A and B with B blocked by A, both `Todo` and
unassigned. `$tracker next`.
Expect A and not B. Then move A to `Done` and re-run: expect B.
A relation carries only the blocker's id and title, so a frontier that never fetched A's status
cannot have filtered correctly, even if the answer looks right on one sample.

**C8 relations are native.** `$tracker link <B> blocked-by <A>`, then `get_issue` on B with
`includeRelations: true`.
Expect the edge under `relations.blockedBy`.

**C9 the duplicate transition destroys other relations.** Give a ticket a `relatedTo` edge, confirm
it with `get_issue`, then `$tracker move <it> duplicate <original>` and read it again.
Expect `duplicateOf` set, the status `Duplicate` rather than `Canceled`, and **`relatedTo` emptied**.
Linear clears the other relations with no error and no mention in the response. Expect the skill to
have read the relations first and to report what was lost. A run that reports a clean move is a
FAIL: it means nothing looked.

**C10 milestone scoping.** `$tracker list ready "<milestone name>"`.
Expect only that milestone's issues. Then pass a milestone name that does not exist: expect a stop,
not the whole project unscoped.

**C11 comment lands and is verified.** `$tracker comment <id> "runbook note"`.
Check with `list_comments`: the exact body present exactly once.
This is the one read-write path in `linear.md` that has never been executed. `save_comment` and
`list_comments` were read from the server but never called, so the tool shapes are inferred.

**C12 [MANUAL] claim race.** Two sessions, one `Todo` unassigned issue, `$tracker claim <id>` in
both. A Linear issue has a single assignee, so the loser cannot detect the race by counting
assignees: expect the verification read to name the winner, and the loser to write nothing back and
report. Needs two identities.

---

## D. Harness parity

Run the same one command from one install on each harness available.

**D1 Codex.** `$tracker list` expect the backend answers.
**D2 Claude Code.** `/tracker list` expect the same result.
**D3 [MANUAL] Kiro CLI.** `/tracker list`, and check the slash-command menu renders the one-line
description correctly rather than truncating it at a colon or showing `>`.

**D4 setup asks the way the harness allows.** Run `$setup` and stop at Section A.
Expect numbered options with the recommended one first and a digit accepted as the answer, or the
harness's own picker where it has one a skill can invoke. Codex has none, so numbered text is the
correct result there and not a failure. An unnumbered prose list is a FAIL.

**D5 sections are not batched into one picker.** On a harness whose picker takes several questions,
Claude Code included, run `$setup` in a directory with no `.git` and watch the first prompt.
Expect the `git init` offer on its own, then Section A with its prerequisites resolved, and only
then Section B. A single picker carrying `git init` plus Sections A to D is a FAIL even though every
question in it is individually correct: the backend answer decides whether the later answers mean
anything, and a missing remote has to be resolved before Section B is on screen.

**D6 the question ends the turn.** Watch the harness while Section A is on screen.
Expect it idle and waiting, so the answer is typed straight in. A harness still reporting work, or
holding the reply as a queued input, is a FAIL: the skill asked and then kept going.

---

## Run log

Newest first. One entry per run. The runbook above is the reusable procedure and is not edited by a
run; everything a run learned goes here.

### 2026-09-18 GitHub leg, Claude Code

```
TRACKER VALIDATION
backend: github                  harness: claude-code
date: 2026-09-18                 skill ref: a415ff2 (feat/tracker)

PASS  20
FAIL  2
SKIP  3

failures:
  A2   expected the missing remote resolved inside Section A   actual resolved after Sections B, C and D were answered
  A23  expected a stop on an unknown milestone name            actual empty list, exit 0, empty stderr
skipped:
  A3   needs a fresh clone of a repository that already has a remote; this run was the A1/A2 shape
  A24  [MANUAL] claim race, needs a second terminal and ideally a second account
  A25  [MANUAL] needs a GitHub Enterprise host without issue dependencies

VERDICT: RED
```

Scope: leg A, cases A1 to A25. `S1` and `S2` also ran and passed: the install carries `SKILL.md`,
`README.md`, `github.md`, `linear.md`, `local.md` and `agents`, and both `.claude/` and `.kiro/`
resolve `github.md` to `# Backend: GitHub Issues`. `S3` was not run. Legs B, C and D were not run.

Environment: `gh` 2.97.0, repository `wilsonkichoi/tracker-gh`, private and empty at the start. The
installed skill was byte-identical to repo HEAD across all five files, so every finding below is
against current source rather than a stale copy.

| Case | Verdict | Evidence |
|---|---|---|
| A1 | PASS | `git rev-parse --git-dir` succeeded before setup reported. Offer was made. See deviation D-1. |
| A2 | FAIL | `git remote -v` and the config are correct, but the question came too late. Finding F2. |
| A3 | SKIP | Not this run's starting state. |
| A4 | PASS | `backlog in-progress in-review ready` present, `done` and `cancel` absent. `duplicate` predates setup: it was in the label list before any label was created. |
| A5 | PASS | #1 body 642 chars, matching the 642-byte file sent, labels `[]`. See finding F4 for how that was actually compared. |
| A6 | PASS | #2 `blockedBy.nodes` = `[1]`, written by `create`'s second call. |
| A7 | PASS | #3 `blockedBy.nodes` = `[1]`. Database id was `5508320896`, not `3`. |
| A8 | PASS | #4 carries `## Related` in the body with `blockedBy.nodes` empty. |
| A9 | PASS | frontier `[1]`, #2 excluded on its open blocker, `rows: 2`. |
| A10 | PASS | frontier `[2]` after #1 closed. Hand check: #2 `totalCount: 1` with `node_states: ["CLOSED"]`. |
| A11 | PASS | Claim on #2 carrying `bug` and `duplicate` succeeded: `["bug","duplicate","in-progress"]`, one assignee. |
| A12 | PASS | #5 with `ready`+`in-progress` absent from `next`, `list ready` and `list backlog`, reported `inconsistent: [5]` by all three, both labels named by `show`. |
| A13 | PASS | `move 5 ready` with removal list `in-progress` left exactly `["ready"]`. |
| A14 | PASS | `move 2 in-progress` on a ticket already there kept `["bug","duplicate","in-progress"]`. |
| A15 | PASS | #2 `CLOSED`/`COMPLETED`, no status label, `bug` and `duplicate` retained. |
| A16 | PASS | #7 `stateReason: DUPLICATE`. |
| A17 | PASS | Pre-read saw `CLOSED`/`DUPLICATE` and refused. Probe confirms why it is the only guard: `gh issue close 7 --reason completed` on the closed issue printed "is already closed", exited 0, and left `DUPLICATE` in place. |
| A18 | PASS | #6 reads `backlog`, present in `list backlog`, absent from `next`. See deviation D-2. |
| A19 | PASS | #1 reopened reads `backlog`. Note `stateReason` became `REOPENED`, finding F6. |
| A20 | PASS | #5 claimed then moved to `backlog`: assignees `[]`. |
| A21 | PASS | #8 closed while still carrying `ready` appeared in neither `list ready` nor `next`. |
| A22 | PASS | `runbook note` present on #3 exactly once. |
| A23 | FAIL | `list ready M1` returned only `[3]` correctly, but `--milestone no-such-milestone` returned `[]` at exit 0. Finding F1. |
| A24 | SKIP | [MANUAL] |
| A25 | SKIP | [MANUAL] |

Deviations from the runbook as written, neither of which changes a verdict:

- **D-1.** A1's `git init` offer was presented in the same picker as Sections A, B and C rather than
  before them. This is the cause of the A2 failure and is finding F3.
- **D-2.** A18 says to create the issue in the web UI. It was created with `gh issue create` and no
  label instead. The stored record is identical, so the case still tests what it exists to test:
  how the skill reads a ticket nobody labelled.

Cases the run strengthened rather than merely passed:

- **A10 is the case that earns the frontier's design.** `blockedBy.totalCount` stayed at `1` after
  the blocker was closed, with the node reading `CLOSED`. A `totalCount == 0` filter would hold #2
  off the frontier permanently. This is the behaviour `github.md` records, reproduced.
- **A14's hazard is live.** Running the wrong form, `--remove-label ready --add-label ready`, on a
  `ready` ticket stripped the label in **4 of 5 trials**, all at exit 0. See finding F5.

## Findings

Numbered, newest run first. A finding is a defect in a skill file unless it says otherwise.

**F1. `github.md`: `list <status> <milestone>` cannot stop on an unknown milestone. (A23, real defect.)**
`gh issue list --milestone no-such-milestone` exits 0 with `[]` on stdout and nothing on stderr,
verified against `gh` 2.97.0 with only `M1` existing. `github.md` says only "Add `--milestone
<title>` to scope" and gives the skill nothing to validate the name against, so the skill cannot
produce the stop the runbook asks for. The user who typos a milestone gets a confident "no tickets"
rather than an error, which is the wrong answer shaped like a right one.
This is asymmetric across backends, which is what makes it a defect rather than a missing feature:
`linear.md` states the rule outright, that "a milestone name that matches nothing in the project is
a stop, not a silently unscoped list", while `github.md` is silent. The same verb gives a stop on
Linear and a silent empty list on GitHub.
Note the GitHub failure mode is quieter than the one Linear's rule guards against. It is not an
unscoped list; it is an empty one, so a caller cannot notice it by seeing too much.
Fix: resolve the name before querying and stop when it matches nothing.

**Fixed in 0.0.10**, and the fix is larger than the finding was. Resolving the title against
`repos/<owner>/<repo>/milestones` alone would have been wrong twice over. That endpoint returns open
milestones by default, so `?state=all` is required or a closed milestone reads as a name that does
not exist. And `gh issue list --milestone <title>` returns `[]` at exit 0 for a **closed** milestone
that has tickets, while `--milestone <its number>` returns them, so the title is resolved to a
number and the number is what the query gets. All three behaviours measured against `gh` 2.97.0 on
`wilsonkichoi/tracker-gh`. `github.md` now carries the resolve-then-query rule, `SKILL.md` states
the stop as a cross-backend guarantee, and `local.md` says what the milestone set is where there is
no registry. Runbook: A23 tightened, A23b and B14 added.

```
gh api 'repos/<owner>/<repo>/milestones?state=all' --jq '.[] | select(.title == "<title>") | .number'
```

**F2. `setup`: the GitHub prerequisites were resolved after Sections B, C and D. (A2.)**
0.0.9 records this as fixed by moving the checks into Section A. On this run the remote question was
asked in a second round, after the context file, the product-doc paths and the test command had been
answered. The mechanical check passes, since `git remote -v` names the remote and the config records
`wilsonkichoi/tracker-gh` rather than an intention, but the behaviour the case exists to catch
happened: three sections were answered without knowing whether `github` would work.
Cause is F3 rather than a lost fix in `SKILL.md`. **Fixed in 0.0.10** by way of F3.

**F3. `setup/SKILL.md`: "one section, one answer" and "use the harness's own picker" conflict where the picker is multi-question.**
Step 2 says to take the sections in order, "One section, one answer, then the next", and also to use
the harness's own picker where it has one. Claude Code's picker accepts up to four questions in a
single call, so the two instructions pull in opposite directions, and resolving it by batching is
what produced F2. Codex, which the runbook is written for, has no picker, so the conflict cannot
appear there and the file reads as consistent.
Fix: say what a multi-question picker may batch. Section A's prerequisites have to be resolved
before any later section is presented, whether or not the harness could show them together.

**Fixed in 0.0.10.** Step 2 now says a multi-question picker is a way to ask one section faster and
never a way to put Sections A to D on screen together, and that only questions from the same section
whose answers cannot change each other may share a call. Step 1 says the same for the `git init`
offer, which D-1 shows was batched with the interview. Runbook: D5 added to test it directly.

**F4. `github.md`: `create`'s verification asks for a body comparison and names no method, and both obvious methods are wrong.**
The file says "The body must match what you sent". Measured against a 642-byte body on #1:

| Method | Bytes | Verdict |
|---|---|---|
| the file that was sent | 642 | truth |
| `--json body --jq .body` per the API | 642 | correct |
| `gh issue view --json body --jq .body > file` | 643 | appends a newline |
| `printf '%s' "$(gh issue view ... --jq .body)"` | 641 | command substitution strips the trailing newline |

A `diff` of the sent file against either redirect reports a difference on a byte-identical body, so
a correct `create` scores FAIL. This run hit it and had to rule it out by hand. Runbook case A5 has
the same gap, since "Expect the body as sent" names no method either.
Fix, exact in both directions, verified `true`/exit 0 on the real body and `false`/exit 1 on a
tampered one:

```
gh issue view <n> --repo <owner/repo> --json body | jq --rawfile sent <file> -e '.body == $sent'
```

**Fixed in 0.0.10** in both places: `github.md` gives the command under `create`'s verification, and
runbook case A5 gives it as the check with the two wrong methods named.

**F5. `github.md`: the overlapping-label hazard is a race, and the file implies it is deterministic. (Low severity, documentation.)**
The file records that `--remove-label ready --add-label ready` "stripped the label in eight runs out
of eight". Measured here on `gh` 2.97.0: 4 of 5 trials stripped it, one kept it, every trial exit 0.
The rule is correct and unchanged; only the characterisation is off. It matters because someone
verifying a fix with a single trial has a 1-in-5 chance of concluding the overlapping form is safe.
Fix: call it a race with no ordering guarantee, which is what the `editable_http.go` reasoning
already says, rather than quoting a count that reads as deterministic.

**Fixed in 0.0.10.** `github.md` now names it a race, keeps both measurements, 8 of 8 and 4 of 5,
and says a single trial can read as safe.

**F6. `github.md`: `stateReason: REOPENED` is undocumented. (Low severity, documentation.)**
The status table covers `COMPLETED`, `NOT_PLANNED` and `DUPLICATE`, and the reading rules say
"closed: read `stateReason`". A reopened issue is `OPEN` with `stateReason: REOPENED`, observed on
#1. Harmless as the file is written, because an open issue resolves through its labels, but the
value is real and unnamed, so anything that switched on `stateReason` without checking `state` first
would misread a reopened ticket as terminal. A19 is exactly the path that produces it.
Fix: name `REOPENED` where the other three are named, and say that `state` is read first.

**Fixed in 0.0.10.** The reading rules in `github.md` open with "read `state` first", name
`REOPENED` on the open path, and list the three closed reasons where the rule says to read
`stateReason`.

### Not a defect

The `jq` precedence error hit during this run was in an ad-hoc debug field this session invented,
`body_sha: (.body | @base64d? // .body | tostring | length)`, and not in anything a skill file
prescribes. `//` binds tighter than `|`, so it parses as `.body | (@base64d? // .body) | ...`; the
input to that group is already the body string, `@base64d?` fails and is suppressed, `//` falls
through to `.body`, and indexing a string errors with `Cannot index string with string "body"`. The
`@base64d` was meaningless there in the first place, since an issue body is not base64.
`github.md` prescribes no such construct. Its only mention of either operator instructs the reader
not to use them, in the note that the frontier's `error()` must never be patched with `?` or
`// []`. The shared status prelude uses neither. No fix needed.
