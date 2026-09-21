# Shared design and editing guide

Use these visual rules for every project. Project facts belong in its JSON files, independent of this shared design.

## Visual rules

- Keep square corners, flat surfaces, left-aligned text, and strong 2px divider rules.
- Use system sans-serif for explanations and system monospace for names, commands, and small numeric labels.
- Keep the light palette at background `#f3f2f2`, surface `#ffffff`, ink `#201e1d`, and accent `#ec3013`.
- Keep the dark palette at background `#141313`, surface `#1e1c1b`, ink `#f0eeec`, and accent `#ff4a2c`.
- Reserve red for selection, keyboard focus, and connected relationships.
- Keep lane colors in workflow data. Cards use a 6px lane bar; lane chips and regions use the same pair of colors.
- Use solid skill borders and dashed auxiliary borders with a visible kind badge.
- Use solid primary and return paths, dashed optional paths, and directional arrows.
- Keep the primary path left to right. Give return paths a separate lower corridor.
- Retain the two-level background grid. Avoid shadows, gradients, decorative illustrations, and remote font dependencies.

Cards stay 240 × 160 world pixels. Shorten summaries before changing this size. Fitted overviews show the complete graph, while selecting a node brings its card to readable zoom in the unobstructed area.

Primary and optional labels appear at rest. Return labels appear when a connected node is hovered, focused, or selected. Lane filters dim unrelated content but retain selectable nodes. An edge receives full emphasis only when both endpoints match the filter.

## Panel behavior

Desktop uses a 360px right drawer. Containers narrower than 780px use a bottom sheet at 65% of the canvas height. The implementation measures the panel before centering the selected card.

The title and summary always appear. Additional context, When, commands, and documentation appear only when populated. Relationships are derived from the graph and exposed as text. The panel body scrolls independently; its close button and navigation remain fixed.

Opening details makes that diagram's background controls inert. Tab and Shift+Tab remain inside the panel. Escape, the close button, and the backdrop close it and restore focus. Previous and Next follow the complete authored order, including dimmed or disconnected nodes. Arrow keys retain native control and text behavior.

The renderer uses no motion transitions. Reduced-motion rules also prevent later styles from introducing unwanted animation in that mode.

## Review loop

1. Start the installed helper's preview for the target project.
2. Edit its JSON content and layout; leave generated HTML alone.
3. Review fitted and selected states at 1440 × 900, 768 × 1024, and 390 × 844, in both themes.
4. Check crossings, labels, keyboard focus, readable cards, panel scrolling, and affected touch behavior.
5. Save screenshots under the target project's diagram directory and record verification results there.
6. Stop preview after inspection. Apply feedback to the same JSON files.

For ordinary chat, supply relevant JSON and screenshots. Generated HTML never becomes an alternate source.
Renderer changes belong in the skill's canonical source and require its maintainer checks.
Reference images for this repository are under `docs/dev-agents/diagram/screenshots/` at the repository root.
