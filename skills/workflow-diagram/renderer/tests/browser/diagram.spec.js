import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { makeStandalone } from '../../build/standalone.mjs';

test.beforeEach(async ({ page }) => {
  await page.route('**/library.js', route => route.fulfill({
    contentType: 'text/javascript', path: resolve('../assets/workflow-diagram.js'),
  }));
});

const interaction = JSON.parse(await readFile(new URL('../../examples/interaction/workflow.json', import.meta.url), 'utf8'));
const card = (page, id) => page.locator(`.wd-card[data-node-id="${id}"]`);
const world = page => page.locator('.wd-world');
const transform = page => world(page).evaluate(el => {
  const m = new DOMMatrix(getComputedStyle(el).transform); return { x: m.e, y: m.f, scale: m.a };
});
const open = async page => { await page.goto('/'); await expect(card(page, 'source')).toBeVisible(); };

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
      expect(box.width).toBeGreaterThan(160); expect(box.x).toBeGreaterThanOrEqual(vp.x);
      expect(box.y).toBeGreaterThanOrEqual(vp.y);
      if (width < 780) {
        expect(panel.height).toBeLessThanOrEqual(vp.height * .65 + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(panel.y + 1);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.x + vp.width);
      } else {
        expect(panel.width).toBe(360); expect(box.x + box.width).toBeLessThanOrEqual(panel.x);
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
    await writeFile(dataPath, originalData); await writeFile(sourcePath, originalSource);
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
