import css from './theme.css' with { type: 'text' };
import { validateModel } from './model.js';
import { CARD, canvasBounds, fitView, zoomAt } from './geometry.js';
import { renderShell, renderDetails } from './renderer.js';
import { bindViewport } from './interaction.js';

export { validateModel, DiagramValidationError } from './model.js';
let serial = 0;
const mounts = new WeakMap();

export function mountDiagram(container, { workflow: inputWorkflow, layout: inputLayout, theme = 'auto' }) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountDiagram requires an HTML container');
  if (mounts.has(container)) throw new Error('This container already contains a mounted diagram; destroy it before remounting');
  if (!['auto', 'light', 'dark'].includes(theme)) throw new Error('theme must be auto, light, or dark');
  const { workflow, layout, warnings } = validateModel(inputWorkflow, inputLayout);
  const host = document.createElement('div'); host.style.height = '100%';
  const shadow = host.attachShadow({ mode: 'open' }); container.append(host);
  const id = `workflow-${++serial}`;
  const ui = renderShell(shadow, css, workflow, layout, id);
  const abort = new AbortController(), { signal } = abort;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const bounds = canvasBounds(workflow, layout);
  let view = { x: 0, y: 0, scale: 1 }, selected = null, lane = null, hovered = null, focused = null;
  let destroyed = false, fitted = true, returnFocus = null;
  function listen(el, type, listener) { el.addEventListener(type, listener, { signal }); }
  function setView(next) {
    if (destroyed) return;
    view = next;
    ui.world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    ui.zoomValue.value = `${Math.round(view.scale * 100)}%`;
  }
  const minimumScale = () => Math.min(.15, fitView(bounds, Math.max(1, ui.viewport.clientWidth), Math.max(1, ui.viewport.clientHeight)).scale);
  function resetView() {
    if (destroyed) return;
    fitted = true;
    setView(fitView(bounds, Math.max(1, ui.viewport.clientWidth), Math.max(1, ui.viewport.clientHeight)));
    if (selected !== null) centerSelected();
  }
  function centerSelected() {
    if (selected === null || destroyed) return;
    const vp = ui.viewport.getBoundingClientRect(), panel = ui.panel.getBoundingClientRect();
    // Measure the actual drawer or sheet, including its border and container breakpoint.
    const bottomSheet = panel.width >= vp.width - 1;
    const width = Math.max(1, bottomSheet ? vp.width : panel.left - vp.left);
    const height = Math.max(1, bottomSheet ? panel.top - vp.top : vp.height);
    const scale = Math.max(.05, Math.min(1, (width - 32) / CARD.width, (height - 32) / CARD.height));
    const p = layout.nodes[selected];
    setView({ scale, x: width / 2 - (p.x + CARD.width / 2) * scale, y: height / 2 - (p.y + CARD.height / 2) * scale });
  }
  function emphasize() {
    const active = selected ?? hovered ?? focused;
    for (const node of workflow.nodes) {
      const card = ui.cards.get(node.id);
      card.dataset.dim = String(lane !== null && node.lane !== lane);
      card.setAttribute('aria-expanded', String(selected === node.id));
    }
    for (const edge of workflow.edges) {
      const connected = active !== null && (edge.from === active || edge.to === active);
      const from = workflow.nodes.find(n => n.id === edge.from), to = workflow.nodes.find(n => n.id === edge.to);
      const matches = lane === null || (from.lane === lane && to.lane === lane);
      const dim = !matches || (active !== null && !connected);
      const el = ui.edges.get(edge.id), label = ui.labels.get(edge.id);
      el.dataset.active = String(connected && matches); el.dataset.dim = String(dim);
      el.firstChild.setAttribute('marker-end', `url(#${id}-${connected && matches ? 'active' : 'normal'})`);
      if (label) {
        label.hidden = edge.kind === 'loop' && !connected;
        label.dataset.active = String(connected && matches); label.dataset.dim = String(dim);
      }
    }
    for (const [key, chip] of ui.chips) chip.setAttribute('aria-pressed', String(key === lane));
  }
  function notifySelection() {
    host.dispatchEvent(new CustomEvent('diagram:select', { detail: { id: selected }, bubbles: true }));
  }
  async function copy(text, control) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(text);
      if (destroyed || !control.isConnected) return;
      control.textContent = 'Copied'; ui.live.textContent = 'Command copied.';
    } catch {
      if (destroyed || !control.isConnected) return;
      control.textContent = 'Failed'; ui.live.textContent = 'Copy failed. Select and copy the command text manually.';
    }
  }
  function select(nodeId) {
    if (destroyed) return;
    if (nodeId === null) { close(); return; }
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Unknown node ID: ${JSON.stringify(nodeId)}`);
    if (selected === nodeId) return;
    if (selected === null) returnFocus = shadow.activeElement ?? ui.cards.get(nodeId);
    selected = nodeId; fitted = false; hovered = null;
    ui.panel.hidden = false; ui.backdrop.hidden = false;
    ui.header.inert = true; ui.viewport.inert = true; ui.footer.inert = true;
    const controls = renderDetails(ui.panel, node, workflow, id, copy);
    const index = workflow.nodes.indexOf(node);
    // These listeners die with their panel elements when the selected node changes.
    controls.close.addEventListener('click', close);
    controls.previous.addEventListener('click', () => select(workflow.nodes[index - 1].id));
    controls.next.addEventListener('click', () => select(workflow.nodes[index + 1].id));
    emphasize(); centerSelected(); controls.close.focus({ preventScroll: true }); notifySelection();
  }
  function close() {
    if (selected === null || destroyed) return;
    const last = selected; selected = null;
    ui.panel.hidden = true; ui.backdrop.hidden = true;
    ui.header.inert = false; ui.viewport.inert = false; ui.footer.inert = false;
    (returnFocus?.isConnected ? returnFocus : ui.cards.get(last)).focus({ preventScroll: true });
    returnFocus = null; emphasize(); notifySelection();
  }
  function applyTheme() {
    ui.root.dataset.theme = theme === 'auto' ? (media.matches ? 'dark' : 'light') : theme;
    ui.theme.textContent = `Theme: ${theme}`; ui.theme.setAttribute('aria-label', `Theme: ${theme}`);
  }
  listen(ui.theme, 'click', () => { theme = ['auto', 'light', 'dark'][(['auto', 'light', 'dark'].indexOf(theme) + 1) % 3]; applyTheme(); });
  media.addEventListener('change', applyTheme, { signal });
  for (const [key, card] of ui.cards) {
    listen(card, 'click', () => select(key));
    listen(card, 'mouseenter', () => { hovered = key; emphasize(); });
    listen(card, 'mouseleave', () => { hovered = null; emphasize(); });
    listen(card, 'focus', () => { focused = key; emphasize(); });
    listen(card, 'blur', () => { focused = null; emphasize(); });
  }
  for (const [key, chip] of ui.chips) listen(chip, 'click', () => { lane = lane === key ? null : key; emphasize(); });
  listen(ui.reset, 'click', resetView);
  for (const [control, multiplier] of [[ui.zoomIn, 1.2], [ui.zoomOut, 1 / 1.2]]) {
    listen(control, 'click', () => {
      fitted = false;
      setView(zoomAt(view, Math.max(minimumScale(), Math.min(3, view.scale * multiplier)), { x: ui.viewport.clientWidth / 2, y: ui.viewport.clientHeight / 2 }));
    });
  }
  listen(ui.backdrop, 'click', close);
  listen(ui.panel, 'keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'Tab') {
      const targets = [...ui.panel.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
      const first = targets[0], last = targets.at(-1), active = shadow.activeElement;
      if (event.shiftKey && (active === first || !targets.includes(active))) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && (active === last || !targets.includes(active))) { event.preventDefault(); first.focus(); }
    }
    // Arrow keys retain native scrolling, selection, and button behavior.
  });
  bindViewport(ui.viewport, { getView: () => view, setView, getMinimumScale: minimumScale, onIntent: () => { fitted = false; } }, signal);
  const resize = new ResizeObserver(() => {
    if (destroyed) return;
    if (selected !== null) centerSelected(); else if (fitted) resetView();
  });
  resize.observe(ui.stage); resize.observe(ui.panel);
  applyTheme(); emphasize(); resetView();
  const api = {
    select, resetView, warnings,
    destroy() {
      if (destroyed) return;
      const hadFocus = shadow.activeElement !== null;
      destroyed = true; abort.abort(); resize.disconnect(); host.remove(); mounts.delete(container);
      if (hadFocus && container.isConnected) container.focus({ preventScroll: true });
    },
  };
  mounts.set(container, api);
  return api;
}
