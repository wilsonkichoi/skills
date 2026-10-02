import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARD, touchesCard, cubicPoint, routeMidpoint, labelBox, canvasBounds, fitView, zoomAt } from '../src/geometry.js';

const route = { start: [240, 80], segments: [[320, 80, 400, 80, 480, 80]] };
test('one card constant defines boundary checks', () => {
  assert.deepEqual(CARD, { width: 240, height: 160 });
  for (const point of [[0, 0], [240, 80], [120, 160], [0, 80]]) assert.ok(touchesCard(point, { x: 0, y: 0 }));
  for (const point of [[120, 80], [241, 80], [0, 161]]) assert.ok(!touchesCard(point, { x: 0, y: 0 }));
});
test('cubic evaluation and arc midpoint retain endpoints', () => {
  assert.deepEqual(cubicPoint(route.start, route.segments[0], 0), [240, 80]);
  assert.deepEqual(cubicPoint(route.start, route.segments[0], 1), [480, 80]);
  assert.deepEqual(routeMidpoint(route), [360, 80]);
});
test('bounds include negative positions, cubic hulls, regions, and rotated long labels', () => {
  const edge = { id: 'edge', label: 'A long label 漢字 repeated to extend beyond the path' };
  const layout = { nodes: { a: { x: -300, y: -200 }, b: { x: 480, y: 0 } }, edges: { edge: { ...route, labelAngle: 45 } },
    regions: [{ x: -600, y: 400, width: 1200, height: 50 }] };
  const bounds = canvasBounds({ edges: [edge] }, layout);
  const label = labelBox(edge, layout.edges.edge);
  assert.ok(bounds.x < -600 && bounds.y <= label.y - label.extentY);
  assert.ok(bounds.x + bounds.width > 720);
  assert.ok(bounds.y + bounds.height > 450);
});
test('fit contains the complete padded map at desktop, tablet, and phone sizes', () => {
  const bounds = { x: -200, y: -100, width: 1500, height: 900 };
  for (const [width, height] of [[1440, 700], [768, 800], [390, 550]]) {
    const view = fitView(bounds, width, height);
    assert.ok(view.x + bounds.x * view.scale >= -1e-9);
    assert.ok(view.y + bounds.y * view.scale >= -1e-9);
    assert.ok(view.x + (bounds.x + bounds.width) * view.scale <= width + 1e-9);
    assert.ok(view.y + (bounds.y + bounds.height) * view.scale <= height + 1e-9);
  }
});
test('pointer zoom retains its world anchor', () => {
  const view = { x: -123, y: 55, scale: .65 }, anchor = { x: 300, y: 220 };
  const next = zoomAt(view, 1.2, anchor);
  assert.ok(Math.abs((anchor.x - view.x) / view.scale - (anchor.x - next.x) / next.scale) < 1e-9);
  assert.ok(Math.abs((anchor.y - view.y) / view.scale - (anchor.y - next.y) / next.scale) < 1e-9);
});
