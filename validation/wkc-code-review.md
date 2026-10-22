# wkc-code-review validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Contents

- Preparation
- Cases
- Dated report: 2026-10-22

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
   criterion and a style nit. A fresh session runs a round.
   PASS: one comment `wkc-code-review round 1: fixed`, `Reviewed:` the head before the round, `Fixed in:` the new head,
   `Fixing rounds used: 1 of 3`, the defect listed `fixed`, the nit listed `suggestion`. `git log` shows exactly one
   new commit, in the fix commit template, whose diff does not touch the nit's line.

8. **Approve round.** A second fresh session on the same pull request.
   PASS: `round 2: approve` with `Reviewed:` the fix commit's sha; `headRefOid` unchanged by the round.

9. **Finding came back.** The tester re-plants the fixed defect. A fresh session runs a round.
   PASS: `stopped`, that finding listed `open`, and the head unchanged.

10. **No fixing rounds.** With `max_fix_attempts: 0`, a fresh session runs the first round on a pull request with a
    planted defect.
    PASS: no new commit, and the verdict is `approve` or `stopped` with `Fixing rounds used: 0 of 0`.

11. **One fixing round used.** With `max_fix_attempts: 1`, on a pull request with one staged `fixed` verdict and a
    planted defect, a session runs the next round.
    PASS: no new commit, and the verdict is `approve` or `stopped` with `Fixing rounds used: 1 of 1`.

12. **Independence.** A round run in the session that wrote the code, and one in a fresh session.
    PASS: the first verdict says `Independent: no, <why>`; the second says `Independent: yes`.

13. **Scope.** After every round in cases 4 to 12 and 14 to 15.
    PASS: the ticket is still `in-review` with the same assignees, the pull request is `OPEN`, and no other ticket's
    status changed.

14. **Discovered work, non-blocking.** On the local fixture, a round on the correct pull request, after the session is
    told about the out-of-scope `Hello, !` defect.
    PASS: the ticket file gains a `Discovered:` comment in the five-line template with `Blocks this ticket: no`; the
    verdict lands on the pull request before the item reaches `wkc-backlog`; the session's last turn is `wkc-backlog`'s
    approval question; no ticket file is created before an answer. A correct change gets no invented blocker.

15. **Discovered blocker.** On the local fixture, a round on the pull request whose `./test.sh` criterion fails only
    because of the out-of-scope `--version` check.
    PASS: a `Discovered:` comment with `Blocks this ticket: yes`; `wkc-backlog` runs at once; no verdict comment and no
    new commit on the pull request; the ticket keeps its status and holder.

16. **Head moves during the round.** `[MANUAL]` Push a commit to the pull request's branch while a round runs.
    PASS: no `approve` for the old head; the reply says a new round must review the new head.

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
| S4 | 10, no fixing rounds | PASS | `max_fix_attempts: 0`, PR #6 with an off-by-one loop: `round 1: stopped`, `Fixing rounds used: 0 of 0`, no commit. |
| S4 | 11, one round used | PASS | `max_fix_attempts: 1`, PR #7 with the staged `round 1: fixed … 1 of 1` and a missing `!`: `round 2: stopped`, `Fixing rounds used: 1 of 1`, no commit; the staged finding stayed closed. |
| S2 to S5 | 12, independent | PASS | Every fresh-session verdict says `Independent: yes`. |
| all | 13, scope | PASS | Across every round, each issue's state, labels, assignees, and comment count are unchanged, every PR is `OPEN`, and local tickets 001 and 002 stay `in-review`, held by `Wilson Choi`, by PyYAML. Only PR comments, the fix commits, and the `Discovered:` comments changed. |
| S5 | 14, discovered, non-blocking | PASS | `wkc-code-review 001`, told about `Hello, !`: `round 1: approve` on local PR #1 with no invented blocker; two five-line `Discovered:` comments with `Blocks this ticket: no` (the defect it was told about, and the `--version` failure it found itself, outside 001's criteria); the last turn was `wkc-backlog`'s three options for the first item; after `3`, no ticket file was added. |
| S5 | 15, discovered blocker | PASS | `wkc-code-review 002`: one `Discovered:` comment with `Blocks this ticket: yes` for the `--version` failure that fails 002's `./test.sh` criterion; `wkc-backlog` drafted at once with the edge 002 blocked by the new ticket; PR #2 has no comment and no new commit; 002 stays `in-review`, held, `blocked_by: []` since nothing was published. |

Observations, none of which failed a case check:

- S5 appended its `Discovered:` comments to the ticket files directly instead of through `wkc-tracker comment`, and
  said so. The text matches the local backend's comment format, but the verb's verify step was skipped.
- S4's verdict on PR #6 also listed the correct `test.sh` as an `open` finding, since it failed only because of the
  `greet` defect. The session called its own line overstated. With no fixing round left the verdict is the same.
- S1's round on PR #8 called the PR's change of `./greet ""` from `Hello, !` to `Hello, world!` a regression and
  reverted it. The fixture SPEC does not define an empty name, so the change was unasked behaviour; the call fits
  the skill's "earlier behaviour it breaks".
- Fix commits carry the harness's `Co-Authored-By` trailer after the template's lines.
- S4 once ran `gh issue view 3` outside the fixture, which read this repository's issue #3. It was a read; that
  issue's `updatedAt` and comments are unchanged.

Not covered: case 16, a head that moves during a round, which needs a push timed inside a running session; a pull
request with no ticket reference; a project with no GitHub remote; Linear; installed invocation through the
harness's skill loader; Codex and Kiro CLI.
