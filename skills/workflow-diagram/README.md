# Workflow diagram

Create or update a map of actual project skills with `$workflow-diagram` in Codex or `/workflow-diagram` in Claude Code and Kiro CLI.
The skill reads definitions; it does not execute the skills or their commands.
Setup, tracker configuration, and an application build are not required.

## Project files

All project data and output belong here:

```text
<project>/docs/dev-agents/diagram/
  workflow.json
  layout.json
  diagram.html
  README.md
  screenshots/
  .cache/                 # optional and ignored
```

The JSON files own content and geometry. Generated HTML is never an authoring input.
Keep the reusable renderer in the installed skill. Do not install npm dependencies into the consuming project.
The helper requires Node.js 22 or newer and uses only built-ins and shipped assets.
It works from a read-only installation without network access.

## Check, build, and preview

Replace the placeholders with the installed skill directory and target project.
Paths containing spaces or Unicode are supported.

```sh
node "<installed-skill>/scripts/diagram.mjs" check --project "<project>"
```

```sh
node "<installed-skill>/scripts/diagram.mjs" build --project "<project>"
```

```sh
node "<installed-skill>/scripts/diagram.mjs" preview --project "<project>" --port 4173
```

Check reads and validates without writing. Build validates, then atomically replaces `diagram.html`.
A failure preserves previous HTML. Symlinks below the canonical project root are rejected for diagram paths, including input files.
Concurrent hostile filesystem changes are outside this local authoring tool's protection boundary.
Preview serves only the diagram and its change stream on loopback. It never serves arbitrary project files.
Valid JSON edits reload the browser. Invalid edits report errors and retain the last valid preview.
Stop preview with Ctrl+C; its watchers, clients, and server close.
A port conflict is an error. Use `--port 0` for an available port and read the printed URL.

HTTPS and local fragment links need no base. Relative documentation links require an explicit HTTPS base on all three operations:

```sh
node "<installed-skill>/scripts/diagram.mjs" build --project "<project>" --documentation-base "https://example.com/project/"
```

Use a verified URL for the target project, including the correct repository and ref.
The base must end with a slash when it names a directory. No project URL is built into the generator.
Links are intentional user navigation, not rendering dependencies.

## Author the map

Read [the visual guide](design.md) before changing layout.
The formal contracts are [workflow.schema.json](renderer/schema/workflow.schema.json) and [layout.schema.json](renderer/schema/layout.schema.json).
The browser and Node validator share those schemas and semantic checks.

### Content

A workflow needs `schemaVersion: 1`, a nonblank `title`, a nonempty `nodes` array, and an `edges` array. `subtitle` and `lanes` are optional. Array order controls navigation and lane chips.

A node needs only `id`, `label`, and `summary`. Its position belongs in the layout. IDs can include punctuation or Unicode and must be unique. `kind` defaults to `skill`; other values are `mode`, `artifact`, and `system`. An omitted `lane` uses neutral styling.

```json
{
  "id": "example",
  "label": "Example",
  "summary": "A short explanation of the node.",
  "details": {
    "body": "Optional additional context with `inline code`.",
    "when": "Use when its input is ready.",
    "commands": [{ "label": "Example invocation", "text": "example <input>" }],
    "links": [{ "label": "Full documentation", "href": "docs/example.md" }]
  }
}
```

All detail fields are optional. Only populated fields appear in the panel. HTML is literal text. Paired backticks mark inline code in summaries, body text, and When text. Commands are copied as text and are never executed.

Recommended limits produce warnings, not truncation: summaries use at most 30 words; body text uses two sentences and 60 words; When uses 25 words. Prefer at most two commands and three links. Cards clamp teaser text, while details retain the entire content and scroll independently.

### Add a node, lane, and edge

1. Append the node to `workflow.nodes` in its intended navigation order.
2. Add its exact ID to `layout.nodes` with finite `x` and `y` coordinates.
3. To group it, append a lane with `id`, `label`, and six-digit hex `color.light` and `color.dark` values.
4. Set the node's `lane` to that lane ID. Optionally add a dashed rectangle under `layout.regions`.
5. Add an edge with a unique `id`, `from`, and `to`. Its kind defaults to `primary`; `loop` and `optional` are supported.
6. Add exactly one route under that edge ID in `layout.edges`.
7. Build and review the preview in both themes. Check the map at fitted zoom and select the new node.

No renderer changes are needed. Adding an edge without its route fails validation instead of hiding that relationship.

### Route recipes

Coordinates are in world pixels. Cards are 240 × 160. `renderer/src/geometry.js` defines the only card-size constant used by rendering and validation. Each route has a two-number start and one or more cubic segments. A segment contains two control points followed by its endpoint.

Forward edge: a card at `(0, 0)` connects to a card at `(480, 0)`.

```json
{
  "start": [240, 80],
  "segments": [[320, 80, 400, 80, 480, 80]],
  "labelOffset": [0, -18]
}
```

Return edge: the right card returns through a lower corridor to the left card.

```json
{
  "start": [600, 160],
  "segments": [
    [600, 300, 600, 300, 360, 300],
    [120, 300, 120, 300, 120, 160]
  ],
  "labelOffset": [0, 20]
}
```

Vertical edge: a card at `(0, 320)` connects upward to a card at `(0, 0)`.

```json
{
  "start": [120, 320],
  "segments": [[120, 265, 120, 215, 120, 160]],
  "labelOffset": [100, 0]
}
```

Routes must start and end on the referenced card boundaries, within half a world pixel. Parallel edges require distinct IDs and routes. `labelAngle` is optional, in degrees. Labels default to 18 pixels above the sampled midpoint of the route.

Bounds include cards, regions, curve control hulls, and rotated label boxes, plus padding. Control hulls can leave more space than the visible curve requires. This conservative fit avoids cropping. Check route crossings and label overlap visually.


## Preserve edits when updating

Read existing JSON and its README before reading changed source definitions.
Keep stable IDs, intentional text, auxiliary nodes, unaffected coordinates, and edge routes.
Map each node to its source path in the README, with the source revision or relevant contract facts when useful.
Do not embed source bookkeeping in JSON fields that the schema does not support.

Add a new skill only after confirming its definition. Add edges only when source contracts support them.
If a source change conflicts with an intentional description, record the conflict instead of overwriting the description.
An inaccessible source does not establish removal. Confirm removal before deleting a node and its incident edges and routes.
Unchanged sources and intent should leave JSON byte-identical. No timestamp belongs in generated HTML.

Record generator version, source paths, chosen documentation base, regeneration commands, and verification in the project README.
Preserve unrelated notes. Store screenshots beside that README.
Mark unavailable checks SKIP; a successful build is not visual review.

## Embed

Import the shipped ESM asset from a page served over HTTP. Give the container an explicit height. The host owns data loading.

```html
<div id="workflow" style="height: 720px" tabindex="-1"></div>
<script type="module">
  import { mountDiagram } from './assets/workflow-diagram.js';

  const [workflow, layout] = await Promise.all([
    fetch('./data/workflow.json').then(response => response.json()),
    fetch('./data/layout.json').then(response => response.json()),
  ]);
  const diagram = mountDiagram(document.getElementById('workflow'), {
    workflow,
    layout,
    theme: 'auto',
  });

  // Optional API actions:
  // diagram.select('your-node-id');
  // diagram.select(null);
  // diagram.resetView();
  // diagram.destroy();
</script>
```

| API | Contract |
| --- | --- |
| `mountDiagram(container, { workflow, layout, theme })` | Validates inputs before mounting; theme defaults to `auto` |
| `diagram.select(id)` | Opens a node by exact ID; an unknown ID throws |
| `diagram.select(null)` | Closes details and restores focus |
| `diagram.resetView()` | Fits the entire map, or recenters the selected node when details are open |
| `diagram.warnings` | Editorial warnings; valid content remains complete |
| `diagram.destroy()` | Removes the owned host, observers, and listeners; safe to call twice |
| `validateModel(workflow, layout, options)` | Returns cloned, normalized data and warnings; invalid data throws `DiagramValidationError` |

A container can hold one instance. Destroy it before remounting. The library preserves other container children and uses Shadow DOM for style isolation. Its controls and keyboard handlers belong to that instance. Each instance has distinct DOM IDs.

The container receives a bubbling `diagram:select` event with `event.detail.id`, or `null` on close. The library does not read or write the host URL. The standalone adapter uses exact encoded IDs in fragments such as `#node=tracker` and supports Back/Forward.

In an embedded page, relative documentation links resolve against the host page. Pass an explicit HTTPS documentation base to `validateModel`, then mount its normalized output, to resolve them elsewhere.


## Package ownership

The installed helper and assets are ready to use. `renderer/` contains their canonical source and maintainer tests.
Consumers do not run its npm build. The deterministic manifest records generator version and source/output hashes.
The skill source is covered by [LICENSE.txt](LICENSE.txt). Bundled dependency licenses are in [THIRD-PARTY-NOTICES.txt](assets/THIRD-PARTY-NOTICES.txt).
The maintainer procedure is in the repository's AGENTS.md.
