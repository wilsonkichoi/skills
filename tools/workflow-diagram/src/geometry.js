export const CARD = Object.freeze({ width: 240, height: 160 });

export function touchesCard([x, y], position, tolerance = 0.5) {
  const left = position.x, top = position.y;
  const right = left + CARD.width, bottom = top + CARD.height;
  return ((Math.abs(x - left) <= tolerance || Math.abs(x - right) <= tolerance) && y >= top - tolerance && y <= bottom + tolerance)
    || ((Math.abs(y - top) <= tolerance || Math.abs(y - bottom) <= tolerance) && x >= left - tolerance && x <= right + tolerance);
}

export function cubicPoint(start, segment, t) {
  const u = 1 - t;
  return [0, 1].map(i => u ** 3 * start[i] + 3 * u * u * t * segment[i]
    + 3 * u * t * t * segment[i + 2] + t ** 3 * segment[i + 4]);
}

export function pathData(route) {
  return `M ${route.start.join(' ')} ${route.segments.map(s => `C ${s.join(' ')}`).join(' ')}`;
}

// Half the sampled arc length gives multi-segment routes a useful label anchor.
export function routeMidpoint(route) {
  let start = route.start, length = 0;
  const samples = [{ point: start, length: 0 }];
  for (const segment of route.segments) {
    for (let step = 1; step <= 40; step++) {
      const point = cubicPoint(start, segment, step / 40);
      const previous = samples.at(-1).point;
      length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      samples.push({ point, length });
    }
    start = segment.slice(4);
  }
  const index = samples.findIndex(sample => sample.length >= length / 2);
  if (index <= 0) return route.start;
  const before = samples[index - 1], after = samples[index];
  const ratio = (length / 2 - before.length) / (after.length - before.length || 1);
  return before.point.map((v, i) => v + (after.point[i] - v) * ratio);
}

export function labelBox(edge, route) {
  const anchor = routeMidpoint(route);
  const [dx, dy] = route.labelOffset ?? [0, -18];
  // A conservative fixed box also contains wide Unicode glyphs at the 11px label size.
  const width = Array.from(edge.label ?? '').length * 12 + 20, height = 26;
  const radians = (route.labelAngle ?? 0) * Math.PI / 180;
  return {
    x: anchor[0] + dx, y: anchor[1] + dy, width, height,
    extentX: Math.abs(width * Math.cos(radians)) / 2 + Math.abs(height * Math.sin(radians)) / 2,
    extentY: Math.abs(width * Math.sin(radians)) / 2 + Math.abs(height * Math.cos(radians)) / 2,
  };
}

export function canvasBounds(workflow, layout, padding = 36) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function include(x, y) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  for (const { x, y } of Object.values(layout.nodes)) {
    include(x, y); include(x + CARD.width, y + CARD.height);
  }
  for (const region of layout.regions ?? []) {
    include(region.x, region.y); include(region.x + region.width, region.y + region.height);
  }
  for (const edge of workflow.edges) {
    const route = layout.edges[edge.id];
    include(...route.start);
    // The control hull contains the whole curve, including its arrow tip.
    for (const s of route.segments) for (let i = 0; i < 6; i += 2) include(s[i], s[i + 1]);
    if (edge.label) {
      const b = labelBox(edge, route);
      include(b.x - b.extentX, b.y - b.extentY); include(b.x + b.extentX, b.y + b.extentY);
    }
  }
  return { x: minX - padding, y: minY - padding, width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 };
}

export function fitView(bounds, width, height) {
  const scale = Math.min(width / bounds.width, height / bounds.height, 1);
  return { scale, x: (width - bounds.width * scale) / 2 - bounds.x * scale,
    y: (height - bounds.height * scale) / 2 - bounds.y * scale };
}

export function zoomAt(view, scale, point) {
  const ratio = scale / view.scale;
  return { scale, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio };
}
