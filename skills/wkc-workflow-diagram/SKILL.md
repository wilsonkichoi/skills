---
name: wkc-workflow-diagram
description: Create and update offline workflow diagrams. Use when you want to explain project skills and their relationships visually.
disable-model-invocation: true
metadata:
  allow_implicit_invocation: false
---

# wkc-workflow-diagram

- **What it does:** Explain actual project skills with an interactive, offline workflow map.
- **When to use it:** Create a map, or update it after skill definitions or authored diagram content change.
- **Dependencies:** Node.js 22 or newer; browser tools for visual checks. No setup, config, npm install, or network.
- **Input:** Target project, the skills to include, and existing diagram data when present.
  Without an explicit target, use the current repository. Ask when the scope is ambiguous.
- **Output:** `workflow.json`, `layout.json`, `diagram.html`, `README.md`, and screenshots under `<project>/docs/dev-agents/diagram/`.

Read skill definitions as evidence only. Never invoke the skills you diagram or run their commands.

Write only inside `<project>/docs/dev-agents/diagram/`, the diagram directory.
Put temporary files, logs, scripts, and browser profiles in its `.cache/`.
Never write to `/tmp`, the project root, or this skill's directory, not even briefly.

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

Scope is ambiguous when the project holds separate sets of skills, such as independent products, and the user did not say which one or all of them.
Then ask one question with numbered choices, recommendation first, and give user a selector to choose the answer.
When the harness has no callable selector, present numbered text and accept a digit.
End the turn on the question. Skip it when the user already gave the scope.

## 2. Author or update the data

Read [README.md](README.md) for the data contract and helper commands, and [design.md](design.md) for layout and visual rules.
Do not copy the renderer into the project or change the project's build.

Create the diagram directory and JSON files only after finding relevant skill definitions.
Give the directory a `.gitignore` that lists `.cache/` and `.diagram-*.tmp`.
Use stable IDs, concise text, and a hand-authored route for every edge.
Add an edge only when a source definition establishes the relationship. Otherwise leave skills disconnected.
Add auxiliary nodes only when a source definition shows they explain the workflow.
Take details such as commands and links only from what a source states. Never invent an invocation.

When updating, compare the source definitions with the sources recorded in the project README.
Existing JSON content is authored: IDs, text, auxiliary nodes, coordinates, and routes.
Change it only to add what a source newly establishes, to remove what is confirmed gone, or as the user directs.
Write text only for the nodes and edges you add. Never rewrite existing text yourself, even when its source changed.
When a changed source makes existing text wrong, keep the text and report a conflict:
the node and field, the source line, and suggested wording.
Place new skills within the existing layout unless that makes the map unreadable. Never rebuild the map from scratch.
An unreadable source is not a removal. Remove a node only on evidence that its source is gone or on the user's direction.
When removing a node, also remove its position and its edges with their routes.
If sources and intent are unchanged, leave the JSON byte-identical.

## 3. Validate and build

Run `check`, then `build`, with the commands in README.md's [helper section](README.md#check-build-and-preview).
Locate `scripts/diagram.mjs` relative to this `SKILL.md`. If you were not told where this file is, look for
`wkc-workflow-diagram/scripts/diagram.mjs` in the project's `.agents/skills/`, `.claude/skills/`, and `.kiro/skills/`,
then in the same directories under the home directory.
Pass the helper's absolute path and the absolute project path.

Relative links in node details need `--documentation-base`, an HTTPS URL for the target project.
Pass it to `check`, `build`, and `preview` alike.
Derive it from the project's actual remote. Use the default branch unless the user names another ref.
Never use a feature branch, and never reuse this skills repository's URL for another project.
A non-zero exit is an error, whatever the message says. Warnings print with exit 0.
Fix every error before accepting the output. Review warnings, but never truncate valid content to silence them.

## 4. Inspect the browser result

Start `preview` in the background with the command in README.md's [helper section](README.md#check-build-and-preview).
It backgrounds the helper itself, logs to `.cache/`, and prints the process ID. Open the URL from that log.
Run it as shown, without `cd … &&` in front, or the printed ID belongs to a subshell instead of the helper.
When inspection ends, stop that process with SIGTERM and confirm the URL no longer answers, as the same section shows.
Stop any browser you started too, by its process ID. Never kill processes by name or pattern.
Never end the turn with the preview or a browser still running.
Also open `diagram.html` through `file://` with networking disabled when the browser tools allow it.

Review fitted and selected states at 1440 × 900, 768 × 1024, and 390 × 844, in light and dark themes.
Check route crossings, label overlap, readable selected cards, panel placement, and visible controls.
Check keyboard navigation, focus return, command copying, and touch gestures that your change affects.
Save screenshots in the diagram directory's `screenshots/`.
Record every check you could not run as SKIP with the reason. A successful build does not prove the map looks right.

## 5. Record and report

Write or update the diagram directory's `README.md`. Keep notes that you did not write.
When nothing changed (the same sources, all readable, no new conflicts), leave the JSON, README, and screenshots byte-identical.
In that case, report anything wrong you notice instead of fixing it.
A new conflict or unreadable source is a change: record it in the README even though the JSON stays the same.
Record, with paths relative to the project root:
- each node's source definition, with its revision or the contract facts you relied on
- the scope, and the generator version from this skill's `assets/manifest.json`
- the documentation base, and regeneration commands that work from the project root on any machine:
  `--project .` with the helper's path relative to the project root, or `<installed-skill>` if it is installed elsewhere
- verification results, with SKIP reasons
- unresolved conflicts and unreadable sources

Never record absolute paths, temporary directories, or preview ports.
Keep this bookkeeping in the README, never in JSON fields.
Report added, changed, and removed nodes and edges, output paths, and verification limits.
If you reported conflicts, end with one numbered question offering to apply the suggested wording, recommendation first.
End the turn on the question. Apply or keep the text as the answer says.
