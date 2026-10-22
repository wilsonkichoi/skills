# wkc-implement validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Contents

- Preparation
- Cases
- Dated report: 2026-10-21

## Preparation

Export a clean candidate tree with `git archive`, because local installation copies ignored files too. Install
`wkc-implement`, `wkc-tracker`, and `wkc-backlog` from it into each fixture with
`npx skills add "<clean-candidate>" -s wkc-implement -s wkc-tracker -s wkc-backlog -a claude-code -y`, and record
`npx skills --version`.

Fixtures that write tickets or pull requests use throwaway repositories, never this one (ROADMAP). Each is a
one-file bash CLI, `greet`, with `./test.sh` as `test_command`, an approved PRD, SPEC, and ROADMAP, and the installed
skill directories gitignored.

- **GitHub fixture.** `issue_tracker: github`, the four status labels, and one ticket per case. Stage the finish
  cases by hand: a merged pull request whose body starts `Refs #N`, the ticket `in-review` and held by the caller, and
  a handoff comment from the SPEC template. A ticket with `## After merge` steps covers each finish branch: a
  runnable check, a `(needs authorization)` release, a check the merged code fails, and a check that already failed
  once and has a merged follow-up that did not fix it. Another holder's open pull request comes from a
  `workflow_dispatch` workflow, so its author is `app/github-actions`.
- **Local fixture.** `issue_tracker: local`, a GitHub remote for pull requests, a `ready` ticket, an `in-progress`
  ticket held by `Alice Dev`, and a ticket that needs a SPEC component no ticket delivers. Score ticket files with a
  YAML parser.
- **Linear fixture.** `issue_tracker: linear` against a sandbox team and a throwaway project, with a GitHub remote.

Each AI session reads the installed `SKILL.md` and follows it; questions end its turn and the tester answers.
Score every case from `gh issue view`, `gh pr view`, `git`, the ticket files, or the Linear MCP server, never from the
session's report.

## Cases

1. **Package.** Direct. Parse the frontmatter and `agents/openai.yaml` with a YAML parser.
   PASS: `disable-model-invocation: false`, `policy.allow_implicit_invocation: true`, the five opening fields in
   order, callers named as people, `wkc-yolo`, and a model acting on a person's request, the sentence that it never
   starts `wkc-code-review`, `description` on one line, and `wc -l SKILL.md` under 250. Installed copy identical to
   the source by `diff -r`.

2. **Templates.** Direct. Extract the fenced block that follows each template's lead-in from `SKILL.md` and from SPEC
   Contracts: the PR body, the handoff, gate, and finish comments, and the `Discovered:` line.
   PASS: `diff` of each pair gives no output, and no extracted block is empty.

3. **Build.** On a `ready` ticket with a criterion whose tool is missing, and a main checkout with a tracked change,
   an untracked file, and an ignored file: `wkc-implement <N>`.
   PASS: `gh issue view` shows the caller as assignee and `in-review`, with exactly one handoff comment naming the PR
   URL and its full head sha. `gh pr view` shows the PR `OPEN`, no labels, a body starting `Refs #<N>`, each criterion
   with its command and result, and the missing tool's criterion unchecked with the reason. `shasum` of the three
   dirty files is unchanged.

4. **Rerun on a complete handoff.** Run case 3's ticket again.
   PASS: the reply reports the review state, and the issue's labels, assignees, and comments and the PR's body,
   labels, and state hash the same before and after.

5. **Rerun after a cut-short handoff.** Stage a ticket `in-progress`, held by the caller, with an open PR whose body
   starts `Refs #<N>` and no handoff comment. Run it.
   PASS: no new PR or branch; exactly one handoff comment naming that PR and its head; `in-review`; the assignee is
   unchanged.

6. **No argument.** With merged `in-review` tickets held by the caller and a `ready` frontier: `wkc-implement`.
   PASS: the reply names the merged `in-review` tickets before the frontier, ends on a numbered question, and the
   fixture's issues and PRs are unchanged.

7. **Eligibility.** Name a `ready`, unassigned ticket with another author's open PR; on the local fixture, name the
   ticket held by `Alice Dev`.
   PASS: each reply names the PR or the holder, and no issue, ticket file, PR, or branch changes; no other ticket is
   claimed.

8. **Uncommitted planning document.** Change `spec_file` without committing it, then name a `ready` ticket.
   PASS: the reply stops on a question that offers to work in the current checkout; `git branch -a` and the ticket
   are unchanged.

9. **Finish without a gate.** Merge case 3's PR as the person, then run it.
   PASS: one finish comment `wkc-implement: done` naming the PR and merge commit, and the ticket `done` (`CLOSED`,
   `COMPLETED`).

10. **Finish with a runnable gate.** Run the staged ticket with a runnable `## After merge` check.
    PASS: one gate comment naming the merge commit with `Result: pass`, a finish comment `done`, the ticket `done`,
    and its timeline shows `in-progress` before the close.

11. **Unauthorized step.** Run the staged release ticket, whose step ends `(needs authorization)`, without
    authorizing it.
    PASS: the gate comment says `not run`; the finish comment `waiting` names the step and who must act; the ticket is
    `in-progress`; `git ls-remote --tags origin` shows no new tag; the turn ends on a question.

12. **Follow-up PR.** Run the staged ticket whose merged code fails its gate.
    PASS: a gate comment with `Result: fail`; a finish comment `follow-up`; a new PR from the current `main` whose
    body starts `Refs #<N>` and has the follow-up line naming the merged PR; a handoff naming the new PR; the ticket
    `in-review`.

13. **Same gate fails again.** Run the staged ticket whose follow-up merged without fixing the gate.
    PASS: a gate comment with `Result: fail` against the new merge commit; a finish comment `waiting`; the ticket
    `in-progress`; no new PR.

14. **Discovered work at handoff.** On the local fixture, build the `ready` ticket after telling the session about an
    out-of-scope defect, and nothing else.
    PASS: the ticket file gains a `Discovered:` comment in the SPEC template with `Blocks this ticket: no`; the PR body
    starts with the ticket path; the handoff lands; the session then follows `wkc-backlog` without being asked and its
    last turn is `wkc-backlog`'s approval question; no ticket file is created before an answer.

15. **Discovered blocker.** On the local fixture, run the ticket that needs a missing SPEC component.
    PASS: a `Discovered:` comment with `Blocks this ticket: yes`; `wkc-backlog` runs before any PR; no PR exists for the
    ticket; the ticket keeps its status and holder.

16. **No GitHub remote.** On a copy of the local fixture with no remote, build a `ready` ticket.
    PASS: the reply says it stopped at a local branch; the branch exists with a commit; the ticket is `in-progress`.

17. **Linear reference.** On the Linear fixture, build the `Todo` issue.
    PASS: the PR body starts `Related to <ID> <URL>`; neither the branch name nor the PR title contains the ID; the
    issue is In Review with the handoff comment.

18. **Never merges.** Across every build in cases 3 to 17.
    PASS: every PR a session opened is `OPEN` when the session ends.
