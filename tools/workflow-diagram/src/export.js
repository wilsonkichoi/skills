export { validateModel, DiagramValidationError } from './model.js';
const escapeHTML = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function serializeData(data) {
  return JSON.stringify(data).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

export function renderStandalone(model, runtime, { live = false } = {}) {
  const workflow = model.workflow;
  const script = runtime.replace(/<\/script/gi, '<\\/script');
  return { warnings: model.warnings, html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(workflow.title)}</title>
<style>html,body{margin:0;height:100%;background:#f3f2f2}#diagram{height:100dvh;min-height:320px}noscript{font:16px sans-serif;padding:24px;display:block}</style>
</head><body><main id="diagram" tabindex="-1"></main><noscript>Enable JavaScript to explore this workflow diagram.</noscript>
<script id="diagram-data" type="application/json">${serializeData({ workflow: model.workflow, layout: model.layout })}</script>
<script>${script}</script>
${live ? '<script>const changes = new EventSource("/__changes"); let disconnected = false; changes.onmessage = () => location.reload(); changes.onerror = () => { disconnected = true; }; changes.onopen = () => { if (disconnected) location.reload(); };</script>' : ''}
</body></html>\n` };
}
