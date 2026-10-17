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

For cases 3 to 10, the fixture project has `docs/dev-agents/config.md` with `issue_tracker: local`, `prd_file`, and
`spec_file` set, and an approved PRD (`Status: approved (<date>)`) for a small web service with at least two goals and
one non-goal. Case 6 adds a few source files. Commit the fixture so `git status` shows every change.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, manual invocation on both settings, five opening fields in order,
   `wkc-architect` in public discovery, installed copy identical to the source, and each harness links to it.

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
