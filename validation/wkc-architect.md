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

Scope: new skill. Cases 1 and 2 as direct checks. Cases 3 to 10 need new AI sessions in Claude Code with Sonnet 5.5,
which wait on the maintainer's authorization and budget. Codex and Kiro CLI are out of scope, by the maintainer's choice.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Clean export of the working tree, `skills` 1.7.2. Discovery lists `wkc-architect`, `wkc-help`, `wkc-research`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (6 public of 7 shipped `SKILL.md`). Frontmatter and `agents/openai.yaml` parse; both invocation settings manual; five fields in order. `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-architect`, identical to source by `diff -r`. |
| 2, document ownership | PASS, direct | `wkc-architect` mentions the ROADMAP only to say it does not write it, that `wkc-plan` owns it, and that **Changes** entries name milestones to review; it names no tracker write verb. `wkc-research` names `wkc-architect` as its next step. `wkc-setup` step 3 and the README list research, architect, and plan as the writers of the PRD, SPEC, and ROADMAP, in that order. |
| 3 to 10 | SKIP | Not yet authorized. |
