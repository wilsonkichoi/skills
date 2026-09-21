import { zoomAt } from './geometry.js';

// All gesture and keyboard listeners belong to this mounted viewport.
export function bindViewport(viewport, { getView, setView, getMinimumScale, onIntent }, signal) {
  const pointers = new Map();
  let previous = null, origin = null, dragged = false, suppressClick = false;
  function snapshot() {
    const points = [...pointers.values()];
    if (!points.length) return null;
    const [a, b = a] = points;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(b.x - a.x, b.y - a.y), count: points.length };
  }
  function point(event) {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function clamp(scale) { return Math.max(getMinimumScale(), Math.min(3, scale)); }
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || (event.pointerType === 'mouse' && event.target.closest('.wd-card'))) return;
    if (pointers.size >= 2) return;
    if (!pointers.size) { origin = point(event); dragged = false; suppressClick = false; }
    pointers.set(event.pointerId, point(event)); previous = snapshot();
    if (pointers.size > 1) { dragged = true; suppressClick = true; }
  }, { signal });
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, point(event));
    const current = snapshot();
    if (!dragged && Math.hypot(current.x - origin.x, current.y - origin.y) < 5) return;
    dragged = true; suppressClick = true; viewport.dataset.dragging = 'true'; onIntent();
    // Capture only after the threshold, preserving ordinary touch taps on cards.
    if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
    let view = getView();
    if (previous.count === 2 && current.count === 2 && previous.distance > 0) {
      view = zoomAt(view, clamp(view.scale * current.distance / previous.distance), previous);
    }
    setView({ ...view, x: view.x + current.x - previous.x, y: view.y + current.y - previous.y });
    previous = current;
  }, { signal });
  function finish(event) {
    pointers.delete(event.pointerId);
    previous = snapshot();
    if (!pointers.size) { viewport.dataset.dragging = 'false'; origin = null; }
    else origin = previous;
  }
  for (const type of ['pointerup', 'pointercancel']) viewport.addEventListener(type, finish, { signal });
  viewport.addEventListener('lostpointercapture', event => {
    // Touch starts with implicit capture on its target. Ignore that target losing
    // capture when a drag transfers ownership to the viewport.
    if (event.target === viewport) finish(event);
  }, { signal });
  viewport.addEventListener('pointerleave', event => {
    if (!viewport.hasPointerCapture(event.pointerId)) finish(event);
  }, { signal });
  viewport.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, { capture: true, signal });
  viewport.addEventListener('wheel', event => {
    event.preventDefault(); onIntent();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const factor = Math.exp(-Math.max(-200, Math.min(200, event.deltaY * unit)) * .0025);
    setView(zoomAt(getView(), clamp(getView().scale * factor), point(event)));
  }, { passive: false, signal });
}
