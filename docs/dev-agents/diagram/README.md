# Shipped skills workflow

Open [diagram.html](diagram.html) in a browser, including directly from disk without networking.
The map contains `setup` and `workflow-diagram`, the two shipped definitions in this candidate.
Tracker and the remaining roster are planned on the refreshed main base and are excluded.
There is no dependency edge: workflow-diagram explicitly supports projects without setup or config.
Setup's older “before any other skill” wording predates this independent diagram tool.

## Sources and ownership

| Node | Definition | Relevant contract |
| --- | --- | --- |
| setup | [skills/setup/SKILL.md](../../../skills/setup/SKILL.md) | Interview, configuration, scaffolding, and tracker initialization |
| workflow-diagram | [skills/workflow-diagram/SKILL.md](../../../skills/workflow-diagram/SKILL.md) | Read definitions and update offline diagrams without executing the skills |

Inputs are [workflow.json](workflow.json) and [layout.json](layout.json).
All positions and content are authored data; HTML is generated.
The generator version is **0.0.8**, recorded in the installed skill's `assets/manifest.json`.
The reusable renderer remains inside the skill.

Documentation base for this unmerged candidate:
`https://github.com/wilsonkichoi/skills/blob/feat/workflow-diagram/`.
The repository remote and feature ref establish this base. Rendering does not fetch these links.

## Regenerate

Run from the repository root. These commands use the repository's skill; an installed copy can use its absolute helper path.

```sh
node skills/workflow-diagram/scripts/diagram.mjs check --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/feat/workflow-diagram/
```

```sh
node skills/workflow-diagram/scripts/diagram.mjs build --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/feat/workflow-diagram/
```

```sh
node skills/workflow-diagram/scripts/diagram.mjs preview --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/feat/workflow-diagram/ --port 0
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

Chromium loaded this generated HTML offline at 1440 × 900, 768 × 1024, and 390 × 844 in both themes.
Assertions checked fitted card bounds, selected-card placement, Escape, page errors, and absence of dependency requests.
Desktop and phone screenshots were visually inspected in both themes, including fitted and selected states.
The phone sheet scrolls independently; commands below the fold remain reachable.

## Implementation verification

See the [public runbook](../../../validation/workflow-diagram.md) for independent acceptance checks.
Results below distinguish automated behavior from actual harness invocation.

Validated on 2026-09-21. Base: refreshed `origin/main` at `12513b3`; candidate branch: `feat/workflow-diagram`.
Runtime: Node.js 26.7.0 and npm 11.19.0. Minimum-runtime packaging checks also passed on Node.js 22.23.2.
Browser automation used Playwright 1.63.0 with local Google Chrome. The renderer retains a configurable Chromium fallback.

| Runbook case | Result | Evidence |
| --- | --- | --- |
| 1. Discovery/install | PASS | Clean source and pushed GitHub branch each discovered two shipped skills; workflow-diagram installed once, shared by all three harness paths |
| 2. Explicit target/symlink | PASS | Foreign working directory, spaces and Unicode, installed directory symlink; regression covers the resolved CLI entry-detection defect |
| 3. Read-only/offline | PASS | macOS sandbox-exec denied network and installation writes; check/build ran with Node and empty PATH |
| 4. Containment | PASS | Inventory found only diagram output; source data and unrelated project files remained unchanged |
| 5. Symlink escape | PASS | Input, output, dangling output, diagram directory, and docs ancestor rejected; external sentinel preserved |
| 6. No-config creation | PASS | Independent Codex execution and Claude Code CLI both created valid maps from collect/publish definitions without config |
| 7. No relevant input | PASS | Codex preserved an existing diagram for empty scope; a fresh empty scope produced no graph |
| 8. Unrelated workflows | PASS | Minimal and branching fixtures built through shipped assets and opened offline |
| 9. Preserve additions | PASS | Added audit while preserving authored descriptions, positions, edges, and routes; separate artifact node survived an unchanged update |
| 10. Source conflict | PASS | Changed collect output conflicted with authored notes.md references; disputed data remained unchanged and conflict was recorded |
| 11. Removal/access | PASS | Confirmed audit removal cleaned node/position/edge/route; publish EACCES preserved its diagram content |
| 12. Determinism | PASS | Codex unchanged rerun preserved JSON and HTML bytes; helper repeat builds were identical |
| 13. Last valid output | PASS | Invalid JSON, missing route, and unresolved documentation link failed without changing prior HTML |
| 14. Offline/text safety | PASS | Packaged output made no sibling requests under offline file loading; hostile titles, summaries, and commands stayed literal |
| 15. Preview | PASS | Browser refresh, invalid-edit retention, file-request rejection, port conflict, signal shutdown, and port reuse |
| 16. Assets | PASS | Source/schema changes failed freshness; rebuild repaired it; repeated generation was byte-identical |
| 17. Visual/input | PASS, with limits | 29 browser cases retain original 25 regressions; project screenshots inspected as described above |
| 18. Project record | PASS | Portable source paths, regeneration commands, generator version, chosen base, and local screenshots |
| 19. Harness behavior | Mixed | Codex subagent and Claude Code CLI passed; Kiro invocation and interactive ambiguity checks have limits below |
| 20. Integration | PASS | [PR #7](https://github.com/wilsonkichoi/skills/pull/7) is open and unmerged; separate branch from refreshed main, with no tracker commits |

The pushed GitHub package also passed source/output hash verification and check/build through the Claude symlink with network and installation writes denied.
No node_modules, caches, browser binaries, or test output were shipped.

The automated suite passed **76 unit/packaging tests and 29 browser tests**.
All 16 packaging tests also passed on Node.js 22.23.2.
The original 60 unit and 25 browser cases remain, with setup/tracker assertions isolated in a historical fixture.
Generic interaction tests use a five-node synthetic workflow. Embedding tests load the shipped ESM asset.

The deterministic notices cover bundled Ajv 8.20.0, fast-deep-equal 3.1.3, fast-uri 3.1.8, and json-schema-traverse 1.0.0.
The generated JavaScript carries the complete license notices, so standalone HTML retains them when copied alone.
Esbuild and Playwright are maintainer dependencies, not installed runtime requirements.

## Harness evidence and limits

Codex executed the installed skill through an independent subagent with an isolated collect/publish project.
It verified creation, unchanged invocation, authored additions, auxiliary preservation, conflicts, confirmed removals, unreadable sources, and empty scope.
The parent independently checked retained JSON objects and geometry against snapshots and validated the resulting model.
This was actual skill execution by Codex, not a separate Codex CLI launch.
Its browser checks were SKIP because the browser inventory was empty and IAB reported unavailable.
A numbered scope question was checked in a conversational dry run; actual interactive turn termination remains SKIP.

Claude Code 2.1.278 loaded `/workflow-diagram` from the installed package and completed a collect/publish map.
Its source-backed artifact nodes explain notes.md and report.md. Neither skill was executed.
It also checked offline headless Chrome, viewport bounds, selected states, keyboard navigation, history, and one touch tap.
Its multi-touch and command-copy checks were SKIP; those behaviors are covered separately by the renderer suite.

Kiro CLI 2.22.0 installation was verified. Actual invocation is **SKIP** because `kiro-cli whoami` returned `Not logged in`.
No authentication settings were changed.

The generic skill-creator validator rejected the repository-required `disable-model-invocation` extension.
A template-aware YAML check passed the name, description, all manual settings, six contract lines, and length requirement.
The extension was preserved as required by the repository template and verified by actual installation and Claude invocation.

Physical touch hardware, Firefox, Safari, screen-reader audio, and operating-system clipboard permission dialogs were not tested.
Those are SKIP, not evidence supplied by Chromium automation.
The original ignored MVP remained unchanged; its 43-file handoff manifest matched before migration.
