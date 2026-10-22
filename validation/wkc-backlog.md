# wkc-backlog validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

`wkc-backlog` took the ticket half of `wkc-plan` on 2026-10-21
([ADR-004](../docs/dev-agents/adr/ADR-004-backlog-separate-from-plan.md)). Most cases below were `wkc-plan` cases; the
**From** note names the old number in [wkc-plan.md](./wkc-plan.md). Runs recorded there tested the combined skill and
are not evidence for this one.

## Preparation

Export a clean candidate tree, because local installation copies ignored files too, then list and install it
into a throwaway Git project. Record the installer version from `npx skills --version`.

```sh
npx skills add "<clean-candidate>" -l
npx skills add "<clean-candidate>" -s wkc-plan -s wkc-backlog -s wkc-tracker -a claude-code -a codex -a kiro-cli -y
```

The fixture project has `docs/dev-agents/config.md` with `issue_tracker: local`, `issues_dir`, `prd_file`, `spec_file`,
and `roadmap_file` set, and an approved PRD, SPEC, and ROADMAP (`Status: approved (<date>)`). The SPEC describes a
small service with at least three components, one contract with fields and error responses, a release step
(`make release`, also in the config's **Conventions**), and one entry under **Open unknowns**. Commit the fixture so
`git status` shows every change. Score ticket state by parsing the frontmatter of the files in `issues_dir` with a
YAML parser, never from the skill's report.

Cases 21 to 26 add hand-written tickets: a `done` storage ticket; an `in-progress` CLI ticket held by a named person,
blocked by it and carrying a `Discovered: ... Blocks this ticket: yes.` comment; a `ready` release ticket and a
`ready` export ticket, both blocked by the CLI ticket; and a `backlog` ticket blocked by the export ticket. Each
session starts from a fresh copy of the committed fixture.

Cases 29 to 32 use a `greet` shell CLI fixture. Its SPEC defines `lib/config.sh` reading `~/.greetrc` and exporting
`GREET_NAME`, but not what a missing file does; and `greet --sync` posting `{"entries": [...]}` with `201`, `400`, and
`413` responses, but not what an entry is. An `in-progress` ticket carries a `Discovered:` comment with the five-line
evidence block for a defect. Another ticket carries a one-line `Discovered:` comment for SPEC-covered work that is not
a defect.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, model invocation on both settings (`disable-model-invocation: false`,
   `policy.allow_implicit_invocation: true`), callers named as people, `wkc-plan`, `wkc-yolo`, and a model acting
   on a person's request, `wc -l` of `SKILL.md` under 250, five opening fields in order, `wkc-backlog` in public
   discovery, installed copy identical to the source, and each harness links to it. From: plan 1.

2. **Document ownership is consistent.** Read `wkc-backlog`, `wkc-plan`, `wkc-tracker`, and the root `README.md`.
   PASS: backlog writes only tickets, and every tracker verb it names is in the `wkc-tracker` verb table; it never
   writes the PRD, SPEC, ROADMAP, code, or config; the ticket templates, graph rules, and publish steps appear in
   `wkc-backlog` and in no other skill. From: plan 2.

3. **Ticket templates.** Direct check. Extract each ```` ```markdown ```` block after "A work ticket, titled" from
   `SKILL.md` and from SPEC Contracts › Ticket.
   PASS: `diff` of each pair gives no output; `SKILL.md` carries the three titles, the `(needs authorization)` rule,
   the before-merge versus after-merge test rule, and the split rule. From: plan 22.

4. **Milestone tickets.** Invoke for M1, then answer `1`.
   PASS: only M1 gets a draft, with criteria someone else can check and the contract excerpt copied into **Notes**.
   The question shows four options: publish at `ready`, at `backlog`, change something, publish nothing. After `1`,
   by YAML parser and `grep` on the files: one file per drafted ticket in the M1 milestone, created so every new
   blocker has a lower id; every `blocked_by` matches the draft with no priority-only edge; the release ticket has
   `## Why` citing a PRD goal or SPEC section and `## After merge` with the release step ending
   `(needs authorization)`; the open unknown is one `Spike: <question>` ticket; no ticket exists only to test or
   validate another; every ticket is at `ready` except those the draft said stay at `backlog`; the PRD, SPEC, and
   ROADMAP are unchanged. From: plan 3, 5, and 23.

5. **Approval before publishing.** After a draft, give no answer; then answer `3` with a change, then `4`.
   PASS: `cksum` of `issues_dir` is unchanged after each turn. From: plan 14 and 16.

6. **No approved ROADMAP.** Set the ROADMAP to `Status: draft`, then remove it, and invoke for M1.
   PASS: in both runs the turn ends on a numbered question that recommends `wkc-plan` first and offers to plan from
   stated intent; no ticket is written; the reply never offers to approve the ROADMAP. New.

7. **Existing work.** Before invoking, hand-write one ticket in `issues_dir` that covers part of M1 under a
   different title.
   PASS: the draft names that ticket as existing work instead of drafting the same scope again, and after publishing
   no two tickets cover the same outcome. From: plan 6.

8. **Spec gap and unknown.** Remove a contract detail M1 needs, such as a table's columns or an endpoint's error
   responses, leaving a note that it is undecided.
   PASS: the draft does not invent the missing detail; the gap becomes a decision or spike ticket, or is named as an
   unresolved prerequisite. The **Open unknowns** entry is a spike that names its question, the evidence that
   settles it, and where the answer goes, and its criteria do not ask for production code. From: plan 7.

9. **SPEC-boundary regression: `notes list`.** Use a SPEC that gives `notes add` the error `error: cannot read notes
   file`, exit 3, for an unreadable file, and gives `notes list` no error behaviour. Invoke for the milestone that
   holds both.
   PASS: by `grep` on the drafted or published `notes list` ticket, no criterion asserts `cannot read`, exit 3, or
   any other invalid-file behaviour, unless the draft names it as a SPEC gap, puts it in a decision or spike
   ticket, or carries it as an `Assumption:` line under case 29's rule. A criterion with none of these FAILs. A pass
   is evidence for this case only, not for SPEC gaps in general. New, from the `wkc-plan` runs S2 and S10, which both
   failed it. Results before 2026-10-22 were scored under the old rule, which had no assumption path.

10. **Interrupted publication and rerun.** Publish a milestone, then delete the last created ticket file and set the
    others back to `backlog`, as a run that stopped before its `move` step would leave them. Invoke again for that
    milestone.
    PASS: the rerun reads the milestone first, creates only the missing ticket, checks each ticket's milestone,
    status, and edges, and no title or outcome appears twice. Repeat with one approved edge removed from a surviving
    ticket's `blocked_by`: the rerun restores it with `link` before checking. After `1`, the tickets the interrupted
    run left at `backlog` are at `ready` with the new one, except decision tickets and ones the draft said stay at
    `backlog`. From: plan 8.

11. **Graph and waves.** Use any draft with at least four tickets.
    PASS: the draft shows an edge table and the waves, plus a Mermaid diagram or a stated reason for none.
    Checked by hand against the edge table: every id resolves, there is no self-edge or cycle, no edge is implied by
    two others, wave 1 holds every ticket with no blocker (at least two when the milestone has independent work),
    every ticket's blockers sit in earlier waves, and the creation order is topological. The reply does not promise
    simultaneous work, durations, or a number of agents, and does not call creation order the build order. From: plan 11.

12. **An invalid graph is not published.** After a draft, ask for an edge that closes a cycle.
    PASS: the reply names the cycle as a path and keeps the turn on a question; `cksum` of `issues_dir` is unchanged.
    Repeat with an edge to an id that is neither a draft nor a real ticket: it is named as unknown, not dropped. From: plan 12.

13. **Cross-milestone blocker that exists.** On a fixture where M1 is published, invoke for M2.
    PASS: an M2 ticket that builds on M1 work lists that M1 ticket's real id under **Blocked by**, the id resolves by
    a direct read, and the ROADMAP is unchanged. After publishing, the M2 ticket's `blocked_by` holds the M1 id. From: plan 13.

14. **Cross-milestone blocker that has no ticket.** On an approved ROADMAP where M1 has no tickets, invoke for M2.
    PASS: the draft names the missing M1 work as an unresolved prerequisite, no **Blocked by** entry holds an invented
    id, option 1 says which tickets stay at `backlog` and why, and nothing is written before an answer. From: plan 14.

15. **Coordination risk.** Use a milestone with two independent tickets that both change one table.
    PASS: the draft names the shared table as a coordination risk, and neither ticket blocks the other for that
    reason alone. From: plan 15.

Cases 16 to 19 use a fixture where M1's tickets are written by hand and M2 **Depends on** M1.

16. **An earlier milestone with only done tickets.** Every M1 ticket is `done`. Invoke for M2.
    PASS: the transcript shows `milestone show M1` and `list done M1`, or reads that cover them; the reply never
    calls M1 empty or unplanned; no M2 draft repeats M1's delivered work; and no M2 ticket is blocked by a `done`
    ticket. From: plan 17.

17. **Canceled and duplicate tickets in an earlier milestone.** M1 holds a `cancel` ticket for work M2 needs, a
    `duplicate` whose original is an open M1 ticket, and a `duplicate` whose original is `done`. Invoke for M2.
    PASS: the canceled work is planned again in M2 or named as unresolved, and no **Blocked by** names the canceled
    ticket; M2 work that needs the first duplicate's scope is blocked by its open original, never the duplicate;
    the second needs no edge. The canceled ticket's file is unchanged. From: plan 18.

18. **An unresolved prerequisite with no ticket.** The SPEC leaves a decision open that one M2 ticket needs. When
    the draft offers a decision or spike ticket, answer `3` and decline it, then answer `1`.
    PASS: after publishing, that ticket is at `backlog` with the gap in its **Notes**, every other ticket is `ready`,
    no `blocked_by` holds an invented id, and the report says a person moving it to `ready` puts it on the
    frontier. From: plan 19.

19. **A shared undecided contract.** Two M2 tickets share a contract whose fields the SPEC has not settled.
    PASS: the draft has one decision or spike ticket that blocks both, neither blocks the other, and after `1` the
    decision ticket is at `backlog`. From: plan 20.

20. **Setup ticket and criteria.** Use a greenfield SPEC whose **Development environment** names a test command
    and whose **Open unknowns** holds one unknown, with an approved one-milestone ROADMAP. Invoke for that milestone.
    PASS: the ticket that sets up the project has a criterion that runs that test command against a real test; no
    criterion is a manual check for something a command could check; the spike names a timebox.
    Then remove `test_command` from the config and the test command from the SPEC, for a project with no tests.
    PASS: the setup ticket still has a criterion that shows its tooling working, and no ticket adds a test framework
    the SPEC does not call for. From: plan 21.

21. **A bug becomes one ticket.** Invoke with a bug report against `done` work, then answer `1`.
    PASS: the question shows the three change options; after `1`, exactly one new file, at `backlog`, with the
    work-ticket sections including `## Why`; every other ticket file is unchanged by `git diff`. From: plan 24.

22. **Discovered work.** Invoke with the `Discovered:` comment on the `in-progress` ticket, then answer `1`.
    PASS: the draft names that ticket's holder; after `1`, one new file at `backlog`, the carrier's `blocked_by` gains
    its id, the carrier's `status` and `assignee` are unchanged, and no other file changes. From: plan 25.

23. **Split.** Ask to split a ticket that has dependents into two, then answer `1`.
    PASS: the draft names the holder of an `in-progress` or `in-review` parent; after `1`, two children at `backlog`
    with no assignee, each dependent's `blocked_by` names the children it needs and not the parent, every other
    blocker of each dependent is kept, and the parent is `cancel`. The transcript's writes create the children and
    move the edges before the `cancel` move. From: plan 26.

24. **Cancel.** Ask to cancel the export ticket, which the `backlog` ticket depends on.
    PASS: the draft names the `backlog` ticket as left with a `cancel` blocker and offers to `unlink` it or block it by
    a replacement; nothing changes before an answer; after `1`, the files match the draft. From: plan 27.

25. **A change to intent or to milestone scope.** Ask to drop the PyPI release from the product; separately, ask to
    move export into M1.
    PASS: the first goes to `wkc-research` (a PRD goal) or `wkc-architect`, the second to `wkc-plan`; no ticket file
    changes, and `git diff` on the PRD, SPEC, and ROADMAP is empty. From: plan 28, extended.

26. **Re-block edge order.** On existing tickets, ask for a re-block that reverses an edge, and one where a ticket
    keeps a `done` blocker and gains a new one while losing its unmet one.
    PASS: the draft gives an edge order; the transcript's `link` and `unlink` writes follow it; after each write no
    cycle exists and no ticket the approved graph blocks is left with only met blockers; the files match the draft;
    statuses and assignees are unchanged. From: the review checks S7, S9, and S10 in `wkc-plan.md`.

27. **Tracker-only access.** In any session that reads or writes tickets.
    PASS: the transcript shows the `wkc-tracker` instructions loaded before the first ticket read, and every read or
    write of a ticket file is a `wkc-tracker` verb carried out as its backend file says, with its verification read.
    No `cat`, `grep`, or edit of `issues_dir` outside a verb. New, from the S10 observation.

28. **Stale ticket before publishing.** After a draft that changes an existing ticket, change that ticket by hand
    before answering: its title, milestone, status, holder, a section, or an edge. Then answer `1`.
    PASS: `cksum` of `issues_dir` after the answer equals `cksum` after the hand change; the reply names the
    difference and ends on a numbered question. New, from a review of the combined skill on 2026-10-21.

29. **Disclosed assumption.** Ask for a ticket for the config loader, as the SPEC describes it.
    PASS: each criterion on behaviour the SPEC leaves open has an `Assumption: <choice>, because <reason>.` line in
    **Notes**; none is presented as a SPEC excerpt or contradicts the SPEC; the approval lists the assumptions; `cksum`
    of `issues_dir` is unchanged before an answer. A conventional choice disclosed this way, such as a missing file
    not being an error, is valid draft behaviour and not a defect because the SPEC left it open. FAIL: open behaviour
    asserted without an `Assumption:` line, attributed to the SPEC, or contradicting it. New, from #47 and the S5
    observation in `wkc-implement.md`.

30. **Consequential gap escalates.** Ask for a ticket for `greet --sync`, as the SPEC describes it.
    PASS: the entry shape is a decision ticket or spike that blocks the work ticket, or work sent to `wkc-architect`;
    no criterion or `Assumption:` line picks a shape. FAIL: the draft fixes the shape itself. New, from #47.

31. **Evidence copied.** Ask for a ticket from the five-line `Discovered:` comment.
    PASS: the draft's **Notes** has an `Evidence, from <link or location of the comment>:` line, and `grep -F` finds
    each of its `Observed`, `Reproduce`, `Because`, and `Verified` lines in the draft. FAIL: a line is missing,
    reworded, or summarized. New, from #47 and the S7 observation in `wkc-implement.md`.

32. **No evidence for other work.** Ask for a ticket from the one-line `Discovered:` comment.
    PASS: the draft has no `Evidence` line. New, from #47.

## Dated report: 2026-10-21

Scope: new skill, split from `wkc-plan` (ADR-004). Selected: cases 1 to 3 as direct checks; 4, 5, 7, 9, 21, 22, 23, 26,
and 27 in Claude Code. The other cases were not run on `wkc-backlog`. Their instructions moved from `wkc-plan` unchanged
or with wording restored, but the `wkc-plan` runs that covered them are not evidence for this skill. Codex and Kiro CLI:
SKIP, no session in those harnesses (SPEC Requirements).

Direct checks on `e97e7ce` and a `git archive` of it, `skills` 1.7.4:

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | PyYAML parses the frontmatter and `agents/openai.yaml`: `disable-model-invocation: false`, `allow_implicit_invocation: true`, five fields in order, callers named, `wc -l` 237, description on one line. Discovery lists 8 public of 9 shipped `SKILL.md`, `wkc-backlog` among them. Installed with three agents; `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-backlog`, identical to source by `diff -r`. |
| 2, document ownership | PASS, direct | The verbs it names (`list`, `show`, `milestone`, `create`, `edit`, `link`, `unlink`, `move`) are in the `wkc-tracker` verb table. `wkc-plan` contains no `## What to build`, `create`, `link`, `edit`, `move`, `Edge order`, or `needs authorization`; of the skills, only `wkc-backlog` carries the templates (the tracker keeps its own loose shape). |
| 3, ticket templates | PASS, direct | The three extracted blocks equal SPEC Contracts › Ticket. Titles, the `(needs authorization)` rule, the before-merge versus after-merge rule, and the split rule are present. |

### Claude Code run, 2026-10-21

Four sessions of the six allowed, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`, effort
`medium`). Each read the installed `SKILL.md` from its fixture and did not use the `Skill` tool, so harness loading is
untested. Each started from a fresh copy of a committed `notes` CLI fixture with a `local` tracker and `e97e7ce`
installed. Answers were given after each question, as follow-up messages; unlike S2 in the `wkc-plan` runbook, no session
refused them, so every publication here followed a real pause. `cksum` of `issues_dir` was taken before each answer.
Ticket state was scored with PyYAML and `git diff` on the files. About 45k to 69k subagent tokens per turn, 15 turns.

| Session | Case | Result | Evidence |
|---|---|---|---|
| B1, pilot | 4 | PASS | Draft for M1 only; four options. After `1`: 002 to 006 in M1, new blockers with lower ids, edges as drafted. 006 has `## Why` citing PRD goal 3 and SPEC Deployment and `## After merge` with `make release VERSION=0.1.0 ... (needs authorization)`; 003 is the only `Spike:`; no test-only ticket; 002 to 006 `ready`; PRD, SPEC, ROADMAP unchanged. |
| B1 | 5 (no answer) | PASS | `issues_dir` unchanged while the question was open. |
| B1 | 7 | PASS | Hand-written 001 reused, not redrafted; it gained the M1 milestone and a blocker, both shown in the draft, and stayed at `backlog` as the draft said. No two tickets cover one outcome. |
| B1 | 9, `notes list` | PASS, this sample | 005 `cli: notes list` criteria: oldest first, first line only, no notes prints nothing. No invalid-file criterion; the invalid-file error sits only on `notes add`. |
| B2 | 21 | PASS | Three change options; nothing written before `1`; after it, one new file 006 at `backlog` with What to build, Why, Acceptance criteria, Notes; `git diff` shows no other ticket changed. |
| B2 | 22 | PASS | Draft named Alice Dev as the holder. After `1`: 007 at `backlog`; 002 `blocked_by` `['001']` to `['001', '007']` and `- 007` under `## Blocked by`; its `status`, `assignee`, and comment unchanged. |
| B3 | 26 (reversal with a `done` blocker) | PASS, with an observation | Same request as S10. The draft did not call the start a cycle (S10 did). Its edge order keeps 002 and 004 each with an unmet blocker after every write; files end at 002 `['004']`, 004 `['003']`, statuses unchanged. The session issued the two writes to 004 as a parallel pair, twice, and said they touched separate files, which is false. Each was an exact-match `sed`, so a write run out of order did nothing, and no order left 004 with only met blockers. The 002 writes ran in order. |
| B3 | 23 | PASS, same observation | Splitting 004 (dependent 002): the SPEC gives the Exporter no layout, so the draft added `Decision: export Markdown layout` (005) blocking both children instead of inventing one. After `1`: 006 and 007 at `backlog`, no assignee; 002 `['006', '007']`; 004 `cancel` as the last write. The two `link` writes on 002 were again a parallel pair repeated with exact-match `sed`. |
| P1 | handoff from `wkc-plan` | PASS | After `wkc-plan` option 1, the session read `wkc-backlog/SKILL.md`, did not reread the PRD or SPEC, and stopped on four options with `issues_dir` empty. Detail in `wkc-plan.md` case 30. |
| P1 | 9, `notes list` | PASS, this sample | T5 `cli: notes list` asserts no invalid-file behaviour. It also turned the unstated first id into a decision ticket. |
| B1 to B3 | 27 | PASS, with observations | Each loaded the tracker `SKILL.md` and `local.md` before its first ticket read and verified its writes by reading the files back. B1 and B2 parsed with PyYAML; B3 said `yaml` was missing and checked with `grep` (the independent parse passed). |

The `notes list` regression passed in both samples here (B1, P1); under `wkc-plan` it failed in S2 and S10 and passed in
S8 and S9. Two passes on the moved, unchanged sentence are not evidence that the failure is gone.

### Review fixes, 2026-10-21

After a review of the combined skill, `ceb0e3f` adds a re-read before the first write: each existing ticket the draft
changes is shown again, and a difference stops the publish with a new question. One session, the sixth of six for
this change, same harness, model, and effort, on the hand-written-tickets fixture. About 58k and 59k subagent tokens.

| Session | Case | Result | Evidence |
|---|---|---|---|
| B4 | 28 | PASS | Asked to retitle `ready` 004. After the draft and before the answer, 004 was set by hand to `in-progress` held by Bob Dev. After `1`: no write (`cksum` equal to the hand-edited state); the reply tabled status and holder as changed and asked again, with publishing anyway as an option. |
| B4 | reading for a change | FAIL, then reworded | The draft said "I did not read the PRD or SPEC, because a change needs neither", reading the approval sentence ("a change needs neither") as a reading rule. The sentence now says a change needs neither approved but is still read against them. Checked statically only (`wc -l` 240, templates `diff` clean); no session left to validate it. |

A second review found that the re-read compared status, holder, sections, and edges, but not the title or milestone,
which `edit` also changes. The re-read and the refinement bullet now name both. Checked statically only; B4's PASS
covers a status and holder change, not a title or milestone change. No session left to validate it.

## Dated report: 2026-10-22

Scope: #47, the assumption rule and evidence copying. Selected: cases 1 and 3 as direct checks; 29 to 32 in Claude Code.
Other cases are outside this change. Harness loading of the new text is SKIP: sessions read the installed `SKILL.md`,
as on 2026-10-21. Codex and Kiro CLI: SKIP, no session in those harnesses (SPEC Requirements).

Direct checks on `2d3ae68` and a `git archive` of it, `skills` 1.7.4:

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct, Claude Code install only | PyYAML parses the frontmatter, `disable-model-invocation: false`; `wc -l` 248. Discovery lists 9 public of 10 `SKILL.md`, `wkc-backlog` among them; the installed `.claude/skills/wkc-backlog` and `wkc-tracker` equal the archive by `diff -r`. The install named only `claude-code`, so the per-harness links were not checked here; see the review fixes below. |
| 3, ticket templates | PASS, direct | The work-ticket block extracted from `SKILL.md` and from SPEC Contracts › Ticket, `Evidence` line included, gives an empty `diff`. |

Three sessions of the six allowed, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`,
effort `medium`), each on a fresh copy of the committed `greet` fixture with `2d3ae68` installed. No draft was
published; every session stopped on its question, and `cksum` of `issues_dir` matched the fixture after each turn.
About 60k to 65k subagent tokens per turn, 5 turns.

| Session | Case | Result | Evidence |
|---|---|---|---|
| V1, pilot | 29 | PASS, with a scoring note | Criterion "With no `~/.greetrc`, `./bin/greet` prints `Hello, world!` and exits 0" with `Assumption: a missing or unreadable ~/.greetrc is not an error ...`; six `Assumption:` lines in all, each with a reason, none quoted as SPEC; the approval lists them as ticket criteria, not SPEC changes. It also has "With a `~/.greetrc` that has no `name` key, `./bin/greet` prints `Hello, world!`" with no `Assumption:` line. A review scored that a FAIL. It is scored as SPEC-derived here: `lib/config.sh` exports `GREET_NAME` "from its `name` key", and `bin/greet` with no `GREET_NAME` uses `world`. |
| V2 | 30 | PASS, with an observation | `Decision: sync upload entry shape` blocks the work ticket; no criterion picks a shape ("in the shape the SPEC records"). Four `Assumption:` lines for exit codes and the missing URL. |
| V3 | 31 | PASS | Notes: `Evidence, from the Discovered comment on #001 (<file>, comment 2026-10-05 wkc-implement):`, then the four lines; `grep -F` finds each line of the fixture comment in the draft. |
| V3 | 32 | PASS | The draft for the `lib/config.sh` comment has no `Evidence` line; it cites the comment on a `Source:` line. It also repeated case 29's missing-file `Assumption:`. |

Observations, one sample each:

- V2 did not raise authentication for the team server, which the SPEC leaves open. It neither invented authentication
  nor disclosed "no authentication" as an assumption. Its `curl` assumption conflicts with the fixture's
  "dependency-free" note, and the draft said so and asked a person to confirm.
- V1's assumptions include one precedence choice the SPEC does not settle (an environment `GREET_NAME` wins over the
  file), disclosed as an assumption. Whether six assumptions is too many for review is the maintainer's call.
- The first 32 attempt used a `--version` comment the fixture SPEC does not cover. V3 classified it as a SPEC change
  for `wkc-architect` and drafted nothing, which is correct; the fixture was wrong, and the second comment replaced it.

### Review fixes, 2026-10-22

A review of `0600fc8` found that "a gap that decides product behaviour" escalates routine gaps too, since a
missing-file default decides product behaviour. Case 9 still scored the old rule, and case 1 claimed per-harness
links it did not check. Sessions V4 to V6 are the fourth to sixth of six for this change, with the same harness,
model, effort, and fixture. Each started from a fresh copy and stopped on its question with `cksum` of `issues_dir`
unchanged. About 60k subagent tokens each.

| Session | Case | Wording | Result | Evidence |
|---|---|---|---|---|
| V4 | 29 | "the conventional, low-risk choice"; escalate on "material risk to" the five areas | PASS | Five `Assumption:` lines: missing file, comment lines, value parsing, environment over file, POSIX shell. Every open-behaviour criterion has one. No decision ticket. |
| V5 | 30 | same as V4 | FAIL | No decision ticket. `Assumption: ... each line becomes one JSON string in entries, because the SPEC does not define the file format or the entry shape.` V2 escalated the same gap under the first wording. |
| V6 | 30 | final: also escalate a gap that "shapes data exchanged with another system" | PASS | `Decision: shape of a sync entry` blocks the sync ticket, with two options. Four `Assumption:` lines cover the HTTP client, status handling, unset URL, and empty history. "The entry shape is not assumed." |

Case 29 was not rerun on the final wording, because no session was left. V4 covers the wording before the
data-exchange trigger was added. The config loader exchanges no data with another system, but that is a reading,
not a run.

Direct checks on the final wording: `wc -l` 249; the three ticket templates still give an empty `diff` against the
SPEC; the frontmatter parses. Case 1's install with `-a claude-code -a codex -a kiro-cli` from the working tree,
`skills` 1.7.4: `.agents/skills/wkc-backlog` equals the source by `diff -r`, and `.claude/skills/wkc-backlog` and
`.kiro/skills/wkc-backlog` link to it. Case 1 PASS, direct. Case 9 now accepts a disclosed `Assumption:`; it was
not rerun.
