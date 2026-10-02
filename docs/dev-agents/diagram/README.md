# Shipped skills workflow

Open [diagram.html](diagram.html) in a browser, including directly from disk without networking.
The map contains the three shipped definitions in this repository: `wkc-setup`, `wkc-tracker`, and
`wkc-workflow-diagram`. Planned skills are excluded. `wkc-setup` writes the config that `wkc-tracker` requires.
`wkc-workflow-diagram` supports projects without setup or config, so it remains independent.

## Sources and ownership

| Node | Definition | Relevant contract |
| --- | --- | --- |
| wkc-setup | [skills/wkc-setup/SKILL.md](../../../skills/wkc-setup/SKILL.md) | Interview, configuration, scaffolding, and tracker initialization |
| wkc-tracker | [skills/wkc-tracker/SKILL.md](../../../skills/wkc-tracker/SKILL.md) | Reads the backend from setup's config; manages tickets in seven statuses |
| wkc-workflow-diagram | [skills/wkc-workflow-diagram/SKILL.md](../../../skills/wkc-workflow-diagram/SKILL.md) | Read definitions and update offline diagrams without executing the skills |

Inputs are [workflow.json](workflow.json) and [layout.json](layout.json).
All positions and content are authored data; HTML is generated.
The generator version is **0.0.12**, recorded in the installed skill's `assets/manifest.json`.
The renderer source and maintainer build are in `tools/workflow-diagram/`; the skill ships generated assets.

Documentation base:
`https://github.com/wilsonkichoi/skills/blob/main/`.
The repository remote and its default branch establish this base. Rendering does not fetch these links.

## Regenerate

Run from the repository root. These commands use the repository's skill; an installed copy can use its absolute helper path.

```sh
node skills/wkc-workflow-diagram/scripts/diagram.mjs check --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/main/
```

```sh
node skills/wkc-workflow-diagram/scripts/diagram.mjs build --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/main/
```

```sh
node skills/wkc-workflow-diagram/scripts/diagram.mjs preview --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/main/ --port 0
```

Open the printed loopback URL and stop preview after inspection.
Do not edit diagram.html directly. Keep temporary artifacts in the ignored `.cache/` directory here.

## Visual evidence

| State | Light | Dark |
| --- | --- | --- |
| Desktop overview | [Image](screenshots/desktop-light.png) | [Image](screenshots/desktop-dark.png) |
| Desktop details | [Image](screenshots/desktop-light-details.png) | [Image](screenshots/desktop-dark-details.png) |
| Tablet overview | [Image](screenshots/tablet-light.png) | [Image](screenshots/tablet-dark.png) |
| Tablet details | [Image](screenshots/tablet-light-details.png) | [Image](screenshots/tablet-dark-details.png) |
| Phone overview | [Image](screenshots/phone-light.png) | [Image](screenshots/phone-dark.png) |
| Phone details | [Image](screenshots/phone-light-details.png) | [Image](screenshots/phone-dark-details.png) |

On 2026-09-24, Chromium loaded the three-node HTML offline at 1440 × 900, 768 × 1024, and
390 × 844 in both themes. All 12 screenshots were regenerated. Assertions checked fitted card
bounds, the edge count, selection, Escape, page errors, and absence of network requests.
Desktop light overview and phone dark details screenshots were visually inspected.
The phone sheet scrolls independently; commands below the fold remain reachable.

## Implementation verification

The [public runbook](../../../validation/wkc-workflow-diagram.md) defines the cases. Results below separate
renderer checks, installed-helper checks, and agent behavior. Raw evidence stays in the ignored
`.local/runs/workflow-diagram/` directory of the checkout that ran it.

### Focus restoration fix, 2026-10-01

This follow-up to reviewed commit `0f0cc22` restores the view saved before details opened.
Previous/Next retains that saved view. Closing restores manual pan and zoom, or fits the current canvas
when the opening view was fitted, before returning keyboard focus. Repository version remains **0.0.11**
under the one-version-per-PR rule; renderer version is **0.0.12**. The repository HTML was rebuilt without changing its JSON.

Validation used Node **v26.7.0** and Chromium **154.0.8037.93**.

| Check | Result | Independent evidence |
| --- | --- | --- |
| Regression reproduction | PASS | Both new browser cases failed before the fix because the opening card had viewport intersection ratio 0 |
| Focus and view restoration | PASS | Fitted and manual pan/zoom cases exercise Escape, Close details, and backdrop after four Next selections; the fitted case also resizes to phone dimensions |
| Assets and unit/package suite | PASS | `npm ci`, `npm run build:assets`, and the asset, unit, package, and build stages of `npm run check` passed, including all 76 tests |
| Browser suite | PASS | All 31 tests passed with `npm run test:browser` after allowing fractional rounding in the new visibility assertion |
| Repository diagram | PASS | Documented check/build commands passed; offline HTML restored the original view and focus after navigation at 1440 × 900, 768 × 1024, and 390 × 844 |
| Installer, harness invocation, and manual visual checks | SKIP | Not rerun for this renderer fix; earlier evidence below is historical |
| Physical touch, screen readers, Safari, and Firefox | SKIP | Not tested in this follow-up |

### Main integration and manual review, 2026-10-01

This candidate merges main `074f28c` (PR #9) into workflow branch `f34a39e` and includes the local review edits.
Repository version is **0.0.11**; removing its changelog entry reproduces main's changelog byte-for-byte.
The workflow skill now uses the five opening fields required by main, with context and omitted-target behavior under Input.
Its manual invocation settings remain unchanged. Scope questions use a callable selector where available and numbered text otherwise.
The skill README includes complete matching JSON examples, explicitly labels individual snippets, and lists the installed helper and renderer files.
The maintainer README states that asset builds and checks must be run explicitly. The user confirmed completion of manual review.

| Check | Result | Independent evidence |
| --- | --- | --- |
| Main integration and release history | PASS | Main's five-field conventions, template, tracker changes, runbook additions, and released 0.0.10 entry are retained |
| Metadata and opening fields | PASS | PyYAML parsed all three shipped skills and Codex settings; names, five ordered fields, and manual invocation settings agree |
| Complete README examples | PASS | Extracted both JSON examples into an isolated project; shipped helper check/build passed without warnings |
| Repository diagram | PASS | Shipped helper check passed with the documented main documentation base; graph data and rendered output were not changed |
| Asset freshness and unit/package suite | PASS | `npm run check` accepted existing generated assets and passed all 76 tests, including offline read-only installation and preview lifecycle |
| Browser suite | PASS | The final `npm run check` passed all 29 browser tests, including details, keyboard focus, copy behavior, embedding, touch simulation, and offline output |
| Current harness invocation and visual review | SKIP | No new installed-agent invocation or screenshot inspection was performed; earlier results below remain historical evidence |

The first sandboxed suite could not bind loopback ports or create its nested OS sandbox.
An authorized rerun passed all unit/package tests but exposed a browser cleanup race: restoring data could reload the page before the source restart.
The test now waits for the source restart before restoring data, then waits for the original title.
The full suite passed after that correction. Renderer behavior and generator version **0.0.11** are unchanged.

Commands run from `tools/workflow-diagram/`:

```sh
npm run check
```

The repository helper command is the check command in [Regenerate](#regenerate).
This focused run does not claim new passes for installer discovery, agent interviews, physical touch hardware, screen readers, Safari, or Firefox.

### Merge validation, 2026-10-01

This candidate combines workflow branch `fc12830` with main `6aad9eb` (PR #8), at repository
version **0.0.10**. Main's 0.0.9 changelog entry remains unchanged. The new skill identifier is
`wkc-workflow-diagram`; the renderer remains version **0.0.11** because its behavior is unchanged.
Existing node IDs, coordinates, routes, and relationships are unchanged. Labels, commands, source
links, helper paths, examples, and active runbook instructions now use the current identifiers.
The results below cover this merge and rename; the earlier full validation remains historical evidence.

Environment: Node.js 24.11.1, skills 1.7.0, Chrome 154.0.8037.59, Codex CLI 0.159.3,
Claude Code 2.1.287, and Kiro CLI 2.26.0. Clean candidate exports and isolated project paths
containing spaces and Unicode were used. Raw logs and fixtures are under the ignored
`.local/runs/main-merge/` directory, never inside the installed skill.

| Check | Result | Independent evidence |
| --- | --- | --- |
| Main integration and version | PASS | Merge resolves both README and changelog conflicts; main's naming policy, renamed skills, templates, and historical changelog are retained; this branch uses 0.0.10 |
| Naming and invocation settings | PASS | All three directories, frontmatter names, headings, and display names agree; manual invocation settings remain unchanged; six contract lines are present |
| Discovery and installation, case 1 | PASS | Clean export lists exactly wkc-setup, wkc-tracker, and wkc-workflow-diagram; nine installed harness paths match the clean source byte-for-byte |
| Installed helper paths, case 2 | PASS | Generated Codex and Claude Code maps validate through canonical, Claude Code, and Kiro CLI paths from an unrelated directory |
| Assets and maintainer suite, case 16 | PASS | Assets rebuilt; freshness check passed; all 76 unit/package tests and 29 browser tests passed, including renamed fixture links |
| Repository HTML and screenshots, case 17 | PASS | Rebuilt HTML opened through file:// with networking disabled; 156 assertions across three sizes and both themes; all 12 screenshots regenerated |
| Visual review | PASS, with limits | Desktop light overview and phone dark details inspected; long skill names fit, selected card remains above the phone sheet, and controls remain visible |
| Codex invocation, case 19 | PASS, with limits | Explicit `$wkc-workflow-diagram` loaded the installed skill and generated a valid collect/publish map; check/build passed; browser and preview checks were SKIP because no connected browser was available and its sandbox blocked preview |
| Claude Code invocation, case 19 | PASS, with limits | Explicit `/wkc-workflow-diagram` loaded the installed skill and generated a valid collect/notes.md/publish map; check/build, screenshots, and preview lifecycle passed; fixture lacks commands and filters; drag/pinch and auto-reload were SKIP |
| Kiro CLI invocation, case 19 | SKIP | CLI required interactive browser authentication and never reached the skill; the stalled login process was stopped; installation and helper checks passed independently |

The repository commands are the three commands in [Regenerate](#regenerate). Maintainer commands,
run from `tools/workflow-diagram/`:

```sh
npm ci
npm run build:assets
npm run check
```

Clean candidate discovery and installation, run from an isolated project:

```sh
npx skills@latest add "<clean-candidate>" --list
npx skills@latest add "<clean-candidate>" --skill wkc-workflow-diagram -a claude-code -a codex -a kiro-cli -y
```

The generic skill-creator validator rejects the repository's required Claude Code extension,
`disable-model-invocation`. The repository metadata check accepts and verifies this extension;
no invocation setting was removed to make the generic validator pass.
Physical touch hardware, screen readers, Safari, and Firefox were not rerun. Earlier behavior
cases were not rerun as agent interviews for this naming change; their earlier results below do
not claim a new pass for this candidate.

### Validation, 2026-09-26

The skill was installed from a clean export of this branch on macOS 27.0 with Node.js 24.11.1
(packaging also on 22.23.1), Chrome 153, and `skills` 1.7.0. Agents: Kiro CLI 2.24.1 (`auto` model),
Claude Code 2.1.282, and Codex CLI 0.156.1, each on isolated fixtures whose paths contain spaces and Unicode.

The first pass failed three cases, and SKILL.md was revised until reruns passed:

- Case 10: Kiro rewrote authored text that a changed source contradicted. The skill now never rewrites
  existing text; it reports the conflict with suggested wording and ends on a numbered question.
- Case 4: agents wrote temporary files to `/tmp` or the project root and left preview servers running.
  Every file now stays in the diagram directory's `.cache/`, and the reference documents a background
  preview command whose process ID is the helper's, with a Node check that it stopped.
- Case 18: Codex recorded absolute paths in regeneration commands. Commands now use `--project .`.

Reruns also settled when the README stays untouched, that commands come only from sources, and what
makes scope ambiguous. The final text passed a 28-invocation sweep across the three harnesses; one
Kiro miss (a conflict reported but not recorded in the README) led to one added sentence, and its
cases (10 twice with answers, 11 unreadable, 12) then passed on Kiro.

| Runbook case | Result | Evidence |
| --- | --- | --- |
| 1. Discovery/install | PASS | Exactly three skills discovered; canonical `.agents` copy with Claude Code and Kiro CLI symlinks, identical to source; all manual settings and contract lines present |
| 2. Explicit target/symlink | PASS | `check`/`build` through all three install paths from a third directory; missing `--project` exits 1 and writes nothing |
| 3. Read-only/offline | PASS | `sandbox-exec` denied network (DNS and TCP) and writes outside the diagram directory; empty `PATH`; Node 24 and 22; install hashes unchanged |
| 4. Containment | PASS | Helper added only `diagram.html`; after every agent turn no preview or browser remained and no write landed outside the diagram directory |
| 5. Symlink escape | PASS | Six symlink variants refused, including a dangling output; sentinels unchanged |
| 6. No-config creation | PASS | All three harnesses built valid maps without config, running no diagrammed skill and inventing no commands |
| 7. No relevant input | PASS | Empty scope created nothing; an existing diagram stayed byte-identical |
| 8. Unrelated workflows | PASS | Minimal and branching examples: 96/96 browser checks each |
| 9. Preserve additions | PASS | Existing nodes, positions, and routes byte-identical; `audit` added with valid routes (all three harnesses) |
| 10. Source conflict | PASS | Disputed text kept, conflict recorded with suggestions, numbered question; answering `1` applied the wording only |
| 11. Removal/access | PASS | Confirmed removal cleaned node, position, edges, and routes; unreadable source kept the JSON and was recorded in the README |
| 12. Determinism | PASS | Unchanged runs left JSON, README, HTML, and screenshots byte-identical (all three harnesses) |
| 13. Last valid output | PASS | Eight invalid inputs failed with file and field errors, kept the prior HTML, and left no temp files |
| 14. Offline/text safety | PASS | Hostile text rendered literally; no script ran; only the HTML file was requested; Unicode deep link and copy verified |
| 15. Preview | PASS | Refresh, error retention, 404 for project files, EADDRINUSE, SIGTERM and SIGINT exit, port reuse |
| 16. Assets | PASS | Source, schema, helper, and asset edits fail freshness; rebuilds are byte-identical; notices match the bundle |
| 17. Visual/input | PASS, with limits | Renderer suite 76 + 29 passed; installed-helper maps passed 96/96 checks at three sizes in both themes |
| 18. Project record | PASS | Every README the agents wrote uses portable commands and no absolute paths or ports |
| 19. Harness behavior | PASS | All three loaded the installed skill; an ambiguous monorepo prompt ended on a numbered question, and `1` was accepted |
| 20. Integration | PASS | Map shows only `setup`, `tracker`, and `workflow-diagram`; committed HTML equals a rebuild; branch current with `main` |

SKIP: physical touch hardware, screen readers, Safari, and Firefox. Codex's sandbox blocked its own
preview bind and browser, and some Kiro and Claude runs had no browser tool; those in-agent visual
checks are SKIP, separate from the browser checks above. Chrome 153's command-line screenshot mode
never exited on the test machine, so a watchdog stopped it after 15 seconds during agent runs.

Earlier results from 2026-09-21 and 2026-09-24 are in this file's history. The original ignored MVP
was left unchanged during migration.
