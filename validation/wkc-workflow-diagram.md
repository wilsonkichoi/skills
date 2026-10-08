# wkc-workflow-diagram validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Read [Cases](#cases) and the linked [implementation report](../docs/dev-agents/diagram/README.md), not unrelated historical results.
Run selected installed cases in a throwaway project. Preserve the original project and installed skill.
Each selected case needs independent evidence. An unavailable required check within scope is SKIP, never PASS.
Browser tests do not establish successful agent invocation. Harness installation and invocation are separate checks.

## Preparation

Prepare only fixtures needed by selected cases. Reuse suitable existing fixtures and setup evidence.
For installation cases, use a clean candidate checkout or source export without node_modules, caches, traces, or browser binaries.
The skills installer copies ignored files from local directories, so do not install a populated maintainer workspace.
Replace placeholders with absolute paths. Use an isolated target containing spaces and Unicode.
Keep raw run evidence (logs, fixtures, screenshots) in an ignored directory such as `.local/runs/workflow-diagram/<date>/`.
It is scratch, not a record: this runbook defines the cases, and the report named at the end holds the results.

```sh
npx skills add "<clean-candidate>" --list
```

```sh
npx skills add "<clean-candidate>" --skill wkc-workflow-diagram -a claude-code -a codex -a kiro-cli -y
```

For renderer or installed-helper changes, run the maintainer checks from `tools/workflow-diagram/` before testing the installed copy.
Use the browser fallback described in `tools/workflow-diagram/README.md` if Chrome is unavailable.

```sh
npm ci
npm run check
```

For behavioral cases, give the project two shipped definitions: `collect` writes `notes.md`, and `publish` reads it and writes `report.md`.
File outputs belong in their skill details. The shared artifact establishes a prerequisite, not invocation of `publish` by `collect`.
Add an independent note in skill details when testing preservation. Record file hashes before each update.
Keep test outputs within the target's diagram directory; harness installation files are setup, not diagram output.

## Cases

1. **Discovery and installation.** List the clean candidate and install only `wkc-workflow-diagram` on all three harness paths.
   PASS: public discovery count equals shipped skills minus boolean-internal skills, and this skill appears once.
   Count source `SKILL.md` files separately; list internal skills explicitly by name. No template or fixture appears.
   Check real paths, all manual-invocation settings, and the five opening fields in the order required by AGENTS.md.
   Confirm Input explains the supplied context, the omitted target, and ambiguous scope; no How to call it field remains.
   Confirm directory, frontmatter name, main heading, display name, and invocation examples use `wkc-workflow-diagram`.
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
   After each agent turn, no preview server or browser it started is still running, and its transcript writes nothing to
   `/tmp` or the project root, not even briefly. Files the harness itself writes, such as Kiro's `.kiro/agents/`, are not skill output.
   FAIL if a renderer fork, package installation, application build edit, or config file appears in the project.

5. **Symlink escape.** In separate copies, replace the output, an input, the diagram directory, and its `docs` ancestor with external symlinks.
   Include a dangling output link. Place a sentinel at the destination.
   PASS: check/build reject the unsafe path, sentinel bytes remain unchanged, and no external output appears.

6. **Create without config.** Invoke the installed skill against the two definitions with no dev config.
   PASS: it produces valid workflow/layout JSON, standalone HTML, and a README without invoking wkc-setup or either diagrammed skill.
   Only the two skill cards appear. Project files and each skill's outputs are described within those cards; no action edge is invented.
   The `notes.md` prerequisite remains in `publish` details; it does not create a `collect` → `publish` arrow.
   Add a shared-config requirement and reorder the definition directories; neither establishes an invocation arrow.
   Add an explicit instruction for `collect` to request a report from `publish`; only then does an actor-to-target action arrow appear.

7. **No relevant input.** Invoke against an explicitly empty scope, first without a diagram and then with an existing one.
   PASS: the skill reports missing input, invents no graph, and preserves existing files.

8. **Unrelated workflows.** Build the minimal and branching examples through the installed helper.
   Extract both complete pairs from the skill README: default actions and explicitly requested artifact dataflow. Check/build each pair together.
   PASS: the unrelated fixtures validate without wkc-setup/wkc-tracker nodes, a repository-specific base, or fixed canvas dimensions.
   Every card in the README examples represents a skill; systems and outputs stay in skill text.
   Both README pairs pass check/build; prerequisites stay in details in the action example, and its edge points from actor to target.
   The artifact pair labels `notes.md` and states the explicit request requirement. Node and route snippets are labeled as individual objects.
   Open both and inspect all nodes and relationships; verify no missing routes are hidden.

9. **Add while preserving edits.** Customize a description and position; add `audit`, which reads `report.md` and writes `findings.md`.
   Invoke an update and inspect JSON diffs independently.
   PASS: existing IDs, text, positions, and routes survive byte-for-byte; new relationships have valid routes.
   In the default action map, `audit` describes input prerequisites and file outputs in its details; neither creates an invocation arrow.
   A legacy system card remains unchanged until conversion is directed. After direction, move its information into the owning skill details.
   Remove that card, its position, and its incident edges and routes together. Preserve all other authored data.
   Existing edges retain their meaning, direction, labels, and routes even if authored under another arrow meaning.
   If the addition makes existing text wrong, it is reported with suggested wording, not rewritten.

10. **Source conflict.** Change a source contract and separately edit its diagram description to conflict with that change.
    PASS: the skill names the conflict with suggested wording, records it in the README, keeps the disputed text,
    and ends on a numbered question.
    Answering with a digit applies or keeps the text as chosen, and the README records the outcome.
    FAIL if it rewrites existing text without that answer, or treats generated HTML as authoritative.
    Separately request action meaning without directing specific changes to an existing prerequisite edge.
    The skill preserves it and proposes an edge change for approval. An already directed change needs no repeated approval.
    FAIL if the new default silently reinterprets, reverses, relabels, or removes that edge.

11. **Removal versus access failure.** Confirm one source removal, then separately make another definition unreadable.
    PASS: only confirmed removal deletes a node; its position, incident edges, and routes are removed together.
    The unreadable source remains represented, with the access problem reported and recorded in the README.

12. **Unchanged invocation.** Hash both JSON inputs, the README, and HTML; invoke again with unchanged sources and intent.
    PASS: JSON and README stay byte-identical, screenshots are not retaken, and identical build inputs produce identical HTML.
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
    Drag the desktop panel's left edge in both directions; use Left/Right, Home, and End with the edge focused.
    PASS: width stays between 280 pixels and canvas width minus 200 pixels; selection stays visible beside the panel.
    Navigate and reopen details; the chosen width persists until reload. Cancel a pointer drag; later movement must not resize.
    Shrink the container; the panel stays bounded. At narrow widths, the full-width bottom sheet hides the resize control.
    Verify Tab skips the hidden handle and still cycles through the visible controls.
    Open a node, navigate to a distant node, then close with Escape, the close button, and the backdrop.
    PASS: the current card is centered and focused in the full canvas; closing preserves the current zoom.
    Resize while details are open; closing keeps the resized zoom instead of fitting the whole map.
    Verify the desktop panel defaults to half the canvas width, uses lane accents, and darkens the main canvas in both themes.
    PASS: opening never increases zoom; connected cards and their routes remain visible beside the panel.
    Verify tinted lane boxes contain their cards and region colors are visually distinct in both themes.
    Test touch drag from a card, pinch, cancellation, and same-node selection with hash synchronization.
    Check copy success, pending state, and failure. Record physical-device or screen-reader checks separately if performed.

18. **Portable project record.** Inspect the generated README and screenshots.
    PASS: they identify this project, its source paths, generator version, regeneration commands, documentation base, and actual verification.
    The README records arrow meaning and source evidence for every edge, including conditional interactions between skills.
    The commands run from the project root with `--project .` and a project-relative or `<installed-skill>` helper path.
    FAIL if they record absolute paths, temporary directories, or preview ports, reference an implementation worktree or the
    ignored MVP, or overwrite unrelated notes.

19. **Harness invocation [MANUAL when credentials or an interactive session are required].** Invoke on Codex, Claude Code, and Kiro CLI.
    PASS per harness only when the installed skill was actually loaded and produced valid output.
    Use the installed identifier: Codex `$wkc-workflow-diagram`, Claude Code and Kiro CLI `/wkc-workflow-diagram`.
    Record authentication failures and unavailable browser tools as specific SKIPs, separate from helper and browser results.
    Confirm ambiguous scope (separate sets of skills, no choice given) ends the turn on a numbered question.
    Use a callable harness selector when available; otherwise numbered text accepts a digit.
    Supplied scope does not trigger redundant questions.

20. **Repository integration.** Inspect this repository's generated map and candidate diff.
    PASS: only shipped scoped skills appear, including internal shipped skills when requested; planned skills remain excluded.
    The map has exactly five skill cards. System actions and outputs appear in their owning skill details.
    No skill-to-skill runtime actions are established by these sources, so the map has no edges; no former system routes remain.
    No setup-to-tracker prerequisite arrow appears; that dependency remains in tracker details.
    Installation, shared configuration, and directory order do not imply automatic invocation. Every arrow has source evidence.
    Confirm version, timestamped changelog, roster, authoring rules, public runbook, fresh main ancestry, and an unmerged PR.
    Labels, commands, and definition links must use the current `wkc-` identifiers; keep existing node IDs and routes stable.
    Re-read the implementation definition of done and map every requirement to evidence before reporting completion.

21. **Explicit arrow meaning and legacy updates.** Request artifact dataflow for the two definitions, then update that map without changing its meaning.
    PASS: `collect` → `publish` is labeled `notes.md` and the README records the requested artifact meaning.
    The update preserves existing edge meaning, text, direction, positions, and routes. It does not convert them to default action arrows.
    Repeat with an explicitly requested prerequisite map; the requested meaning is honored without claiming automatic invocation.
    In a default action map, only an explicit source instruction to invoke another skill establishes a skill-to-skill invocation arrow.

## Report

Record candidate commit, selected cases, relevant tool versions, independent checks, observed outcomes, and artifact paths.
Explain unavailable required checks within scope and remaining failures; do not mark out-of-scope cases as new SKIPs.
Cite unchanged evidence instead of repeating setup instructions or prior result tables.
Separate automated renderer checks, installed-helper checks, agent behavior, and visual review.
Do not count a source-level unit test as an agent invocation.

The implementation report and this repository's screenshots live in
[docs/dev-agents/diagram/README.md](../docs/dev-agents/diagram/README.md).

### Initial authoring default update, 2026-10-07

This historical check preceded the user's skill-only correction. Its auxiliary-node counts and artifact hashes describe that earlier state.

Candidate: `docs/five-shipped-skills-diagram`, base `5802c662ed9ab3d918e315e86b8eb939651c53db`, with uncommitted authoring changes for **0.0.16**.
The branch had no version bump before this update. Fetched `origin/main` matches the base.
Selected coverage: case 1 metadata subchecks; static instruction review for cases 6, 9, 10, 18, and 21;
case 8 complete README pairs through the helper; case 20 shipped scope/version subchecks; preservation of pre-existing diagram artifacts.
Tools: Node **v24.11.1**, the repository helper and unchanged generator **0.0.11**, and the current Codex session for static review.
Backend: local JSON/files only. No service writes, installed invocation, other harnesses, or additional AI sessions.

- PASS, static review: action defaults, prerequisite details, auxiliary targets, actor-to-target verb labels, and explicit alternate meanings agree across instructions, design, references, and root docs.
- PASS, static review: updates retain existing meaning and authored content; conflicts require direction; shipped scope permits requested internal skills.
- PASS, case 1 metadata subchecks: exact identifier, manual invocation settings, five opening fields, unquoted description, and length checks conform to the repository template.
- PASS, case 8 example subchecks: both complete README pairs pass check/build without warnings, preserve their JSON inputs, and produce identical HTML on repeated builds.
- PASS, case 20 scope/version subchecks: source definitions match all five skill cards, including internal `wkc-skills-release`; four systems and six actions remain; prerequisites stay in details.
- PASS, direct preservation: all 22 pre-existing modified/untracked diagram artifacts retain their SHA-256 hashes. Building a copied map produces HTML identical to the preserved repository HTML.
- PASS, whitespace: `git diff --check` reports no errors. Schema, renderer, helper, invocation settings, and generated assets remain unchanged.
- FAIL, generic skill-creator validator: it rejects the pre-existing `disable-model-invocation` extension. That extension is required by repository rules; repository-aware metadata subchecks pass.
- SKIP, behavioral invocation for cases 6, 9, 10, and 21: no additional AI sessions are authorized. Static review and helper checks do not establish future instruction following.

Raw fixtures and direct checks are in ignored `.local/runs/workflow-diagram/2026-10-07-authoring/`.
This focused report does not claim full-case passes, new browser evidence, or cross-harness compatibility.

### Skill-only correction, 2026-10-07

Candidate: the same branch/base and version **0.0.16**, after the user directed conversion of system cards into skill notes.
Selected coverage: static review of cases 6, 9, 18, 20, and 21; case 8 README example subchecks;
direct scope/preservation checks; case 14 offline subchecks; case 17 fitted layout, selected panels, keyboard focus, and link subchecks.
Backend: local JSON/files. Browser: Chrome **154.0.8037.98**; Node **v24.11.1**; generator **0.0.11**.

- PASS, scope/preservation: exactly five shipped skill cards, zero edges, and zero stale routes. Original skill IDs, labels, summaries, commands, When text, lanes, and positions are unchanged.
- PASS, moved information: setup files/labels, tracker tickets, diagram outputs, installer operations, and collection releases appear in their owning skill details.
- PASS, direct helper: repository check/build and both complete examples pass without warnings. Both examples contain skill cards only, preserve input bytes, and build deterministically.
- PASS, static review: instructions, design, examples, and root docs agree on skill cards, source-backed actions, prerequisites, explicit alternate meanings, and directed legacy conversion.
- PASS, browser subchecks: fitted views and help/release details work at all three documented sizes in both themes; five cards, zero edges, no overlaps, and no horizontal page overflow.
- PASS, browser subchecks: all five panels show their notes; Enter/Tab/Escape preserve selection and focus in the sampled panels. Documentation links use the main base.
- PASS, offline/cleanup: no HTTP requests or page exceptions; Chrome and preview terminate and both endpoints stop answering. All 18 screenshots were regenerated.
- PASS, sampled visual review: six screenshots inspected as listed in the linked implementation report. This is not a claim that every screenshot was visually reviewed.
- SKIP, behavioral invocation: no additional AI sessions are authorized. Static and direct browser checks do not establish future model behavior.

See [Skill cards only](../docs/dev-agents/diagram/README.md#skill-cards-only-2026-10-07) for the implementation record.
Raw snapshots, fixtures, browser checks, and results remain in ignored `docs/dev-agents/diagram/.cache/skill-only/`.
No renderer, helper, schema, generated asset, invocation setting, or repository version change was needed for this correction.

### Resizable details panel, 2026-10-07

Candidate: `docs/five-shipped-skills-diagram`, collection **0.0.16**, generator **0.0.12**.
Selected coverage: cases 14 and 16 offline/export and asset subchecks; case 17 desktop resizing,
keyboard controls, pointer cancellation, width retention, viewport bounds, mobile layout, and focus regressions.
Backend: local JSON/files. Browser: Chrome **154.0.8037.98** through Playwright; no additional AI sessions.

- PASS, required maintainer check: asset freshness, 76 unit/package checks, build, and 35 browser tests.
- PASS, requested offline HTML and renderer preview: drag 360 to 540 pixels, retain width through navigation and reopening, clamp to 280 pixels and canvas width minus 200 pixels.
- PASS, input regressions: Left/Right, Home/End, pointer cancellation, selected-card visibility, viewport shrinking, full-width mobile sheet, and focus cycling.
- PASS, repository helper check and unchanged authored workflow/layout inputs.
- PASS, visual inspection: requested offline HTML with help details resized to 540 pixels; text, handle, close button, and navigation remain visible.
- Initial test-only failure: the mobile negative-focus assertion used a role locator that excluded the hidden handle. A DOM locator fixes the assertion; the focused rerun passed.

Logs: `/tmp/diagram-resize-check-final.log` and `/tmp/diagram-resize-recheck.log`.
Visual evidence: ignored `docs/dev-agents/diagram/.cache/desktop-resized.png`.
These direct checks do not establish screen-reader, physical touch, or other-browser compatibility.

### Region styling and selection context, 2026-10-07

Candidate: `docs/five-shipped-skills-diagram`, collection **0.0.16**, generator **0.0.13**.
Selected coverage: case 14 offline/export subchecks; case 16 asset freshness; case 17 panel defaults, region styling,
connected-card context, close behavior, grouping, region colors, resizing, keyboard, and responsive layout; case 18 visual record.
Backend: local JSON/files. Browser: Chrome **154.0.8037.98** through Playwright. No additional AI sessions.
Reference: local `agent-toolkit/plugins/dev/diagram/README.md` and `dev-plugin-diagram.html`, including region markup,
drawer sizing, lane styles, scrim opacity, camera behavior, and generated-file ownership.

- PASS, maintainer check: current assets, 76 unit/package checks, build, and 38 browser tests.
- PASS, final focused rerun: both light/dark grouping and panel-style tests after adding the neutral Independent region.
- PASS, panel: half-width desktop default, persistent resizing, lane border/header/section/link accents, and 40%/55% backdrop opacity.
- PASS, connected fixture: opening never increases zoom; directly connected cards and the return route stay visible beside the panel. The repository map has no edges, so its disconnected cards include their nearest neighbor instead.
- PASS, closing: Escape, close button, and backdrop center and focus the current card at the same zoom, including after navigation and viewport resizing. This replaces the former restore-opening-view contract.
- PASS, region data: all five cards are enclosed in four tinted lane boxes; positions and edges stay unchanged. Documentation is amber, Coordination is green, Configuration is purple, and Independent is gray.
- PASS, export: repository helper check and byte-identical rebuild.
- PASS, final visual checks: desktop, tablet, and phone in both themes; all 18 screenshots regenerated; no HTTP requests, page exceptions, or page overflow. Browser closes after checks.
- PASS, sampled visual review: desktop light/dark help details, tablet light overview and dark help details, phone light help details and dark release details, plus the settled reference panel.

Raw evidence: `/tmp/diagram-context-check.log`, `/tmp/diagram-context-region-check.log`, `/tmp/diagram-context-visual.log`,
and ignored `docs/dev-agents/diagram/.cache/context-visual-results.json`.
Direct browser checks do not establish screen-reader, physical-device, or other-browser compatibility.
