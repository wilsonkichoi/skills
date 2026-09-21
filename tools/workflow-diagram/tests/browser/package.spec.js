import { test, expect } from '@playwright/test';
import { mkdir, mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildProject, previewProject } from '../../../../skills/workflow-diagram/scripts/diagram.mjs';

async function project(name) {
  await mkdir('.cache/browser-projects', { recursive: true });
  const root = await mkdtemp(resolve('.cache/browser-projects/project 漢字 '));
  const directory = join(root, 'docs/dev-agents/diagram');
  await mkdir(directory, { recursive: true });
  await cp(`examples/${name}`, directory, { recursive: true });
  return { root, directory };
}
for (const name of ['minimal', 'branching']) test(`packaged helper renders ${name} offline without sibling requests`, async ({ browser }) => {
  const { root } = await project(name);
  const context = await browser.newContext({ offline: true });
  try {
    const result = await buildProject(root), url = pathToFileURL(result.output).href;
    const page = await context.newPage(), requests = [], errors = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url); await page.locator('.wd-card').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.reload(); await expect(page.getByRole('dialog')).toBeVisible();
    expect(requests.every(request => request.split('#')[0] === url)).toBe(true);
    expect(errors).toEqual([]);
  } finally { await context.close(); await rm(root, { recursive: true, force: true }); }
});

test('packaged preview reloads after valid edits and stops its change stream', async ({ page }) => {
  const { root, directory } = await project('minimal');
  const preview = await previewProject(root, { port: 0 });
  try {
    await page.goto(preview.url);
    const file = join(directory, 'workflow.json');
    const workflow = JSON.parse(await readFile(file)); workflow.title = 'New project title';
    await writeFile(file, JSON.stringify(workflow));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('New project title');
    await preview.close();
    await expect(async () => { await fetch(preview.url); }).rejects.toThrow();
  } finally { await page.goto('about:blank'); await preview.close(); await rm(root, { recursive: true, force: true }); }
});

test('packaged export keeps hostile title, summary, and commands literal', async ({ browser }) => {
  const { root, directory } = await project('minimal');
  const context = await browser.newContext({ offline: true });
  try {
    const file = join(directory, 'workflow.json'); const workflow = JSON.parse(await readFile(file));
    const hostile = '</script><script>window.pwned=1</script><img src=x onerror="window.pwned=2">';
    workflow.title = '</title>' + hostile;
    workflow.nodes[0].summary = hostile;
    workflow.nodes[0].details = { commands: [{ label: 'Literal', text: hostile }] };
    await writeFile(file, JSON.stringify(workflow));
    const result = await buildProject(root), page = await context.newPage();
    await page.goto(pathToFileURL(result.output).href);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(workflow.title);
    await page.locator('.wd-card').click(); await expect(page.locator('.wd-command pre')).toHaveText(hostile);
    expect(await page.evaluate(() => window.pwned)).toBeUndefined();
    await expect(page.locator('img')).toHaveCount(0);
  } finally { await context.close(); await rm(root, { recursive: true, force: true }); }
});
