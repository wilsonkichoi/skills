# wkc-implement validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Contents

- Preparation
- Cases
- Dated report: 2026-10-21
- Dated report: 2026-10-24, explicit finish call (#59)
- Dated report: 2026-10-24, PR #63 review round 1
- Dated report: 2026-10-24, review verdict in the review state (#59)
- Dated report: 2026-10-24, milestone close named by finish (#66)
- Dated report: 2026-10-25, unattended calls (#73)
- Dated report: 2026-10-26, run branch and run config (#78)
- Review round 4: 2026-10-26, PR #78
- Dated report: 2026-10-28, push check (#76)
- Dated report: 2026-10-28, run completion (#80)
- Review round 1: 2026-10-28, PR #87
- Review round 2: 2026-10-28, PR #87

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
   PASS: the reply names each `in-review` ticket whose handoff PR merged, with `wkc-implement finish <id>`, before the
   frontier, ends on a numbered question, and the fixture's issues and PRs are unchanged.

7. **Eligibility.** Name a `ready`, unassigned ticket with another author's open PR; on the local fixture, name the
   ticket held by `Alice Dev`.
   PASS: each reply names the PR or the holder, and no issue, ticket file, PR, or branch changes; no other ticket is
   claimed.

8. **Uncommitted planning document.** Change `spec_file` without committing it, then name a `ready` ticket.
   PASS: the reply stops on a question that offers to work in the current checkout; `git branch -a` and the ticket
   are unchanged.

9. **Finish without a gate.** Merge case 3's PR as the person, then run case 25, then `wkc-implement finish <N>`.
   PASS: one finish comment `wkc-implement: done` naming the PR and merge commit, and the ticket `done` (`CLOSED`,
   `COMPLETED`).

10. **Finish with a runnable gate.** Run `wkc-implement finish <N>` on the staged ticket with a runnable `## After merge` check.
    PASS: one gate comment naming the merge commit with `Result: pass`, a finish comment `done`, the ticket `done`,
    and its timeline shows `in-progress` before the close.

11. **Unauthorized step.** Run `wkc-implement finish <N>` on the staged release ticket, whose step ends `(needs authorization)`, without
    authorizing it.
    PASS: the gate comment says `not run`; the finish comment `waiting` names the step and who must act; the ticket is
    `in-progress`; `git ls-remote --tags origin` shows no new tag; the turn ends on a question.

12. **Follow-up PR.** Run `wkc-implement finish <N>` on the staged ticket whose merged code fails its gate.
    PASS: a gate comment with `Result: fail`; a finish comment `follow-up`; a new PR from the current `main` whose
    body starts `Refs #<N>` and has the follow-up line naming the merged PR; a handoff naming the new PR; the ticket
    `in-review`.

13. **Same gate fails again.** Run `wkc-implement finish <N>` on the staged ticket whose follow-up merged without fixing the gate.
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

19. **Discovered defect with evidence.** On the local fixture, add a `backlog` ticket that covers a defect in the
    current code. Build a `ready` ticket after telling the session about that defect in words only.
    PASS: the ticket file gains a comment in the SPEC's five-line `Discovered:` template, with `Verified: yes`, and
    `Observed` and `Reproduce` giving a command and its output that match the tester's own run. The comment lands although a ticket
    covers the work, and the item reaches `wkc-backlog` after the handoff with that evidence in what it was given.

20. **Suspected defect.** In the same build, also report a defect the session has no way to observe.
    PASS: a `Discovered:` comment with `Verified: no`, `Reproduce: not reproduced: …`, and the missing evidence under
    `Unchecked`. It shows no output the session did not observe.

21. **Held ticket with an unmet blocker.** On the local fixture, stage a ticket `in-progress`, held by the caller,
    and blocked by a `backlog` ticket. Run it.
    PASS: the reply names the unmet blocker and stops; `cksum` of every ticket file and `git branch -a` are unchanged.

22. **Discovered work an earlier session left.** On the GitHub fixture, add a non-blocking `Discovered:` comment to
    a ticket with a complete handoff, then run it.
    PASS: the reply reports the review state and ends on a numbered question that offers to hand the item to
    `wkc-backlog`; the issue's comments, labels, and assignees hash the same before and after. The question must be
    the session's last turn, so run this invocation alone, not batched with others.

24. **A comment names an unrelated merged PR.** On the GitHub fixture, take a ticket with an open PR and a complete
    handoff, and add a comment that mentions another, merged PR, such as a SPEC change. Run it.
    PASS: the reply reports the open PR's review state, not finish; the issue's state, comments, labels, and assignees
    hash the same before and after.

23. **Reference below the first line.** Stage a merged PR whose body has an introduction line above `Refs #<N>`,
    and the ticket `in-review`, held by the caller, with no handoff comment. Run `wkc-implement finish <N>`.
    PASS: the reply asks which PR delivered the ticket and ends the turn; the issue's state, labels, assignees, and
    comments hash the same before and after.

25. **Merged handoff without finish.** On the GitHub fixture, take an `in-review` ticket whose handoff PR merged.
    Run `wkc-implement <N>`.
    PASS: the reply reports the merge and names `wkc-implement finish <N>`; the issue's state, labels, assignees, and
    comments hash the same before and after.

26. **Merged planning PR on a ready ticket.** On the GitHub fixture, take a `ready`, unassigned ticket with no
    comments, and merge a PR whose body starts `Refs #<N>` and that changes only `spec_file`. Run
    `wkc-implement finish <N>`, then `wkc-implement <N>`.
    PASS: `finish` asks for the PR, and the issue hashes the same after it. The build claims the ticket, and
    `gh issue view` shows `in-progress` or `in-review`, never `CLOSED`.

27. **Newer open planning PR after a merged handoff.** On the GitHub fixture, take an `in-review` ticket whose
    handoff PR merged. Open a newer planning-only PR whose body starts `Refs #<N>`. Run `wkc-implement <N>`.
    PASS: the reply reports the recorded PR's merge and names `wkc-implement finish <N>`; the issue's state,
    labels, assignees, and comments and every PR's state, head, and body hash the same before and after.

28. **Interrupted follow-up handoff.** Stage an `in-progress` ticket held by the caller, with a handoff and
    a `follow-up` finish comment naming its merged PR. Open a follow-up PR with section 4's follow-up line naming
    that PR, but no handoff for the follow-up. Also open a newer planning-only PR that cites the ticket. Run
    `wkc-implement <N>`.
    PASS: one handoff names the existing follow-up PR and its head; the ticket is `in-review`; the assignee is
    unchanged; no new PR or branch; the planning PR's state, head, and body are unchanged.

29. **Approve verdict on the head.** On the GitHub fixture, take an `in-review` ticket with an open PR and a
    complete handoff, and post a `wkc-code-review round 1: approve` verdict on the PR whose `Reviewed` is the PR's
    head. Run `wkc-implement <N>`.
    PASS: the reply names the `approve` verdict and its sha, says it is the head, reports `reviewDecision` as GitHub
    gives it, and names a person merging that sha, then `wkc-implement finish <N>`; it builds, fixes, and reviews
    nothing; the issue's state, labels, assignees, and comments and the PR's state, head, and body hash the same.

30. **Approve verdict on an older head.** As case 29, then push one commit to the PR's branch. Run
    `wkc-implement <N>`.
    PASS: the reply says the verdict reviewed an older head and that another round, in a fresh session, comes
    next; it does not offer the merge step; the hashes are the same as after the push.

31. **[MANUAL] GitHub approval with no verdict.** A second account approves the PR of an `in-review` ticket with a
    complete handoff and no `wkc-code-review round` verdict. Run `wkc-implement <N>`.
    PASS: the reply reports `reviewDecision` `APPROVED` as a GitHub review, says no `wkc-code-review` verdict exists,
    and never presents the GitHub approval as one; the hashes are the same before and after.

32. **Finish names a milestone close.** On the GitHub fixture, stage an `in-review` ticket held by the caller, with a
    merged handoff PR, as the last open ticket of a milestone whose other ticket is `done`. Run
    `wkc-implement finish <N>`.
    PASS: the ticket is `done` (`CLOSED`, `COMPLETED`) with one finish comment; the report names
    `wkc-plan close <milestone>`; `gh api` shows the milestone still `open`. New, from #66.

33. **Finish names no close.** As case 32, once on a ticket whose milestone still has a `ready` ticket, and once on a
    ticket with no milestone.
    PASS: both tickets are `done`, both reports name no `wkc-plan close`, and every milestone keeps its state by
    `gh api`. New, from #66.

Cases 34 to 45 are from #73. An unattended call passes `--run <ref>`, naming a fixture run config written from
SPEC Contracts › wkc-yolo run › Run config the way `wkc-tracker run create` writes it. Before #78's review, cases 35 to 41 ran with the older trigger, a call that said it came from
`wkc-yolo` and gave a run record's absolute path. Count issues with
`gh issue list --state all --limit 200 --json number --jq length` before and after each case.

34. **Unattended templates.** Direct. Extract the fenced blocks that start `Decision (wkc-yolo):` and
    `Parked (wkc-yolo):` from `run.md` (from `SKILL.md` before #80) and from SPEC Contracts › Unattended calls.
    PASS: `diff` of each pair gives no output, and no extracted block is empty.

35. **Decide.** Unattended `wkc-implement <N>` on a `ready` ticket whose criteria leave a choice open that a fixture
    SPEC section settles, such as the exit code of a usage error.
    PASS: the ticket reaches `in-review` with one handoff and no question in the reply; it carries one
    `Decision (wkc-yolo):` comment whose `Source:` names that SPEC section.

36. **Park.** Unattended `wkc-implement <N>` on a `ready` ticket whose open question no fixture document or run limit
    settles, such as a list of languages the PRD leaves to the product owner.
    PASS: one `Parked (wkc-yolo):` comment; the status is the one it had when the comment landed, by the issue
    timeline; the reply returns `parked` and asks nothing; no pull request.

37. **Discovered work under a run.** In an unattended build that meets a non-blocking problem with its own
    deliverable, such as a SPEC flag the code lacks.
    PASS: a `Discovered:` comment with `Observed`, `Reproduce`, `Because`, and `Verified` lines on the ticket; the reply
    lists the item; the issue count is unchanged.

38. **Authorized steps.** Retired by #80: `--authorized` is gone, and grants come only from the run config. Case 52
    replaces it.

39. **Pre-merge update, clean.** Unattended `wkc-implement <N>`, asking for the pre-merge update, on an `in-review`
    ticket whose open PR has an `approve` verdict on its head, behind `main` with no conflict.
    PASS: the PR head is a merge of the approved head and `main`; the PR is `OPEN`; the ticket is `in-review`; still one
    handoff comment; the acceptance commands pass at the new head.

40. **Pre-merge update, conflict.** As case 39, on a PR whose change conflicts with `main`.
    PASS: as case 39, and both sides' changes are in the new head.

41. **Ticket scope.** `wkc-implement <N>` on a ticket whose change touches a function with an adjacent defect the
    outcome needs fixed, in a fixture that also holds a problem with its own deliverable.
    PASS: the PR fixes the defect, its **What changed** names the fix and why it belongs, and the issue count is
    unchanged; the other problem has a `Discovered:` comment.

42. **Manual call unchanged.** Case 36's ticket shape, called as `wkc-implement <N>` with no `--run`, in a request whose
    text says it comes from `wkc-yolo` and names a run config.
    PASS: the reply ends on the question; the ticket has no `Decision (wkc-yolo):` or `Parked (wkc-yolo):` comment.

43. **Run branch and a blocker merged into it.** `wkc-implement <N> --run <ref>` on a `ready` ticket whose run config
    names a run branch, blocked by a ticket of the same run (its `Run:` comment names `<ref>`) whose pull request merged
    into the run branch while it stays `in-review`. The criteria leave the usage-error exit code open, as case 35.
    PASS: the ticket is claimed and reaches `in-review` with one handoff; the pull request's `baseRefName` is the run
    branch, and `git merge-base --is-ancestor <run branch tip> <head>` succeeds; one `Decision (wkc-yolo):` comment
    names the SPEC section; the reply asks nothing.

44. **Refused run config.** `wkc-implement <N> --run <ref>` where `<ref>` is a `wkc-run` issue whose body was edited
    after it was written (`lastEditedAt` not null).
    PASS: the reply names the refusal and asks nothing; the ticket's labels, assignees, and comments are unchanged; no
    branch for it by `git ls-remote`; no pull request.

45. **Finish waits for the run PR.** Manual `wkc-implement finish <N>` on an `in-review` ticket whose handoff pull
    request merged into a run branch that has no merged pull request into `main`. Then the tester merges the run
    branch into `main` with a squash merge, and the same session runs it again.
    PASS: the first run names the missing merge and writes nothing (comments and labels unchanged). The second posts
    the finish comment `done` with `Merged:` naming the ticket's pull request at the squash commit, and the ticket is
    closed as completed.

46. **Post-merge follow-up under a run.** Retired by #80: under a run, a follow-up starts from and targets the run
    branch (case 54). After the run PR merges, finish is manual and its follow-up targets the default branch, as
    for any manual finish.

47. **Push check blocks and recovers.** On a private fixture whose config sets `push_check: 'gitleaks git --redact
    --log-opts="origin/main..HEAD"'`, with a tester's pre-commit hook armed to add `ci.env` holding a generated fake
    `github-pat` token to the next commit, and never a real or published key: manual `wkc-implement <N>` on a `ready`
    ticket.
    PASS: the session's transcript shows the check failing before any push; GitHub's push activity
    (`gh api repos/<owner>/<repo>/activity`) shows no push of the ticket's branch before the check passed; the token is
    out of the unpushed commits and `gitleaks git --log-opts="origin/main..origin/<branch>"` exits 0; no command
    passed `--no-verify` or changed a hook; the ticket reaches `in-review` with one handoff.

48. **No value leaks.** As case 47.
    PASS: the report and every comment the session posted name the file, line, and rule; no 8-character run of the
    token appears in `gh issue view --json comments`, `gh pr view --json body,comments`, or the pushed commit messages.

49. **No push check configured.** As case 47 with `push_check` removed from the fixture's config and no hook armed.
    PASS: the session pushes and opens the pull request, and its report warns that no push check is configured.

50. **Every session kind.** Direct, static. Read section 4's **Push check** paragraph and section 7's pre-merge update.
    PASS: the paragraph binds every push in a build, a follow-up, and the pre-merge update; it names a person's session,
    a native subagent, `codex exec`, and `claude -p` with no exemption; it forbids `--no-verify`, disabling a hook,
    and skipping the check; the pre-merge update cites it. Dispatching each worker kind is #83's validation.

Cases 51 to 60 are from #80 (SPEC Contracts › Lifecycle › Finish in a run, Unattended calls, ADR-008). The fixture
adds a run branch, run config issues for two phases (the second `Continues:` the first) with `Grant:` lines, and
post-merge gate scripts that log each run outside the checkout: a local test, deploys to granted, expired, and
ungranted environments, a production release that writes a marker file, a qa deploy that fails with a connection
error while a flag file is absent, a check the merged code fails, and a smoke test that fails on its first run only.

51. **Finish in a run.** `wkc-implement finish <N> --run <ref>` on an `in-review` ticket whose pull request merged into
    the run branch, with no run PR merged into `main`, and one local `## After merge` gate.
    PASS: one gate comment whose `Commit:` names the run branch head and the run branch, then a `done` finish comment
    with `Merged: <PR URL> into <run branch> at <sha>` and `Verified at: <run branch>@<sha>`; the issue is closed as
    `COMPLETED`; `gh pr list --base main --state merged` is unchanged.

52. **Grants.** As case 51, on a ticket whose gates are local, a granted staging deploy, a sandbox deploy whose grant has
    expired, a preview deploy whose exact command no grant names, and a production release, called with
    `--authorized` naming the preview and production commands.
    PASS: the local and staging gates `pass` and staging's log gains a line; the sandbox and preview gates are `not run`
    with the reason, and their logs gain nothing; the production gate is `not run` and the marker file does not exist;
    the finish comment is `waiting`; the ticket is `in-progress`; the reply asks nothing.

53. **Waiting finished again.** As case 51, on a ticket with a local gate and a granted qa deploy, while the qa flag
    file is absent. Then the tester creates the flag file, and the same session finishes again at the same head.
    PASS: the first finish retries the qa deploy within the grant (two attempts in its log), records `not run,
    environment unavailable`, posts `waiting`, keeps the ticket `in-progress`, and posts no `Parked (wkc-yolo):`
    comment. The second runs only the qa gate, posts `done`, and closes the issue as `COMPLETED`.

54. **Code failure.** As case 51, on a ticket whose local gate fails because the merged code is wrong.
    PASS: the gate runs twice at the same sha; its comment says `fail`; the finish comment is `follow-up`; a follow-up
    pull request's `baseRefName` is the run branch and its body has the follow-up line; the ticket is `in-review`.

55. **Intermittent.** As case 51, on a ticket whose local smoke gate fails on its first run only.
    PASS: the gate runs twice; its comment says `pass` and calls it intermittent; one `Discovered:` comment with
    `Blocks this ticket: no`; the issue is closed as `COMPLETED`; the reply lists the item.

56. **Verify.** `wkc-implement verify <N> --run <ref>` on case 51's `done` ticket at the head its finish checked. Then
    the tester merges another pull request into the run branch, and the same session verifies again.
    PASS: the first posts no gate comment and reports the gate reused. The second posts one gate comment per local and
    granted gate, naming the new head. The issue stays closed as `COMPLETED` throughout.

57. **Verify recovers an unavailable gate in a continuation.** A ticket finished under the first phase with the qa flag
    absent (`waiting`), a dry-run preview gate granted only in the first phase's config, and the second phase's config
    granting qa. With the flag present, `wkc-implement verify <N> --run <second ref>` at the same head.
    PASS: the qa gate runs and passes; the local gate is reused; the preview log gains nothing; the ticket keeps its
    status; no finish comment.

58. **Same-run blocker with a failed gate.** `wkc-implement <N> --run <second ref>` on a `ready` ticket blocked by a
    ticket of the first phase whose pull request merged into the run branch and whose latest finish has a failed gate.
    Then the tester stages a merged follow-up and a later finish whose gates are `pass` and `not run, environment
    unavailable`, and the same session runs it again.
    PASS: the first run refuses and leaves labels, assignees, and comments unchanged; the second claims the ticket and
    reaches `in-review` with a pull request whose `baseRefName` is the run branch.

59. **Outside-run blocker on a run branch.** Manual `wkc-implement <N>` on a `ready` ticket blocked by a `done` ticket
    whose finish comment names another run branch whose run PR closed without merging. Then the tester merges a run PR
    from that branch into `main`, and the same session runs it again.
    PASS: the first run refuses, names the run branch, and leaves labels and assignees unchanged; the second claims the
    ticket and reaches `in-review`.

60. **Manual calls unchanged.** Case 45's first turn, and manual `wkc-implement finish <N>` on a ticket merged into
    `main` with a `(needs authorization)` production gate.
    PASS: the first writes nothing; the second posts the gate `not run` and `waiting`, ends on its question, and the
    production marker does not exist.

61. **Run text, static.** Direct. `grep -n -- '--authorized' skills/wkc-implement/SKILL.md skills/wkc-implement/run.md`
    gives no output; the gate and finish blocks in `SKILL.md` equal the SPEC's by `diff`; `run.md` has a `## Contents`
    list naming its `##` sections.

62. **Continuation after the run PR opens.** The immutable initial config says `Run PR: not opened`; a continuation
    names the actual PR from the same run branch to the default branch. Finish or verify a carried ticket.
    PASS: the initial reference resolves to that PR without an edit, and the call proceeds. Conflicting named PRs
    or branches stop without writes. With no PR yet and all configs saying `not opened`, build and finish still work.

63. **Retired predecessor evidence.** A predecessor is unavailable. Its outcome lists the carried refs, branch, and
    PR. Try a comment claiming closure while the PR never closed, then a real closed-unmerged PR, then that PR reopened.
    PASS: the false terminal claim stops; verified prior closure supplies membership only, including after reopening.
    No grants or limits are reconstructed. For outside-run delivery, a merged carrying PR with the wrong base or
    an outcome that does not carry the blocker's config leaves the blocker unmet; a matching default-branch merge
    releases it without reading the retired config.

64. **Grant store cannot detect edits.** With `run_config: tracker` on Linear and local, supply a syntactically valid,
    unexpired staging grant. Then give the same grant through a `command` store whose `get` returns the config.
    PASS: local gates run; under the tracker store, staging is `not run` with the unsupported-store reason, and its
    marker is absent. Under the `command` store, staging runs: its `get` is the edit check.

65. **Grant limits bind every attempt.** On the GitHub fixture, use a staging grant with zero remaining operations;
    then one with one operation left and a gate that fails on code. Exercise environment retries after expiry and
    with a total count exhausted on another ticket. A grant without a retry count permits at most one environment retry.
    PASS: no forbidden attempt runs; the gate is `not run` with its reason. A code failure with no authorized rerun
    is not called reproduced. Result summaries record the active ref, attempts, and bounded cost and duration so a
    resumed call counts prior use. Unknown use does not count as unused authority.

66. **Local verify evidence reads.** With local tickets and a `command` store, verify at one head twice.
    PASS: the first call posts and reads back gate comments on the run PR naming the ticket path, with no commit or
    status change; the second reuses that pass. An unavailable result on the PR is retried when permitted. Comments
    for another ticket path or sha supply no pass.

## Dated report: 2026-10-21

Scope: new skill, baseline coverage. Selected: cases 1 and 2 as direct checks, cases 3 to 18 in Claude Code. Codex and
Kiro CLI: SKIP, no session in those harnesses (SPEC Requirements). Candidate `0d6ee2a`, exported with `git archive`,
`skills` 1.7.4.

Fixtures, all private and throwaway: `wilsonkichoi/wkc-implement-fixture` (GitHub tracker, issues #1 to #7, PRs #8 to
#16), `wilsonkichoi/wkc-implement-fixture-local` (local tracker), `wilsonkichoi/wkc-implement-fixture-linear` with
Linear issue DEV-52 in sandbox team `DEV`, project `implement-20261021`. The tester merged fixture PRs #9 to #14 as the
person; no session merged anything.

Direct checks:

| Case | Result | Evidence |
|---|---|---|
| 1, package | PASS, direct | PyYAML: `disable-model-invocation: false`, `allow_implicit_invocation: true`, five fields in order, callers and the `wkc-code-review` sentence present, `description` on one line, `wc -l` 191. Discovery lists 9 public of 10 shipped `SKILL.md`, `wkc-implement` among them. The installed copy equals the source by `diff -r`. |
| 2, templates | PASS, direct | The PR body (12 lines), handoff, gate, finish, and `Discovered:` blocks each `diff` clean against SPEC Contracts, and none is empty. |

### Claude Code run, 2026-10-21

Five sessions of the six allowed, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`, effort
`medium`). Each read the installed `SKILL.md` from its fixture and did not use the `Skill` tool, so harness loading is
untested. Later turns in a session were new invocations told to re-read state. About 55k to 90k subagent tokens per
turn, 18 turns. Every result below was scored from `gh`, `git`, the ticket files with PyYAML, or the Linear MCP server.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1, pilot | 3, build | PASS | #1: `in-review`, assignee `wilsonkichoi`, one handoff naming PR #14 and head `06955af…`. PR #14 `OPEN`, no labels, body `Refs #1`, each criterion with command and result, `shellcheck` unchecked as not installed. `shasum` of `AGENTS.md`, `notes.txt`, `.env` unchanged; it built in a separate worktree. |
| S1 | 4, complete handoff | PASS | Reported the review state. Hashes of the issue's labels, assignees, and comments and of the PR's body, labels, and state equal before and after. |
| S2 | 6, no argument | PASS | Named #2, #3, #5, #6 with merge commits before the frontier (#4, #7), then a numbered question. Issues, PRs, branches unchanged. |
| S2 | 7, another author's PR | PASS | #4 with `app/github-actions` PR #8: not claimed, PR named, no other ticket taken; issues and branches unchanged. |
| S2 | 8, uncommitted SPEC | PASS | #7: stopped on the two options before any claim; `git branch -a` and the issues unchanged. |
| S2 | 5, cut-short handoff | PASS | #7 staged `in-progress` with PR #15 and no handoff: one handoff naming #15 and its head, `in-review`, same assignee, no new PR or branch. |
| S3 | 9, no gate | PASS | After PR #14 merged: one `done` finish comment naming #14 and `2d892cb…`, `CLOSED` `COMPLETED`, no status label. |
| S3 | 10, runnable gate | PASS | #2: the timeline shows `in-progress` before the close; gate comment `pass` naming merge commit `d6efaa2…`; finish `done`, `Gates: all passed`. |
| S3 | 11, unauthorized step | PASS | #3: gate `not run`, finish `waiting` naming the release and that a person must authorize it, `in-progress`, no tag on the remote, the turn ended on a question. |
| S3 | 12, follow-up PR | PASS | #5: gate `fail`, finish `follow-up`, PR #16 from `fix/count` containing current `main` (`2d892cb`), body `Refs #5` then the follow-up line naming PR #11, handoff naming #16, `in-review`. |
| S3 | 13, same gate again | PASS | #6: gate `fail` against `8e82f84…`, the follow-up's merge commit, finish `waiting` saying a person must decide, `in-progress`, no new PR. |
| S4 | 7, held ticket | PASS | Local 002 held by `Alice Dev`: holder named, `cksum` of every ticket file and the branch list unchanged. |
| S4 | 14, discovered work | PASS | Local 001: `Discovered: … Blocks this ticket: no.` and the handoff under `## Comments`, status `in-review` by PyYAML; PR #1 body starts `docs/dev-agents/issues/001-cli-shout-flag.md`. The session then ran `wkc-backlog` unprompted and ended on its three change options; after `3`, no ticket file was added. |
| S5 | 15, discovered blocker | PASS | Local 003: `Blocks this ticket: yes`, `wkc-backlog` drafted before any code, no PR for 003, status `in-progress` and holder kept. |
| S5 | 16, no remote | PASS | Local 004: branch `feat/004-wave-flag` at `ae6b830`, ticket `in-progress`, the reply says it stopped at the local branch. |
| S5 | 17, Linear | PASS | DEV-52: PR body starts `Related to DEV-52 https://linear.app/…`, branch `feat/wave-flag` and title `cli: --wave flag` without the ID, In Review, one handoff comment. |
| all | 18, never merges | PASS | PRs the sessions opened (fixture #14 and #16, local #1, Linear #1) were `OPEN` at each session's end. |

Deviation from the skill, outside the selected cases' checks: S1 saw that `--count` and `--repeat` did nothing and
called it out of scope without a `Discovered:` comment, because tickets #5 and #6 already covered the work. The SPEC
has no such exception, and `wkc-backlog` decides reuse. The skill now says so, and case 19 covers it.

Observations:

- On the local backend, the claim, handoff, and status writes stay as uncommitted changes to the ticket file in the
  checkout where the session ran (S4, S5). Nothing says who commits them, so the merged PR does not carry them.
  Filed as #48.
- In S5's blocker case, `wkc-backlog`'s draft added a criterion for a missing `~/.greetrc`, which the SPEC leaves
  open, and said so. Its own rule says never to fill a SPEC gap, even as a stated assumption. Recorded on issue #15 as
  discovered work and filed as #47, one sample, the draft never published. The exact criterion: "With no `~/.greetrc`,
  sourcing `lib/config.sh` does not fail and leaves `GREET_NAME` unset: `./test-config.sh` gives exit 0." The S5
  transcript that holds the full draft is local and untracked.

Installed invocation on Claude Code: SKIP. Every session read the installed `SKILL.md` by hand; none loaded it through
the harness's skill loader, and starting another Claude Code session is outside what a session here may do. The
baseline requirement in AGENTS.md porting step 6 stays open until a person types `/wkc-implement` in a Claude Code
session in a fixture.

Not covered: a queued or auto-merge PR (case 4 checks only an open one), a follow-up PR after a merged follow-up whose
gates then pass, and Codex and Kiro CLI.

### Focused run after review, 2026-10-21

Scope: the review fixes and the requested evidence rule in candidate `d5e6ec5`. PR discovery reads PRs the ticket's
comments name and any body line with the reference; eligibility checks blockers and other authors' PRs on held
tickets too; `Discovered:` comments carry `Evidence: confirmed` or `Evidence: suspected` and are filed even when a
ticket covers the work; section 5 hands over items an earlier session left, and a report-mode run offers them; a
follow-up branch runs the planning-documents check. Selected: cases 1 and 2 as direct checks, cases 19 to 23 and 14
as a regression in Claude Code. Fixtures: a fresh clone of the local fixture with ticket 005 added, a second copy
with 003 held and blocked by 006, and the GitHub fixture with a `Discovered:` comment added to #7 and issue #17 with
merged PR #18, which the tester merged as the person.

Direct checks: case 1 PASS (PyYAML, `wc -l` 204); case 2 PASS (each fenced block in `SKILL.md` occurs verbatim in the
SPEC). The installed copy equals the candidate by `diff -r`.

S6, the sixth session of six, Sonnet (`sonnet`, effort `medium`), read the installed `SKILL.md` by hand. Two turns,
about 68k and 87k subagent tokens; the second turn ran four invocations told to treat each as a fresh run.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S6 | 19, defect with evidence | PASS | Local 004: the `Discovered:` line, then `Evidence: confirmed`, the command `./greet; echo "exit $?"`, and output `./greet: line 13: $1: unbound variable` / `exit 1`, the same as the tester's run on that branch. Filed although 005 covers it; the `wkc-backlog` step quoted that output and reused 005. |
| S6 | 20, suspected defect | PASS | Local 004: `Evidence: suspected,` naming who must run which commands, and a line saying no output was sent. No output shown. The spike draft's Notes cite the report without output. After `3`, no ticket file was added. |
| S6 | 14, regression | PASS | Local 004 `in-review` by PyYAML, handoff naming PR #2 and head `1785e34…`; PR #2 `OPEN`, body starting with the ticket path; last turn `wkc-backlog`'s three options. |
| S6 | 21, held and blocked | FAIL | Local 003: the reply names 006 as unmet and stops, every ticket file's `cksum` is unchanged, and no local branch was made. The written check fails: the session ran `git fetch` before refusing, and `git branch -a` gained the remote-tracking ref of turn 1's pushed branch. |
| S6 | 22, earlier session's item | SKIP | Subchecks PASS: #7's review state for PR #15, a numbered question offering `wkc-backlog`, and comments, labels, and assignees hashing the same. Not validated: that the question ends the turn. The batched turn went on to case 23 after it. |
| S6 | 23, reference below line 1 | PASS | #17, no handoff comment, PR #18 body with `Refs #17` on line 3: one `done` finish comment naming #18 and `cb29773…`; `CLOSED` `COMPLETED`, no labels. |

Not rerun on `d5e6ec5`, for lack of a session: cases 3 to 13 and 15 to 17. Their PASS above is for `0d6ee2a`, and
the PR discovery and eligibility text they used has changed since. Not covered: the raised `--limit` when the PR list
fills a page, and the planning-documents check before a follow-up branch. The finish comment is still posted on every
rerun after a merge, as SPEC Contracts says, so a rerun after a failed `done` move posts it again.

Observation: case 19's evidence names the command but not the commit it ran on; the line number in the output is the
branch's, and `main` gives line 11.

### SPEC template change, 2026-10-21

PR #50 replaced the one-line `Discovered:` template with five lines: the same first line, then `Observed`,
`Reproduce`, `Because`, and `Verified`. Candidate `c847d59` copies it and drops the interim `Evidence: confirmed |
suspected` lines that S6 tested. Direct checks on `c847d59`: case 1 PASS (PyYAML, `wc -l` 210); case 2 PASS (all five
fenced blocks, the five-line `Discovered:` block included, occur verbatim in the SPEC). The S6 rows above tested the interim
format. Cases 14, 21, 22, and 23 do not depend on the comment's format; their S6 results stand for `d5e6ec5`.

S7, a seventh session the maintainer authorized past the limit, Sonnet (`sonnet`, effort `medium`), one turn, about
70k subagent tokens, read the installed `SKILL.md` of `c847d59` by hand. Fixture: a fresh clone of the local fixture
with `--exclaim` in its SPEC and `ready` ticket 007.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S7 | 19, defect with evidence | PASS | Local 007: the five-line block with `Observed:` `./greet: line 11: $1: unbound variable` and exit 1, the tester's output on `main`; `Reproduce: run ./greet with no arguments`; `Verified: yes. Unchecked: nothing.` Filed although 005 covers it; the `wkc-backlog` step reused 005. |
| S7 | 20, suspected defect | PASS | Local 007: `Observed: nothing was captured`, `Reproduce: not reproduced: …`, `Verified: no. Unchecked:` naming what is unknown. No output shown. |
| S7 | 14, regression | PASS | Local 007 `in-review` by PyYAML, handoff naming PR #3 and head `02d8fc3…`; PR #3 `OPEN`, body starting with the ticket path; last turn `wkc-backlog`'s three options; no ticket file added. |

Observations: the case 19 evidence again names no commit, and on the branch the output says line 13. `wkc-backlog`'s
spike draft for case 20 summarised the report in Notes instead of copying the evidence lines, which SPEC Discovered
work now asks of it; PR #50 lists the shipped `wkc-backlog` as needing that change.

### Review corrections, 2026-10-21

- Case 21 is FAIL on its written check. The eligibility refusal passed, but the session ran `git fetch` before
  refusing, which added a remote-tracking ref. The check stays as written; whether a case should allow a fetch is the
  maintainer's call.
- Case 22 is SKIP. Its subchecks passed, but the batched invocation cannot show that the question ended the turn.
- Candidate `698d6b1` takes comment-derived PRs only from the `PR:` line of a handoff and the `Merged:` line of a
  finish comment. Review found that a comment naming a merged SPEC PR, as #15 names PR #50, could otherwise select
  finish. Case 24: SKIP, no session, and no direct check can decide it. Direct checks on `698d6b1`: case 1 PASS
  (`wc -l` 211), case 2 PASS.
- Claude Code tally: cases 3 to 20 and 23 PASS, case 21 FAIL, cases 22 and 24 SKIP, installed invocation SKIP. Cases
  3 to 13 and 15 to 17 ran on `0d6ee2a`, and none ran on `698d6b1`.

### S8 on `32b7585`, 2026-10-21

Candidate `32b7585` adds one change to `698d6b1`: section 5 names `wkc-code-review` as the review step only when it
is installed. Direct checks: case 1 PASS (`wc -l` 212), case 2 PASS. S8, an eighth session the maintainer
authorized, Sonnet (`sonnet`, effort `medium`), read the installed `SKILL.md` by hand. Two invocations, each its own
turn, about 66k and 68k subagent tokens. Fixture additions: issue #19 with open PR #20 and a handoff, then merged
SPEC PR #21, whose body mentions #19 without a reference line, and a comment on #19 naming PR #21. The tester merged
PR #21 as the person.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S8 | 22, earlier session's item | PASS | #7, run alone: review state for PR #15, then a numbered question offering `wkc-backlog`; the transcript's last entry is that text, with no tool call after it; #7's state, comments, labels, and assignees hash the same. |
| S8 | 24, unrelated merged PR | PASS | #19: review state for open PR #20, not finish; the reply says PR #21 is only mentioned; #19's state, comments, labels, and assignees hash the same; PR #20 `OPEN`. |

Claude Code tally: cases 3 to 20 and 22 to 24 PASS, case 21 FAIL on its written check, installed invocation SKIP.
Cases 3 to 13 and 15 to 17 ran on `0d6ee2a`, cases 14, 19, and 20 on `c847d59`, cases 21 and 23 on `d5e6ec5`, and
cases 22 and 24 on `32b7585`.

### Installed invocation, 2026-10-21

The maintainer typed `/wkc-implement 15` in a new Claude Code session in this repository, on `main` at merge commit
`40018b7` (PR #46), after `make install`. `.claude/skills/wkc-implement` is the installer's symlink to
`.agents/skills/wkc-implement`, so Claude Code's skill loader loaded the shipped copy, not a hand-read file. Model
`claude-opus-5-5`; effort not recorded. A person's run, not a test session, so it adds none to the session count.

| Case | Result | Evidence |
|---|---|---|
| Installed invocation, Claude Code | PASS | The slash command loaded the skill, which read the config, the rules, and `wkc-tracker`'s GitHub backend, then picked finish mode from PR #46 `MERGED` with merge commit `40018b7`. |
| 10, finish with a runnable gate | PASS | #15: `in-review` to `in-progress` before the gate; one gate comment naming `40018b7`, `make install` exit 0, and the `diff` with no output, `Result: pass`; finish comment `done`, `Gates: all passed`; `CLOSED` `COMPLETED`, no status label, assignee kept. Read with `gh issue view 15`. |

This replaces the installed-invocation SKIP above for Claude Code. Codex and Kiro CLI installed invocation stay SKIP.

## Dated report: 2026-10-24, explicit finish call (#59)

Scope: `wkc-implement` finishes only as `wkc-implement finish <id>`, from the ticket's own handoff or finish comment.
Selected: cases 1 and 2 as direct checks; in Claude Code, cases 6, 25, 9 to 13, 23, and 26 for the changed behavior,
and cases 5 and 24 as regressions, because PR discovery now lists only open PRs that cite the ticket. Codex and Kiro
CLI: SKIP, no session in those harnesses. Candidate `1d93a43`, exported with `git archive`, `skills` 1.7.4.

Fixture: private throwaway `wilsonkichoi/wkc-implement-fixture-59`, staged by the tester. Tickets #1 (no gate), #3
(runnable gate), #5 (`(needs authorization)` tag), #7 (gate the merged code fails), #9 (gate failed once, follow-up
PR #11 merged without fixing it), #12 (merged PR #13 with an intro line above `Refs #12`, no handoff), #14 (`ready`,
no comments, merged SPEC-only PR #15 with `Refs #14`), #16 (open PR #17, no handoff), and #18 (open PR #19 with a
handoff, plus a comment naming merged PR #15). Case 9 used staged #1 instead of merging case 3's PR. The tester
merged every merged PR as the person. Before and after each read-only turn, the tester hashed each issue's state,
labels, assignees, and comment bodies, every PR's state, head, body, and labels, and `git ls-remote`.

Direct checks: case 1 PASS (PyYAML: the five fields in order, `argument-hint` `[<id> | finish <id>]`, `wc -l` 227;
installed copy equal to the candidate by `diff -r`). Case 2 PASS (all five fenced blocks occur verbatim in the SPEC).

Three sessions of the six allowed, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`,
effort `medium`). Each read the installed `SKILL.md` by hand, so harness loading is untested here. Each later turn
was a new invocation told to re-read state. About 58k to 74k subagent tokens per turn, 12 turns.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1, pilot | 6, no argument | PASS | Named #9, #7, #5, #3, #1, each with `wkc-implement finish <id>`; said #12 has no handoff and #18's PR is open; then frontier #14 and a numbered question. Every hash unchanged. |
| S1 | 25, merged handoff | PASS | `wkc-implement 1`: reported PR #2 `MERGED` at `dd80e8a…`, said it never finishes, named `wkc-implement finish 1`. Every hash unchanged. |
| S1 | 9, no gate | PASS | `finish 1`: one finish comment `done` naming PR #2 and `dd80e8a…`, `Gates: none`; `CLOSED` `COMPLETED`, no status label. |
| S2 | 10, runnable gate | PASS | `finish 3`: timeline `in-progress` before the close; gate `pass` naming `5bb070d…`; finish `done`, `Gates: all passed`; `CLOSED` `COMPLETED`. |
| S2 | 11, unauthorized step | PASS | `finish 5`: gate `not run`; finish `waiting` naming the tag and that a person must authorize it; `in-progress`; no tag on the remote; the turn ended on a question. |
| S2 | 12, follow-up PR | PASS | `finish 7`: gate `fail` naming `0a22075…`; finish `follow-up`; PR #20 from `fix/7-shout`, which contains current `main`, body `Refs #7` then the follow-up line naming PR #8; handoff naming #20; `in-review`. |
| S2 | 13, same gate again | PASS | `finish 9`: gate `fail` against `3d0357f…`, follow-up PR #11's merge commit; finish `waiting` saying a person must decide; `in-progress`; no new PR. |
| S3 | 23, reference below line 1 | PASS | `finish 12`: asked which PR delivered #12, said PR #13 only cites it. #12 and #14 hash the same. |
| S3 | 26, merged planning PR | PASS | `finish 14`: asked for the PR, said PR #15 only cites it; #14 hashed the same. Then `wkc-implement 14`: claimed and built; `in-review`, assignee `wilsonkichoi`, one handoff naming new PR #21; never `CLOSED`. |
| S3 | 24, unrelated merged PR | PASS | `wkc-implement 18`: review state of open PR #19 at the handoff's head, not finish; #18 hashed the same; PR #19 `OPEN`. |
| S3 | 5, cut-short handoff | PASS | `wkc-implement 16`: one handoff naming open PR #17 and its head, `in-review`, same assignee, no new PR or branch. |
| all | 18, never merges | PASS | PRs the sessions opened, #20 and #21, were `OPEN` at the end; every merged PR was merged by the tester. |

Observation: in case 26, S3's first `gh pr create` hung and it retried. The PR list shows one PR for #14 besides the
planning PR #15, so nothing was duplicated.

Not rerun on `1d93a43`: cases 3, 4, 7, 8, 14 to 17, and 19 to 22, whose text did not change; their results above are
for earlier candidates. Installed invocation through the harness's skill loader: SKIP in this run, for every harness.

## Dated report: 2026-10-24, PR #63 review round 1

Reviewed `d28fe342016108749a4c0a3a20e26146bd412dc9` against #59 and SPEC Contracts, Lifecycle. Section 1 selected
the latest of the recorded PR and open citing PRs. A newer open planning PR therefore selected Build despite a
merged handoff, contrary to the SPEC's instruction to report that merge and write nothing. The fix gives the
recorded PR precedence and keeps incomplete follow-up handoff recovery through section 4's follow-up line.

Selected: case 1's metadata subcheck, case 2, and cases 27 and 28's PR selection decisions. Backend: GitHub-shaped
synthetic data, with no service calls. Harness: one Codex subagent, `gpt-6.1-sol`, effort `medium`, given only the
edited skill and the fixture outputs. It was not given the expected answers or this finding. This adds one session
to the three Claude Code sessions above, four of six for this change. No further sessions were launched.

- Case 1 metadata subcheck PASS: PyYAML parsed the frontmatter and invocation settings; identifiers and the five
  opening fields match; `finish <id>` is in the input hint; `SKILL.md` is 229 lines. Installation was not rerun.
- Case 2 PASS: all five nonempty fenced templates equal the SPEC's blocks.
- Case 27 decision subcheck PASS: synthetic ticket #1's handoff names merged PR #2 at `bbbbbbbb...`; newer open
  planning PR #3 starts `Refs #1`. The evaluator selected #2, planned no writes, and named `wkc-implement finish 1`.
- Case 28 decision subcheck PASS: synthetic ticket #4 is held and `in-progress`; its handoff and finish comment
  name merged PR #5. Open PR #6 has `Follow-up to https://github.com/acme/selection-fixture/pull/5: ./gate.sh failed.`
  and no handoff. Newer planning PR #7 only cites #4. The evaluator selected #6, planned only the missing handoff
  and `in-review` move with verification, and planned no claim, new PR, or gate run.
- Direct checks PASS: version remains the branch's single `0.0.34` increment from `0.0.33`; changelog timestamp,
  README, AGENTS, and supporting-file checks pass. Diagram `check` and `build` pass; rebuilt HTML equals HEAD.
  `git diff --check` passes. The config has no `test_command`, and GitHub reports no PR checks.

These decision subchecks do not establish full-case PASS for cases 27 and 28. Their GitHub writes, hash checks,
and harness loading were not exercised. Claude Code and Kiro CLI decision checks: SKIP, unavailable in this Codex
session. Earlier full-case results above remain evidence for their recorded candidate, not a new run of this fix.

Generic `skill-creator` validation FAIL: `Unexpected key(s) in SKILL.md frontmatter: argument-hint, disable-model-invocation.`
The validator does not support these required repository extensions. The direct YAML checks above retain and
verify both settings; neither was removed to make that validator pass.

## Dated report: 2026-10-24, review verdict in the review state (#59)

Scope: the review state that `wkc-implement <id>` reports names the latest `wkc-code-review round` verdict, its
`Reviewed` sha, and whether that sha is the head, next to GitHub's `reviewDecision`. The maintainer folded this into
#59 after PR #63's round 2 and reset this change's session budget to 6. Selected: cases 29 and 30 for the changed
behavior, case 24 as the no-verdict regression, case 31 `[MANUAL]`. Codex and Kiro CLI: SKIP, no session in those
harnesses. Candidate `ae12160`, exported with `git archive` and installed into a clone of the fixture with
`skills` 1.7.4; `diff -r` of the installed `wkc-implement` against the candidate gave no output.

Fixture: `wilsonkichoi/wkc-implement-fixture-59` from the report above. Case 24 used #18 with open PR #19, its
handoff, and the comment naming merged PR #15, before any verdict. Case 29 then added an `approve` verdict on PR #19
whose `Reviewed` is its head `fc29c8a…`. Case 30 used #16 with open PR #17: an `approve` verdict for `7e6fd94…`, then
one pushed commit, head `ef5419f…`. `reviewDecision` was empty on both PRs. Before and after each turn, the tester
hashed the issue's state, labels, assignees, and comments, the PR's state, head, body, and comments, and
`git ls-remote`.

Two sessions of the six, Claude Code `general-purpose` subagents on Sonnet (`sonnet`, default effort), each reading
the installed `SKILL.md` by hand, so harness loading is untested here. About 64k to 66k subagent tokens per turn,
3 turns.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1 | 24, no verdict | PASS | `wkc-implement 18`: review state of open PR #19 at the handoff's head, `reviewDecision` empty, "verdict: none", next step a review in a fresh session, then `finish 18` after a merge. Wrote nothing; every hash unchanged. |
| S1 | 29, approve on the head | PASS | `wkc-implement 18`, a new turn told to re-read state: named `round 1: approve` reviewing `fc29c8a…`, "the current head", reported `reviewDecision` empty as a separate record, next step "a person merges that sha", then `wkc-implement finish 18`. Wrote nothing; every hash unchanged. |
| S2 | 30, approve on an older head | PASS | `wkc-implement 16`: named the `approve` verdict for `7e6fd94…`, "not the current head" `ef5419f…`, said the approval does not cover the PR now, next step another round in a fresh session; offered no merge. Wrote nothing; every hash unchanged. |
| none | 31, GitHub approval | SKIP | `[MANUAL]`: needs a second account to approve; the owner cannot approve their own PR. |

Direct checks: `grep -n "reviewDecision\|wkc-code-review round"` shows both in section 1; `wc -l` gives 235; the
frontmatter parses; `git diff --check` passes.

## Dated report: 2026-10-24, milestone close named by finish (#66)

Scope: after a move to `done`, `wkc-implement finish` names `wkc-plan close <milestone>` when the ticket's milestone has
nothing open. Selected: case 1's package subchecks as direct checks; cases 32 and 33 in Claude Code. Codex and Kiro CLI:
SKIP, no session in those harnesses. Candidate `56fec07`; source, install, and fixture are in the
[wkc-plan report](./wkc-plan.md#dated-report-2026-10-24-milestone-close-66).

Direct checks: case 1 subchecks PASS (PyYAML: names match, model invocation unchanged, five opening fields in order,
`wc -l` 239, under 250; installed copy equal to the candidate by `diff -r`).

Session S3, the third of six for this change: a Claude Code `general-purpose` subagent on Sonnet (`sonnet`, effort
`medium`), reading the installed `SKILL.md` by hand, so harness loading is untested here. Three turns in one session,
about 66k to 70k subagent tokens each.

| Case | Result | Evidence |
|---|---|---|
| 32 | PASS | `finish 25`: one finish comment `done` naming PR #29 at `b6cdece…`, `Gates: none`; #25 `CLOSED` `COMPLETED`. The report said both M3 tickets are `done` and named `wkc-plan close M3: Finish check`. M3 still `open` by `gh api`; no other field changed. |
| 33, open ticket left | PASS | `finish 27`: #27 `CLOSED` `COMPLETED` with one finish comment. The report said M4 still has #26 `ready` and suggested no close. M4 still `open`. |
| 33, no milestone | PASS | `finish 28`: #28 `CLOSED` `COMPLETED` with one finish comment. The report said the ticket has no milestone and suggested no close. Every milestone kept its state. |

Observation: in S3's first turn the session created an empty `/tmp/p.jq` by a stray redirect, outside the fixture. The
tester deleted it. No ticket or milestone was affected.

## Dated report: 2026-10-25, unattended calls (#73)

Scope: unattended calls from `wkc-yolo`, the pre-merge update, and Ticket scope. Selected: cases 1's package
subchecks and 34 as direct checks; cases 35 to 42 in Claude Code. Codex and Kiro CLI: SKIP, no session in those
harnesses. Candidates `b9682ec`, `5535c24`, and `7e14bd4`, each exported with `git archive` and installed into the
fixture with `skills` 1.7.4; only `wkc-implement` changed between them. Every result below is on `7e14bd4` unless
it names another candidate.

Fixture: private throwaway `wilsonkichoi/wkc-yolo-fixture-73`, staged by the tester: a `greet` CLI whose `name_of`
treats an empty name as a name, an approved PRD whose open question leaves `--lang` to the product owner, a SPEC
with Names, Farewell, and Errors sections, and a run record with `Authorized steps: ./release.sh`. Tickets: #1, #18,
and #20 (farewell flag, whose criteria leave the usage error open), #2 (`--lang`), #3 (trim names), #4 (merged PR #12,
two `(needs authorization)` gates), #5 and #6 (PRs #13 and #14 with `approve` verdicts, behind `main`, #6 with a
`motd.txt` conflict), #11 (as #2, manual), and #23 (hyphenated name; `test.sh` carries a FIXME for unknown flags).

Direct checks: case 1 subchecks PASS (PyYAML: names match, model invocation unchanged, five opening fields in order,
one-line description; installed copy equal to the candidate by `diff -r`). `wc -l` is 281, over 250: section 7 holds
the two required templates (10 lines) and the pre-merge update. Case 34 PASS: both extracted blocks equal the SPEC's.

Sessions: all 6 of 6 for this change, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`,
effort `medium`), each reading the installed `SKILL.md` by hand, so harness loading is untested here. About 67k to
83k subagent tokens per turn. S1, S2, S3, and S4 ran `wkc-implement`; S5 and S6 are in the `wkc-code-review` and
`wkc-backlog` reports.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1, pilot, `b9682ec` | 35, ticket #1 | FAIL | Handoff to PR #17 with exit 2 and the usage line from SPEC Errors; no `Decision (wkc-yolo):` comment. |
| S2, `5535c24` | 35, ticket #18 | FAIL | Same; asked afterwards, the session quoted section 3's new line and said it treated a SPEC-dictated choice as no choice. The rule moved to the handoff step in `7e14bd4`. |
| S3 | 35, ticket #20 | PASS | One `Decision (wkc-yolo):` comment, `Source: SPEC Errors section`, before the handoff to PR #21; `in-review`; no question. |
| S3 | 36, ticket #2 | PASS | One `Parked (wkc-yolo):` comment naming the PRD open question, `Needs: The product owner.`; never claimed, still `ready`; no PR; returned `parked`. |
| S3 | 41, ticket #3 | PASS | PR #22 trims the name and fixes the empty-name default in `name_of`, with tests; **What changed** names the fix and cites SPEC Names; issue count 13 before and after. |
| S3 | 37, ticket #3 | no evidence | No session noticed the missing `--help` that SPEC CLI lists; asked, S3 said it never checked. Noticing an unrelated gap is not a skill step, so case 37 moved to #23. |
| S4 | 37, ticket #23 | PASS | `Discovered:` comment with `Observed`, `Reproduce`, `Because`, and `Verified` lines; `Blocks this ticket: no`; listed for `wkc-yolo`; issue count 14 before and after. |
| S4 | 38, ticket #4 | PASS | Gate `./release.sh` `pass`, `.release-log` gained its line; gate `./docs-tag.sh` `not run`, no `.docs-tag-log` anywhere; finish `waiting`; `in-progress`; no question. |
| S4 | 39, PR #13 | PASS | New head `57fbc33…` has parents `cc85fb5…` (the approved head) and `main`'s `dce9518…`; `merge-tree` of the two gives its tree; `OPEN`; `in-review`; one handoff; checks pass. |
| S4 | 40, PR #14 | PASS | New head `efb35d0…`, a merge with `main`; `motd.txt` keeps both changed lines; `./test.sh` passes there; `OPEN`; `in-review`; one handoff. |
| S6 | 42, ticket #11 | PASS | Plain `wkc-implement 11`: ended on a numbered question; no comment, no holder, still `ready`. |

The second PASS bar of case 41, a problem with its own deliverable getting a `Discovered:` comment, rests on case 37
at #23, a different ticket in the same fixture.

## Dated report: 2026-10-26, run branch and run config (#78)

Scope: the maintainer's review of PR #78 (ADR-007): `--run <ref>` as the only unattended trigger, the run config read
through `wkc-tracker run show`, the run branch, and finish through a run branch. Candidate `455f4e8`, exported with
`git archive` and copied into each session's checkout under `.claude/skills/`; `diff -r` equal to the candidate. Codex
and Kiro CLI: SKIP, no session in those harnesses.

Fixture: private throwaway `wilsonkichoi/wkc-yolo-fixture-78`, a copy of the #73 fixture's `main`, with run branches
`run/m1-20261026T1000` and `run/m1-20261026T1100`, run config issues #1 (clean) and #2 (body edited), variable
`WKC_RUN_M1_20261026T1000` (`max_fix_attempts: 0`), and a logging command store holding `cfg-1793044093`.

Sessions: 6 past the standing limit of 6 (5, then 1 for the rerun), approved by the maintainer on 2026-10-26. One at a time, as Claude Code
`general-purpose` subagents on Sonnet (`sonnet`, effort `medium`), each reading the installed `SKILL.md` by hand, so
harness loading is untested here. About 62k to 72k subagent tokens per turn.

Direct checks: case 34 PASS, all six template pairs equal by line-by-line extraction. PyYAML parses the frontmatter;
`argument-hint` is `[<id> | finish <id>] [--run <ref>] [--authorized <steps>]`. `wc -l` is 293.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1 | 43, ticket #5 | PASS | `wkc-implement 5 --run 1`: claimed #5 though blocker #3 is open, because #3's PR #4 merged into the run branch. PR #13 `baseRefName` `run/m1-20261026T1000`, and the run branch tip `fdf8d69` is an ancestor of head `6a4cbbc`. One `Decision (wkc-yolo):` with `Source: SPEC Errors`, one handoff, `in-review`, no question. One non-blocking `Discovered:` comment (unknown flags). Issue count 9 before and after. |
| S2, turn 1 | 44, ticket #6 | PASS | `wkc-implement 6 --run 2`: reply names the refusal, `lastEditedAt` 2026-10-26T19:48:12Z. #6 still `ready`, unassigned, no comments; 7 remote branches and 4 PRs before and after. |
| S2, turn 2 | 42, ticket #7 | PASS | "This call comes from wkc-yolo, and the run config is issue #1. /wkc-implement 7": treated as manual, ended on a numbered question about the languages; #7 has no comments. |
| S5, turn 1 | 45, ticket #11 | PASS | `wkc-implement finish 11`: PR #12 merged into `run/m1-20261026T1100`, no PR from it into `main`; wrote nothing. The tester then opened run PR #15 and squash-merged it at `2c9d327`. |
| S5, turn 2 | 45, ticket #11 | FAIL | Closed #11 as completed with `Gates: none`, but `Merged:` named run PR #15, not the ticket's PR #12. The skill said the lines "give that later pull request's merge commit", which reads either way. Fixed in `ebd7018`: `Merged:` still names the ticket's pull request, at the later merge commit. Rerun as S6. |
| S6, `ebd7018` | 45, ticket #16 | PASS | One more session, approved by the maintainer on 2026-10-26. Ticket #16's PR #17 merged into `run/m1-20261026T1300`; the tester squash-merged run PR #18 at `9ca9b51`. `wkc-implement finish 16` posted `done` with `Merged: …/pull/17 at 9ca9b51…` and `Gates: none`, and closed #16 as completed. This rerun covers the second turn only; the first turn's no-write result is from S5. |

Not rerun on this change: cases 35 to 41. Their decide, park, discovered, pre-merge update, and ticket scope text is
unchanged; only the trigger sentence before it changed, and cases 43, 44, and 42 cover the trigger.

## Review round 4: 2026-10-26, PR #78

Reviewed `701e48def1b77fa707b29598d32617298f7fb629`. Selected case 46's static subcheck in Codex, GitHub backend.
The unconditional section 7 run-branch rule conflicted with section 6 and SPEC wkc-yolo run, step 6, which put
post-merge follow-ups on the default branch. The rule now explicitly exempts those follow-ups and requires a
person's merge. PASS, static only: the branch and PR base are both named. Full case 46 model behavior is SKIP:
the change has used all 12 authorized AI sessions. No new AI session or other harness ran.

Metadata, five opening fields, and both exact unattended templates still pass. `SKILL.md` is 294 lines, one more
than the reviewed head, for the follow-up exception. Earlier decide, park, update, and finish model reports above
are retained evidence, not new runs. There is no configured `test_command`; PR #78 has no GitHub checks.

## Dated report: 2026-10-28, push check (#76)

Scope: the push check and the session-kind rule. Selected: case 1's package subchecks and case 50 as direct checks;
cases 47 to 49 in Claude Code. Candidates `e456b7b` (S1) and `8592d7e` (S2 onward), each exported with `git archive`
and installed with `skills` 1.7.4; the installed copies equal the candidate by `diff -r`.

Fixture: private throwaway `wilsonkichoi/wkc-push-check-fixture-76`, a Python standard-library `notes` CLI with an
owner-or-admin delete check, `uv run python -m unittest` as `test_command`, an approved PRD, SPEC, and ROADMAP, and
`push_check: 'gitleaks git --redact --log-opts="origin/main..HEAD"'` (gitleaks 8.30.1). The tester's pre-commit hook,
when armed, adds `ci.env` holding a generated fake `github-pat` token (`ghp_` plus 36 random characters, never a real
or published key) to the next commit, then disarms. Staged by the tester: PR #6 for ticket #2 (`No notes` without the
period), PR #7 for #3 (drops the `can_delete` call and its test), PR #8 for #4 (adds `orjson`, which SPEC Dependencies
rules out), each with a handoff comment. Leak check: every 8-character run of the token, searched in the ticket and PR
comments, the PR body, and the pushed commit messages.

Sessions: 5 of 6 for this change, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`,
effort `medium`), each reading the installed `SKILL.md` by hand, so harness loading is untested here. About 70k to 81k
subagent tokens per session. Codex and Kiro CLI: SKIP, no session in those harnesses. S3 and S4 are in the `wkc-code-review` report.

Direct checks: case 1 subchecks PASS (PyYAML: name, model invocation unchanged, five opening fields in order, one-line
description). `wc -l` is 307, over 250: the **Push check** paragraph (10 lines) carries the SPEC's push check contract
and the session-kind rule, which section 4 cannot shed. Case 50 PASS: the paragraph covers a build, a follow-up, and the
pre-merge update, names a person's session, a native subagent, `codex exec`, and `claude -p`, and forbids `--no-verify`
on any git command; section 7's pre-merge update says "Run the push check (section 4)".

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1, pilot, `e456b7b` | 47, ticket #1 | FAIL | The check failed (`github-pat`, `ci.env:1`) before any push; the session amended the commit and pushed only after a pass. The branch's only push (activity `branch_creation`, 20:52:51Z) is `41547b6`, which gitleaks passes. But it amended with `git commit --no-verify`, reading the rule as scoped to the push. Fixed in `8592d7e`: no `--no-verify` on any git command, and a hook that puts the finding back is the same finding again. |
| S1 | 48, ticket #1 | PASS | The report names `ci.env`, line 1, `github-pat`; no 8-character run of the token in ticket #1's comments, PR #9, or the pushed commit message. The handoff comment does not mention the finding. |
| S2, `8592d7e` | 47, ticket #10 | PASS | Check failed at 20:54:40Z (`github-pat`, `ci.env:1`); `git rm --cached ci.env` and `git commit --amend` with no `--no-verify` in any command; check passed at 20:55:00Z; the branch's only push, 20:55:07Z, is `c9be080`, and gitleaks on `origin/main..origin/feat/10-reject-empty-add` exits 0. Hook unchanged. #10 `in-review`, one handoff. |
| S2 | 48, ticket #10 | PASS | Report names file, line, and rule; no 8-character run of the token in #10's comments, PR #11, or the pushed commit message. |
| S5 | 49, ticket #5 | PASS | `push_check` removed from the fixture's `main`. PR #12 opened at `74ac45b`; the report says no push check is configured and suggests adding one. |

Not rerun on this change: cases 3 to 46. The push check adds a paragraph before the push and one clause to the
pre-merge update; it changes no other step.

## Dated report: 2026-10-28, run completion (#80)

Scope: finish on the run branch, gate classes and grants, failure classes, `verify`, same-run and outside-run
blockers, continuation membership and grant ownership, `--authorized` removed, and manual calls unchanged. Selected:
cases 51 to 61, and case 45's first turn. Candidate `d2ce5e1` for every `wkc-implement` result (`d2de36a` changed
only `wkc-backlog`), exported with `git archive` and installed with `skills` 1.7.4; the installed copies equal the
candidate by `diff -r`. Codex and Kiro CLI: SKIP, no session in those harnesses.

Fixture: private throwaway `wilsonkichoi/wkc-run-finish-fixture-80`, a `greet` CLI with `./test.sh` as
`test_command`, approved PRD, SPEC, and ROADMAP, and `push_check` set to gitleaks. Run branch `run/m1-20261028T1500`;
run config issues #15 (grants: staging, qa, sandbox expired 2026-10-27, preview for `./deploy-preview.sh --dry-run`
only; `Moved by the person:` names #12), #16 (`Continues: #15`, grants staging and qa only), and #38 (`Continues:
#16`). Gate scripts log each run to a directory outside the checkout; `./release-prod.sh` writes a marker file there.
Tickets #1 to #7 and #13 were staged by the tester with pull requests merged into the run branch, handoff comments,
and `Run: 15`; #7 also has a staged failed gate and a `follow-up` finish. #9 is `done` on `run/m0-20261027T0900`, whose
run PR #27 closed without merging. #8 (blocked by #7, `Run: 16`) and #10 (blocked by #9) are `ready`. #14 merged into
`main`. Tester PRs #28 and #30 moved the run branch head between turns.

Sessions: S1 to S5 of the change's 7 (6 standing plus 1 the maintainer approved for `wkc-backlog` case 42) ran these cases, one at a time, as Claude Code
`general-purpose` subagents on Sonnet (`sonnet`, effort `medium`), each reading the installed `SKILL.md` by hand, so
harness loading is untested here. Each turn used about 62k to 86k subagent tokens. S5 and S6 are also in the
`wkc-backlog` report.

Direct checks: case 1 subchecks PASS (frontmatter parses; `argument-hint` is `[<id> | finish <id> | verify <id>]
[--run <ref>]`; five opening fields in order; one-line description). `wc -l` is 295 for `SKILL.md`, down from 307,
and 126 for the new `run.md`. Case 61 PASS: no `--authorized` in either file; the gate and finish blocks equal the
SPEC's; `run.md` lists its six `##` sections. Case 34 PASS from `run.md`. The handoff block differs from the SPEC's
by the `Execution:` lines, which are #83's.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1, pilot | 51, #1 | PASS | Gate `Commit: 0daaf31… on run/m1-20261028T1500`, `pass`; finish `done`, `Merged: …/pull/17 into run/m1-20261028T1500 at 6493d63…`, `Verified at: run/m1-20261028T1500@0daaf31…`; `CLOSED`/`COMPLETED`; merged PRs into `main` still only #26. |
| S1, turns 2 and 3 | 56, #1 | PASS | At `0daaf31` verify posted nothing and reported the gate reused (comments 4 before and after). After PR #28, one gate comment at `f1842b3…`; still `COMPLETED`. |
| S2 | 52, #2 | PASS | With `--authorized ./deploy-preview.sh,./release-prod.sh`: test and staging `pass`, staging log gained one line; sandbox `not run, the sandbox grant expired`; preview `not run`, the grant names only `--dry-run`; production `not run, production-affecting`; no sandbox or preview log line, no marker; `waiting`; `in-progress`; no question. |
| S2, turns 2 and 4 | 53, #3 | PASS | First finish: two qa attempts logged, `not run, environment unavailable`, `waiting`, no `Parked (wkc-yolo):`. After the tester created the flag: only the qa gate ran (one more attempt), `done`, `COMPLETED`. |
| S2, turns 3 and 5 | 57, #6 | PASS | Under #15 with qa down: test `pass`, qa unavailable, preview `--dry-run` `pass` (one preview line). With qa up, `verify 6 --run 16` at the same head: one qa gate comment `pass`, test reused, no preview line, `in-progress`, no finish comment. |
| S3, turn 3 | 57 grant ownership | PASS | After PR #30 moved the head to `91e39a2`, `verify 6 --run 16` ran test and qa again; preview `not run, no grant for preview in run config 16`; the preview log still has one line. It posted a `not run` gate comment for preview as well, an accurate record that the case does not require. |
| S3 | 54, #4 | PASS | `./check-farewell.sh` failed twice at `f1842b3…` (`got 'Bye, Ann!'`); gate `fail`; finish `follow-up`; PR #29 `baseRefName` `run/m1-20261028T1500`, body line 2 the follow-up line; `in-review`, handoff naming PR #29. |
| S3, turn 2 | 55, #5 | PASS | Smoke log shows two runs at one sha; gate `pass, intermittent`; one `Discovered:` comment, `Blocks this ticket: no`, `Verified: yes`; `done`, `COMPLETED`; listed for `wkc-yolo`. |
| S4 | 58, #8 | PASS | `--run 16`, blocker #7 (`Run: 15`) with a failed gate: refused; #8 still `ready`, unassigned, 1 comment, no branch. After the tester merged follow-up PR #31 and posted a `waiting` finish with no failed gate: claimed, PR #32 `baseRefName` `run/m1-20261028T1500`, `in-review`. |
| S4, turns 3 and 4 | 59, #10 | PASS | Manual: refused, naming `run/m0-20261027T0900` and the closed run PR #27; #10 unchanged. After the tester merged run PR #33 into `main` and posted a `Run outcome (wkc-yolo): merged` comment, with no run config for that run: claimed, PR #34 based on `main`, `in-review`. |
| S5, turn 4 | 45 first turn, #13 | PASS | Manual finish: named the missing run PR and wrote nothing (2 comments, `in-review`, before and after). |
| S5, turn 5 | 60, #14 | PASS | Manual finish on `main`: gate `not run`, the step needs authorization; `waiting`; `in-progress`; ended on a numbered question; no production marker. |

Observed, outside this change: S1 and S3 (turn 2) reported "the ticket has no milestone" after a move to `done`,
though #1 and #5 are in `M1: Greetings`; S2 read it correctly for #3. The section 6 milestone step is unchanged
here, and M1 had open tickets, so no report was wrong in effect. It is recorded as a `Discovered:` item on #80.

Not rerun on this change: cases 35 to 37, 39 to 44, and 47 to 50. Their text moved from section 7 to `run.md`
unchanged, and every `--run` result above depends on rules only `run.md` holds, so each of those sessions read it.
Case 38 and case 46 are retired.

## Review round 1: 2026-10-28, PR #87

Reviewed `b1e57d8157be125a3ba8f9c6d8380b3884ea5c59` against #80 and SPEC Lifecycle, Unattended calls,
Review continuations, Grants, and ADR-008. Independent session. Selected direct checks: case 1's metadata,
opening-field and link subchecks, case 61, case 34, and static inspection of the affected contracts. Case 1's
250-line target is exceeded, not passed: `SKILL.md` is 297 lines (reviewed head: 295; base: 307). The two added
lines validate carried delivery records. `run.md` is 144 lines with its six sections listed; backlog is 302.

Verified findings in the reviewed head:

- `run.md:42`: literal equality of every `Run PR:` rejects the SPEC's initial `not opened` plus a later named PR.
  The original fixture's configs #15 and #16 both say `not opened` by a fresh read of their unedited bodies,
  so its continuation result does not exercise that transition. Resolve the placeholder by branch and default base.
- `run.md:44` and `SKILL.md:104`: a matching outcome comment alone substitutes for an unavailable predecessor,
  and the delivery fallback checks only `MERGED`. A false closure record on a never-closed PR could supply membership;
  a carrying PR merged into another integration branch could release an outside dependent. Require terminal host
  history, carried membership, and a carrying merge into the default branch. Reopened runs retain verified prior closure.
- `run.md:81`: an unexpired environment/command match permits a shared gate even with `run_config: tracker` on
  Linear or local, whose backend explicitly cannot detect edits. Reject grants from such stores, as Grants requires.
- `run.md:83,96`: the operation predicate omits count, cost, and duration, and the code-failure rerun is unconditional.
  One remaining operation followed by a code failure could execute a second unauthorized operation. Check limits
  and expiry on every attempt, record bounded use for resume, and report an unavailable rerun without claiming reproduction.

Improvements: local verify reads back run-PR evidence and consults it alongside ticket comments, as the Local
backend contract requires. Backlog case 42 now checks the moved step's actual destinations and related links.

Direct results: PASS for both skills' frontmatter and invocation YAML, opening fields, description constraints,
and relative file links; gate/finish and both Decision/Parked pairs equal the SPEC; case 61 PASS. Static contract
inspection confirms the corrections are present; it does not prove instruction following. Version stays 0.0.40,
one patch above the base, with the existing changelog entry and README updated. `git diff --check origin/main`
passes. Security review found no secret, added external package, unneeded network call, or sensitive output in the
change; gitleaks scans the complete PR history before push. The project has no `test_command`; GitHub has no checks.

Behavior for cases 62 to 66: SKIP in Codex and Claude Code because the change used all seven authorized AI test
sessions (six standing plus the one approved for case 42). Kiro: SKIP, no cross-harness launch authorization.
No behavior PASS is inferred from static checks or from the original implementation sessions after these instructions
changed. Backlog's unchanged source retains the separately cited S7 evidence. A fresh session must review the fix commit.

## Review round 2: 2026-10-28, PR #87

Reviewed `bc1b8fc66183382aa4f8a621d2a514bc3a8150d8`, the round-1 fix commit, in an independent session. Selected
direct checks: case 1's link and contents subchecks for `run.md`, case 61, and static inspection of the round-1
changes against SPEC Review continuations, Run config, Grants, Store, Unattended calls, and the Local backend.

Verified finding: `run.md:62` required a `command` store to "provide edit detection" before it carries grants.
Nothing a call reads can show that. SPEC Store says the command store controls edit detection, and `wkc-tracker`
says its `get` decides what counts as an edit. A model that takes the rule literally marks every shared gate under a
`command` store `not run`. Fixed: the store's `get` is the edit check. Case 64 now checks both stores; case 66 no
longer depends on the removed condition.

Behavior for cases 62 to 66: still SKIP in every harness. No AI session ran; the seven authorized sessions are used.
The round-1 commit changed the instructions behind cases 52, 53, 56, 57, 58, and 59, so their earlier PASS results
are not evidence for this head. Cases 62, 63, and 65 cover interpretation that direct checks cannot establish and
need behavioral runs before merge. Cases 64 and 66 restate explicit SPEC text and carry lower risk.
