# Visual design

The same visual rules apply to every project. Project facts belong only in its JSON files.
The HTML template and details panel ship in the prebuilt renderer files listed in [README.md](README.md#package).
The helper generates them from the JSON; users do not author HTML or popup code.

## Arrow meaning

Default arrows show workflow actions and runtime interactions, directed from actor to target with concise verb labels.
Every authored card represents a scoped, shipped skill. Put systems, outputs, results, and notes in that skill's summary or details.
Connect skills only when definitions establish an action between them. A skill writing files does not establish another skill's invocation.
Keep prerequisites and configuration dependencies in node details. Installation, shared configuration, and directory order do not imply skill invocation.
Use a different meaning, including artifact dataflow, only when explicitly requested; record the meaning in the project README.
Preserve authored edge meaning and layout during updates. Report conflicts before changing existing edges to match a different meaning.

## What you control

- Lay out the primary path left to right. Give `loop` (return) routes their own corridor below it.
- Card size is fixed at 240 × 160. Shorten summaries instead of fighting the size.
- Pick lane colors that differ from each other and from the red accent, which marks selection.
  Test each lane's `light` value on `#ffffff` cards and its `dark` value on `#1e1c1b` cards.
- Use lane regions only to group nodes that share a lane.
- Keep labels short, and move them with `labelOffset` when they overlap a card or another label.

## What the renderer does

You cannot change these; know them so you can check the result.

- Square corners, flat surfaces, 2px divider rules, a two-level background grid, and no motion.
- System sans-serif for text; system monospace for names, commands, and small numbers.
- Light theme: background `#f3f2f2`, surface `#ffffff`, ink `#201e1d`, accent `#ec3013`.
  Dark theme: background `#141313`, surface `#1e1c1b`, ink `#f0eeec`, accent `#ff4a2c`.
- Red marks selection, keyboard focus, card hover, the selected node's relationships, and links.
  Avoid red for lane colors so it keeps that meaning.
- Cards show a 6px lane bar. Lane chips and regions use the lane's colors.
- Skills have solid borders. Legacy auxiliary nodes render with dashed borders and a kind badge; do not author new ones.
- `primary` and `loop` edges are solid, `optional` edges are dashed, and all have arrows.
- Primary and optional edge labels always show. Loop labels show when a connected node is hovered,
  focused, or selected.
- A lane filter dims other content but keeps every node selectable. An edge is emphasized only when
  both of its nodes match the filter.
- The fitted view shows the whole graph. Selecting a node zooms its card to a readable size beside
  the panel.

## Details panel

- Desktop shows a 360px drawer on the right. A container narrower than 780px shows a bottom sheet
  at 65% of the canvas height.
- The title and summary always show. Body, When, commands, and links show only when set.
  Relationships come from the edges and are listed as text.
- The panel body scrolls; its close button and Previous/Next stay fixed. Previous/Next follow node
  array order, including dimmed and disconnected nodes.
- While the panel is open, Tab stays inside it and the map behind it is inert. Escape, the close
  button, and the backdrop close it and restore the previous view before returning focus.
  A previously fitted view fits the current canvas size; a manual view keeps its pan and zoom.
