import { mountDiagram } from './index.js';

// Only the standalone host owns location.hash and browser navigation.
export function mountStandalone(container, data, { syncUrl = true } = {}) {
  const diagram = mountDiagram(container, data);
  if (!syncUrl) return diagram;
  const abort = new AbortController();
  let reading = false;
  function readHash() {
    let id = null;
    if (location.hash.startsWith('#node=')) {
      try {
        const candidate = decodeURIComponent(location.hash.slice(6));
        if (data.workflow.nodes.some(node => node.id === candidate)) id = candidate;
      } catch { /* Invalid external fragments leave the map usable. */ }
    }
    reading = true;
    try { diagram.select(id); } finally { reading = false; }
  }
  container.addEventListener('diagram:select', event => {
    if (reading) return;
    const hash = event.detail.id === null ? '' : `#node=${encodeURIComponent(event.detail.id)}`;
    if (location.hash !== hash) {
      // Hash assignment also works for file://, where history.pushState is restricted.
      location.hash = hash;
    }
  }, { signal: abort.signal });
  window.addEventListener('hashchange', readHash, { signal: abort.signal });
  readHash();
  return { ...diagram, destroy() { abort.abort(); diagram.destroy(); } };
}
