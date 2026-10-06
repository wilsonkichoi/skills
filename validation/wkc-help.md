# wkc-help validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Record PASS, FAIL, or SKIP for selected cases. Keep direct checks separate from harness behavior.
Keep raw logs and fixtures outside tracked files.

## Preparation

Export a clean candidate tree, because local installation copies ignored files too.
Install into a throwaway Git project, and record the installer version from `npx skills --version`:

```sh
npx skills add "<clean-candidate>" -l
npx skills add "<clean-candidate>" -s '*' -a claude-code -a codex -a kiro-cli -y
```

Cases about pinned updates need published tags, so they use `wilsonkichoi/skills` directly.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, model invocation enabled on both settings, five opening fields,
   `wkc-help` in public discovery, installed copy identical to the source, and each harness links to it.

2. **Installer facts.** Check each command claim in `SKILL.md` against the installer version in use.
   PASS: `-s '*'` leaves out `wkc-skills-release`; an unpinned add records no `ref`; a pinned add records the tag;
   `update -p` on a tag-pinned skill keeps the tag; rerunning `add` with a newer tag moves the `ref`;
   `gh release view --repo wilsonkichoi/skills` prints the Latest tag.

3. **Questions about a skill.** Ask what an installed skill does and how to call it.
   PASS: the answer matches that skill's installed `SKILL.md` and uses the current harness's invocation syntax.

4. **No write without a request.** Ask how to update the skills.
   PASS: the answer gives the commands for the project's recorded refs and runs nothing that changes files.

5. **Requested change.** Ask the model to move the installed skills to a named release.
   PASS: it shows the command, runs `add` with that tag and the installed skills and harnesses, then reports the lock `ref` and installer output.

6. **Implicit invocation.** Ask a plain question about these skills without naming `wkc-help`.
   PASS: the harness loads `wkc-help`. Kiro CLI has no setting for this; record what it does.

## Dated report: 2026-10-05

Scope: new skill. Cases 1 and 2 as direct checks. Cases 3 to 6 need new AI sessions, which were not authorized.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Candidate export of the working tree. Discovery lists `wkc-help`, `wkc-setup`, `wkc-tracker`, `wkc-workflow-diagram` (4 public of 5 shipped). `.claude/skills/` and `.kiro/skills/` link to `.agents/skills/wkc-help`, identical to source by `diff -r`. |
| 2, installer facts | PASS, direct | Against `wilsonkichoi/skills`: `#v0.0.12` add records `ref: v0.0.12`; `update -p -y` keeps `v0.0.12` and removes an appended local edit; `#v0.0.13` add moves to `v0.0.13`; unpinned `-s '*'` records no ref and installs no `wkc-skills-release`; `gh release view` prints `v0.0.13`. |
| 3 to 6 | SKIP | No authorized AI sessions. |

Installer version for the rows above: `skills` 1.7.0.

### Unpinned installer, 2026-10-06

The docs now call `npx skills` without a version. Cases 1 and 2 were rerun on `skills` 1.7.1, the current release.

| Case | Result | Evidence |
|---|---|---|
| 1, package and discovery | PASS, direct | Same results as 1.7.0: four public skills, identical installed copy, both harness links. |
| 2, installer facts | PASS, direct | Same ref results as 1.7.0. One difference: 1.7.1 `update` reports "All project skills are up to date" for an unchanged tag and keeps the local edit, where 1.7.0 refetched and replaced it. `SKILL.md` makes no claim about local edits. |
