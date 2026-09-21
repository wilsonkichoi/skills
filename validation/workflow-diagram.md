# Workflow diagram validation

Run this against the candidate skill in a throwaway project. Preserve the original project and installed skill.
Each numbered case needs PASS, FAIL, or SKIP with evidence. An unavailable check is SKIP, never PASS.
Browser tests do not establish successful agent invocation. Harness installation and invocation are separate checks.

## Preparation

Use a clean candidate checkout or source export without node_modules, caches, traces, or browser binaries.
The skills installer copies ignored files from local directories, so do not install a populated maintainer workspace.
Replace placeholders with absolute paths. Use an isolated target containing spaces and Unicode.

```sh
npx skills@latest add "<clean-candidate>" --list
```

```sh
npx skills@latest add "<clean-candidate>" --skill workflow-diagram -a claude-code -a codex -a kiro-cli -y
```

Run the maintainer checks from `tools/workflow-diagram/` before testing the installed copy.
Use the browser fallback described in root AGENTS.md if Chrome is unavailable.

```sh
npm ci
npm run check
```

For behavioral cases, give the project two definitions: `collect` writes `notes.md`, and `publish` reads it and writes `report.md`.
Add an independent auxiliary note when testing preservation. Record file hashes before each update.
Keep test outputs within the target's diagram directory; harness installation files are setup, not diagram output.

## Cases

1. **Discovery and installation.** List the clean candidate and install only `workflow-diagram` on all three harness paths.
   PASS: discovery count equals shipped skills, this skill appears once, and no template or fixture is discovered as a skill.
   Check real paths, all manual-invocation settings, and the six opening contract lines.
   FAIL if an installed package contains node_modules, caches, binaries, traces, or developer paths.

2. **Explicit target and symlink entry.** Run installed check/build from a third directory, using `--project` with spaces and Unicode.
   Invoke through the Claude Code or Kiro symlink as well as the canonical path.
   PASS: each invocation reports its result and writes the requested diagram; no silent exit without output.
   Check that missing `--project` fails instead of choosing the current or installed directory.

3. **Read-only offline installation.** Remove installation write permissions and deny network access with an OS sandbox.
   Run check/build with Node alone and no npm on PATH. Permit writes only to the target's diagram directory where supported.
   PASS: output is complete and installation hashes remain unchanged. Record the actual network-denial mechanism.
   SKIP network denial if the platform cannot enforce it; do not infer offline operation from a quiet network log.

4. **Project containment.** Inventory the target before and after generation and preview.
   PASS: all new diagram files and temporary artifacts are under `docs/dev-agents/diagram/`; unrelated files are unchanged.
   FAIL if a renderer fork, package installation, application build edit, or config file appears in the project.

5. **Symlink escape.** In separate copies, replace the output, an input, the diagram directory, and its `docs` ancestor with external symlinks.
   Include a dangling output link. Place a sentinel at the destination.
   PASS: check/build reject the unsafe path, sentinel bytes remain unchanged, and no external output appears.

6. **Create without config.** Invoke the installed skill against the two definitions with no dev config.
   PASS: it produces valid workflow/layout JSON, standalone HTML, and a README without invoking setup or either diagrammed skill.
   Confirm the dependency comes from the definitions, not from directory order.

7. **No relevant input.** Invoke against an explicitly empty scope, first without a diagram and then with an existing one.
   PASS: the skill reports missing input, invents no graph, and preserves existing files.

8. **Unrelated workflows.** Build the minimal and branching examples through the installed helper.
   PASS: both validate without setup/tracker nodes, a repository-specific base, or fixed canvas dimensions.
   Open both and inspect all nodes and relationships; verify no missing routes are hidden.

9. **Add while preserving edits.** Customize a description and position; add `audit`, which reads `report.md` and writes `findings.md`.
   Invoke an update and inspect JSON diffs independently.
   PASS: existing IDs, intentional text, unaffected positions, and auxiliary nodes survive; new relationships have valid routes.

10. **Source conflict.** Change a source contract and separately edit its diagram description to conflict with that change.
    PASS: the skill names the conflict and preserves disputed text pending resolution.
    FAIL if it silently replaces all descriptions or treats generated HTML as authoritative.

11. **Removal versus access failure.** Confirm one source removal, then separately make another definition unreadable.
    PASS: only confirmed removal deletes a node; its position, incident edges, and routes are removed together.
    The unreadable source remains represented, with the access problem reported.

12. **Unchanged invocation.** Hash both JSON inputs and HTML; invoke again with unchanged sources and intent.
    PASS: JSON stays byte-identical and identical build inputs produce identical HTML.
    Review wording, IDs, array order, positions, and routes, not only node counts.

13. **Last valid output.** Start with valid HTML; separately supply invalid JSON, a missing route, and an unresolved relative link.
    PASS: build fails with a file/field error and preserves prior HTML bytes without leaked temporary files.
    Supply an explicit verified HTTPS base for the relative-link case and confirm correct resolution.

14. **Offline HTML and safe text.** Open installed-helper output through `file://` while blocking networking.
    Include HTML, script-closing text, and command text containing executable syntax.
    PASS: only the HTML file is requested; text stays literal; no command or injected script executes.
    Open details and reload an exact Unicode deep link. Inspect console errors.

15. **Preview lifecycle.** Start on an available loopback port, edit valid data, then supply invalid data.
    PASS: valid edits refresh; invalid edits report an error and retain the previous preview.
    Request an arbitrary project file and confirm 404. Occupy the selected port and confirm EADDRINUSE.
    Stop with SIGTERM; confirm the process exits, its server closes, and the port can be reused.

16. **Asset ownership and freshness.** In an isolated maintainer copy, append whitespace to source and then schema without rebuilding.
    PASS: freshness checking fails in each case, rebuilding resolves it, and repeat builds are byte-identical.
    Inspect manifest source/output hashes and notices against dependencies actually included by the bundler.
    Ensure only one canonical schema and renderer exist.

17. **Visual and input contract.** Inspect fitted and selected states at desktop, tablet, and phone sizes in both themes.
    PASS: square cards, flat palettes, lane colors, visible focus, readable selected cards, and unobscured controls remain intact.
    Verify fit, pan, zoom, filtering, textual relationships, panel scrolling, focus trapping/restoration, and navigation.
    Test touch drag from a card, pinch, cancellation, and same-node selection with hash synchronization.
    Check copy success, pending state, and failure. Record physical-device or screen-reader checks separately if performed.

18. **Portable project record.** Inspect the generated README and screenshots.
    PASS: they identify this project, its source paths, generator version, regeneration commands, documentation base, and actual verification.
    FAIL if they reference an implementation worktree, the ignored MVP, or overwrite unrelated notes.

19. **Harness invocation [MANUAL when credentials or an interactive session are required].** Invoke on Codex, Claude Code, and Kiro CLI.
    PASS per harness only when the installed skill was actually loaded and produced valid output.
    Record authentication failures and unavailable browser tools as specific SKIPs, separate from helper and browser results.
    Confirm ambiguous scope ends the turn on a numbered question; supplied scope does not trigger redundant questions.

20. **Repository integration.** Inspect this repository's generated map and candidate diff.
    PASS: only actual scoped skills appear, no dependency is invented, and files stay under the fixed project directory.
    Confirm version, timestamped changelog, roster, authoring rules, public runbook, fresh main ancestry, and an unmerged PR.
    Re-read the implementation definition of done and map every requirement to evidence before reporting completion.

## Report

Record candidate commit, installer and harness versions, runtime/browser versions, exact commands, and artifact paths.
For each case, state PASS/FAIL/SKIP and the independent evidence. Explain every SKIP and remaining failure.
Separate automated renderer checks, installed-helper checks, agent behavior, and visual review.
Do not count a source-level unit test as an agent invocation.

The implementation report and this repository's screenshots live in
[docs/dev-agents/diagram/README.md](../docs/dev-agents/diagram/README.md).
