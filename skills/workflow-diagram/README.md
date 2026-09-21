# Workflow diagram reference

The data contract and helper commands for the `workflow-diagram` skill. The procedure is in
[SKILL.md](SKILL.md), the visual rules are in [design.md](design.md), and embedding the map in
another page is in [embed.md](embed.md).

## Project files

```text
<project>/docs/dev-agents/diagram/
  workflow.json     # content: nodes, edges, lanes
  layout.json       # geometry: positions, routes, regions
  diagram.html      # generated; never edit or read back
  README.md         # sources, commands, verification
  screenshots/
  .gitignore        # lists .cache/ and .diagram-*.tmp
  .cache/           # temporary files
```

## Check, build, and preview

Replace `<installed-skill>` with this skill's directory and `<project>` with the target project root.
Quote both. Paths with spaces or Unicode work.

```sh
node "<installed-skill>/scripts/diagram.mjs" check --project "<project>"
```

```sh
node "<installed-skill>/scripts/diagram.mjs" build --project "<project>"
```

```sh
node "<installed-skill>/scripts/diagram.mjs" preview --project "<project>" --port 0
```

- `check` validates both JSON files and writes nothing.
- `build` validates, then replaces `diagram.html` atomically. On failure the previous HTML stays.
- `preview` serves only the diagram on `127.0.0.1` and prints its URL. Valid JSON edits reload the
  page; invalid edits print an error and keep the last valid page. `--port 0` picks a free port, and
  a busy port is an error. Stop it with Ctrl+C.
- All three reject symlinks inside the diagram path.
- The helper needs Node.js 22 or newer, uses only Node built-ins and this skill's `assets/`, and
  works from a read-only install without network access.

Relative `href` values in node links need a base URL on all three operations. HTTPS URLs and `#`
fragments do not. When the base names a directory, end it with a slash:

```sh
node "<installed-skill>/scripts/diagram.mjs" build --project "<project>" --documentation-base "https://github.com/<owner>/<repo>/blob/<default-branch>/"
```

## Content: `workflow.json`

The formal contracts are [workflow.schema.json](assets/workflow.schema.json) and
[layout.schema.json](assets/layout.schema.json). Both JSON files need `"schemaVersion": 1`.

A workflow needs a nonblank `title`, a nonempty `nodes` array, and an `edges` array. `subtitle` and
`lanes` are optional. Array order sets the Previous/Next order and the lane chip order.

A node needs `id`, `label`, and `summary`. IDs must be unique and may contain any characters.
`kind` is `skill` by default. `mode`, `artifact`, and `system` nodes are auxiliary: they draw with a
dashed border and a kind badge. A node without `lane` uses neutral styling.

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

Every `details` field is optional, and the panel shows only the fields you set. Text is never
parsed as HTML. Paired backticks mark inline code in `summary`, `body`, and `when`. Commands are
copied as text and never run.

Longer text produces warnings, never truncation. Aim for summaries of at most 30 words, `body` of
two sentences and 60 words, `when` of 25 words, at most two commands, and at most three links.

A lane needs `id`, `label`, and a `color` with six-digit hex `light` and `dark` values.

An edge needs a unique `id`, `from`, and `to`. `kind` is `primary` by default; `loop` is a return
path and `optional` draws dashed. `label` is optional text drawn on the route.

## Geometry: `layout.json`

- `nodes` maps every node ID to `{ "x": <number>, "y": <number> }`, the card's top-left corner.
- `edges` maps every edge ID to exactly one route. An edge without a route fails validation.
- `regions` is optional: `{ "lane", "x", "y", "width", "height" }` draws a dashed lane rectangle.

Coordinates are world pixels. Cards are a fixed 240 × 160. A route has a `start` point and one or
more cubic `segments`; each segment is two control points followed by its endpoint, six numbers in
all. A route must start and end on its cards' borders, within half a pixel. `labelOffset` places
the label relative to the route's midpoint and defaults to `[0, -18]`. `labelAngle` rotates it, in
degrees.

Forward edge, from a card at `(0, 0)` to a card at `(480, 0)`:

```json
{
  "start": [240, 80],
  "segments": [[320, 80, 400, 80, 480, 80]],
  "labelOffset": [0, -18]
}
```

Return (`loop`) edge, from the right card back through a lower corridor to the left card:

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

Vertical edge, from a card at `(0, 320)` up to a card at `(0, 0)`:

```json
{
  "start": [120, 320],
  "segments": [[120, 265, 120, 215, 120, 160]],
  "labelOffset": [100, 0]
}
```

The fitted view includes curve control points, so it can leave more margin than the visible curve
needs.

## Package

The helper and generated assets are ready to use; consumers install nothing. Their source, build,
and maintainer tests are in `tools/workflow-diagram/` of the skills repository, not in this
installed skill. Never edit `assets/` directly. The repository `LICENSE` covers the skill, and the
generated JavaScript embeds it. Bundled dependency licenses are in
[THIRD-PARTY-NOTICES.txt](assets/THIRD-PARTY-NOTICES.txt).
