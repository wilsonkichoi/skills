# wkc-plan validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Preparation

Export a clean candidate tree, because local installation copies ignored files too, then list and install it
into a throwaway Git project. Record the installer version from `npx skills --version`.

```sh
npx skills add "<clean-candidate>" -l
npx skills add "<clean-candidate>" -s wkc-plan -s wkc-tracker -a claude-code -a codex -a kiro-cli -y
```

For cases 3 to 10, the fixture project has `docs/dev-agents/config.md` with `issue_tracker: local`, `issues_dir`,
`prd_file`, `spec_file`, and `roadmap_file` set, an approved PRD, and an approved SPEC (`Status: approved (<date>)`)
for a small service with at least three components, one contract with fields and error responses, and one entry
under **Open unknowns**. Commit the fixture so `git status` shows every change. Score ticket state by parsing the
frontmatter of the files in `issues_dir` with a YAML parser, never from the skill's report.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, manual invocation on both settings, five opening fields in order,
   `wkc-plan` in public discovery, installed copy identical to the source, and each harness links to it.

2. **Document ownership is consistent.** Read `wkc-plan`, `wkc-architect`, `wkc-tracker`, `wkc-setup`, and the root `README.md`.
   PASS: plan writes `roadmap_file` and reaches tickets only through `wkc-tracker` verbs that exist in its verb table;
   it never writes the PRD, SPEC, code, or config; architect names plan as its next step; the README names plan as
   the ROADMAP's writer; the ROADMAP outline carries no status, checkbox, assignee, or ticket list per milestone.

3. **No ROADMAP yet.** Invoke with no arguments.
   PASS: the ROADMAP lands at `roadmap_file` with `Status: draft`, every milestone has an outcome and an exit check
   and traces to PRD goals or SPEC sections, and no milestone carries progress. Only the first milestone gets a
   ticket draft, with criteria someone else can check and the contract excerpt copied into **Notes**. The turn ends
   on a numbered question with publishing first. `cksum` of `issues_dir` is unchanged, and `git status` shows only
   the ROADMAP.

4. **No approved SPEC.** Set the SPEC to `Status: draft`, then remove it.
   PASS: in both runs the turn ends on a numbered question that recommends `wkc-architect` first and offers to go on
   from stated intent; no ROADMAP or ticket is written; the reply never offers to approve the SPEC itself; and
   `git diff` shows the SPEC and PRD unchanged.

5. **Publication.** Continue case 3 and answer `1`.
   PASS: one ticket file per drafted ticket, each with the milestone named as the ROADMAP heading, created so every
   new blocker has a lower id than the tickets it blocks, all at `ready`. Every `blocked_by` holds real ids in the right direction and matches the draft, with no edge
   that only encodes priority. `wkc-tracker next`, read independently from the files, excludes every ticket with an
   open blocker. The ROADMAP reads `Status: approved (YYYY-MM-DD)` with the run date, and the PRD and SPEC are unchanged.
   The transcript shows the `wkc-tracker` skill invoked before the first ticket file is written.

6. **Existing work.** Before invoking, hand-write one ticket in `issues_dir` that covers part of the first milestone
   under a different title.
   PASS: the draft names that ticket as existing work instead of drafting the same scope again, and after publishing
   no two tickets cover the same outcome.

7. **Spec gap and unknown.** Remove a contract detail the first milestone needs, such as a table's columns or an
   endpoint's error responses, leaving a note that it is undecided.
   PASS: the draft does not invent the missing detail; the report names the gap as work for `wkc-architect`.
   A ticket for the **Open unknowns** entry is a spike that names its question, the evidence that settles it, and
   where the answer goes, and its criteria do not ask for production code.

8. **Interrupted publication and rerun.** Publish a milestone, then delete the last created ticket file and set the
   others back to `backlog`, as a run that stopped before its `move` step would leave them. Invoke again for that milestone.
   PASS: the rerun reads the milestone first, creates only the missing ticket, checks each ticket's milestone,
   status, and edges, and no title or outcome appears twice. Repeat with one approved edge removed from a surviving
   ticket's `blocked_by`: the rerun restores it with `link` before checking. After `1`, the tickets the interrupted run left at
   `backlog` are at `ready` with the new one, except decision tickets and ones the draft said stay at `backlog`.

9. **Custom paths.** Set `roadmap_file` to a non-default path and add authored body text to the config and context file.
   PASS: the ROADMAP lands at the configured path, no `docs/dev-agents/ROADMAP.md` appears, and `git diff` shows the
   config and context file unchanged.

10. **Update.** On an approved ROADMAP with published tickets, ask to split one later milestone in two.
    PASS: only the affected milestones change by `git diff`, the status resets to `Status: draft`, a dated **Changes**
    entry names what it replaced, a milestone that already has tickets keeps its name, and no ticket file changes
    before approval.

11. **Graph and waves.** Continue case 3 before answering, or use any draft with at least four tickets.
    PASS: the draft shows an edge table and the waves, plus a Mermaid diagram or a stated reason for none.
    Checked by hand against the edge table: every id resolves, there is no self-edge or cycle, no edge is implied by
    two others, wave 1 holds every ticket with no blocker (at least two when the milestone has independent work),
    every ticket's blockers sit in earlier waves, and the creation order is topological. The reply does not promise
    simultaneous work, durations, or a number of agents, and does not call creation order the build order.

12. **An invalid graph is not published.** After a draft, ask for an edge that closes a cycle, such as making an
    early ticket blocked by one that already depends on it.
    PASS: the reply names the cycle as a path and keeps the turn on a question; `cksum` of `issues_dir` is unchanged.
    Repeat with an edge to an id that is neither a draft nor a real ticket: it is named as unknown, not dropped.

13. **Cross-milestone blocker that exists.** On a fixture where M1 is published, invoke for M2.
    PASS: an M2 ticket that builds on M1 work lists that M1 ticket's real id under **Blocked by**, the id resolves by
    a direct read, and the ROADMAP's **Depends on** for M2 is unchanged. After publishing, the M2 ticket's
    `blocked_by` holds the M1 id.

14. **Cross-milestone blocker that has no ticket.** Approve the ROADMAP with option 4, so M1 has no tickets, then
    invoke for M2.
    PASS: the draft names the missing M1 work as an unresolved prerequisite, no **Blocked by** entry holds an invented
    id, option 1 says which tickets stay at `backlog` and why, and nothing is written to `issues_dir` before an answer.

15. **Coordination risk.** Use a milestone with two independent tickets that both change the `appointments` table.
    PASS: the draft names the shared table as a coordination risk, and neither ticket blocks the other for that reason
    alone.

16. **No answer, no writes.** After a draft, answer `3` with a change, then answer `4`.
    PASS: `cksum` of `issues_dir` is unchanged after both turns, and only option 4 changes the ROADMAP's status line.

Cases 17 to 20 use a fixture where M1's tickets are written by hand and M2 **Depends on** M1.

17. **An earlier milestone with only done tickets.** Every M1 ticket is `done`. Invoke for M2.
    PASS: the transcript shows `milestone show M1` and `list done M1`, or reads that cover them; the reply never
    calls M1 empty or unplanned; no M2 draft repeats M1's delivered work; and no M2 ticket is blocked by a `done`
    ticket.

18. **Canceled and duplicate tickets in an earlier milestone.** M1 holds a `cancel` ticket for work M2 needs, a
    `duplicate` whose original is an open M1 ticket, and a `duplicate` whose original is `done`. Invoke for M2.
    PASS: the canceled work is planned again in M2 or named as unresolved, and no **Blocked by** names the canceled
    ticket; M2 work that needs the first duplicate's scope is blocked by its open original, never the duplicate;
    the second needs no edge. The canceled ticket's file is unchanged.

19. **An unresolved prerequisite with no ticket.** The SPEC leaves a decision open that one M2 ticket needs. When
    the draft offers a decision or spike ticket, answer `3` and decline it, then answer `1`.
    PASS: after publishing, that ticket is at `backlog` with the gap in its **Notes**, every other ticket is `ready`,
    no `blocked_by` holds an invented id, and the report says a person moving it to `ready` puts it on the frontier.

20. **A shared undecided contract.** Two M2 tickets share a contract whose fields the SPEC has not settled.
    PASS: the draft has one decision or spike ticket that blocks both, neither blocks the other, and after `1` the
    decision ticket is at `backlog`.

21. **Setup ticket and criteria.** Use a greenfield SPEC whose **Development environment** names a test command
    and whose **Open unknowns** holds one unknown. Invoke with no arguments.
    PASS: the ticket that sets up the project has a criterion that runs that test command against a real test; no
    criterion is a manual check for something a command could check; the spike names a timebox.

## Dated report: 2026-10-17

Scope: new skill. Cases 1 and 2 as direct checks; cases 3 to 10 in Claude Code on Sonnet 5.5. Codex and Kiro CLI are
out of scope, by the maintainer's choice.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Clean export of the candidate tree, `skills` 1.7.2. Discovery lists `wkc-architect`, `wkc-help`, `wkc-plan`, `wkc-research`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (7 public of 8 shipped `SKILL.md`). Frontmatter and `agents/openai.yaml` parse; both invocation settings manual; five fields in order. `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-plan`, identical to source by `diff -r`. |
| 2, document ownership | PASS, direct | `wkc-plan` writes only `roadmap_file` and names the tracker verbs `list`, `show`, `milestone`, `create`, and `move`, all in the `wkc-tracker` verb table. It never writes the PRD or SPEC and never offers to approve them. `wkc-architect` names `wkc-plan` as its next step; the README names it as the ROADMAP's writer. The ROADMAP outline has no per-milestone status or ticket list. |

### Claude Code run, 2026-10-17

Claude Code 2.1.302 with Sonnet 5.5 (`claude-sonnet-5-5`), authorized by the maintainer with a limit of 12 sessions
and $2 per session, enforced with `--max-budget-usd 2`. `wkc-plan` and `wkc-tracker` were installed from a clean
`git archive` of `076d84b` with `-a claude-code` into a fixture for a clinic SMS reminder service: approved PRD with
three goals and two non-goals, approved SPEC with four components, the `POST /twilio/inbound` contract, and one open
unknown, and a `local` tracker. Each session ran in print mode with the parent's `CLAUDE_CODE_*` variables removed, no
MCP servers, and project settings only. Answers went in through `--resume`. 9 sessions used, including the tracker's
B21, $1.94 in total, at most $0.40 in one session. The first session was the pilot and is also case 3.
No instruction changed during the run.

| Case | Result | Evidence |
|---|---|---|
| 3, no ROADMAP | PASS | ROADMAP written with `Status: draft` and three milestones, each with outcome, scope naming PRD goals and SPEC sections, and exit check; no progress fields. Tickets drafted for M1 only; the turn ended on the four numbered options, publishing first. `issues_dir` unchanged and `git status` shows only the ROADMAP. |
| 4, no approved SPEC | PASS | Draft SPEC and missing SPEC each ended on a two-option question with `wkc-architect` first and planning from stated intent second; nothing written, and neither offered to approve the SPEC. `git status` clean in both. |
| 5, publication | PASS | After `1`: five files 001 to 005 in draft order, all `ready`, all in `M1: Staff see tomorrow's appointments`, by PyYAML. Edges 003→002, 004→002 and 003, 005→003 and 004 match the draft; no priority-only edge. Frontier by the files is 001 and 002. Ticket 003's **Notes** quote the SPEC's Staff page and Security sections. ROADMAP `Status: approved (2026-10-17)`, PRD and SPEC unchanged. `Skill(wkc-tracker)` ran before any ticket write; the writes followed `local.md`. |
| 6, existing work | PASS | The hand-written importer ticket 001 was named as reused and no importer ticket was drafted; after publishing 002 to 006, no two cover the same outcome. Plan said 001 stays outside the milestone because no verb moves an existing ticket into one. This run showed the ROADMAP inline and wrote it only on approval. Its final report named the frontier wrongly in one line (it listed 004 and 005, then said both wait on 001); the files show 002 and 003. The YAML check was refused by the test harness's sandbox, and the session said it fell back to grep. |
| 7, spec gap and unknown | PASS | With the table's columns marked undecided, no columns were invented; the gap was named for `wkc-architect`, and publishing at `backlog` was recommended until it is settled. The spike names the question, the evidence (three exports against the booking log), and the SPEC sections the answer updates, with throwaway code. |
| 8, interrupted publication | PASS | With 005 deleted and 001 to 004 back at `backlog`, the rerun reused 001 to 004 by content and drafted only the deployment ticket. After `1`, one new file 005 and four status-only diffs; no title or outcome appears twice. |
| 9, custom paths | PASS | ROADMAP at `docs/planning/delivery-plan.md`, no `docs/dev-agents/ROADMAP.md`, and `git diff` empty for the config and `AGENTS.md`. |
| 10, update | PASS | Splitting M3 rewrote only M3 and added M4, reset the status to `Status: draft`, and added a dated **Changes** entry naming the old M3. M1, which has tickets, kept its name; no ticket file changed. |

### Dependency graph run, 2026-10-18

Same harness, model, flags, and fixture as the run above; sessions 10 to 12 of the 12 authorized. Session 10 ran
`1b4f5b3`; sessions 11 and 12 ran `8464288`, which adds one sentence telling the skill not to draft later milestones'
tickets. 3 sessions, $1.80 in total, at most $1.15 in one session across its resumed turns.

| Case | Result | Evidence |
|---|---|---|
| 3, no ROADMAP | PASS | Session 11: ROADMAP with three milestones, draft only for M1, four numbered options; `issues_dir` unchanged and `git status` shows only the ROADMAP. |
| 11, graph and waves | FAIL then PASS | Session 10 on `1b4f5b3` also drafted tickets for M2 and M3 "for the dependency graph only", which led to the `8464288` sentence. Session 11: edge table T1, T2, T4 with no blocker and T3 blocked by T2; Mermaid diagram; waves {T1, T2, T4} then {T3}; creation order T1, T2, T4, T3 is topological; no redundant edge, no promise of simultaneous work or agent counts. |
| 5, publication | PASS | Session 11: 001 to 004 in creation order, all `ready` in M1, 004 `blocked_by: ['002']` matching the table; ROADMAP `Status: approved (2026-10-18)`; PRD and SPEC unchanged. |
| 12, invalid graph | PASS | Session 10: asking for T1 blocked by T3 was refused with the path T1 → T2 → T3 → T1, and T9 was named as an id that does not exist, with options to resolve both. The turn ended on a question; `issues_dir` unchanged. |
| 16, no answer, no writes | PASS | Session 10: after the change request and then option 4, `issues_dir` held only `.gitkeep`, and the only diff was the ROADMAP status line moving to approved. |
| 13, cross-milestone blocker that exists | PASS | Session 11, resumed with `/wkc-plan M2: Patients reply`: the webhook ticket listed M1's 002 under **Blocked by** with no draft blocker; after `1`, 005 has `blocked_by: ['002']` in M2, 002's file is unchanged, and the ROADMAP is unchanged. |
| 15, coordination risk | PASS | Session 11, same turn: the webhook and M1's 004 both write `reminder_state`, named as a coordination risk with no edge between them. |
| 14, cross-milestone blocker with no ticket | PASS | Session 12, approved ROADMAP and no tickets: M1's importer and staff page work named as unresolved prerequisites, shown as dashed nodes with no id, option 1 publishing T1 and T2 at `backlog` with the reason, and `issues_dir` unchanged before an answer. |
| 6, 7, 8 | Not rerun | Passed on `076d84b`. Their paths changed with the graph step (reuse by tracker id, creation order, edge check), so that evidence covers the old text only. |
| 9, 10 | Reused | Passed on `076d84b`; the ROADMAP paths they test did not change. |

### Dependency safety run, 2026-10-18

Claude Code 2.1.302, Sonnet 5.5, same flags, sessions 15 to 24 of 10 more authorized at $2 each (15 to 17 were tracker
cases). `wkc-plan` and `wkc-tracker` from a clean `git archive` of `ebb3204`, installed with `-a claude-code`.
Cases 17 to 20 used the published M1 fixture from the graph run, with M1 ticket states edited by hand; cases 6 to 8 used
the original fixtures. Plan sessions cost $2.79 in total, at most $0.59 in one session across its resumed turns.
Ticket state was scored with PyYAML from the files.

| Case | Result | Evidence |
|---|---|---|
| 17, earlier milestone all done | PASS | Session 18: "M1 has 4 tickets, all `done`, and the files add up to that count"; no M2 draft repeats M1 work. After `1`: 005 decision at `backlog`, 006 `ready` with no blocker, 007 `ready` blocked by 005 and 006; no M2 ticket blocked by an M1 id. |
| 18, canceled and duplicate | PASS | Session 19: 002 (duplicate of in-progress 006) mapped to "Link 006, never 002"; 007 (duplicate of done 003) "Met, no edge"; canceled sender 004 named as an unresolved prerequisite, with a replacement ticket offered and no edge. After `1`: 009 `blocked_by: ['008', '006']`; 002, 004, and 007 unchanged by `git diff`. |
| 19, unresolved prerequisite, no ticket | PASS | Session 20: the draft offered a decision ticket; after `3` declining it, the webhook kept the gap in **Notes** with "a note is not a dependency edge... If anyone moves T2 to `ready` by hand, it goes onto the frontier". After `1`: 005 at `backlog`, `blocked_by: []`, Notes hold the gap. It was the only ticket. |
| 20, shared undecided contract | PASS | Session 21: decision ticket for the `replies` table blocking both the webhook and the export, no edge between them, shared schema named as a coordination risk. After `1`: 005 `backlog`, 006 and 007 `ready`, each `blocked_by: ['005']`. |
| 6, existing work | PASS | Session 22: hand-written 001 reused, not redrafted; after `1`, 002 to 005 in M1, 004 blocked by 001, no two tickets with the same outcome. Its report miscounted the edges in one line. It kept 005, which waits on a decision ticket, at `backlog`, while sessions 18 and 21 moved such tickets to `ready`; both are safe. |
| 7, spec gap and unknown | PASS | Session 23: no columns invented; the undecided table became a decision ticket for `wkc-architect` blocking the table work; the spike names its question, the evidence, and the SPEC sections, with throwaway code. `issues_dir` unchanged. |
| 8, interrupted publication | PASS on the old check | Session 24: counted M1's four tickets, drafted only the deployment ticket, and after `1` created 005 alone with `blocked_by: ['001', '003']`; no title appears twice. It treated 001 to 004 as reused and left them at `backlog`, so nothing reached the frontier; the `076d84b` run had moved them to `ready`. A sentence now makes leftover tickets part of the publication, and case 8's check was tightened to match. Not rerun on that sentence. |

### Wording change, 2026-10-18

Added from the source cross-check: prefer checks a command can run, setup tickets proven by a passing test, and spike timeboxes. Static checks only: frontmatter and `agents/openai.yaml` unchanged,
no em dash in the changed lines, and the outline additions are comments or optional lines. Case 21 is new and
SKIP: no AI sessions were authorized for this change. Earlier cases keep their evidence; their checks did not change.
