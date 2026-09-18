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
git init && mkdir -p .claude .kiro
npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#feat/tracker' -a claude-code -a codex -a kiro-cli
```

**S1 install layout.** Check: `ls .agents/skills/tracker/`. Expect `SKILL.md`, `github.md`,
`linear.md`, `local.md`, `agents`.

**S2 sibling resolution.** Check: `head -1 .claude/skills/tracker/github.md` and the same under
`.kiro/`. Expect `# Backend: GitHub Issues` from both.

**S3 one skill per name.** Check:
`npx skills@latest add 'https://github.com/wilsonkichoi/skills.git#feat/tracker' -l`.
Expect exactly 2 skills and nothing named `skill-name`.

---

## A. GitHub backend

Run `$setup`, answer `github`.

**A1 four labels, not seven.**
Check: `gh label list --repo <R> --json name --jq '[.[].name]|sort|join(" ")'`
Expect `backlog`, `in-progress`, `in-review`, `ready` present; `done`, `cancel`, `duplicate` absent.

**A2 create writes the ticket.** `$tracker create` with ticket A.
Check: `gh issue view <A> --repo <R> --json title,body,labels`
Expect the body as sent and no status label, since `create` defaults to `backlog`.

**A3 create writes the edge.** `$tracker create` with ticket B naming `#<A>` under `## Blocked by`.
Check: `gh issue view <B> --repo <R> --json blockedBy --jq '[.blockedBy.nodes[].number]'`
Expect `[<A>]`. This is the edge `create` writes as a second call; its own exit code says nothing
about it.

**A4 frontier excludes the blocked ticket.** `$tracker move <A> ready`, `$tracker move <B> ready`,
then `$tracker next`.
Expect A and not B.

**A5 closed blocker releases the frontier.** `$tracker move <A> done`, then `$tracker next`.
Expect B.
Check the reason by hand:
`gh issue list --repo <R> --state open --json number,blockedBy --jq '.[]|select(.number==<B>)'`
Expect `blockedBy.totalCount` still `1` with the node `CLOSED`. A `next` that filtered on
`totalCount` would never return this ticket.

**A6 topic labels do not block a claim.**
`gh issue edit <B> --repo <R> --add-label bug`, then `$tracker claim <B>`.
Check: `gh issue view <B> --repo <R> --json assignees,labels`
Expect `bug` and `in-progress`, one assignee, you. A refusal here means the pre-read counts topic
labels as status labels.

**A7 multi-status issue never reaches a result.**
`gh issue create --repo <R> --title "two statuses" --body x --label ready --label in-progress`
then `$tracker next` and `$tracker list ready`.
Expect that issue in neither result, and named as inconsistent in both.

**A8 multi-status issue is repairable.** `$tracker move <that id> ready`.
Check: `gh issue view <that id> --repo <R> --json labels --jq '[.labels[].name]|sort'`
Expect exactly `ready`.

**A9 the no-op move keeps its label.** `$tracker move <B> in-progress` on a ticket already there.
Check: `gh issue view <B> --repo <R> --json labels --jq '[.labels[].name]|sort'`
Expect `bug` and `in-progress` both. An empty result means the add and remove lists overlapped.

**A10 terminal move records the reason and strips the label.** `$tracker move <B> done`.
Check: `gh issue view <B> --repo <R> --json state,stateReason,labels`
Expect `CLOSED`, `COMPLETED`, no status label, `bug` retained.

**A11 duplicate records its original.** Create C and D, then `$tracker move <D> duplicate <C>`.
Check: `gh issue list --repo <R> --state closed --json number,stateReason`
Expect D as `DUPLICATE`.

**A12 terminal is terminal.** `$tracker move <D> ready`.
Expect a refusal. `gh issue close` on a closed issue exits 0 and keeps the old reason, so the
pre-read is the only guard.

**A13 human-made ticket reads as backlog.** Create an issue in the web UI, no label, one-line body.
`$tracker show <id>` expect `backlog`; `$tracker next` expect it absent; `$tracker list backlog`
expect it present.

**A14 reopened ticket reads as backlog.** Reopen a closed issue in the web UI.
`$tracker show <id>` expect `backlog`.

**A15 backing off clears the assignee.** `$tracker claim <some ready ticket>`, then
`$tracker move <it> backlog`.
Check: `gh issue view <it> --repo <R> --json assignees`
Expect empty.

**A16 stale label stays invisible.**
`gh issue create --repo <R> --title stale --body x --label ready` then
`gh issue close <it> --repo <R> --reason completed`.
`$tracker list ready` and `$tracker next` expect it in neither.

**A17 comment lands and is verified.** `$tracker comment <some id> "runbook note"`.
Check: `gh issue view <it> --repo <R> --json comments --jq '[.comments[].body]'`
Expect the exact body present exactly once.

**A18 [MANUAL] claim race.** Two terminals, one `ready` unassigned ticket, `$tracker claim <id>` in
both at once. Expect the loser to remove only its own assignment, leave `in-progress` alone, and
report. Needs a second terminal, and ideally a second GitHub account.

**A19 [MANUAL] host without issue dependencies.** Run `$tracker next` against a GitHub Enterprise
host that does not expose `blockedBy`. Expect a loud stop, never an empty frontier. Needs such a
host.

Tear down: `gh repo delete <R>` (needs the `delete_repo` scope, or do it in the web UI).

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

**B5 frontier.** `$tracker move <A> ready`, `$tracker move <B> ready`, `$tracker next`.
Expect A only.

**B6 claim resolves an identity.** `$tracker claim <A>`.
Check the file: `status: 'in-progress'` and `assignee` equal to `git config user.name`. An empty
assignee is a FAIL; the skill should have stopped and said the identity was unresolvable.

**B7 terminal releases the frontier.** `$tracker move <A> done`, then `$tracker next`. Expect B.

**B8 comment.** `$tracker comment <B> "a note"`. Check the file: the body is under `## Comments`
with a `### <date> <author>` heading.

**B9 the tracker never commits.** Check: `git status --porcelain`.
Expect the ticket files listed as uncommitted. A clean tree is a FAIL.

**B10 hand-written file.** `printf '# just a title\n\nsome prose\n' > docs/dev-agents/issues/099-hand.md`
then `$tracker show 99`. Expect `backlog` rather than an error.
Then `$tracker move 99 ready` and check the file gained a frontmatter block carrying only the fields
that verb sets, with the prose untouched.

**B11 id forms are interchangeable.** `$tracker show 99`, `$tracker show 099`, `$tracker show '#99'`.
Expect the same ticket three times.

---

## C. Linear backend

Nothing in `linear.md` has been run against a live workspace. Every case here is expected to be SKIP
without a scratch Linear team, and a run that skips them all is honest, not green-by-omission.

**C1 [MANUAL] state resolution by type.** Ask the session to show the mapping it resolved. Expect it
read the workflow states and mapped by state type.

**C2 [MANUAL] renamed state.** Rename the team's `Done` to `Released`, then `$tracker list done`.
Expect those tickets still read as `done`. A skill matching on name would report them `backlog`.

**C3 [MANUAL] ambiguity is a hard stop.** On a team with two `started` states and no `linear_states`
in the config, run any verb that writes `in-progress`. Expect a stop that lists both candidates and
asks, never a guess.

**C4 [MANUAL] recorded mapping is reused.** Add `linear_states` to the config and re-run C3. Expect
no question and the correct state.

**C5 [MANUAL] triage is backlog.** File an issue into the team's Triage state by hand, then
`$tracker list backlog`. Expect it present.

**C6 [MANUAL] silent write is caught.** Attempt a status write with a state name that is close but
not exact. Linear returns success and changes nothing. Expect the verification read to catch it and
the report to say the write did not land.

**C7 [MANUAL] no relation tool.** On a workspace whose MCP server exposes no relation tool, expect
`link` to stop and `next` to stop, never an unverified frontier.

---

## D. Harness parity

Run the same one command from one install on each harness available.

**D1 Codex.** `$tracker list` expect the backend answers.
**D2 Claude Code.** `/tracker list` expect the same result.
**D3 [MANUAL] Kiro CLI.** `/tracker list`, and check the slash-command menu renders the one-line
description correctly rather than truncating it at a colon or showing `>`.
