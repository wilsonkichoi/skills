---
name: workflow-diagram
description: Create and update offline workflow diagrams. Use when you want to explain project skills and their relationships visually.
disable-model-invocation: true
metadata:
  allow_implicit_invocation: "false"
---

# Workflow diagram

- **What it does:** Explain actual project skills with an interactive, offline workflow map.
- **When to use it:** Create a map, or update it after skill definitions or authored diagram content change.
- **Dependencies:** Node.js 22 or newer; browser tools for visual checks. No setup, config, npm install, or network.
- **How to call it:** Claude Code `/workflow-diagram`, Codex `$workflow-diagram`, Kiro CLI `/workflow-diagram`.
- **Input:** Target project, the skills to include, and existing diagram data when present.
- **Output:** `workflow.json`, `layout.json`, `diagram.html`, `README.md`, and screenshots under `<project>/docs/dev-agents/diagram/`.

Read skill definitions as evidence only. Never invoke the skills you diagram or run their commands.

## 1. Inspect the project

The target project is usually the current repository. It is never this installed skill's directory.
Read project instructions, relevant workflow documentation, and `docs/dev-agents/config.md` if it exists.
Do not create config or change the setup interview.

In a repository that authors skills, inspect its shipped `skills/` definitions.
In a project that consumes skills, inspect its installed skills or the ones the user names.
Resolve symlinks and deduplicate definitions by their real paths.
Do not include every global skill, and do not add planned or unshipped skills as nodes.
Do not infer dependencies from directory order.

Read `workflow.json`, `layout.json`, and `README.md` in the diagram directory when they exist.
The JSON files are the only source for existing content. Never recover data from `diagram.html`.
If no relevant definitions are available, report that and leave any existing diagram unchanged.

If scope is ambiguous, ask one question with numbered choices, recommendation first, and accept a digit as the answer.
End the turn on the question. Skip it when the user already gave the scope.

## 2. Author or update the data

Read [README.md](README.md) for the data contract and helper commands, and [design.md](design.md) for layout and visual rules.
Write only inside `docs/dev-agents/diagram/`. Do not copy the renderer into the project or change the project's build.

Create the directory and JSON files only after finding relevant skill definitions.
Use stable IDs, concise text, and a hand-authored route for every edge.
Add an edge only when a source definition establishes the relationship. Otherwise leave skills disconnected.
Add auxiliary nodes only when a source definition shows they explain the workflow.

When updating, compare the source definitions with the sources recorded in the project README.
Keep existing IDs, wording, auxiliary nodes, coordinates, and routes unless their source changed.
Place new skills within the existing layout unless that makes the map unreadable. Never rebuild the map from scratch.
If authored text contradicts a changed source, keep the text, report the conflict, and apply the other changes.
An unreadable source is not a removal. Remove a node only on evidence of removal or the user's direction.
When removing a node, also remove its position and its edges with their routes.
If sources and intent are unchanged, leave the JSON byte-identical.

## 3. Validate and build

Run `check`, then `build`, with the commands in README.md's [helper section](README.md#check-build-and-preview).
Locate `scripts/diagram.mjs` relative to this `SKILL.md`, and pass its absolute path and the absolute project path.

Relative links in node details need `--documentation-base`, an HTTPS URL for the target project.
Derive it from the project's actual remote. Use the default branch unless the user names another ref.
Never use a feature branch, and never reuse this skills repository's URL for another project.
Fix every error before accepting the output. Review warnings, but never truncate valid content to silence them.

## 4. Inspect the browser result

Start `preview` with `--port 0` and open the printed URL. Stop it when inspection ends.
Also open `diagram.html` through `file://` with networking disabled when the browser tools allow it.

Review fitted and selected states at 1440 × 900, 768 × 1024, and 390 × 844, in light and dark themes.
Check route crossings, label overlap, readable selected cards, panel placement, and visible controls.
Check keyboard navigation, focus return, command copying, and touch gestures that your change affects.
Save screenshots in the diagram directory's `screenshots/`. Put temporary files in its `.cache/`.
Make sure the diagram directory's `.gitignore` lists `.cache/` and `.diagram-*.tmp`.
Record every check you could not run as SKIP with the reason. A successful build does not prove the map looks right.

## 5. Record and report

Write or update the diagram directory's `README.md`. Keep notes that you did not write.
Record, with paths relative to the project root:
- each node's source definition, with its revision or the contract facts you relied on
- the scope, and the generator version from this skill's `assets/manifest.json`
- the documentation base and the exact regeneration commands
- verification results, with SKIP reasons
- unresolved conflicts and unreadable sources

Keep this bookkeeping in the README, never in JSON fields.
Report added, changed, and removed nodes and edges, output paths, and verification limits.
