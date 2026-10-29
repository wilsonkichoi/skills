# wkc-architect validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Preparation

Export a clean candidate tree, because local installation copies ignored files too, then list and install it
into a throwaway Git project. Record the installer version from `npx skills --version`.

```sh
npx skills add "<clean-candidate>" -l
npx skills add "<clean-candidate>" -s wkc-architect -a claude-code -a codex -a kiro-cli -y
```

For cases 3 to 11, the fixture project has `docs/dev-agents/config.md` with `issue_tracker: local`, `prd_file`, and
`spec_file` set, and an approved PRD (`Status: approved (<date>)`) for a small web service with at least two goals and
one non-goal. Case 6 adds a few source files. Commit the fixture so `git status` shows every change.

Cases 12 and 13 use the `wkc-backlog` fixture, with `wkc-architect`, `wkc-plan`, `wkc-backlog`, and `wkc-tracker`
installed. Each runs in a session started in the fixture, so the harness discovers the installed skills.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, model invocation on both settings (`disable-model-invocation: false`,
   `policy.allow_implicit_invocation: true`), callers named as people, a model acting on a person's request, and
   `wkc-backlog` in a run as outside one, with `wkc-yolo` reaching it only through `wkc-backlog`, and
   `grep -n 'never .wkc-yolo.'` empty; a **When to use it** that keeps the SPEC at `Status: draft` outside a run until
   the person approves it, five opening fields in order, `wkc-architect` in public discovery, installed copy identical to the
   source, and each harness links to it.

2. **Document ownership is consistent.** Read `wkc-architect`, `wkc-research`, `wkc-setup`, and the root `README.md`.
   PASS: architect writes the SPEC and ADRs and never writes `roadmap_file`, tickets, or the config;
   research names architect as its next step; setup and the README name architect as the SPEC's writer and plan as the ROADMAP's.

3. **Approved PRD.** Invoke on the fixture and answer any questions.
   PASS: every PRD goal appears in the coverage map against a component or contract, the non-goal appears as a
   boundary, at least one contract names fields, types, and error responses, the status line reads `Status: draft`,
   and `git status` shows only the SPEC and any ADRs: no code, no ROADMAP, no ticket files.

4. **No approved PRD.** Set the PRD to `Status: draft`, then remove it.
   PASS: in both runs the turn ends on a numbered question that names the missing approval or intent, with a
   recommended option, and no SPEC is written before the answer.

5. **Real alternatives.** Use a PRD whose constraints leave two viable storage choices.
   PASS: the options and their tradeoffs are presented and the turn ends before the SPEC commits to one;
   after a reply, the SPEC and ADR record the option the user chose, and no ADR exists for a routine choice.

6. **Existing code.** Add a small service to the fixture and ask for a change to one area of it.
   PASS: the SPEC cites files it read, separates what stays from what changes, records at least one reason or debt the
   code cannot show, and does not restate areas outside the change.

7. **Genuine unknown.** Use a PRD that depends on an outside capability the fixture cannot settle.
   PASS: the SPEC names the unknown, the question a spike must answer, and the section it blocks, and no
   experimental code is created.

8. **Custom paths.** Set `spec_file` to a non-default path and add authored body text to the config and context file.
   PASS: the SPEC lands at the configured path, any ADR lands beside it, no `docs/dev-agents/SPEC.md` appears, and
   `git diff` shows the config and context file unchanged.

9. **Approval.** Review the draft without approving, then approve.
   PASS: the line under the title reads `Status: draft` until approval, then `Status: approved (YYYY-MM-DD)` with that day's date.

10. **Update and ticket impact.** On an approved SPEC, with two local tickets that build against one contract,
    change that contract.
    PASS: only the affected sections change by `git diff`, the replaced contract is gone, the status resets to draft,
    a dated **Changes** entry names what it replaced, the report names the two tickets from a tracker read, and no
    ticket file changes.

11. **Greenfield toolchain.** Set `test_command: "npm test"` in the config and use a PRD whose constraints settle a
    Python stack.
    PASS: the SPEC names the toolchain, package manager, and test command, the report says the config's
    `test_command` no longer matches, and `git diff` shows the config unchanged.
    Then remove `test_command` from the config.
    PASS: the report says the config has no `test_command` for the SPEC's test command, and `git diff` shows
    the config unchanged.

12. **Called by wkc-backlog.** Run [wkc-backlog case 33](./wkc-backlog.md), a request that changes a SPEC contract.
    PASS: the session transcript shows a skill-tool call that loads `wkc-architect`, not a file read; the SPEC reads
    `Status: draft` afterwards; no file in `issues_dir` is created or changed. New, from #67.

13. **No invocation on an unrelated question.** In a fresh session, before any skill runs, ask a question unrelated
    to the design, such as how to upper-case a string in bash. One session covers this case and
    [wkc-plan case 33](./wkc-plan.md).
    PASS: the transcript shows no skill-tool call for `wkc-architect` or `wkc-plan`, and `git status --porcelain` is
    empty. New, from #67.

Cases 14 to 17 are from #77 (SPEC Delegated run authority). Each runs through a `wkc-backlog` case, which invokes
this skill with `--run <ref>`.

14. **Delegated SPEC change.** [wkc-backlog case 43](./wkc-backlog.md).
    PASS: as there: the SPEC reads `Status: approved (<today>, delegated: <ref>)`, a **Changes** entry cites the
    item's evidence, and no question is asked.

15. **A technical requirement removed.** [wkc-backlog case 45](./wkc-backlog.md).
    PASS: as there.

16. **Never delegated.** [wkc-backlog case 46](./wkc-backlog.md), a Security weakening and a PRD change.
    PASS: as there: nothing written, `shasum` of the SPEC and PRD unchanged.

17. **A run config without delegation.** Invoke with `--run <ref>` naming a config that says `Planning: none`.
    PASS: nothing written, by `shasum`; the reply names the config's `Planning:` line and asks nothing. Case 9
    covers the manual call, which still ends on the approval question.

## Dated report: 2026-10-17

Scope: new skill. Cases 1 and 2 as direct checks; cases 3 to 10 in Claude Code. Codex and Kiro CLI are out of scope, by
the maintainer's choice.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Clean export of the final tree, `skills` 1.7.2. Discovery lists `wkc-architect`, `wkc-help`, `wkc-research`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (6 public of 7 shipped `SKILL.md`). Frontmatter and `agents/openai.yaml` parse; both invocation settings manual; five fields in order. `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-architect`, identical to source by `diff -r`. |
| 2, document ownership | PASS, direct | `wkc-architect` mentions the ROADMAP only to say it does not write it, that `wkc-plan` owns it, and that **Changes** entries name milestones to review; it names no tracker write verb. `wkc-research` names `wkc-architect` as its next step. `wkc-setup` step 3 and the README list research, architect, and plan as the writers of the PRD, SPEC, and ROADMAP, in that order. |

### Claude Code run, 2026-10-17

Claude Code 2.1.302 with Sonnet 5.5 (`claude-sonnet-5-5`), authorized by the maintainer with a limit of 12 sessions
and $2 per session, enforced with `--max-budget-usd 2`. `wkc-architect` and `wkc-tracker` were installed from the
candidate with `-a claude-code` into a fixture for a clinic SMS reminder service (approved PRD, three goals, two
non-goals, `local` tracker). Answers to questions went in through `--resume`, which does not count as a new session.
11 sessions used, $2.49 in total, at most $1.01 in one session. The first session ran with the parent session's
environment and was discarded; every later one ran with the parent's `CLAUDE_CODE_*` variables removed, no MCP
servers, and project settings only. WebFetch was refused by the sandbox proxy, so no session could read vendor docs.

Two instructions changed during the run: step 1 now says the skill never edits the PRD (case 4 had offered to mark
the PRD approved itself), and step 4 now says to list tickets through the `wkc-tracker` skill (case 10 had read the
local ticket files directly). Cases 4 and 10 were rerun on the final text; cases 5 to 8 ran on it from the start;
cases 3 and 9 ran before the change, which touches neither of their paths.

| Case | Result | Evidence |
|---|---|---|
| 3, approved PRD | PASS | Two question rounds (CSV delivery and public reachability, then webhook against polling with gains, costs, and what each rules out), then the SPEC. **Coverage** maps all three goals; **Boundaries** carries both non-goals; `POST /twilio/inbound` names its fields, 200 and 403 responses. `Status: draft`. `git status` shows only the SPEC and one ADR. |
| 4, no approved PRD | PASS | Draft PRD and missing PRD each ended on a two-option question with `wkc-research` recommended first; no SPEC written. Before the step 1 change, the draft-PRD run offered to mark the PRD approved itself; the rerun did not. |
| 5, real alternatives | PASS | SQLite and PostgreSQL shown with gains, costs, and what each rules out, before any file was written. Choosing the non-recommended PostgreSQL produced ADR-001 for it and a SPEC built on it; no other ADR. The ADR attributes a reason to the maintainer that the reply did not give. |
| 6, existing code | PASS | Cites `README.md` and the `reminders/` files, keeps the three existing pieces and adds a poller, records the SQLite reason from the README and the importer's delete-and-reinsert HACK as debt, and flags that a re-import resends reminders. Other areas get one line each. |
| 7, genuine unknown | PASS | **Open unknowns** names the MedLink reply question and the sections it blocks (reply intake, the webhook contract, goal 2), puts reply delivery behind an interface, and says goal 2 needs a PRD change if MedLink cannot deliver replies. No code. |
| 8, custom paths | PASS | SPEC at `docs/design/technical-spec.md`, ADR at `docs/design/adr/`, no `docs/dev-agents/SPEC.md`; `git diff` shows the config and context file unchanged. |
| 9, approval | PASS | A review turn that narrowed the send window kept `Status: draft`; "Approved." set `Status: approved (2026-10-17)`, the run date, in a one-line diff. |
| 10, update and ticket impact | PASS | The rerun invoked `wkc-tracker list`, named tickets 001 and 002 as building on the Y/N contract and 003 as unaffected, and changed no ticket file. The status reset to draft and a dated **Changes** entry names the Y/N parsing as replaced. The reminder text and prompt no longer mention Y/N; parsing still accepts the old words as a fallback for reminders already sent, raised to the user as a call to check. |

### Wording change, 2026-10-18

Added from the source cross-check: a **Development environment** SPEC line and a report note when `test_command` is missing or no longer matches. Static checks only: frontmatter and `agents/openai.yaml` unchanged,
no em dash in the changed lines, and the outline additions are comments or optional lines. Case 11 is new and
SKIP: no AI sessions were authorized for this change. Earlier cases keep their evidence; their checks did not change.

### Kiro CLI run, 2026-10-21

Scope: Kiro harness coverage for cases 3, 5, 9, and the second half of 11. Candidate `f70b626` (0.0.26; `skills/`
unchanged at `3ddad89`), installed with `skills` 1.7.4. Kiro CLI 2.33.0, `claude-sonnet-5.5`, non-interactive with
`--resume` per turn, one session, 6 turns, about 12% of a 1M context; Kiro records no token or credit counts locally.
Fixture: the PRD that the `wkc-research` run of the same date approved and committed (clinic SMS reminders, three goals,
four non-goals), a `local` tracker, and a config with no `test_command`. Web search was available and used for pricing.

| Case | Result | Evidence |
|---|---|---|
| 3, approved PRD | PASS | Three question rounds before the draft. **Coverage** maps all three goals and both outcomes; **Boundaries** carries every non-goal; the sheet input, messaging adapter, and both HTTP surfaces name fields, types, and error responses. `Status: draft`. `git status` showed only the SPEC and `adr/`. |
| 5, real alternatives | FAIL | Hosting: three options with gains, costs, and what each rules out, and the turn ended; ADR-001 records the choice. SMS provider and sheet access: the turn that asked about them had already written the SPEC, whose **Security** section named the recommended service account, while **Decisions** marked both as pending. After the answer, ADR-002 records the provider. Routine choices got no ADR. |
| 9, approval | PASS | `Status: draft` in the file after the first draft turn; after "Approve.", `Status: approved (2026-10-21)`, the run date. |
| 11, no `test_command` | PASS | The report said the config lacks the SPEC's `npm test`; `git diff` shows the config unchanged. |

Not run on Kiro: cases 4, 6, 7, 8, 10, and the first half of 11.

### 2026-10-21T16:20:02-07:00 Codex run

Scope: cases 3, 5, 9, and the second half of 11. Candidate `3ddad89` (0.0.26), installed with `skills` 1.7.4.
Codex CLI 0.163.0, `gpt-6.1-sol`, high, shared with the following `wkc-plan` run in one session, ten turns total.
Fixture: approved clinic SMS reminder PRD, `local` tracker, and config without `test_command`. Session
`01a160c3-b9b3-7401-8f73-5c305af16f85`; raw logs are in `/Users/wchoi/tmp/codex-compat-20261021-114617/logs/`
and the Codex session log.

| Case | Result | Evidence |
|---|---|---|
| 3, approved PRD | PASS | Draft SPEC maps the four PRD goals to components and contracts, carries non-goals into Boundaries, and includes typed contracts and error codes. Status is draft. Only the SPEC and ADRs changed; no code, ROADMAP, ticket, or config was added. |
| 5, real alternatives | PASS | Framework and database choices stayed open in the draft until options were presented. The user chose Django, PostgreSQL, and a database-backed worker. ADR-001 to ADR-003 record those choices. No ADR records a routine choice. |
| 9, approval | PASS | Review left the SPEC unchanged at draft. Approval changed only its status to `Status: approved (2026-10-21)`, with the three named spikes still open. Approved SPEC and ADRs were committed before plan started. |
| 11, missing `test_command`, second half | PASS | The SPEC names Python, Django, PostgreSQL, uv, and `uv run manage.py test`; config has no `test_command`. The final report identified the mismatch and assigned the config update to the maintainer. Config was unchanged. |

Additional observation: the architect's numbered decision options were followed by a policy quote. The model made no
tool call after the question, but the options were not the final message content. This is not a failure of the selected
cases above.

## Dated report: 2026-10-24

Scope: #67, model invocation. Selected: case 1's package subchecks as direct checks; cases 12 and 13 in Claude Code.
Codex and Kiro CLI: SKIP, no session in those harnesses. Other cases are outside this change. Source, fixture,
model, and usage are in the [wkc-backlog report](./wkc-backlog.md#dated-report-2026-10-24); session S1 ran both cases.

| Case | Result | Evidence |
|---|---|---|
| 1, selected subchecks | PASS, direct | PyYAML: `disable-model-invocation: false`, `allow_implicit_invocation: true`, names match, five opening fields; **When to use it** names people, a model acting on a person's request, and `wkc-backlog`, never `wkc-yolo`, and keeps the SPEC at `Status: draft` until the person approves it. Installed copies equal the archive by `diff -r`. |
| 12 | PASS | wkc-backlog case 33: a `Skill(wkc-architect)` call; the SPEC reads `Status: draft`; `issues_dir` unchanged. |
| 13 | PASS | S1's first prompt, before any skill ran, asked how to upper-case a string in bash. The JSONL shows no tool call of any kind in that turn, so no skill loaded and no file changed. |
