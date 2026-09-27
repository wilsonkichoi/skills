# Shipped skills workflow

Open [diagram.html](diagram.html) in a browser, including directly from disk without networking.
The map contains the three shipped definitions in this repository: `setup`, `tracker`, and
`workflow-diagram`. Planned skills are excluded. `setup` writes the config that `tracker` requires.
`workflow-diagram` supports projects without setup or config, so it remains independent.

## Sources and ownership

| Node | Definition | Relevant contract |
| --- | --- | --- |
| setup | [skills/setup/SKILL.md](../../../skills/setup/SKILL.md) | Interview, configuration, scaffolding, and tracker initialization |
| tracker | [skills/tracker/SKILL.md](../../../skills/tracker/SKILL.md) | Reads the backend from setup's config; manages tickets in seven statuses |
| workflow-diagram | [skills/workflow-diagram/SKILL.md](../../../skills/workflow-diagram/SKILL.md) | Read definitions and update offline diagrams without executing the skills |

Inputs are [workflow.json](workflow.json) and [layout.json](layout.json).
All positions and content are authored data; HTML is generated.
The generator version is **0.0.11**, recorded in the installed skill's `assets/manifest.json`.
The renderer source and maintainer build are in `tools/workflow-diagram/`; the skill ships generated assets.

Documentation base:
`https://github.com/wilsonkichoi/skills/blob/main/`.
The repository remote and its default branch establish this base. Rendering does not fetch these links.

## Regenerate

Run from the repository root. These commands use the repository's skill; an installed copy can use its absolute helper path.

```sh
node skills/workflow-diagram/scripts/diagram.mjs check --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/main/
```

```sh
node skills/workflow-diagram/scripts/diagram.mjs build --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/main/
```

```sh
node skills/workflow-diagram/scripts/diagram.mjs preview --project . --documentation-base https://github.com/wilsonkichoi/skills/blob/main/ --port 0
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

The [public runbook](../../../validation/workflow-diagram.md) defines the cases. Results below separate
renderer checks, installed-helper checks, and agent behavior. Raw evidence stays in the ignored
`.local/runs/workflow-diagram/` directory of the checkout that ran it.

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
