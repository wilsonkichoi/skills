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
   PASS: the rerun lists the milestone first, creates only the missing ticket, and no title or outcome appears twice.

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
