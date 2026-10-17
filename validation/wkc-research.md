# wkc-research validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Preparation

Export a clean candidate tree, because local installation copies ignored files too, then list and install it
into a throwaway Git project. Record the installer version from `npx skills --version`.

```sh
npx skills add "<clean-candidate>" -l
npx skills add "<clean-candidate>" -s wkc-research -a claude-code -a codex -a kiro-cli -y
```

For cases 3 to 9, the fixture project has `docs/dev-agents/config.md` with `prd_file` set, and a `research/`
folder holding two short notes that disagree on one fact. Commit the fixture so `git status` shows every change.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, manual invocation on both settings, five opening fields in order,
   `wkc-research` in public discovery, installed copy identical to the source, and each harness links to it.

2. **Setup no longer writes a spec.** Read `skills/wkc-setup/SKILL.md`.
   PASS: no step writes or offers to write `spec_file`, the steps run 1 to 6 with no gap, and every
   "step N" reference names an existing step.

3. **Research supplied.** Invoke with the `research/` notes.
   PASS: PRD claims link to the notes, the disagreement is visible in the PRD or its open questions,
   and no source is cited that the fixture does not contain.

4. **Empty research, internal tool.** Invoke in a fixture with no research for a maintainer-only tool.
   PASS: the interview treats the maintainer as the customer and the PRD contains no market or usage figures.

5. **Ask, then stop.** Invoke with material that leaves the non-goals open.
   PASS: the turn ends on a numbered question with a recommended option, and nothing already in the material is asked.

6. **Unreadable source.** Supply a URL or file that cannot be read.
   PASS: the report names it and the PRD presents nothing from it as established.

7. **Custom path.** Set `prd_file` to a non-default path.
   PASS: `git status` shows only that file changed; no `docs/dev-agents/PRD.md` appears.

8. **Approval.** Review the draft without approving, then approve.
   PASS: the line under the title reads `Status: draft` until approval, then `Status: approved (YYYY-MM-DD)` with that day's date.

9. **Update.** On an approved PRD, change a goal; separately, add agreeing evidence.
   PASS: the goal change resets the status to draft, the replaced goal is gone from **Goals**, and a dated **Changes**
   entry names what it replaced and the downstream work to review;
   the evidence-only update keeps the approval. User-written sections outside the change are unchanged by `git diff`.

## Dated report: 2026-10-16

Scope: new skill and the `wkc-setup` removal. Cases 1 and 2 as direct checks. Cases 3 to 9 need new AI sessions, which were not authorized.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Clean export of the working tree, `skills` 1.7.2. Discovery lists `wkc-help`, `wkc-research`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (5 public of 6 shipped `SKILL.md`). Frontmatter and `agents/openai.yaml` parse; both invocation settings manual; five fields in order. `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-research`, identical to source by `diff -r`. |
| 2, setup no longer writes a spec | PASS, direct | `wkc-setup` sections run 1 to 6; the only "step 6" reference is the report's commit offer; no remaining mention of `spec_file` or archaeology outside the "do not reverse-engineer" line. |
| 3 to 9 | SKIP | No authorized AI sessions. |
