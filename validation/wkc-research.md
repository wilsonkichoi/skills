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

For cases 3 to 10, the fixture project has `docs/dev-agents/config.md` with `prd_file` set, and a `research/`
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

10. **Vague answer.** Answer the problem question with a wish, such as "make it better for users".
    PASS: the next turn pushes back once with a specific question, never twice; after the user restates the same
    answer, the PRD records it as the user's decision.

## Dated report: 2026-10-16

Scope: new skill and the `wkc-setup` removal. Cases 1 and 2 as direct checks. Cases 3 to 9 need new AI sessions, which were not authorized.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Clean export of the working tree, `skills` 1.7.2. Discovery lists `wkc-help`, `wkc-research`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (5 public of 6 shipped `SKILL.md`). Frontmatter and `agents/openai.yaml` parse; both invocation settings manual; five fields in order. `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-research`, identical to source by `diff -r`. |
| 2, setup no longer writes a spec | PASS, direct | `wkc-setup` sections run 1 to 6; the only "step 6" reference is the report's commit offer; no remaining mention of `spec_file` or archaeology outside the "do not reverse-engineer" line. |
| 3 to 9 | see below | Run in Claude Code, reported in the next section. |

### Claude Code run, 2026-10-17

Scope: cases 3 to 9 in Claude Code 2.1.302 with Sonnet 5.5 (`claude-sonnet-5-5`), authorized by the maintainer with a
limit of 9 sessions and $2 per session. Codex and Kiro CLI are out of scope for this run, by the maintainer's choice.
Skill installed by `npx skills add <candidate> -s wkc-research -a claude-code` into a fixture with a `local` tracker
config and two research notes that disagree on the no-show rate. 8 sessions used; cases 4 and 8 took two turns each
through `--resume`. The case 3 pilot ran with the parent session's environment; every later session ran with a clean one.
Claude Code's reported cost for all ten turns was $0.89.

| Case | Result | Evidence |
|---|---|---|
| 3, research supplied | PASS | Every claim links to one of the two notes; both no-show figures appear with the conflict left open; no other source is cited. |
| 4, empty research, internal tool | PASS | "Who it is for: only the maintainer"; first turn asked one numbered question with a recommended option; the PRD has no market or usage figures. |
| 5, ask, then stop | PASS | The turn ended on a numbered question (non-responders) with option 1 marked recommended; nothing the notes settle was asked. It wrote a draft before asking, which the case allows. |
| 6, unreadable source | PASS | The missing PDF and the unresolvable URL are named in the reply, in **Evidence** as not read, and in **Open questions**; no competitor or market content appears. |
| 7, custom path | PASS | With `prd_file: docs/product/requirements.md`, `git status -uall` shows only that file. |
| 8, approval | PASS | `Status: draft` after a review turn that changed content without approving; `Status: approved (2026-10-17)` after approval, matching the run date. |
| 9, update | PASS | Replacing reply-to-confirm reset the status to draft, removed the old goal and outcome, and added a dated **Changes** entry naming what it replaced and the SPEC or ticket work to review. Folding in an agreeing interview kept `Status: approved` and touched only evidence and assumption wording. |

### Wording change, 2026-10-18

Added from the source cross-check: push back once on a vague answer, who the product is not for, and ranked goals. Static checks only: frontmatter and `agents/openai.yaml` unchanged,
no em dash in the changed lines, and the outline additions are comments or optional lines. Case 10 is new and
SKIP: no AI sessions were authorized for this change. Earlier cases keep their evidence; their checks did not change.
