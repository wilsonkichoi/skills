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

**A test input is never an example in the skill files.** When `SKILL.md` or a backend file uses
the exact argument a case sends as an example, a pass shows the model matched the example, not that
it applied the rule. Before a run, check with `grep -rnw -- '<input>' skills/tracker/`, and pick
another input when a hit is an example. Ordinary prose, such as "a ticket in review", is not one.
Repeated cases rotate their input for the same reason.

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

**Invoking the skill during a run.** Every skill here carries `disable-model-invocation: true`, so
no harness invokes one on its own and each `$tracker ...` has to be typed. That is the shipped
behaviour, not a defect, and a leading space is enough to stop a slash command firing, so check that
an invocation actually fired before scoring what came back.

Check that it fired the right skill, too. A harness can list a same-named skill from a plugin or a
global install beside this project's own: Codex offered `$dev:setup` from the `dev@agent-toolkit`
plugin next to the project's `$setup`, and picking it wrote another tool's layout. Invoke the
project's install. In Codex, that is the entry whose path is under the scratch directory's
`.agents/skills/`. A run that fired any other skill is void, not scored: record it as a deviation,
and start again in a fresh directory.

For a leg that would otherwise be hundreds of hand-typed commands, delete that one line from the
**installed** `SKILL.md` and restart the harness. Then say so in the report as a deviation, and say
from which case onward, because the file under test now differs from the commit by that line. It
changes no verb, and it is still not nothing. Restore it or reinstall before the run ends, and never
edit the source tree to get it.

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

S4 and S5 run here, straight after the install and before any `$setup`, because they need a
directory with no config that setup wrote. The check is on disk, never the reply: the failure they
exist for is a skill that writes tickets somewhere no verb can read and reports success.

**S4 no config is a stop.** In the install directory, with no `docs/dev-agents/config.md`, run
`$tracker list`, then `$tracker create Probe`.
Expect each reply to say there is no config and to name `$setup`.
Check: this prints nothing.

```
find . -mindepth 1 \( -path ./.agents -o -path ./.claude -o -path ./.kiro \) -prune -o -newer skills-lock.json -print
```

Any line is a FAIL, whatever it is: a `docs/`, a `.dev/`, a ticket file, or any other new file or
directory. `ls -A` shows only `.agents`, `.claude`, `.kiro`, and `skills-lock.json`.

**S5 an unknown backend is a stop.** Write a config naming a backend the skill does not have:

```
mkdir -p docs/dev-agents && printf -- '---\nissue_tracker: jira\n---\n' > docs/dev-agents/config.md && cksum docs/dev-agents/config.md
```

Run `$tracker list`, then `$tracker create Probe`.
Expect each reply to name `jira` as not a backend it knows and to name `$setup`.
Check: this prints nothing, and `cksum docs/dev-agents/config.md` matches the value printed above.

```
find . -mindepth 1 \( -path ./.agents -o -path ./.claude -o -path ./.kiro \) -prune -o -newer docs/dev-agents/config.md -print
```

Then remove it, before any leg runs `$setup`. Setup keeps the choices an existing config already
made, so a leftover `jira` config would change what the leg tests.

```
rm -rf docs
```

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

**A11 topic labels do not block a pull, including one named after a status.**
`gh issue edit <B> --repo <R> --add-label bug --add-label duplicate`, then `$tracker assign <B>`.
Check: `gh issue view <B> --repo <R> --json assignees,labels`
Expect `bug`, `duplicate`, and `in-progress`, one assignee, you. A refusal means the pre-read counts
topic labels as status labels. `duplicate` is the sharp half: it is a GitHub default label and it
shares a name with one of the seven statuses, but only the four open statuses are labels at all, so
it has to read as an ordinary topic label and survive every write untouched.

**A12 multi-status issue never reaches a result, and all three verbs agree.**
`gh issue create --repo <R> --title "two statuses" --body x --label ready --label in-progress`
then `$tracker next`, `$tracker list ready`, `$tracker list backlog`, `$tracker list` with no
status, and `$tracker show <that id>`.
Expect the issue in none of the four result sets, named as inconsistent by all five verbs, and both
labels named by `show`. The unfiltered `list` is its own branch of the query: before 0.0.26 it put
the issue in both `tickets` and `inconsistent`. A verb that reports it as `ready`, as `backlog`, or not at all is a FAIL:
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

**A17b a bad status name is refused.** On an open `backlog` issue, `$tracker move <id> in reviewww`.
Expect a refusal that lists the seven statuses, and `gh issue view <id> --json labels` unchanged.
Then `$tracker move <id> in progress`: expect exactly one status label, `in-progress`.

**A17c a status is only read from a status position.** Create milestones `M1` and `in reviewww`
with `gh api repos/<R>/milestones -f title=...`, and put one open issue in each. Then:

1. `$tracker create "Fix in review"`: expect title `Fix in review`, no status label.
2. `$tracker create "Fix" "in review"`: expect title `Fix`, status label `in-review`.
3. `$tracker create Fix in review`: expect a question asking whether `in review` is the status or
   part of the title, and no new issue until it is answered. Check with
   `gh issue list --repo <R> --state all --limit 200 --json number,title`. Run this step at least
   three times with different first words, ending in turn in `in review` and `in progress`, and pass
   it only if every run asks. Across 0.0.26 to
   0.0.28 it asked in 3 of 5 runs. Check the transcript too: the first assistant message, before
   any tool call, is the parse line from `SKILL.md` section 3, ending in `asking`.
4. `$tracker create "Fix" done`: expect a refusal and no new issue. `create` takes open statuses only.
5. `$tracker list M1`, `$tracker list "in reviewww"`: expect each milestone's issue, scoped. The
   second is a milestone, not a refused status.
6. `$tracker list no-such-thing`: expect a stop naming both the milestones and the seven statuses.
7. `$tracker list "in progress" M1`: expect both filters applied, with the milestone text unchanged.

Never score a quoted retry as a PASS for the unquoted call in step 3.

**A18 human-made ticket reads as backlog.** Create an issue in the web UI, no label, one-line body.
`$tracker show <id>` expect `backlog`; `$tracker next` expect it absent; `$tracker list backlog`
expect it present.

**A19 reopened ticket reads as backlog.** Reopen a closed issue in the web UI.
`$tracker show <id>` expect `backlog`.

**A20 backing off clears the assignee.** `$tracker assign <some ready ticket>`, then
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

**A23b a closed milestone is not an unknown milestone.** `gh api repos/<R>/milestones -f title=M2`,
put another `ready` ticket in it with `gh issue edit <id> --repo <R> --milestone M2`, close the
milestone with `gh api --method PATCH repos/<R>/milestones/<its number> -f state=closed`, then
`$tracker list ready M2`.
Expect that ticket. A stop is the FAIL this case exists for, and it is a resolver bug rather than a
query bug: `gh api repos/<R>/milestones` returns open milestones only, so without `?state=all` the
skill reports a milestone that is right there, holding tickets, as a name nothing matches. Confirm
the trap is armed before scoring: `gh api repos/<R>/milestones --jq '[.[].title]'` must omit `M2`
while `gh api 'repos/<R>/milestones?state=all' --jq '[.[].title]'` lists it.

**A24 [MANUAL] the tie-break, which is the only case that proves it.** Two accounts, both with push
access to `<R>`, one `ready` unassigned ticket, and `$tracker assign <id>` run in two terminals
close enough together that both pre-reads land before either write.

```
# terminal 1, as account A          # terminal 2, as account B
GH_TOKEN=<A> $tracker assign <id>   GH_TOKEN=<B> $tracker assign <id>
```

Expect both sessions to name the same winner, the login that sorts first case-insensitively, and:
- `gh issue view <id> --repo <R> --json assignees --jq '[.assignees[].login]'` holds exactly the
  winner.
- `[.labels[].name]` holds `in-progress` and the loser did not strip it.
- The loser's report says it lost and wrote nothing further.

Two accounts is the requirement, not two terminals. Two sessions on one account cannot fire the
tie-break at all: `assignees` holds one login and each session reads it as its own, which is the
documented blind spot rather than a defect to find here. A run with one account is SKIP.

**A25 [MANUAL] host without issue dependencies.** Run `$tracker next` against a GitHub Enterprise
host that does not expose `blockedBy`. Expect a loud stop, never an empty frontier. Needs such a
host.

**A26 a write is visible to the very next read.** `$tracker move <a backlog ticket> ready`, then
`$tracker next` **once**. Expect that ticket in the frontier on the first attempt, with no retry and
no pause. Then `gh issue edit <it> --repo <R> --milestone M1` and `$tracker list ready M1` once, and
expect it there too.
This is the case that catches a verb reading GitHub's search index instead of the primary store.
Measured by hand against `gh` 2.97.0: an issue created with `--label ready` was in the unfiltered
`gh issue list --state open` on 3 of 3 trials immediately and missing from `gh issue list --label
ready` on all 3, and one trial later that index was still two tickets behind.
**A retry is a FAIL here, not a PASS.** Scoring this on a second read hides the exact defect the case
exists to find, and an empty frontier reported to a user is indistinguishable from a real one.

**A27 assigning someone the repository will not take is a stop, not a success.**
`$tracker assign <some open ticket> octocat`, using any real GitHub account that is not a
collaborator on `<R>`.
Check: `gh issue view <it> --repo <R> --json assignees --jq '[.assignees[].login]'`
Expect `[]`, and expect the skill to say the assignment did not land. Measured on `gh` 2.97.0:
`gh issue edit --add-assignee <a real user without push access>` prints the issue URL, **exits 0**,
and assigns nobody, while a login that does not exist at all exits 1 with `Could not resolve to a
user or bot with the login`. The silent one is the ordinary mistake, a teammate nobody added to the
repository, so a run that reports success here is the FAIL this case exists for.

**A28 a holder the caller did not name is a refusal.** `gh issue edit <it> --repo <R>
--add-assignee @me`, then `$tracker assign <it> none from someone-who-is-not-you`.
Expect a refusal naming the actual holder, and `[.assignees[].login]` unchanged. Then
`$tracker assign <it> none`, which is the bare form on your own assignment, and expect `[]`.
The `from` argument is checked against the read, so a wrong name is a stop whether the caller
guessed, or the ticket changed hands since they looked. The other half of this case, a real holder
who is not you, is **[MANUAL]** and needs a second collaborator.

**A29 move to ready clears every assignee.** `$tracker assign <a ready ticket>`, which puts it at
`in-progress` with you on it, then `$tracker move <it> ready`, then `$tracker next`.
Check: `gh issue view <it> --repo <R> --json assignees,labels`
Expect `assignees: []`, exactly one label `ready`, and the ticket present in the frontier. A ticket
left `ready` with an assignee is the bug this case exists for: `next` filters on `ready` **and** no
assignee, so it is off the frontier and off that person's queue at once, and nothing in `list` looks
wrong.

**A30 show reports a ticket whether or not it has comments.** `$tracker show <a ticket with no
comments>`, then `$tracker comment <it> "show probe"`, then `$tracker show <it>` again.
Expect the number, title, body, state, labels and blockers both times, no comments the first time
and exactly one the second, with its author. Silence, or a report that the ticket could not be read,
is the FAIL: `gh issue view <n> --comments` prints **nothing at all at exit 0** on a ticket with no
comments, because the flag replaces the issue with its comments rather than adding them. The
`--json ...,comments` field returns `[]` instead, which is why `show` is one call and not two.

**A29b reserving a ticket is not the same as losing it.** `$tracker assign <a ready ticket> <who>`,
where `<who>` may be **your own login**, then `$tracker next`, `$tracker list ready` and
`$tracker show <it>`.
Expect the ticket absent from the frontier, present in `list ready`, still `ready` rather than
`in-progress`, and named with its holder by `show`. A reserved ticket leaving the frontier is
intended behaviour and not the A29 bug: the difference is that somebody put the name there on
purpose. What this case discriminates is the **verb form**, not the identity, so the caller's own
login exercises all of it: a fix that overreached and cleared the name would fail this exactly the
same way. Whatever name you use has to have push access, or A27 happens instead and you score an
empty `assignees` as the reservation failing.

**A29c [MANUAL] reserving for somebody else.** The same case with `<who>` a second collaborator.
Expect the assignment to land, `show` to name them, and `$tracker assign <it> me` to refuse until it
names them with `from`. When it lands, the label must still be `ready`: taking a ticket from its
holder is a handover, and only the bare form sets `in-progress`. This is the half a one-account machine cannot reach, and it is the same
missing identity that keeps A24 and half of A28 unrunnable: without it, nothing proves an assignment
lands for anybody but the caller, and A27 shows that is not academic, since a login without push
access is dropped at exit 0.

**A31 link refuses a cycle, and one GitHub would accept.** Create three `backlog` tickets X, Y, Z.
`$tracker link <Y> blocked-by <X>`, then `$tracker link <Z> blocked-by <Y>`, then
`$tracker link <X> blocked-by <Z>`, which would close X → Z → Y → X. Then
`$tracker link <X> blocked-by <X>`.
Expect the first two to land, and the last two to refuse: the third naming the path, the fourth
naming a self-link.
Check: `gh issue view <X> --repo <R> --json blockedBy --jq '[.blockedBy.nodes[].number]'` returns
`[]`. GitHub itself accepts the third edge, so an `[<Z>]` here means the skill left the check to
the backend. The refusal must come from the skill: `gh` would print a 422 for the self-link, and a
reply that relays that error has not run the check.

**A32 an empty frontier says why.** This case needs a frontier with nothing on it, so run it after
every other A case. For each ticket `$tracker next` returns, `gh issue edit <n> --repo <R>
--remove-label ready` until it returns nothing. Then build three held tickets with `gh`, not the
skill:

```
gh issue create --repo <R> --title "A32 P" --body "held by Q" --label ready
gh issue create --repo <R> --title "A32 Q" --body "in review" --label in-review
gh issue create --repo <R> --title "A32 R" --body "reserved" --label ready --assignee @me
gh issue create --repo <R> --title "A32 S" --body "in a cycle" --label ready
gh issue create --repo <R> --title "A32 T" --body "in a cycle"
gh issue create --repo <R> --title "A32 U" --body "in a cycle"
```

Make P blocked by Q, and S blocked by T, T by U, U by S, with the `gh api` pair from `github.md`'s
`link` section for each edge. GitHub accepts that three-issue cycle. Then `$tracker next`.
Check first that the fixture is what it claims: the `next` query from `github.md`, run by hand,
returns `frontier: []`, and `held` lists P, R, and S.
Expect the reply to say the frontier is empty and to name all three: P with Q as its open blocker,
at `in-review`; R as reserved for your login; S with the cycle as a path through S, T, and U.
A reply that says only that the frontier is empty is a FAIL, and so is one that misses the cycle.

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
Check the filename too: ticket A lands at `001-ticket-a.md`. B3 is where the slug rule is actually
stressed, so the full check lives there.

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

**Check all ten filenames against the slug rule**, which these titles are what stress. The rule:
lowercase the title, collapse every run of non-alphanumeric characters to one hyphen, no leading or
trailing hyphen, cut at roughly 50 characters on a word boundary, where alphanumeric means a Unicode
letter or digit. So:

```
It's got an apostrophe            003-it-s-got-an-apostrophe.md
émoji ✅ and 日本語 and Ünïcödé      010-émoji-and-日本語-and-ünïcödé.md
```

The emoji and the CJK are the interesting half: an implementation reading alphanumeric as `[a-z0-9]`
gives `010--and--and-.md` for the same ticket. Nothing reads the slug, so a wrong one changes no
other verdict, which is exactly why it needs a check: two runs of this leg produced different
filenames for these same ten titles and neither noticed, which is F16.

**B4 edges live in the frontmatter.** `$tracker create` ticket B naming A under `## Blocked by`,
with `ready` as the status.
Check the file: `blocked_by` holds A's id, `status` is `'ready'`, and the `## Blocked by` body
section matches. Check the transcript: one write created the file with both `status` and
`blocked_by`, not a `backlog` write followed by a promotion. Local is the one backend `SKILL.md`
lets write both together.

**B5 Related has no frontmatter field.** `$tracker create` ticket F with a `## Related` section
naming A and **no `## Blocked by` section at all**, not an empty one.
Check the file: the `## Related` section is in the body, `blocked_by` is empty, and no `related`
key was invented in the frontmatter. Nothing computes on `## Related`, so anything that parsed it
into state is a FAIL. Record whether the written file has a `## Blocked by` heading; `create` is
not expected to invent an empty one, and B6 depends on knowing which it did.

**B6 link keeps the body in step.** Two files, chosen so neither branch depends on what `create`
does with an empty heading. Hand-write both before linking:

```
docs/dev-agents/issues/015-has-section.md    with a `## Blocked by` heading and nothing under it
docs/dev-agents/issues/016-no-section.md     with no `## Blocked by` heading at all
```

`$tracker link 15 blocked-by <A>`: expect `blocked_by` to hold A's id **and** the heading to list
it, since this file has one.
`$tracker link 16 blocked-by <A>`: expect `blocked_by` to hold A's id and the body to come back
byte-identical, since this file has none.
That is the whole rule `local.md` states, both branches, and neither needs a fixture repaired
mid-case. Do not repair a fixture to make a branch runnable: if a file does not have the shape the
branch needs, the case is wrong and that is the finding.

**B7 frontier.** `$tracker move <A> ready`, `$tracker move <B> ready`, `$tracker next`.
Expect A only, **on the first read**, with no retry and no pause. The rule A26 exists for on GitHub
applies everywhere: a ticket made `ready` a moment ago is exactly the ticket `next` is being asked
about. Files have no index to lag, so a first read that misses A is a defect in this skill rather
than in a backend.

**B8 the bare assign resolves an identity.** `$tracker assign <A>`.
Check the file: `status: 'in-progress'` and `assignee` equal to `git config user.name`. An empty
assignee is a FAIL; the skill should have stopped and said the identity was unresolvable.

**B9 terminal releases the frontier.** `$tracker move <A> done`, then `$tracker next`. Expect B.

**B9b a bad status name is refused.** On a `backlog` ticket, `$tracker move <id> in reviewww`.
Expect a refusal that lists the seven statuses and the file's SHA-256 unchanged. Then
`$tracker move <id> in progress`: expect the YAML parse to read `status: 'in-progress'`. Then
`$tracker create Fix in review`: expect a question about whether `in review` is the status, and no
new file until it is answered.

**B10 comment.** `$tracker comment <B> "a note"`. Check the file: the body is under `## Comments`
with a `### <date> <author>` heading.

**B11 the tracker never commits.** This one needs a committed baseline, or it cannot fail, and the
baseline has to include the ticket files. Setup's step 7 commit happens back at B1, before any
ticket exists, so it is not enough on its own: take that offer when it comes, and then commit the
tickets B2 to B10 created as a second commit. Both commits are part of the case, not deviations.

```
git add docs/dev-agents/issues && git commit -m "baseline"
git log --oneline | wc -l
```

Then run one mutating verb, `$tracker comment <B> "commit probe"`, and check:

```
git log --oneline | wc -l
git status --porcelain -uall -- docs/dev-agents/issues/
```

Use `<B>`, which is `ready` and live at this point. A is `done` by now, and while commenting on a
terminal ticket is legal, this case is about git and does not need the question.

Expect the commit count unchanged by the verb, and that ticket file listed as ` M` modified. The
pathspec is what keeps the installer's own untracked files, `.agents/`, `.claude/`, `.kiro/` and
`skills-lock.json`, out of the answer; do not reach for `.git/info/exclude` to hide them, because
editing the repository under test to make a check readable is how a check stops meaning anything.
`-uall` is not optional either: plain `--porcelain` collapses untracked files into a single
directory line.

Run against a repository whose ticket files were never committed, this case passes whatever the
skill does, because `??` is what an untracked file shows either way. A clean tree after the verb, or
a new commit, is the FAIL.

**B12 hand-written file.** `printf '# just a title\n\nsome prose\n' > docs/dev-agents/issues/099-hand.md`
then `$tracker show 99`. Expect `backlog` rather than an error.
Then `$tracker move 99 ready` and check the file gained a frontmatter block carrying only the fields
that verb sets, with the prose untouched.

**B12b a partial block is read field by field.** Hand-write a file whose frontmatter is real but
incomplete, omitting the two fields B12 cannot reach:

```
docs/dev-agents/issues/098-partial.md
---
id: '098'
title: 'Partial frontmatter'
milestone: 'M1'
---

## Notes
No status and no assignee in the block above.
```

`$tracker show 98`: expect `backlog` and unassigned, from the absence of those keys rather than an
error. `$tracker next` after `$tracker move 98 ready`: expect it on the frontier, which it can only
reach if the missing `assignee` read as nobody. Then `$tracker assign 98 someone`: expect the file
to gain `assignee` and keep `milestone`, with `id` and `title` untouched.
`local.md` gives each missing field its default and reads the fields that are present as written. B12 proves the filename fallback for a missing `id`, and
this is the half B12 cannot reach, because a file with no frontmatter at all exercises the defaults
by a different route.

**B13 id forms are interchangeable.** `$tracker show 99`, `$tracker show 099`, `$tracker show '#99'`.
Expect the same ticket three times.

**B14 an unknown milestone is a stop here too.** Give one ticket `milestone: 'M1'`, then
`$tracker list ready M1` and `$tracker list ready no-such-milestone`.
Expect the ticket from the first, and a stop naming `M1` from the second. There is no milestone
registry in this backend, so the set of milestones is whatever the files carry; an empty list for a
name nothing carries is the same wrong answer GitHub gives, in a place where the whole set was
already read.

**B15 the explicit assign forms, and reservation.** Use a ticket that is `ready` and unassigned
**right now**, which by this point in the leg is #099 after B12, not A: B9 moved A to `done` and the
terminal rule correctly refuses to bring it back. Call it `<R>`.

Run `$tracker assign <R> some-colleague`, then `$tracker next` and `$tracker list ready`.
Check the file: `assignee: 'some-colleague'` with `status: 'ready'` unchanged, since only the bare
form moves the status. Expect `<R>` absent from the frontier and present in `list ready`. That is the
reservation, the one case where `ready` and an assignee belong together, and it is what makes B16's
clear-on-handback a separate rule rather than a contradiction.

Then `$tracker assign <R> me from wrong-name`: expect a refusal and the file unchanged, byte for
byte. Then `$tracker assign <R> me from some-colleague`: expect `assignee` holding
`git config user.name` and `status` still `ready`.

There is no account to check a name against on this backend, so a name is written as given. That is
documented behaviour and not a finding, and it is why A27 has no counterpart here: nothing can
silently drop a name that no directory validates.

**B16 move to ready clears the assignee here too.** `$tracker assign <B>`, then
`$tracker move <B> ready`, then `$tracker next`.
Check the file: `assignee: ''` and `status: 'ready'`, with B back in the frontier.

**B17 show reports a ticket that has no comments.** Take a ticket with no `## Comments` section and
run `$tracker show` on it, then `$tracker comment <it> "show probe"`, then `$tracker show <it>` again.
Expect the whole ticket both times, with no comments the first time and one the second. This is F9's
shape on a backend that cannot have F9's cause: there is no flag here that replaces the ticket with
its comments, so an empty or truncated report would be the skill inventing the problem rather than
inheriting it.

**B18 a body containing `---` is still one ticket.** Create a ticket whose body carries a horizontal
rule and a pasted block that looks like frontmatter:

```markdown
## Notes
Before.

---

status: 'done'
id: '999'

---

After.
```

Then `$tracker show <it>` and `$tracker list backlog`.
Expect the ticket's real `id` and `status`, the body intact including both `---` lines and the text
between them, and no sign that `status: 'done'` was read as state. The frontmatter is the block
between the **first** `---` and the next one, and everything after is body that is never parsed. A
reader that splits on every `---`, or that takes the last block, either errors on an ordinary ticket
or reads somebody's pasted YAML as the ticket's state. This is the same class as B3: the values that
break are the ones that look harmless.

**B19 link refuses a cycle.** Create three `backlog` tickets X, Y, Z.
`$tracker link <Y> blocked-by <X>`, then `$tracker link <Z> blocked-by <Y>`, then
`$tracker link <X> blocked-by <Z>`, then `$tracker link <X> blocked-by <X>`.
Expect the first two to land, the third to refuse naming the path X → Z → Y → X, and the fourth to
refuse as a self-link.
Check with the B2 parser, not by eye: X's `blocked_by` is still empty, Y's is exactly X's id, and
Z's is exactly Y's id.

**B20 an empty frontier says why.** Run it after every other B case. Move every ticket
`$tracker next` returns to `backlog` by editing its `status`, until it returns nothing. Then write
six files by hand, since the skill will not write the cycle:

```
010-p.md  status: 'ready'        blocked_by: ['011']
011-q.md  status: 'in-review'    blocked_by: []
012-r.md  status: 'ready'        assignee: 'someone-else'
013-s.md  status: 'ready'        blocked_by: ['014']
014-t.md  status: 'backlog'      blocked_by: ['015']
015-u.md  status: 'backlog'      blocked_by: ['013']
```

Each file gets the full frontmatter shape from `local.md`, with every value single-quoted, and the
ids renumbered past the highest id already in the directory. Then `$tracker next`.
Expect the reply to say the frontier is empty and to name P held by Q at `in-review`, R reserved
for `someone-else`, and S with the cycle through S, T, and U as a path.
Check: no file changed, compared with `cksum` before and after, since `next` only reads. A reply
that says only that the frontier is empty is a FAIL, and so is one that misses the cycle.

---

## C. Linear backend

Needs the Linear MCP server connected and a scratch team. Read-only cases can run against any team
you have access to; the cases that add or remove a status need Linear's settings UI, so they are
`[MANUAL]`.

The read and write paths in `linear.md` have all been executed against a live workspace, so a
failure here is a regression rather than an expected gap. The one path still unproven is the
assignment race, which needs two identities and is marked in the case list.

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

**C6 a bad status name is refused, never guessed.** On a `Backlog` issue, `$tracker move <id> in reviewww`.
Expect a refusal that lists the seven statuses and suggests none of them, and `get_issue` still
reading `Backlog`. Moving it to `In Review` is a FAIL: the skill guessed a near miss. So is a
refusal that names `in-review` as what was meant. Then `$tracker move <id> in progress`:
expect `get_issue` to read `In Progress`, since a status argument matches case-insensitively with a
space read as a hyphen. Run the case at least three times, each on a fresh issue and with a different
near miss in place of `in reviewww`: `in-progres`, `donee`, `backlogg`, `in_review`. Pass it only
if every run passes. Check the transcript of each bad-status call: the first assistant message,
before any tool call, is the parse line from `SKILL.md` section 3, ending in `refusing`, and no
tool call follows it. The 0.0.26 run found a model that skips the refusal on one pass, so one pass proves
little.

**C7 the frontier reads blocker statuses.** Create A and B with B blocked by A, both `Todo` and
unassigned. `$tracker next`.
Expect A and not B. Then move A to `Done` and re-run: expect B.
A relation carries only the blocker's id and title, so a frontier that never fetched A's status
cannot have filtered correctly, even if the answer looks right on one sample.

**C8 relations are native.** `$tracker link <B> blocked-by <A>`, then `get_issue` on B with
`includeRelations: true`.
Expect the edge under `relations.blockedBy`.

**C9 the duplicate transition moves relations onto the original.** Create an original O, and a
ticket X with `relatedTo` R, `blockedBy` B, and `blocks` D. Confirm with `get_issue`, then
`$tracker move <X> duplicate <O>` and read X, O, and D again with `includeRelations: true`.
Expect X at `Duplicate` rather than `Canceled`, `duplicateOf` O, and no relations left on X. Expect O
to carry `relatedTo` R, `blockedBy` B, and `blocks` D. Linear moves them with no mention in the
response. Expect the skill to have named all three before the write, to have said that B now blocks
O, and to have made no call with `state`. A reply that calls the relations lost, or reports a clean
move, is a FAIL: it did not read the original afterwards.

Then the dropped edge. Create M blocked by O, and Y blocked by M. `$tracker move <Y> duplicate <O>`
cannot move `blockedBy` M onto O, because O already blocks M. Expect the skill to name that edge as
dropped before the write, and the move to go ahead. Afterwards O is still not blocked by M.

Then the refusal half. Create N blocked by O, P blocked by N, and Z blocked by P.
`$tracker move <Z> duplicate <O>` would make O blocked by P, closing O → P → N → O, and O has no
relation with P for Linear to drop it on. Expect a refusal naming that path, Z still at its old
status, and O still not blocked by P. Linear writes long cycles, so this refusal is the skill's own.

**C10 milestone scoping.** `$tracker list ready "<milestone name>"`.
Expect only that milestone's issues. Then pass a milestone name that does not exist: expect a stop,
not the whole project unscoped.
Then the A23b question in Linear form: `list_milestones` takes only `project` and has no state or
archived filter, so check whether a completed milestone, or one in an archived project, still comes
back from it while its issues are still there. A milestone the resolver cannot see is reported as a
name that does not exist, which stops the caller over a milestone that is real. A completed milestone is
still returned (see the evidence section); a milestone in an archived project is unmeasured, so
record what you find.

**C11 comment lands and is verified.** `$tracker comment <id> "runbook note"`.
Check with `list_comments`: the exact body present exactly once.

**C12 [MANUAL] assignment race.** Two sessions, one `Todo` unassigned issue, `$tracker assign <id>`
in both. A Linear issue has a single assignee, so the loser cannot detect the race by counting
assignees: expect the verification read to name the winner, and the loser to write nothing back and
report. Needs two identities.

**C13 the bare assign is one call.** `$tracker assign <a Todo issue with no assignee>`.
Check with `get_issue`: `status` is exactly `In Progress` and `assignee` is you. `save_issue` takes
`state` and `assignee` together, so this must not arrive as two writes: a ticket that is assigned
while still `Todo` is off the frontier and in nobody's queue, which is the gap the single call
exists to close.

**C14 the explicit assign forms, and reservation.** On a `Todo` issue:
`$tracker assign <id> <who>`, where `<who>` may be **your own name**.
Check with `get_issue`: `assignee` is that name and `status` is **still `Todo`**, since only the
bare form moves the status. Then `$tracker next`: expect the issue absent, and `$tracker list ready`
expect it present. That is the reservation, the one case where `ready` and an assignee belong
together, and like A29b what it discriminates is the verb form rather than the identity.

**[MANUAL] second half.** With `<who>` a different workspace member, `$tracker assign <id> me` with
no `from` must refuse and name the holder, and `$tracker assign <id> me from <that member>` must
land with the status still `Todo`. A holder who is the caller makes the refusal unreachable, so this needs a second identity, the
same one C12 needs.

**C15 move to ready clears the assignee.** `$tracker assign <id>`, which puts it at `In Progress`
with you on it, then `$tracker move <id> ready`, then `$tracker next`.
Check with `get_issue`: `assignee` is null and `status` is `Todo`, with the issue back on the
frontier. `linear.md` says `move <id> backlog` and `move <id> ready` both write `assignee: null`; a
run where `ready` keeps the assignee is the same invisible-ticket bug A29 catches on GitHub, in a
backend where `next` filters on `assignee: null` just as hard.

**C16 an assignee Linear cannot resolve is a stop, not a success.**
`$tracker assign <id> someone-not-in-this-workspace`.
Check with `get_issue`: the assignee is unchanged, and expect the skill to say the assignment did
not land. This is A27's shape on a different backend, and what it establishes is which shape Linear
has: an error, or a write that succeeds and silently keeps the old assignee. Record what you see
either way, because `linear.md` currently says nothing about it.

**C17 a write is visible to the very next read.** `$tracker move <a Backlog issue> ready`, then
`$tracker next` **once**. Then `$tracker assign <it>` and `$tracker list in-progress` **once**.
Expect the issue in the frontier on the first read and in the list on the first read, with no retry
and no pause. Whether `list_issues` lags behind a write has never been measured on Linear; GitHub's
search index does, by seconds, which is F7 and the reason `next` there stopped using it. **A retry
is a FAIL, not a PASS**: scoring on a second read is what hid the defect on GitHub for two runs.

**C18 [MANUAL] archived issues are not silently dropped.** No MCP tool archives an issue, so this
needs the Linear UI. Linear has no manual Archive action either: archiving is automatic after a
period of inactivity, and the reachable action is **Delete**, which soft-deletes the issue into
Recently deleted and sets the same `archivedAt` field that `includeArchived` filters on. That is
the fixture, and it is restorable. The read-only half runs anywhere: list the team's `Done` issues
with `includeArchived` both ways and compare the counts, remembering that equal counts on a young
project prove only that nothing has archived yet, not the policy. Then delete a `Done` issue in the
Linear UI, confirm `archivedAt` with `get_issue`, then `$tracker list done` and `$tracker show <it>`.
Expect `list done` to report it and mark it archived with its timestamp, and `show` to return it
and say the same. `list_issues` takes `includeArchived` and **defaults it to `false`**, so a
terminal list that leaves the argument unset comes back short with nothing to say it did, which is
what this case caught as F23 and what `linear.md`'s archived-issue rule now prescribes against.
Check the open side in the same run: `list ready` must leave `includeArchived` unset, because a
deleted ticket carries the same `archivedAt` and has no business on the frontier. A pass that came
from flipping the flag everywhere is a different behaviour wearing the right answer's clothes.
Establish separately whether this workspace archives completed issues on its own, by policy or by
age, because that decides whether the default is a papercut or a silent under-report of every
`list done`. Nothing on this server answers it: `get_team` returns no auto-archive period.

**C19 show reports an issue that has no comments.** `$tracker show <an issue with no comments>`,
then `$tracker comment <it> "show probe"`, then `$tracker show <it>` again.
Expect the whole issue both times, with no comments the first time and one the second. `show` calls
`get_issue` plus `list_comments`, and nobody has run `list_comments` against an issue with none.
This is F9's shape: on GitHub the comment call returned nothing at all at exit 0, and `show` had to
stop using it.

**C20 create writes a description Linear keeps.** `$tracker create` with a ticket whose body has
every section, a code fence, a line of non-ASCII text, and a `## Blocked by` entry naming a real
ticket.
Check with `get_issue`, and not byte for byte: `linear.md` compares a description by its
sections, because the body does not round-trip, so a byte comparison cannot pass and is not the test. Linear is allowed to insert blank lines around
headings and to rewrite a bare `DEV-11` into a rich issue link. Expect every section heading
present and in its original order, the fenced block's contents unchanged character for character,
the non-ASCII line unchanged, and the native `blockedBy` relation on the issue. A dropped section,
an edited code fence, mangled non-ASCII, or a missing relation is a FAIL.
A markdown body crossing an MCP boundary is where a silent rewrite would hide, so what this case
pins down is which rewrites are survivable. F4 is the same case on GitHub, where the comparison
method itself turned out to be the trap.

**C21 link refuses a cycle, including the one Linear would flip.** Create three `Backlog` issues X,
Y, Z. `$tracker link <Y> blocked-by <X>`, then `$tracker link <Z> blocked-by <Y>`. Then
`$tracker link <X> blocked-by <Y>`, the reverse of an existing edge, then
`$tracker link <X> blocked-by <Z>`, which would close a three-issue cycle, then
`$tracker link <X> blocked-by <X>`.
Expect the first two to land and the last three to refuse, each naming its path or the self-link.
Check with `get_issue` and `includeRelations: true` on all three: X has an empty `blockedBy`, Y's
`blockedBy` is still exactly X, and Z's is still exactly Y. Linear, given the reverse edge, replaces
Y's relation with X's and reports success, so a Y with an empty `blockedBy` means the skill let the
write through.

**C22 an empty frontier says why.** Run it after every other C case. Move every issue
`$tracker next` returns out of `Todo`, until it returns nothing. Then build the fixture with
`save_issue` directly, since the skill will not write the cycle: P at `Todo` blocked by Q at
`In Review`; R at `Todo` assigned to you; S at `Todo`, blocked by T, T by U, and U by S, with T and
U at `Backlog`. Linear accepts that three-issue cycle. Then `$tracker next`.
Check first with `get_issue` that every relation reads back as written.
Expect the reply to say the frontier is empty and to name P held by Q at `In Review` or
`in-review`, R reserved for you, and S with the cycle through S, T, and U as a path. A reply that
says only that the frontier is empty is a FAIL, and so is one that misses the cycle.

**C23 create sets the project and the milestone.** Create a milestone M1 in `linear_project`, then
`$tracker create` with a one-line ticket and `ready` as the status, naming M1.
Check with `get_issue`: `project` is the configured project, `projectMilestone` is M1, and the
status is `Todo`. Then `$tracker list ready M1` must return it. An issue outside the project is a
FAIL even when `get_issue` finds it, because every project-scoped read misses it.

**C24 create holds the status back when an edge does not land.** `$tracker create` with `ready` as
the status and a `## Blocked by` entry naming an id that does not exist in the team, such as
`<prefix>-99999`.
Expect the reply to name the missing edge and say the status was not applied. Check with
`get_issue`: the issue exists at `Backlog` with no `blockedBy`. An issue at `Todo` is a FAIL even
when the reply mentions a warning, because between the write and the reply it was on the frontier
with nothing blocking it. If Linear rejects the whole call and no issue exists, that also passes.
Record which happened, and the exact `warnings` or error text, in the run log.
Linear refuses an unknown id with an error, as the 0.0.21 run found, so this fixture passes on a
one-call create too and does not discriminate. A blocker Linear refuses only in `warnings` would.
No such fixture is known yet; record any you find.

**C25 [MANUAL] list with no status covers an unmapped status.** Needs C3's extra status, such as
`Ready to Merge` under `started`. Put one issue in it with `save_issue`, then `$tracker list`.
Expect the issue listed under its Linear name, not dropped and not folded into one of the seven.
Check the calls: one `list_issues` per open team status, the extra one included, and none for Done,
Canceled, or Duplicate.

---

## D. Harness parity

Run the same one command from one install on each harness available.

The case IDs are labels, not the run order. [Running leg D](#running-leg-d) gives the order the
cases are actually run in, and why.

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

### Running leg D

The numbered steps below are in run order, and the case IDs are not. D1 and D3 check that another
harness returns the ticket Claude Code created, and that ticket needs a finished `/setup`, which is
the same run that covers D4 to D6. D4, D5 and D6 are three facts about one setup interview, so they
cannot be split into separate runs. The interview only happens in a directory with no `.git`, so
the Codex check of D4 and D6 needs a second directory of its own. Each step heading lists its cases
in the order they are observed.

This is the one leg a person has to run. D4 to D6 are facts about the harness while the model is
mid-turn: whether it sits idle, how many questions one screen carries, whether a bare digit is
taken. A model reporting on its own turn is exactly the self-assessment `How to score` refuses, so
these are watched from outside and written down by whoever watched. D1 to D3 are lighter, one
command each with the verdict in the output, but every harness still has to be launched by hand.

Two scratch directories, both installed with the invocation gates **left as shipped**. Every other
leg strips them so it can run unattended. Leg D must not, because being triggered by name is what
it tests.

```
mkdir -p ~/tmp/tracker-legd && cd ~/tmp/tracker-legd && npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#<branch or tag>' -a claude-code -a codex -a kiro-cli -s '*' -y
```

```
mkdir -p ~/tmp/tracker-legd-codex && cd ~/tmp/tracker-legd-codex && npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#<branch or tag>' -a claude-code -a codex -a kiro-cli -s '*' -y
```

Do not run `git init` in either. D5 needs setup to make that offer itself, and the second directory
has to stay in the same untouched state for D4 and D6.

#### Step 1. Claude Code, first directory: D5, D4, D6, D2

Launch it from that directory and type `/setup`. Answer live rather than pasting the answers
ahead, which is the thing every other leg does and the reason this leg has never run. Backend
**Local markdown**, defaults for Section B, `AGENTS.md` for Section C, no test command for Section
D, accept the commit offer at the end. Local is the right backend here because it has no
prerequisites, so nothing outside the interview can interrupt the sequence D5 is watching.

Watch the first three screens and record what each one carried, which is D5. While Section A is on
screen, record the form of the question for D4. Then, for D6, look at the harness itself rather
than at the message.

When setup finishes, create one ticket so the parity checks have something to find:
`/tracker create` a ticket titled `legD parity probe`, at `ready`. Then `/tracker list ready`, which
is **D2**: record the ticket id and that the list contains it.

#### Step 2. Codex, first directory: D1

`$tracker list ready`. It passes if it returns the same ticket from the same install with no setup
re-run.

#### Step 3. Kiro CLI, first directory: D3

Before running anything, type `/` and read the command menu. Then `/tracker list ready` for the
same ticket.

#### Step 4. Codex, second directory: D4, D6

Fresh directory, so setup interviews again. `$setup`, then answer the `git init` offer and
Section A only; the run can be abandoned after that. Codex has no picker, so numbered options with
the recommended one first and a bare digit accepted is the correct result here rather than a
fallback to apologise for. Type `1` and confirm it is taken.

The observation sheet, filled in by the person at the keyboard and carried into the Run log entry
verbatim. Its lines follow the run order, so it fills top to bottom:

```
step 1, Claude Code, first directory
D5 Claude Code:             screen 1 carried =, screen 2 =, screen 3 =
D4 Claude Code:             form of the Section A question =
D6 Claude Code:             harness state at Section A =
D2 Claude Code list ready:  output =
step 2, Codex, first directory
D1 Codex list ready:        output =
step 3, Kiro CLI, first directory
D3 Kiro menu:               tracker description rendered as =
D3 Kiro list ready:         output =
step 4, Codex, second directory
D4 Codex:                   form of the Section A question =, digit accepted =
D6 Codex:                   harness state at Section A =
anything surprising:
```

Two things the observer decides and the scorer must not guess at. A screen carrying more than one
question is recorded by naming **which** questions, since the rule is that only questions whose
answers cannot change each other may share a call, and the verdict turns on that rather than on the
count. And Claude Code asking Section A as prose instead of through its picker is written down as
prose, not rounded up to a pass, because using the harness's own picker is the half of D4 the skill
actually prescribes.

---

## Evidence behind the skill files

The backend files state rules without the measurements behind them. The measurements live here, or
in the run log below, so a rule can be re-checked when a backend changes.

- **GitHub status prelude.** Checked against eight label shapes: none, `backlog`, `ready`, a topic
  label alone, a topic label with `backlog`, `backlog` with `ready`, `ready` with `in-progress` and a
  topic label, and `in-review`. The first five and the last resolve to a status, and the two
  multi-status shapes to `inconsistent`. Closed issues resolve through `stateReason`, and a stale
  status label on one is ignored.
- **GitHub read backends.** `GH_DEBUG=api` on `gh` 2.97.0 shows `--label`, `--milestone`, and
  `--search` sending a search query, and the unfiltered list sending `query IssueList`. An issue
  created with `--label ready` was missing from `--label ready` on three of three trials, and present
  in the unfiltered read on all three.
- **GitHub `blockedBy.totalCount`.** It counts closed blockers, measured 2026-09-18 on `gh` 2.97.0.
  The GraphQL schema agrees: `totalBlockedBy` is documented as "open and closed".
- **GitHub cycles.** Measured 2026-09-21 on `wilsonkichoi/tracker-gh`: a self-link returns HTTP 422
  `Target issue cannot be the same as the source issue`, a two-issue cycle returns HTTP 422
  `this dependency would create a cycle where the target is already blocked by the source`, and the
  third edge of #35 → #37 → #36 → #35 was accepted.
- **Linear cycles.** Measured 2026-09-21 on team `c-leg`: with CLE-5 blocked by CLE-4, `save_issue`
  on CLE-4 with `blockedBy: ["CLE-5"]` succeeded with no warning and left CLE-5 blocked by nothing.
  CLE-5 → CLE-6 → CLE-4 → CLE-5 was written and read back intact. A self-link returned success with
  `Could not add CLE-6 to blockedBy: Argument Validation Error - relatedIssueId cannot have the same value as issueId.`
  in `warnings`.
- **Linear status names.** The predecessor recorded that an inexact status name fails silently. It
  did not reproduce: the server matches case-insensitively and rejects an unknown name with
  `Could not find state "<name>"`.
- **Linear unfiltered list.** The claim that an unfiltered `list_issues` can omit issues comes from a
  dogfood run of the predecessor. It has not been reproduced here, and the rule costs nothing.
- **Linear milestone list.** `list_projects` with `includeMilestones: true` failed on a real
  workspace with `query is too complex, Complexity: 15879, Maximum allowed: 10000`.
- **GitHub commands that exit 0 and do nothing.** `gh issue edit --remove-label` on a label the
  issue lacks. `--add-assignee` with a real user who lacks push access: the URL prints and nobody is
  assigned (a login that does not exist exits 1 with
  `Could not resolve to a user or bot with the login '<x>'`). `gh issue close` on a closed issue
  prints "is already closed" and keeps the old reason. `gh issue view --comments` on an issue with no
  comments prints nothing.
- **GitHub concurrent mutations.** `gh` sends label or assignee additions and removals as two
  unordered mutations, so a name in both lists ends in whichever lands last.
  `--remove-label ready --add-label ready` stripped the label in 8 runs of 8.
- **GitHub milestones.** `--milestone <number>` is turned back into a title search.
  `gh issue create --milestone` and `gh issue edit --milestone` exit 1 with `'<title>' not found` on
  a closed milestone. The milestones endpoint returns open milestones unless given `state=all`.
- **GitHub limits and bodies.** `gh issue list` returns newest first and defaults to `--limit 30`, so
  truncation drops the lowest numbers. `blockedBy.nodes` holds at most 50 entries. A multi-line body
  does not survive `--body`. Comparing a body through `--jq .body > file` adds a trailing newline and
  `"$(...)"` strips one, so both report a difference on an identical body.
- **GitHub terminal order.** Closing before stripping labels means a failed strip leaves a stale
  label on a closed issue, which the prelude ignores. The other order can leave an open, unlabelled
  issue, which reads as `backlog`.
- **Linear archive and descriptions.** Linear archives completed issues after inactivity, and a
  deleted issue is archived too; the tools cannot tell the two apart. `list_issues` defaults
  `includeArchived` to `false` (F23). Linear rewrites a bare issue id into a rich link and adds blank
  lines around headings.
- **Linear milestones.** `list_issues` rejects `milestone` with `Unrecognized key: "milestone"`. A
  milestone whose only issue is Done still comes back from `list_milestones`, with `progress: 100`.
- **Linear duplicate transition.** `Cannot create an issue in a duplicate state.` when creating in it;
  `Issues can only be moved to a duplicate state when a duplicate issue relation exists.` when
  setting the state first. Setting `duplicateOf` moves the status by itself. It also moves the
  issue's relations onto the original, which earlier entries recorded as "cleared" because they read
  only the duplicate. Measured 2026-09-22 on team `c-leg`: CLE-57, with `relatedTo` CLE-54,
  `blockedBy` CLE-55, and `blocks` CLE-56, was marked a duplicate of CLE-53. Afterwards CLE-57 had no
  relations, and CLE-53 had all three. CLE-58, blocked by CLE-53 and related to CLE-54, left CLE-53
  with no self-edge and one `relatedTo` CLE-54. CLE-60, blocked by CLE-59 where CLE-59 was blocked
  by CLE-53, left CLE-53 without CLE-59 as a blocker: the edge that would have closed the cycle was
  dropped, with no warning.
- **Linear assignment.** An issue has one assignee, so the GitHub tie-break cannot fire. Two sessions
  that write at once both succeed and the last write wins; a write between one session's write and
  its read is invisible.
- **Local unquoted values.** A YAML parser reads `0123` as `83`, `null` and `true` as a null and a
  boolean, `2026-09-18` as a date, and fails on a value starting with `-`, `[`, or `{`, or containing
  `: `. Trailing spaces are stripped.
- **Linear default statuses.** A team created from Linear's default template has six of the seven
  statuses and no In Review, checked on a team created 2026-09-18.
- **Local is single session.** An assignment made on a branch is invisible from `main` until the
  branch merges, so two sessions on one repository need `github` or `linear`. `setup` says so when
  local is picked.
- **Local quoting.** 23 titles round-tripped byte-identical through a YAML parser: colons, hashes,
  `@`, apostrophes, double quotes, percent signs, leading dashes and question marks, brackets and
  braces, leading and trailing spaces, backslashes, pipes, angle brackets, tabs, anchors and
  aliases, bare `null` and `true`, a leading-zero number, a date, CJK, accented Latin, an emoji, and
  a mixed title.

## Run log

Newest first, by the timestamp in each entry's heading: ISO 8601 with the local offset, the same
shape `CHANGELOG.md` uses, so two runs on one day stay distinguishable. One entry per run. The
runbook above is the reusable procedure and is not edited by a run; everything a run learned goes
here.

### 2026-09-22T13:26:43-07:00 Targeted 0.0.30 run, Codex

Skill ref `43ac4ef` (skill 0.0.30), same directories and driver as the runs below: `gpt-6-luna` at
`high`. Output `out/t1315-gpt-6-luna`. Every child loaded the project's `SKILL.md`, and the harness
confirmed each child's model and effort. Cases A17b, A17c with step 3 five times, B9b, and C6 five
times. Each verdict below was checked by hand against `reply.txt`, `calls.txt`, `parse.json`, and
`checks/`. The GitHub scorer called A17c SKIP because it looked for `parse.json` under `checks/`;
the files are under `steps/`, and the case ran.

| Case | Verdict | Independent evidence |
|---|---|---|
| A17b | PASS | #144 read `labels: []` before and after `move 144 in reviewww`, and one label, `in-progress`, after `move 144 in progress`. The bad call wrote `move 144: "in reviewww" is not a status, refusing.` and made no tool call. |
| A17c | FAIL | Steps 1, 2, and 5 to 7 passed: #149 `Alpha t1315 in review` with no label, #150 `Bravo t1315` with `in-review`, `list M1-t1315` gave #145 and #146, `list "in reviewww"` gave #147, `list "in progress" M1-t1315` gave #145, and `list nosucht1315` named all thirteen milestones in `A17c_milestones_at_run.json` and the seven statuses. Step 3 asked in 1 of 5. Only 3e (`India`) wrote `create: unquoted text ends in "in review", asking.` and made no tool call. 3a, 3b, 3c, and 3d each wrote a parse line before the first tool call, but it read the words as the status, such as `` `create`: "in progress" is `in-progress`; title is "Foxtrot t1315" ``. They created #148 `Charlie t1315` and #153 `Golf t1315` with `in-review`, and #151 `Foxtrot t1315` and #152 `Hotel t1315` with `in-progress`. Step 4 failed for the first time in four runs: `create "Delta t1315" done` wrote `` `create: no status, backlog` ``, the fourth parse example in `SKILL.md` word for word, and created #154 `Delta t1315` with no label. It dropped `done` without a word. |
| B9b | PASS | `144-v26-t1315-b9b-target.md` kept SHA-256 `32158436...262c7` after the bad move, whose child refused with no tool call, then parsed `in-progress`. `create Echo in review` wrote `create: unquoted text ends in "in review", asking`, asked, and created no file. |
| C6 | PASS | 5 of 5. CLE-93 to CLE-97 took `in reviewww`, `in-progres`, `donee`, `backlogg`, and `in_review`. Each child's first message was a parse line ending in `refusing`, each made zero tool calls, each reply listed the seven and suggested none, and each issue read `Backlog` afterwards. All five read `In Progress` after `move <id> in progress`. |

The 0.0.29 parse line fixed the bad-status refusal on `move`: 7 of 7 refusals across A17b, B9b, and
C6, none with a tool call, against 2 of 3 on C6 in the 0.0.28 run. It did not fix the unquoted
`create`. The model writes the line, but it writes the status form of it rather than the asking form.
Across 0.0.26 to 0.0.30, step 3 has asked in 4 of 10 GitHub runs, while the one-word title in B9b
asked on every run from 0.0.27 on. Step 4 is new and is likely caused by 0.0.29: the parse examples
give `create` no form for a status it was given, so the model copied the closest one and lost the
argument.

The same command on `gpt-6-astra` (tag `t1320`) is VOID. At 13:21 every Codex call returned "You've
hit your usage limit", with a reset at 2026-09-23 14:39. The Linear fixture helper failed first, so C6
never ran, and every A17c step 3 child died in about three seconds. The seven steps that finished
before the limit are not scored. Cleanup: the harness closed issues above #154 and milestone
`M1-t1320` and removed the local file above 143. CLE-98 to CLE-102 read `Backlog` with one state in
their history, and were cancelled by hand. Output renamed to `out/void-t1320`.

### 2026-09-22T13:08:43-07:00 Targeted 0.0.28 run, Codex

Skill ref `50fdd41`, same directories, driver, and model as the runs below: `gpt-6-luna` at `high`.
Output `out/t1259`. Every child loaded the project's `SKILL.md`. Cases A17b, A17c with step 3 three
times, B9b, and C6 three times. Each verdict below was checked by hand against the raw evidence.

| Case | Verdict | Independent evidence |
|---|---|---|
| A17b | PASS | #137 read `labels: []` after `move 137 in reviewww`, and one label, `in-progress`, after `move 137 in progress`. |
| A17c | FAIL | Steps 1, 2, and 4 to 7 passed, with step 6 naming all twelve milestones in `A17c_milestones_at_run.json`. Step 3 asked on 3b (`Foxtrot`) and 3c (`Golf`), and created nothing. On 3a it wrote "The title is `Charlie t1259`, and `in-review` is the requested status", then created #143 and added `in-review`. |
| B9b | PASS | `144-v26-t1259-b9b-target.md` kept SHA-256 `619f87d4...1da6e` after the bad move, then parsed `in-progress`. `create Echo in review` asked and created no file. |
| C6 | FAIL | CLE-90 and CLE-91 refused, listed the seven, and read `Backlog`. CLE-92 called `save_issue({id:"CLE-92",state:"In Review",...})` and replied "Moved CLE-92 from Backlog to In Review". All three then read `In Progress` after `move <id> in progress`. |

In every failing child, the skill was in context and the backend file was read, and the model then
went straight to the write with no message or call that checked the status argument. The children
that passed say the check out loud first. Moving the rule into the section 3 preconditions in 0.0.27
and 0.0.28 did not change that. 0.0.29 makes the check a written parse line before any tool call.

### 2026-09-22T12:58:22-07:00 Targeted 0.0.27 run, Codex

Skill ref `d930695`, same directories, driver, and model as the 0.0.26 run below: `gpt-6-luna` at
`high`, checked per child. Output `out/t1250`. Every child loaded the project's `SKILL.md` and its
backend file. Cases A17b, A17c, B9b, and C6 (three repeats). Each verdict below was checked by hand
against the raw evidence.

| Case | Verdict | Independent evidence |
|---|---|---|
| A17b | PASS | #130 read `labels: []` before and after `move 130 in reviewww`, whose reply listed the seven statuses and changed nothing. After `move 130 in progress` it read one label, `in-progress`. |
| A17c | FAIL | Steps 1, 2, and 4 to 7 passed: #136 `Alpha t1250 in review` with no status label, #135 `Bravo t1250` with `in-review`, `create "Delta t1250" done` refused, and the list steps matched `truth_after_reads.json` and the milestone list. Step 3, `create Charlie t1250 in review`, did not ask: it created #134 `Charlie t1250` and added `in-review`. The same step asked in the 0.0.26 run. The ask rule was only in `SKILL.md` section 2. |
| B9b | PASS | `144-v26-t1250-b9b-target.md` kept SHA-256 `52886f91...c520f` after `move 144 in reviewww`, then parsed `status: 'in-progress'` after `move 144 in progress`. `create Echo in review` asked and created no file. |
| C6 | FAIL | The 0.0.27 fix held on all three repeats: CLE-87, CLE-88, and CLE-89 each read `Backlog` after `move <id> in reviewww`, and `In Progress` after `move <id> in progress`. Repeats 1 and 2 listed the seven statuses. Repeat 3 replied "`in reviewww` is not a valid status. No change was made. Use `in-review` to move CLE-89.", naming a near miss and not the seven. |

The pattern across both runs: a rule the verb's section 3 precondition names is followed, and a rule
only section 2 states is followed intermittently. 0.0.28 puts the `create` ask and the full `move`
refusal into the preconditions. The runbook now runs A17c step 3 three times, and C6 fails a refusal
that suggests a status.

### 2026-09-22T12:47:29-07:00 Targeted 0.0.26 run, Codex

Skill ref `c758000`, installed byte-identical in `~/tmp/tracker-val-a3`, `~/tmp/tracker-s-local`, and
`~/tmp/tracker-cleg`. Driven by `~/tmp/tracker-0026/run.py`, output `out/t1236`: one `codex exec`
child per skill call on `gpt-6-luna` at reasoning effort `high`, checked per child from the
transcript's `turn_context`. Every child loaded the project's `SKILL.md` and its backend file.
Fixtures, independent checks, and cleanup ran in the script; Linear fixtures and reads went through a
helper limited to `linear-wkc-sandbox`. The skill children called Linear through the `codex_apps`
connector, which reaches the same workspace.

The per-backend scorers made errors, so every verdict below was re-scored by hand from the raw
replies, tool calls, and backend reads. The GitHub and local scorers listed C9 as skipped although it
is a Linear case, and the Linear scorer applied C9's first-part expectations to the second part.

| Case | Verdict | Independent evidence |
|---|---|---|
| A12 | PASS | #124 carried `ready` and `in-progress`. `next`, `list ready`, `list backlog`, and `list` with no status left it out of their results and named it inconsistent; `show` named both labels. |
| A17c | PASS | #129 `Alpha t1236 in review` with no status label; #128 `Bravo t1236` with `in-review`. The unquoted `create Charlie t1236 in review` asked whether `in review` was the status and created nothing. `create "Delta t1236" done` refused. `list M1-t1236` returned #125 and #126; `list "in reviewww"` returned #127; `list "in progress" M1-t1236` returned #125 only. `list nosucht1236` named all ten milestones `gh api .../milestones?state=all` returns, and the seven statuses. |
| B4 | PASS | One write created `146-v26-t1236-b4-blocked.md` with `status: 'ready'` and `blocked_by: ['144']`; the parse read both, and the body carried `## Blocked by` with `- 144`. |
| B9b | SKIP | Steps 1 and 2 passed: the file's SHA-256 was unchanged after `move 145 in reviewww`, and the parse read `in-progress` after `move 145 in progress`. Step 3 is void: the fixture prompt `create Echo t1236 in review` put a run tag where the child read a ticket id, so it asked about that instead. It wrote nothing. Re-run with a title that carries no tag. |
| C6 | FAIL | `move CLE-74 in reviewww` called `save_issue({id:"CLE-74",state:"In Review"})` and replied "Moved CLE-74 from Backlog to In Review". The helper read `In Review`. The child had `SKILL.md` in context and followed `linear.md`'s `move` row; the refusal lived only in `SKILL.md` section 2, and neither the section 3 precondition nor the backend row named it. 0.0.27 puts it in the `move` and `create` preconditions. The second step, `move CLE-74 in progress`, read `In Progress`. |
| C9 | PASS | Part a: CLE-79 named `blocks CLE-78`, `blocked by CLE-77`, and `related to CLE-76` before the write, said CLE-75 would be blocked by CLE-77, and wrote `save_issue({id:"CLE-79",duplicateOf:"CLE-75"})` with no `state`. Afterwards CLE-79 read `Duplicate` with no relations, and CLE-75 carried all three. Part b: CLE-82 named the CLE-81 edge as dropped before the write and went ahead. CLE-82 read `Duplicate`, and CLE-80 still only blocked CLE-81. Part c: CLE-86 refused with `CLE-83 → CLE-85 → CLE-84 → CLE-83`, made no write, and read `Todo` blocked by CLE-85. |

Wall time was six minutes for all three legs. Three earlier starts of the same script, `void-t1211`,
`void-t1213`, and `void-t1214`, ran by accident while the script was being written, and `void-t1223` ran on the
wrong model. None was scored, and their fixtures were closed, cancelled, or deleted.

### 2026-09-22T11:48:12-07:00 Independent review of the trim, and 0.0.26 fixes, Claude Code

Not a skill run. A second model reviewed `git diff 3819e4e 209a9df -- skills/tracker/` and raised
five findings, F1 to F5. This entry records what was checked directly against a backend or the
query text, and which cases still need a run through the installed skill.

| Finding | Disposition | Evidence |
|---|---|---|
| F1 Linear duplicate warning lost its scope | Accepted, and corrected: the relations move, they are not cleared | Direct MCP calls through `linear-wkc-sandbox`, team `c-leg`, project `cleg test`, fixtures CLE-53 to CLE-60. See the "Linear duplicate transition" evidence entry. C9 rewritten. |
| F2 local `create` contradicts the staged sequence | Accepted | Text only. `SKILL.md` now names the one-record exception, and failure reports the status the ticket now has. B4 extended. |
| F3 `move backlog` adds a `backlog` label | Rejected | `move` has added the target label since before the trim, and A20 recorded `labels: ["backlog"]` as a PASS on 2026-09-19. The prelude reads both shapes as `backlog`. The `create` sentence was reworded so it no longer reads as a rule for every write. |
| F4 status normalization has no argument boundary | Accepted | Text only. `SKILL.md` limits the rule to status positions, makes a non-status `list` argument a milestone, and asks on an ambiguous unquoted `create`. A17c added, B9b extended. |
| F5 unfiltered GitHub `list` returns inconsistent issues as tickets | Accepted | The fix plan's `node` script ran the `list` query from `github.md` at `3819e4e` and `209a9df` against three in-memory issues. Both printed `tickets` `[12,13,14]` with 12 also under `inconsistent`. With `select(status != "inconsistent")` both printed `tickets` `[13,14]`, `inconsistent` `[12]`, `rows` 3. A12 extended. |

Not run through the installed skill on any harness: A12's unfiltered `list`, A17c, B4, B9b's
`create` step, and all three parts of C9. Each is SKIP until a run scores it. The CLE-5x fixtures are
left in `cleg test`: CLE-57, CLE-58, and CLE-60 at `Duplicate`, the rest at `Backlog`.

### 2026-09-22T10:19:20-07:00 Re-run of the 0.0.25 fixes, Codex

Both defects from the post-trim run are fixed and re-verified: A5 and the new A17b on GitHub, C6 on
Linear, B9b on local. Same method as the run below, one child `codex exec ... '$tracker <verb>'`
per skill call, gate as shipped, at skill ref `817326f (feat/tracker)`. The local driver ignored its
scope of B9b alone and ran the whole B leg, which is recorded here as its own report block.

```
TRACKER VALIDATION
backend: github                  harness: codex
date: 2026-09-22T09:12:25-07:00  skill ref: 817326f (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

| Case | Verdict | Independent evidence |
|---|---|---|
| A5 | PASS | Fixture #104. `gh issue view 104 --json title,labels` read `{"labels":[],"title":"A5 rerun 2026-09-22 fixture"}`, and the runbook body comparison printed `true` at exit 0. A later check read #104 `CLOSED`, `NOT_PLANNED`, `labels: []`. |
| A17b | PASS | Fixture #105, open with no label. After `$tracker move 105 in reviewww`, the read was `{"assignees":[],"labels":[],"number":105,"state":"OPEN"}`. The child's four tool calls were all reads, no `gh issue edit` among them, and it answered "`reviewww` is invalid" and listed the seven statuses. After `$tracker move 105 in progress`, the read was `labels: ["in-progress"]`. |

Deviations:

- D-1 one codex exec process per skill call, gate as shipped.
- D-2 A17b's precondition was a fresh `gh issue create`, not a ticket from an earlier case.
- D-3 fixtures #104 and #105 were closed `NOT_PLANNED`. No existing ticket was touched.

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-22T10:19:20-07:00  skill ref: 817326f (feat/tracker)

PASS  22
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: the driver was asked for B9b and ran B1 through B20 as well. All 22 are scored here.

| Case | Verdict | Independent evidence |
|---|---|---|
| B9b | PASS | Fixture `131-related-f.md` at `backlog`. The invalid `in reviewww` call was refused with the seven statuses named, and the file's SHA-256 stayed `ff6b0901dd86866c9c6f2591bc85604ee96179a0f608b7a6eed78c6a2488138d`. That child made four tool calls, all reads: the config, `SKILL.md` and `local.md`, the file list, and the file. `in progress` then parsed as `status: 'in-progress'`. |
| B1 | PASS | `docs/dev-agents/issues/` exists; the config read `issue_tracker: local` and `issues_dir: docs/dev-agents/issues/`. |
| B2 | PASS | Fixture `023-ticket-a.md` parsed `id: '023'`, `status: 'backlog'`, filename matching the slug. |
| B3 | PASS | Ten fixtures, `024` to `028` and `125` to `129`. Every title parsed back as the exact string, and the filenames followed the Unicode slug rule, including `126-émoji-and-日本語-and-ünïcödé.md`. |
| B4 | PASS | `130-ticket-b.md` parsed `blocked_by: ['023']` with `- 023` under `## Blocked by`. |
| B5 | PASS | `131-related-f.md` carried `## Related` with `#023`, `blocked_by: []`, no `related` key, and no `## Blocked by`. |
| B6 | PASS | `132-has-section.md` gained `blocked_by: ['023']` and `- 023`; `133-no-section.md` gained the edge and no heading. |
| B7 | PASS | After `023` and `130` moved to `ready`, the first `$tracker next` listed only `#023`; the parse held `130` behind `023`. |
| B8 | PASS | After the bare assign, `023` parsed `status: 'in-progress'`, `assignee: 'Wilson Choi'`, equal to `git config user.name`. |
| B9 | PASS | After `023` moved to `done`, the first `$tracker next` listed `#130`. |
| B10 | PASS | `130` held `### 2026-09-22 tracker` and the exact body `a note`. |
| B11 | PASS | The commit count stayed 3 across `$tracker comment 130`, and `git status --porcelain` showed only ` M docs/dev-agents/issues/130-ticket-b.md`. |
| B12 | PASS | Hand-written `099-hand.md` read as implicit `backlog`; after the move its frontmatter held only `status: 'ready'` and `assignee: ''`, with the body intact. |
| B12b | PASS | `098-partial.md` kept `id`, `title`, and `milestone: 'M1'`, ending at `status: 'ready'` and `assignee: 'someone'`. |
| B13 | PASS | `show 99`, `show 099`, and `show '#99'` all resolved `099-hand.md`. |
| B14 | PASS | `list ready M1` returned only `098`; the unknown milestone stopped and named `M1`. |
| B15 | PASS | `099` parsed `ready` with `some-colleague`, off the frontier and in `list ready`. The wrong-holder refusal left the checksum unchanged, and the handover wrote `Wilson Choi`. |
| B16 | PASS | The bare assign gave `130` `in-progress` and `Wilson Choi`; the move to `ready` cleared the assignee and the next `$tracker next` returned it. |
| B17 | PASS | `show 131` had no comments first, then exactly one `show probe` with its author heading, body intact. |
| B18 | PASS | `134-body-delimiters.md` parsed `status: 'backlog'`; `show 134` returned both body `---` lines and the pasted `status: 'done'` text, and `list backlog` included it. |
| B19 | PASS | `135`, `136`, `137` parsed `[]`, `['135']`, `['136']`. The cycle and self-link calls refused, and `135` kept no blocker. |
| B20 | PASS | With `130` at backlog, the independent frontier was empty. `138` was held by open blocker `139` in review, `140` by `someone-else`, and `141` by the cycle `141 → 142 → 143 → 141`. Six fixture checksums were unchanged across the read. |

Deviations:

- D-1 one codex exec process per skill call, gate as shipped.
- D-2 the driver was scoped to B9b and ran the whole leg. The extra cases are scored because each carries its own independent evidence.
- D-3 fresh ids were used throughout, since the scratch repository still held earlier artifacts. B6 used `132` and `133` in place of the runbook's `015` and `016`.
- D-4 B3's `0123` and `null` were first sent unquoted and read as other input. Only the quoted retries, `128` and `129`, were scored.
- D-5 fixtures were cancelled through `$tracker move <id> cancel`. `023` stayed `done`, since no verb leaves a terminal status.

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-22T09:10:57-07:00  skill ref: 817326f (feat/tracker)

PASS  1
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

| Case | Verdict | Independent evidence |
|---|---|---|
| C6 | PASS | Fixture CLE-52 in project `cleg test`. `get_issue` read `Backlog` before the invalid call and `Backlog` after it. The child refused `in reviewww` and listed the seven statuses. `in progress` then read `In Progress`. An independent `get_issue` after the run read `stateHistory` as Backlog from creation at 16:07:53Z until 16:09:16Z, then In Progress, then Canceled at 16:10:27Z, so the invalid call wrote nothing. |

Deviations:

- D-1 one codex exec process per skill call, gate as shipped.
- D-2 CLE-52 was cancelled after scoring.


### 2026-09-22T08:44:06-07:00 Post-trim run at 0.0.24, Codex

First valid run after the 0.0.23 and 0.0.24 trims. Three Codex driver sessions ran in parallel, one
per backend, from 07:17 to 08:44. Each driver ran every skill call as its own child
`codex exec --dangerously-bypass-approvals-and-sandbox -C <dir> '$tracker <verb> <args>'` and
scored only on its own independent reads. A review of every child transcript from the run found a
literal `$tracker` prompt as the first user turn and the installed
`<dir>/.agents/skills/tracker/SKILL.md` loaded, in all three directories. Two defects surfaced,
A5 and C6, both fixed in 0.0.25. Neither was caused by text the trim removed alone: see the notes
under each block.

```
TRACKER VALIDATION
backend: github                  harness: codex
date: 2026-09-22T08:03:43-07:00  skill ref: 156a913 (feat/tracker)

PASS  20
FAIL  1
SKIP  0

failures:
  A5  expected labels [] and body true  actual labels ["backlog"] and body true
skipped:
  none

VERDICT: RED
```

Scope: A5, A6, A9, A10, A12, A13, A14, A15, A16, A17, A20, A22, A23, A23b, A26, A28, A29, A29b,
A30, A31, and A32 in `~/tmp/tracker-val-a3`, repository `wilsonkichoi/tracker-gh`.

| Case | Verdict | Independent evidence |
|---|---|---|
| A5 | FAIL | Fixture #70. `gh issue view 70 --json number,title,labels` read `labels: ["backlog"]`. `gh issue view 70 --json body \| jq --rawfile sent fixture-A5-body.md -e '.body == $sent'` printed `true`. The child said "I will create it without a label, then apply and verify `backlog`". |
| A6 | PASS | Fixture #72 with hand-created blocker #71. `gh issue view 72 --json blockedBy --jq '[.blockedBy.nodes[].number]'` read `[71]`. #72 also carried a `backlog` label, the A5 defect again. |
| A9 | PASS | Fixtures #73 and #74, both `ready`, #74 blocked by #73. The `$tracker next` result included #73 and excluded #74. |
| A10 | PASS | Fixtures #75 and #76. After `$tracker move 75 done`, the list read held #76 with `blockedBy.totalCount: 1` and node #75 `CLOSED`; the next `$tracker next` included #76. |
| A12 | PASS | Fixture #83 read `labels: ["ready","in-progress"]`. `next`, `list ready`, and `list backlog` excluded it and named it inconsistent; `show` named both labels. |
| A13 | PASS | Fixture #103 read `["ready","in-progress"]`. After `$tracker move 103 ready`, `gh issue view 103 --json labels` read `["ready"]`. |
| A14 | PASS | Fixture #85 read `["bug","duplicate","in-progress"]` after the no-op move. |
| A15 | PASS | Fixture #86 read `CLOSED`, `COMPLETED`, `["bug","duplicate"]`. |
| A16 | PASS | Fixtures #77 and #78. #78 read `CLOSED` with `stateReason: DUPLICATE`. |
| A17 | PASS | Fixture #80 stayed `CLOSED` with `DUPLICATE`; `$tracker move 80 ready` refused with no write. |
| A20 | PASS | Fixture #87 read `assignees: []` after the bare assign and the move to backlog. |
| A22 | PASS | Fixture #81 `--json comments` read exactly one `runbook note`. |
| A23 | PASS | Fixture #88 on open milestone `tracker-val-a3 M1`. The scoped list returned only #88; an unknown milestone stopped and named the existing ones. |
| A23b | PASS | Fixture #89 on closed milestone `tracker-val-a3 M2`. `milestones` without `state=all` omitted M2, `milestones?state=all` listed it, and the scoped list returned #89. |
| A26 | PASS | Fixture #82. The first `$tracker next` after the move included #82; the first milestone list after an independent milestone edit returned it. |
| A28 | PASS | Fixture #90. The wrong-holder call left `["wilsonkichoi"]`; the bare `none` produced `[]`. |
| A29 | PASS | Fixture #91 read `assignees: []` and `["ready"]` after bare assign and move to ready; `$tracker next` included it. |
| A29b | PASS | Fixture #92 read `["wilsonkichoi"]` and `ready`. `next` omitted it, `list ready` included it, and `show` named the holder. |
| A30 | PASS | Fixture #93. The first `show` had no comments; after the comment, the second showed one comment by `wilsonkichoi` with body `show probe`. |
| A31 | PASS | Fixtures #94, #95, #96. After two valid links, #95 was blocked by #94 and #96 by #95. After the refused cycle and self-link, #94 read `blockedBy: []`. |
| A32 | PASS | Fixtures #97 to #102. With every issue from the frontier query moved out of `ready`, the independent query read `frontier: []` and held #97 behind #98, #99 on `wilsonkichoi`, and #100 behind #101. The skill named #98 as `in-review`, #99 as reserved, and the cycle `#100 -> #101 -> #102 -> #100`. |

A5 root cause. `github.md` `create` says "Create with no status label, ... then add the requested
status label", and its verification says the read "must show ... the status label". A default
`backlog` request therefore adds the `backlog` label. The 0.0.22 wording had the same two sentences;
the trim removed the statuses-section line "Open with no status label: `backlog`. Every
human-created and every reopened issue lands here", which was the only nearby text that made an
unlabelled issue the normal `backlog` shape. Fixed in 0.0.25: `create` now says a `backlog` ticket
stays unlabelled, and the verification expects no status label for `backlog`.

Deviations:

- D-1 one codex exec process per skill call, gate as shipped.
- D-2 cases that depend on earlier cases used fresh hand-built fixtures: A6, A9, A10, A13 to A17, A20, A23, A23b, A26, A28 to A31, and A32.
- D-3 A13's first setup used single-status fixture #84 by mistake. Only the re-run on #103 was scored.
- D-4 A32 cleared `ready` from the existing #12, #13, #22, and #28, then restored it. A check after the run read #11, #12, #13, #22, and #28 at `ready` and unassigned, #29 at `ready` held by `wilsonkichoi`, and fixtures #70 to #103 all `CLOSED`.

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-22T08:44:06-07:00  skill ref: 156a913 (feat/tracker)

PASS  18
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: B2, B3, B4, B6, B7, B9, B10, B11, B12, B12b, B13, B14, B15, B16, B17, B18, B19, and B20 in
`~/tmp/tracker-s-local`.

| Case | Verdict | Independent evidence |
|---|---|---|
| B2 | PASS | `001-ticket-a.md` parsed `id: '001'`, `status: 'backlog'`. |
| B3 | PASS | Fixtures `002` to `011`. A separate PyYAML parse of the archived files after the run read every title back as the exact string, including `'0123'`, `'null'`, `'2026-09-18'`, `'- leading dash'`, `'[bracketed] {braced}'`, and `'It''s a "mixed" quote: 100% and 日本語 ✅'`. Filenames followed the Unicode slug rule, for example `010-émoji-and-日本語-and-ünïcödé.md`. |
| B4 | PASS | `012-ticket-b.md` parsed `blocked_by: ['001']`; the body had `## Blocked by` with `- 001`. |
| B6 | PASS | `015-has-section.md` gained `blocked_by: ['001']` and `- 001`. `016-no-section.md` gained the frontmatter edge and its body stayed byte-identical. |
| B7 | PASS | After moving `001` and `012` to `ready`, the independent frontier parse read `['001']`. |
| B9 | PASS | After `001` moved to `done`, the frontier parse read `['012']`. |
| B10 | PASS | `012` held `### 2026-09-22 tracker` followed by `a note`. |
| B11 | PASS | The commit count stayed 2, and `git status --porcelain` showed only ` M docs/dev-agents/issues/012-ticket-b.md`. |
| B12 | PASS | Hand-written `099-hand.md` read as `backlog`. After the move, the new frontmatter held only `status: 'ready'` and `assignee: ''`; the body was unchanged. |
| B12b | PASS | Partial `098-partial.md` read as backlog and unassigned. The move kept `id`, `title`, and `milestone`; the assign added `assignee: 'someone'` and kept `status: 'ready'`. |
| B13 | PASS | `show 99`, `show 099`, and `show #99` all resolved to `099-hand.md`. |
| B14 | PASS | The milestone parse read only `M1`; `list ready M1` returned `098`; the unknown milestone stopped. |
| B15 | PASS | `099` stayed `ready` with `some-colleague`, off the frontier and in `list ready`. The wrong-holder refusal kept the checksum; the handover wrote `Wilson Choi`. |
| B16 | PASS | Bare assign set `012` to `in-progress` with `Wilson Choi`; the move to `ready` cleared the assignee; the frontier read `['012']`. |
| B17 | PASS | `015` had no `## Comments` before; after `show probe`, exactly one comment, with body and blocker intact. |
| B18 | PASS | `100-b18-horizontal-rule.md` parsed `status: 'backlog'`; both body `---` lines and the pasted `status: 'done'` text survived. |
| B19 | PASS | Reads showed `101: []`, `102: ['101']`, `103: ['102']`. The cycle and self-link attempts left all three checksums unchanged. |
| B20 | PASS | With `012` moved to backlog, the independent frontier read `[]`. `104`, `106`, and `107` were held for the expected reasons, and the cycle `107 -> 108 -> 109 -> 107` was named. All six checksums were unchanged; `012` was restored to `ready` and unassigned. |

Deviations:

- D-1 one codex exec process per skill call, gate as shipped.
- D-2 the scratch repository had no root commit, so the driver made a setup baseline commit and a ticket baseline commit for B11's two-commit precondition.
- D-3 B6 used the runbook's hand-written `015` and `016`. B20 used hand-written fixtures `104` to `109`.
- D-4 three unquoted prompts, the B3 brace title, B3 `0123`, and B19 `B19 Z`, were read as a title plus a status argument. Each created nothing; quoted retries created the scored fixtures. This is correct behaviour, and 0.0.25 makes it a stated rule.
- D-5 existing issue files were moved aside before the run and restored after it; the run's fixtures were cancelled through `$tracker move <id> cancel` and archived outside the repository.

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-22T08:17:07-07:00  skill ref: 156a913 (feat/tracker)

PASS  17
FAIL  1
SKIP  0

failures:
  C6  expected a refusal and CLE-22 still Backlog  actual `in reviewww` moved CLE-22 to In Review
skipped:
  none

VERDICT: RED
```

Scope: C4, C6, C7, C8, C9, C10, C11, C13, C14 first half, C15, C16, C17, C19, C20, C21, C22, C23,
and C24 in `~/tmp/tracker-cleg`, team `c-leg`, project `cleg test`.

| Case | Verdict | Independent evidence |
|---|---|---|
| C4 | PASS | CLE-21 `get_issue` read `In Progress`. |
| C6 | FAIL | CLE-22 read `Backlog` before `$tracker move CLE-22 in reviewww`, `In Review` after it, and `In Progress` after `in progress`. The child said "I will set it to Linear's `In Review` status". |
| C7 | PASS | CLE-23 and CLE-24, CLE-24 blocked by CLE-23, both `Todo`. After CLE-23 went to `Done`, `$tracker next` returned CLE-24. |
| C8 | PASS | CLE-26 `get_issue(includeRelations: true)` read `blockedBy` exactly CLE-25. |
| C9 | PASS | CLE-28 read `Duplicate`, `duplicateOf` CLE-27, `relatedTo` empty. |
| C10 | PASS | CLE-29 carried milestone `VAL-20260922-TRACKER-C10-MILESTONE`; CLE-30 had none. `list_milestones` returned the completed `VAL-20260922-TRACKER-C10-COMPLETED`. The archived-project subcheck was not measured. |
| C11 | PASS | CLE-32 `list_comments` read `runbook note` once, `hasNextPage: false`. |
| C13 | PASS | CLE-33 read `In Progress`, assignee `wilson choi`. |
| C14 first half | PASS | CLE-34 read `Todo`, assignee `wilson choi`. A `Todo` read included it; the same read with `assignee: null` excluded it. |
| C15 | PASS | CLE-35 read `Todo`, no assignee; the first `$tracker next` after the move included it. |
| C16 | PASS | CLE-36 stayed `Todo` and unassigned after the invalid assignee. |
| C17 | PASS | CLE-37 appeared in the first `next` after the move; the first `list in-progress` after the bare assign showed it `In Progress` with `wilson choi`. |
| C19 | PASS | CLE-38 had no comments before; afterwards exactly one, `show probe`. |
| C20 | PASS | CLE-44 kept all five headings, the fence `alpha {beta}`, and `café 日本語`, with `blockedBy` CLE-39 and `relatedTo` CLE-27. |
| C21 | PASS | Final reads: CLE-40 blocked by nothing, CLE-41 by CLE-40, CLE-42 by CLE-41. The reverse, three-cycle, and self-link calls left that graph unchanged. |
| C22 | PASS | CLE-50 `Todo` blocked by CLE-46 `In Review`; CLE-47 `Todo` held by `wilson choi`; CLE-51 -> CLE-48 -> CLE-49 -> CLE-51 stored. After the frontier was cleared, `$tracker next` said "Frontier is empty", named CLE-50 blocked by CLE-46 `In Review`, CLE-47 reserved by `wilson choi`, and the cycle `CLE-51 → CLE-48 → CLE-49 → CLE-51`. |
| C23 | PASS | CLE-45 read `Todo`, project `cleg test`, milestone `VAL-20260922-TRACKER-C23-MILESTONE`; the filtered read returned it. |
| C24 | PASS | `list_issues` for the exact title returned nothing, `hasNextPage: false`. |

C6 root cause. `SKILL.md` never said that a status argument must be one of the seven statuses. The
`linear.md` rule "never substitute a similar status" covers a team status that has gone missing, not
a mistyped argument, so the child mapped `in reviewww` to the nearest status. This is not from the
trim: 0.0.22 had no such rule either. Earlier C6 passes wrote `state: "in reviewww"` straight to
`save_issue` and measured the server, which does reject it with `Could not find state "in reviewww"`.
This run drove C6 through `$tracker` and exposed the gap. Fixed in 0.0.25: `SKILL.md` refuses any
status argument that is not one of the seven, compared case-insensitively with a space read as a
hyphen, lists the seven, and writes nothing. C6 now states the check through the skill. A17b and B9b
add the same check for GitHub and local.

Deviations:

- D-1 one codex exec process per skill call, gate as shipped.
- D-2 C7, C21, and C22 used hand-built relation graphs. The first C21 link attempt ran against hand-built edges and was not scored; the edges were removed and the scored sequence ran on a fresh graph.
- D-3 some children called the `codex_apps` Linear connector instead of `linear-wkc-sandbox`: C15 `next`, C17 `move`, C21's Z link, C23 `list`, and the C22 frontier reads. Both reach the same workspace, and every independent read used `linear-wkc-sandbox`.
- D-4 C22 moved the existing CLE-2, CLE-17, and CLE-19 to `Backlog` to clear the frontier, then restored them. A read after the run showed all three at `Todo` and every fixture from CLE-21 to CLE-51 in `Canceled`, `Done`, or `Duplicate`.


### 2026-09-22T01:06:12-07:00 Post-trim run at 0.0.24, Codex, VOID

Not scored. Skill ref `156a913 (feat/tracker)`. The driving Codex session started a second,
interactive Codex and sent it plain-English requests such as "Run the GitHub validation cases A5
and A6 now" instead of `$tracker <verb>` prompts. The skill never loaded for those requests. The
inner session read the skill's README and created #69 with `curl` against the REST API, which
`github.md` never prescribes, and the driver scored that as A5 PASS. The driver then stalled and
skipped every other GitHub and local case. It skipped every Linear case as "MCP needs sign-in",
but `codex mcp list` showed `linear-wkc-sandbox` signed in (`OAuth`); the unsigned server was
`linear-sekai`, which this run does not use. Transcripts:
`rollout-2026-09-22T00-45-18-01a0c813-894d-7b71-8c2c-051457882a77.jsonl` (driver) and
`rollout-2026-09-22T00-49-08-01a0c817-0c31-7cd0-90db-8e459346cd35.jsonl` (inner). Nothing in them
implicates the trimmed skill text: the one real `$tracker list ready` ran the `github.md` prelude
as written. Fixture #69 was closed.

The rule audit in that run found no rule dropped. It noted that case-insensitive status matching is
no longer stated in `linear.md`; the skill passes exact names, and the evidence section records the
matching. It also noted two facts missing from the evidence section, added there since.

### 2026-09-22T00:05:38-07:00 Re-run of A32, B15, C14, Codex

```
TRACKER VALIDATION
backend: github                  harness: codex
date: 2026-09-22T00:05:38-07:00  skill ref: 3819e4e (feat/tracker)

PASS  1
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

| Case | Verdict | Independent evidence |
|---|---|---|
| A32 | PASS | The hand-run `github.md` frontier query first returned #12, #13, #22, and #28. Removing `ready` from all four, including #13, produced `frontier: []`. Fixtures were #63 P blocked by #64 Q, #65 R reserved for `wilsonkichoi`, and #66 S in the cycle #66 -> #67 -> #68 -> #66. The independent post-fixture query returned `frontier: []` and held #63 with blocker #64, #65 with assignee `wilsonkichoi`, and #66 with blocker #67. Q was `in-review`; the skill result named the cycle through #67 and #68. Fixtures #63 through #68 were closed with `NOT_PLANNED`, and `ready` was restored on #12, #13, #22, and #28. |

Deviations:

- D-1 invocation gate lifted by editing the installed agents/openai.yaml, all cases.
- D-2 one Codex session.

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-22T00:05:38-07:00  skill ref: 3819e4e (feat/tracker)

PASS  1
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

| Case | Verdict | Independent evidence |
|---|---|---|
| B15 | PASS | Hand-written fixture `docs/dev-agents/issues/022-b15-rerun.md` started `ready` and unassigned. Independent YAML parsing after assigning `some-colleague` read `status: 'ready'` and `assignee: 'some-colleague'`. The independent frontier read excluded #022, and the independent ready-list read included it. The wrong-holder attempt refused with no write; the pre-attempt SHA-256 was `c4d42bd392caa5869ef6241b5784b25fed780594121fa79ff909c19326062b81`. Final independent parsing read `status: 'ready'` and `assignee: 'Wilson Choi'`, equal to `git config user.name`, not `me`. |

Deviations:

- D-1 invocation gate lifted by editing the installed agents/openai.yaml, all cases.
- D-2 one Codex session.

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-22T00:05:38-07:00  skill ref: 3819e4e (feat/tracker)

PASS  1
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

| Case | Verdict | Independent evidence |
|---|---|---|
| C14 first half | PASS | Fresh issue `CLE-20` was created through MCP server `linear-wkc-sandbox` in team `c-leg`, project `cleg test`, with status `Todo` and no assignee. Independent `get_issue(CLE-20, includeRelations: true)` after the explicit assignment read status `Todo`, assignee `wilson choi`, team `c-leg`, and project `cleg test`. The independent frontier reconstruction excluded CLE-20 because it had an assignee. The independent `list_issues` read for state `Todo`, team `c-leg`, and project `cleg test` included CLE-20. |

Deviations:

- D-1 invocation gate lifted by editing the installed agents/openai.yaml, all cases.
- D-2 one Codex session.


### 2026-09-21T23:47:33-07:00 Targeted 0.0.21 run, Codex

```
TRACKER VALIDATION
backend: github                  harness: codex
date: 2026-09-21T23:47:33-07:00  skill ref: e945bef (feat/tracker)

PASS  8
FAIL  0
SKIP  1

failures:
  none
skipped:
  A32  precondition was not met: independent next read still returned existing issue #13

VERDICT: RED
```

Scope: A6, A9, A10, A12, A20, A28, A29b, A30, and A32. All invocations used the installed
`.agents/skills/tracker/SKILL.md` under `~/tmp/tracker-val-a3`, confirmed by the returned installed
skill path. The backend was `wilsonkichoi/tracker-gh`.

| Case | Verdict | Independent evidence |
|---|---|---|
| A6 | PASS | Fixtures #47 and #48. `gh issue view 48 --repo wilsonkichoi/tracker-gh --json blockedBy --jq '[.blockedBy.nodes[].number]'` read `[47]`; the blocker read had no blockers. |
| A9 | PASS | After `gh issue view 47` and `48` reads, the primary-store `gh issue list --state open` query returned frontier containing #47 and held #48 behind open #47. |
| A10 | PASS | After `gh issue view 47` read `state: OPEN`, `gh issue close 47 --reason completed`, and verification read `state: CLOSED,stateReason: COMPLETED`, the same primary-store query returned #48 in the frontier. Its blocker node remained #47 with `state: CLOSED` and `totalCount: 1`. |
| A12 | PASS | Fixture #50. `gh issue view 50 --repo wilsonkichoi/tracker-gh --json labels` read `ready,in-progress`; independent `next`, `list ready`, and `list backlog` outputs put #50 in `inconsistent`, and `show 50` named both labels. |
| A20 | PASS | Fixture #51. `gh issue view 51 --repo wilsonkichoi/tracker-gh --json assignees` read `[]` after bare assign then move to backlog. |
| A28 | PASS | Fixture #52. The wrong `from` read refused without a write. After bare `assign 52 none`, `gh issue view 52 --repo wilsonkichoi/tracker-gh --json assignees` read `[]`. |
| A29b | PASS | Fixture #53. `gh issue view 53 --repo wilsonkichoi/tracker-gh --json assignees,labels` read assignee `wilsonkichoi` and label `ready`; the independent frontier read excluded #53 and `list ready` included it. |
| A30 | PASS | Fixture #54. The first `show` read `comments: []`; after the comment, `gh issue view 54 --repo wilsonkichoi/tracker-gh --json comments --jq '[.comments[].body]'` read exactly `Codex A30 show probe`, and the second `show` contained the ticket and one comment with author. |
| A32 | SKIP | The hand-built fixtures were #55 P blocked by #56 Q, #57 R reserved, and #58 S in the #58 -> #59 -> #60 -> #58 cycle. The independent precondition query returned frontier `[#13]`, so the case could not run. |

Part 1 audit:

- CHANGED: `SKILL.md` changed `create` from one generic ordering rule to backend-specific behavior that may write edges with `backlog` and applies the requested status only after edge verification. Cases A6, C20, C23, and C24 cover this change.
- CHANGED: `local.md` now permits one file write containing the requested status and `blocked_by`, instead of describing a backlog write followed by a later status application. Cases B2 and B4 cover the relevant file state.
- CHANGED: `linear.md` now creates at `Backlog`, verifies relations, then applies the requested status. The old text described one `save_issue` with the requested state and relations together. Cases C20, C23, and C24 cover this change.
- DROPPED: the status table's `Who moves a ticket into it` column and its actor guidance. No listed case covers it.
- DROPPED: the local setup warning that local is single-session. No listed case covers setup messaging.
- DROPPED: the GitHub note that sub-issues are deferred until `plan` is ported. No listed case covers sub-issues.
- DROPPED: the `implement`-specific example in the loose ticket-shape rule. The general one-line-ticket rule remains.
- Retained in the new text: backend stop conditions, one-sibling resolution, numeric IDs, terminal states, inconsistent status handling, milestone stops, primary-store reads, pagination limits, the shared GitHub jq status prelude, blocker null and truncation guards, exact body verification, assignment and move command shapes, comment verification, native dependency IDs, Linear status-name matching, warning reads, pagination, archive handling, relation walks, milestone resolution, duplicate transition errors, local frontmatter boundaries, quoting, identity, slugs, partial fields, per-verb file operations, YAML re-reads, and the no-commit rule.
- No finding: measurements, dates, history, and backend error strings removed from the skill files were found in `validation/tracker.md`, as expected.

Deviations:

- D-1 invocation gate lifted by editing the installed agents/openai.yaml, all cases.
- D-2 one Codex session, not one process per command.
- D-3 A32's frontier precondition was set by hand, but existing #13 was not cleared. A32 is SKIP, never PASS.
- D-4 GitHub fixtures #47, #48, and #50 through #62 were closed as `not planned` after the reads. Existing ready labels on #11, #12, #22, #28, and #29 were restored.

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-21T23:47:33-07:00  skill ref: e945bef (feat/tracker)

PASS  2
FAIL  1
SKIP  0

failures:
  B15  expected assignee `Wilson Choi`  actual `me`
skipped:
  none

VERDICT: RED
```

Scope: B2, B4, and B15 in `~/tmp/tracker-s-local`. The installed skill path was confirmed as
`/Users/wchoi/tmp/tracker-s-local/.agents/skills/tracker/SKILL.md`.

| Case | Verdict | Independent evidence |
|---|---|---|
| B2 | PASS | Fresh fixture `docs/dev-agents/issues/019-codex-b2-ticket-a-1790059066256.md`. The runbook PyYAML parse read `id: '019'` and `status: 'backlog'`. |
| B4 | PASS | Fresh fixtures #019 and #021. The runbook PyYAML parse of `docs/dev-agents/issues/021-codex-b4-corrected-1790059198059.md` read `blocked_by: ['019']`; the body read `## Blocked by` with `#019`. |
| B15 | FAIL | Hand-set fixture `docs/dev-agents/issues/018-b15-reservation.md`. Independent PyYAML parse after the final explicit assign read `status: 'ready'` and `assignee: 'me'`; `git config user.name` reads `Wilson Choi`. The wrong `from` form left the file unchanged before the final write. |

Part 1 audit: same audit result as the GitHub block above. B2 and B4 were run because the local
create rule changed. B15 was run because the explicit assignment rule was in scope.

Deviations:

- D-1 invocation gate lifted by editing the installed agents/openai.yaml, all cases.
- D-2 one Codex session, not one process per command.
- D-3 B15's `ready` and unassigned precondition was hand-written in `018-b15-reservation.md`, as required by the case dependency.
- D-4 The first B4 fixture used blocker `016` by mistake. It was not scored. Corrected fixture #021 used blocker `019` and was scored.

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-21T23:47:33-07:00  skill ref: e945bef (feat/tracker)

PASS  4
FAIL  0
SKIP  2

failures:
  none
skipped:
  C14 second half  [MANUAL] needs a second workspace identity
  C25  [MANUAL] skipped as instructed

VERDICT: GREEN
```

Scope: C14 first half, C20, C23, C24, and the requested no-status list call check in
`~/tmp/tracker-cleg`, team `c-leg`, project `cleg test`, MCP server `linear-wkc-sandbox`. The
installed skill path was confirmed as `/Users/wchoi/tmp/tracker-cleg/.agents/skills/tracker/SKILL.md`.

| Case | Verdict | Independent evidence |
|---|---|---|
| C14 first half | PASS | Fixture `CLE-16`. `get_issue(id: CLE-16, includeRelations: true)` read `assignee: wilson choi`, `status: Todo`, and `project: cleg test`. The Todo list read contained CLE-16, which is the independent `list ready` result. |
| C20 | PASS | Fixtures `CLE-17` and `CLE-18`. `get_issue(CLE-18, includeRelations: true)` read status `Backlog`, native `blockedBy: [CLE-17]`, all requested headings in order, unchanged fenced code contents, and unchanged non-ASCII text. |
| C23 | PASS | Fixture `CLE-19`. `get_issue(CLE-19, includeRelations: true)` read project `cleg test`, milestone `Codex C23 M1 1790059329815`, and status `Todo`. The independent Todo list with project and `projectMilestone` fields contained CLE-19. |
| C24 | PASS | No issue matched the exact C24 title in the independent Backlog list. The exact tracker error was `Error: Could not find issue "CLE-99999" for blockedBy`, with `isError: true`; no warnings field or issue was returned. |
| C14 second half | SKIP | [MANUAL] second workspace member required. |
| C25 | SKIP | [MANUAL] skipped as instructed. |

Auxiliary no-status list check, not scored as C25: `list_issue_statuses(team: "c-leg")` returned
Backlog, Todo, Ready to Merge, In Review, In Progress, Done, Canceled, and Duplicate. Exactly one
`list_issues` call was made for each of Backlog, Todo, Ready to Merge, In Review, and In Progress,
with no call for Done, Canceled, or Duplicate. All five pages returned `hasNextPage: false`.

Part 1 audit: same audit result as the GitHub block above. C20, C23, and C24 were added because
the Linear create ordering changed.

Deviations:

- D-1 invocation gate lifted by editing the installed agents/openai.yaml, all cases.
- D-2 one Codex session, not one process per command.
- D-3 C14, C20, C23, and C24 used fresh fixtures. CLE-16 and CLE-17 were created directly with `save_issue`; the C23 milestone was created directly with `save_milestone`.
- D-4 C25 and the C14 second half were skipped as instructed.


### 2026-09-21T16:42:13-07:00 Cycle and empty-frontier cases on all three backends, Codex

```
TRACKER VALIDATION
backend: github                  harness: codex
date: 2026-09-21T16:42:13-07:00  skill ref: cf4dd0d (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-21T16:42:13-07:00  skill ref: cf4dd0d (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-21T16:42:13-07:00  skill ref: cf4dd0d (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: A31, A32, B19, B20, C21, and C22, the six cases `cf4dd0d` added. No other case was scored.

Every command ran through `codex exec` (Codex 0.155.1), one process per command, with the prompt
`$tracker <verb> ...` typed as the runbook writes it. The invocation gate was left as shipped. Three
directories were reinstalled from `feat/tracker` and each compared with `git archive cf4dd0d` by
`diff -r`: identical. They were `~/tmp/tracker-val-a3` (`github_repo: wilsonkichoi/tracker-gh`),
`~/tmp/tracker-s-local` (new, `issue_tracker: local`), and `~/tmp/tracker-cleg` (team `c-leg`,
project `cleg test`, server `linear-wkc-sandbox`). All 17 Codex transcripts from 16:16 to 16:39
show the project's own `.agents/skills/tracker/SKILL.md` injected, carrying the `cf4dd0d` text,
and no plugin skill file read.

| Case | Verdict | Independent evidence |
|---|---|---|
| A31 | PASS | Fixtures #38 X, #39 Y, #40 Z. The first two links landed. `link 38 blocked-by 40` was refused as `#38 → #40 → #39 → #38`, and `link 38 blocked-by 38` as a self-link. `gh issue view` read `#38 []`, `#39 [38]`, `#40 [39]` afterwards. Neither refused run made a `POST`; the only match in their output is the template text from `github.md`. |
| A32 | PASS | Frontier cleared by removing `ready` from #12, #13, #22 and #28. Fixture: P #43 blocked by Q #44 at `in-review`, R #45 reserved for `wilsonkichoi`, and S #46 in the cycle #46 → #41 → #42 → #46, built with `gh api`. GitHub accepted the cycle's third edge. The `next` query run by hand returned `frontier: []` and `held` #11, #29, #43, #45, #46. The reply said the frontier is empty and named all five: #43 behind #44 at `in-review`, unassigned; #45 and #29 assigned to `wilsonkichoi`; #11 behind #9 at `backlog`; and #46 in the cycle `#46 → #41 → #42 → #46`. It also named the inconsistent #23. |
| B19 | PASS | Fixtures 001 X, 002 Y, 003 Z, hand-written. The first two links landed. `link 1 blocked-by 3` was refused as a cycle, and `link 1 blocked-by 1` as a self-link. A PyYAML parse read `001 []`, `002 ['001']`, `003 ['002']`. |
| B20 | PASS | Fixture 010 to 015, hand-written as the case lists. The reply said the frontier is empty and named 010 behind 011 at `in-review`, unassigned; 012 reserved for `someone-else`; and 013 in the cycle `#013 → #014 → #015 → #013`. `cksum` over every issue file matched before and after. |
| C21 | PASS | Fixtures CLE-7 X, CLE-8 Y, CLE-9 Z. The first two links landed. The reverse edge `link CLE-7 blocked-by CLE-8` was refused as `CLE-7 → CLE-8 → CLE-7`, the three-issue cycle as `CLE-7 → CLE-9 → CLE-8 → CLE-7`, and the self-link as such. `get_issue` read CLE-7 `blockedBy []`, CLE-8 `[CLE-7]`, CLE-9 `[CLE-8]`, so Linear never got the chance to flip the Y edge. The three refused runs made no `save_issue` call. |
| C22 | PASS | CLE-2 moved from `Todo` to `Backlog` to empty the frontier. Fixture: P CLE-13 blocked by Q CLE-10 at `In Review`, R CLE-11 assigned to you, and S CLE-15 in the cycle CLE-15 → CLE-14 → CLE-12 → CLE-15, every relation read back with `get_issue`. The reply said the frontier is empty and named CLE-11 held by `wilson choi`, CLE-13 behind CLE-10 at `In Review`, and CLE-15 in the cycle `CLE-15 → CLE-14 → CLE-12 → CLE-15`. It made five `get_issue`, two `list_issues` and one `list_issue_statuses` call, and no write. |

Deviations from the reusable procedure:

- **D-1.** Each command was a separate `codex exec` process, not a turn in one interactive session.
  This tests each verb cold, from the skill text alone, which is stricter than a session that
  remembers earlier turns.
- **D-2.** A32, B20 and C22 ran without the rest of their legs. The frontier was emptied by hand
  instead: `ready` removed from four GitHub issues, and CLE-2 moved to `Backlog`. All five were
  restored afterwards.
- **D-3.** The local directory had no `setup` run. Its config was written by hand from
  `config-template.md`, since no case here tests `setup`.
- **D-4.** The first B20 attempt hung on `Reading additional input from stdin...` and never
  started a model turn, so there was nothing to score. It was re-run with stdin closed.

Notes, neither a verdict nor a finding:

- B19's refusal printed the path as `#3 → #2 → #1`, the chain from the blocker to the blocked
  ticket. A31 and C21 printed the closed loop. Both name the path, which is what the case checks.
- C22 gave CLE-10's status but not its assignee. It has none. The GitHub and local replies said
  "unassigned" for the same shape. `SKILL.md` asks for both, and no case checks the assignee.

Teardown: GitHub #38 to #46 closed as not planned, and `ready` restored on #12, #13, #22 and #28.
Linear CLE-7 to CLE-15 moved to `Canceled`, and CLE-2 back to `Todo`.

### 2026-09-21T15:12:23-07:00 S4/S5 targeted run, Codex

```
TRACKER VALIDATION
backend: none                    harness: codex
date: 2026-09-21T15:12:23-07:00  skill ref: d68ce35 (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: S4 and S5 alone, the two cases `d68ce35` added for F25. No leg was run, and no backend was
configured at any point.

Directory `~/tmp/tracker-s4`, installed from `feat/tracker`. A `diff -r` of
`.agents/skills/tracker` against the source tree at `d68ce35` found them identical, so the
invocation gates were as shipped and every command was typed. Codex 0.155.1, with the
`dev@agent-toolkit` plugin still enabled. Both transcripts
(`rollout-2026-09-21T15-06-38-01a0c601-bf1d-7241-bb12-082175c5cd16.jsonl` and
`rollout-2026-09-21T15-10-15-01a0c605-0dda-7ca3-b81e-64df1586e941.jsonl`) show the project skill
fired. The only files read were `tracker-s4/.agents/skills/tracker/SKILL.md` and
`docs/dev-agents/config.md`. No backend file and no plugin skill file was read. The plugin appears
only in the skill catalog the model was given.

| Case | Verdict | Independent evidence |
|---|---|---|
| S4 | PASS | `$tracker list` and `$tracker create Probe` each replied that `docs/dev-agents/config.md` does not exist and to run `$setup`. The `create` reply added "No ticket was created." The `find ... -newer skills-lock.json -print` check printed nothing. |
| S5 | PASS | With the config set to `issue_tracker: jira`, both commands replied that `jira` is unsupported and to run `$setup`. `cksum` read `3660788880 28` before and after. The `find ... -newer docs/dev-agents/config.md -print` check printed nothing. `docs/` was removed after the case. |

Deviations from the reusable procedure:

- **D-1.** S4's `ls -A` was not run. The `find` check lists new directories as well as new files,
  so a `docs/` or `.dev/` would have shown up there. This changes no verdict.
- **D-2.** S5's replies told the user to configure `github`, `linear`, or `local`, and left out
  `other`. The case does not check which backends the reply lists, and `setup` offers all four.
  This is a note, not a finding.

### 2026-09-21T14:57:37-07:00 Local B2/B3 targeted re-run, Codex

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-21T14:57:37-07:00  skill ref: 69d7353 (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: B2 and B3 alone, not a Local leg. The last Local run was at `62e98db`, and `6adbf5d`
changed `local.md` after it. That commit defined alphanumeric in the slug rule as a Unicode letter
or digit (F18), and moved the full ten-filename check from B2 into B3 (F17). Neither B2's
filename check nor B3's slug check had run against the current text. No other B case was scored.

Directory `~/tmp/tracker-b3b`, installed from `feat/tracker`. A `diff -r` against
`git archive 69d7353 skills/tracker skills/setup` found the install identical, so the invocation
gates were as shipped and every command was typed. The Codex transcript
(`rollout-2026-09-21T14-46-58-01a0c5ef-bc89-7110-82bd-49311faee83c.jsonl`) confirms the project
skills ran: it reads `tracker-b3b/.agents/skills/setup/SKILL.md`, `config-template.md`,
`tracker/SKILL.md` and `tracker/local.md`, and no `dev@agent-toolkit` skill file.

Setup took `git init`, Local markdown, the Section B defaults, `AGENTS.md`, and no test command,
and committed root commit `d4a224a`. It adds `AGENTS.md`, `CLAUDE.md`, `docs/dev-agents/config.md`,
and the `rules/` and `issues/` `.gitkeep` files. The config holds `issue_tracker: local` and
`issues_dir: docs/dev-agents/issues/`. The eleven tickets are untracked, as `local.md` requires.

| Case | Verdict | Independent evidence |
|---|---|---|
| B2 | PASS | `001-ticket-a.md` exists. A PyYAML parse of the block between the first two `---` lines returned `id` as the string `'001'`, `status` as the string `'backlog'`, and `title` as `'Ticket A'`. |
| B3 | PASS | All ten titles parsed as `str`, and each one's UTF-8 bytes equal the title sent, including `0123`, `null`, `2026-09-18`, `- leading dash`, both quote forms, the emoji, the CJK, and the accented Latin. Each file's `id` is the zero-padded string of its number, from `'002'` to `'011'`. All ten filenames equal the slug rule's output, computed independently with Unicode `\w` minus underscore. That includes `010-émoji-and-日本語-and-ünïcödé.md` and `011-it-s-a-mixed-quote-100-and-日本語.md`, not the `[a-z0-9]` reading `010--and--and-.md`. |

Deviations from the reusable procedure:

- **D-1.** The eleven `$tracker create` commands were sent in one Codex prompt that listed each
  command, not as eleven separate turns. The transcript shows one read of `local.md` and eleven
  files, each with its own id. B3 checks what lands on disk, so this changes no verdict.
- **D-2.** Codex's `dev@agent-toolkit` plugin stayed enabled. Its `dev:setup` description was in
  the skill listing the model saw, but no plugin skill file was read and nothing in its format was
  written: there is no `.agent-toolkit/` or `.dev/` in the directory.
- **D-3.** An earlier attempt in `~/tmp/tracker-b3` is void and was not scored. The person typed
  `$dev:setup`, which is the plugin's `setup`, not this repository's. It wrote `.agent-toolkit/dev.md`
  and `.dev/tasks/`, and ran no `git init`. The later `$tracker create` calls then fired the
  project's `tracker` skill in a directory with no `docs/dev-agents/config.md`. That exposed F25.

#### Findings

**F25. `tracker` does not say what to do when `docs/dev-agents/config.md` is missing. (skill defect.)**
In the void `~/tmp/tracker-b3` attempt, Codex loaded `tracker-b3/.agents/skills/tracker/SKILL.md`.
It found no `docs/dev-agents/config.md`, called the skill's config path "obsolete", and wrote
eleven tickets as `.dev/tasks/T-NNN-*.md` in the plugin's format instead. It reported
`Created Ticket A as T-001`. No `tracker` verb can read those files. `tracker/SKILL.md` section 1
says to read `issue_tracker` from the config, and nowhere says what happens when the file is
absent: `grep` for missing, absent, or setup finds nothing. The fix is a stop in section 1: with no
config, or no `issue_tracker` in it, write nothing, and tell the user to run `setup` with the
harness's own prefix. A later leg needs a case for it, run in a directory with no config.

### 2026-09-21T14:57:37-07:00 GitHub A5/A6 targeted re-run, Claude Code

```
TRACKER VALIDATION
backend: github                  harness: claude-code
date: 2026-09-21T14:57:37-07:00  skill ref: 69d7353 (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: A5 and A6 alone, not a GitHub leg. The last GitHub run was at `713f017`. Since then,
`c954b3f` changed `create`'s verification row in `tracker/SKILL.md`: it now compares sections and
their contents, not bytes. `github.md` has not changed since `713f017`. No other A case was scored.

Directory `~/tmp/tracker-val-a3`, a clone of `wilsonkichoi/tracker-gh` with
`github_repo: wilsonkichoi/tracker-gh`. Its install was older than `713f017` and was reinstalled
from `feat/tracker` before the run. A `diff -r` against `git archive 69d7353` then found it
identical, gates as shipped. `gh` was authenticated as `wilsonkichoi`.

| Case | Verdict | Independent evidence |
|---|---|---|
| A5 | PASS | #33 `A5 re-run ticket A`, `OPEN`, labels `[]`, so it is at `backlog` with no status label. `gh issue view 33 --repo wilsonkichoi/tracker-gh --json body \| jq --rawfile sent /tmp/a5-body.md -e '.body == $sent'` printed `true` at exit 0. |
| A6 | PASS | #34 `A6 re-run ticket B`, `OPEN`, labels `[]`. `gh issue view 34 --repo wilsonkichoi/tracker-gh --json blockedBy --jq '[.blockedBy.nodes[].number]'` returned `[33]`. |

Deviations from the reusable procedure:

- **D-1.** Both body files were saved with every line indented by two spaces, carried in from the
  copy. A5's comparison is against the file as saved, so it still tests that `create` stores the
  body unchanged. A6's `## Blocked by` heading was indented too, and `create` still found it and
  wrote the edge.
- **D-2.** `/tmp/a6-body.md` still held the placeholder `- #<A>` under `## Blocked by`, because it
  was not replaced before the run. The prompt tied B to the A5 ticket, and the skill wrote
  `- #33` into #34's body and the edge to #33. So #34's body is not byte-identical to its file,
  which A6 does not check. The placeholder was the runbook operator's slip, not a skill defect.

Issues #33 and #34 remain open on `wilsonkichoi/tracker-gh`.

### 2026-09-21T13:20:58-07:00 Harness parity leg D, Claude Code, Codex, Kiro CLI

Complete. The person at the keyboard ran every step and reported what they watched; this entry
records it.

```
TRACKER VALIDATION
backend: local                   harness: claude-code, codex, kiro-cli
date: 2026-09-21T13:20:58-07:00  skill ref: 69d7353 (feat/tracker)

PASS  8
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Pre-flight, before step 1. Both scratch directories, `~/tmp/tracker-legd` and
`~/tmp/tracker-legd-codex`, were installed from `feat/tracker`, and `skills-lock.json` in each
records that ref. `git archive 69d7353 skills/tracker skills/setup`, which is the fetched head of
`origin/feat/tracker`, was extracted and compared with each directory's `.agents/skills/` using
`diff -r`. Both were identical, so the invocation gates are **as shipped** in both, as leg D
requires. `.claude/skills/` and `.kiro/skills/` are symlinks into `.agents/skills/` in both
directories. Neither directory had a `.git`.

Observation sheet. The person at the keyboard asked for the step 1 lines to be filled from the
session transcript. So the step 1 lines below are transcribed from the tool calls the session
made, not from a separate observer's notes; see D-2. Steps 2 to 4 are the person's own
observations.

```
step 1, Claude Code, first directory
D5 Claude Code:             screen 1 carried = the git init offer alone (one-question picker: "Yes, git init (Recommended)" / "No"),
                            screen 2 = Section A alone (one-question picker: Local markdown (Recommended), GitHub, Linear, Other),
                            screen 3 = Section B alone (one-question picker: Defaults (Recommended), Custom paths)
                            then Section C alone, Section D alone, then the step 7 commit offer alone
D4 Claude Code:             form of the Section A question = Claude Code's own picker (AskUserQuestion), single-select,
                            four numbered options, recommended first and labelled "(Recommended)";
                            digit accepted = not tried, answered with the arrow keys
D6 Claude Code:             harness state at Section A = observer does not recall; the picker was the last call
                            in the turn, and the answer came back through it
D2 Claude Code list ready:  output = one row, 001 | legD parity probe | ready | none | none,
                            file docs/dev-agents/issues/001-legd-parity-probe.md
step 2, Codex, first directory
D1 Codex list ready:        output = one row, 001 | legD parity probe | ready | none | none,
                            file docs/dev-agents/issues/001-legd-parity-probe.md
step 3, Kiro CLI, first directory
D3 Kiro menu:               tracker description rendered as = full description, truncated by terminal width only:
                            "/tracker       Read and write ticket state in this project's issue tracker,
                            whether that is GitHub Issues, Linear, or local markdown files. Use it to
                            list, show, create, assign, comme..." — no colon truncation, no ">" substitution
D3 Kiro list ready:         output = one row, 001 | legD parity probe | ready | none | none,
                            file docs/dev-agents/issues/001-legd-parity-probe.md
step 4, Codex, second directory
D4 Codex:                   form of the Section A question = numbered text options, one question,
                            recommended option first; digit accepted = yes, `1` selected Local markdown
D6 Codex:                   harness state at Section A = idle and waiting for a plain reply; no tool call
                            or work ran while the question was outstanding
anything surprising:        step 1 ran in the same Claude Code session that had read this runbook; see D-1.
                            `/tracker create` was typed with no ticket, and the skill asked for one
                            through a picker instead of inventing it.
```

Evidence, from independent reads and the person's observations:

- **Setup.** `git log --oneline` in `~/tmp/tracker-legd` shows one root commit, `db0127d chore: set
  up dev-agents config with the local tracker`. It adds `AGENTS.md`, a one-line `CLAUDE.md` with
  `@AGENTS.md`, `docs/dev-agents/config.md`, and `.gitkeep` files in `rules/` and `issues/`.
  The config holds `issue_tracker: local`, `context_file: AGENTS.md`,
  `issues_dir: docs/dev-agents/issues/`, and the three default product-doc paths, with no
  `test_command`. These match the answers the leg prescribes. The installed skills were left
  untracked, which was the answer chosen at the commit offer.
- **Create.** `docs/dev-agents/issues/001-legd-parity-probe.md` exists and is untracked, as
  `local.md` requires: the tracker does not commit. A YAML re-parse of its frontmatter returned
  `id: '001'`, `title: 'legD parity probe'`, `status: 'ready'`, `assignee: ''`, and
  `blocked_by: []`, all as strings or a list.
- **D2.** The only file in `issues_dir` is ticket 001 at `ready`, and the list output named exactly
  that ticket. Ticket id for steps 2 and 3: **001**.
- **D1.** `$tracker list ready` returned the same ticket, `001`, from the first scratch directory;
  no setup re-run occurred.
- **D4 and D6 Codex.** In the second directory, `$setup` presented the Section A choices as one
  numbered text question, with Local markdown first and recommended. The user typed `1`, and the
  answer was accepted. The Codex turn ended at the question and waited for the reply; no tool call
  or setup work ran while the question was outstanding. Setup was abandoned after Section A, as
  the procedure allows.
- **After the run.** `~/tmp/tracker-legd-codex` has a `.git` with no commits, from the accepted
  `git init` offer, and no `docs/` directory. The abandoned setup wrote no config or scaffold.
  `~/tmp/tracker-legd` still has the one root commit `db0127d`, and ticket 001 is the only
  change outside the installed skills, so steps 2 and 3 wrote nothing. A second `diff -r` against
  the `69d7353` archive found both directories' `.agents/skills/` still identical, so the
  invocation gates stayed as shipped through the whole leg.

| Case | Verdict | Independent evidence |
|---|---|---|
| D5 | PASS | The transcript shows the git init offer, Sections A to D, and the commit offer each in a separate one-question picker, in that order. No picker carried more than one question. |
| D4 Claude Code | PASS | The Section A question used Claude Code's own picker, with the recommended option first. D4 accepts the harness's own picker in place of numbered text, so the digit half does not apply here. The observer answered with the arrow keys. |
| D6 Claude Code | PASS | The observer does not recall the harness state. The verdict rests on the transcript. Every question, Section A included, was asked through the picker as the last call in its turn, with nothing running alongside it. Each answer came back as the picker's result, which a modal picker only returns when it was on screen waiting. A queued reply cannot happen through the picker. |
| D4 Codex | PASS | Section A used one numbered text question, with Local markdown first and recommended. The user typed `1`, and Codex accepted it. |
| D6 Codex | PASS | The Codex turn ended at the Section A question and waited for the reply. No tool call or setup work ran while the question was outstanding. |
| D2 | PASS | Ticket 001 at `ready` on disk, confirmed by a YAML re-parse, is the one row `/tracker list ready` returned. |
| D1 | PASS | `$tracker list ready` returned ticket 001 from the first scratch directory, with the same title, status, assignee, blocker state, and file path as D2. |
| D3 | PASS | The slash-command menu showed `/tracker` with its full description text, truncated only by terminal width. No colon truncation and no `>` substitution. `/tracker list ready` returned ticket 001, matching D1 and D2. |

Deviations from the reusable procedure:

- **D-1.** Step 1 ran in a Claude Code session that had already read this runbook, including the
  expected results for D4 to D6, before `/setup` was typed. The model under test knew what a pass
  looked like. The session said so on screen 1, before the git init offer. The person running the
  leg accepted this and asked for the verdicts to stand on the observed behaviour.
  It is recorded so a later run can compare against a fresh session.
- **D-2.** The same session was both the harness under test and the log writer. The step 1 sheet
  lines came from its transcript at the person's request, not from an outside observer's notes,
  which is the self-assessment `How to score` warns about. The transcript can show which questions
  each screen carried. It cannot show the harness's idle state or how the answer was keyed.

### 2026-09-19T23:27:50-07:00 Linear C18 targeted re-run, Codex

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-19T23:27:50-07:00  skill ref: df55ff9 (feat/tracker)

PASS  1
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: this was a targeted re-run of C18 alone, not a Linear leg. No other case was scored.
The server was `linear-wkc-sandbox` for every Linear call. Every issue query was limited to
team `c-leg` and project `cleg test`, except `get_issue` and `list_comments`, which take the
specific issue id. No call read or wrote team `dev` or project `skills test`.

Before the case, `git archive df55ff9 skills/tracker skills/setup` was extracted into a temporary
directory and compared with `/Users/wchoi/tmp/tracker-cleg/.agents/skills/` using `diff -r`.
Exactly four differences appeared, the two invocation gates per skill: committed `SKILL.md`
has `disable-model-invocation: true`, absent from the install; committed
`agents/openai.yaml` has `allow_implicit_invocation: false`, while the install has `true`.
No fifth difference or backend-file difference appeared. These gates change no verb.
The existing config was read and named `issue_tracker: linear`, `linear_team: "c-leg"`, and
`linear_project: "cleg test"`. Setup was not run.

An independent `get_issue {id: "CLE-3", includeRelations: true}` confirmed the fixture before
scoring: CLE-3 `legC3-C18-archive` belonged to `c-leg` and `cleg test`, had status `Done`, and
had `archivedAt: 2026-09-20T06:17:45.980Z`. It was still in Recently deleted, not restored.

| Case | Verdict | Independent evidence |
|---|---|---|
| C18 | PASS | Independent complete Done lists scoped to `c-leg` and `cleg test` returned zero issues with `includeArchived: false` and CLE-3 with `includeArchived: true`. The latter returned status `Done` and `archivedAt: 2026-09-20T06:17:45.980Z`. The pre-score `get_issue` independently confirmed the same status and timestamp. The skill's `list done` returned CLE-3 marked archived with that timestamp; its `show CLE-3` returned the full issue, marked archived, and zero comments. The separate `list ready` query left `includeArchived` unset. |

The skill's actual `$tracker list done` call was
`list_issues {team: "c-leg", project: "cleg test", state: "Done", includeArchived: true, fields: ["id", "title", "status", "assignee", "url", "archivedAt"], limit: 250}`.
It returned only CLE-3 and `hasNextPage: false`. The skill did not list every state to find it.
Its `$tracker show CLE-3` path called
`get_issue {id: "CLE-3", includeRelations: true}` and
`list_comments {issueId: "CLE-3", limit: 250}`, which returned zero comments and
`hasNextPage: false`. Its `$tracker list ready` call was
`list_issues {team: "c-leg", project: "cleg test", state: "Todo", fields: ["id", "title", "status", "assignee", "url"], limit: 250}`.
It omitted `includeArchived` and returned CLE-2 with `hasNextPage: false`.

Deviations from the reusable procedure:

- **D-1.** The four installed invocation-gate differences described above were present. They
  were expected for this run and changed no tracker verb.
- **D-2.** This re-run used the existing soft-deleted CLE-3 fixture. It did not repeat the
  Linear UI Delete action, create an issue, run setup, or test another C case. The runbook's
  broader auto-archive policy question remains subject to F22; this targeted read did not
  establish that policy.
- **D-3.** C18's procedure says `linear.md` never mentions archiving. The installed backend
  file now contains an `Archived issues` section. See F24.

**F23 closed for C18 at df55ff9.** Terminal Done lists now pass `includeArchived: true`, request
`archivedAt`, and disclose CLE-3. The open Ready list did not pass `includeArchived`. This
conclusion covers the tested read paths and fixture, not the workspace auto-archive policy.
No issue or project was created, changed, restored, or deleted. Nothing was committed or pushed.

#### Findings

**F24. C18's explanation is stale after the F23 fix. (C18, runbook defect.)**
The reusable C18 procedure says `linear.md` never mentions archiving. At skill ref `df55ff9`,
`linear.md` has an `Archived issues` section that prescribes `includeArchived: true` and
`archivedAt` for terminal lists. The procedure's expectation remains testable, but that
sentence now describes the prior skill. This run recorded the defect here and did not edit
the procedure above the Run log.

### 2026-09-19T23:11:10-07:00 Linear outstanding manual cases, Codex

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-19T23:11:10-07:00  skill ref: 676c203 (feat/tracker)

PASS  4
FAIL  1
SKIP  0

failures:
  C18  expected CLE-3 reported by list done, or archived exclusion stated  actual empty Done list with no archive warning; show CLE-3 returned the issue
skipped:
  none

VERDICT: RED
```

Scope: the five outstanding manual Linear cases C1, C2, C3, C5, and C18 in
`/Users/wchoi/tmp/tracker-cleg`. C1, C2, C3, and C5 passed independent checks. C18's
read-only and archived halves ran. C18 failed because `$tracker list done` silently omitted
CLE-3, while `$tracker show CLE-3` returned the full issue. No other C case was scored. The user
soft-deleted CLE-3 in Linear's UI; no item was permanently deleted. Nothing was committed or pushed.

The `linear-wkc-sandbox` server answered `list_teams` before any other work, returning only the
requested `c-leg` team for that query. Every Linear call used that server. No call read or wrote
the earlier `dev` team or `skills test` project. The project fixture call was
`save_project {name: "cleg test", addTeams: ["c-leg"]}`. It created project
`125f6c76-eedb-4c6e-acda-3455a165731d` on team `c-leg`, key `CLE`.

Before scoring, `git archive 676c203 skills/tracker skills/setup` was extracted into a temporary
directory and compared with `.agents/skills/` using `diff -r`. Exactly four expected differences
appeared, two per skill: committed `SKILL.md` has `disable-model-invocation: true`, absent from the
install; committed `agents/openai.yaml` has `allow_implicit_invocation: false`, while the install
has `true`. No backend file differed. The same four differences remained after the cases. Both
`.claude/skills/` and `.kiro/skills/` link to `.agents/skills/`. This is one invocation-gate
deviation, D-1, and changes no verb.

| Case | Verdict | Independent evidence |
|---|---|---|
| C1 | PASS | The first `list_issue_statuses {team: "c-leg"}` returned exactly six default statuses and no In Review. Setup took the authorized `git init` offer, stopped on the missing In Review `started` status, and the first config read had neither `linear_team` nor `linear_project` or a deferred setup promise. After gate 1, the status list held the seven required exact name/category pairs. Setup completed without mapping questions. The config read held `issue_tracker: linear`, `linear_team: "c-leg"`, and `linear_project: "cleg test"`; a copy was saved before C3. |
| C3 | PASS | After gate 2, `list_issue_statuses` showed Ready to Merge as an extra `started` status. Setup named the extra status and warned that its tickets are invisible to the frontier. An independent config read found that warning under `## Tracker notes`. Direct `save_issue {id: "CLE-1", state: "Ready to Merge"}` parked a ready ticket there; `get_issue` confirmed it. Both `$tracker list` and `$tracker next` named CLE-1 as unmapped at Ready to Merge, rather than counting or silently dropping it. |
| C2 | PASS | After gate 3, `list_issue_statuses` showed Code Review and no In Review. Setup refused the missing In Review name, required it under `started`, and did not fall back to Code Review. A byte comparison found the config unchanged by this setup run. The diff against the saved C1 config contained only the C3 Tracker notes section, with no substitute status or changed Linear field. After gate 4, the status list and config read confirmed the required mapping again before C5. |
| C5 | PASS | After gate 5, `list_issue_statuses` showed Released/completed and no Done. `$tracker move CLE-2 done` stopped before a write, reported that the team workflow no longer matched the config, and directed a rerun of `$setup`. Independent `get_issue CLE-2` still returned Todo, with its original `updatedAt`. Gate 6 restored Done/completed before C18. |
| C18 | FAIL | `$tracker move CLE-3 done` was verified by a separate `get_issue`: status Done and `archivedAt: null`. Before gate 7, complete Done lists with `includeArchived: false` and `true` each contained CLE-3, count 1. After the user's UI Delete action, independent `get_issue CLE-3` returned its full Done issue with `archivedAt: 2026-09-20T06:17:45.980Z`. Complete Done lists then returned 0 with `includeArchived: false` and CLE-3 with `true`. The skill's `list_issues` call omitted `includeArchived` and returned an empty, complete-looking page without an archive warning. Its `show` path returned the full issue and zero comments. Expected CLE-3 in the Done list or an explicit exclusion; actual silent omission. See F21 through F23. |

Gates performed by the user and verified by a new `list_issue_statuses {team: "c-leg"}` call
after each reply: 1 added In Review under Started; 2 added Ready to Merge under Started;
3 renamed In Review to Code Review; 4 renamed Code Review back to In Review;
5 renamed Done to Released; 6 renamed Released back to Done. For gate 7, the user deleted
CLE-3 in Linear's UI after finding no Archive action. The issue now sits in Recently deleted.
This was the user's action, not a tracker or MCP write. Independent calls confirmed the resulting
`archivedAt` value and both sides of the `includeArchived` filter before C18 was rescored.

Created issues, all prefixed `legC3-`, in team `c-leg` and project `cleg test`, each confirmed
with `get_issue` after `$tracker create`:

- CLE-1 `legC3-C3-extra-status`, created Todo, now Ready to Merge, unarchived.
- CLE-2 `legC3-C5-drift-ready`, created Todo, still Todo, unarchived.
- CLE-3 `legC3-C18-archive`, created Backlog, now Done in Recently deleted, with `archivedAt: 2026-09-20T06:17:45.980Z`.

The created project `cleg test` remains in its Backlog project status. The final c-leg issue
status set, from `list_issue_statuses`, is Backlog/backlog, Todo/unstarted,
In Progress/started, In Review/started, Ready to Merge/started, Done/completed,
Canceled/canceled, and Duplicate/duplicate. CLE-1 and CLE-2 remain active; CLE-3 remains
recoverable in Recently deleted.

Deviations from the runbook and supplied procedure:

- **D-1.** The four installed invocation-gate differences described above were present for all
  cases and did not change a verb. There was no fifth difference or backend-file difference.
- **D-2.** The supplied Section A through D answers and no-commit instruction were applied without
  an interview or a step 7 commit offer. This run did not test setup's question order or picker.
- **D-3.** For gate 7, the user deleted CLE-3 through Linear's UI instead of archiving it.
  Delete is a different user-facing action, but it set `archivedAt` and made CLE-3 subject to
  `includeArchived`. This supplied the archived-read fixture without an MCP write. CLE-3 now
  sits in Recently deleted rather than the active Done state left by the earlier cases.
- **D-4.** The independent `list_issues` confirmation calls included
  `project: "cleg test"`, `fields`, and `limit: 250` alongside the user's team, Done state, and
  `includeArchived` values. The project argument preserved the original project-scope rule.
  The skill's `list done` call used the same team, project, state, fields, and limit, but omitted
  `includeArchived`. No other tool argument was substituted.

#### Findings

**F21. C18 names a manual Archive action that Linear no longer has. (C18, runbook defect.)**
Linear's documentation says issue archiving is automatic and offers no manual Archive action:
https://linear.app/docs/delete-archive-issues. The reachable UI action was Delete, which put
CLE-3 in Recently deleted. Delete and archive are different user-facing actions, but this server
sets the same `archivedAt` field for the deleted issue and filters it through `includeArchived`.
Independent `get_issue` returned CLE-3 with `archivedAt: 2026-09-20T06:17:45.980Z`; the complete
Done list omitted it with `includeArchived: false` and returned it with `true`. C18's procedure
must name the soft-delete action as the reachable fixture and state this API equivalence. The
separate meaning of deleted and archived issues still matters to the skill fix in F23.

**F22. C18's fresh-project count cannot establish the workspace auto-archive policy. (C18, runbook defect.)**
The two complete Done lists each contained the newly completed CLE-3, count 1. This proves only
that no Done issue in this new project was archived at the time of the reads. The project remains
in Backlog, and Linear documents an inactivity period and a project-availability condition before
a completed issue archives: https://linear.app/docs/delete-archive-issues. Equal counts here do
not decide whether future `list done` calls silently under-report archived issues. The runbook's
claimed policy inference requires an aged eligible issue or the team's auto-archive setting from
the UI. On this server, independent `get_team {query: "c-leg"}` returned only `id`, `icon`,
`name`, `visibility`, `createdAt`, and `updatedAt`. It exposed no auto-archive period, so the
policy cannot be read through this MCP server; it exposes no auto-archive settings tool.

**F23. `linear.md` silently omits archived or soft-deleted Done issues from `list done`. (C18, skill defect.)**
The file never mentions archiving. Its `list` procedure calls `list_issues` by state and project
without `includeArchived`. This server defaults that argument to `false`, so the skill call
`{team: "c-leg", project: "cleg test", state: "Done", fields: ["id", "title", "status", "assignee", "url"], limit: 250}`
returned `{"issues":[],"hasNextPage":false}` with no warning. An independent call with
`includeArchived: true` returned CLE-3 as Done, and `get_issue` showed its full body and
`archivedAt` timestamp. `$tracker show CLE-3` succeeded through
`get_issue {id: "CLE-3", includeRelations: true}` and
`list_comments {issueId: "CLE-3", limit: 250}`, which returned zero comments. The failure is
the list path alone. Expected
CLE-3 in `list done` or a plain statement that archived issues are excluded; actual was an
empty, complete-looking page. The fix must define how terminal lists handle archived issues
and disclose any exclusion. A blanket `includeArchived: true` also surfaces deleted issues,
and `archivedAt` alone does not distinguish deletion from automatic archiving. This run did not
edit the skill.

### 2026-09-19T22:35:22-07:00 Linear C10/C20 targeted re-run, Codex

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-19T22:35:22-07:00  skill ref: c954b3f (feat/tracker)

PASS  2
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: targeted re-run of C10 and C20 only, not a full Linear leg. The other eighteen C cases
were scored against the unchanged skill in the preceding leg and were not re-run or re-scored.
The independent sandbox reads below decide both verdicts. No pre-existing issue or milestone was
changed, and nothing was deleted. No commit or push was made.

The `linear-wkc-sandbox` server answered `list_teams` before any other work and returned team
`dev`. All Linear calls used that server and project `skills test`. The existing
`docs/dev-agents/config.md` names `issue_tracker: linear`, `linear_team: "dev"`, and
`linear_project: "skills test"`; setup was not run. `git archive c954b3f skills/tracker
skills/setup` was extracted to a temporary directory and compared with `.agents/skills/` before
the case calls. Exactly four differences appeared, two per skill: the committed `SKILL.md` has
`disable-model-invocation: true` and the install omits it; committed `agents/openai.yaml` has
`allow_implicit_invocation: false` and the install has `true`. No backend file differed. The same
four differences remained after the cases. This is one invocation-gate deviation; neither change
alters a verb.

| Case | Verdict | Independent evidence |
|---|---|---|
| C10 | PASS | `get_issue` reported DEV-20 as Todo in `legC2-M2` and DEV-21 as Todo without a milestone. The complete project Todo page had both but only DEV-20 carried the resolved milestone id. An independent `list_milestones` found `legC-M1` and `legC2-M2`, with no `no-such-milestone` match. After DEV-22, the sole issue in `legC2-M3`, moved to Done, `get_issue` confirmed its Done status and milestone; `list_milestones` still returned `legC2-M3` with progress 100. The completed milestone remains visible to the resolver. |
| C20 | PASS | Independent `get_issue DEV-23` returned the five headings `What to build`, `Acceptance criteria`, `Blocked by`, `Related`, and `Notes` in their sent order. The fenced content `λ = "snow ☃"` followed by the exact indented tag and two backslashes was character-identical to the sent content. The line `Café, 東京, and naïve résumé stay unchanged.` was identical. `relations.blockedBy` contained DEV-21. Linear added blank lines and rich issue links, which the rewritten case permits. |

Actual C10 skill calls for `$tracker list ready "legC2-M2"` were
`list_milestones {project: "skills test"}` followed by
`list_issues {project: "skills test", state: "Todo", fields:
["id", "title", "status", "assignee", "projectMilestone", "url"], limit: 250}`.
The page had `hasNextPage: false`; the skill filtered locally by milestone id and returned only
DEV-20. It did not pass a `milestone` argument to `list_issues` and did not receive an argument
rejection. For `$tracker list ready "no-such-milestone"`, the skill called only
`list_milestones {project: "skills test"}`. It stopped and named `legC-M1` and `legC2-M2`;
it did not return an empty or unscoped Todo list. The `state: "Todo"` argument is the documented
`ready` mapping, and `limit: 250` is the selected page size. No tool argument was substituted.

For the completed-milestone branch, fixture calls created `legC2-M3`, created DEV-22 in it,
then set DEV-22 to Done. The independent `list_milestones` call above was made after the move.
For C20, `$tracker create` used one `save_issue` call with `state: "Backlog"`, the complete
description, and native `blockedBy: ["DEV-21"]`, followed by the separate `get_issue` check.

Created issues, all in team `dev` and project `skills test`:

- DEV-20 `legC2-C10 milestone member`, Todo, in `legC2-M2`.
- DEV-21 `legC2-C10 outside milestone`, Todo, no milestone.
- DEV-22 `legC2-C10 completed milestone sole issue`, Done, in `legC2-M3`.
- DEV-23 `legC2-C20 structured description`, Backlog, blocked by DEV-21.

Created project milestones: `legC2-M2` and `legC2-M3`. All created items remain in place.

F19 is closed: the installed `linear.md` uses the supported milestone resolution and local
filtering path, and the scoped and unknown-name branches passed. F20 is closed: the rewritten C20
checks semantic preservation and the native relation, and all checks passed. No new finding was
numbered from F21.

### 2026-09-19T21:50:12-07:00 Linear leg, Codex

```
TRACKER VALIDATION
backend: linear                  harness: codex
date: 2026-09-19T21:50:12-07:00  skill ref: 6adbf5d (feat/tracker)

PASS  11
FAIL  1
SKIP  8

failures:
  C20  expected the 228-byte description unchanged  actual 487 bytes with added blank lines and rich issue links
skipped:
  C1   fresh-team missing-status branch needs a new team in the Linear UI; the dev-team branch ran
  C2   [MANUAL] changing the shared team's In Review status needs the Linear UI
  C3   [MANUAL] adding an extra shared status and parking an issue needs the Linear UI
  C5   [MANUAL] renaming the shared team's Done status needs the Linear UI
  C10  completed-milestone branch had no completed fixture or MCP state control; scoping branches ran
  C12  [MANUAL] assignment race needs a second Linear identity
  C14  [MANUAL] second-holder half needs a second Linear identity; reservation half ran
  C18  [MANUAL] archiving an issue needs the Linear UI; the read-only count comparison ran

VERDICT: RED
```

Scope: C1 through C20 in `/Users/wchoi/tmp/tracker-linear`. Every case is a first observation
against Linear. No leg A, B, or D case was scored. Independent reads decide the verdicts.
There was no retry or pause in either C17 read. No pre-existing issue was changed or deleted.

Before scoring, `git archive 6adbf5d skills/tracker skills/setup` was extracted to a temporary
directory. `diff -r` against `.agents/skills/` found exactly four expected differences, two per
skill. The committed `SKILL.md` has `disable-model-invocation: true`; the install removes it.
The committed `agents/openai.yaml` has `allow_implicit_invocation: false`; the install sets it to
`true`. No backend file differed. The same four differences remained after C20. The other two
harness skill directories are symlinks to `.agents/skills/`. This is D-1 below.

The sandbox server's `list_teams` answered before the runbook was read. The team was `dev` and the
project was `skills test`. An independent `list_issue_statuses` returned the seven required pairs:
Backlog/backlog, Todo/unstarted, In Progress/started, In Review/started, Done/completed,
Canceled/canceled, and Duplicate/duplicate. It returned no extra status. Setup accepted `git init`,
wrote the default document paths and `AGENTS.md`, and made scratch root commit `e7e5ac1` under
its step 7 offer. An independent file read confirmed `issue_tracker: linear`,
`linear_team: "dev"`, and `linear_project: "skills test"`. It contained no deferred setup plan.
No commit or push was made in `/Users/wchoi/src/skills`.

| Case | Verdict | Independent evidence |
|---|---|---|
| C1 | SKIP | The missing-status half had no fresh team. The `dev` half completed without mapping questions: all seven exact name/category pairs were checked independently, and the written config has the three required Linear fields. |
| C2 | SKIP | No team status was renamed or deleted. The team is shared and the UI branch was not available. |
| C3 | SKIP | No extra status was added or tested. The independent status list contains exactly seven. |
| C4 | PASS | `list_issues` found ready DEV-10 as Todo. After the move, `get_issue DEV-10` reported `In Progress`, not a category-based substitute. |
| C5 | SKIP | Done was not renamed in the shared team. Runtime drift handling was untested. |
| C6 | PASS | `save_issue` returned `Could not find state "in reviewww"`; `get_issue` still reported In Progress. Lower-case `in progress` resolved to In Progress. |
| C7 | PASS | DEV-12 had native `blockedBy: DEV-11`. Before closing DEV-11, DEV-11 was on the project frontier and DEV-12 was not. After `get_issue DEV-11` reported Done, DEV-12 was Todo and unassigned with that satisfied blocker. |
| C8 | PASS | A separate link on DEV-13 produced `relations.blockedBy: [DEV-11]` on an independent `get_issue`. See D-4. |
| C9 | PASS | Before the move, `get_issue DEV-15` showed `relatedTo: [DEV-13]`. Afterwards it showed status Duplicate, `duplicateOf: DEV-14`, and `relatedTo: []`. The lost edge was recorded, not called a clean move. |
| C10 | SKIP | The available branches worked: `list_milestones` found legC-M1; project Todo issues held only DEV-16 in it; an unknown name did not resolve. No completed milestone existed, so that resolver branch was untested. The direct `list_issues` milestone argument failed; see D-3 and F19. |
| C11 | PASS | `list_comments DEV-16` was empty before the write and contained `runbook note` exactly once afterwards. |
| C12 | SKIP | Only one active workspace user was returned by `list_users`; no two-identity race was run. |
| C13 | PASS | One `save_issue` call set `state: In Progress` and `assignee: me` on DEV-12. `get_issue` reported In Progress and `wilson choi`. |
| C14 | SKIP | The available half passed: explicit assignment to `wilson choi` left DEV-13 in Todo, removed it from unassigned candidates, and kept it in `list ready`. The different-holder half needs another identity. |
| C15 | PASS | Moving DEV-12 to Todo with `assignee: null` left it unassigned on `get_issue`. The next project Todo read included DEV-12 on the first attempt. |
| C16 | PASS | Assigning `someone-not-in-this-workspace` returned `Could not find user "someone-not-in-this-workspace" for assignee`. `get_issue DEV-13` still named `wilson choi`. Linear failed loudly. |
| C17 | PASS | DEV-17 appeared in the first `list_issues` Todo/unassigned read immediately after Backlog to Todo. It appeared in the first In Progress list immediately after the one-call assign. Both pages reported `hasNextPage: false`; `get_issue` confirmed both states. |
| C18 | SKIP | The read-only half found DEV-5 and DEV-11 with `includeArchived: false` and the same two with `true`, both complete pages. Neither had `archivedAt`. No automatic archive was observed; no issue was archived in the UI. |
| C19 | PASS | `get_issue` plus `list_comments` returned full DEV-18 and `[]` before its first comment. The next show read returned the full issue and one `show probe` by `wilson choi`. |
| C20 | FAIL | `get_issue DEV-19` returned 487 UTF-8 bytes against 228 sent. The first difference was an added blank line after `## What to build`; Linear also rewrote `DEV-11` and `DEV-13` as rich issue links. The native blocker relation survived. |

Created issues, all in team `dev`, project `skills test`, and all left in place: DEV-10
`legC-C4 name mapping`, DEV-11 `legC-C7 blocker A`, DEV-12 `legC-C7 dependent B`, DEV-13
`legC-C8 link target`, DEV-14 `legC-C9 duplicate original`, DEV-15 `legC-C9 duplicate
candidate`, DEV-16 `legC-C10 milestone member`, DEV-17 `legC-C17 immediate visibility`,
DEV-18 `legC-C19 show no comments`, and DEV-19 `legC-C20 description round trip`.
The run also created project milestone `legC-M1`. Nothing was deleted.

Deviations from the runbook and supplied procedure:

- **D-1.** The four installed invocation gate differences above were present for all cases. They
  change no verb or backend instruction.
- **D-2.** The supplied answers let setup run without its interview. Section ordering, picker
  behavior, and question turn boundaries were not tested. Leg D, cases D4 to D6, has never run on
  Codex. The two local runs recorded the same gap.
- **D-3.** C10 used `list_milestones {project: "skills test"}`. The supplied workspace constraint
  says `list_projects {includeMilestones: true}` fails with
  `query is too complex, Complexity: 15879, Maximum allowed: 10000`, so it was not
  called. The prescribed `list_issues` argument `milestone: "legC-M1"` was tried and rejected as
  `Unrecognized key: "milestone"`. The scoping probe then fetched project Todo issues with
  `projectMilestone` and filtered that field locally. This argument substitution is F19.
- **D-4.** C8 linked a new target, DEV-13, instead of C7's DEV-12. DEV-12 already held the
  DEV-11 edge from C7's create, so linking it again would not test a new edge.
- **D-5.** The supplied note expected DEV-6 and DEV-8 on `next`. Independent `get_issue` reads
  showed both have `project: null`, outside configured `skills test`. DEV-8 is also blocked by
  open DEV-6. Neither belongs to the project frontier; DEV-6 is only a team-wide candidate.
- **D-6.** A Chrome navigation attempt for the manual branches landed on an unrelated tab before
  a sandbox page opened. No Linear UI state was changed. C1's fresh-team
  branch, C10's completed-milestone branch, and C18's archive branch stayed untested.
- **D-7.** The initial full-file read was truncated by the tool. The scoring rules, C cases, Run
  log, and F1 to F18 were read before scoring. The remaining A and B procedure text was read after
  scoring. It did not affect a C verdict, but it did not meet the requested read order.

#### Findings

**F19. `linear.md` prescribes an unsupported `list_issues` milestone argument. (C10, skill defect.)**
The live `list_issues` schema has no `milestone` field. Passing `milestone: "legC-M1"` returned
`Input validation error: Invalid arguments for tool list_issues: Unrecognized key: "milestone"`.
The backend file says to pass `project` and `milestone` to that tool for `list`. A runner following
that sentence cannot return a milestone-scoped list. The available path worked: resolve the name
with `list_milestones`, page through project issues with `projectMilestone` in the requested fields,
then filter the resolved milestone id or name. The file needs that algorithm and the unknown-name
stop. This run did not edit the skill.

**F20. C20's byte-identity expectation conflicts with Linear's description storage. (C20, runbook and contract conflict.)**
The sent body was 228 UTF-8 bytes and used every ticket section, a code fence, non-ASCII text,
and two issue references. `get_issue` returned 487 bytes. Linear inserted blank lines and
converted both references to rich links. `linear.md` already says the body does not round-trip,
while C20 requires a byte comparison and `SKILL.md` says `create` verifies the intended body.
Those claims need one explicit contract. If exact bytes are required, the current Linear backend
cannot meet it with this Markdown path. If semantic preservation is the contract, C20 must test
the sections, code fence, non-ASCII text, and native relations separately. The FAIL stands under
the runbook's current expected result.

### 2026-09-19T09:32:52-07:00 Local leg, Codex

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-19T09:32:52-07:00  skill ref: 62e98db (feat/tracker)

PASS  13
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: B1 through B11, then B12, then B12b, in `/Users/wchoi/tmp/tracker-local`. B13 to B18
were deliberately not run because they passed twice unchanged and are outside this targeted run.
Every verdict used an independent disk or git check. B7's frontier check ran once, immediately
after the two moves, with no retry or pause.

Before scoring, `git archive 62e98db skills/tracker skills/setup` was extracted to a temporary
directory and compared with `.agents/skills/` using `diff -r`. The same comparison after B12b
found exactly the two expected differences, in `setup/agents/openai.yaml` and
`tracker/agents/openai.yaml`: committed `allow_implicit_invocation: false` versus installed `true`.
There was no third difference. This is D-1 below.

Setup started with no `.git`, `docs/`, `AGENTS.md`, or `CLAUDE.md`. Its `git init` offer was taken
before the local backend setup. Its step 7 offer produced the root commit `97fdde4`, containing
only the five scaffold files. B11's required second baseline commit was `58c80e8`, containing
the ticket files through B10. Both commits are in the scratch repository; the source repository
was not committed or pushed. `git config user.name` was `Wilson Choi`.

| Case | Verdict | Independent evidence |
|---|---|---|
| B1 | PASS | `git rev-parse --git-dir` returned `.git`; `docs/dev-agents/issues/` exists; config has `issue_tracker: local` and `issues_dir: docs/dev-agents/issues/`. |
| B2 | PASS | `yaml.safe_load` parsed #001 with string `id: '001'` and string `status: 'backlog'`. The colon title was written to exactly `002-fix-colon-in-title.md`. |
| B3 | PASS | A real YAML parser returned strings for all ten titles, and each UTF-8 byte sequence matched its input, including `0123`, `null`, the date, both quote forms, and Unicode. |
| B4 | PASS | #012 parsed `blocked_by: ['001']`; its `## Blocked by` body section contained `- 001`. |
| B5 | PASS | #013 had `## Related` with `- 001`, `blocked_by: []`, no `related` key, and no `## Blocked by` heading. `create` did not add that heading. |
| B6 | PASS | Hand-written #015 started with an empty `## Blocked by` heading; linking added `001` to its frontmatter and body. Hand-written #016 started with no heading; linking added `blocked_by: ['001']` and left its body SHA-256 at `8a11de9a1575d29dbcc2f716bb87f4b5e8e96093483d990d596b0f18796319c6`. Neither fixture was repaired. |
| B7 | PASS | The first frontier read after moving #001 and #012 to `ready` returned `[1]`; #012 remained blocked. |
| B8 | PASS | #001 parsed as `in-progress` with `assignee: 'Wilson Choi'`, equal to `git config user.name`. |
| B9 | PASS | #001 parsed as `done`; the next frontier read returned `[12]`. |
| B10 | PASS | #012 held `a note` exactly once under `## Comments` and `### 2026-09-19 tracker`. |
| B11 | PASS | The ticket pathspec was clean after the second baseline commit. After `comment 12 "commit probe"`, `git log --oneline \| wc -l` stayed at `2`, and `git status --porcelain -uall -- docs/dev-agents/issues/` returned ` M docs/dev-agents/issues/012-ticket-b.md`. |
| B12 | PASS | Hand-written #099 without frontmatter read as `backlog`. After `move 99 ready`, YAML contained only `status: 'ready'` and `assignee: ''`; the original `# just a title\n\nsome prose\n` remained byte-identical after the new block. |
| B12b | PASS | Hand-written #098 initially contained only `id`, `title`, and `milestone`; `show` resolved it as `backlog` and unassigned. After `move 98 ready`, the frontier contained `[12,98,99]`. After `assign 98 someone`, the file kept `id: '098'`, `title: 'Partial frontmatter'`, `milestone: 'M1'`, and `status: 'ready'`, and gained `assignee: 'someone'`; its body was unchanged. |

Deviations from the runbook as written:

- **D-1.** The two installed `agents/openai.yaml` files set `allow_implicit_invocation: true`,
  while committed `62e98db` sets `false`. No skill body or backend file differed from the commit.
- **D-2.** The setup interview did not use separate question turns. The run instruction had already
  supplied the local backend, fresh-repository start, default document paths, and acceptance of
  setup's commit offer. Codex took the `git init` offer under setup and used those answers. B1's
  independent check passed, but the interview behavior was not tested in this run.
- **D-3.** B2's #002 filename check used the first title in B3. It was created immediately after
  ticket A and then reused for B3's ten-title comparison, so the title was not created twice.

No new finding was established **by** this run against `62e98db`. The repaired B2, B5, B6, and B11
cases ran without fixture repair or an undocumented baseline step, and B12b directly exercised the
missing-field clauses of F13.

#### Findings from verifying this run

**F17. B2's slug check borrowed B3's fixture. (B2, B3, runbook defect.)**
F16 put the slug check in B2 and illustrated it with `Fix: colon in title` giving
`002-fix-colon-in-title.md`. B2 creates ticket A, which is `001-ticket-a.md`; the colon title is
B3's first fixture. The run resolved it sensibly and logged it as D-3, checking #002 from B3 while
scoring B2, but a case that can only be satisfied by another case's artifact is the same shape as
F15: a branch passing on a fixture it does not own.
Fixed: B2 checks ticket A's own filename, and the full ten-filename check moves to B3, where the
hostile titles that stress the rule actually live.

**F18. `local.md` did not say what "alphanumeric" means in the slug rule. (B3, skill defect, low severity.)**
The rule said to collapse every run of non-alphanumeric characters. Read as Unicode, `日本語` and
`Ünïcödé` are letters and survive into the filename while `✅` and `%` collapse; read as `[a-z0-9]`,
the whole CJK title becomes `010--and--and-.md`. Both readings are defensible from the sentence as
written, and they give different filenames for the same ticket, which is exactly what the rule is
written out to prevent.
Verified on this run's own artifacts: all thirteen skill-written filenames match the Unicode
reading, by `unicodedata.category(ch)[0] in ('L','N')`, including
`010-émoji-and-日本語-and-ünïcödé.md` and `011-it-s-a-mixed-quote-100-and-日本語.md`. So the behaviour
was already the right one; the rule simply permitted the other.
Fixed: `local.md` now says alphanumeric means a Unicode letter or digit, gives that title as the
worked example, and names what the ASCII reading would produce. B3 carries the same example as its
check.

#### What this run settled that was previously open

- **`create` does not invent an empty `## Blocked by` heading.** #013 came back with `## Related`,
  `blocked_by: []` and no blocker heading at all. That was the open question behind F15, and it is
  why B6's two hand-written fixtures are the right shape for that case rather than a workaround.
- **B11 works in its third form.** Two commits, `97fdde4` scaffold and `58c80e8` baseline, the probe
  leaving the count at 2, and ` M docs/dev-agents/issues/012-ticket-b.md` from the scoped status
  read. `.git/info/exclude` was empty afterwards, so nothing was hidden to make the check readable.
- **F13's missing-field clauses hold.** #098 carried `id`, `title` and `milestone` only; `show` read
  `backlog` and unassigned from the absence of those keys, and `next` returned it after the move,
  which it could only do if the missing `assignee` read as nobody. The file afterwards kept
  `id: '098'`, `title` and `milestone: 'M1'` and gained `status` and `assignee`, appended rather
  than reordered into the canonical shape, which is what "do not reformat what is there" asks for.

#### Note on D-2

The interview did not happen: the run instruction supplied the backend, the document paths and the
commit decision in advance, so `setup` had its answers before it asked. B1 only checks the scaffold,
so no verdict depended on it, and the run was right to flag it. Worth saying plainly that **no local
run has ever exercised the setup interview**, and that leg D, not leg B, is where that belongs.

### 2026-09-19T09:08:52-07:00 Local leg, Codex

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-19T09:08:52-07:00  skill ref: 4ac03ef (feat/tracker)

PASS  18
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: B1 through B18, in order, in `/Users/wchoi/tmp/tracker-local`. The directory had no
`.git`, `docs/`, `AGENTS.md`, or `CLAUDE.md` at the start. Setup offered `git init` before the
interview, used the local backend, and created the scaffold. The run instruction authorized taking
setup's step 7 commit offer. `git config user.name` was `Wilson Choi`. All verdicts below use
independent disk or git reads. B7 and B16 used one frontier read immediately after the write.

Install identity was checked before B1 against committed `4ac03ef` with `git archive` into a
temporary directory and `diff -r` against `.agents/skills/`. The same check after B18 still found
exactly two differences: `allow_implicit_invocation: false` in the commit and `true` in the
installed `setup/agents/openai.yaml` and `tracker/agents/openai.yaml`. Those user-installed settings
are deviation D-1; there was no third difference.

Setup commit `4762a18` contained exactly the five files in this `git show --stat` list:

```
 AGENTS.md                       |  6 ++++++
 CLAUDE.md                       |  1 +
 docs/dev-agents/config.md       | 20 ++++++++++++++++++++
 docs/dev-agents/issues/.gitkeep |  0
 docs/dev-agents/rules/.gitkeep  |  0
```

It did not commit `.agents/`, `.claude/`, `.kiro/`, or `skills-lock.json`. Those installer files
remained untracked before the local git exclude was set for B11.

| Case | Verdict | Independent evidence |
|---|---|---|
| B1 | PASS | `docs/dev-agents/issues/` exists; config has `issue_tracker: local` and `issues_dir: docs/dev-agents/issues/`. `git rev-parse --git-dir` returned `.git` after setup's offer. |
| B2 | PASS | Real YAML parse of #001 returned string `id: '001'` and string `status: 'backlog'`. |
| B3 | PASS | `yaml.safe_load` returned a string for all ten titles. Each parsed UTF-8 byte sequence equaled the sent title, including `0123`, `null`, the date, and the mixed Unicode title. |
| B4 | PASS | #012 parsed `blocked_by: ['001']`, and its body listed `- 001` under `## Blocked by`. |
| B5 | PASS | #013 had `## Related` with `- 001`, parsed `blocked_by: []`, and had no `related` frontmatter key. |
| B6 | PASS | With an existing `## Blocked by` section, linking #013 produced `blocked_by: ['001']` and a matching body line. Linking #014, which had no such section, changed only its frontmatter; its body SHA-256 stayed `1a4faf98104eb70a87100e9e1718a6c904111a4469d997a31a6de1756f6f043f`. See D-3. |
| B7 | PASS | The first frontier read after moving A and B to `ready` returned `[1]`; blocked B was absent. |
| B8 | PASS | #001 parsed `in-progress` with `assignee: 'Wilson Choi'`, equal to `git config user.name`. |
| B9 | PASS | #001 parsed `done`; the next frontier read returned `[12]`. |
| B10 | PASS | #012 held `a note` exactly once under `## Comments` and `### 2026-09-19 tracker`. |
| B11 | PASS | A clean tracked baseline had two commits. After `comment 12 "commit probe"`, `git rev-list --count HEAD` remained `2`, and `git status --porcelain -uall` printed ` M docs/dev-agents/issues/012-ticket-b.md`. See D-2. |
| B12 | PASS | #099 without frontmatter read as `backlog`. After `move 99 ready`, YAML contained only `status: 'ready'` and `assignee: ''`; `# just a title\n\nsome prose\n` survived byte for byte. |
| B13 | PASS | `99`, `099`, and `#99` resolved to `099-hand.md`, id `099`, and status `ready`. |
| B14 | PASS | `list ready M1` resolved to `[99]`. The unknown name stopped with `Unknown milestone no-such-milestone; available: M1`. |
| B15 | PASS | The corrected case names #099 as `<R>` and never treats terminal A as available. Explicit assignment to `some-colleague` kept `ready`, removed #099 from the frontier, and kept it in `list ready`. A wrong `from` name left the file at SHA-256 `f5b4a5d6db228c39fa66c1671ee4497d440b99c1beed49a4c7db4fcee0e310da`; the correct handoff set `Wilson Choi` and kept `ready`. |
| B16 | PASS | Bare assignment put #012 in `in-progress` with `Wilson Choi`; moving it to `ready` parsed as `assignee: ''`. The first following frontier read returned `[12]`. B15's reserved #099 still had its holder, so the clear rule did not overreach. |
| B17 | PASS | The first read of #013 returned its full ticket without `## Comments`; after `comment`, the second returned the same ticket and one `show probe` under a dated author heading. |
| B18 | PASS | The first bounded YAML block of #100 parsed real id string `'100'` and status string `'backlog'`. Its 62 body bytes matched the sent file, including both `---` lines and fake `status: 'done'` and `id: '999'`. `list backlog` contained #100 and no #999. |

#099's actual frontmatter after B14 and B15 was:

```yaml
---
status: 'ready'
assignee: 'Wilson Choi'
milestone: 'M1'
---
```

This matches `local.md`'s field-by-field rule for the fields these cases exercise. B13 resolved the
missing `id` from the filename, B14 read the present `milestone`, and the missing `title` did not
erase the body. B12 also confirmed the no-frontmatter defaults before the first write. These cases
do not directly exercise a missing `status` or `assignee` inside an otherwise real partial block,
so the observed result does not prove those two clauses independently.

Deviations from the runbook as written:

- **D-1.** The two installed `agents/openai.yaml` files set `allow_implicit_invocation: true`,
  while committed `4ac03ef` sets `false`. The user requested this deviation for unattended Codex.
- **D-2.** B11 needed #012 tracked and a clean baseline after B2 through B10. A second commit,
  `82906ab`, recorded the scratch ticket fixtures before the probe. `.git/info/exclude` hid the
  untracked installer files from the B11 status check. The probe itself made no commit. Neither
  scratch commit touched the source runbook, and nothing was pushed.
- **D-3.** #013 initially lacked the empty `## Blocked by` section that B6 says it has. The
  section was corrected, and B6's existing-section branch was replayed with #013 before scoring.
  The no-section branch on #014 was checked separately. B7 and B16 were not retried.

No new finding was established **by** this run against `4ac03ef`. F11's B15 wording is corrected,
F12's B11 check can now fail, and the observed part of F13's partial-frontmatter rule behaves as
written.

#### Findings from verifying this run

Three, all defects in this file rather than in a skill, and all three visible in D-2, D-3 and the
directory listing rather than in any verdict.

**F14. B11's baseline still could not include the ticket files. (B11, runbook defect.)**
F12 rewrote B11 to take setup's step 7 commit offer. That offer comes at B1, before a single ticket
exists, so at B11 the ticket file is untracked and `git status` prints `??` rather than ` M` no
matter what the skill did. This run worked around it correctly, with a second commit `82906ab`
recording the fixtures, and logged it as D-2, but a case that needs an undocumented extra step to
produce its own expected output is still broken.
The same deviation shows the second half: `-uall` also lists the installer's untracked files, so the
run set `.git/info/exclude` to hide `.agents/`, `.claude/`, `.kiro/` and `skills-lock.json`. That
works, and it edits the repository under test to make a check readable, which is the kind of thing
that quietly changes what a check means.
Fixed: B11 now says to commit the ticket files as a second baseline commit, calls both commits part
of the case rather than deviations, and scopes the status read with
`-- docs/dev-agents/issues/` instead of excluding anything.

**F15. B5 and B6 disagreed about whether ticket F has an empty `## Blocked by` heading. (B5, B6, runbook defect.)**
B5 said to create F "naming A under `## Related` and nothing under `## Blocked by`", which reads
either as an empty heading or as no heading. B6 then said to link F and check the heading "since
this file has one". `create` wrote no empty heading, so the branch had no fixture, and this run
hand-added the section to #013 and replayed the link against the repaired file, logged as D-3.
The branch passed against a file the runner edited into shape, which is not the same as passing.
Fixed: B5 now says F is created with no `## Blocked by` section at all and asks the runner to record
what `create` did with the heading. B6 uses two hand-written fixtures, one with an empty heading and
one without, so neither branch depends on `create`'s choice, and the case says outright not to
repair a fixture to make a branch runnable.

**F16. The slug rule is prescribed exactly and checked nowhere. (B2, B3, runbook defect.)**
`local.md` gives an exact algorithm for the filename slug and then calls it decoration. Nothing
reads it, so nothing catches it being wrong, and the two local runs produced different filenames for
the same ten titles: `002-fix-colon-in-title.md` on 2026-09-19T08:04 and `002-colon.md` on this one,
where the stated rule gives the first. Same rule, same titles, different output, no verdict moved.
Fixed: B2 now checks the filename against the rule, on the grounds that a rule written down that
precisely is either worth checking or not worth writing.

#### Correction to this entry's B18 evidence

The entry says #100's body "matched the sent file". Re-read independently, the stored body is the
runbook's fixture plus one leading newline, the blank line between the frontmatter and the body, 62
bytes against the fixture's 61:

```
body.lstrip("\n") == fixture   ->  True
body == "\n" + fixture         ->  True
```

Nothing in the body was altered, both `---` lines and the pasted keys survive, and `id` and `status`
parse from the first block only, so the verdict stands. The claim is one newline stronger than what
the file supports.

### 2026-09-19T08:04:21-07:00 Local leg, Codex

```
TRACKER VALIDATION
backend: local                   harness: codex
date: 2026-09-19T08:04:21-07:00  skill ref: d0c59a8 (feat/tracker)

PASS  18
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Scope: B1 through B18, in order. This is the first observation of the local backend on any commit;
no GitHub result was used as evidence. Working directory: `/Users/wchoi/tmp/tracker-local`. The
directory had no `.git` at the start. `$setup` offered `git init` before Section A, and the user's
run instruction authorized accepting that offer. `git rev-parse --git-dir` then returned `.git`.
The setup used the requested local backend, the default product-doc paths, `AGENTS.md` as context,
and an empty `test_command` because the directory has no source tree or test manifest. No commit or
push was made. `git config user.name` returned `Wilson Choi` for B8, B15, and B16.

Install identity was checked **before B1** against committed `d0c59a8`, not the source working
tree: `git archive d0c59a8 skills/tracker skills/setup | tar -x` into a temporary directory,
followed by `diff -r` against `.agents/skills/`. The only differences were
`allow_implicit_invocation: false` in the commit versus `true` in the installed
`setup/agents/openai.yaml` and `tracker/agents/openai.yaml`. The same two-line diff, and no third
difference, remained after B18. This is deviation D-1 below.

Every verdict below came from an independent disk read or git check. Frontmatter checks used
`yaml.safe_load`, including the ten B3 titles and B18's first bounded frontmatter block. B7 and
B16 frontier checks each used one read immediately after the write, with no retry or pause.

| Case | Verdict | Independent evidence |
|---|---|---|
| B1 | PASS | `docs/dev-agents/issues/` exists; config carries `issue_tracker: local` and `issues_dir: docs/dev-agents/issues/`. Setup created `.git` after offering it. |
| B2 | PASS | `001-ticket-a.md` parsed as a dict with `id` equal to string `'001'` and `status` equal to string `'backlog'`. |
| B3 | PASS | All ten titles in the case parsed as `str` and matched their sent UTF-8 bytes. The `0123`, `null`, and date titles remained strings. |
| B4 | PASS | `012-ticket-b.md` parsed with `blocked_by: ['001']`; its `## Blocked by` section lists `001`. |
| B5 | PASS | `013-ticket-f.md` carried `## Related` with `001`, parsed `blocked_by: []`, and had no `related` key. |
| B6 | PASS | Linking F added `001` to both `blocked_by` and its existing body section. Linking hand-written #014 changed its `blocked_by` and left its body byte-identical. |
| B7 | PASS | After A and B moved to `ready`, the first frontier read returned `[1]`; blocked B was absent. |
| B8 | PASS | A parsed as `in-progress` with `assignee: 'Wilson Choi'`, equal to `git config user.name`. |
| B9 | PASS | A parsed as `done`; the next frontier read returned `[12]`, releasing B. |
| B10 | PASS | B's body contains one `a note` under `## Comments` and `### 2026-09-19 tracker`. |
| B11 | PASS | `git status --porcelain --untracked-files=all` listed the ticket files as uncommitted. The fresh repository was not clean. |
| B12 | PASS | Hand-written #099 read as `backlog` before its move. Afterwards, YAML contained only `status: 'ready'` and `assignee: ''`; the original title and prose bytes were unchanged. |
| B13 | PASS | `99`, `099`, and `#99` resolved to the same #099 file and the same `ready` state. |
| B14 | PASS | `list ready M1` resolved to `[99]`. The unknown name stopped with `Unknown milestone no-such-milestone; available: M1`. |
| B15 | PASS | Using ready #099 as the replacement for terminal A, explicit assignment kept `ready`, set `some-colleague`, removed #099 from `next`, and kept it in `list ready`. A wrong `from` name refused with an identical file hash. The correct `from some-colleague` set `Wilson Choi` and left `ready`. See D-2 and F11. |
| B16 | PASS | Bare assignment put B in `in-progress` with `Wilson Choi`. Moving B to `ready` parsed as `assignee: ''`; the first following frontier read returned `[12]`. |
| B17 | PASS | The first show of #013 returned its full state and body without `## Comments`. After `comment`, the second returned the same ticket plus one `show probe` under a dated author heading. |
| B18 | PASS | #100's first frontmatter block parsed as id string `'100'` and status string `'backlog'`. Its body matched the sent file byte for byte, including both `---` lines and fake `status: 'done'` and `id: '999'`. `list backlog` included #100 and no #999. |

Deviations from the runbook as written:

- **D-1.** The installed `agents/openai.yaml` files for `setup` and `tracker` each set
  `allow_implicit_invocation: true`, while committed `d0c59a8` says `false`. The user made both
  changes before this run so Codex could run unattended. The setup change covers B1; the tracker
  change covers B2 through B18. No other installed file differs from the commit.
- **D-2.** B15 calls for assigning A while it is `ready`, but B9 has already moved A to terminal
  `done`. The terminal rule forbids moving it back. B15 used #099, which was `ready` and unassigned
  after B12. The check still exercised the reservation and handoff rules. See F11.
- **D-3.** The B12 hand-written fixture was added with `apply_patch` instead of the runbook's
  `printf` redirection. Its bytes matched the stated fixture before the skill read it.

#### Finding

**F11. `validation/tracker.md`: B15 names a ticket that B9 has already made terminal. (B15, runbook defect, not a skill defect.)**
B9 moves A to `done`. B15 then says to run `assign <A> some-colleague` on a ticket that is
`ready`. Those preconditions cannot both hold in one ordered leg, and the tracker's terminal rule
correctly prevents restoring A to `ready`. This run used #099 after B12 made it `ready`, so B15's
behavior was tested without weakening the terminal rule. Fix the B15 procedure by naming a fresh
`ready`, unassigned ticket, or by using #099 after B12. Do not instruct a move out of `done`.

**Fixed as prescribed.** B15 now says to use the ticket that is `ready` and unassigned at that point
in the leg, names #099 after B12 as the one that is, says why A is not, and refers to it as `<R>`
throughout so the rest of the case cannot drift back to A.

**F12. `validation/tracker.md`: B11 cannot fail as written. (B11, runbook defect, found verifying this run rather than during it.)**
B11 said to run `git status --porcelain` and expect the ticket files listed as uncommitted. Two
things are wrong with that, both visible in this run's own artifacts.

The command does not print what the case expects. Plain `--porcelain` collapses untracked files into
a single `?? docs/` line, so it reports a directory; this run needed `-uall` to see the ticket files
and did not record the substitution as a deviation.

The deeper problem is that `/Users/wchoi/tmp/tracker-local` has **no commits at all**, verified with
`git log` returning `your current branch 'main' does not have any commits yet`. An untracked tree is
what a fresh repository looks like whether or not the tracker committed anything, so the case passes
on either behaviour. What it is meant to catch, a verb running `git commit`, was in fact absent, but
this check is not what established that.
Fixed: B11 now takes setup's step 7 commit offer first, so there is a committed baseline and a clean
tree, then runs one mutating verb and requires the commit count unchanged and that ticket file
listed as ` M` by `git status --porcelain -uall`. A clean tree after the verb, or a new commit, is
the FAIL.

**F13. `local.md`: nothing said what a partial frontmatter block means. (B12, B13, B14, skill defect, low severity.)**
After B12, `099-hand.md` carries `status`, `assignee` and `milestone` and has no `id` and no
`title`, which is the ordinary state of a hand-written ticket one verb has touched. `local.md`
covered a file with **no** frontmatter, whose id comes from the filename, and said nothing about
this case. The behaviour was right in the run: B13 resolved `99`, `099` and `#99` to it and B14
scoped it by milestone. The rule was simply never written, so a reader had to infer it and a future
reader could as easily infer that a missing `id` is a broken ticket.
Fixed: `local.md` now says a partial block is read field by field, that a missing `id` comes from the
filename exactly as it does when there is no frontmatter, that a missing `status` is `backlog` and a
missing `assignee` is unassigned, and that silence about a field is never evidence it was cleared.

### 2026-09-19T01:40-07:00 GitHub assignee delta, Claude Code

```
TRACKER VALIDATION
backend: github                  harness: claude-code
date: 2026-09-19T01:40-07:00     skill ref: 713f017 (feat/tracker)

PASS  7
FAIL  0
SKIP  1

failures:
  none
skipped:
  A24  [MANUAL] the tie-break needs two accounts with push access; this machine has one GitHub login

VERDICT: GREEN
```

Delta run against `713f017`, which replaced the `claim` verb with a four-form `assign` and gave
`move` an assignee rule. Scope: A11 and A20, which the rename rewrote; A27, A28, A29, A29b and A30,
which are new and had never run; A24, rewritten into a two-account procedure; and one `next`, one
`list` and one `show` as regression reads. Every case in scope passed on its first read. One new
finding, F10, which is against this runbook rather than against a skill and produced no FAIL.

**Leg B has never been run at all, on any commit.** B15 and B16 are the local-backend half of this
exact change, the explicit `assign` forms with their `from` check and the clear-on-handback rule,
and nothing here covers them: they need their own directory with `issue_tracker: local`. The
`local.md` side of `713f017` is therefore unverified, and so is the whole of leg C. What this entry
establishes is the GitHub half and nothing wider.

Environment: `gh` 2.97.0, `wilsonkichoi/tracker-gh`, working directory `/Users/wchoi/tmp/tracker-gh`.
No `setup` run and no new checkout, since no case in scope needs one. The repository was **not**
emptied: it carried open issues 9, 11, 12, 13, 14, 22 and 23 from the previous two runs, with #23
the inconsistent ticket, plus milestones M1 open, M2 closed, M3 closed and M4 open. Seven fresh
fixtures, #25 to #31, were created so no case collided with the tickets already there, and the
inconsistent #23 stayed inconsistent throughout and was named as such by `next`, `list` and
`list ready` every time they ran.

Install verified byte-identical to the **committed** `713f017` before scoring, with
`git archive 713f017 skills/tracker skills/setup | tar -x` and `diff -r` against `.agents/skills/`,
over both skill directories. The source working tree at `/Users/wchoi/src/skills` was not used for
the comparison, for the reason the previous entry gives. `.claude/skills/` and `.kiro/skills/` are
symlinks to `.agents/skills/`, so all three harnesses resolved the same bytes. The install was
re-checked after the last case and differed by exactly the one line deviation D-1 describes.

Two traps were confirmed armed on this repository and this `gh` before anything was scored, on a
throwaway #32 that was closed afterwards:

- A27: `gh issue edit 32 --add-assignee octocat` printed the issue URL, **exited 0**, and left
  `assignees: []`, while `--add-assignee no-such-login-zzz9` exited 1 with `Could not resolve to a
  user or bot with the login`. `repos/<R>/collaborators/octocat` returns 404, so `octocat` is a real
  account without push access, which is the shape the case needs.
- A30: `gh issue view 30 --comments` printed **nothing at all at exit 0** on the zero-comment
  fixture, and after the comment landed it printed the comment block alone with no number, title or
  body. F9's mechanism reproduced exactly, in both directions.

| Case | Verdict | Evidence |
|---|---|---|
| A11 | PASS | #31 carrying `bug`, `duplicate` and `ready`, unassigned. Pre-read resolved `status_labels: ["ready"]`, so both topic labels were invisible to the precondition and the pull was allowed. After one write: `assignees: ["wilsonkichoi"]`, labels `["bug","duplicate","in-progress"]`. `duplicate` survived untouched and never read as a status, which is the sharp half of the case. |
| A20 | PASS | #25 pulled bare to `in-progress` with one assignee, then `move 25 backlog` with removal list `in-progress` and `--remove-assignee wilsonkichoi`. Independent check: `{"assignees":[]}`, labels `["backlog"]`. |
| A24 | SKIP | [MANUAL]. One GitHub login on this machine. With a single login in `assignees` each session reads it as its own and the tie-break cannot fire at all, so two terminals would not have been a partial run. Still never observed. |
| A27 | PASS | `assign 26 octocat`. The write printed the URL and exited 0; the verification read returned `[]`, and the verb reported that the assignment did not land, naming what the issue actually carries. Independent check: `assignees: []`, labels unchanged. Reporting success here is the FAIL the case exists for, and it did not happen. |
| A28 | PASS | #27 assigned to `@me` with `gh` first. `assign 27 none from octocat` refused on the pre-read, named `wilsonkichoi` as the actual holder, and **wrote nothing**: independent check still `["wilsonkichoi"]`. Then the bare `assign 27 none` removed it: `assignees: []`, labels untouched. The real-holder-who-is-not-you half stays [MANUAL]. |
| A29 | PASS | **First read, no retry.** #28 pulled bare to `in-progress` with one assignee, then `move 28 ready` in one write carrying `--remove-assignee wilsonkichoi`. Independent check: `assignees: []`, labels exactly `["ready"]`. The `next` immediately after returned frontier `[12,13,22,28,29]` with `rows: 14`, #28 present on the first attempt. |
| A29b | PASS | Ran with a deviation, D-2. `assign 29 wilsonkichoi`, the explicit `<who>` form, left the status alone: `assignees: ["wilsonkichoi"]`, labels `["ready"]`. The next `next` returned `[12,13,22,28]`, #29 gone; `list ready` returned it with its holder; `show 29` named the holder and the `ready` status. So the A29 fix did not overreach: `move … ready` clears and `assign … <who>` reserves, and the pair survives side by side. |
| A30 | PASS | `show 30` on a zero-comment ticket returned the number, title, body, state, labels, milestone, blockers and `comments: []` from **one** call. After `comment 30 "show probe"`, verified as `["show probe"]` exactly once, the second `show 30` returned the whole ticket again with one comment carrying its author and `createdAt`. Neither read was silent and neither reported the ticket as unreadable. |

The regression reads the run was asked for are the ones inside those cases and are not counted
again: the `next` in A29 was the first of two, `list ready` returned all six `ready` tickets with
`rows: 14` and `inconsistent: [23]`, and `show` ran three times across A29b and A30. Nothing outside
the assignee change moved: #11 stayed off the frontier on its open blocker #9, #22 stayed on it with
its blocker #21 `CLOSED`, and #23 was named inconsistent by every verb that ran.

Deviations from the runbook as written:

- **D-1. The skill was model-invoked for fifteen of its sixteen calls, and the installed `SKILL.md`
  was edited mid-run to allow it.** `713f017` carries `disable-model-invocation: true`, so Claude
  Code's Skill tool refuses the skill and an unattended leg is impossible as the skill is declared.
  One call, `/tracker assign 31`, which is A11, was typed by hand and fired under the unmodified
  install. Two earlier attempts fired nothing and scored nothing: a sixteen-line paste, which the
  harness takes as text rather than as sixteen commands, and a line with two leading spaces, which
  stops the slash command. The operator then deleted `disable-model-invocation: true` from the
  installed `SKILL.md` and restarted with `claude --continue`, since the skill registry is read at
  session start and an in-session edit does not reach it. The remaining fifteen calls were invoked
  through the Skill tool. The installed tracker skill therefore differed from committed `713f017` by
  that one line for A20 onward, verified by `diff -r` at the end to be the only difference in either
  skill directory. No verb reads the flag, so the behaviour under test is the commit's; the identity
  claim is not, and that is why it is written here rather than glossed. An earlier operator edit in
  the same session removed `metadata.allow_implicit_invocation` from `SKILL.md` and
  `policy.allow_implicit_invocation` from `agents/openai.yaml`, which are the Codex-side policy and
  not the Claude Code block; both were restored from the commit before scoring resumed.
- **D-2. A29b ran against the caller's own login rather than a second collaborator.** The case is
  [MANUAL] on GitHub for exactly that reason. `assign 29 wilsonkichoi` is still the explicit
  `<who>` form and not the bare form, so the verb-form distinction the case is about was exercised,
  and a fix that overreached by clearing the name would have failed it. What was not tested is the
  second identity: reserving a ticket for somebody else, and the holder-naming path that goes with
  it. See F10.
- **D-3. Every fixture was made with `gh`, not through the skill.** #25 to #31 were created with
  `gh issue create`, #27's starting assignment with `gh issue edit --add-assignee @me`, which is what
  A28 says to do, and #32 was a throwaway for arming A27's trap. Recorded so the boundary is
  explicit: the skill wrote nothing in this run except through `assign`, `move` and `comment`.

#### Notes from the environment, neither a defect nor a verdict

- The seven fixtures were left open rather than torn down, in the state the table describes: #25
  `backlog`, #26 and #27 unlabelled and unassigned, #28 `ready` unassigned, #29 `ready` held by
  `wilsonkichoi`, #30 unlabelled with one comment, #31 `in-progress` held by `wilsonkichoi` with
  `bug` and `duplicate`. #32 is closed `not planned`. A later run should either use them knowingly
  or create its own again.
- Nothing external mutated a ticket under this run, unlike the previous one.

#### Findings

Numbered on from F9.

**F10. `validation/tracker.md`: A29b is marked [MANUAL] on GitHub with no fallback, and most of it does not need a second collaborator. (A29b, runbook defect, not a skill defect.)**
A29b reads "`$tracker assign <a ready ticket> octocat` against a collaborator this time, or on
`local` any name", and is marked **[MANUAL]** on GitHub "which needs a second collaborator". Taken
literally that makes the case unrunnable on a one-account machine, which is the ordinary case, and
it is what would have left the newer half of the `assign` rework unobserved on GitHub for a second
run running.
Most of what the case tests does not need a second identity. The discriminator is the **verb form**,
not the holder: `assign <id> <who>` must leave the status alone and reserve, where `move <id> ready`
must clear. Running it with the caller's own login as the explicit target exercises that, and an
overreaching fix that cleared the name would fail it just the same. This run did that and it passed:
`assign 29 wilsonkichoi` left `["ready"]` and `["wilsonkichoi"]`, `next` dropped #29, `list ready`
kept it, and `show` named the holder.
What genuinely needs a second collaborator is narrower and is worth stating separately, because it
is the part A24 and A28 also want: a holder who is not the caller, which is what makes the
`from <holder>` refusal reachable from `assign <id> <who>` rather than only from `assign <id> none`,
and what proves the assignment lands for somebody else at all. A27 shows that last one is not
academic: a login without push access is dropped silently at exit 0.
Note also that the case's own example argument, `octocat`, is the account A27 uses precisely
*because* it has no push access, so a reader following A29b literally on a repository they own would
assign nobody and then score the resulting empty `assignees` as the reservation failing.
Fix, in this file: split A29b into the part that runs anywhere and the part that does not. Keep the
frontier, `list` and `show` checks as a non-manual case, say the explicit target may be the caller's
own login and that this tests the verb form rather than the second identity, and mark only the
second-collaborator half [MANUAL]. Drop `octocat` from the example, or say in the case that the name
has to be a real collaborator and that A27 is what happens when it is not.

**Fixed as prescribed.** A29b now runs anywhere, takes any login with push access including the
caller's own, adds the `still ready rather than in-progress` check, and says outright that the
discriminator is the verb form rather than the identity. `octocat` is gone from it, with a line
saying what happens if the name cannot be assigned. The second-identity half is A29c, [MANUAL], and
it names the same gap that keeps A24 and half of A28 unrunnable on one account. The setup section
also now carries the invocation workaround this run improvised, so deleting
`disable-model-invocation: true` from the installed copy is a documented step with a restore rather
than an undeclared edit. Runbook-only change, so no `VERSION` bump: nothing under `skills/` moved.

### 2026-09-19T01:12-07:00 GitHub leg delta, Claude Code

```
TRACKER VALIDATION
backend: github                  harness: claude-code
date: 2026-09-19T01:12-07:00     skill ref: 16d7c5e (feat/tracker)

PASS  9
FAIL  0
SKIP  0

failures:
  none
skipped:
  none

VERDICT: GREEN
```

Delta run against `16d7c5e`, which reworked `next` and `list <status> <milestone>` to read the
primary store instead of the search index. Scope: A9, A10, A12, A21, A23, A23b and the new A26, plus
one `list` and one `show` as regression reads. The rest of leg A passed in the 2026-09-19T00:41 run
against code this commit did not change, and is not repeated here. One new finding, F9, which
produced no FAIL.

**A26 is the point of the run and both halves pass on the first read.** Every `next` and every
milestone-scoped `list` in this leg was scored on one attempt, with no retry and no pause anywhere.
That retires deviation D-3 of the previous entry, where A9 and A12 had to be scored on a second read
of the same query: on `16d7c5e` the first read is right.

Environment: `gh` 2.97.0, `wilsonkichoi/tracker-gh`, carried forward from the previous run with
open issues 9, 11, 12, 13, 14 and milestones M1 to M4. Working directory `/Users/wchoi/tmp/tracker-gh`;
no `setup` run and no new checkout, since no case in scope needs one.

Install verified byte-identical to the **committed** `16d7c5e`, before scoring and again after, with
`git archive 16d7c5e skills/tracker skills/setup | tar -x` and `diff -r` against
`.agents/skills/`. The second check was not ceremony: the source working tree at
`/Users/wchoi/src/skills` picked up uncommitted edits partway through this run, the `claim` to
`assign` rework, so a plain `diff -r` against the checkout would have reported differences that the
installed skill never had. `HEAD` stayed at `16d7c5e` throughout and the installed files never
moved, so every case here was scored against that commit and nothing else. `.claude/skills/` and
`.kiro/skills/` are symlinks to `.agents/skills/`, so all three harnesses resolved the same bytes.

| Case | Verdict | Evidence |
|---|---|---|
| A9 | PASS | `move 21 ready`, `move 22 ready`, then one `next`: frontier `[12,21]`, `rows: 7`. #21 was `backlog` seconds earlier and is in the frontier **on the first attempt**; #22 is absent on its open blocker #21. #12 is the pre-existing unblocked `ready` ticket. No retry. |
| A10 | PASS | `move 21 done` gave `CLOSED`/`COMPLETED` with no status label, then one `next`: frontier `[12,22]`. Hand check on #22: `{"totalCount":1,"nodes":[21],"node_states":["CLOSED"]}`, reproducing the behaviour the node-state filter exists for. A `totalCount == 0` filter would hold #22 back permanently. |
| A12 | PASS | #23 created with `ready` and `in-progress` both. Absent from `next`, `list ready` and `list backlog`; all three reported `inconsistent: [23]`; `show 23` reported `status: inconsistent` with `status_labels: ["ready","in-progress"]` and `all_labels` the same pair. The `next` read was the first, seconds after the create. |
| A21 | PASS | #24 created with `--label ready` then closed `--reason completed`, label deliberately left on. Absent from `list ready`, tickets `[11,12,22]`, and from `next`, frontier `[12,22]`. Confirmed still `CLOSED`/`COMPLETED`/`["ready"]` afterwards, so the label really was stale and really was invisible. |
| A23 | PASS | `list ready M1` returned `[11]` only; M1 resolved to milestone number 3 through `?state=all`. `list ready no-such-milestone` stopped, named `M1`, `M2`, `M3`, `M4`, and queried nothing. Not an empty list at exit 0 and not the `ready` list unscoped. |
| A23b | PASS | Trap confirmed armed immediately before scoring: `gh api repos/<R>/milestones --jq '[.[].title]'` returned `["M1","M4"]` while `?state=all` returned `M1:open M2:closed M3:closed M4:open`. `list ready M2`, a closed milestone, returned `[12]`. Neither a stop nor an empty list. |
| A26 | PASS | **Both halves on one read each.** `move 13 ready` on a `backlog` ticket, then one `next`: frontier `[12,13,22]`, #13 present. Then `gh issue edit 13 --repo <R> --milestone M1` and one `list ready M1`: `[11,13]`, #13 present. No retry and no pause in either half, so the case scored the way it is written to score. |
| list | PASS | `list` with no argument returned all 7 open tickets with `rows: 7` and `inconsistent: []`. Both `backlog` and `ready` resolved in the one pass, and #9 read `backlog` on no label while carrying `stateReason: REOPENED`, which `state: OPEN` correctly suppresses. |
| show | PASS | `show 12` reported `ready`, milestone M2, no assignee, no blockers, no comments, and the `## Related` line naming #9 present in the body with `blockedBy.nodes` empty. Status resolved through the same `jq` definition `list` uses. See F9 for the one rough edge in the command the file prescribes. |

Deviations from the runbook as written:

- **D-1. The skill could not be invoked by the session.** `tracker/SKILL.md` carries
  `disable-model-invocation: true`, so Claude Code's Skill tool refuses it: "Ask the user to run
  /tracker themselves ... Do not replicate this skill's workflow by other means." Every `/tracker`
  call in this run was typed by the human. Three of the nine arrived with leading whitespace, which
  stops the slash command firing, and those were answered from the skill text already loaded in
  context by the earlier invocations. Same instructions, same backend file, but it is a difference
  in how the skill was entered and it belongs on the record. An unattended run of this leg is not
  possible on Claude Code as the skill is currently declared.
- **D-2. A9 and A10 ran against a fresh fixture pair, #21 and #22, not the #9 and #10 of the previous
  run.** That pair is spent: #10 is closed `COMPLETED` and #9 was reopened with its edge gone. #21
  and #22 were created unlabelled, so both read `backlog`, and the edge was written straight to
  `repos/<R>/issues/22/dependencies/blocked_by` rather than through `link`, which is out of this
  run's scope. Verified before scoring: #22 `blockedBy.nodes` = `[{21, OPEN}]`.
- **D-3. A12's and A21's fixtures were made with `gh issue create`,** which is what those two cases
  say to do, and A26's milestone write with `gh issue edit --milestone M1`, which is what A26 says to
  do. Recorded only so the boundary between fixture and skill is explicit: the skill wrote nothing
  in this run except through `move`.

#### Notes from the environment, neither a defect nor a verdict

- **An external session mutated #11 mid-read.** The `list ready` call in A21 reported #11 as assigned
  to `wilsonkichoi`, which was false 10 seconds later. The timeline shows `assigned` at
  `2026-09-19T08:09:32Z` and `unassigned` at `08:09:51Z`, and the read landed inside that window; by
  `08:10:01Z` both the by-number read and the list read agreed the assignee was gone. The `list` was
  correct about the state at the moment it ran. It changed no verdict, since #11 is blocked by open
  #9 and was off the frontier either way and A21 turns on #24 alone. Worth recording because it is
  the shape A24 exists to test arriving by accident, and because a leg run against a repository
  someone else is touching can produce a FAIL that is not the skill's.
- **The skill source drifted under the run.** `/Users/wchoi/src/skills` gained uncommitted edits
  partway through, reworking `claim` into a four-form `assign` verb across `SKILL.md`, `README.md`,
  `github.md`, `linear.md` and `local.md`. The installed copy was unaffected and was re-verified
  against committed `16d7c5e` after the last case. Any future run should diff against the commit
  rather than the checkout for exactly this reason.

#### Findings

Numbered on from F8.

**F9. `github.md`: the first command `show` prescribes returns nothing at all on a ticket with no comments, at exit 0. (show, low severity, documentation defect.)**
`show` is given as two commands:

```
gh issue view <n> --repo <owner/repo> --comments
gh issue view <n> --repo <owner/repo> --json number,title,body,state,...
```

Measured on `gh` 2.97.0 with output piped, which is how any unattended run invokes it:

| Command | Output |
|---|---|
| `gh issue view 12 --comments` | **nothing**, exit 0. #12 has no comments |
| `gh issue view 12` | the full issue: header fields, then the body |
| `gh issue view 11 --comments` | the comment block alone, no title, no body, no header |

`--comments` is not "the issue plus its comments"; it replaces the issue with the comments. On a
ticket with none it prints an empty result at exit 0, which is indistinguishable from a ticket that
does not exist or a read that failed. That is the same wrong-answer-shaped-like-a-right-one the rest
of this file is built to avoid, and it is the one place the file hands a caller a bare empty output
with no `rows` field and no guard to apply to it.
Nothing failed here, because the second command carries the number, title, body, state, labels,
milestone and blockers, and the run's two `show` calls both passed on it. The defect is that the
file presents the `--comments` call as a read of the ticket, so a session that ran only the first
command, or that treated its empty output as a signal, would report a ticket it can see perfectly
well as missing.
Fix: say that `--comments` returns the comments only and prints nothing when there are none, and
give the deterministic form for the comment list, which the file already uses for `comment`'s own
verification:

```
gh issue view <n> --repo <owner/repo> --json comments --jq '[.comments[] | {author: .author.login, body}]'
```

Runbook: no case covers `show`'s comment output at all. Add one that reads a ticket with zero
comments and a ticket with one, and requires the ticket to be reported in full in both.

**Fixed in 0.0.12, and the two commands became one.** Reproduced exactly: `gh issue view 11
--comments` printed the comment block with no title, body or header, and `gh issue view 12
--comments` printed nothing at exit 0. `comments` is also a valid `--json` field on `gh issue view`,
carrying `author`, `createdAt` and `body`, and it returns `[]` rather than silence on a ticket with
none, verified on both issues. So `show` now reads everything in one call with `comments` on the
end of the existing field list, and `--comments` is named in the file as the thing not to use, with
what it actually does. Runbook: A30 added, reading a ticket before and after its first comment and
requiring the whole ticket both times.

### 2026-09-19T00:41-07:00 GitHub leg, Claude Code

```
TRACKER VALIDATION
backend: github                  harness: claude-code
date: 2026-09-19T00:41-07:00     skill ref: e01f335 (feat/tracker)

PASS  30
FAIL  0
SKIP  2

failures:
  none
skipped:
  A24  [MANUAL] claim race, needs a second terminal and ideally a second GitHub account
  A25  [MANUAL] needs a GitHub Enterprise host that does not expose blockedBy

VERDICT: GREEN
```

Both failures from the 2026-09-18 run now pass. A2 resolves the remote inside Section A, and A23
stops on an unknown milestone and names the ones that exist. A5's new comparison method works, and
A23b passes. Two new findings are recorded below; neither produced a FAIL, and F7 is the one that
would have, had the run scored on a first attempt.

Scope: S1, S2, S3; leg A A1 to A25 including A23b; leg D D4, D5, D6. Legs B and C were not run, and
D1 to D3 were out of scope.

Environment: `gh` 2.97.0, `wilsonkichoi/tracker-gh` emptied to 0 issues and 0 milestones before the
leg began, four status labels already present from the previous run. Installed skills verified
byte-identical to the branch in all three working directories before scoring, with
`diff -r` over both `tracker` and `setup`, because the branch was force-pushed.

Working directories, three rather than the two the runbook implies:

- `~/tmp/tracker-val-2`, no `.git` at install time, for A1, A2, D4, D5 and D6. A2 took the
  `gh repo create` path and created `wilsonkichoi/tracker-val-2`, private, which is a new repository
  this run made and teardown may delete.
- `~/tmp/tracker-val-a3`, a fresh clone of `wilsonkichoi/tracker-gh`, for A3. Needed because
  `/Users/wchoi/tmp/tracker-gh` still carried the previous run's `docs/dev-agents/config.md`, and
  `setup` treats an existing config as choices already made, so A3's "Section A asks for the backend
  and nothing else" could not have been observed there.
- `/Users/wchoi/tmp/tracker-gh` itself was not used for a `setup` run. A4 onward ran against the
  repository, not any one checkout.

| Case | Verdict | Evidence |
|---|---|---|
| S1 | PASS | `.agents/skills/tracker/` holds `SKILL.md`, `README.md`, `github.md`, `linear.md`, `local.md`, `agents`. |
| S2 | PASS | Both `.claude/` and `.kiro/` resolve `github.md` to `# Backend: GitHub Issues`; the installer created both. |
| S3 | PASS | `-l` reports exactly 2 skills, `setup` and `tracker`. Nothing named `skill-name`, nothing from `validation/`. |
| A1 | PASS | The `git init` offer was the only question on screen, before Section A. `git rev-parse --git-dir` returned `.git` afterwards. |
| A2 | PASS | **Fix confirmed.** The remote question came inside Section A, immediately after the `github` answer and before Section B was asked. `git remote -v` names `git@github.com:wilsonkichoi/tracker-val-2.git`; the config records `github_repo: wilsonkichoi/tracker-val-2` with no intention-to-add language. |
| A3 | PASS | Section A asked the backend and nothing else: `gh auth status` and the existing remote both satisfied, so no follow-up was generated. `git remote -v` byte-identical before and after by `diff`; config names `wilsonkichoi/tracker-gh`. |
| A4 | PASS | `backlog in-progress in-review ready` all present, `done` and `cancel` both absent. Setup reported all four as already existing and created none. |
| A5 | PASS | **Fix confirmed.** #9 labels `[]`. Body compared with `gh issue view 9 --json body \| jq --rawfile sent <file> -e '.body == $sent'`: `true` at exit 0. |
| A6 | PASS | #10 `blockedBy.nodes` = `[9]`, written by `create`'s second call. |
| A7 | PASS | #11 `blockedBy.nodes` = `[9]`. Blocker database id was `5508545108`, not `9`. |
| A8 | PASS | #12 carries `## Related` with `- #9` in the body and `blockedBy.nodes` empty. |
| A9 | PASS | frontier `[9]`, #10 excluded on its open blocker, `rows: 2`. **Took two attempts:** the first returned `rows: 0`. See F7. |
| A10 | PASS | frontier `[10]` after #9 closed. Hand check: #10 `totalCount: 1` with `node_states: ["CLOSED"]`, reproducing the behaviour the frontier query is built around. |
| A11 | PASS | Claim on #10 carrying `bug` and `duplicate` succeeded. Pre-read showed `status_labels: ["ready"]` against `all_labels: ["bug","duplicate","ready"]`. After: `["bug","duplicate","in-progress"]`, one assignee. |
| A12 | PASS | #13 absent from `next`, `list ready` and `list backlog`, named `inconsistent: [13]` by all three, and `show` reported `status: inconsistent` with `status_labels: ["in-progress","ready"]`. **`next` took two attempts**; the first returned `rows: 0` and named nothing. See F7. |
| A13 | PASS | `move 13 ready` with removal list `in-progress` and target `ready` left exactly `["ready"]`. |
| A14 | PASS | `move 10 in-progress` on a ticket already there, removal list empty, kept `["bug","duplicate","in-progress"]`. |
| A15 | PASS | #10 `CLOSED`/`COMPLETED`, no status label, `bug` and `duplicate` both retained. |
| A16 | PASS | #15 `stateReason: DUPLICATE`. |
| A17 | PASS | Pre-read saw `CLOSED`/`DUPLICATE`, the move was refused, and #15 was unchanged afterwards. |
| A18 | PASS | #14 reads `backlog`, present in `list backlog` as `[14,12,11]`, absent from the frontier `[13]`. See deviation D-2. |
| A19 | PASS | #9 reopened: `state: OPEN`, `stateReason: REOPENED`, `status: backlog`. Confirms the `REOPENED` handling added in `e01f335`. |
| A20 | PASS | #13 claimed, then moved to `backlog`: `assignees: []`, `labels: ["backlog"]`. |
| A21 | PASS | #16 closed while still carrying `ready` appeared in neither `list ready` nor `next`. |
| A22 | PASS | `runbook note` present on #11 exactly once. |
| A23 | PASS | **Fix confirmed.** `M1` resolved to number 3 via `milestones?state=all`; query by number returned `[11]` only. The unknown name returned empty from the resolver, which stopped and named the milestones that exist, `M1` and `M2`. Not an empty list at exit 0. |
| A23b | PASS | `M2`, closed, resolved to number 4 with `state=all`; query returned `[12]`. Neither empty nor a stop. But the case's stated mechanism did not reproduce: see F8. |
| A24 | SKIP | [MANUAL] |
| A25 | SKIP | [MANUAL] |
| D4 | PASS | Claude Code's own picker was used for every question, recommended option first and labelled `(Recommended)`. |
| D5 | PASS | **Fix confirmed.** Six questions, six turns, in order: `git init` alone; Section A backend; Section A's remote prerequisite; Section B; Section C; Section D. At no point were `git init` and the interview, or two interview sections, in one picker. |
| D6 | PASS | Every question was the last thing in its turn. No tool call followed a question and no work ran while one was outstanding. |

Deviations from the runbook as written:

- **D-1.** A3 ran in a third directory, a fresh clone, for the reason given under Working
  directories. The runbook's leg A text assumes the A3 checkout is also where A4 onward runs; here
  A4 onward ran against the repository directly, which the checks do not depend on.
- **D-2.** A18 says to create the issue in the web UI. #14 was created with `gh issue create` and no
  label. The stored record is identical, so the case still tests how the skill reads a ticket nobody
  labelled. Same deviation as the previous run.
- **D-3.** A9 and A12 were scored on a second read of the same query, with no state change in
  between. The runbook does not authorise a retry. `github.md` does describe the frontier as a
  candidate list subject to eventual consistency, so the retry is within how the skill is meant to be
  used, but a single-attempt unattended run would have scored both FAIL. F7 is that finding.

#### Findings

Numbered on from the previous run's F1 to F6, all of which `e01f335` addressed.

**F7. `tracker`: an empty filtered read straight after a write is reported as an empty result, with nothing to distinguish index lag from a genuinely empty frontier. (A9, A12, real defect.)**
Every filtered `gh issue list` goes through GitHub's search API, which `github.md` already records as
eventually consistent. What neither file does is tell a verb what to do about it. Measured three
times this run, each with the primary store confirming the write had landed:

| Query | First read | Second read |
|---|---|---|
| `next` after `move 9 ready` and `move 10 ready` | `rows: 0`, frontier `[]` | `rows: 2`, frontier `[9]` |
| `next` after creating #13 with two status labels | `rows: 0`, `inconsistent: []` | `rows: 1`, `inconsistent: [13]` |
| `--milestone M4` after assigning #13 to M4 | `[]` | `[13]` |

`SKILL.md` says an empty frontier is never inferred from a truncated result or from a host without
dependency support, and `github.md` says a missing ticket is never proof a `create` failed and must
be re-read by number. Neither covers this: a ticket made `ready` seconds ago yields `rows: 0`, which
passes every guard the skill has, and `next` then says the frontier is empty. That is a wrong answer
shaped like a right one, which is the failure mode the milestone rule was just written to prevent.

**Fixed in 0.0.11, and the mechanism is now known rather than inferred.** `gh issue list` has two
backends and the flags pick which one, shown by `GH_DEBUG=api` on `gh` 2.97.0: no filter,
`--assignee` and `--state` send `query IssueList` over the repository's own issues, which is the
primary store, while `--label`, `--milestone` and `--search` send a search query
(`label:ready repo:<owner/repo> state:open type:issue`) to the index. `--milestone <number>` is no
escape either: `gh` resolves it back to the title and sends `milestone:<title>` to the same index.
Measured three times in a row: an issue created with `--label ready` was in the primary-store read
immediately on 3 of 3 trials and missing from `--label ready` on 3 of 3, still two tickets behind one
trial later. So the fix is not a retry or a pause. `next` drops `--label ready` and
`--search "no:assignee sort:created-asc"` and reads the same unfiltered page `list` already reads,
doing the status test, the assignee test and the ordering in `jq`; `list <status> <milestone>` drops
`--milestone` and filters on `.milestone.title`, which the payload already carries. `github.md` gains
a **Which reads are authoritative** section stating the rule, and the truncation rule loses its
advice to sort on the server, since that was what pushed the read onto the index in the first place.
`SKILL.md` states it for every backend: an empty frontier is never inferred from a read that is not
the backend's authoritative one. Runbook: A26 added, and it fails on a retry rather than passing on
one, which is what D-3 shows this run could not do.
It also makes the runbook fragile. A9 and A12 run `next` immediately after a write and would score
FAIL on a first attempt, which is how a correct skill gets recorded as broken.
Fix: `rows: 0` from a filtered read taken within seconds of a write is not evidence of an empty
result. Re-read before reporting, and say the read was retried. The existing `rows` field is what
this can be keyed on, so no new query shape is needed.

**F8. `github.md`: the stated reason for resolving a milestone title to a number is false, and A23b cannot discriminate what it claims to. (A23b, documentation defect.)**
`github.md` states, as verified against `gh` 2.97.0, that "`--milestone <title>` for a **closed**
milestone returns an empty list too, at exit 0, while `--milestone <its number>` returns that
milestone's tickets. Titles resolve against open milestones only." That did not reproduce. Against
the same `gh` 2.97.0:

- `M2`, closed, with #12 in it: `--milestone M2` returned `[12]` on 3 of 3 trials.
- `M3`, freshly created and **open**, with #14 in it: `--milestone M3` returned `[]`, then `[14]`
  after it was closed, which looks like the documented behaviour inverted.
- `M4`, left **open**, with #13 just assigned: `--milestone M4` returned `[]` and
  `--milestone 6` returned `[]` too, in the same breath, while `gh issue view 13` confirmed the
  milestone. One read later both returned `[13]`.

The number form lags identically to the title form, so the distinction the file draws does not
exist. The mechanism is F7's search index lag, tracking write recency rather than milestone state.
The earlier measurement was almost certainly a closed milestone queried by title immediately after
the write, then by number a moment later once the index had caught up.
What survives: resolving the title is still right, and `state=all` is still required, but for the
existence check rather than for the query. `gh api repos/<R>/milestones` returns open milestones
only, so without `state=all` the resolver reports a closed milestone that has tickets as a name that
does not exist, which is the stop A23b names as a FAIL. That much was confirmed:
`gh api repos/<R>/milestones --jq '[.[].title]'` returned `["M1"]` while `M2` existed and held #12.
Fix, two places:

- `github.md`: drop the claim that titles resolve against open milestones only. Keep the resolver,
  and justify `state=all` by the existence check it protects. Note that both query forms are subject
  to the search index lag of F7.
- `validation/tracker.md`: A23b's discriminator does not hold. "Empty means the title was passed
  through" is not true, since a passed-through title returns the tickets, and an empty result means
  the read was taken too soon. Rewrite the case to check the resolver against a closed milestone
  directly, which is the real guarantee, rather than inferring it from the query's shape.

**Confirmed and fixed in 0.0.11.** Reproduced independently: with the index settled, all four
milestones on `wilsonkichoi/tracker-gh`, two of them closed, returned identical results by title and
by number. `GH_DEBUG=api` then showed why the distinction was never real: `--milestone <number>` is
translated by `gh` into `milestone:<title>` before it is sent, so both forms are the same search
query. The 2026-09-18 measurement was a closed milestone queried by title seconds after the write
and by number a minute later, which is F7 and not a milestone-state effect. The false claim is out
of `github.md`, `--milestone` is gone entirely with the scoping now done in `jq`, and `state=all`
stays with its real justification, the existence check: `gh api repos/<R>/milestones --jq '[.[].title]'`
returned `["M1"]` while `M2` existed, was closed, and held #12, so a resolver without it stops on a
milestone that is right there. A23b is rewritten to check that, and to confirm the trap is armed
before scoring.

### 2026-09-18T23:29-07:00 GitHub leg, Claude Code

```
TRACKER VALIDATION
backend: github                  harness: claude-code
date: 2026-09-18T23:29-07:00     skill ref: a415ff2 (feat/tracker)

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

Timestamp backfilled on 2026-09-19 from commit `7fb14b7` in `wilsonkichoi/tracker-gh`, which this
run's step 7 created at `2026-09-18T23:29:53-07:00`. The entry recorded only a date, so the time is
evidence from inside the run rather than a reading taken at the time.

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
