# Changelog

Newest first. Each version is a `## {version} ({ISO 8601 timestamp with local offset})` heading followed by a bullet list of changes.

## 0.0.44 (2026-10-29T09:24:42-07:00)

- `wkc-tracker`'s GitHub backend runs every verb through `github.py`, a standard-library Python script in the skill directory, run with `uv run --script` (#94, ADR-011). It covers `list`, `show`, `next`, `create`, `edit`, every `assign` form, `move`, `comment`, `link`, `unlink`, `milestone` ensure, close, list, and show, and the `tracker` run config store. Each verb reads, checks its precondition, writes, and verifies with a separate read, and prints one JSON object with exit 0 (done), 1 (refused, nothing written), 2 (usage), 3 (a write did not verify), or 4 (a read failed). Why: in #88's validation a session read the old query-by-query `github.md` in full and still counted a milestone with its own `jq`, with no completeness check and no `wkc-run` exclusion. A first fix in this branch told sessions in three places to run the commands as written; the next session read that twice and still rewrote every `jq` that began with the prelude placeholder.
- `github.md` is now the map from each verb to `github.py`'s arguments, its input, output, and exit codes, and what the script holds to. `SKILL.md` section 1 says GitHub verbs run through the script and never through a query of the session's own. `SKILL.md` keeps every verb's meaning; Linear and local are unchanged. The `github-variable` and `command` run config stores stay as `SKILL.md` gives them.
- The GitHub backend needs `uv` as well as `gh`. `wkc-setup` checks `uv --version` for `github`.
- `wkc-implement` says its ticket reads and writes run with the backend file's commands, never a query of its own.
- `AGENTS.md`: no new helper scripts without a person's explicit approval; an approved helper is Python run with `uv run --script`, with contract tests in `tools/<skill>/` behind a `Makefile` target. `github.py` is the recorded exception, with tests in `tools/wkc-tracker/test_github.py` (`make test-tracker`). The SPEC's boundary and component row follow.
- Validation: `wkc-tracker` cases A51 (contract tests) and A52 (every verb from an installed copy against a throwaway repository); stale references to `github.md`'s old queries in A-cases now use `github.py` or direct `gh api` reads; `wkc-implement` case 72 checks that a finish session runs `github.py`, with the wording-only attempt's failure kept in its dated report; `wkc-setup` case 9.

- Review fixes: preserve exit 3 after write attempts; verify open state for claims and moves; refuse run configs as ticket edge targets; expand complete blocker paths through duplicates and other repositories when explaining cycles.

## 0.0.43 (2026-10-28T23:12:56-07:00)

- `wkc-implement finish` takes the ticket's milestone from `wkc-tracker show <id>` after the move to `done`, names it, and then reads `wkc-tracker milestone show <milestone>` (#88). A read that did not ask for the milestone no longer counts as proof that the ticket has none. In #80's validation, two finish sessions read the ticket with `gh issue view` field lists that left out `milestone`, and reported "the ticket has no milestone" for tickets in `M1: Greetings`, so they never read the milestone and could not name `wkc-plan close`.
- `validation/wkc-implement.md` cases 32 and 33 check the `milestone show` read, the milestone name, and that a ticket with no milestone runs no `milestone show`, with a dated report. The report distinguishes passing milestone outcome subchecks from the observed omissions in the complete tracker read. A focused Codex rerun verifies the complete reads and reports on already completed tickets.

## 0.0.42 (2026-10-28T22:42:46-07:00)

- New `max_ai_test_sessions_per_attempt` config field, default 6, integers of 0 or more (#91, ADR-010). Each `wkc-implement` build and each `wkc-code-review` round, the final review-only round included, may start that many additional AI test sessions, so a fixing round can test its own fix. With the defaults a full loop allows at most 42. The limit is a ceiling: direct checks come first, and no AI test session starts when they suffice. Any other value stops the call before a test starts.
- Before each AI test session, the skill posts an `AI test session: <k> of <limit>` comment on the ticket naming its attempt, `build <branch>` or `review round <n> on <PR URL or branch>`, and its checks. The count comes from those records, so pilots, retries, and failed starts count, and a resumed or restarted attempt keeps its usage. Unused allowance does not carry forward, and a required check left unrun is SKIP. The handoff and the verdict gain an `AI test sessions:` line.
- `max_fix_attempts` defaults to 5 instead of 3. Fixing rounds already used stay counted against the new limit, whatever limit their verdicts named.
- `wkc-setup` Section D asks for both fields and recommends 5 and 6; `config-template.md` lists them. This repository's config sets them explicitly.
- The PRD AI session budget, the SPEC (Config fields, a new AI test sessions contract, the handoff and verdict templates, Requirements), the token-usage and AI harness testing rules, `AGENTS.md` Validation, and the README follow. ADR-010 amends ADR-003's default.
- The `wkc-setup`, `wkc-implement`, and `wkc-code-review` runbooks gain allowance cases.

## 0.0.41 (2026-10-28T20:43:27-07:00)

- `wkc-code-review` reviews in the implementation worktree when it is safe (#89). A pull request round reuses the worktree that has the PR's branch checked out when the PR is not cross-repository and that worktree is clean and idle: not `locked` or `prunable`, an empty `git status --porcelain`, no merge, rebase, cherry-pick, or `index.lock` in progress, and a `HEAD` that is an ancestor of the reviewed head `H`. A worktree that is behind is fast-forwarded to `H` with `git merge --ff-only --no-overwrite-ignore`, preserving local ignored files. A fix commit lands on the checked-out branch and is pushed from there, so the implementation worktree no longer falls behind after a `fixed` round.
- When any check or the fast-forward fails, or with no pull request, the round works in a temporary detached worktree at `H` as before, reports which check failed, and removes it with `git worktree remove`, never `--force`, reporting a removal that fails. Only a pull request round fetches the PR head; a no-remote review keeps using the local branch's head. The round finishes the reuse checks and any fast-forward, and reads their results, before it runs anything else in a worktree, and reports the reason for each fallback, including no worktree on the branch.
- A refused push is reported with the fix commit's sha, and nothing is reset, stashed, or force-pushed; in a reused worktree the commit stays on the local branch. Independence is still about the session's context, not the directory it works in.
- `validation/wkc-code-review.md` gains cases 47 to 58 and dated implementation and review reports.

## 0.0.40 (2026-10-28T15:22:20-07:00)

- Run completion (#80, SPEC Contracts › Lifecycle › Finish in a run, ADR-008). Under `--run <ref>`, `wkc-implement finish <id>` runs right after the ticket's pull request merges into the run branch, at the run branch head, and needs no merge into the default branch. It classifies each post-merge gate by what it acts on: a local gate runs, a shared non-production gate runs only under an unexpired `Grant:` in the active run config that names its environment and exact command, and a production-affecting gate never runs. The ticket moves to `done` when every required gate passes; otherwise the finish comment is `waiting` and names who must act.
- `wkc-implement verify <id> --run <ref>` runs a ticket's local and granted gates again at the run branch head and posts their gate comments, with no status change. A gate already passed at that head is reused; a failed or unavailable one runs again.
- Failure classes under a run: an environment failure is retried within its grant, then recorded `not run, environment unavailable`, and the ticket waits without parking. A code failure runs once more at the same sha; failing again it gets a follow-up pull request from and into the run branch, and passing it counts as passed, reported as intermittent, with a `Discovered:` comment.
- Blockers: under a run, a blocker in any phase of the active config's `Continues:` chain is met once its pull request merged into the run branch and its latest finish found no failed gate. In every mode, a `done` blocker whose finish comment names a run branch is met only once that run branch reached the default branch, by a merged pull request from it or the merged run PR on its `Run outcome (wkc-yolo):` comment.
- `--authorized` is gone; under a run, grants come only from the active run config. A predecessor's grant, an expired grant, and ticket, comment, or pull request text never authorize an operation.
- The gate comment's `Merge commit:` line is now `Commit: <sha> on <branch>`, and the finish comment's `Merged:` line names the branch, with a `Verified at:` line in a run, as the SPEC's templates say.
- `wkc-implement`'s run behaviour moved to a new supporting file, `skills/wkc-implement/run.md`, read only on a `--run` call: the decide and park records, the run and its configs, the run branch and blockers, finish and verify in a run, and the pre-merge update.
- `wkc-backlog`: each `## After merge` step names its `Target:` (`local`, an environment, or `production`). Under a run, it moves a requirement out of a ticket's definition of done only for a ticket the run config's `Moved by the person:` line names, creating the release ticket at `backlog`, blocked by and related to the original, with the moved text word for word in its `## After merge` and its **Notes**, never its criteria. Any other such move parks the ticket with `Needs: a person`.
- The README rows describe finish on the run branch, `verify`, and the requirement-move rule. `validation/wkc-implement.md` gains cases 51 to 61 and retires cases 38 and 46; `validation/wkc-backlog.md` gains cases 40 to 42; both have dated reports.
- Review fixes: resolve an initial `Run PR: not opened` when a continuation names the PR; verify terminal host evidence before accepting a retired predecessor and confirm default-branch delivery on outcome records. Shared gates require an edit-detecting store (a `command` store's `get` is its edit check) and remaining grant limits before every attempt, including retries. Local verification reads back run-PR comments and uses them on resume. Cases 62 to 66 cover these paths.
- Review fixes: both outside-run delivery paths require the blocker's recorded commit in the carrying PR's merged head, so an unrelated or earlier merge cannot release dependents and squash merges still count. The carrying head is fetched through `pull/<n>/head`, so a deleted run branch does not hide it. A code failure without an authorized rerun stays failed and holds dependents while waiting for authority; any other `not run` gate does not hold them. The validation plan now covers the affected criteria, command-store success and refusal, and installed `--run` loading; historical results are not current behavioral evidence.

- Review fix: grant accounting counts attempt records for the active config ref, never predecessor attempts or an environment log alone. A renewed phase retains its full allowance, while missing usage in the active phase still prevents an operation. A successful command-store `get` is its acceptance check; the caller never audits that implementation or adds a separate edit-detection requirement.

## 0.0.39 (2026-10-28T13:48:55-07:00)

- Push check (#76, SPEC Contracts › Lifecycle › Push check). The new `push_check` config field holds a shell command that scans the commits about to be pushed for secrets; exit 0 passes. Once it is set, `wkc-implement` and `wkc-code-review` run it in the checkout holding the commits before every push, in every mode and for every session kind: a person's, a native subagent, `codex exec`, or `claude -p`. A failure blocks the push. The skill removes the finding from its own unpushed commits, runs the check again, and pushes only on a pass. It names the file, line, and rule, never the value. No skill passes `--no-verify` to any git command, disables a hook, or skips the check. The same finding failing again with no new evidence stops; under a run, the ticket parks. With no `push_check`, a manual push goes ahead with a warning in the report; under a run, the skill parks instead of pushing.
- `wkc-code-review` checks every round for the SPEC's security defects, whatever `push_check` reported: a secret in the diff or in any commit of the pull request, an authentication or authorization defect, sensitive data logged, stored, or sent where it should not be, and network calls the ticket does not need. It names each new or changed dependency in a verdict line, as a finding when the ticket does not need it. A secret is named by file and line, never by value.
- `wkc-setup` Section D asks for `push_check`, offering the gitleaks command first and checking that `gitleaks` is installed. `config-template.md` lists the field, default none.
- This repository's own `docs/dev-agents/config.md` sets `push_check` to the gitleaks command, because the repository is public.
- The README rows describe the push check and the security review. `validation/wkc-implement.md`, `validation/wkc-code-review.md`, and `validation/wkc-setup.md` gain the new cases and dated reports.

## 0.0.38 (2026-10-25T16:00:06-07:00)

- Unattended calls (#73, SPEC Contracts › Unattended calls). A call is unattended only when it passes `--run <ref>`, naming a `wkc-yolo` run config; a call without it is manual, whatever its text says. The skill first reads the config with `wkc-tracker run show <ref>`, and when that refuses it stops, writes nothing, and asks nothing. Under an unattended call, `wkc-implement`, `wkc-code-review`, and `wkc-backlog` never end a turn on a question. Each decides from the ticket, PRD, SPEC, ROADMAP, and run limits and posts a `Decision (wkc-yolo):` comment, or parks the ticket with a `Parked (wkc-yolo):` comment, keeps its status, and returns `parked`. Each `SKILL.md` gains a section 7 with both templates, copied from the SPEC. Manual calls are unchanged.
- Under a run, `wkc-implement` and `wkc-code-review` return discovered items to `wkc-yolo` instead of handing them to `wkc-backlog`; the `Discovered:` comments stay on the ticket. Before its handoff, `wkc-implement` also posts a decision for each behaviour the criteria did not state and the build had to settle, even one a SPEC section dictates. `wkc-implement finish` runs a `(needs authorization)` gate that the call's `--authorized` names, marks any other `not run` with no question, and parks when the same gate fails again for the same cause.
- Under a run, `wkc-backlog` publishes the change after its graph check passes, with no approval question. New tickets stay at `backlog` and no ticket moves to `ready`, because `wkc-yolo` decides which new tickets run.
- Pre-merge update: when a `wkc-yolo` call asks for it, `wkc-implement <id>` merges the base branch into the ticket's open pull request, resolves any conflict, reruns the acceptance checks, and pushes, with no rebase, no force push, and no second handoff. `wkc-code-review` confirms a clean update and approves it with no change: the head is a merge of the approved head and a base-branch commit, and `git merge-tree --write-tree` of the two gives the head's tree. A conflict fix, or anything else, gets the whole review. This check runs in every mode.
- Ticket scope (SPEC Contracts › Ticket scope), in every mode: `wkc-implement` fixes a problem the ticket's outcome needs fixed, or one in code the ticket changes, in the same pull request. `wkc-code-review` treats a defect in code the pull request changes as a blocking finding even when no criterion names it. Both name each related fix and why it belongs in **What changed**. A problem with its own deliverable, or one that must land at a different time, is still discovered work. This replaces `wkc-implement`'s "Build this ticket only".
- `wkc-backlog` declares the `wkc-tracker comment` dependency used by its unattended decision and parking records.
- Run branch (ADR-007): under a run, `wkc-implement` branches from the run config's run branch, opens its pull request against it, and counts a blocker of the same run as met once its pull request merged into the run branch. In every mode, `wkc-implement finish` counts a pull request merged into another branch only once a pull request from that branch into the default branch has merged, and then names that merge commit.
- `wkc-tracker` gains `run create`, `run show`, and `run close` for `wkc-yolo` run configs, which are never tickets. The new `run_config` field picks the store: `tracker` (an issue labeled `wkc-run`, or a file in `issues_dir/runs/`), `github-variable`, or the project's own `command <cmd>`. `run show` refuses a GitHub issue whose body was edited and a variable updated after it was created. `wkc-setup` Section E asks for the store and says who can read each one.
- Review fixes: the variable-store create command reads standard input without the unsupported `--body-file` flag. GitHub ticket queries exclude `wkc-run` issues while keeping the raw page count for pagination. The run-branch rule explicitly leaves post-merge follow-ups on the default branch for a person's merge. Every `github-variable` command names the `origin` repository, because a bare `gh variable` command resolves to an `upstream` remote first; `run show` reads the text and both timestamps from one `gh api` response. `wkc-setup` reads the visibility of the repository Section A resolved, and `wkc-implement` says finish waits only while the run PR has not merged.
- PRD, SPEC, ROADMAP, and the new ADR-007 (maintainer review of PR #78): a run merges only into its own run branch and ends at one run pull request that a person merges; release and deploy steps are approved in a closing round after that merge; `merge_gate` is gone; the run record is now the run config, which holds limits only.
- `AGENTS.md` no longer restates what a skill does. The paragraphs on `wkc-workflow-diagram`'s renderer and arrows, `wkc-backlog`'s evidence copy, `milestone close` and `wkc-plan close`, `wkc-implement finish`, and the list of model-invoked skills are gone, because each skill's own files already carry them and no skill reads `AGENTS.md` at run time. Pre-commit checklist item 3 now limits `AGENTS.md` changes to authoring conventions.
- The README rows describe the unattended calls, the run verbs, and the planned `wkc-yolo` run branch. `validation/wkc-implement.md`, `validation/wkc-code-review.md`, `validation/wkc-backlog.md`, `validation/wkc-tracker.md`, and `validation/wkc-setup.md` gain the new cases and dated reports.

## 0.0.37 (2026-10-24T18:46:52-07:00)

- `wkc-plan close <milestone>` closes a finished milestone (#66, SPEC Contracts › Milestone close). It reads `wkc-tracker milestone show` and the milestone's **Exit check** in the ROADMAP. While any ticket is `backlog`, `ready`, `in-progress`, or `in-review`, or has no clean status, it names them and writes nothing. Otherwise it shows the counts and the exit check and asks whether the exit check passed; it runs no exit check itself. Only on a yes does it call `wkc-tracker milestone close`, its one tracker write, and it never edits the ROADMAP for a close. On Linear and local the tracker verb writes nothing and says so.
- `wkc-implement finish`, after it moves a ticket to `done`, reads `milestone show` for the ticket's milestone and names `wkc-plan close <milestone>` in its report when nothing in it is open. It never closes a milestone.
- The `wkc-plan` description, `argument-hint`, **Input**, and **Dependencies** name `close <milestone>`. The README rows, `AGENTS.md`, and the workflow diagram follow. `validation/wkc-plan.md` and `validation/wkc-implement.md` gain the close cases and a dated report.

## 0.0.36 (2026-10-24T17:49:20-07:00)

- `wkc-architect` and `wkc-plan` opt into model invocation: `disable-model-invocation: false` and `policy.allow_implicit_invocation: true` (#67, SPEC Contracts › Invocation). Their callers are people, a model acting on a person's request, and `wkc-backlog`, never `wkc-yolo`. Model invocation approves nothing: the SPEC or ROADMAP stays `Status: draft` until the person approves it in the conversation.
- `wkc-backlog` invokes `wkc-architect` for a change it classifies as a SPEC change and `wkc-plan` for a ROADMAP change, instead of only naming them for the person to type. Under `wkc-yolo` it names the change in its return instead, because `wkc-yolo` is not their caller.
- The workflow diagram gains two dashed call arrows, `wkc-backlog` → `wkc-architect` (SPEC change) and `wkc-backlog` → `wkc-plan` (ROADMAP change), and its source rows name the new callers.
- `AGENTS.md` and the README list both skills among those that opt into model invocation. `validation/wkc-architect.md`, `validation/wkc-plan.md`, and `validation/wkc-backlog.md` gain the invocation cases and a dated report.

## 0.0.35 (2026-10-24T17:48:56-07:00)

- `wkc-tracker milestone close <name>` closes exactly one open milestone with that name on GitHub, by a PATCH of its `state` only, and verifies it with a fresh read (#65). A name that matches nothing stops and names the milestones that exist; an already closed one is reported with no write. It never checks the milestone's tickets: whether to close is the caller's decision. Linear project milestones and local milestones have no open or closed state, so on those backends it writes nothing and says so. `milestone <name>` still never renames or reopens one, and the line "No verb closes a milestone" is gone. GitHub milestones M2 and M3 stayed open with every ticket closed because no verb could close one.
- The skill README, root README, and `AGENTS.md` document the verb. `validation/wkc-tracker.md` adds cases A47, B32, and C36, and a Claude Code run where A47 and B32 pass.

## 0.0.34 (2026-10-24T00:36:38-07:00)

- `wkc-implement` finishes a ticket only when called as `wkc-implement finish <id>`, and only from the ticket's pull request: the one on the `PR:` line of its latest handoff comment or the `Merged:` line of its latest finish comment. A pull request that only cites the ticket, by a `Refs` line in its body or a mention in a comment, never counts, so a planning pull request such as #55 can no longer select finish for a ticket nobody built (#59). `wkc-implement <id>` builds or reports the review state; when the ticket's pull request has merged, it names `wkc-implement finish <id>` and writes nothing. `finish <id>` with no handoff or finish comment asks for the pull request and writes nothing. With no argument, it names each `in-review` ticket whose handoff pull request merged with its `finish` call. Only open pull requests that cite the ticket are still read, for eligibility and to continue a build.
- The `argument-hint` and **Input** name `finish <id>`. The README row, the diagram's `implement` card and source row, and `validation/wkc-implement.md` follow; case 23 now expects `finish` to ask, and new cases cover the merged-handoff report and a ready ticket with a merged planning pull request.
- The recorded pull request takes precedence over newer open pull requests that merely cite the ticket. An open follow-up to the recorded merged pull request can still continue an incomplete handoff. `AGENTS.md` records the explicit finish contract, and runbook cases cover both selection paths.
- The review state that `wkc-implement <id>` reports now names the latest `wkc-code-review round` verdict, its `Reviewed` sha, and whether that sha is the head, next to GitHub's `reviewDecision`, as separate records. An `approve` on the head gives the next step: a person merges that sha, then `wkc-implement finish <id>`. A verdict on an older head asks for another round in a fresh session. Runbook cases 29 to 31 cover the three states.

## 0.0.33 (2026-10-23T23:04:22-07:00)

- `wkc-backlog` puts its evidence-copying instruction next to the work-ticket Notes template. A `Discovered:` item's `Observed`, `Reproduce`, `Because`, and `Verified` lines come word for word from the original comment returned by `wkc-tracker show`, including handoffs from `wkc-code-review`, never from the caller's summary (#61).

## 0.0.32 (2026-10-23T17:14:20-07:00)

- New `wkc-code-review` runs one review round on a pull request from `wkc-implement` (ADR-003, ADR-005). It judges the implementation and its tests against its ticket's acceptance criteria and the SPEC, and reads the diff for quality, such as code that repeats an existing helper. A defect, an unmet criterion, a SPEC violation, a regression, or a security defect is blocking only with the requirement it breaks, its evidence, and a concrete failure scenario, and is verified before it is fixed; a finding the evidence does not confirm is reported as an unconfirmed suggestion. While a fixing round is left, it fixes the blocking findings, including other instances of the same pattern in the ticket's change, and applies worthwhile in-scope improvements, all in one pushed commit from the SPEC's fix commit template. Any fixing round may apply improvements, the last one included; a blocking finding one adds there ends the review-only round in `stopped`. It posts one verdict comment from the SPEC template, `approve`, `fixed`, or `stopped`, tied to the reviewed head, and the verdict gains an `improved` line kind. It never merges, approves through GitHub's review state, or moves, assigns, creates, or edits a ticket.
- Every round that commits code is `fixed` and uses one of `max_fix_attempts`, whether it fixed findings, applied improvements, or both; a round that changes nothing uses none. A round is one verdict on one head, so commits add no rounds and a duplicate verdict counts once, and a head already reviewed gets no new round unless the caller asks. A later round does not raise resolved findings again and checks the changes since the last round for regressions. A blocking finding that comes back after being fixed, or blocking findings with no fixing round left, stop the review for a person. A round whose fix commit landed always posts its `fixed` verdict, even when the head moved after it.
- A round in the session that wrote any of the code says `Independent: no` and may fix or stop, but never approves: with nothing to change, it posts no verdict and asks for a fresh session (ADR-005, amending ADR-003's suggestion rule and independence consequence). The SPEC Review verdict, the `max_fix_attempts` meaning, and PRD outcome 1 follow.
- `wkc-code-review` takes a pull request or ticket id, the preferred input. With no argument it reviews the one open pull request whose head is the current branch, and asks when there is none or several. Numeric GitHub ticket ids follow their implementation handoff when the number is not a pull request. For a pull request, the ticket is the one whose `wkc-implement` handoff names it. A ticket the pull request only names, by its first line, a GitHub-linked issue, or a **Conventions** rule, stands in only at `in-review` with no handoff naming another pull request, because a round fixes toward its ticket's criteria. More than one ticket, or none, is a question. A PR naming more than one ticket is a question even when a handoff names it. With no GitHub remote it reviews the ticket's branch, lands any commit by fast-forward, and posts on the ticket; with a GitHub remote and no open pull request it posts nothing. Out-of-scope findings become `Discovered:` comments with the SPEC's evidence lines through a verified `wkc-tracker comment`, handed to `wkc-backlog`, a blocker at once and other items after the verdict.
- `wkc-setup` Section D asks for `max_fix_attempts`, the review rounds that may change code on one pull request (an integer, 0 or more, default 3), and `config-template.md` lists it. `wkc-code-review` stops on any other value and posts nothing.
- `wkc-code-review` opts into model invocation; its callers are people, `wkc-yolo`, and a model acting on a person's request. The README row and uninstall command, the `AGENTS.md` list of skills that opt into model invocation, and the repository diagram (a `code-review` card in the Implementation lane, with arrows from `wkc-implement` and to `wkc-tracker`, `wkc-backlog`, and `wkc-implement`) follow. `validation/wkc-code-review.md` is new, with Claude Code runs on throwaway GitHub and local-tracker fixtures; Codex and Kiro CLI are SKIP.

## 0.0.31 (2026-10-22T13:18:59-07:00)

- `wkc-setup`'s Linear guidance says the skills do not need Linear's GitHub integration, because they set status through `wkc-tracker` and a pull request names its ticket as `Related to <ID>`. It tells the user that if the team has the integration, its pull request automations may move tickets on their own, such as to Done on merge, before a ticket's `## After merge` steps have run (#45).

## 0.0.30 (2026-10-22T11:04:37-07:00)

- `wkc-backlog` makes the conventional, low-risk choice where the SPEC leaves a detail open and nothing approved says otherwise, instead of treating every gap as an unresolved prerequisite. Each choice that sets behaviour goes in the ticket's **Notes** as `Assumption: <choice>, because <reason>.`, never as a SPEC excerpt, and the approval lists each one; approving makes it a ticket criterion, never a SPEC change. A gap with no conventional answer, that shapes data exchanged with another system, or that materially risks product behaviour, security, compatibility, architecture, or data integrity still becomes a spike, a decision ticket, or work for `wkc-architect`. Error-handling criteria list cases but never invent consequential behaviour to add one (#47).
- `wkc-backlog` copies a reported problem's `Observed`, `Reproduce`, `Because`, and `Verified` lines into **Notes** word for word, with the link to the comment or report, never as a summary. Its work-ticket template gains the SPEC's `Evidence` line and again matches SPEC Contracts › Ticket (#47).

## 0.0.29 (2026-10-21T20:58:50-07:00)

- New `wkc-implement` takes one ticket from `ready` to an open pull request with its acceptance checks run and the ticket at `in-review`, and after a person merges, a rerun runs the ticket's post-merge gates and moves it to `done` (ADR-001). It picks its mode from the ticket and its latest pull request, found from the `PR:` and `Merged:` lines of its own handoff and finish comments and from any body line that carries the ticket reference: build, report the review state, or finish. It carries the SPEC's PR body and its handoff, gate, finish, and `Discovered:` templates exactly.
- Build claims through `wkc-tracker assign`, stops before any claim or branch when a planning document has uncommitted changes, and never claims a ticket held by someone else. Every ticket, a held one included, needs its blockers met and no other author's open pull request. A rerun on a held ticket posts only the missing handoff writes. With no id, it lists the caller's merged `in-review` tickets, then offers `wkc-tracker next`.
- Finish runs each post-merge gate with a gate comment, leaves a `(needs authorization)` step not run unless a person authorized it, opens a follow-up pull request from the current `main` when a gate fails because of the change, and stops for a person when the same gate fails again for the same cause. A follow-up branch runs the uncommitted planning documents check first. Out-of-scope work becomes a `Discovered:` comment, also when another ticket may cover it, in the SPEC's five-line template: the unchanged first line, then `Observed`, `Reproduce`, `Because`, and `Verified` lines that let another person judge the finding without the session, with `Verified: no` for a finding the evidence does not establish. It goes to `wkc-backlog` with that evidence, a blocker at once and other items after the handoff, including items an earlier session left; a rerun on a complete handoff offers to hand them over. It never merges, publishes, or deploys on an implementation request.
- `wkc-implement` opts into model invocation. Its callers are people, `wkc-yolo`, and a model acting on a person's request, and it never starts `wkc-code-review`, which it names as the review step only when it is installed. The README row, the `AGENTS.md` list of skills that opt into model invocation, and the repository diagram (a new Implementation lane and card, with arrows to `wkc-tracker` and `wkc-backlog`) follow. `validation/wkc-implement.md` is new, with a Claude Code run on throwaway GitHub, local, and Linear fixtures.

## 0.0.28 (2026-10-21T14:57:25-07:00)

- New `wkc-backlog` owns ticket planning: it drafts one ROADMAP milestone's tickets, or one change (a request, a bug, a `Discovered:` comment, or a refinement, split, re-block, or cancel of existing tickets), and publishes through `wkc-tracker` once the user approves. It carries everything 0.0.27 added to `wkc-plan` for tickets: the SPEC's work-ticket, spike, and decision templates, the split rule, the dependency graph with the edge order for existing tickets, approval, publishing, and recovery from an interrupted publish. It opts into model invocation; its callers are people, `wkc-plan`, `wkc-yolo`, and a model acting on a person's request.
- `wkc-backlog` classifies a change against the PRD, SPEC, and ROADMAP before drafting: PRD and SPEC changes go to `wkc-research` and `wkc-architect`, milestone scope changes go to `wkc-plan`. Planning a milestone needs an approved SPEC and ROADMAP. Its approval options are about tickets only: four for a milestone, three for a change. A refinement can change a ticket's title, milestone, sections, or edges. Before its first write it re-reads each existing ticket the draft changes, and stops with the difference when its title, milestone, status, holder, sections, or edges changed since the draft. A change needs no approved document but is still read against the PRD, SPEC, and ROADMAP.
- `wkc-plan` writes only the ROADMAP again. It reads milestones through `wkc-tracker` and writes no ticket. A bug, discovered work, or a ticket change is routed to `wkc-backlog`. Its approval option 1 approves the ROADMAP and invokes `wkc-backlog` for the next milestone. Changing a milestone's outcome, scope, dependencies, or exit check now resets an approved ROADMAP to draft, as adding, removing, or reordering milestones did; wording fixes keep the approval. It returns to manual invocation.
- Restored in `wkc-backlog`, after 0.0.27 cut them to fit one file: draft ids kept apart from tracker ids, generated files as a coordination risk, and the `wkc-tracker next` tie-break.
- ADR-004 supersedes ADR-002, and ADR-001's post-merge consequence now names `wkc-backlog`. The PRD, SPEC, and ROADMAP name `wkc-backlog` as the ticket writer and discovered-work receiver; the PRD, SPEC, and ROADMAP went back to draft under their own rules, and the maintainer approved them again on 2026-10-21. The README roster, `AGENTS.md`, `wkc-architect`'s spike handoff, the `wkc-tracker` README, and the repository diagram follow. `validation/wkc-backlog.md` is new, and `validation/wkc-plan.md` keeps the ROADMAP cases and its history.

## 0.0.27 (2026-10-21T09:53:58-07:00)

- `wkc-plan` takes one change between planning runs as well as a milestone: a request, a bug, a `Discovered:` comment, or a refinement, split, re-block, or cancel of existing tickets. Both use the same read, draft, graph check, approval, and publish steps. New tickets from a change, split children included, land at `backlog`. A discovered blocker is linked to the ticket that carries the comment, which keeps its status and holder. A split creates the children and moves dependents' edges to them before the parent is canceled. The draft gives an edge order for existing tickets in which no write leaves a cycle, or leaves a ticket with no unmet blocker when the approved graph gives it one, and publishing follows it. With an approved, unchanged ROADMAP, a milestone keeps all four approval options.
- "Never change a reused ticket" becomes "an existing ticket changes only as shown in the approved draft". The draft names the holder of each `in-progress` or `in-review` ticket it changes, and each ticket a cancel or split leaves with a `cancel` blocker.
- `wkc-plan` writes every ticket from the SPEC's work-ticket, spike, and decision templates, with `## Why` and `## After merge`. It carries the SPEC's split rule, the rule that publish, deploy, and shared-environment steps end with `(needs authorization)`, and the rule that tests needing the merged build are `## After merge` checks.
- A change that alters the PRD or SPEC goes to `wkc-research` or `wkc-architect`, and a change needs no approved SPEC. A gap the SPEC leaves is never filled, even as a stated assumption. A question evidence can settle, such as an **Open unknowns** entry, becomes a spike; a choice only a person or `wkc-architect` can make becomes a decision ticket.
- `wkc-plan` opts into model invocation: `disable-model-invocation: false` and `policy.allow_implicit_invocation: true`. Its callers are people, `wkc-yolo`, and a model acting on a person's request. It also uses the tracker's `edit` and `unlink` verbs.
- The README row, the `AGENTS.md` list of skills that opt into model invocation, the repository diagram's `wkc-plan` card, and `validation/wkc-plan.md` are updated to match.

## 0.0.26 (2026-10-19T19:38:29-07:00)

- `wkc-skills-release` becomes a thin entry point. The release rules move into `tools/release.mjs`, run by `make release`, which prints the plan and writes nothing, and `make release TAG=vX.Y.Z PUBLISH=<full sha>`, which publishes exactly that target. The skill runs the plan, asks, and runs the printed command. The script runs from the release checkout, so the installed-copy bootstrap is gone. Regenerated notes match every published release from `v0.0.13` to `v0.0.22`.
- Add `make worktree BRANCH=<type>/<slug>`, which starts a branch from `origin/main` in `../<repo>-worktrees/` and copies the gitignored files listed in a new `.worktreeinclude`, the file Claude Code's own worktrees read; `make merge [PR=<n>]`, which squash-merges after checking the local branch matches the PR head; and `make cleanup BRANCH=<type>/<slug>`, which removes a merged branch's worktree, local branch, and remote branch. They live in `tools/branch.sh`.
- `AGENTS.md` records that maintainer scripts start from actions repeated by hand and live in `tools/` behind a `Makefile` target, one readable file each. The release runbook points its cases at the script and records today's read-only checks against production and a publication run against a disposable fixture repository. The repository diagram's release card links to the script instead of a removed section.

## 0.0.25 (2026-10-19T18:34:58-07:00)

- `wkc-help` and the root README no longer tell a full uninstall to delete `docs/dev-agents/`. With the default paths that directory holds the project's PRD, SPEC, ROADMAP, ADRs, rules, local tickets, and workflow diagram. Uninstall now removes only `docs/dev-agents/config.md` and the reference line, and `wkc-help` deletes anything else only when asked, naming each path first.
- `wkc-setup` checks the Linear team's seven statuses in Section A, with the other backend prerequisites, instead of in step 5 after the rest of the interview. A missing status, usually In Review, is now a question before Section B, and setup reads the statuses again on the reply.
- Add `wkc-help` case 7 for an uninstall that keeps project work, and tighten tracker case C1 so the missing-status question must come before Section B.

## 0.0.24 (2026-10-19T12:20:54-07:00)

- `wkc-tracker` gains `edit <id> <changes>`, which changes a ticket's title, named body sections, `## Blocked by`, or milestone and nothing else. A changed `## Blocked by` adds and removes exactly the edges that differ, with the `link` cycle walk over the edges as they will stand; a cycle refuses the whole edit. A milestone follows `create`'s rule, and `milestone none` clears it, except on Linear, whose MCP tools cannot clear one, so it stops there. `edit` works on a terminal ticket and never changes status, assignees, or comments. A section runs to the next `# ` or `## ` heading outside a fenced code block, so its `###` subsections are replaced with it, and on GitHub only an edit that gives a section sends the body, so a title or milestone edit cannot overwrite someone else's body change.
- `wkc-tracker` gains `unlink <id> blocked-by <id>`, which removes one dependency edge. An edge that does not exist writes nothing and says so, because GitHub's DELETE endpoint, `gh issue edit --remove-blocked-by`, and Linear's `removeBlockedBy` all report success for one.
- `wkc-tracker` no longer judges for its callers: a `cancel` blocker is the caller's decision to `unlink` or deliver, not only a person's, and a refused `assign` reports the refusal instead of taking another ticket.
- Add tracker cases A39 to A46, B25 to B31, and C30 to C35, with backend evidence for edge removal and terminal-ticket edits.

## 0.0.23 (2026-10-18T21:39:48-07:00)

- `wkc-research` asks who the product is not for, pushes back once on a vague answer before accepting the user's call, and its outline marks goals as ranked outcomes. These come from the `dev:discover` source.
- `wkc-architect`'s SPEC outline gains a **Development environment** line for the toolchain, package manager, and test and lint commands. The report says when the SPEC names a test command that the config's `test_command` lacks or contradicts, which the user updates.
- `wkc-plan` prefers acceptance criteria a test or command can check, keeps manual checks for what a person must judge, counts a setup ticket done only when its tooling is shown working rather than when its files exist, and gives each spike a timebox. A project with no test suite is not made to add one.
- `wkc-setup` Section D says a project with no tests leaves `test_command` out, which the config template already allowed.
- Add research case 10, architect case 11, and plan case 21. Architect case 11 and plan case 21 also cover a project with no `test_command`. They have not run.

## 0.0.22 (2026-10-17T11:45:36-07:00)

- Add `wkc-plan`, which writes or updates the ROADMAP at `roadmap_file` from an approved SPEC: milestones in delivery order, each with an outcome and an exit check. It then drafts tickets for one milestone in the `wkc-tracker` ticket shape, with checkable criteria, copied contract excerpts, real dependency edges, and spikes for open unknowns.
- The ROADMAP follows the PRD and SPEC conventions: a `Status: draft` or `Status: approved (YYYY-MM-DD)` line, current plan rewritten in place, and a dated **Changes** entry. It holds no status, progress, or ticket lists; the tracker owns those.
- `wkc-plan` builds a dependency graph for the milestone it plans: direct prerequisites only, never edges for priority or shared files, and real ids for reused tickets and tickets in earlier milestones. It reads an earlier milestone whole, terminal tickets included: `done` work needs no edge, a duplicate stands for its original, and canceled work is planned again or named as unresolved, never linked. An unresolved prerequisite becomes a decision or spike ticket with a real edge where possible; two tickets that share an undecided contract both depend on that one ticket. A gap with no ticket keeps its dependent at `backlog`. The graph is checked for unknown ids, self-edges, and cycles before approval, and the draft shows an edge table, an optional Mermaid diagram, illustrative waves of work that could run side by side, the first frontier, and coordination risks for work that shares a schema or config.
- `wkc-plan` publishes only after the user approves, and only through `wkc-tracker`: it ensures the milestone, creates the tickets at `backlog` in a topological order, checks their milestone, status, and edges against the draft, and moves them to `ready` last, so half-published work never reaches the frontier. Creation order is publishing order, not execution order. A rerun creates only what is missing, adds any approved edge a failed `link` left out, and finishes publishing the tickets an interrupted run left at `backlog`. It never edits the PRD or SPEC.
- `wkc-tracker` now releases a blocker only when it is `done`. A `duplicate` blocker counts as its original, followed down the chain, and is met only when the chain ends at `done`. A `cancel` blocker keeps the ticket off the frontier until a person decides in the tracker, and a chain that cannot be followed, a closed GitHub issue with no reason, or a blocker the read could not see is unmet. `next`, the `link` cycle walk, and all three backends follow the same rule. On GitHub, `next` sends each ticket whose blockers are all closed through one GraphQL query that names every blocker by repository and number, reads its close reason, and follows `duplicateOf`, so a blocker in another repository is never confused with a local issue of the same number.
- `wkc-tracker create` checks the milestone: it must match exactly one open milestone before the write, and the verification read must show the ticket in exactly that milestone. A ticket that lands elsewhere is reported as a partial write, never repaired by creating or moving anything. Local markdown says when a ticket starts a new milestone.
- `wkc-tracker` gains a `milestone <name>` verb that creates an open milestone when none has that name, and never renames, closes, or reopens one. GitHub creates it through the milestones API, Linear through `save_milestone` or the server's equivalent when it has one, and local markdown needs no write. Local `create` writes the ticket's milestone. Every GitHub milestones read now pages past the first 100 results, so a repository with many milestones cannot hide a match, and titles reach `jq` as `--arg` values, never inside the program. Ticket ordering is unchanged: `next` still returns every eligible ticket, lowest id first.
- `wkc-tracker` gains two read-only forms: `milestone list` shows every milestone the backend holds, closed and empty ones included on GitHub and Linear, and `milestone show <name>` matches one exactly and counts its tickets by the seven statuses, with `done`, `cancel`, and `duplicate` kept apart. Local markdown derives both from ticket frontmatter, so it has no empty milestones. `milestone <name>` keeps its ensure meaning; a milestone named exactly `list` is ensured with quotes.
- Add the `wkc-plan` runbook and `wkc-tracker` cases A33 to A35, B21, B22, C26, and C27, mark `wkc-plan` shipped in the `README.md` roster, and add it to the uninstall command. `wkc-plan` cases 3 to 16 and tracker case B21 pass in Claude Code on Sonnet 5.5 within the 12 agreed sessions; cases 6 to 8 passed before the graph step and were not rerun. Tracker case B22 and a B21 recheck pass in two more sessions. The blocker and milestone changes add tracker cases A36 to A38, B23, B24, C28, and C29 and plan cases 17 to 20: B21 to B24 and plan cases 6, 7, and 17 to 20 pass in ten more sessions, and case 8 passed its old check before a rerun sentence was added. The GitHub commands pass against fixture JSON through a stand-in `gh`; A33 to A38 and C26 to C29 have not run.
- The `AGENTS.md` pre-commit checklist and the skill template now say that a supporting file that grows past 100 lines, or gains a section, needs a current `## Contents` list; `SKILL.md` is exempt. `github.md`'s list now follows its section order.

## 0.0.21 (2026-10-16T22:53:43-07:00)

- Add `wkc-architect`, which writes or updates the SPEC at `spec_file` from an approved PRD and the code the work touches. It shows real alternatives to the user before committing to one, writes an ADR only for a decision that is costly to reverse, and records every other decision as one line in the SPEC. Unknowns that reading cannot settle become spikes for `wkc-plan`, with no experimental code.
- The SPEC follows the PRD's conventions: a `Status: draft` or `Status: approved (YYYY-MM-DD)` line under the title, current design rewritten in place, and a dated **Changes** entry per update. An update that changes a contract names the open tickets built against it from a `wkc-tracker list`, without editing them.
- `wkc-architect` writes no PRD, ROADMAP, tickets, config, or code. `wkc-plan` owns the ROADMAP. On existing code it records only what the code cannot show for the area being changed: reasons, known debt, and outside contracts.
- Add the `wkc-architect` runbook, mark it shipped in the `README.md` roster, and add it and `wkc-research` to the uninstall command. Cases 3 to 10 pass in Claude Code on Sonnet 5.5 within the agreed limit of 12 sessions.

## 0.0.20 (2026-10-16T22:21:57-07:00)

- `wkc-setup` Section B spells out the full default paths for the spec and roadmap, `docs/dev-agents/SPEC.md` and `docs/dev-agents/ROADMAP.md`, so they are not read as repository-root files. The defaults themselves are unchanged and match `config-template.md`.

## 0.0.19 (2026-10-16T21:09:55-07:00)

- Add `wkc-research`, which writes or updates the PRD at `prd_file` from research material and an interview. It keeps sourced evidence, user decisions, and assumptions apart, and records approval as a `Status: approved (YYYY-MM-DD)` line under the title. The PRD always states current intent: updates rewrite or remove replaced requirements and add a one-line dated **Changes** entry.
- Remove brownfield architecture archaeology from `wkc-setup`. Setup no longer writes a spec from existing code; `wkc-architect` will read the code when it needs to. Setup's report step is now step 6.
- `AGENTS.md` states that the PRD, SPEC, and ROADMAP are optional, and that work fitting the current intent skips earlier stages and updates the documents afterwards.
- Add the `wkc-research` runbook and mark it shipped in the `README.md` roster.

## 0.0.18 (2026-10-16T17:27:39-07:00)

- Reformat `CHANGELOG.md` from one line per version to a heading per version with one bullet per change, so the file renders as readable Markdown. Earlier entries keep their wording, split into one bullet per sentence.
- `wkc-skills-release` reads the heading format and demotes each entry heading to `###` in release notes. It still reads the one-line format at older tags, so existing releases stay verifiable.
- `AGENTS.md` and the `wkc-skills-release` runbook describe the new entry format.

## 0.0.17 (2026-10-16T16:17:23-07:00)

- Apply Anthropic skill authoring best practices.
- Add a Contents list to the four supporting files over 100 lines: `wkc-tracker` `github.md`, `linear.md`, and `README.md`, and `wkc-workflow-diagram` `README.md`.
- Link `wkc-workflow-diagram` `embed.md` directly from `SKILL.md`.
- Add a when-to-use clause to the `wkc-setup` description and replace "utilize".
- Remove second person from the `wkc-workflow-diagram` description.
- Add an authoring guidance section to `skill-template/README.md` covering direct links, Contents lists, date-dependent wording, consistent terms, and MCP naming by role.

## 0.0.16 (2026-10-07T14:53:09-07:00)

- Update the repository diagram to all five shipped skills, including internal wkc-skills-release, with skill cards only.
- Move external systems, outputs, and results into the owning skill summaries or details; remove the four system cards and their six action edges and routes while preserving skill IDs, labels, summaries, commands, and positions.
- Default arrows to source-backed workflow actions and runtime interactions between skills; keep prerequisites in details and allow explicitly requested meanings including artifact dataflow.
- Preserve existing authored content and edge meaning unless source evidence or user direction authorizes changes; propose converting legacy non-skill cards rather than silently removing them.
- Update instructions, design guidance, complete reference examples, root documentation, affected validation cases, generated HTML, and screenshots without changing the schema, helper, or invocation settings.
- Correct the release card installation note to say it is excluded from ordinary bulk installation.
- Add desktop details panel resizing by pointer and keyboard with bounded widths and retained width across navigation.
- Start the panel at half the desktop canvas width, apply region accents and a darkened backdrop, and center only the selected card in available space at the current zoom.
- Preserve card size through opening, navigation, panel resizing, and viewport changes; remove neighbor fitting.
- Closing slides the panel away while preserving canvas position and zoom, then retains focus on the current card.
- Respect reduced motion and cancel pending closing animations on reopen.
- Group all five cards in tinted Configuration, Coordination, Documentation, and Independent boxes; change Documentation from teal to amber for clearer region contrast.
- Rename the map to wkc skills, remove its subtitle and generated header count, and default fitted zoom to 70% or smaller when needed.
- Bump the renderer to 0.0.15, regenerate shipped assets, HTML, and screenshots, update design and embedding contracts, and add browser regression coverage.

## 0.0.15 (2026-10-06T18:49:10-07:00)

- Document in the `wkc-skills-release` README that `INSTALL_INTERNAL_SKILLS=1` lets `-s '*'` install every public skill plus this internal skill in one command.
- The variable comes from the installer's source, not its `--help`; verified on `skills` 1.7.1 and recorded in the release runbook.

## 0.0.14 (2026-10-06T18:22:01-07:00)

- Add model-invocable `wkc-help`, which answers questions about the installed `wkc-` skills from their own `SKILL.md` files and gives or, on request, runs the `npx skills` commands to install, pin, update, and remove them.
- It states that `update` refetches each skill's recorded ref, so a tag-pinned install moves only by rerunning `add` with the new tag.
- It finds installed harnesses and `--copy` installs from the project's skill folders, since the lock records neither and `npx skills ls` lists every agent that reads `.agents/skills/`.
- It checks a tag's skills first, because `add` silently skips a name the tag lacks, and never passes `-a '*'` or `--all`, which replace a top-level `skills/` source directory with links.
- It replaces the planned `wkc-manage` from issue #13, whose wrapper around the installer added more confusion than control.
- Skill files now name skills without harness prefixes, leaving prefixes to the README invocation table, and `wkc-workflow-diagram` finds its helper in the project's or home directory's skill folders.
- The README installs every public skill with `-s '*'`, gains a short update section, and warns that `add -a '*'` deletes skill source as `remove --all` does.
- Installer commands across the docs, skills, and runbooks no longer pin a `skills` version; dated reports keep the versions they ran.
- AGENTS.md adds a Validation section that scopes checks to changed behavior, prefers direct checks, and reuses unchanged evidence, with new rules for simplicity, token usage, and not launching other AI harnesses, applied to the existing runbooks.
- Add `validation/wkc-help.md` with direct package and installer checks and Codex model runs: implicit loading, skill questions, and default-mode updates pass; a `--copy` update that ran `-a '*'` failed and led to the harness and copy facts; the `--copy` reruns pass, after replacing a test prompt that also read as a Git branch request.

## 0.0.13 (2026-10-02T15:12:44-07:00)

- Add manually invoked internal `wkc-skills-release` for collection-only publication, exact merged targets, complete changelog notes, numeric Latest decisions, immutable-tag recovery, verified no-ops, sequential publication checks, configuration-independent untracked-file checks and single-tag pushes, portable Bash/zsh refspecs, draft-aware paginated target lookup, and explicit warnings for older local-only targets.
- Record bootstrap and pin checks, the boolean metadata exception and fallback, and design rationale.
- Replace the release roster row, route CONTRIBUTING through the skill, distinguish public discovery from total shipped skills, and pin active installer commands to skills@1.7.0.
- Record actual loading and fallback checks on Codex, Claude Code, and Kiro CLI, disposable publication and recovery checks on all three, enforced immutable tags, paginated Latest preservation, and bootstrap pin verification.
- Clarify legacy release conflicts, keep bootstrap separate from invocation, consolidate dated validation evidence, and move compatibility authoring guidance into AGENTS.md, keep runtime publication rules in the skill, and record a full Codex fixture publication with followed-tag suppression and independent Latest checks.
- Collection bootstrap requires merge and explicit release authorization; additional unrun cases remain SKIP in the runbook.

## 0.0.12 (2026-10-02T14:27:41-07:00)

- Let models and other skills invoke `wkc-tracker`: `disable-model-invocation: false`, `policy.allow_implicit_invocation: true`, and a declaration of its callers in the skill body, where a model reads on its own but changes ticket state only when a person or a calling skill asked for it.
- `wkc-setup` and `wkc-workflow-diagram` stay manual.
- Remove `metadata.allow_implicit_invocation` from every skill and the template, since no harness reads it.
- Drop the Kiro CLI invocation notes from `AGENTS.md` and the template README.
- Update the root README and the tracker runbook, which gains S7 for the invocation settings, D7 for a model reading unprompted, D8 for a plain-language write that accepts either take form, and D9 for a discussion that must change nothing.
- Fix S3 to expect all three shipped skills, and stop the `AGENTS.md` directory example from hard-coding manual invocation values.
- Run D7 to D9 in one new session per harness, and record their first run, which passed on Claude Code and Codex.

## 0.0.11 (2026-10-01T19:10:01-07:00)

- Add the manually invoked `wkc-workflow-diagram` skill for project-scoped JSON maps and offline HTML, with a Node.js 22+ helper, loopback preview, path containment, atomic writes, and a validation runbook.
- Updates add and remove only what sources establish and never rewrite existing text on their own: a changed source that contradicts existing text is reported as a conflict with suggested wording and a numbered question, and an unchanged run leaves the JSON, README, and screenshots byte-identical.
- Every temporary file stays in the diagram directory's `.cache/`; preview runs from a documented background command and is stopped by process ID and confirmed gone before the turn ends.
- Details such as commands come only from sources, ambiguous scope ends on one numbered question using a callable selector where available and numbered text otherwise, and the project README records portable regeneration commands.
- Keep renderer source and maintainer tests in `tools/workflow-diagram/`, outside the installed skill; deterministic generated assets include schemas and license notices, with a renderer version independent of `VERSION`.
- Include this repository's map of the shipped `wkc-setup`, `wkc-tracker`, and `wkc-workflow-diagram` skills, and document the narrow maintainer build exception.
- This entry replaces the branch-only 0.0.8 through 0.0.12 workflow-diagram development entries; `v0.0.8` belongs to the released tracker pull request.
- Merge the wkc- naming update from main, update installed paths and diagram links, and preserve manual invocation settings.
- Clarify individual node and route snippets and provide complete, matching workflow.json and layout.json examples in the skill README.
- Adopt main's five opening fields and document installed renderer packaging and the explicit maintainer checks.
- Fix browser test cleanup ordering so a data reload cannot be mistaken for a completed source restart.
- Restore the prior diagram view before returning focus after details navigation, with fitted/manual view and resize regression coverage; rebuild renderer assets while keeping version 0.0.11.

## 0.0.10 (2026-10-01T18:24:26-07:00)

- Replace opening invocation boilerplate with five input/output fields and optional quoted Claude Code argument hints.
- Update the template and authoring guidance without new external links or repeated tracker invocation guidance; give `wkc-tracker` its existing verb hint, keep `wkc-setup` argument-free, and add focused tracker validation without changing invocation settings or runtime behaviour.

## 0.0.9 (2026-10-01T11:57:29-07:00)

- All skill identifiers now use `wkc-`: breaking rename to `wkc-setup` and `wkc-tracker`, with no compatibility aliases.
- Qualify planned skills, references, template identifiers, and active validation instructions; preserve current invocation settings and document per-skill opt-in for future model-callable skills.

## 0.0.8 (2026-09-24T14:00:53-07:00)

- Add the `tracker` skill: seven statuses (`backlog`, `ready`, `in-progress`, `in-review`, `done`, `cancel`, `duplicate`) and the verbs `list`, `show`, `next`, `create`, `assign`, `comment`, `move`, and `link`, against GitHub Issues, Linear, or local markdown files, with one backend file each and a validation runbook at `validation/tracker.md`.
- A status is read the way a person would: its name misspelled, in another form, or in other words means that status, and a real word that only shares letters with one means none, so nothing changes and the skill asks.
- `create` writes the ticket at `backlog` and reads everything it is given as ticket text.
- `setup` settles a missing git repository first and each backend's prerequisites before the next section, ends its turn on every question, numbers its options, and writes a `Tracker notes` section when a Linear team carries a status outside the seven.
- `AGENTS.md` adds per-skill READMEs, the `validation/` directory, the ask-then-stop rule for every skill, runbook-based validation, and one version per pull request.
- This entry folds in 0.0.9 to 0.0.41, the development steps on the `feat/tracker` branch; the runbook's run log still names them, each with the commit it tested.

## 0.0.7 (2026-08-28T22:15:00-07:00)

- Turn `delete_branch_on_merge` back off and write down why: a merge is sometimes what triggers the check being waited on, so the branch has to outlive the merge and gets deleted once the work is verified.
- AGENTS.md says a merged branch is not a dead branch, and CONTRIBUTING.md's Rulesets section becomes "Rulesets and settings", recording the two plain repository settings (auto-delete off, wiki off) alongside the ruleset payloads.

## 0.0.6 (2026-08-28T17:05:00-07:00)

- Apply the two repository rulesets borrowed from agent-toolkit, both active with an empty bypass_actors so they bind the owner: `main pull request gate` on the default branch (deletion, non_fast_forward, pull_request at zero required approvals) and `Immutable release tags` on refs/tags/v* (deletion, non_fast_forward, update, no creation rule).
- Verified by attempting each violation: a direct push to main is rejected with GH013, moving v0.0.5 gets "Cannot update this protected ref", deleting it gets "Cannot delete this tag".
- Skips agent-toolkit's required_status_checks rule, which points at a repository-validation workflow this repo deliberately does not have.
- AGENTS.md and CONTRIBUTING.md now describe the gate as enforced and record both payloads.

## 0.0.5 (2026-08-28T13:20:00-07:00)

- Put `description` on one unquoted physical line, in skills/setup/SKILL.md and in the template.
- Kiro CLI's slash-command menu takes whatever follows `description:` on that one line rather than parsing the YAML, so a folded block rendered as `/setup    >` and a quoted string would keep its quotes; the model-facing copy of the same frontmatter is parsed correctly, which is why this only shows up in the menu.
- Reproduced and fixed against a real kiro-cli session.
- States the rule in AGENTS.md and in skill-template/README.md.

## 0.0.4 (2026-08-28T00:45:00-07:00)

- Rename the skeleton to skill-template/SKILL.md.template.
- The installer discovers skills by finding any SKILL.md in the repository, not by reading skills/, so v0.0.3 shipped the template to consumers as an installable skill named skill-name.
- Confirmed fixed with `npx skills add 'https://github.com/wilsonkichoi/skills.git#fix/template-not-a-skill' -l`, which reports one skill.
- Corrects the pinned install syntax everywhere: pinning needs the full git URL with a #ref, where a missing ref fails loudly, while the owner/repo@vX.Y.Z shorthand treats @ as a skill selector and silently installs from the default branch when paired with -s.

## 0.0.3 (2026-08-26T13:19:38-07:00)

- Add Kiro CLI as a supported harness: install path, /name invocation, and the fact that Kiro has no disable-model-invocation equivalent, so a Kiro user can trigger a skill by conversation alone, which is accepted; SKILL.md frontmatter now also carries metadata: allow_implicit_invocation: "false" as a quoted string, on the chance a harness starts reading it.
- Updates AGENTS.md, README, and the setup skill doc block.
- Install instructions now name the agents with `-a` and pre-create `.kiro/`, which vercel-labs/skills#2071 requires.
- Adds an Uninstall section, including the vercel-labs/skills#1771 warning that a sweeping `remove` deletes this repository's own `skills/` source through the OpenClaw path.
- Adds a skill-template/ folder holding the copyable SKILL.md and agents/openai.yaml skeletons plus a README that writes out the Agent Skills specification rules in full, so no session has to fetch the spec; AGENTS.md points at the folder instead of carrying the template inline, and the prose rule now asks for sentences you would say out loud instead of banning specific words.

## 0.0.2 (2026-08-25T22:48:06-07:00)

- Fill in the root docs (README, CONTRIBUTING, CHANGELOG), correct AGENTS.md to match the repository as it is, and finish the setup skill: consistent docs/dev-agents/ paths, context_file and Linear questions in the interview, per-backend tracker setup, and a config template whose fields match what the interview collects.

## 0.0.1 (2026-08-17T10:59:57-07:00)

- Initial scaffolding: LICENSE, AGENTS.md, CLAUDE.md, VERSION, and the first draft of the setup skill.
