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

**A5 create writes the ticket.** `$tracker create` with ticket A.
Check: `gh issue view <A> --repo <R> --json title,body,labels`
Expect the body as sent and no status label, since `create` defaults to `backlog`.

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
unknown status. Then `$tracker list ready no-such-milestone`: expect a stop, not the whole `ready`
list unscoped.

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
Expect a native option picker where the harness has one, and a numbered list where it does not, so
the answer is never a word the user has to spell. A harness with no picker that still prints bare
prose options is a FAIL against the skill, not against the harness.

**D5 the question ends the turn.** Watch the harness while Section A is on screen.
Expect it to be idle and waiting, so the answer is typed straight in. Codex showing `Working` or
`Queued follow-up inputs ... ⌥ + ↑ to answer` is a FAIL: the skill asked and then kept going, and
the reply is now behind a keystroke the user has to discover.
