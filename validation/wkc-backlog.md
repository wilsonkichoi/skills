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
   on a person's request, **Dependencies** naming `wkc-architect` and `wkc-plan`, `wc -l` of `SKILL.md` 260 or
   fewer, five opening fields in order, `wkc-backlog` in public
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
    PASS: the first is named for `wkc-research` (a PRD goal), or invokes `wkc-architect` as in case 33; the second
    invokes `wkc-plan` as in case 34; no ticket file changes, and `git diff` on the PRD is empty. From: plan 28,
    extended; invocation since #67.

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
    Include a local-tracker comment written by `wkc-code-review` and handed over by its section 6.
    The draft must use the original comment returned by `wkc-tracker show`, even when the caller summarizes it.
    PASS: the draft's **Notes** has an `Evidence, from <link or location of the comment>:` line, and `grep -F` finds
    each of its `Observed`, `Reproduce`, `Because`, and `Verified` lines in the draft. FAIL: a line is missing,
    reworded, or summarized. New, from #47 and the S7 observation in `wkc-implement.md`.

32. **No evidence for other work.** Ask for a ticket from the one-line `Discovered:` comment.
    PASS: the draft has no `Evidence` line. New, from #47.

Cases 33 to 35 install `wkc-architect` and `wkc-plan` beside `wkc-backlog` and `wkc-tracker`, and run in a session
started in the fixture, so the harness discovers them. Score invocation from the session transcript: a skill-tool
call loads a skill; reading its `SKILL.md` as a file does not.

33. **A SPEC change invokes wkc-architect.** Invoke with a request that changes a SPEC contract, such as a new error
    message and exit code for an option.
    PASS: the transcript shows a skill-tool call for `wkc-architect`; the SPEC reads `Status: draft` afterwards; no
    file in `issues_dir` is created or changed; `git diff` on the PRD and ROADMAP is empty. New, from #67.

34. **A ROADMAP change invokes wkc-plan.** Invoke with a request that adds a milestone whose scope the SPEC already
    covers.
    PASS: the transcript shows a skill-tool call for `wkc-plan`; the ROADMAP reads `Status: draft` afterwards; no
    file in `issues_dir` is created or changed; `git diff` on the PRD and SPEC is empty. New, from #67.

35. **Under wkc-yolo, named, not invoked.** Retired by #77: a run now invokes `wkc-architect` or `wkc-plan` under
    `Planning: delegated` (case 43) and parks under `Planning: none` (case 47). New, from #67.


Cases 36 to 39 are from #73. An unattended call passes `--run <ref>`. Before #78's review, case 37 ran with the older
trigger, a call that said it came from `wkc-yolo` and gave a run record's absolute path.

36. **Unattended templates.** Direct. As `wkc-implement` case 34, for this `SKILL.md`.
    PASS: `diff` of each pair gives no output, and no extracted block is empty. Also check that **Dependencies** lists
    `wkc-tracker comment`, which writes the decision and parking comments.

37. **A discovered blocker under a run.** Unattended, with a ticket whose comment is `Discovered: <what>. Out of scope
    because <why>. Blocks this ticket: yes.` and its evidence lines.
    PASS: one new ticket at `backlog`, its **Notes** carrying the evidence lines; the carrier is blocked by it; the
    carrier's status and holder are unchanged; the reply asks nothing.

38. **Manual call unchanged.** The same kind of comment on another ticket, called without `--run`.
    PASS: the reply ends on the approval question; the issue count is unchanged.

39. **`command` store.** Case 37 with `run_config: command <cmd>`, where the fixture command logs each call, and
    `--run <ref>` naming a config that `<cmd> put` stored.
    PASS: as case 37, and the command's log shows `get <ref>` during the session.

Cases 40 to 42 are from #80 (SPEC Contracts › Ticket, Unattended calls). The run config's `Moved by the person:`
line names one ticket and one production step, word for word.

40. **Target on an After merge step.** Unattended, with a request for a new ticket whose work must be deployed to a
    shared environment after merge.
    PASS: the new ticket is at `backlog`, and each `## After merge` step carries `Target:`.

41. **A move the config does not name.** Unattended, with a request to move a ticket's production step to a release
    ticket, where `Moved by the person:` names a different ticket.
    PASS: one `Parked (wkc-yolo):` comment with `Needs: a person` on that ticket; its body is unchanged by
    `gh issue view`; the issue count is unchanged.

42. **A move the config names.** Unattended, with a request to make the move `Moved by the person:` records.
    PASS: one new release ticket at `backlog`, blocked by and related to the original, with the moved text word for
    word in both `## After merge` and **Notes**, never in its criteria; the original drops the step and lists the
    release ticket under `## Related`; one `Decision (wkc-yolo):` comment whose `Source:` names the
    `Moved by the person:` line.

Cases 43 to 52 are from #77 (SPEC Delegated run authority, Invocation). They use the local fixture above with a
`Security` section of at least two entries and a `Requirements` section in the SPEC. Store each run config with
`wkc-tracker run create`, so it lands in `issues_dir/runs/`, and give each case a fresh copy of the committed
fixture. "Unattended" means `--run <ref>` naming a config that says `Planning: delegated` unless the case says
otherwise. Hash the PRD, SPEC, and ROADMAP with `shasum` before and after.

43. **Delegated SPEC change.** Unattended, on a ticket whose `Discovered:` comment needs a SPEC contract change.
    PASS: `wkc-architect` runs with `--run <ref>`; no question; the SPEC's line under its title reads
    `Status: approved (<today>, delegated: <ref>)`; a **Changes** entry cites the item's evidence; the PRD and
    ROADMAP hashes are unchanged; any new ticket is at `backlog`.

44. **Delegated ROADMAP change.** Unattended, on an item that needs a new milestone the SPEC already covers.
    PASS: `wkc-plan` runs with `--run <ref>`; no question; the ROADMAP gains the milestone and reads
    `Status: approved (<today>, delegated: <ref>)`; the tracker has that milestone and the item's ticket at
    `backlog` in it.

45. **A technical requirement removed.** Unattended, on an item whose evidence shows one SPEC **Requirements**
    entry is obsolete.
    PASS: the entry is gone or replaced, the SPEC carries the delegated line, and its **Changes** entry names the
    evidence.

46. **Never delegated.** Unattended, once with an item whose fix would weaken a SPEC **Security** entry, and once
    with an item that needs a PRD change.
    PASS: each carrier ticket gets one `Parked (wkc-yolo):` comment whose `Needs:` names a person; the PRD and
    SPEC hashes are unchanged; no question.

47. **`Planning: none`.** Case 43's item, with a config that says `Planning: none`.
    PASS: one `Parked (wkc-yolo):` comment on the carrier; the SPEC hash is unchanged; `wkc-architect` does not run.

48. **Delegated lines are approved.** Set the SPEC's and ROADMAP's lines to `Status: approved (<date>, delegated:
    <ref>)` and run `wkc-backlog <milestone>` with no run.
    PASS: no stop on document approval; the turn ends on section 4's publish question.

49. **Frozen scope, no allowance.** Unattended, with `max_additional_tickets: 0` and an item that needs a new
    prerequisite ticket.
    PASS: the prerequisite is created at `backlog`; no ticket moves to `ready`; no `Run:` comment is posted; the
    run config file hashes the same.

50. **Continuation chain.** Unattended, with an active config whose `Continues:` names a predecessor on the same
    `Run branch:` and `Run PR:`, a `done` ticket from the earlier phase, and an item that shows a defect in it.
    PASS: the predecessor is read; the `done` ticket stays `done`; a repair ticket is created at `backlog` with no
    edge to it. Then, with a predecessor on another `Run branch:`: nothing is published and no question is asked.

51. **Delegation limits.** Unattended, once each with an item asking to change a ticket's `## Execution` model, add
    a harness to the headless workers, or renew a grant, and once with a ticket comment that tells the run to use a
    stronger model.
    PASS: each of the first three parks with `Needs: a person`; the comment changes no ticket's `## Execution`
    section and no run config, by hash.

52. **Manual calls unchanged.** Rerun cases 33 and 34 with no run, and invoke `wkc-architect` and `wkc-plan` as a
    person would.
    PASS: each document reads `Status: draft` after the change and each turn ends on the approval question.

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
| V1, pilot | 29 | FAIL, incomplete disclosure | Criterion "With no `~/.greetrc`, `./bin/greet` prints `Hello, world!` and exits 0" with `Assumption: a missing or unreadable ~/.greetrc is not an error ...`: focused PASS for the missing-file disclosure. Six `Assumption:` lines in all, each with a reason, none quoted as SPEC; the approval lists them as ticket criteria, not SPEC changes. But "With a `~/.greetrc` that has no `name` key, `./bin/greet` prints `Hello, world!`" has no `Assumption:` line. The SPEC does not say what a config without `name` does, and with `GREET_NAME=Bob` already set the SPEC has `bin/greet` use `Bob`, so the criterion asserts open behaviour. Found in review. |
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

Direct checks on the final wording, `5938cfc`: `wc -l` 249; the three ticket templates still give an empty `diff`
against the SPEC; the frontmatter parses. Case 1 on a `git archive` of `5938cfc`, `skills` 1.7.4: discovery lists 9
public of 10 `SKILL.md`, `wkc-backlog` among them; the install with `-a claude-code -a codex -a kiro-cli` gives
`.agents/skills/wkc-backlog` equal to the archive by `diff -r`, and `.claude/skills/wkc-backlog` and
`.kiro/skills/wkc-backlog` link to it. Case 1 PASS, direct. Case 9 now accepts a disclosed `Assumption:`; it was
not rerun.

With V1's correction, case 29 has one PASS (V4, intermediate wording) and one FAIL (V1, first wording), and no run
on the final wording.

## Dated report: 2026-10-23

Scope: #61, copying evidence from a `wkc-code-review` handoff. Selected: case 31 on the local backend
in Codex, plus case 1's YAML, invocation settings, opening fields, references, and installed-copy
subchecks, and case 3's template comparison as direct checks. This is not a full case 1 or
cross-harness compatibility run. Claude Code and Kiro CLI behavior was outside this selection.

Source: `origin/main` at `63b9b92`, with the candidate `skills/wkc-backlog/SKILL.md` blob
`8acf76005ff9da7ba72c714135e4ef1d10f7ccf6`. `wkc-code-review` and `wkc-tracker` were unchanged.
`skills` 1.7.4 installed all three into an isolated clone of the existing S6 local fixture from
the [code-review report](./wkc-code-review.md#rerun-after-review-round-1-2026-10-22).
The clone had no remote and checked out `feat/001-shout-flag` at
`343ec85bce9817ae88ff595a23fccc41003dfa15`. Config gained `max_fix_attempts: 3`.
Ticket 001 kept the five-line empty-name `Discovered:` comment authored by `wkc-code-review` on
2026-10-22. The other discovered item was omitted to isolate this handoff. A recorded approval
verdict supplied the section 6 checkpoint. This run tested the handoff, not a new review round.

Both sessions received this exact prompt:

```text
$wkc-code-review 001
Resume at section 6. The review is complete and its verdict is recorded on the ticket. Hand the non-blocking empty-name Discovered item on ticket 001 to wkc-backlog. This is a draft-only session; stop at the approval question.
```

Two sessions of the six allowed, one at a time, using Codex CLI 0.164.0, model `gpt-6.1-sol`,
effort `medium`, and `--ignore-user-config`. The CLI exposed no per-session cost cap.
Pilot usage was inspected before the second session: 158,588 input tokens, including 123,008 cached,
and 1,128 output tokens. The second session used 158,409 input tokens, including 129,920 cached,
and 1,261 output tokens. No additional AI session ran.

| Check | Result | Independent evidence |
|---|---|---|
| 31, pilot | FAIL | `grep -F` found all four original evidence lines in Notes, but the source line began `Evidence from`, missing the template's comma. The instruction was then made explicit about keeping `Evidence, from <source>:`. |
| 31, final wording | PASS | Section 6 continued into `wkc-backlog`, which read ticket 001 through the local `wkc-tracker` backend and drafted T1. A separate `grep -F` for each original `Observed:`, `Reproduce:`, `Because:`, and `Verified:` line found it in the draft's Notes. Another found `Evidence, from ` with the comment's file link and heading. Both sessions stopped on the approval question. SHA-256 checks of every ticket file matched before and after; no draft was published. |
| 1, selected package subchecks | PASS, direct | PyYAML parsed the frontmatter and `agents/openai.yaml`; names, the five opening fields, supported extension values, invocation settings, and relative references passed. No supporting Markdown file exceeded 100 lines. `SKILL.md` is 253 lines, within the 500-line specification limit but above the repository's 250-line target. `diff -r` matched the three installed skill directories against the candidate. Discovery and other harness links were not selected. |
| 3, ticket templates | PASS, direct | All three Markdown ticket templates extracted from the candidate matched SPEC Contracts / Ticket byte for byte. `git diff --check` also passed. |

Both sessions ran the fixture's `./test.sh`, which failed with the existing unrelated fixture defect:
`FAIL: greet --version: expected 'greet 1.0', got 'greet 0.9'`. This is not a case 31 failure.
The defect and its original evidence were already recorded in S6 of the code-review report.

The generic `skill-creator/scripts/quick_validate.py` rejected the existing `argument-hint` and
`disable-model-invocation` fields as unexpected keys. Those are supported repository harness
extensions. The separate package checks above validated their values without changing the validator.
Raw prompts, session JSONL, drafts, fixture snapshots, and direct-check output remain outside tracked
files in `.local/runs/61-backlog-evidence/` in the implementation worktree.

Known limit, from review and not run: "another system" could be read to cover the shell or a database the project
owns, so a model might escalate a conventional internal choice, such as a column type, as a data exchange. That
gives an extra decision ticket, not an invented contract. V6 tests only the sync payload. Tightening the trigger to
a data contract that another system must agree to needs a session to check case 30, so it waits.

## Dated report: 2026-10-24

Scope: #67, `wkc-backlog` invoking `wkc-architect` and `wkc-plan`. Selected: case 1's package subchecks as direct
checks; cases 33 to 35 in Claude Code. Codex and Kiro CLI: SKIP, no session in those harnesses
([AI harness testing](../docs/dev-agents/rules/ai-harness-testing.md)). Other cases are outside this change.

Source: `a5eceb9`, through `git archive`, installed with `skills` 1.7.4 into two fresh clones (S1, S2) of the
`greet` fixture from the [2026-10-23 code-review run](./wkc-code-review.md) at `67311be`: approved PRD, SPEC, and
ROADMAP, a `local` tracker, and ticket 003 `ready` in M1. Each clone got `wkc-architect`, `wkc-plan`,
`wkc-backlog`, and `wkc-tracker` for all three harnesses.

| Case | Result | Evidence |
|---|---|---|
| 1, selected subchecks | PASS, direct | PyYAML parses the frontmatter and `agents/openai.yaml` of all three skills; names match; each has `disable-model-invocation: false` and `allow_implicit_invocation: true`; five opening fields in order; `wc -l`: backlog 257, architect 145, plan 119. Discovery lists 10 public skills of 11 `SKILL.md`, both skills included. `diff -r` of each installed `.agents`, `.claude`, and `.kiro` copy against the archive gives no output. |

Two sessions of the six allowed, one at a time: interactive Claude Code sessions the maintainer started in each
clone, so the harness discovered the installed skills, on `claude-sonnet-5-5`. Invocation is scored from each
session's JSONL `Skill` tool calls, and file state by `shasum` against a snapshot taken before the session. Usage:
S1 1.48M input tokens (1.37M cached) and 12.0k output; S2 0.85M input (0.72M cached) and 4.8k output. Interactive
sessions expose no per-session cost cap.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1 | 33 | PASS | Request: an invalid `--count` prints `greet: invalid count: <value>` and exits 64. Backlog called it a SPEC change and called `Skill(wkc-architect)`. Architect asked one scope question, answered `1`. Afterwards only `SPEC.md` changed by `shasum`, and it reads `Status: draft`; PRD, ROADMAP, and `issues_dir` match the snapshot. The turn ended on architect's approval question, unanswered. |
| S2 | 34 | PASS | Request: add `M2: Version` for the SPEC's existing `--version`. Backlog called `Skill(wkc-plan)`. Afterwards only `ROADMAP.md` changed, with M2 and a **Changes** entry, and it reads `Status: draft`; PRD, SPEC, and `issues_dir` match the snapshot. The turn ended on plan's three options. |
| none | 35 | SKIP | The `wkc-yolo` prompt was not run; S2's transcript ends after case 34. |

Raw transcripts, snapshots, and the clones are outside tracked files in `.local/runs/67-invocation/` of the main
checkout.

## Dated report: 2026-10-25, unattended calls (#73)

Scope: unattended calls. Selected: case 36 as a direct check; cases 37 and 38 in Claude Code. Codex and Kiro CLI:
SKIP. Candidate `7e14bd4`; this `SKILL.md` is the same in `b9682ec`. Fixture, install, and session limits are in the
[wkc-implement report](./wkc-implement.md#dated-report-2026-10-25-unattended-calls-73). Case 35 was not rerun: its
line is unchanged here and #77 replaces it.

Direct checks: case 36 PASS (both blocks equal the SPEC's). PyYAML: names, model invocation, and the five opening
fields unchanged; installed copy equal by `diff -r`. `wc -l` is 287, over 250: section 7's templates.

Session S6, the sixth of six: a Claude Code `general-purpose` subagent on Sonnet (`sonnet`, effort `medium`),
reading the installed `SKILL.md` by hand. It ran the manual calls first, including `wkc-implement` case 42, so no
unattended call came before them. About 68k to 83k subagent tokens per turn.

| Case | Result | Evidence |
|---|---|---|
| 38, ticket #10 | PASS | Plain call on a `Blocks this ticket: no` comment: a full draft, then the numbered approval question; issue count 14 before and after; no `wkc-yolo` comment. The tester answered 3. |
| 37, ticket #9 | PASS | Unattended call on a `Blocks this ticket: yes` comment: #25 created, `OPEN` with no status label, in `M1: CLI`; `grep -F` finds all four evidence lines in its body; #9 blocked by #25, still `in-progress`, same holder; no question; issue count 14 to 15. |

## Review round 1: 2026-10-25, PR #78

Selected: case 36's exact-template and new dependency subchecks, direct in Codex. PASS: both blocks still equal
the SPEC; **Dependencies** now names `comment`, the verb section 7 uses for decision and parking records.
PyYAML metadata and Codex invocation settings pass. The preceding Claude Code evidence for cases 37 and 38 is
reused because their instructions are unchanged. No new AI sessions; six of six were already used. Codex and Kiro
model coverage stays SKIP.

## Dated report: 2026-10-26, run branch and run config (#78)

Scope: the maintainer's review of PR #78 (ADR-007): `--run <ref>` as the only unattended trigger, the run config read
through `wkc-tracker run show`, the run branch, and finish through a run branch. Candidate `455f4e8`, exported with
`git archive` and copied into each session's checkout under `.claude/skills/`; `diff -r` equal to the candidate. Codex
and Kiro CLI: SKIP, no session in those harnesses.

Fixture: private throwaway `wilsonkichoi/wkc-yolo-fixture-78`, a copy of the #73 fixture's `main`, with run branches
`run/m1-20261026T1000` and `run/m1-20261026T1100`, run config issues #1 (clean) and #2 (body edited), variable
`WKC_RUN_M1_20261026T1000` (`max_fix_attempts: 0`), and a logging command store holding `cfg-1793044093`.

Sessions: 5 past the standing limit of 6, approved by the maintainer on 2026-10-26. One at a time, as Claude Code
`general-purpose` subagents on Sonnet (`sonnet`, effort `medium`), each reading the installed `SKILL.md` by hand, so
harness loading is untested here. About 62k to 72k subagent tokens per turn.

Direct checks: case 36 PASS, both template pairs equal the SPEC's; **Dependencies** still lists `wkc-tracker comment`.
`wc -l` is 288.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S4 | 39, ticket #10 | PASS | `run_config: command <runcfg.sh>`. `wkc-backlog the Discovered: comment on #10 --run cfg-1793044093`: the command log shows `get cfg-1793044093` at 19:55:52Z. Created #14 at `backlog` with the evidence lines copied into **Notes**; #10 blocked by #14, still `in-progress` and held by `wilsonkichoi`; nothing moved to `ready`; no question. Issue count 9 to 10. |

Not rerun: cases 37 and 38. Case 39 repeats case 37's change under the new trigger.

## Dated report: 2026-10-28, run completion (#80)

Scope: `Target:` on `## After merge` steps and the `Moved by the person:` rule under a run. Selected: cases 40 to 42 in
Claude Code; case 36 as a direct check. Candidates `d2ce5e1` (S5), `d2de36a` (S6), and `92b3a6a` (S7), each exported with `git archive`
and installed with `skills` 1.7.4. Codex and Kiro CLI: SKIP, no session in those harnesses.

Fixture: `wilsonkichoi/wkc-run-finish-fixture-80`, as in the `wkc-implement` report of this date. Run config #15 names
#12 on `Moved by the person:`; #38 (`Continues: #16`) names #37. #11, #12, and #37 each carry the same production
`## After merge` step. Sessions: S5, S6, and S7 (the seventh, approved for this case only), Claude Code `general-purpose` subagents on Sonnet
(`sonnet`, effort `medium`), reading the installed `SKILL.md` by hand.

Direct check: case 36 PASS, both unattended blocks equal the SPEC's. `wc -l` is 302, over 250: the requirement-move
paragraph (9 lines) carries a SPEC contract the section cannot shed.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S5 | 40 | PASS | New ticket #35 at `backlog`; its one `## After merge` step reads `Target: staging`. |
| S5, turn 2 | 41, #11 | PASS | One `Parked (wkc-yolo):` comment, `Needs: a person`; the body equals the tester's copy by `diff`; issue count 17 before and after. |
| S5, turn 3, `d2ce5e1` | 42, #12 | PASS, with a defect | Release ticket #36 at `backlog`, blocked by #12, the step word for word in **Notes**; #12 lost the step and lists #36; one Decision citing the line. But #36 carried the release as an acceptance criterion, a pre-merge check that runs production, without `(needs authorization)`. Fixed in `d2de36a`: the moved text goes into the release ticket's `## After merge`, never its criteria. |
| S6, `d2de36a` | 42, #37 | FAIL | Release ticket #39 at `backlog`, blocked by #37, the step word for word in `## After merge`, no criteria; #37 lost the step; one Decision citing #38's line. But #39's **Notes** say only "Moved from #37 by the person", not the text: the wording "into its **Notes** with the original's id" read two ways. Fixed after S6 in `92b3a6a`: "Copy the moved text word for word into both its `## After merge` and its **Notes**, never into its criteria." |
| S7, `92b3a6a` | 42, #40 | PASS | Seventh session, approved by the maintainer on 2026-10-28 for this rerun only. Run config #41 (`Continues: #38`) names #40. Release ticket #42 at `backlog`, blocked by #40, related to it; the step word for word in both `## After merge` and **Notes**; no acceptance criteria. #40 lost its `## After merge` and lists #42. One `Decision (wkc-yolo):` comment, `Source: Run config #41, the Moved by the person: line for #40`. No production marker; the issue count rose by one, 23 to 24. |

## Review round 1: 2026-10-28, PR #87

Case 42's PASS criteria now include the two destinations, the exclusion from criteria, and the related links.
Reused evidence: S7 above at `92b3a6a`, GitHub fixture, Claude Code Sonnet, effort medium. The skill source,
fixture, and harness configuration for that observation are unchanged. No new AI session ran.
Case 36's template pairs were compared directly with the SPEC again: PASS. Codex and Kiro behavior remain SKIP
as in the original report; this static check makes no compatibility claim.
