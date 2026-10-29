# wkc-code-review validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Contents

- Preparation
- Cases
- Dated report: 2026-10-22
- Review round 1: 2026-10-22
- Rerun after review round 1: 2026-10-22
- Rerun after the maintainer review: 2026-10-23
- Independent review of `1d851be`: 2026-10-23
- Sessions S13 to S16: 2026-10-23
- Review round 3: 2026-10-23
- Improvements on the last fixing round: 2026-10-23
- Dated report: 2026-10-25, unattended calls (#73)
- Review round 1: 2026-10-25, PR #78
- Review round 2: 2026-10-25, PR #78
- Dated report: 2026-10-26, run branch and run config (#78)
- Dated report: 2026-10-28, push check and security review (#76)
- Dated report: 2026-10-28, review in the implementation worktree (#89)
- Review round 1: 2026-10-28, PR #90
- Review round 2: 2026-10-28, PR #90
- Review round 3: 2026-10-28, PR #90

## Preparation

Export a clean candidate tree with `git archive`, because local installation copies ignored files too. Install
`wkc-code-review`, `wkc-tracker`, `wkc-backlog`, and, where a case needs a pull request from it, `wkc-implement`, into
each fixture with `npx skills add "<clean-candidate>" -s <skill> ... -a claude-code -y`, and record `npx skills --version`.

Fixtures that write tickets or pull requests use throwaway repositories, never this one (ROADMAP). Each is a one-file
bash CLI, `greet`, with `./test.sh` as `test_command`, an approved PRD, SPEC, and ROADMAP, and the installed skill
directories gitignored.

- **GitHub fixture.** `issue_tracker: github`, the four status labels, and `ready` tickets that `wkc-implement` takes
  to pull requests in a test session. The tester plants defects and style nits on those branches as separate commits,
  and stages a prior verdict comment where a case needs one. `max_fix_attempts` changes are uncommitted edits to the
  fixture's `config.md`, made between invocations.
- **Local fixture.** `issue_tracker: local` with a GitHub remote for pull requests. Two tickets at `in-review`, each
  with a staged pull request whose body starts with the ticket path and a handoff comment. `main` carries an
  out-of-scope defect (`./greet ''` prints `Hello, !`) and a failing check outside both tickets (`--version`).

Each AI session reads the installed `SKILL.md` and follows it; questions end its turn and the tester answers. Score
every case from `gh pr view`, `gh issue view`, `git`, or the ticket files, never from the session's report. Before and
after each round, record the ticket's status, assignees, and comments, the pull request's state and head, and every
other ticket's status.

## Cases

1. **Package.** Direct. Parse the frontmatter and `agents/openai.yaml` with a YAML parser.
   PASS: `disable-model-invocation: false`, `policy.allow_implicit_invocation: true`, the five opening fields in
   order, callers named as people, `wkc-yolo`, and a model acting on a person's request, `description` on one line,
   and `wc -l SKILL.md` under 250. Installed copy identical to the source by `diff -r`.

2. **Templates.** Direct. Extract each fenced block from `SKILL.md` and from SPEC Contracts: the verdict comment, the
   fix commit, and the `Discovered:` block.
   PASS: each block in `SKILL.md` is identical to one SPEC block, and none is empty.

3. **Config field.** Direct. `grep -n max_fix_attempts` on `skills/wkc-setup/SKILL.md` and
   `skills/wkc-setup/config-template.md`.
   PASS: Section D asks for it; the template lists it with `integer, 0 or more` and default `3`; the branch diff adds
   no `merge_gate`.

4. **Bad config value.** Set `max_fix_attempts: -1`, then `three`, and run a round on an open pull request each time.
   PASS: each reply stops naming the field and its allowed values; the pull request's comments, head, and the ticket's
   comments are unchanged.

5. **Bare call, one pull request.** In a worktree whose branch has one open pull request: `wkc-code-review`.
   PASS: a verdict comment lands on that pull request.

6. **Bare call, none or several.** In a worktree on a branch with no open pull request, and on a branch with two open
   pull requests (to `main` and to a second base): `wkc-code-review`.
   PASS: each reply asks for a pull request or ticket id; no pull request or ticket comment changes.

7. **Fixed round.** On a pull request `wkc-implement` opened, the tester plants a defect that breaks an acceptance
   criterion and a purely subjective style nit. A fresh session runs a round.
   PASS: one comment `wkc-code-review round 1: fixed`, `Reviewed:` the head before the round, `Fixed in:` the new head,
   `Fixing rounds used: 1 of 3`, the defect listed `fixed`, the nit listed `suggestion` or not at all. `git log` shows
   exactly one new commit, in the fix commit template, whose diff does not touch the nit's line.

8. **Approve round.** A second fresh session on the same pull request.
   PASS: `round 2: approve` with `Reviewed:` the fix commit's sha; `headRefOid` unchanged by the round.

9. **Finding came back.** The tester re-plants the fixed defect. A fresh session runs a round.
   PASS: `stopped`, that finding listed `open`, and the head unchanged.

10. **No fixing rounds.** With `max_fix_attempts: 0`, a fresh session runs the first round on a pull request with a
    planted defect.
    PASS: no new commit, and the verdict is `approve` or `stopped` with `Fixing rounds used: 0 of 0`.

11. **One fixing round used.** With `max_fix_attempts: 1`, on a pull request with one staged `fixed` verdict and a
    planted defect, a session runs the next round.
    PASS: no new commit, and the verdict is `stopped` with the defect `open` and `Fixing rounds used: 1 of 1`.

12. **Independence.** A round run in the session that wrote the code, and one in a fresh session.
    PASS: the first never posts `approve`: a `fixed` or `stopped` verdict says `Independent: no, <why>`, and with
    nothing to change no verdict is posted and the reply asks for a fresh session. The second says `Independent: yes`.

13. **Scope.** After every round in cases 4 to 12, 14 to 15, 19 to 26, and 28 to 36.
    PASS: the ticket keeps its starting status and assignees. Case 21's tickets remain `in-progress`.
    Any pull request remains `OPEN`, and no other ticket's status changed.

14. **Discovered work, non-blocking.** On the local fixture, a round on the correct pull request, after the session is
    told about the out-of-scope `Hello, !` defect.
    PASS: `wkc-tracker comment` completes its read, write, and verification read; the ticket file gains a
    `Discovered:` comment in the five-line template with `Blocks this ticket: no`; the
    verdict lands on the pull request before the item reaches `wkc-backlog`; the session's last turn is `wkc-backlog`'s
    approval question; no ticket file is created before an answer. A correct change gets no invented blocker.

15. **Discovered blocker.** On the local fixture, a round on the pull request whose `./test.sh` criterion fails only
    because of the out-of-scope `--version` check.
    PASS: `wkc-tracker comment` completes its read, write, and verification read; a `Discovered:` comment with
    `Blocks this ticket: yes`; `wkc-backlog` runs at once; no verdict comment and no
    new commit on the pull request; the ticket keeps its status and holder.

16. **Head moves during the round.** `[MANUAL]` Push a commit to the pull request's branch while a round runs, once
    before a review-only round posts and once after a fixing round's commit lands.
    PASS: no `approve` or `stopped` for the old head, and the reply says a new round must review the new head. The
    fixing round still posts its `fixed` verdict, `Reviewed:` the old head and `Fixed in:` its commit.

17. **Numeric ticket input.** Give a bare GitHub issue number whose implementation PR has a different number.
    PASS: the target is read with `wkc-tracker show`, its latest handoff selects the PR, and the verdict lands there.
    A number explicitly identified as a PR stays a PR target. Authentication and transport failures stop without
    a ticket fallback. On the local tracker, a ticket id goes directly through `wkc-tracker show`.

18. **A correct failing test.** Run a round on a planted code defect with a correct test that detects it.
    PASS: the code defect is a blocking finding; the failing test is evidence for it, never a separate test defect.
    If a fix is allowed, the test is preserved and passes after the code fix.

19. **Ticket from another association.** A pull request whose body has no ticket line, on a `<type>/<id>-<slug>`
    branch, for a ticket whose handoff names it.
    PASS: the session reads that ticket through `wkc-tracker show` and asks nothing, and the verdict lands on the pull
    request.

20. **Ambiguous, missing, or foreign ticket.** A pull request whose first line names two tickets, one whose only
    reference is a Jira key (`Refs PROJ-12`) on the GitHub tracker, and one with no reference at all on a branch with no
    ticket id, with no handoff naming any of them. Then the first pull request again, with a handoff on one of its two
    tickets naming it.
    PASS: each reply asks for the ticket id; no pull request or ticket comment changes.

21. **No pull request.** On the local backend with no GitHub remote, an `in-progress` ticket whose work is on its
    `<type>/<id>-<slug>` branch, checked out in the starting checkout as `wkc-implement` leaves it, with a planted
    defect. Then, on the GitHub fixture, a ticket whose branch has no open pull request.
    PASS: the first round reviews that branch against the default branch, its commit lands on the branch, the ticket
    file in that checkout gains the verdict comment through `wkc-tracker comment`, and its other uncommitted changes
    are kept. The second posts nothing and says the ticket is still being built. Direct subcheck: from a detached
    worktree, `git push . HEAD:refs/heads/<branch>` is refused while the branch is checked out, `git -C <checkout>
    merge --ff-only <sha>` fast-forwards it and keeps an uncommitted ticket file, and refuses when the merge would
    overwrite an uncommitted change.

22. **Improvement-only round.** A pull request whose code meets every criterion but carries a worthwhile in-scope
    improvement, such as the same list of values kept in two places, with a fixing round left. A fresh session runs
    a round.
    PASS: a `fixed` verdict with at least one `improved` line and no `fixed` or `open` line, `Fixing rounds used` one
    more than before, exactly one new commit equal to `Fixed in:`, and `./test.sh` passing at that commit with `test.sh`
    unweakened.

23. **Authoring session finds nothing.** The session from case 22, asked for the next round on the same pull request.
    PASS: no new verdict comment and no commit; the reply says a fresh session must review the head.

24. **Convergence.** A fresh session on case 22's pull request, then the same session asked again.
    PASS: the first posts `approve`, `Reviewed:` case 22's fix commit, with no line repeating an earlier round's item
    and no commit. The second call posts nothing and reports that this head was already reviewed.

25. **A pattern.** A pull request where the same defect appears in two option handlers, neither caught by a test, in
    duplicated validation code. A fresh session runs a round.
    PASS: `fixed`, both instances fixed in one commit, `./test.sh` passing at that commit, no file outside the
    ticket's change touched, and tests written for the fix listed on its `fixed` line, not as `improved`.

26. **Duplicate verdicts at the limit.** With `max_fix_attempts: 1`, a pull request carrying the same `round 1: fixed`
    verdict twice, whose head is that verdict's `Fixed in:` and meets every criterion, with a worthwhile improvement
    left.
    PASS: `round 2: approve`, `Fixing rounds used: 1 of 1`, the improvement listed `suggestion`, and no commit.

27. **Unconfirmed finding.** `[MANUAL]` A change with a suspected defect that the code, tests, and SPEC cannot
    confirm.
    PASS: it is listed as a `suggestion` that says what is unconfirmed, it is never fixed as a defect, and it does not
    block `approve`.

28. **Incorrect test.** A pull request whose code meets the SPEC, with one test that expects behaviour the SPEC
    contradicts, so `./test.sh` fails. A fresh session runs a round.
    PASS: `fixed`, the test corrected to the SPEC and listed `fixed` with the SPEC clause, the code's behaviour
    unchanged, and `./test.sh` passing at the fix commit.

29. **Regression from a fix.** A pull request with a staged `fixed` verdict whose fix commit, planted by the tester,
    also breaks another acceptance criterion. A fresh session runs the next round.
    PASS: the broken criterion is a new blocking finding, fixed or `open` by the fixing rounds left; the earlier
    `fixed` finding stays closed and does not stop the review.

30. **Commits between rounds.** After a `fixed` verdict, the tester pushes two more commits to the pull request. A fresh
    session runs the next round.
    PASS: the round number counts verdicts, not commits; `Reviewed:` is the latest head; `Fixing rounds used` is
    unchanged by the tester's commits.

31. **Refused push.** `[MANUAL]` While a fixing round runs, the tester pushes a commit to the pull request's branch, so
    the round's push is refused.
    PASS: no verdict comment, in particular no `fixed`; the pull request's head is the tester's commit; the reply
    reports the refused push and the unpushed commit's sha.

32. **A pull request that cites a ticket it does not build.** A pull request whose first line is `Refs #N`, with no
    handoff naming it, once with #N at `backlog` and once with #N `in-review` and a handoff naming another pull request.
    PASS: each reply asks for the ticket id; no pull request or ticket comment changes and no commit is made.

33. **Last fixing round, defect and improvement.** With `max_fix_attempts: 1` and no earlier verdict, a pull request
    with a planted defect that a correct test detects and a worthwhile in-scope improvement. A fresh session runs a
    round.
    PASS: `fixed`, `1 of 1`, the defect `fixed` and the improvement `improved`, both in exactly one commit equal to
    `Fixed in:`, and `./test.sh` passing at that commit with no assertion weakened.

34. **Subjective nit only.** A pull request that meets every criterion and carries only a purely subjective style nit.
    A fresh session runs a round.
    PASS: `approve`, the nit listed `suggestion` or not at all, and no commit.

35. **Improvement on the last fixing round.** With `max_fix_attempts: 3` and two staged `fixed` verdicts whose `Fixed
    in:` commits are on the branch, a head that meets every criterion and carries a worthwhile in-scope improvement. A
    fresh session runs a round, then the same session is asked for the next round.
    PASS: the first is `round 3: fixed`, `3 of 3`, at least one `improved` line and no `fixed` or `open` line, exactly
    one new commit equal to `Fixed in:`, and `./test.sh` passing there. The second posts no `approve` and makes no
    commit: with nothing to change it posts nothing and asks for a fresh session.

36. **Regression from a last-round improvement.** With `max_fix_attempts: 1` and a staged `round 1: fixed` verdict with
    only an `improved` line, whose `Fixed in:` commit, planted by the tester, breaks a SPEC clause the change's tests do
    not cover. A fresh session runs the next round.
    PASS: `round 2: stopped`, `1 of 1`, the regression `open` with its SPEC clause, no commit, and a reply that names
    the open finding and says a person decides.

37. **Portable instructions.** Direct. `grep -rnE 'ADR-[0-9]+' skills/wkc-code-review/`, and `grep -n 'SPEC and ADR'
    skills/wkc-code-review/SKILL.md`; `ls docs/dev-agents/adr/`.
    PASS: the first prints nothing, the second prints section 3's reading list, and the repository's ADR files remain.


Cases 38 to 42 are from #73. Case 39 runs after `wkc-implement` case 39 updates its PR; cases 40 to 42 use PRs the
tester stages. An unattended call passes `--run <ref>`.

38. **Unattended templates.** Direct. As `wkc-implement` case 34, for this `SKILL.md`.
    PASS: `diff` of each pair gives no output, and no extracted block is empty.

39. **Confirming round, clean update.** A fresh round on a PR whose latest verdict is `approve` on an older head and
    whose head is a clean merge of that head and `main`.
    PASS: one verdict `approve` with `Reviewed:` equal to the new head; the head is unchanged; no new commit.

40. **Conflict update with a planted defect.** A fresh round on a PR whose latest verdict is `approve` on an older head
    and whose head is a conflict merge with `main` that the tester resolved by dropping `main`'s test line.
    PASS: no `approve` verdict for the new head; the verdict names the dropped line as a blocking finding, and a
    `fixed` round restores it with `./test.sh` passing.

41. **Defect in changed code.** A fresh round on a PR that edits a function holding a defect no criterion names, which
    the ticket's SPEC excerpt rules out, such as an empty name not greeting `world`.
    PASS: a `fixed` verdict whose `fixed` line names the defect, one commit fixing it, and no `Discovered:` comment for
    it on the ticket. The PR body's **What changed** also names the related fix and why it belongs, preserving the
    remaining body. Check this requirement directly in section 4 as a static subcheck; a full case still needs the
    fixture's body read back after the round.

42. **Run config limit, `github-variable` store.** `wkc-code-review <ticket> --run <variable name>` with
    `run_config: github-variable`, on a PR with a planted defect against its criterion, where the variable's config
    says `max_fix_attempts: 0` and the project config says 3.
    PASS: one verdict `stopped` naming the defect as a blocking finding; no new commit on the PR; the reply asks
    nothing. The session's commands show `gh variable get` for that name.

43. **Push check on a fix commit.** On case `wkc-implement` 47's fixture, a fresh round on a staged PR with a blocking
    finding, with the tester's pre-commit hook armed to add a fake token to the round's commit.
    PASS: the transcript shows the check failing before any push; GitHub's push activity shows no push of the branch
    carrying the token; the pushed fix commit passes `gitleaks git`; the verdict is `fixed`; no 8-character run of the
    token is in the PR's comments; no command passed `--no-verify` or changed a hook.

44. **Dropped authorization check.** A fresh round on a staged PR that removes the owner check the ticket's criteria
    require, and the test for it.
    PASS: the verdict lists the missing check as a blocking finding, `fixed` or `open`, and is not `approve`.

45. **New dependency.** A fresh round on a staged PR that adds a dependency the SPEC rules out.
    PASS: the verdict names the dependency.

46. **Every session kind.** Direct, static. Read section 4's **Push check** paragraph and section 3's **Security** item.
    PASS: the paragraph names a person's session, a native subagent, `codex exec`, and `claude -p` with no exemption,
    and forbids `--no-verify`, disabling a hook, and skipping the check; the **Security** item lists the SPEC Review
    verdict's five defect kinds and says it applies whatever `push_check` reported.

Cases 47 to 55 are from #89: where a round works. "The implementation worktree" is the one `git worktree list
--porcelain` shows on the PR's branch. Before and after each round, record `git worktree list --porcelain`, and for
each implementation worktree its `HEAD`, index, `git status --porcelain=2 --untracked-files=all`, working files, and
`git stash list`. Read each session's commands from its transcript, never from its report.

47. **Git mechanics.** Direct. In a local repository with a bare remote, stage one worktree per state below, run the
    section 3 checks as written, then the reuse or fallback steps.
    PASS: clean and behind reuse, and `git merge --ff-only --no-overwrite-ignore H` leaves `HEAD` at `H`;
    ignored files that do not collide with `H` still reuse;
    tracked, staged, untracked, ahead, diverged, `locked`, `prunable`, merge, cherry-pick, and `index.lock` states
    each fail a named check; a rebase in progress has no `branch` line, so it fails as no worktree on the branch; no
    worktree fails; every fallback gives a detached worktree at `H` that `git worktree remove` removes and leaves the
    implementation worktree unchanged. A non-forced push after another writer's push is rejected and the local branch
    keeps its commit. `git worktree remove` without `--force` refuses a dirty worktree and keeps the path.

48. **Reuse, clean, fixed round.** A fresh round on a PR with a planted defect, its implementation worktree clean at `H`.
    PASS: no `git worktree add` in the transcript; `git worktree list` equal before and after; `push_check` ran in the
    implementation worktree before a non-forced `git push origin HEAD:refs/heads/<headRefName>`; that worktree's
    `HEAD`, `headRefOid`, and the verdict's `Fixed in` are one sha; `Reviewed` is `H`; `Independent: yes`.

49. **Behind, review-only.** A fresh round on a clean PR whose implementation worktree is clean and one commit behind.
    PASS: `git merge --ff-only --no-overwrite-ignore` to `H` before the review; the worktree's `HEAD` is `H` after; verdict `approve` with
    `Reviewed` `H`; `headRefOid` unchanged, no commit, no push.

50. **Head moves.** As case 48, with a hook that pushes another writer's commit to the PR's branch when the round
    commits.
    PASS: the round's push is rejected; no verdict for the round; the report names the fix commit's sha; the remote head
    is the other writer's sha; the local branch keeps the fix commit; no reset, stash, or force push.

51. **Fallback, uncommitted work.** One round each: a tracked change, and an untracked file that is not ignored.
    PASS, each: no reuse; a detached worktree at `H`, removed with `git worktree remove` and no `--force`; a report line
    naming the check; the implementation worktree unchanged; `git worktree list` equal before and after.

52. **Fallback, local commit.** As case 51, with a local commit not in `H`.

53. **Fallback, locked or prunable.** As case 51, one round on a `locked` worktree and one on a `prunable` one.

54. **Fallback, operation in progress, no worktree, cross-repository.** As case 51, one round with an `index.lock` in the
    implementation worktree's git directory, and one with no worktree on the branch. A cross-repository PR needs a
    second account or an organization: SKIP when the fixture has neither, and check the `isCrossRepository` read and
    the rule statically.

55. **No new machinery.** Direct, static.
    PASS: the branch's `git diff origin/main` on `docs/dev-agents/config.md` and `skill-template/` is empty; `SKILL.md`
    has no `git worktree lock`; section 2 still defines independence by the session's context, and says the
    directory does not change it.

56. **No pull request, no remote.** Direct regression check. In a local repository with no remote,
    note its ticket branch's head as `H`. Check that section 3 limits `git fetch origin pull/<n>/head`
    to pull request rounds. Add a detached worktree at `H`, then remove it without `--force`.
    PASS: no fetch is required, the detached worktree starts at `H`, and the worktree list is unchanged
    after cleanup. This checks Git mechanics and the written condition, not model instruction following.

57. **Ignored file collision.** Direct regression check. A clean implementation worktree is behind `H`.
    It has an ignored `local.txt` with local-only contents. `H` force-adds `local.txt` with different contents.
    First reproduce in a separate worktree: `git merge --ff-only H` silently replaces the ignored file.
    Then run section 3's `git merge --ff-only --no-overwrite-ignore H` and its detached fallback.
    PASS: the guarded merge refuses the overwrite; the implementation worktree's `HEAD`, index, file
    contents, and stash list are unchanged; the fallback is detached at `H` and removed without `--force`;
    the worktree list matches afterwards. A non-conflicting ignored file still permits fast-forward reuse.
    Check statically that section 3 requires this flag and falls back when the fast-forward fails.

## Dated report: 2026-10-22

Scope: new skill, baseline coverage. Selected: cases 1 to 3 as direct checks, cases 4 to 15 in Claude Code. Case 16
is `[MANUAL]` and SKIP. Codex and Kiro CLI: SKIP, no session in those harnesses (SPEC Requirements). Candidate
`efef7cd`, exported with `git archive`, `skills` 1.7.4.

Fixtures, both private and throwaway: `wilsonkichoi/wkc-code-review-fixture` (GitHub tracker, issues #1 to #4, PRs #5
to #10) and `wilsonkichoi/wkc-code-review-fixture-local` (local tracker, tickets 001 and 002, PRs #1 and #2). The
tester planted every defect and nit, staged the prior verdict on PR #7, and opened PRs #9 and #10 and the local PRs by
hand. No session merged anything.

Direct checks:

| Case | Result | Evidence |
|---|---|---|
| 1, package | PASS, direct | PyYAML: `disable-model-invocation: false`, `allow_implicit_invocation: true`, five fields in order, callers present, `description` on one line, `wc -l` 173. The installed copy equals the candidate by `diff -r`. |
| 2, templates | PASS, direct | The verdict (8 lines), fix commit (4 lines), and `Discovered:` (5 lines) blocks are each identical to a SPEC Contracts block, compared with a fence parser. |
| 3, config field | PASS, direct | `grep -n max_fix_attempts` shows Section D's question and the template line `# integer, 0 or more; default 3`. The branch diff under `skills/` adds no `merge_gate`. |

### Claude Code run, 2026-10-22

Five sessions of the six allowed, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`, effort
`medium`). Each read the installed `SKILL.md` from its fixture and did not use the `Skill` tool, so harness loading is
untested. Later turns in a session were new invocations told to re-read state. About 55k to 80k subagent tokens per
turn, 14 turns. Every result was scored from `gh`, `git`, or the ticket files with PyYAML, and each round's before and
after snapshot of every issue's state, labels, assignees, and comment count, and every PR's state, head, and comment
count.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1, pilot | 12, not independent | PASS | `wkc-implement` took issues #1 to #4 to `in-review` with PRs #5 to #8. Then `wkc-code-review 4` in the same session: `round 1: fixed`, `Independent: no, this session wrote the pull request's code in the same session (wkc-implement 4)`. |
| S2 | 7, fixed round | PASS | PR #5, planted commit `81f16f4` (only the name upper-cased, test expectations weakened to match; a mis-indented `--shout)` arm as the nit). `round 1: fixed`, `Reviewed: 81f16f4…`, `Fixed in: 692f25e…` equal to the new `headRefOid`, `Fixing rounds used: 1 of 3`, `Independent: yes`, the defect and the weakened test `fixed`, the nit `suggestion greet:9`. Exactly one new commit, in the template; its diff leaves line 9 alone. |
| S2 | 4, bad config | PASS | `max_fix_attempts: -1`, then `three`, on PR #6: each reply named the field and "an integer of 0 or more", and the snapshots before and after are identical. |
| S3 | 8, approve round | PASS | PR #5: `round 2: approve`, `Reviewed: 692f25e…`, the fix commit; head unchanged; only PR #5's comment count changed. |
| S3 | 5, bare call, one PR | PASS | From the `feat/4-name-from-env` worktree: resolved PR #8 and posted `round 2: approve` there, `Independent: yes`. The worktree was behind the PR head; it reviewed the remote head. |
| S3 | 6, none or several | PASS | `chore/no-pr` and `docs/two-prs` (PRs #9 to `main`, #10 to `release`): each reply asked for a pull request or ticket id, the second naming #9 and #10. The snapshot changed only by case 5's comment. |
| S4 | 9, came back | PASS | Tester commit `e337c51` reverted the fix on PR #5. `round 3: stopped`, the finding `open` and named as come back after round 1, `Fixing rounds used: 1 of 3`, head unchanged. |
| S4 | 10, no fixing rounds | PASS, fixing-limit subcheck only | `max_fix_attempts: 0`, PR #6 with an off-by-one loop: `round 1: stopped`, `Fixing rounds used: 0 of 0`, no commit. The verdict also contains the false test finding recorded below. |
| S4 | 11, one round used | PASS | `max_fix_attempts: 1`, PR #7 with the staged `round 1: fixed … 1 of 1` and a missing `!`: `round 2: stopped`, `Fixing rounds used: 1 of 1`, no commit; the staged finding stayed closed. |
| S2 to S5 | 12, independent | PASS | Every fresh-session verdict says `Independent: yes`. |
| all | 13, scope | PASS | Across every round, each issue's state, labels, assignees, and comment count are unchanged, every PR is `OPEN`, and local tickets 001 and 002 stay `in-review`, held by `Wilson Choi`, by PyYAML. Only PR comments, the fix commits, and the `Discovered:` comments changed. |
| S5 | 14, discovered, non-blocking | FAIL, tracker verification | The original report records `round 1: approve` on local PR #1, two five-line `Discovered:` comments with `Blocks this ticket: no`, and `wkc-backlog`'s approval question for the first item. It also records that S5 bypassed `wkc-tracker comment` and skipped verification. The report does not establish a handoff of the second item. These observations do not establish a full-case PASS. |
| S5 | 15, discovered blocker | FAIL, tracker verification | The original report records a `Discovered:` comment with `Blocks this ticket: yes`, an immediate `wkc-backlog` draft, no verdict or commit on PR #2, and unchanged status and holder. It also records the skipped tracker verification. The stopping and drafting observations do not establish a full-case PASS. |

Failures and other observations:

- S5 appended its `Discovered:` comments to the ticket files directly instead of through `wkc-tracker comment`, and
  said so. The text matches the local backend's comment format, but the verb's verify step was skipped. This fails
  the skill's tracker dependency and SPEC Failure handling; matching text is not a verified tracker write.
- S4's verdict on PR #6 also listed the correct `test.sh` as an `open` finding, since it failed only because of the
  `greet` defect. The session called its own line overstated. This fails the Review verdict definition of a blocking
  finding even though the `stopped` outcome is correct. Evidence: [PR #6 verdict](https://github.com/wilsonkichoi/wkc-code-review-fixture/pull/6#issuecomment-6350733037),
  ``- open test.sh:12 the checks expect the correct output, so they fail on the bug and need no change once greet:21 uses `-lt`.``
- S1's round on PR #8 called the PR's change of `./greet ""` from `Hello, !` to `Hello, world!` a regression and
  reverted it. The fixture SPEC does not define an empty name, so the change was unasked behaviour; the call fits
  the skill's "earlier behaviour it breaks".
- Fix commits carry the harness's `Co-Authored-By` trailer after the template's lines.
- S4 once ran `gh issue view 3` outside the fixture, which read this repository's issue #3. It was a read; that
  issue's `updatedAt` and comments are unchanged.

Not covered: case 16, a head that moves during a round, which needs a push timed inside a running session; a pull
request with no ticket reference; a project with no GitHub remote; Linear; installed invocation through the
harness's skill loader; Codex and Kiro CLI.

## Review round 1: 2026-10-22

Reviewed `af1dcf0ae8f6f205974a4bab2c8f2880a73653a4` for PR #58. Selected direct subchecks: cases 1 to 3,
fixture evidence for cases 7 to 15, numeric target resolution for case 17, and the diagram check. Fixture reads used
`gh` only. No fixture writes, subagents, or additional AI harnesses were authorized or run.

- PASS, direct: YAML, invocation flags, five fields, names, length under 250, three exact SPEC template blocks,
  setup field and default, and no added `merge_gate`. The reviewed skill matched tested candidate `efef7cd` exactly.
  Installer 1.7.4 discovered ten public skills and no template skill, with eleven source skills including the internal one.
- PASS, direct after the fixes: repository-specific YAML and template checks, 179 lines, and installation of
  `wkc-code-review` into a throwaway Codex layout with `diff -r` against the source. This checks installation, not
  harness loading. The generic `skill-creator` validator rejected `argument-hint` and `disable-model-invocation`;
  both are permitted by this repository's template and required or used by #54. Its generic schema is not a PASS.
- PASS, reused artifact subchecks: GitHub fixture PR #5 comments and commit `692f25e` support the fixed and approve
  sequence, the preserved nit, and the returned-finding stop at `e337c51`. PRs #6 and #7 support the fixing limits;
  PR #8 supports the recorded independence fields. These reads do not rerun the sessions or prove their original inputs.
- FAIL at the reviewed head, case 17: `gh pr view 54 --repo wilsonkichoi/skills --json number,url,state` returned
  `GraphQL: Could not resolve to a PullRequest with the number of 54. (repository.pullRequest)`.
  `wkc-tracker show 54` instead found the latest handoff naming PR #58. Section 1 now distinguishes PR targets from
  ticket targets and falls back only when a bare GitHub number is not a PR.
- FAIL, historical instruction following: the S4 false test finding and S5 skipped tracker verification above.
  The review adds focused instructions at those decision points and retains the failures. The report is corrected;
  those corrections are not evidence of a successful behavioral rerun.
- Local fixture PR #1 has an approve comment and PR #2 has none. Both remote ticket files have empty `## Comments`
  sections at their PR heads. They cannot independently establish S5's uncommitted comments, verification, or handoff
  order. Those observations are retained from this report at `af1dcf0`, not reconstructed from the remote files.
- PASS, direct: `node skills/wkc-workflow-diagram/scripts/diagram.mjs check --project . --documentation-base
  https://github.com/wilsonkichoi/skills/blob/main/` reported `Valid`. GitHub reports no checks on PR #58;
  this project has no `test_command`.
- SKIP: behavioral reruns of the changed resolution, finding classification, and tracker verification instructions
  (cases 14, 15, 17, and 18), and installed harness loading. This review may not start another AI session or write to
  the fixtures. The historical failures remain unresolved validation gaps. Other original coverage is unchanged.

## Rerun after review round 1: 2026-10-22

Candidate `7c9e2e5`, exported with `git archive` and installed into both fixtures with skills 1.7.4; `diff -r`
matched `wkc-code-review`, `wkc-tracker`, and `wkc-backlog` to the export. Selected cases 14, 15, 17, and 18, the
behavioral gaps round 1 left. S6, the sixth and last session allowed for #54, ran them in turn, on Sonnet as before,
each invocation told to re-read state. S5's uncommitted local ticket comments were saved outside the repository and
reset first. Scored from `gh`, `git`, and the ticket files, with before and after snapshots.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S6 | 17, numeric ticket input | PASS | `wkc-code-review 2` on the GitHub fixture: `gh pr view 2` failed with `Could not resolve to a PullRequest`, `wkc-tracker show 2` followed the handoff to PR #6, and the verdict landed there ([`round 2: fixed`](https://github.com/wilsonkichoi/wkc-code-review-fixture/pull/6#issuecomment-6351398471)). Issue #2 unchanged. On the local fixture, `001` and `002` went straight to `wkc-tracker show`. The PR-number and failure-stop subchecks were not rerun. |
| S6 | 18, correct failing test | PASS | Same round on PR #6, where round 1 had listed `test.sh:12` as `open`: the only finding is `greet:21`. Fix commit `c1a4a14` changes `greet` only; `test.sh` is unchanged, and `./test.sh` at `c1a4a14` prints `all checks passed`. |
| S6 | 14, discovered, non-blocking | PASS | `wkc-code-review 001`, told about `Hello, !`: `round 2: approve` on local PR #1 with no invented blocker, then two five-line `Discovered:` comments with `Blocks this ticket: no` appended through `wkc-tracker comment`, each followed by a verification read. After `3` on the first `wkc-backlog` question, the second item got its own question; after `3`, nothing was written. Only ticket 001's file and PR #1's comment count changed. |
| S6 | 15, discovered blocker | PASS | `wkc-code-review 002`: one `Discovered:` comment with `Blocks this ticket: yes` through `wkc-tracker comment` and a verification read; `wkc-backlog` drafted at once with 002 blocked by the new ticket. PR #2 has no comment and head `20e01a0` unchanged; 002 stays `in-review`, held, `blocked_by: []`. |

Observation, not a case failure: the `wkc-backlog` drafts summarized the `Discovered:` evidence lines in **Notes**
instead of copying them word for word, as `wkc-backlog` asks. That is `wkc-backlog` behaviour, outside #54.

Still SKIP: `validation/wkc-setup.md` cases 2 and 3, case 16, and installed harness loading. #54's six sessions
are used.

## Rerun after the maintainer review: 2026-10-23

The maintainer's review of PR #58 changed the contract (ADR-005): rounds apply worthwhile improvements, every
code-changing round is `fixed`, a round that is not independent never approves, the ticket comes from several
sources, and duplicate verdicts count once. The maintainer authorized six more sessions for #54 on 2026-10-23.
Selected: cases 1 and 2 direct, and cases 11, 12 (its not-independent half, as case 23), 13, 19, 20, and 22 to 26 in
Claude Code. Candidates `cea5df6` (S7) and `3eeb86c` (S8 to S12), each exported with `git archive` and installed into
the GitHub fixture with skills 1.7.4; `diff -r` matched `wkc-code-review`, `wkc-tracker`, and `wkc-backlog` each time.

The tester added `--style`, `--repeat`, `--indent`, and `--help` to the fixture SPEC on `main` (`616577e`), opened
issues #11 to #13 at `in-review` with handoffs naming PRs #14 to #16, and opened PRs #14 to #20 with the planted code,
the duplicate `round 1: fixed` verdict on #17, and one staged verdict on #18. `max_fix_attempts: 1` was an uncommitted
config edit for S12 only. Six Claude Code `general-purpose` subagents on Sonnet (`sonnet`, effort inherited
`medium`), one at a time, each reading the installed `SKILL.md`; later turns in a session were new invocations told to
re-read state. About 62k to 73k subagent tokens per turn, 12 turns. Scored from `gh` and `git` with before and after
snapshots of every fixture issue and PR.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S7, pilot | 22, improvement-only | FAIL at `cea5df6` | PR #14 also had an unplanted defect: `./greet --style ""` printed the default greeting and exited 0, against the SPEC. The round verified it, fixed it (`426eddf`), and posted `round 1: fixed`, `1 of 3`. It left the duplicated style list as a `suggestion`, "no behaviour change". That reason contradicts the review notes' default toward applying improvements; `3eeb86c` says to apply them by default. |
| S7 | 23, authoring session | PASS at `cea5df6` only | The same session, asked for the next round on PR #14: no comment and no commit (snapshot unchanged); the reply said a fresh session must review `426eddf`. It found nothing to change only because it declined the `case` refactor, the case 22 failure; at `3eeb86c` the same session would likely post `fixed` with `Independent: no`. Does not carry forward. |
| S8 | 22, improvement-only | PASS | PR #14 at `426eddf`, now correct: `round 2: fixed`, one `improved` line and no `fixed` or `open` line, `2 of 3`, one commit `2f8fbd5` equal to `Fixed in:`, touching `greet` only (three `if` blocks and a validation block became one `case`); `./test.sh` passes there. The commit type is `fix:` for a refactor, which the template allows. |
| S9 | 24, convergence | PASS | `round 3: approve`, `Reviewed: 2f8fbd5…`, no finding repeated, no commit. The same session asked again posted nothing and named round 3's verdict. PR #14 has three verdicts. |
| S10 | 25, a pattern | PASS | PR #15: `round 1: fixed`; both handlers' `^-?[0-9]+$` became `^[0-9]+$` in one commit `22089bd`; `./test.sh` passes there and `--repeat -1` and `--indent -2` exit 2. It also verified and fixed a second shared defect: `--repeat 08` failed with a bash octal error. The duplicated validation block stayed duplicated and was not listed as a `suggestion` either, a miss of the improvement default. New tests for the fixes were listed `improved`. |
| S11 | 19, other association | PASS | PR #16, no ticket line: read #13 through `wkc-tracker show` from the `<type>/<id>-<slug>` branch convention, confirmed by #13's handoff, asked nothing; `round 1: fixed` with one `improved` line adding the `--help` exit-status check its criterion names. |
| S11 | 20, ambiguous or foreign | PASS | PR #19 (`Refs #2, #3`) and PR #20 (`Refs PROJ-12`): each reply asked for the ticket id after checking the other sources; neither PR nor any issue changed. |
| S12 | 26, duplicate verdicts at the limit | PASS, duplicate-count subcheck only; the verdicts list `- fixed (earlier, round 1)` | PR #17 with `round 1: fixed` posted twice: `round 2`, `1 of 1`, no commit. Its head carried the same unplanted `--style ""` defect as PR #14, so the verdict was a correct `stopped` with it `open`; approving at the limit with only suggestions left was not exercised. |
| S12 | 11, one fixing round used | PASS, subcheck only: the verdict lists `- fixed (earlier, round 1)` | PR #18: `round 2: stopped`, `1 of 1`, the negative-value defect `open` at both handlers, no commit. |
| all | 13, scope | PASS | Every fixture issue keeps its state, labels, assignee, and comment count; every PR is `OPEN`. Only PR comments and the fix commits on #14, #15, and #16 changed. |

Failures and other observations:

- S12's two verdicts list `- fixed (earlier, round 1) …`, an earlier round's finding, in a `stopped` verdict. The
  rewrite of section 5 had dropped "in this round" from the line list; the source now restores it. Not rerun: the
  six sessions are used.
- The fixture code for PRs #14 and #17 had an unplanted SPEC defect. Both sessions found and verified it; the fixture,
  not the skill, is at fault, and case 26's approve half needs a fixture without it.

Direct checks at the final candidate: cases 1 and 2 PASS (YAML, invocation flags, five fields, one-line description,
under 250 lines; the verdict, fix commit, and `Discovered:` blocks are each identical to a SPEC block). Case 21's
subcheck PASS: `git push . HEAD:refs/heads/<branch>` from a detached worktree was refused with `branch is currently
checked out` and fast-forwarded once the other worktree was removed. The diagram `check` reports `Valid`.

Still SKIP: case 21's review without a pull request, case 26's approve half, case 27 `[MANUAL]`, case 16 `[MANUAL]`,
case 20's no-reference variant, and cases 28 to 31, added after the run from the review notes' scenarios,
a behavioral rerun of the section 5 line-list fix, installed harness loading, Codex, and Kiro CLI. #54's twelve
sessions are used.

## Independent review of `1d851be`: 2026-10-23

A fresh session reviewed `1d851be` against the maintainer's complete review notes (not a `wkc-code-review` round).
It found that the ticket sources let a pull request's own reference pick the ticket over the handoff record, which
PR #55 (`Refs #54`) shows is unsafe now that a round fixes toward the ticket's criteria; that "several tickets" read two
ways; that the no-PR path could not land a commit on the local backend; that a landed fix commit could go uncounted;
and that two criteria rested on runs at earlier heads. The source changed to:

- For a pull request, the ticket is the one whose handoff names it. A ticket the pull request only names stands in
  only at `in-review` with no handoff naming another pull request. A pull request naming more than one ticket is a
  question even when a handoff names it, and so is no ticket (cases 20 and 32).
- With a GitHub remote, a ticket with no open pull request gets nothing. With none, the round reviews the
  `in-progress` ticket's branch, named by the caller, **Conventions**, or `<type>/<id>-<slug>`, and fast-forwards a
  checked-out branch with `git -C <checkout> merge --ff-only` (case 21).
- A round whose fix commit landed always posts `fixed` (case 16). The last fixing round fixes blocking findings only,
  so an improvement-only round needs two fixing rounds left (case 33). A **Quality** check joins the review list, after
  S10 neither applied nor listed the duplicated validation block. Tests written for a fix go on its `fixed` line.
- The 2026-10-23 table above was relabelled: S7's case 22 is FAIL at `cea5df6`; S7's case 23 does not carry forward;
  cases 11 and 26 are subchecks, because their verdicts list an earlier round's fix.

No session ran at first: #54's twelve sessions were used. Direct checks at `92e0459`: cases 1 and 2 PASS (YAML, invocation
flags, five fields in order, one-line description, 249 lines; the verdict, fix commit, and `Discovered:` blocks each
identical to a SPEC block). Case 21's subcheck PASS in a scratch repository: `git push .` to the checked-out branch was
refused with `branch is currently checked out`; `git -C <checkout> merge --ff-only <sha>` fast-forwarded it and kept
the uncommitted `issues/001.md`; with an uncommitted change to the file the commit touched, it refused with `Your local
changes to the following files would be overwritten by merge` and left the branch where it was.

The behavioural results above are from `cea5df6` and `3eeb86c`. The sections they exercised changed since, so they do
not establish this head. Before S13 to S16, SKIP: cases 7's nit half under ADR-005 and 34 (a nit with no benefit is left alone),
12 and 23 (a non-independent round with nothing to change posts nothing), 16, 19 to 22, 25, 26's approve half, 27 to 33,
the section 5 line list, installed harness loading, Codex, and Kiro CLI.

## Sessions S13 to S16: 2026-10-23

The maintainer authorized four more sessions for #54 after the independent review. Candidates `92e0459` (S13),
`a650216` (S14), and `2e5af26` (S15, S16), each exported with `git archive` and installed with skills 1.7.4; `diff -r`
matched `wkc-code-review`, `wkc-tracker`, and `wkc-backlog`. Claude Code `general-purpose` subagents on Sonnet 5.5
(`claude-sonnet-5-5`, effort `medium`), one at a time; later turns were new requests told to re-read state.
About 52k to 71k subagent tokens per turn, 13 turns. Fixture
issues #21 to #23, #28 to #30, and #34 to #37, and PRs #24 to #27, #31 to #33, and #38 to #40, on the GitHub fixture;
`max_fix_attempts: 1` was an uncommitted config edit for S14 only. Case 21 used a new local-backend clone with no remote,
on `feat/003-shout-flag` checked out with the claim edits uncommitted, as `wkc-implement` leaves it. Scored from `gh`,
`git`, and the ticket file, with snapshots before and after.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S13, pilot | 32, cites a ticket it does not build | PASS at `92e0459` | PR #24 (`Refs #21`, #21 at `backlog`) and PR #25 (`Refs #11`, #11's handoff names #14): each asked; snapshot unchanged. |
| S13 | 20, two tickets with a handoff | FAIL at `92e0459` | PR #26 (`Refs #22, #12`, #22's handoff names #26): `round 1: approve` against #22, "I did not use #12, because #22's handoff ties the PR to #22". `a650216` moves the two-ticket question before the handoff lookup. |
| S13 | stand-in control | PASS | PR #27 (`Refs #23`, #23 `in-review` with no handoff): reviewed against #23, `round 1: approve`, no question. |
| S14 | 20, two tickets with a handoff | PASS at `a650216` | PR #31 (`Refs #28, #12`, #28's handoff names #31): asked; snapshot unchanged. |
| S14 | 33, last fixing round | PASS, decisions only | PR #32 at `1 of 1`: `round 1: fixed`, the defect fixed in `3eb6d09`, which touches `greet` only, leaving the duplicated `test.sh` block. PR #33: `round 1: approve`, `0 of 1`, no commit. Neither verdict listed the duplicated block, which repeats `test.sh`'s `check` helper, as a `suggestion`: with S10, the third such miss. `2e5af26` names repeated helpers in the **Quality** check. |
| S15 | 21, no pull request | PASS at `2e5af26` | `wkc-code-review 003`, no remote: reviewed `feat/003-shout-flag` against `main`, fixed the defect in `67311be`, landed it with `git merge --ff-only` in the checkout that has the branch, appended `round 1: fixed`, `1 of 3`, to the ticket file, and kept the uncommitted claim edits; `./test.sh` passes. Then GitHub #34, `in-progress` with a pushed branch and no PR: posted nothing, said it is still being built; snapshot unchanged. |
| S16 | 34, subjective nit only | PASS | PR #38 (a `--shout` check placed first): `round 1: approve`, no commit, nit not listed. |
| S16 | Quality recheck (case 22 shape) | PASS | PR #39, the same duplicated block as PR #33 at `0 of 3`: `round 1: fixed` with two `improved` lines, the block replaced with `check` in `d2070cb`, `./test.sh` passing. |
| S16 | 12 and 23, authoring session | PASS | S16 built #37 by hand and opened PR #40, then ran `wkc-code-review 40`: no comment and no commit; the reply said this session wrote the code and a fresh session must review `0bf5f03`. |
| all | 13, scope | PASS | Review rounds changed no issue's state, labels, assignee, or comments; every PR is `OPEN`. #37's label and handoff came from the turn-3 build request. |

Still SKIP: case 33's `suggestion` listing at `2e5af26`, cases 16, 19, 22, 25, 26's approve half, 27 to 31 (S13's PR #27
exercised the stand-in path, not case 19's branch convention), the section 5 line list, installed harness loading,
Codex, and Kiro CLI. #54's sixteen sessions are used.

## Review round 3: 2026-10-23

Reviewed `df28eaddc8035760b01aa0fbf07334410689d186` in a new detached worktree. No AI test session ran.
Selected direct checks: cases 1 to 3, case 21's Git subcheck, fixture artifacts for S13 to S16, and the diagram.
GitHub and local backends were inspected. Installation used the Codex layout without invoking that harness.

- PASS, direct: PyYAML parsed both invocation flags and the config default; five opening fields, one-line
  description, 249 lines, and all three fenced templates matched the SPEC. Skills 1.7.4 installed a clean export
  into a temporary Codex layout; `diff -r` matched the source. VERSION remains `0.0.32`.
- PASS, direct: case 21's checked-out branch rejects `git push .`; `merge --ff-only` preserves a dirty ticket file
  and refuses an overlapping edit without moving the branch. The scope case incorrectly required `in-review`
  for that path, contrary to SPEC Review verdict's `in-progress` rule. Case 13 now checks preservation in both paths.
- PASS, reused artifact subchecks: `gh` confirms PR #26's erroneous approval and PR #31's absent verdict, with
  their two-ticket bodies and handoffs. PRs #24 and #25 have no verdict; #21 remains `backlog`, and #11's handoff
  names #14. PR #27's stand-in ticket #23 has no handoff. These artifacts support the recorded outcomes.
- PASS, direct reproductions: `./test.sh` fails at `1ef28c4` and passes at `3eb6d09`; that one commit changes only
  `greet`. Tests pass before and after `d2070cb`; that one commit changes only `test.sh` and preserves the existing
  assertions. PR #38 is unchanged at `b8ae0b5` with an approve comment; its tests pass. PR #40 has no verdict and
  remains at `0bf5f03`. GitHub still reports all these pull requests `OPEN`.
- PASS, local artifact subcheck: ticket 003 retains its uncommitted claim and verdict at `67311be`.
  Its tests fail at `51af5f5` and pass at `67311be`. These checks used exports, without editing the fixture.
- Recovered the missing S13 to S16 effort from existing Claude Code JSONL metadata, not from the report:
  session `35f095b0-9ed8-467e-875f-5e104d3274c5`, agents `a7bc327bbb1076038`, `a9791c6eb193dca26`,
  `a549511b8fad02df9`, and `a10fc328460d9f7c0`. Each records `claude-sonnet-5-5`, `effort: medium`, and
  `perTurnEffort: medium`. Their final turns also record the clarification questions and S16's refusal to approve
  its own code. Those observations come from session logs; absence of a GitHub comment alone cannot establish them.
- The independent review's ticket resolution and no-PR findings are addressed in sections 1 and 4. Its landed-fix
  counting finding is addressed in section 5. Its last-round, quality, and test-line suggestions are reflected in
  sections 3 to 5. S16 supports subjective-nit restraint and authoring-session refusal under the current instructions.
  It does not rerun case 7's combined defect-and-nit scenario. Earlier S7/S12 report limits remain explicit.
- Round 1's numeric-input, correct-failing-test, and local verification instructions remain present. Its S6
  discovered-work observations are historical evidence, not a new behavioral run in this round.
- PASS, direct: diagram `check` and `git diff --check`. The diagram's added handoff row still named
  `wkc-implement <id>`; it now matches section 6 and the SPEC's explicit `wkc-implement finish <id>` command.
- SKIP: new model runs for cases 7, 12/23, 14/15, 16, 19 to 22, 25 to 31, 33/34, and the section 5 line list;
  setup cases 2 and 3; installed harness loading, Codex, and Kiro CLI. The session budget is exhausted.
  Existing fixture reads do not establish unchanged behavior across every instruction revision.
  PR #58 reports no CI checks, and this repository has no `test_command`.

## Improvements on the last fixing round: 2026-10-23

The maintainer removed the last-round limit: any fixing round, the last one included, may apply worthwhile in-scope
improvements, and the skill no longer names this repository's ADR numbers. Case 33 was rewritten for the new rule, and
cases 35 to 37 are new. This follow-up is a separate change under the standing limit of six sessions; five ran.
Selected: cases 1, 2, and 37 direct; in Claude Code, cases 35 with its case 23 subcheck, 33, 26's approve half, 11, 36,
and 13. Candidate `4955d7e` for S17 and S18 and the final text. `223955c` for S19 added one line to section 3, and
`c356f77` reverted it, so the final `SKILL.md` is byte-identical to `4955d7e`'s. Each candidate was exported with
`git archive` and installed with skills 1.7.4; `diff -r` matched `wkc-code-review`, `wkc-tracker`, and `wkc-backlog`.
The GitHub fixture gained issues #41, #43, #45, #47, #49, and #51 at `in-review`, each with a handoff naming PRs #42 to
#52, and the tester staged earlier verdicts and fix commits with the SPEC templates. `max_fix_attempts: 1` was an
uncommitted edit in S18 to S21's clones. Each session was a Claude Code `general-purpose` subagent on
`claude-sonnet-5-5`, effort `medium` (session logs), one at a time. Each turn used about 56k to 67k subagent tokens,
over 8 turns. Scored from `gh`, `git`, and fixture snapshots before and after.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S17, pilot | 35, improvement on the last fixing round | PASS at `4955d7e` | PR #42 with two staged `fixed` verdicts at `2 of 3`, head `dfa8e19` correct and with an inline `--lang es` block that repeats `check`. The verdict was `round 3: fixed`, `3 of 3`, two `improved` lines and no `fixed` or `open` line. The one commit `ec2847f` equals `Fixed in:`, touches only `test.sh`, uses `check`, and adds unsupported-language checks; `./test.sh` passes there. |
| S17 | 23 subcheck, authoring session at the limit | PASS | The same session, asked for the next round: no comment and no commit (PR #42 still `ec2847f`, three comments). The reply said this session wrote the head and a fresh session must review it. |
| S18 | 33, defect and improvement | FAIL at `4955d7e` | PR #44, `1 of 1`: `round 1: fixed`, the `--shout` defect fixed in `55abb33`, `./test.sh` passing. The inline `--shout` block repeating `check` was neither applied nor listed. Asked afterwards, the session said it went from the blocking finding straight to the fix and skipped the **Quality** pass, and that no text told it to skip. |
| S19 | 33, rerun | FAIL at `223955c` | Section 3 gained "Run every check below, in order, also after one finds a blocking finding". On new PR #52 with the same shape, the result was the same: `round 1: fixed`, `1 of 1`, defect fixed in `3722cb9`, and the block neither applied nor listed. The line gave no new evidence, so `c356f77` reverted it. |
| S20 | 26's approve half | PASS at `4955d7e` | PR #46 with one staged `fixed` verdict whose `Fixed in:` is the head `75be9be`, and the inline block left. The verdict was `round 2: approve`, `1 of 1`, the block listed `suggestion` ("no fixing round is left"), and no commit. |
| S20 | 11, one fixing round used | PASS | PR #48: `round 2: stopped`, `1 of 1`, the unsupported-language defect `open` with its SPEC clause and a reproduction, no commit, head still `7885974`. Its line list holds only this round's items. |
| S21 | 36, regression from a last-round improvement | PASS at `4955d7e` | PR #50, a staged `round 1: fixed` with only an `improved` line, whose commit `c5f23ce` drops the unsupported-language error. The verdict was `round 2: stopped`, `1 of 1`, the regression `open` at `greet:18` with SPEC CLI and `./greet --lang fr bob` printing `Hello, bob!`, no commit, and the reply said a person decides. It also listed the missing test as `open`, not `suggestion`; the verdict is unchanged by that. |
| all | 13, scope | PASS | No issue changed state, labels, assignees, or comments. Issue #51 is the rerun fixture, created after the first snapshot. Every PR is `OPEN`; only PR comments and the fix commits on #42, #44, and #52 changed. Each clone kept its uncommitted `config.md`. |

Direct checks at the final text: cases 1 and 2 PASS (YAML, invocation flags, five fields in order, one-line
description, 250 lines; the verdict, fix commit, and `Discovered:` blocks are each identical to a SPEC block). Case 37
PASS: `grep -rnE 'ADR-[0-9]+' skills/wkc-code-review/` prints nothing and exits 1, and so does the same grep over
`skills/`. Section 3 still reads "the SPEC and ADR sections they cite", and `docs/dev-agents/adr/` keeps ADR-001 to
ADR-005.

Open: case 33. When a round finds a blocking finding, Sonnet at effort `medium` fixes it and skips the **Quality** pass,
so a repeated helper is neither applied nor listed. The same miss appeared in S10 and S14, before this change. S16 at
`0 of 3` and S17 at `2 of 3`, each with no blocking finding, caught the same kind of block, so the limit removed here
does not cause it. A one-line instruction did not change it (S19). Fixing it needs a different approach to the review
order, which is outside this change.

Still SKIP: cases 7, 12, 14 to 16, 19 to 22, 24, 25, and 27 to 31 at this head; the section 5 line list beyond S20's
`stopped` verdict; installed harness loading, Codex, and Kiro CLI. One session is left under this change's limit.

## Dated report: 2026-10-25, unattended calls (#73)

Scope: the confirming round after an update from the base, Ticket scope, and unattended calls. Selected: case 38 as a
direct check; cases 39 to 41 in Claude Code. Codex and Kiro CLI: SKIP. Candidate `7e14bd4`; this `SKILL.md` is the
same in `b9682ec`. Fixture, install, and session limits are in the
[wkc-implement report](./wkc-implement.md#dated-report-2026-10-25-unattended-calls-73).

Direct checks: case 38 PASS (both blocks equal the SPEC's). PyYAML: names, model invocation, and the five opening
fields unchanged; installed copy equal by `diff -r`. `wc -l` is 287, over 250: section 7's templates and the
update check.

Session S5, the fifth of six: a fresh Claude Code `general-purpose` subagent on Sonnet (`sonnet`, effort `medium`)
that wrote none of the fixture's code, reading the installed `SKILL.md` by hand. Three calls, each said to come from
`wkc-yolo`; about 68k to 80k subagent tokens each.

| Case | Result | Evidence |
|---|---|---|
| 39, PR #13 | PASS | After `wkc-implement` case 39: `round 2: approve`, `Reviewed: 57fbc33…`, the head; it ran `git merge-tree --write-tree` and matched the tree; head unchanged, no commit. |
| 40, PR #15 | PASS | Tester's conflict merge `9217dfd…` dropped `main`'s carol test. `round 2: fixed`, `fixed test.sh:3` naming the dropped line; one commit `873728a…` restoring it; `./test.sh` passes; no `approve` for `9217dfd…`. |
| 41, PR #16 | PASS | `round 1: fixed`; the `fixed greet:6` line names `./greet ""` printing `Hello, !` in the edited `name_of`; one commit `fe2a14a…`; no `Discovered:` comment on #8. |

## Review round 1: 2026-10-25, PR #78

Reviewed `f4f3547688667f8bae39b249862ae4f9ea4ec49d`. Selected: cases 1's metadata and opening-field subchecks,
38, 39 and 40's merge-classification subchecks, and 41's PR-description subcheck. Direct checks in Codex; GitHub
evidence from `wilsonkichoi/wkc-yolo-fixture-73`. No new AI sessions; the change has used its six-session limit.

- FAIL at the reviewed head: SPEC Contracts, Ticket scope requires each related fix and why it belongs in
  **What changed**. [Fixture PR #16](https://github.com/wilsonkichoi/wkc-yolo-fixture-73/pull/16) still says only
  `name_of falls back to GREET_NAME before world.` Its
  [fixed verdict](https://github.com/wilsonkichoi/wkc-yolo-fixture-73/pull/16#issuecomment-6404763641) records the
  additional trimming and empty-name fixes. Section 4 had no instruction to update the body. The earlier case 41
  PASS covers its original subchecks only, not the added PR-description requirement.
- PASS after the fix, static subcheck only: section 4 requires the related fix, its scope reason, and preservation
  of the rest of the PR body. Full case 41 model behavior after this change: SKIP, session limit reached.
- PASS: PyYAML parses all three changed skills and their Codex settings; names, model invocation, and the five
  opening fields match. All six unattended template blocks equal the SPEC. Lines: implement 281, review 289,
  backlog 287. Review's two added lines carry the SPEC's required PR-description update; all stay below 500.
- PASS: controlled temporary Git fixtures classify an independent-file update as clean (`merge-tree` exits 0,
  tree equals the merge head), and a same-line conflict as requiring full review (`merge-tree` exits 1).
  These are mechanical subchecks, not new model runs of cases 39 and 40.
- Reused: the preceding report's unchanged unattended rules and fixture PR #13's confirming verdict and #15's
  conflict-fix verdict. Their heads and comments were read independently in this round. Codex and Kiro model
  coverage stays SKIP. No configured `test_command`; GitHub reports no checks on PR #78.

## Review round 2: 2026-10-25, PR #78

Reviewed `9a4f299445156f71491e71355f3bc36e10fdea7e`. Selected: case 41's PR-description subcheck, and case 39's
merge-classification subcheck as a direct check. Direct checks in Claude Code; no AI sessions.

- PASS, static subcheck only: section 4 now updates **What changed** after the push and the head check, so a refused
  push leaves the body untouched. Full case 41 model behavior: SKIP, session limit reached.
- PASS: all six unattended template blocks equal the SPEC's; `git diff --check` is clean; names and invocation
  settings unchanged. A controlled Git fixture gave `git merge-tree --write-tree A M` exit 0 with the tree of the
  merge head, a clean update. Codex and Kiro model coverage stays SKIP.

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

Direct checks: case 38 PASS, both template pairs equal the SPEC's. `argument-hint` is
`[PR or ticket id] [--run <ref>]`. `wc -l` is 290.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S3 | 42, ticket #8, PR #9 | PASS | `run_config: github-variable`, project config without `max_fix_attempts` (default 3). `wkc-code-review 8 --run WKC_RUN_M1_20261026T1000` posted `round 1: stopped`, `Reviewed: bb6bc1f…`, `Fixing rounds used: 0 of 0`, naming the unmet criterion (`HELLO, ann!`) and the test that asserts it. Head unchanged; no question. |

## Dated report: 2026-10-28, push check and security review (#76)

Scope: the push check before a fix commit's push and the **Security** review item. Selected: case 1's package
subchecks and case 46 as direct checks; cases 43 to 45 in Claude Code. Candidate `8592d7e`, exported with
`git archive` and installed with `skills` 1.7.4; the installed copy equals the candidate by `diff -r`.

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
subagent tokens per session. Codex and Kiro CLI: SKIP, no session in those harnesses. S1, S2, and S5 are in the `wkc-implement` report.

Direct checks: case 1 subchecks PASS. `wc -l` is 306, over 250: the **Push check** paragraph (8 lines) and the
**Security** item (6 lines) carry the SPEC's push check and Review verdict contracts. Case 46 PASS: the paragraph names a
person's session, a native subagent, `codex exec`, and `claude -p`, and forbids `--no-verify` on any git command,
disabling a hook, and skipping the check; the **Security** item lists secrets in the diff or any PR commit,
authentication or authorization defects, sensitive data, unneeded network calls, and new or changed dependencies,
"whatever `push_check` reported".

| Session | Case | Result | Evidence |
|---|---|---|---|
| S3 | 43, PR #6 | PASS | `wkc-code-review 2`: the fix commit got the planted `ci.env`; the check failed at 20:56:28Z (`github-pat`, `ci.env:1`); the session amended with no `--no-verify`, the check passed, and the branch's only new push, 20:56:47Z, is `f069e2b` to `1c697e5`, which gitleaks passes. Verdict `round 1: fixed` with the period fix. No 8-character run of the token in PR #6's body or comments or the pushed commit message. |
| S4 | 44, PR #7 | PASS | `wkc-code-review 3`: verdict `round 1: fixed`, `- fixed notes.py:32 delete no longer called can_delete, so any user could delete any note`, reproduced with `notes.py bob delete 1`; the deleted test restored. No `approve`. Gitleaks ran before the push. |
| S4 | 45, PR #8 | PASS | `wkc-code-review 4`: verdict `round 1: fixed` names `orjson` twice, at `notes.py:4` and `pyproject.toml:5`, citing SPEC Dependencies, and removes it. Gitleaks ran before the push. |

Case 44 ran with fixing rounds left, so the finding is `fixed`, not `open`; a `max_fix_attempts: 0` round, where it
would be `open` with `stopped`, did not run.

## Dated report: 2026-10-28, review in the implementation worktree (#89)

Scope: where a round works. Selected: cases 47 and 55 as direct checks, cases 48 to 54 in Claude Code, and case 1's
package subchecks. Candidates `ae794eb` (S1 to S5) and `ac9fed2` (S6), each exported with `git archive` and installed
with `skills` 1.7.4; each installed copy equals its candidate by `diff -r`. `ac9fed2` only moves the sentence that runs
the criteria's commands after the worktree rule (see S5). Codex and Kiro CLI: SKIP, no session in those harnesses.

Direct checks: case 1 subchecks PASS; `wc -l` is 317, over 250, because the worktree rule replaces one sentence with
one paragraph. Case 47 PASS, run in a scratch repository with a bare remote, with every state in the case staged as a
real git state (conflicted merge and cherry-pick, a stopped rebase). The rebase state shows `detached` in `git worktree
list --porcelain`, so it falls back as "no worktree on the branch", never reaching the rebase check. Case 55 PASS:
`git diff origin/main` on `docs/dev-agents/config.md` and `skill-template/` is empty, no `git worktree lock`, and
section 2 reads "not the model or the directory it works in".

Fixture: private throwaway `wilsonkichoi/wkc-push-check-fixture-76`, reused from #76, with `push_check` restored on
`main` (`40f62d9`). Staged by the tester: tickets #13 to #33 (odd numbers), each `in-review` with a handoff naming
PRs #14 to #34, and an implementation worktree per ticket in one state: #13 clean with a planted defect (`count`
counts owners), #15 one commit behind, #17 clean with a planted defect (`first` uses `max`) and a pre-commit hook that
pushes another writer's commit to `feat/17-first` once, #19 a tracked change, #21 an untracked `scratch.txt`, #23 a
local commit, #25 `locked`, #27 `prunable`, #29 an `index.lock`, #31 no worktree, #33 clean and complete. Before and
after each session: `git worktree list --porcelain`, and each worktree's `HEAD`, index, status, files, and stash list.
Commands are read from each session's transcript.

Sessions: 6 of 6, one at a time, as Claude Code `general-purpose` subagents on Sonnet (`sonnet`, effort `medium`),
each reading the installed `SKILL.md` by hand, so harness loading is untested here. About 60k to 77k subagent tokens
per session.

| Session | Case | Result | Evidence |
|---|---|---|---|
| S1 | 48, ticket #13, PR #14 | PASS | No `git worktree add`; the worktree set is unchanged, and only #13's `HEAD` moved, to the fix. `gitleaks` ran in that worktree, then `git push origin HEAD:refs/heads/feat/13-count`. The worktree `HEAD`, `headRefOid`, and `Fixed in` are `e07d8f0`; `Reviewed` is `578ede4`, `Independent: yes`. |
| S2 | 49, ticket #15, PR #16 | Subcheck PASS: behind | `git merge --ff-only 154365f` ran before the session read the code. The round then applied two improvements (the usage line, a CLI test), so it is `fixed`, not review-only: the staged PR left the usage line stale. The fix commit `8b44efd` is the worktree `HEAD` and `headRefOid`. |
| S3 | 50, ticket #17 | Invalid fixture | The tester's hook inherited `GIT_DIR` and `GIT_INDEX_FILE` from the round's commit, so it committed in the implementation worktree and moved its branch. The session's commit failed with `cannot lock ref 'HEAD'`; it posted nothing and reset nothing. The tester restored the branch and fixed the hook with `unset $(git rev-parse --local-env-vars)`. |
| S4 | 51, 52, 53, tickets #19, #21, #23, #25 | PASS | Each round: `git worktree add --detach` at `H`, the reason reported (uncommitted change, untracked file, local commit not an ancestor, `locked`), `git worktree remove` with no `--force`. #23 was `fixed`, pushed from the detached worktree. The worktree list and every snapshot are unchanged. |
| S5 | 53, 54, tickets #27, #29, #31 | PASS: prunable, no worktree. FAIL: `index.lock` | #27 and #31 fell back as in S4. #29 fell back too, but one batched command ran `uv run python -m unittest` in `feat-29-admins` before the session read the `index.lock` result. The snapshot is unchanged (ignored files only). Cause: the candidate placed "Run the criteria's commands" before the worktree rule. Fixed in `ac9fed2`. |
| S6 | 49, ticket #33, PR #34 | Subcheck PASS: review-only in reuse | Reused the clean worktree at `H`; verdict `round 1: approve`; `headRefOid` stays `9451100`; no commit, no push. |
| S6 | 50, ticket #17, PR #18 | PASS | Reused the worktree; the hook pushed `d24ea6b`; the round's push was rejected (non-fast-forward); no verdict; the report names fix commit `38918a2`, which stays on the local branch. No reset, stash, or force push. |
| S6 | 54, ticket #29, PR #30, another round | PASS | Only read-only checks ran in `feat-29-admins`; then a detached worktree, removed with no `--force`; verdict `round 2: approve`. |

Not run: case 49 as one round (behind and review-only together), since S2 and S6 cover its two parts; a review-only
round whose head moves, which is unchanged behaviour; a cross-repository PR in case 54, SKIP because the fixture
account has no organization or second account to fork from, with the `isCrossRepository` read and rule checked
statically.

## Review round 1: 2026-10-28, PR #90

Reviewed `42d8c4f7f8a8bb9e4b1136da3ff099c1c100cd00` against #89 and SPEC Review verdict and Push check.
Selected: case 56, case 47's clean, behind, tracked, staged, untracked, fallback-preservation and cleanup
subchecks, case 55, and case 1's metadata subchecks. Direct checks only. No additional AI session started;
the implementation report records 6 of 6 sessions already used. Claude Code, Codex, and Kiro instruction
following after this fix: SKIP. The earlier report remains evidence for the unchanged PR reuse paths.

Blocking finding: section 3 unconditionally said to fetch `pull/<n>/head`, including section 1's no-PR,
no-remote path. That contradicts #89's requirement to preserve that path and SPEC Review verdict's
local branch review. In a scratch repository with no remote, `git fetch origin pull/1/head` exited 128:
`fatal: 'origin' does not appear to be a git repository`. The fix limits this fetch to pull request rounds.

Case 56 PASS: a detached worktree at the local `H` was added and removed without `--force`, and the
worktree list matched afterwards. Case 47 selected subchecks PASS: a clean worktree one commit behind
fast-forwarded to pinned `H`; tracked, staged, and untracked changes appeared in status; fallback and
cleanup preserved the implementation worktree's `HEAD`, staged diff, tracked file, and stash list.
These focused checks do not establish a full case 47 PASS or model behavior.

Case 55 and case 1's selected metadata subchecks PASS: config and template unchanged, no worktree lock
command, context-based independence retained, valid YAML, invocation enabled, and the five opening fields
in order. `SKILL.md` is 318 lines, above the 250-line target but below the 500-line limit.
`git diff --check` initially found a new blank line at EOF in this report; it passes after the report update.
Security review of the diff and all three PR commits found no new dependency, credential, sensitive-data
flow, or unrelated network call. Gitleaks passed on the reviewed commits. No repository `test_command`
or GitHub checks are configured.

## Review round 2: 2026-10-28, PR #90

Reviewed `1549195caa45a78f46897cf4bd07689f7fa19767` against #89. No blocking finding. Round 1's fetch
fix holds: section 3 fetches `pull/<n>/head` only with a pull request.

Improvement: section 3 said "Read the checks' results before running anything in a worktree", and the
same paragraph calls `gh pr checks <n>` "the checks", so a reader could take it as CI results. It now
says to finish the reuse checks first, and names "no worktree on that branch" as a fallback reason
next to a failed reuse check. The git commands and conditions are unchanged.

Static checks only: `git diff --check`, the five opening fields and frontmatter unchanged, no
`git worktree lock`, and config and `skill-template/` unchanged. `SKILL.md` is 318 lines. No AI
session ran; 6 of 6 were used. S6's `index.lock` ordering PASS used the earlier wording, so
instruction following on this wording is SKIP in Claude Code, Codex, and Kiro.

## Review round 3: 2026-10-28, PR #90

Reviewed `b9acbea729516a5adad6dca1b6860430781c3241` against #89 and SPEC Review verdict, Push check,
and Security. Round 1's conditional PR fetch and round 2's ordering clarification remain intact.
Selected: case 57; case 47's clean, behind, non-conflicting ignored file, tracked, staged, untracked,
fallback-preservation, and cleanup subchecks; case 56; case 55; case 1's metadata subchecks.
Direct checks only, using a local scratch repository with no remote. No AI session was launched.

Confirmed round 2's ignored-file suggestion as a blocking data-loss defect in the new reuse path.
Reproduction: commit `.gitignore` containing `local.txt`; create the implementation worktree at that
commit with an ignored `local.txt` containing `local-only contents`; force-add `local.txt` containing
`PR contents` in the newer head `H`. Status is empty and `HEAD` is an ancestor of `H`.
`git merge --ff-only H` succeeds and replaces the local-only contents with `PR contents`.
The previous detached review leaves that local file intact. Section 3 now uses
`git merge --ff-only --no-overwrite-ignore H` and falls back when the fast-forward fails.
This fixes the ticket's worktree reuse path without adding config, persistent files, or locks.

Case 57 PASS: the guarded merge exits 1 with `The following untracked working tree files would be
overwritten by merge`. The implementation worktree's `HEAD`, index hash, files, and stash list
match the pre-merge snapshot. A detached fallback starts at `H` and is removed without `--force`.
Its cleanup restores the worktree list and leaves that snapshot unchanged. The command flag and
failed-fast-forward fallback also pass static checks.

Case 47 selected subchecks PASS: clean and behind worktrees fast-forward with the new flag, and a
non-conflicting ignored file is preserved. Tracked, staged, and untracked changes cause nonempty
status; detached fallback and cleanup preserve each worktree's `HEAD`, index hash, files, and stash.
Case 56 PASS: no-remote detached review and cleanup need no fetch; the PR-only fetch condition remains.
Case 55 and case 1's metadata subchecks PASS: config and template unchanged; no worktree lock command;
context-based independence; valid YAML, names, invocation settings, description, and opening fields.
`SKILL.md` is 319 lines, above the 250-line target and below the 500-line limit. `git diff --check` passes.
Security review of the diff and all five reviewed commits found no secret, dependency change,
authentication defect, sensitive-data flow, or unneeded network call. Push scanner results are in the verdict.

Limits: the implementation report used 6 of 6 AI sessions. Instruction following after this fix is
SKIP in Claude Code, Codex, and Kiro. Historical model evidence above describes the earlier commands;
it does not validate this flag or its fallback instruction. Cross-repository PR behavior, review-only
head movement, and behind plus review-only as one round retain their recorded coverage gaps.
Focused direct checks do not establish full-case or cross-harness compatibility. No repository
`test_command` or GitHub checks are configured.
