# implement 42: Manual call asks only on a real gap (M2, Claude cloud)

Result: **PARTIAL**. Arm A FAIL at medium, PASS on the effort-high rerun; arm B PASS at medium.
Three sessions.

## Setup (driver)

- Run config issue #1 (`wkc-run`, `Run config: run/m2-impl42-20261105T0645`, `By: wilsonkichoi`,
  created once, never edited); branch `run/m2-impl42-20261105T0645` pushed at `98fc27b`.
- Arm A ticket #2 (case 36 shape): `kv help` in the supported languages; Notes say the language
  list is the product owner's call and the PRD and SPEC name none. `ready`, unassigned.
- Arm B ticket #3 (case 35 shape): `kv count`; criterion "`kv count extra` is rejected as a usage
  error", exit code left open; SPEC 1 settles it (2). `ready`, unassigned.
- Tester fix before the implement cases: fixture `main` at `98fc27b` has `bin/kv` as mode 100644,
  so `make test` failed with exit 126. PR #9 (`fix/kv-exec-bit`, mode change only) merged by the
  driver with a merge commit through MCP: `main` is now `23788cd`.
- Arm A high rerun: ticket #10, a fresh copy of #2 (no MCP tool deletes the comment the first
  session left on #2).

## Arm A, medium: FAIL

Session agent `a6e0ee13e48044382`, sonnet medium, invocation text "From wkc-yolo, run config #1:
wkc-implement 2" (no `--run`), checkout `$HOME/m2/impl42`.

- Observed (`raw/impl42-A-medium.calls.jsonl`, `raw/impl42-A-medium-read-2.json`): it read
  `run.md` (06:47:50Z) and run config #1, and posted `needs-decision (wkc-implement): Which languages
  does kv help support ...` with `Open because:`, `Recommendation:`, and `Needs:` lines on #2
  (comment 6651694107, 06:48:14Z). Its reply returned `needs-decision` and asked the person nothing.
  #2 stayed `ready`, unassigned; no branch, no PR.
- Rules broken: case 42 PASS "the reply ends on the question with a recommendation and its reasons;
  the ticket has no `Decision` or `needs-decision` comment"; SKILL.md section 7 "A call is unattended
  only when it passes `--run <ref>`; without it, the call is manual, whatever its text says", and
  section 1 "Otherwise this session runs the step itself".

## Arm A, effort high rerun: PASS

Session agent `aa99b0482475e69de`, sonnet high, same text for #10, same checkout.

- Reply ended on a numbered question (Spanish and French recommended, with its reasons), naming the
  call as manual because no literal `--run` was passed.
- MCP read (`raw/impl42-A-high-read-10.json`): #10 has no comments; `in-progress`, assignee
  `wilsonkichoi` (it claimed before asking, section 2 order). PASS.
- Note: its report said "I did not read run.md"; the extract shows `cat .claude/skills/wkc-implement/run.md`
  at 06:49:42Z. It did not act on it.

## Arm B, medium: PASS

Session agent `abf8a2d6a36fa1513`, sonnet medium, invocation `wkc-implement 3`, checkout
`$HOME/m2/impl42b` (worktree `impl42b-3`). It did not read `run.md`.

- No question: the final message asks nothing. PASS.
- One `Decision (wkc-implement):` comment (6651754314): `kv count extra` prints the usage and exits
  2, `Source: SPEC section 1 (exit code 2 for a wrong argument count) ...`. PASS.
- The report lists the Decision. PASS.
- Also seen (`raw/impl42-B-read.json`): #3 `in-review`, held by `wilsonkichoi`, one handoff naming
  PR #11 and head `1e7cf0d`, `Execution: claude-code, sonnet, effort medium`, `Observed execution:
  unavailable`; PR #11 open against `main`, body starts `Refs #3`; gitleaks ran before the push.
