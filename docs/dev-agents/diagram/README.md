# Shipped skills workflow

Open [diagram.html](diagram.html) in a browser, including directly from disk without networking.
Drag the details panel's left edge to resize it on desktop. Focus the edge to use Left/Right, Home, or End.
The panel starts at half the canvas width and uses the selected region's colors. Its backdrop darkens the main canvas.
Width stays between 280 pixels and the canvas width minus 200 pixels. It persists through node navigation and reopening until reload.
Narrow layouts keep the full-width bottom sheet.
Selection keeps neighboring cards visible without zooming in. Closing centers the current card and preserves zoom.
Tinted boxes group Configuration, Coordination, Documentation, and Independent cards. Purple, green, amber, and gray distinguish those regions in both themes.
The map contains all five shipped definitions in this repository: `wkc-setup`, `wkc-tracker`,
`wkc-workflow-diagram`, `wkc-help`, and internal `wkc-skills-release`. Planned skills are excluded.
Every card is a skill. External systems, outputs, and results appear in the owning skill's details.
The four system cards and their six action arrows are removed at the user's direction.
No skill-to-skill runtime action is established by these definitions, so the current map has no arrows.
The configured backend and prerequisite remain in tracker details. Help's installer operations remain conditional on a person's request.
Future arrows default to workflow actions and runtime interactions between skills, following the meaning requested from `.local/architecture.excalidraw`.
They do not show prerequisites or automatic skill invocation. The sketch supplies no planned skills or obsolete distribution details.
`wkc-skills-release` publishes this collection without setup or project configuration.

## Sources and ownership

| Node | Definition | Relevant contract |
| --- | --- | --- |
| wkc-setup | [skills/wkc-setup/SKILL.md](../../../skills/wkc-setup/SKILL.md) | Interview, configuration, scaffolding, and tracker initialization |
| wkc-tracker | [skills/wkc-tracker/SKILL.md](../../../skills/wkc-tracker/SKILL.md) | Reads the backend from setup's config; manages tickets in seven statuses |
| wkc-workflow-diagram | [skills/wkc-workflow-diagram/SKILL.md](../../../skills/wkc-workflow-diagram/SKILL.md) | Read definitions and update offline diagrams without executing the skills |
| wkc-help | [skills/wkc-help/SKILL.md](../../../skills/wkc-help/SKILL.md) | Answers from installed definitions; gives installer commands and runs changes only on a person's request |
| wkc-skills-release | [skills/wkc-skills-release/SKILL.md](../../../skills/wkc-skills-release/SKILL.md) | Internal maintainer skill; clean synchronized main and authenticated GitHub access; merged collection publication without setup |

Setup and diagram file outputs are described in their own cards. Setup's label creation and tracker's GitHub Issues operations use
[docs/dev-agents/config.md](../config.md) as backend evidence. Help's card describes the installer; the release card describes tags and GitHub Releases.
Links from the removed system cards remain available through their owning skill cards or the definitions linked above.

Inputs are [workflow.json](workflow.json) and [layout.json](layout.json).
All positions and content are authored data; HTML is generated.
The generator version is **0.0.13**, recorded in the installed skill's `assets/manifest.json`.
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
| Desktop help details | [Image](screenshots/desktop-light-help-details.png) | [Image](screenshots/desktop-dark-help-details.png) |
| Tablet overview | [Image](screenshots/tablet-light.png) | [Image](screenshots/tablet-dark.png) |
| Tablet details | [Image](screenshots/tablet-light-details.png) | [Image](screenshots/tablet-dark-details.png) |
| Tablet help details | [Image](screenshots/tablet-light-help-details.png) | [Image](screenshots/tablet-dark-help-details.png) |
| Phone overview | [Image](screenshots/phone-light.png) | [Image](screenshots/phone-dark.png) |
| Phone details | [Image](screenshots/phone-light-details.png) | [Image](screenshots/phone-dark-details.png) |
| Phone help details | [Image](screenshots/phone-light-help-details.png) | [Image](screenshots/phone-dark-help-details.png) |

The current details screenshots select `wkc-skills-release`; the help screenshots select `wkc-help`.
The dated results below describe earlier versions of the map.

On 2026-09-24, Chromium loaded the three-node HTML offline at 1440 × 900, 768 × 1024, and
390 × 844 in both themes. All 12 screenshots were regenerated. Assertions checked fitted card
bounds, the edge count, selection, Escape, page errors, and absence of network requests.
Desktop light overview and phone dark details screenshots were visually inspected.
The phone sheet scrolls independently; commands below the fold remain reachable.

## Implementation verification

### Skill cards only, 2026-10-07

The user superseded the auxiliary-system design: every card must represent a skill, with systems and results inside its notes.
The map now has exactly five shipped skill cards and no edges. Four system cards, six edges, and their positions/routes were removed.
Actions moved into the owning skill details: setup files and labels, tracker tickets, diagram files, help installer operations, and release tags/releases.
The five skill IDs, labels, summaries, commands, When text, lanes, and coordinates remain unchanged. Existing links remain; relevant system links were added.
Source contracts are listed above; source definitions establish no runtime skill-to-skill actions here. No invocation edges were invented.
The authoring source, examples, root docs, and public runbook now require skill cards only while preserving legacy authored cards until conversion is directed.
Repository version stays **0.0.16** under the one-version-per-PR rule; renderer/helper/schema remain unchanged at generator **0.0.11**.

Selected focused checks used Node **v24.11.1** and Chrome **154.0.8037.98** in the current session, without additional AI sessions or backend writes.
Scope, authorized removals, skill-field preservation, and unchanged positions passed direct comparisons against the pre-conversion JSON.
Repository check/build and both complete README examples passed without warnings; example inputs remained unchanged and repeated builds were identical.
Offline `file://` browser checks passed at 1440 × 900, 768 × 1024, and 390 × 844 in both themes, with five cards and zero edges.
All 18 screenshots were refreshed. Assertions checked card bounds, overlap, selected help/release panels, keyboard selection, focus return, and links.
All five panels expose their skill notes. No page exceptions or HTTP requests occurred. Preview and Chrome stopped; neither endpoint answered afterward.
Visual inspection sampled desktop light, tablet dark, phone light, desktop light release details, phone dark release details, and phone light help details.
Physical touch, screen readers, other browsers, command copying, and model instruction following were not rerun for this change.
Raw evidence is in the ignored diagram `.cache/skill-only/` directory. Earlier records below describe preceding versions of the map.

### Release card correction, 2026-10-07

Review found that the release card incorrectly limited installation to an exact name.
The [release README](../../../skills/wkc-skills-release/README.md) also documents bulk installation with `INSTALL_INTERNAL_SKILLS=1`.
The card now says "excluded from ordinary bulk installation". Only that body text and generated HTML changed in the map.
Check/build passed without warnings. All other authored content, layout, and screenshots remain unchanged.
No browser checks were rerun. Existing release details screenshots retain the earlier wording.

### Workflow actions, 2026-10-07

The user selected workflow actions instead of prerequisite arrows after inspection of `.local/architecture.excalidraw`.
That sketch supplies arrow meaning only. No planned skills or obsolete distribution details were copied.
Sources remain at `5802c662ed9ab3d918e315e86b8eb939651c53db`; all definitions and config were readable.
All five skill cards and their coordinates remain unchanged. The subtitle now states the arrow meaning.
Removed `configured-backend` and its route. Added four system nodes and six routed action edges:

| Action | Source evidence |
| --- | --- |
| setup → Project files: Configures | Setup sections 3 and 4 scaffold files and add the context reference |
| setup → GitHub Issues: Creates labels | Setup section 5 creates missing open-status labels for the GitHub backend |
| workflow-diagram → Project files: Builds map | Diagram output and sections 2–5 write diagram files |
| tracker → GitHub Issues: Reads / writes | Tracker contract and verbs manage tickets in the configured backend |
| help → Skills installer: Runs on request | Help section 5 runs installer commands only at a person's request |
| skills-release → Collection on GitHub: Publishes | Release section 5 publishes and verifies collection tags and releases |

Selected direct checks covered arrow semantics, scope, preservation, route geometry, offline rendering,
details relationships, keyboard navigation, command copying, simulated touch, and preview cleanup.
Generator **0.0.11**, Node **v24.11.1**, and Chrome **154.0.8037.98** were used without other AI sessions or backend writes.
Check/build passed without warnings. Sampled routes avoid cards and each other.
All 18 screenshots were regenerated and visually reviewed at 1440 × 900, 768 × 1024, and 390 × 844 in both themes.
Fitted cards and labels do not overlap. Selected cards, panels, and controls fit.
Offline `file://` checks made no HTTP requests and produced no page exceptions.
Keyboard checks passed for both new skills in all six combinations and all nine panels at desktop and phone sizes.
Every panel lists exactly its incident actions. Escape restores focus and the previous fitted view.
All four help/release commands copied exactly; Previous/Next and reachable phone links passed.
Simulated touch pan, pinch, cancellation, and both new skill taps passed.
SIGTERM stopped preview and Chrome by their recorded process IDs; neither endpoint answered afterward.
Physical touch, screen readers, Safari, and Firefox are SKIP because they were not used.
No source conflicts or unreadable sources remain. Earlier results below describe the preceding maps.

### Five shipped skills, 2026-10-07

Sources were read at repository commit `5802c662ed9ab3d918e315e86b8eb939651c53db`.
All five source definitions were readable and matched the contracts recorded above.
Added `help` at (400, 360) and `skills-release` at (800, 360), without adding relationships.
No existing node, text, lane, position, edge, or route changed. No nodes or edges were removed.
No source conflicts or unreadable definitions remain. Planned skills are excluded.
Generator **0.0.11** rebuilt the HTML; Node **v24.11.1** and Chrome **154.0.8037.98** performed direct checks.

Selected coverage: authored-data preservation, shipped-skill scope, helper check/build,
offline rendering, preview lifecycle, visual layout, and interactions for the added nodes.
These are focused diagram checks in the current Codex session, without backend access or other AI sessions.

| Check | Result | Independent evidence |
| --- | --- | --- |
| Scope and preservation | PASS | Compared node labels with all source `skills/*/SKILL.md` paths; deep comparisons preserved every original node and all existing workflow fields, positions, and routes |
| Helper check/build | PASS | Documented commands passed with the main documentation base and no warnings |
| Offline rendering | PASS | `file://` loaded with networking disabled in all six viewport/theme combinations; only the HTML file was requested; no page exceptions occurred |
| Layout and visual review | PASS | Reviewed all 18 screenshots at 1440 × 900, 768 × 1024, and 390 × 844 in light and dark themes; fitted cards and the edge label do not overlap; selected cards, panels, and controls fit |
| Keyboard and navigation | PASS | Enter opens both added nodes; Tab remains in details; Escape restores visible focus and fitted coordinates; Previous/Next reaches both disconnected nodes |
| Commands and links | PASS | All four added command buttons copied their exact text to the clipboard through preview; documentation links resolve against the main base; phone panel links remain reachable by scrolling |
| Simulated touch | PASS | Chrome touch events exercised pan, pinch, cancellation, and taps on both added cards |
| Preview and browser cleanup | PASS | Preview answered before inspection; SIGTERM stopped both recorded process IDs; neither loopback endpoint answered afterward |
| Physical touch, screen readers, Safari, Firefox | SKIP | No physical device, screen reader, or additional browser was used |

Twelve existing screenshots were regenerated and six help screenshots were added.
Historical verification notes below are retained. They are not new evidence for this update.

The [public runbook](../../../validation/wkc-workflow-diagram.md) defines the cases. Results below separate
renderer checks, installed-helper checks, and agent behavior. Raw evidence stays in the ignored
`.local/runs/workflow-diagram/` directory of the checkout that ran it.

### Focus restoration fix, 2026-10-01

This follow-up to reviewed commit `0f0cc22` restores the view saved before details opened.
Previous/Next retains that saved view. Closing restores manual pan and zoom, or fits the current canvas
when the opening view was fitted, before returning keyboard focus. Repository version remains **0.0.11**
under the one-version-per-PR rule; renderer version is **0.0.11**. The repository HTML was rebuilt without changing its JSON.

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

## Region styling and selection context, 2026-10-07

Generator **0.0.13** implements the half-width desktop panel, lane accents, dark backdrop, and retained selection context.
The local `agent-toolkit/plugins/dev/diagram/README.md` and generated reference informed sizing, region boxes, colors, and source ownership.
This map uses its own canonical renderer under `tools/workflow-diagram/src/`; generated HTML is rebuilt from its authored JSON and shipped assets.

Four tinted boxes enclose all five cards without moving them. The release card belongs to the neutral Independent region.
Documentation changes from teal to amber to distinguish it from green Coordination.
Selecting a disconnected card includes its nearest neighbor. Connected diagrams include direct neighbors and their routes.
Opening never increases zoom. Closing centers and focuses the current card while keeping its zoom.
This supersedes the older restoration checks recorded above.

`npm run check` passed 76 unit/package checks and 38 browser tests. Final region changes passed two focused browser tests.
The repository helper check and byte-identical rebuild passed. All 18 screenshots were regenerated at the three documented sizes in both themes.
Sampled visual review covered desktop light/dark help details, tablet light overview and dark help details, and phone light help details and dark release details.
Offline visual checks reported no HTTP requests, page exceptions, or page overflow.
Raw evidence remains in ignored `.cache/context-visual-results.json`; the focused report is in `validation/wkc-workflow-diagram.md`.
