import { CARD, pathData, labelBox } from './geometry.js';

export function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
export function button(text, label = text, className = '') {
  const el = element('button', className, text);
  el.type = 'button'; el.setAttribute('aria-label', label);
  return el;
}
export function textRuns(el, text) {
  // Only paired backticks have meaning. All remaining content is literal text.
  for (const [i, part] of text.split(/(`[^`]+`)/gu).entries()) {
    el.append(i % 2 ? element('code', '', part.slice(1, -1)) : document.createTextNode(part));
  }
  return el;
}
function laneStyle(el, lane) {
  el.dataset.lane = lane?.id ?? '';
  if (lane) {
    el.style.setProperty('--lane-light', lane.color.light);
    el.style.setProperty('--lane-dark', lane.color.dark);
  }
}
function svg(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

export function renderShell(shadow, css, workflow, layout, id) {
  const style = element('style'); style.textContent = css;
  const root = element('div', 'wd'); root.setAttribute('role', 'region'); root.setAttribute('aria-label', workflow.title);
  const header = element('header');
  const top = element('div', 'wd-top');
  const heading = element('div', 'wd-heading');
  heading.append(element('p', 'wd-eyebrow', `Workflow map / ${String(workflow.nodes.length).padStart(2, '0')} nodes`), element('h1', '', workflow.title));
  if (workflow.subtitle) heading.append(element('p', 'wd-subtitle', workflow.subtitle));
  const tools = element('div', 'wd-tools'); tools.setAttribute('role', 'group'); tools.setAttribute('aria-label', 'View controls');
  const zoom = element('div', 'wd-zoom');
  const zoomOut = button('−', 'Zoom out'), zoomIn = button('+', 'Zoom in'), zoomValue = element('output', '', '100%');
  zoomValue.setAttribute('aria-label', 'Zoom level'); zoomValue.setAttribute('aria-live', 'off');
  zoom.append(zoomOut, zoomValue, zoomIn);
  const reset = button('Reset view'), theme = button('Theme: auto');
  tools.append(zoom, reset, theme); top.append(heading, tools); header.append(top);
  const lanes = new Map(workflow.lanes.map(lane => [lane.id, lane]));
  const filters = element('div', 'wd-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Filter by lane');
  const chips = new Map();
  workflow.lanes.forEach((lane, index) => {
    const chip = button('', `Filter ${lane.label}`, 'wd-chip'); laneStyle(chip, lane);
    chip.setAttribute('aria-pressed', 'false');
    chip.append(element('span', '', String(index + 1).padStart(2, '0')), document.createTextNode(lane.label),
      element('span', '', String(workflow.nodes.filter(n => n.lane === lane.id).length)));
    chips.set(lane.id, chip); filters.append(chip);
  });
  if (chips.size) header.append(filters);
  const stage = element('div', 'wd-stage'), viewport = element('div', 'wd-viewport'), world = element('div', 'wd-world');
  viewport.setAttribute('aria-label', 'Workflow canvas');
  for (const region of layout.regions ?? []) {
    const el = element('div', 'wd-region'); laneStyle(el, lanes.get(region.lane));
    Object.assign(el.style, { left: `${region.x}px`, top: `${region.y}px`, width: `${region.width}px`, height: `${region.height}px` });
    el.append(element('span', 'wd-region-label', lanes.get(region.lane).label)); world.append(el);
  }
  const edgesSvg = svg('svg', { class: 'wd-edges', 'aria-hidden': 'true' });
  const defs = svg('defs');
  for (const [suffix, color] of [['normal', 'var(--edge)'], ['active', 'var(--accent)']]) {
    const marker = svg('marker', { id: `${id}-${suffix}`, viewBox: '0 0 10 10', refX: 10, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
    marker.append(svg('path', { d: 'M 0 0 L 10 5 L 0 10 Z', fill: color })); defs.append(marker);
  }
  edgesSvg.append(defs); world.append(edgesSvg);
  const edges = new Map(), labels = new Map();
  for (const edge of workflow.edges) {
    const group = svg('g', { class: 'wd-edge', 'data-kind': edge.kind, 'data-edge-id': edge.id });
    const path = svg('path', { d: pathData(layout.edges[edge.id]), 'marker-end': `url(#${id}-normal)` });
    group.append(path); edgesSvg.append(group); edges.set(edge.id, group);
    if (edge.label) {
      const box = labelBox(edge, layout.edges[edge.id]);
      const label = element('div', 'wd-edge-label'); label.dataset.edgeId = edge.id;
      label.append(element('span', '', edge.label));
      Object.assign(label.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px`,
        transform: `translate(-50%, -50%) rotate(${layout.edges[edge.id].labelAngle ?? 0}deg)` });
      world.append(label); labels.set(edge.id, label);
    }
  }
  const cards = new Map();
  workflow.nodes.forEach((node, index) => {
    const lane = lanes.get(node.lane), card = button('', `${node.label}: ${node.summary}`, 'wd-card');
    card.dataset.nodeId = node.id; card.dataset.kind = node.kind; card.id = `${id}-node-${index}`;
    card.setAttribute('aria-haspopup', 'dialog'); card.setAttribute('aria-expanded', 'false');
    laneStyle(card, lane);
    Object.assign(card.style, { left: `${layout.nodes[node.id].x}px`, top: `${layout.nodes[node.id].y}px`, width: `${CARD.width}px`, height: `${CARD.height}px` });
    const meta = element('span', 'wd-card-meta'); meta.append(element('span', '', lane?.label ?? 'Independent'));
    if (node.kind !== 'skill') meta.append(element('span', 'wd-badge', node.kind));
    card.append(meta, element('span', 'wd-card-title', node.label), textRuns(element('span', 'wd-card-summary'), node.summary));
    cards.set(node.id, card); world.append(card);
  });
  viewport.append(world);
  const backdrop = element('div', 'wd-backdrop'); backdrop.hidden = true;
  const panel = element('div', 'wd-panel'); panel.hidden = true; panel.tabIndex = -1;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', `${id}-title`);
  stage.append(viewport, backdrop, panel);
  const footer = element('footer', 'wd-footer');
  const legend = element('div', 'wd-legend');
  for (const [label, dashed] of [['Primary / return', false], ['Optional', true]]) {
    const item = element('span'); item.append(element('i', dashed ? 'wd-dashed' : ''), document.createTextNode(label)); legend.append(item);
  }
  footer.append(legend, element('span', '', 'Drag to pan · Scroll to zoom · Select to explore'));
  const live = element('div', 'wd-live'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  root.append(header, stage, footer, live); shadow.append(style, root);
  return { root, header, stage, viewport, world, backdrop, panel, footer, live, cards, edges, labels, chips, zoomOut, zoomIn, zoomValue, reset, theme };
}

export function renderDetails(panel, node, workflow, id, onCopy) {
  const index = workflow.nodes.findIndex(n => n.id === node.id);
  const head = element('div', 'wd-panel-head'), heading = element('div');
  const lane = workflow.lanes.find(l => l.id === node.lane);
  const title = element('h2', '', node.label); title.id = `${id}-title`;
  heading.append(element('p', 'wd-eyebrow', `${lane?.label ?? 'Independent'} / ${node.kind}`), title);
  const close = button('×', 'Close details', 'wd-close'); head.append(heading, close);
  const body = element('div', 'wd-panel-body'); body.append(textRuns(element('p'), node.summary));
  const details = node.details ?? {};
  if (details.body) body.append(textRuns(element('p'), details.body));
  function section(title) {
    const section = element('section'); section.append(element('h3', '', title)); body.append(section); return section;
  }
  if (details.when) section('When').append(textRuns(element('p'), details.when));
  if (details.commands?.length) {
    const commands = section('Commands');
    for (const command of details.commands) {
      const item = element('div', 'wd-command'), row = element('div', 'wd-command-row');
      const copy = button('Copy', `Copy ${command.label}`);
      copy.addEventListener('click', () => onCopy(command.text, copy));
      row.append(element('pre', '', command.text), copy); item.append(element('label', '', command.label), row); commands.append(item);
    }
  }
  if (details.links?.length) {
    const links = element('ul', 'wd-links');
    for (const link of details.links) {
      const item = element('li'), a = element('a', '', link.label); a.href = link.href;
      if (!link.href.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      item.append(a); links.append(item);
    }
    section('Documentation').append(links);
  }
  const relationships = workflow.edges.filter(e => e.from === node.id || e.to === node.id);
  if (relationships.length) {
    const list = element('ul', 'wd-relationships');
    for (const edge of relationships) {
      const from = workflow.nodes.find(n => n.id === edge.from), to = workflow.nodes.find(n => n.id === edge.to);
      list.append(element('li', '', `${from.label} → ${to.label}${edge.label ? ': ' + edge.label : ''} (${edge.kind})`));
    }
    section('Relationships').append(list);
  }
  const nav = element('nav', 'wd-panel-nav'); nav.setAttribute('aria-label', 'Browse nodes');
  const previous = button('← Previous', 'Previous node'), next = button('Next →', 'Next node');
  previous.disabled = index === 0; next.disabled = index === workflow.nodes.length - 1;
  nav.append(previous, element('span', '', `${index + 1} / ${workflow.nodes.length}`), next);
  panel.replaceChildren(head, body, nav);
  return { close, previous, next };
}
