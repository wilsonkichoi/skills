---
name: workflow-diagram
description: Create and update offline workflow diagrams. Use when you want to explain project skills and their relationships visually.
disable-model-invocation: true
metadata:
  allow_implicit_invocation: "false"
---

# Workflow diagram

- **What it does:** Explain actual project skills with an interactive, offline workflow map.
- **When to use it:** Create a map, or update it after workflow definitions or authored content change.
- **Dependencies:** Node.js 22 or newer; browser tools for visual checks; no setup, npm install, or network rendering service.
- **How to call it:** Claude Code `/workflow-diagram`, Codex `$workflow-diagram`, Kiro CLI `/workflow-diagram`.
- **Input:** Target project, selected workflow skills, and existing diagram data when present.
- **Output:** Inputs, HTML, README, screenshots, and temporary artifacts under `<project>/docs/dev-agents/diagram/`.

Read skill definitions as evidence. Never invoke diagrammed skills or execute their example commands.

## 1. Inspect the project

Identify the target project independently of the installed skill directory and current working directory.
Read project instructions, relevant workflow documentation, and any existing `docs/dev-agents/config.md`.
Setup and config are optional. Do not create config or change the setup interview.

In a skill-authoring repository, inspect shipped `skills/` definitions.
In a consuming project, inspect installed or explicitly selected workflow skills.
Resolve symlinks and deduplicate definitions by their real paths.
Do not include every global skill or turn planned roster entries into shipped nodes.
Do not infer dependencies from directory order.

Read existing `workflow.json`, `layout.json`, and `README.md` under the diagram directory before authoring.
Treat the JSON files as authoritative. Never recover editable data from generated HTML when JSON exists.
If no relevant definitions are available, report the missing input and preserve any existing diagram.

If scope is ambiguous, ask one question with numbered choices, recommendation first, accepting a digit.
End the turn on the question. Do not start dependent work while waiting.
Use supplied scope and autonomous authorization without redundant questions.

## 2. Author or update the data

Read [README.md](README.md) for the data contract and route recipes, and [design.md](design.md) for visual rules.
Keep all project artifacts inside `docs/dev-agents/diagram/`; reject symlink escapes before writing any artifact.
Keep reusable code inside this installed skill. Do not copy the renderer into the project or modify its application build.

Create the directory and missing JSON inputs only after establishing relevant source evidence.
Use stable IDs, concise descriptions, supported lane colors, explicit edge IDs, and manually authored routes.
Include auxiliary nodes only when they explain an evidenced workflow.
Keep independent skills disconnected when no source establishes a relationship.
Commands are copyable examples, never executable rendering instructions.

For updates, compare source definitions with the README's recorded sources and existing authored content.
Preserve intentional descriptions, IDs, auxiliary nodes, unaffected positions, and routes.
Add new skills within the existing layout unless that makes the map unreadable.
If authored text conflicts with changed source facts, report the conflict and preserve the disputed text pending resolution.
Apply independent, unambiguous changes when authorized. Do not replace the whole map with a template.

Distinguish unreadable or inaccessible sources from confirmed removals.
Remove a node only with evidence of removal or explicit user direction.
Remove its obsolete positions and incident edges/routes together; retain valid auxiliary content.
For unchanged sources and intent, leave JSON bytes unchanged, including wording, ordering, and coordinates.
No persistent synchronization system or second task tracker is needed.

## 3. Validate and build

Locate `scripts/diagram.mjs` relative to this skill's `SKILL.md`.
Use its absolute path and an explicit project path, quoting both.
The following placeholders mean the installed skill directory and target project.

```sh
node "<installed-skill>/scripts/diagram.mjs" check --project "<project>"
```

```sh
node "<installed-skill>/scripts/diagram.mjs" build --project "<project>"
```

Relative documentation links require `--documentation-base` with an explicit HTTPS URL.
Derive that base from verified project context, including repository and ref, or use actual HTTPS links.
Do not assume this repository's GitHub URL applies to another project.
Record the chosen base in the project README and regeneration commands.
Fix field/path errors before accepting output. Review editorial warnings without truncating valid content.
The helper preserves the previous valid HTML on failure and replaces successful output atomically.

## 4. Inspect the browser result

```sh
node "<installed-skill>/scripts/diagram.mjs" preview --project "<project>" --port 4173
```

Preview binds to loopback, reports port conflicts, and refreshes after valid input edits.
Use `--port 0` to request an available port. Stop the preview after inspection.
Also open `diagram.html` through `file://` with networking disabled when browser tools support it.

Inspect fitted and selected states at desktop and phone sizes in light and dark themes.
Check crossings, label overlap, readable selected cards, drawer or sheet placement, and visible controls.
Check affected keyboard navigation, focus restoration, command copying, and touch gestures where supported.
Save relevant screenshots under the project's `screenshots/` directory.
Use `.cache/` there for temporary artifacts when needed, and ignore that cache locally.
Record unavailable checks as SKIP with reasons. A successful build does not prove visual correctness.

## 5. Record and report

Write or update the project diagram README, preserving unrelated authored notes.
Record source paths, scope, generator version from `assets/manifest.json`, regeneration commands, documentation base, and verification results.
Keep project paths portable; do not record the implementation worktree or original MVP directory.
Name unresolved source conflicts and inaccessible definitions.

Report added, changed, and removed nodes or relationships, output paths, and verification limits.
Do not claim harness invocation or visual checks passed unless they actually ran.
