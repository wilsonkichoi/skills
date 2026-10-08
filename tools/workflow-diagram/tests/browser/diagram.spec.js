import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { makeStandalone } from '../../build/standalone.mjs';

test.beforeEach(async ({ page }) => {
  await page.route('**/library.js', route => route.fulfill({
    contentType: 'text/javascript', path: resolve('../../skills/wkc-workflow-diagram/assets/workflow-diagram.js'),
  }));
});

const interaction = JSON.parse(await readFile(new URL('../../examples/interaction/workflow.json', import.meta.url), 'utf8'));
const card = (page, id) => page.locator(`.wd-card[data-node-id="${id}"]`);
const world = page => page.locator('.wd-world');
const transform = page => world(page).evaluate(el => {
  const m = new DOMMatrix(getComputedStyle(el).transform); return { x: m.e, y: m.f, scale: m.a };
});
const open = async page => { await page.goto('/'); await expect(card(page, 'source')).toBeVisible(); };

test('repository header is concise and defaults to 70% zoom', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('../../docs/dev-agents/diagram/diagram.html')).href);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('wkc skills');
  await expect(page.locator('.wd-heading .wd-eyebrow, .wd-subtitle')).toHaveCount(0);
  await expect(page.locator('.wd-zoom output')).toHaveText('70%');
  await card(page, 'help').click();
  await expect(page.locator('.wd-zoom output')).toHaveText('70%');
});

for (const width of [1440, 390]) test(`closing slides details away without moving the canvas at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page); await card(page, 'source').click();
  const before = await transform(page), panel = page.locator('.wd-panel');
  const slide = await panel.evaluate(el => {
    el.querySelector('.wd-close').click();
    const animation = el.getAnimations()[0];
    animation.pause(); animation.currentTime = 120;
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return { x: matrix.e, y: matrix.f, inert: el.inert };
  });
  await expect(panel).toHaveAttribute('aria-hidden', 'true');
  expect(await transform(page)).toEqual(before);
  expect(slide.inert).toBe(true);
  expect(width < 780 ? slide.y : slide.x).toBeGreaterThan(0);
  await panel.evaluate(el => el.getAnimations()[0].play());
  await expect(panel).toBeHidden(); await expect(page.locator('.wd-backdrop')).toBeHidden();
  expect(await transform(page)).toEqual(before);
  await expect(card(page, 'source')).toBeFocused();
});

test('closing respects reduced motion and reopening cancels a pending slide', async ({ page }) => {
  await open(page); await card(page, 'source').click();
  await page.keyboard.press('Escape'); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.locator('.wd-panel').evaluate(el => el.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const before = await transform(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.wd-panel')).toBeHidden();
  expect(await transform(page)).toEqual(before);
});

for (const url of ['/', pathToFileURL(resolve('../../docs/dev-agents/diagram/diagram.html')).href]) {
  test(`details panel resizes, stays bounded, and remembers width: ${url}`, async ({ page }) => {
    await page.goto(url);
    const openingCard = page.locator('.wd-card').first();
    await openingCard.click();
    const panel = page.getByRole('dialog'), handle = page.getByRole('separator', { name: 'Resize details panel' });
    const width = () => panel.evaluate(el => el.getBoundingClientRect().width);
    async function drag(delta) {
      const box = await handle.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - delta, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
    }
    await drag(180); await expect.poll(width).toBe(900);
    await expect(panel).toBeVisible();
    await expect.poll(async () => {
      const node = await openingCard.boundingBox(), box = await panel.boundingBox();
      return node.x + node.width <= box.x;
    }).toBe(true);
    await page.getByRole('button', { name: 'Next node' }).click();
    await expect.poll(width).toBe(900);
    await page.keyboard.press('Escape'); await expect(page.locator('.wd-card').nth(1)).toBeFocused();
    await page.keyboard.press('Enter'); await expect.poll(width).toBe(900);
    await drag(-900); await expect.poll(width).toBe(280);
    await drag(1600); await expect.poll(width).toBe(1240);
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect.poll(width).toBe(800);
    await expect(handle).toHaveAttribute('aria-valuenow', '800');
    await expect(page.getByRole('button', { name: 'Close details' })).toBeInViewport();
  });
}

test('details resizing supports keyboard and stops on pointer cancellation', async ({ page }) => {
  await open(page); await card(page, 'source').click();
  const handle = page.getByRole('separator', { name: 'Resize details panel' });
  await page.keyboard.press('Tab'); await expect(handle).toBeFocused();
  for (const [key, width] of [['ArrowLeft', '740'], ['ArrowRight', '720'], ['End', '1240'], ['Home', '280']]) {
    await page.keyboard.press(key); await expect(handle).toHaveAttribute('aria-valuenow', width);
  }
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 100); await page.mouse.down();
  await page.mouse.move(box.x - 95, box.y + 100);
  await expect(handle).toHaveAttribute('aria-valuenow', '380');
  await handle.dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.move(box.x - 195, box.y + 100); await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '380');
  await page.keyboard.press('Escape'); await expect(card(page, 'source')).toBeFocused();
});

test('resized desktop details retain the full-width mobile sheet and focus cycle', async ({ page }) => {
  await open(page); await card(page, 'source').click();
  const handle = page.getByRole('separator', { name: 'Resize details panel' });
  await handle.focus(); await page.keyboard.press('End');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(handle).toBeHidden();
  const panel = page.getByRole('dialog');
  await expect.poll(() => panel.evaluate(el => el.getBoundingClientRect().width)).toBe(390);
  const close = page.getByRole('button', { name: 'Close details' });
  await close.focus(); await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Next node' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('.wd-panel-resize')).not.toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(handle).toBeVisible();
  await expect.poll(() => panel.evaluate(el => el.getBoundingClientRect().width)).toBe(1240);
});

for (const theme of ['light', 'dark']) test(`repository region grouping and panel colors match in ${theme}`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(pathToFileURL(resolve('../../docs/dev-agents/diagram/diagram.html')).href);
  const workflow = JSON.parse(await readFile(resolve('../../docs/dev-agents/diagram/workflow.json'), 'utf8'));
  const regions = page.locator('.wd-region');
  await expect(regions).toHaveCount(4);
  const colors = [];
  for (const lane of workflow.lanes) {
    const region = page.locator(`.wd-region[data-lane="${lane.id}"]`), box = await region.boundingBox();
    const style = await region.evaluate(el => ({ border: getComputedStyle(el).borderTopColor, fill: getComputedStyle(el).backgroundColor }));
    colors.push(style.border.match(/\d+/g).map(Number));
    expect(style.fill).not.toBe('rgba(0, 0, 0, 0)');
    for (const node of workflow.nodes.filter(node => node.lane === lane.id)) {
      const bounds = await card(page, node.id).boundingBox();
      expect(bounds.x).toBeGreaterThan(box.x); expect(bounds.y).toBeGreaterThan(box.y);
      expect(bounds.x + bounds.width).toBeLessThan(box.x + box.width);
      expect(bounds.y + bounds.height).toBeLessThan(box.y + box.height);
    }
  }
  expect(new Set(colors.map(color => color.join(','))).size).toBe(workflow.lanes.length);
  const coordination = colors[workflow.lanes.findIndex(lane => lane.id === 'coordination')];
  const documentation = colors[workflow.lanes.findIndex(lane => lane.id === 'documentation')];
  expect(Math.hypot(...coordination.map((value, k) => value - documentation[k]))).toBeGreaterThan(100);
  for (const id of ['setup', 'tracker', 'help', 'skills-release']) {
    await card(page, id).focus(); await page.keyboard.press('Enter');
    const laneColor = await card(page, id).evaluate(el => getComputedStyle(el).borderLeftColor);
    expect(await page.locator('.wd-panel-head').evaluate(el => getComputedStyle(el).borderBottomColor)).toBe(laneColor);
    expect(await page.locator('.wd-panel .wd-eyebrow').evaluate(el => getComputedStyle(el).color)).toBe(laneColor);
    const scrim = await page.locator('.wd-backdrop').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(Number(scrim.match(/[\d.]+/g).at(-1))).toBeCloseTo(theme === 'light' ? .4 : .55, 2);
    await page.keyboard.press('Escape');
  }
});

test('summary-only panel has no empty headings and Unicode URL IDs remain exact', async ({ page }) => {
  await page.goto('/minimal');
  await page.locator('.wd-card').click();
  await expect(page.locator('.wd-panel h3')).toHaveCount(0);
  await expect(page.locator('.wd-panel-body')).toHaveText('Select this node to see the smallest useful details panel.');
  await expect(page).toHaveURL(/#node=%E5%85%A5%E5%8F%A3%20%2F%20%CE%B1$/);
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('loop labels reveal on hover and focus; lane filtering retains selectable context', async ({ page }) => {
  await open(page);
  const loop = page.locator('.wd-edge-label[data-edge-id="return"]');
  await expect(loop).toBeHidden();
  await card(page, 'source').hover(); await expect(loop).toBeVisible();
  await page.getByRole('heading', { level: 1 }).hover(); await expect(loop).toBeHidden();
  await card(page, 'source').focus(); await expect(loop).toBeVisible();
  const chip = page.getByRole('button', { name: 'Filter Input' });
  await chip.click();
  await expect(card(page, 'transform')).toHaveAttribute('data-dim', 'true');
  await expect(page.locator('.wd-edge[data-edge-id="forward"]')).toHaveAttribute('data-dim', 'true');
  await card(page, 'transform').click();
  await expect(page.getByRole('heading', { name: 'Transform', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await chip.click();
  await expect(card(page, 'transform')).toHaveAttribute('data-dim', 'false');
});

test('keyboard opens details, traps focus, preserves arrow behavior, and restores focus', async ({ page }) => {
  await open(page);
  await card(page, 'source').focus(); await page.keyboard.press('Enter');
  const close = page.getByRole('button', { name: 'Close details' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Next node' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Source', exact: true })).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await page.locator('.wd-panel').evaluate(panel => panel.contains(panel.getRootNode().activeElement))).toBe(true);
  }
  expect(await page.locator('header').evaluate(el => el.inert)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden(); await expect(card(page, 'source')).toBeFocused();
  expect(await page.locator('header').evaluate(el => el.inert)).toBe(false);
});

test('backdrop closes and returns focus without selecting another node', async ({ page }) => {
  await open(page); await card(page, 'source').click();
  await page.locator('.wd-backdrop').click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole('dialog')).toBeHidden(); await expect(card(page, 'source')).toBeFocused();
});

for (const fitted of [true, false]) test(`closing after navigation keeps the current card position and zoom from a ${fitted ? 'fitted' : 'manual'} view`, async ({ page }) => {
  await page.goto('/branching');
  if (!fitted) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  for (const method of ['escape', 'button', 'backdrop']) {
    await card(page, 'source').focus(); await page.keyboard.press('Enter');
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Next node' }).click();
    const before = await transform(page);
    if (method === 'escape') await page.keyboard.press('Escape');
    else if (method === 'button') await page.getByRole('button', { name: 'Close details' }).click();
    else await page.locator('.wd-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(card(page, 'note')).toBeFocused();
    await expect(card(page, 'note')).toBeInViewport({ ratio: .9999 });
    expect(await transform(page)).toEqual(before);
  }
  await card(page, 'source').focus(); await page.keyboard.press('Enter');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().width)).toBe(390);
  const before = await transform(page);
  await page.keyboard.press('Escape');
  await expect(card(page, 'source')).toBeFocused();
  expect((await transform(page)).scale).toBe(before.scale);
});

test('opening details retains connected cards and paths without zooming in', async ({ page }) => {
  await open(page);
  const before = await transform(page);
  await card(page, 'source').click();
  expect((await transform(page)).scale).toBeLessThanOrEqual(before.scale);
  const vp = await page.locator('.wd-viewport').boundingBox(), panel = await page.getByRole('dialog').boundingBox();
  for (const id of ['source', 'transform', 'result']) {
    const box = await card(page, id).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(vp.x);
    expect(box.x + box.width).toBeLessThanOrEqual(panel.x);
    expect(box.y).toBeGreaterThanOrEqual(vp.y);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.y + vp.height);
  }
  const loop = await page.locator('.wd-edge[data-edge-id="return"]').boundingBox();
  expect(loop.y + loop.height).toBeLessThanOrEqual(vp.y + vp.height);
});

test('mouse pans, small movement remains a click, wheel retains its zoom anchor, reset fits', async ({ page }) => {
  await open(page);
  const initial = await transform(page), box = await page.locator('.wd-viewport').boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 60, { steps: 8 }); await page.mouse.up();
  const panned = await transform(page);
  expect(panned.x - initial.x).toBeCloseTo(80, 0); expect(panned.y - initial.y).toBeCloseTo(40, 0);
  const anchor = { x: 140, y: 110 };
  await page.locator('.wd-viewport').evaluate(el => el.addEventListener('wheel', event => {
    const rect = el.getBoundingClientRect();
    window.wheelAnchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, { once: true }));
  await page.mouse.move(box.x + anchor.x, box.y + anchor.y); await page.mouse.wheel(0, -180);
  await expect.poll(async () => (await transform(page)).scale).toBeGreaterThan(panned.scale);
  const zoomed = await transform(page);
  const actualAnchor = await page.evaluate(() => window.wheelAnchor);
  expect((actualAnchor.x - zoomed.x) / zoomed.scale).toBeCloseTo((actualAnchor.x - panned.x) / panned.scale, 2);
  expect((actualAnchor.y - zoomed.y) / zoomed.scale).toBeCloseTo((actualAnchor.y - panned.y) / panned.scale, 2);
  await page.getByRole('button', { name: 'Reset view' }).click();
  expect(await transform(page)).toEqual(initial);
  const cb = await card(page, 'source').boundingBox();
  await page.mouse.move(cb.x + 40, cb.y + 40); await page.mouse.down();
  await page.mouse.move(cb.x + 42, cb.y + 41); await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('zoom buttons work from keyboard and theme cycles with automatic preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' }); await open(page);
  await expect(page.locator('.wd')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Theme: auto' }).click();
  await expect(page.locator('.wd')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Theme: light' }).click();
  await expect(page.locator('.wd')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Theme: dark' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('.wd')).toHaveAttribute('data-theme', 'light');
  const before = await transform(page);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).focus(); await page.keyboard.press('Enter');
  expect((await transform(page)).scale).toBeGreaterThan(before.scale);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).focus(); await page.keyboard.press('Enter');
  expect((await transform(page)).scale).toBeCloseTo(before.scale);
});

test('copy reports actual success, delayed success, and failure', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: text => new Promise(resolve => { window.copied.push(text); window.finishCopy = resolve; }),
    } });
  });
  await card(page, 'source').click();
  const copy = page.getByRole('button', { name: 'Copy Codex', exact: true });
  await copy.click(); await expect(copy).toHaveText('Copy');
  await page.evaluate(() => window.finishCopy()); await expect(copy).toHaveText('Copied');
  expect(await page.evaluate(() => window.copied)).toEqual(['$ingest']);
  await page.evaluate(() => navigator.clipboard.writeText = async () => { throw new Error('Denied'); });
  await copy.click(); await expect(copy).toHaveText('Failed'); await expect(page.locator('.wd-live')).toContainText('Copy failed');
});

test('standalone history supports initial links, Back, Forward, unknown IDs, and malformed fragments', async ({ page }) => {
  await page.goto('/#node=source');
  await expect(page.getByRole('heading', { name: 'Source', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next node' }).click(); await expect(page).toHaveURL(/#node=transform$/);
  await page.goBack(); await expect(page.getByRole('heading', { name: 'Source', exact: true })).toBeVisible();
  await page.goForward(); await expect(page.getByRole('heading', { name: 'Transform', exact: true })).toBeVisible();
  for (const hash of ['#node=unknown', '#node=%E0%A4%A', '#other=setup']) {
    await page.goto('/' + hash); await expect(page.getByRole('dialog')).toBeHidden();
    await card(page, 'source').click(); await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close details' }).click(); await expect(page.getByRole('dialog')).toBeHidden();
  }
});

for (const [name, width, height] of [['desktop', 1440, 900], ['tablet', 768, 1024], ['phone', 390, 844]]) {
  for (const theme of ['light', 'dark']) {
    test(`${name} ${theme}: fitted bounds, selected card, panel, controls, and screenshot`, async ({ page }) => {
      await page.setViewportSize({ width, height }); await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await open(page);
      const vp = await page.locator('.wd-viewport').boundingBox();
      for (const id of interaction.nodes.map(node => node.id)) {
        const box = await card(page, id).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(vp.x); expect(box.y).toBeGreaterThanOrEqual(vp.y);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.x + vp.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(vp.y + vp.height + 1);
      }
      await mkdir(resolve('docs/screenshots'), { recursive: true });
      await page.screenshot({ path: `docs/screenshots/${name}-${theme}.png` });
      await card(page, 'source').click();
      const panel = await page.getByRole('dialog').boundingBox(), box = await card(page, 'source').boundingBox();
      expect(box.width).toBeGreaterThan(0); expect(box.x).toBeGreaterThanOrEqual(vp.x);
      expect(box.y).toBeGreaterThanOrEqual(vp.y);
      if (width < 780) {
        expect(panel.height).toBeLessThanOrEqual(vp.height * .65 + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(panel.y + 1);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.x + vp.width);
      } else {
        expect(panel.width).toBe(width / 2); expect(box.x + box.width).toBeLessThanOrEqual(panel.x);
      }
      await expect(page.getByRole('button', { name: 'Close details' })).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Next node' })).toBeInViewport();
      expect(await page.locator('.wd-panel-body').evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
      await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
      expect(await page.locator('.wd-close').evaluate(el => getComputedStyle(el).outlineColor)).toBe(theme === 'dark' ? 'rgb(255, 74, 44)' : 'rgb(236, 48, 19)');
      await page.locator('.wd-panel-body').evaluate(el => el.scrollTop = 0);
      await page.screenshot({ path: `docs/screenshots/${name}-${theme}-details.png` });
    });
  }
}

test('branching fixture shows every relationship and authored navigation including disconnected node', async ({ page }) => {
  await page.goto('/branching');
  await expect(page.locator('.wd-edge')).toHaveCount(5); await expect(page.locator('.wd-card')).toHaveCount(5);
  await expect(page.locator('.wd-edge[data-kind="optional"]')).toHaveCount(2);
  await card(page, 'source').click();
  await expect(page.locator('.wd-panel-body h3')).toHaveCount(1);
  for (const name of ['Transform', 'Result', 'Archive', 'Independent note']) {
    await page.getByRole('button', { name: 'Next node' }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('.wd-panel-body h3')).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Reset view' }).click();
  await page.screenshot({ path: 'docs/screenshots/branching-light.png' });
});

test('preview reloads data and reconnects after a source dependency restarts the server', async ({ page }) => {
  await open(page);
  const dataPath = resolve('examples/interaction/workflow.json'), sourcePath = resolve('src/model.js');
  const originalData = await readFile(dataPath, 'utf8'), originalSource = await readFile(sourcePath, 'utf8');
  try {
    const data = JSON.parse(originalData); data.title = 'Live preview verification';
    await writeFile(dataPath, JSON.stringify(data));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.title);
    await page.evaluate(() => window.beforeRestart = true);
    await writeFile(sourcePath, originalSource + '\n');
    await expect.poll(() => page.evaluate(() => window.beforeRestart), { timeout: 15_000 }).toBeUndefined();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.title);
  } finally {
    // Restoring the source restarts the server again; wait for it so later tests do not race it.
    await page.evaluate(() => window.beforeRestart = true);
    await writeFile(sourcePath, originalSource);
    await expect.poll(() => page.evaluate(() => window.beforeRestart).catch(() => true), { timeout: 15_000 }).toBeUndefined();
    // Restore data after the restart so its reload cannot satisfy the restart check early.
    await writeFile(dataPath, originalData);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(JSON.parse(originalData).title);
  }
});

test('two embedded diagrams isolate style, IDs, filters, URL, keyboard, and lifecycle', async ({ page }) => {
  await page.goto('/embed#host-hash');
  const first = page.locator('#first'), second = page.locator('#second');
  await expect(first.locator('.wd-card')).toHaveCount(1); await expect(second.locator('.wd-card')).toHaveCount(5);
  const ids = await page.evaluate(() => [...document.querySelectorAll('.map')].flatMap(el => [...el.firstElementChild.shadowRoot.querySelectorAll('[id]')].map(n => n.id)));
  expect(new Set(ids).size).toBe(ids.length);
  await expect(first.locator('.wd')).toHaveAttribute('data-theme', 'light');
  await expect(second.locator('.wd')).toHaveAttribute('data-theme', 'dark');
  const originalSecond = await second.locator('.wd-world').getAttribute('style');
  await first.locator('.wd-card').click();
  await expect(page).toHaveURL(/#host-hash$/);
  await expect(second.getByRole('dialog')).toBeHidden();
  expect(await second.locator('.wd-world').getAttribute('style')).toBe(originalSecond);
  await page.keyboard.press('Escape');
  await page.locator('#host-input').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.type('!');
  await expect(page.locator('#host-input')).toHaveValue(/!/);
  expect(await page.locator('body > h1').evaluate(el => getComputedStyle(el).fontFamily)).toBe('sans-serif');
  await page.evaluate(() => {
    window.oldApi = window.firstDiagram;
    window.firstDiagram.destroy(); window.firstDiagram.destroy();
    window.firstDiagram = window.mountDiagram(document.getElementById('first'), window.firstData);
    window.oldApi.select('入口 / α'); window.oldApi.resetView();
    window.events = 0; document.getElementById('first').addEventListener('diagram:select', () => window.events++);
  });
  await expect(first.locator('.wd')).toHaveCount(1);
  await first.locator('.wd-card').click(); expect(await page.evaluate(() => window.events)).toBe(1);
  await page.evaluate(() => window.firstDiagram.destroy()); await expect(first.locator('.wd')).toHaveCount(0);
  await page.setViewportSize({ width: 1000, height: 800 });
  await second.locator('.wd-card').first().click(); await expect(second.getByRole('dialog')).toBeVisible();
});

test('destroy disconnects ResizeObserver and media listeners before remount', async ({ page }) => {
  await page.addInitScript(() => {
    window.observers = { live: 0, disconnects: 0 };
    const Native = window.ResizeObserver;
    window.ResizeObserver = class extends Native {
      constructor(fn) { super(fn); window.observers.live++; }
      disconnect() { window.observers.live--; window.observers.disconnects++; super.disconnect(); }
    };
  });
  await page.goto('/embed'); await expect(page.locator('.wd')).toHaveCount(2);
  expect(await page.evaluate(() => window.observers.live)).toBe(2);
  await page.evaluate(() => window.firstDiagram.destroy());
  expect(await page.evaluate(() => window.observers)).toEqual({ live: 1, disconnects: 1 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => window.secondDiagram.destroy());
  expect(await page.evaluate(() => window.observers.live)).toBe(0);
});

test('malicious text stays literal and long details remain scrollable', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/embed'); await expect(page.locator('.wd')).toHaveCount(2);
  const text = '</script><script>window.pwned=1</script><img src=x onerror="window.pwned=2">';
  await page.evaluate(text => {
    window.firstDiagram.destroy();
    const data = structuredClone(window.firstData);
    data.workflow.nodes[0].summary = text;
    data.workflow.nodes[0].details = { body: (text + ' `inline code` ').repeat(80) };
    window.firstDiagram = window.mountDiagram(document.getElementById('first'), data);
  }, text);
  const first = page.locator('#first'); await first.locator('.wd-card').click();
  await expect(first.locator('.wd-panel-body > p').first()).toHaveText(text);
  await expect(first.locator('img, .wd-panel script')).toHaveCount(0);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined(); expect(errors).toEqual([]);
  expect(await first.locator('.wd-panel-body').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(first.locator('.wd-panel code')).toHaveCount(80);
});

test('touch pan, pinch, cancellation, and tap work on a real touch context', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await page.goto('http://127.0.0.1:4173/');
  await expect(card(page, 'source')).toBeVisible();
  const session = await context.newCDPSession(page), box = await page.locator('.wd-viewport').boundingBox();
  const touchCard = await card(page, 'source').boundingBox();
  const cardStart = { x: touchCard.x + touchCard.width / 2, y: touchCard.y + touchCard.height / 2 };
  const beforeCardDrag = await transform(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 4, ...cardStart }] });
  for (const distance of [12, 24, 36, 48, 60]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 4, x: cardStart.x + distance, y: cardStart.y }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await transform(page)).x - beforeCardDrag.x).toBeCloseTo(60, 0);
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Reset view' }).tap();
  const before = await transform(page);
  const point = (id, x, y) => ({ id, x, y });
  const y = box.y + 35;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(1, 80, y)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(1, 130, y + 20)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const panned = await transform(page); expect(panned.x).toBeGreaterThan(before.x + 20);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(1, 120, y + 30), point(2, 230, y + 30)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(1, 80, y + 30), point(2, 270, y + 30)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await transform(page)).scale).toBeGreaterThan(panned.scale);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(3, 20, y)] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('.wd-viewport')).not.toHaveAttribute('data-dragging', 'true');
  await page.getByRole('button', { name: 'Reset view' }).tap(); await card(page, 'source').tap();
  await expect(page.getByRole('dialog')).toBeVisible();
  await context.close();
});

for (const name of ['diagram', 'minimal', 'branching']) {
  test(`${name} standalone opens through file:// with network blocked and no dependency requests`, async ({ browser }) => {
    const context = await browser.newContext({ offline: true }); const page = await context.newPage();
    const requests = [], errors = [];
    page.on('request', request => requests.push(request.url())); page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(resolve(`dist/${name}.html`)).href);
    await expect(page.locator('.wd-card').first()).toBeVisible();
    await page.locator('.wd-card').first().click(); await expect(page.getByRole('dialog')).toBeVisible();
    await page.reload(); await expect(page.getByRole('dialog')).toBeVisible();
    expect(requests.every(url => url.startsWith('file:'))).toBe(true);
    expect(requests.filter(url => !url.startsWith(pathToFileURL(resolve(`dist/${name}.html`)).href))).toEqual([]);
    expect(errors).toEqual([]); await context.close();
  });
}

test('standalone escaping survives script-closing text in an actual HTML document', async ({ page }) => {
  const workflow = { schemaVersion: 1, title: '</title><script>window.pwned=1</script>', nodes: [{ id: 'literal', label: 'Literal', summary: '</script><script>window.pwned=2</script>' }], edges: [] };
  const layout = { schemaVersion: 1, nodes: { literal: { x: 0, y: 0 } }, edges: {} };
  await writeFile('test-results/unsafe-workflow.json', JSON.stringify(workflow));
  await writeFile('test-results/unsafe-layout.json', JSON.stringify(layout));
  const { html } = await makeStandalone({ workflowPath: 'test-results/unsafe-workflow.json', layoutPath: 'test-results/unsafe-layout.json' });
  await writeFile('test-results/unsafe.html', html);
  await page.goto(pathToFileURL(resolve('test-results/unsafe.html')).href);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(workflow.title);
  await page.locator('.wd-card').click(); await expect(page.locator('.wd-panel-body')).toHaveText(workflow.nodes[0].summary);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
});
