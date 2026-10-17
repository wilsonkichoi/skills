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
   PASS: one ticket file per drafted ticket, each with the milestone named as the ROADMAP heading, in draft order by
   id, all at `ready`. Every `blocked_by` holds real ids in the right direction and matches the draft, with no edge
   that only encodes priority. `wkc-tracker next`, read independently from the files, excludes every ticket with an
   open blocker. The ROADMAP reads `Status: approved (YYYY-MM-DD)` with the run date, and the PRD and SPEC are unchanged.
   The transcript shows the `wkc-tracker` skill invoked before the first ticket file is written.

6. **Existing work.** Before invoking, hand-write one ticket in `issues_dir` that covers part of the first milestone
   under a different title.
   PASS: the draft names that ticket as existing work instead of drafting the same scope again, and after publishing
   no two tickets cover the same outcome.

7. **Spec gap and unknown.** Remove the error responses from one contract the first milestone needs.
   PASS: the draft does not invent the missing responses; the report names the gap as work for `wkc-architect`.
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

## Dated report: 2026-10-17

Scope: new skill. Cases 1 and 2 as direct checks; cases 3 to 10 in Claude Code on Sonnet 5.5. Codex and Kiro CLI are
out of scope, by the maintainer's choice.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Clean export of the candidate tree, `skills` 1.7.2. Discovery lists `wkc-architect`, `wkc-help`, `wkc-plan`, `wkc-research`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (7 public of 8 shipped `SKILL.md`). Frontmatter and `agents/openai.yaml` parse; both invocation settings manual; five fields in order. `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-plan`, identical to source by `diff -r`. |
| 2, document ownership | PASS, direct | `wkc-plan` writes only `roadmap_file` and names the tracker verbs `list`, `show`, `milestone`, `create`, and `move`, all in the `wkc-tracker` verb table. It never writes the PRD or SPEC and never offers to approve them. `wkc-architect` names `wkc-plan` as its next step; the README names it as the ROADMAP's writer. The ROADMAP outline has no per-milestone status or ticket list. |
| 3 to 10 | SKIP | Pending the maintainer's session budget. |
