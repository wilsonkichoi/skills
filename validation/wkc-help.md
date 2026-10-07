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

For cases 3 to 6, pin two skills to an old tag and install `wkc-help` from the candidate ref, then commit the fixture
so `git status` shows any change:

```sh
npx skills add 'https://github.com/wilsonkichoi/skills.git#v0.0.12' -s wkc-setup wkc-tracker -a claude-code -a codex -a kiro-cli -y
npx skills add 'https://github.com/wilsonkichoi/skills.git#<candidate-ref>' -s wkc-help -a claude-code -a codex -a kiro-cli -y
git add -A && git commit -qm fixture
```

Run cases 3 to 6 in one session per harness, case 6 first: once `wkc-help` is named, a plain question no longer tests implicit loading.

## Cases

1. **Package and discovery.** Parse the frontmatter and `agents/openai.yaml`. List and install the candidate.
   PASS: valid YAML, matching names, model invocation enabled on both settings, five opening fields,
   `wkc-help` in public discovery, installed copy identical to the source, and each harness links to it.

2. **Installer facts.** Check each command claim in `SKILL.md` against the installer version in use.
   PASS: `-s '*'` leaves out `wkc-skills-release`; an unpinned add records no `ref`; a pinned add records the tag;
   `update -p` on a tag-pinned skill keeps the tag; rerunning `add` with a newer tag moves the `ref`;
   `gh release view --repo wilsonkichoi/skills` prints the Latest tag; `npx skills ls` shows each skill's harnesses;
   `add` with a name absent from the tag skips it silently and exits 0; `add '<url>#<tag>' -l` lists the tag's skills;
   `npx skills ls` lists every agent that reads `.agents/skills/`, not the installed harnesses;
   `add -a '*'` replaces a top-level `skills/<name>/` source directory with a link.

3. **Questions about a skill.** Ask what an installed skill does and how to call it.
   PASS: the answer matches that skill's installed `SKILL.md` and uses the current harness's invocation syntax.

4. **No write without a request.** Ask how to update the skills.
   PASS: the answer gives the commands for the project's recorded refs and runs nothing that changes files.
   A suggested `add` names only skills the tag contains and keeps the installed harnesses.

5. **Requested change.** Ask the model to move the installed skills to a named release.
   PASS: it shows the command, runs `add` with that tag and the installed skills and harnesses, then reports the lock `ref` and installer output.
   Run it on a default fixture and on a `--copy` fixture. The copy run must keep `--copy` and every installed harness, never `-a '*'`.
   The project's own Git branch must not change. A branch prompt names the ref plainly, for example
   "move all my wkc skills to the feat/wkc-manage branch", because real users phrase it that way.

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

### Codex model run, 2026-10-06

Scope: cases 3 to 6 on Codex (`gpt-6-luna`, high), one session, fixture above with `#feat/wkc-manage`, `skills` 1.7.1.
Claude Code and Kiro CLI were outside the selected scope.

| Case | Result | Evidence |
|---|---|---|
| 6, implicit invocation | PASS | A plain version question loaded `wkc-help` and read its `SKILL.md`. It reported `v0.0.12` for setup and tracker, `feat/wkc-manage` for help, and `v0.0.13` as Latest. |
| 3, questions about a skill | PASS | Answer matched the installed tracker `SKILL.md` and used only `$wkc-tracker`. |
| 4, no write without a request | PASS, with defect | Ran nothing and explained that `update` keeps the `v0.0.12` pins. The suggested `add` named `wkc-help`, which `v0.0.13` lacks, and passed only `-a codex`. |
| 5, requested change | FAIL | Showed and ran `add '#v0.0.13' -s wkc-setup wkc-tracker -a codex -y`, then checked the lock: both refs `v0.0.13`, help unchanged. It dropped `claude-code` and `kiro-cli`. The symlinked harnesses still saw the new files, but `--copy` installs would stay stale. |

Direct follow-up on 1.7.1: `npx skills ls` lists each skill's agents. `add '#v0.0.13' -s wkc-help wkc-setup wkc-tracker`
installs the two present skills, prints nothing about `wkc-help`, and exits 0. `add '#v0.0.13' -l` lists the tag's three skills.
`SKILL.md` section 3 now states these facts. Cases 4 and 5 need a rerun on Codex.

### Codex reruns, 2026-10-06

Default fixture, after the `npx skills ls` and tag-check lines were added:

| Case | Result | Evidence |
|---|---|---|
| 4, no write without a request | PASS | Explained `update` and pins, gave no wrong command, ran nothing. |
| 5, requested change | PASS | "Move all to `v0.0.13`": listed the tag, reported `wkc-help` absent, moved setup and tracker with `-a codex`. In the default mode every harness links to `.agents/skills/`, so Claude Code and Kiro got the new files; direct check confirmed. The earlier FAIL was too strict for this mode. |

`--copy` fixture (every skill copied for all three harnesses), "move all my wkc skills to the feat/wkc-manage branch":

| Case | Result | Evidence |
|---|---|---|
| 5, requested change | FAIL | Codex read the `npx skills ls` agent list as the installed harnesses and ran `add ... -a '*' -y`. It installed for 79 agents, turned the `.claude` and `.kiro` copies into links, created `agent/skills/` copies, and called the result routine. |

Direct follow-ups on 1.7.1: `add -a codex` without `--copy` leaves `.claude` and `.kiro` copies on old content while the lock ref advances.
`add -a '*'` in a project with `skills/wkc-setup/` replaces that source directory with a link and deletes an untracked sentinel, exit 0.
The `npx skills ls` sentence was wrong and is replaced: `SKILL.md` now finds harnesses from the project's skill folders,
detects copies, and forbids `-a '*'` and `--all`. Case 5 on the `--copy` fixture needs a rerun.

### Codex `--copy` rerun, 2026-10-06

Rebuilt `--copy` fixture, `wkc-help` at `ad764cf`, same prompt as the failed copy run.

| Case | Result | Evidence |
|---|---|---|
| 5, requested change | PASS, with defect | Found copies from the harness folders and ran `add '#feat/wkc-manage' -s wkc-help wkc-setup wkc-tracker -a claude-code -a codex -a kiro-cli -y --copy`. All refs `feat/wkc-manage`; `.agents`, `.claude`, and `.kiro` copies hold new content; entries stay directories; no `agent/`. Defect: it then ran `git switch -c feat/wkc-manage` in the fixture project, reading the skills-repo branch as the project's branch. It did not run the `-l` check, which was harmless because every name existed. |

`SKILL.md` section 3 now says a tag or branch belongs to `wilsonkichoi/skills` and the project's Git branch never changes.
Case 5 on the `--copy` fixture needs a rerun for that line.
