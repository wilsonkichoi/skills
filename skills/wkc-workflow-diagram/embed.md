# Embed a workflow diagram

The skill produces a standalone `diagram.html` and never needs this file. Use it only to show the
same map inside another page.

Copy `assets/workflow-diagram.js` from the installed skill next to your page, and serve the page over
HTTP. Give the container an explicit height. Your page loads the JSON.

```html
<div id="workflow" style="height: 720px" tabindex="-1"></div>
<script type="module">
  import { mountDiagram } from './workflow-diagram.js';

  const [workflow, layout] = await Promise.all([
    fetch('./workflow.json').then(response => response.json()),
    fetch('./layout.json').then(response => response.json()),
  ]);
  const diagram = mountDiagram(document.getElementById('workflow'), {
    workflow,
    layout,
    theme: 'auto',
  });
</script>
```

| API | Contract |
| --- | --- |
| `mountDiagram(container, { workflow, layout, theme })` | Validates, then mounts. `theme` is `auto` by default |
| `diagram.select(id)` | Opens a node by exact ID. An unknown ID throws |
| `diagram.select(null)` | Closes the panel and returns focus |
| `diagram.resetView()` | Fits the whole map, or recenters the selected node while the panel is open |
| `diagram.warnings` | Text-length warnings. Content is never truncated |
| `diagram.destroy()` | Removes the instance and its listeners. Safe to call twice |
| `validateModel(workflow, layout, options)` | Returns normalized copies and warnings. Invalid data throws `DiagramValidationError` |

A container holds one instance; destroy it before mounting again. The library keeps the
container's other children, isolates its styles in Shadow DOM, and gives each instance distinct DOM
IDs. Its keyboard handling stays inside its own instance.

The container receives a bubbling `diagram:select` event. `event.detail.id` is the node ID, or
`null` on close. The library never reads or writes the page URL. Only the standalone
`diagram.html` uses URL fragments such as `#node=<id>`, with Back/Forward support.

Relative links resolve against your page. To resolve them elsewhere, call `validateModel` with an
HTTPS `documentationBase` option and mount its output.
