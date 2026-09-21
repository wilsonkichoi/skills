import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, readdir, rm, symlink, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { checkProject, buildProject, previewProject } from '../../../skills/workflow-diagram/scripts/diagram.mjs';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const repositoryRoot = resolve(root, '../..');
const skill = resolve(repositoryRoot, 'skills/workflow-diagram');
const cache = resolve(root, '.cache/package-tests');
await mkdir(cache, { recursive: true });
async function fixture(t, name = 'branching') {
  const base = await mkdtemp(join(cache, 'case-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const project = join(base, 'project 漢字 with spaces'), directory = join(project, 'docs/dev-agents/diagram');
  await mkdir(directory, { recursive: true });
  await cp(join(root, 'examples', name), directory, { recursive: true });
  await writeFile(join(project, 'untouched.txt'), 'project notes');
  return { base, project, directory };
}
async function inventory(directory) {
  const entries = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    entries.push(...(entry.isDirectory() ? (await inventory(path)).map(item => `${entry.name}/${item}`) : [entry.name]));
  }
  return entries.sort();
}
const json = (path, data) => writeFile(path, JSON.stringify(data, null, 2) + '\n');

test('explicit project from unrelated cwd, Unicode paths, no config, deterministic and isolated output', async t => {
  const { base, project, directory } = await fixture(t);
  const before = await inventory(project);
  const inputs = await Promise.all(['workflow.json', 'layout.json'].map(file => readFile(join(directory, file))));
  await exec(process.execPath, [join(skill, 'scripts/diagram.mjs'), 'check', '--project', project], { cwd: base });
  assert.deepEqual(await inventory(project), before);
  const first = await buildProject(project);
  const second = await buildProject(project);
  assert.equal(first.html, second.html);
  assert.match(first.html, /Copyright \(c\) 2026 Wilson Choi/);
  for (const name of ['ajv 8.20.0', 'fast-deep-equal 3.1.3', 'fast-uri 3.1.8', 'json-schema-traverse 1.0.0']) assert.ok(first.html.includes(name));
  assert.deepEqual(await inventory(project), [...before, 'docs/dev-agents/diagram/diagram.html'].sort());
  assert.equal(await readFile(join(project, 'untouched.txt'), 'utf8'), 'project notes');
  assert.deepEqual(await Promise.all(['workflow.json', 'layout.json'].map(file => readFile(join(directory, file)))), inputs);
});

for (const name of ['minimal', 'branching']) test(`shipped validator builds unrelated ${name} workflow`, async t => {
  const { project } = await fixture(t, name);
  const { html } = await buildProject(project);
  assert.doesNotMatch(html, /github\.com\/wilsonkichoi/);
  assert.match(html, /<script id="diagram-data"/);
});

for (const failure of ['invalid JSON', 'missing route', 'relative link']) test(`${failure} preserves prior HTML and reports the input path`, async t => {
  const { project, directory } = await fixture(t);
  const { html } = await buildProject(project);
  const path = join(directory, failure === 'missing route' ? 'layout.json' : 'workflow.json');
  if (failure === 'invalid JSON') await writeFile(path, '{');
  else {
    const value = JSON.parse(await readFile(path));
    if (failure === 'missing route') delete value.edges.forward;
    else value.nodes[0].details.links = [{ label: 'Guide', href: 'guide.md' }];
    await json(path, value);
  }
  await assert.rejects(() => buildProject(project), /(?:workflow|layout)\.json/);
  assert.equal(await readFile(join(directory, 'diagram.html'), 'utf8'), html);
  assert.equal((await readdir(directory)).some(name => name.endsWith('.tmp')), false);
  if (failure === 'relative link') {
    const result = await buildProject(project, { documentationBase: 'https://example.com/project/' });
    assert.match(result.html, /https:\/\/example.com\/project\/guide.md/);
  }
});

for (const target of ['diagram.html', 'workflow.json', 'diagram directory', 'docs directory', 'dangling output']) {
  test(`rejects ${target} symlink escape without external writes`, async t => {
    const { base, project, directory } = await fixture(t);
    const result = await buildProject(project);
    const outside = join(base, 'outside'); await mkdir(outside);
    await writeFile(join(outside, 'sentinel'), result.html);
    if (target === 'diagram directory' || target === 'docs directory') {
      const path = target === 'diagram directory' ? directory : join(project, 'docs');
      await rm(path, { recursive: true }); await symlink(outside, path);
    } else {
      const path = join(directory, target === 'dangling output' ? 'diagram.html' : target);
      await rm(path); await symlink(join(outside, target === 'dangling output' ? 'missing' : 'sentinel'), path);
    }
    await assert.rejects(() => buildProject(project), /Symlink/);
    assert.deepEqual(await readdir(outside), ['sentinel']);
    assert.equal(await readFile(join(outside, 'sentinel'), 'utf8'), result.html);
  });
}

test('preview refreshes valid edits, retains valid page on errors, rejects file requests, and releases resources', async t => {
  const { project, directory } = await fixture(t);
  const errors = [];
  const preview = await previewProject(project, { port: 0, onError: error => errors.push(error) });
  t.after(preview.close);
  const before = await (await fetch(preview.url)).text();
  assert.equal(await (await fetch(preview.url + '/?reload=1')).text(), before);
  assert.equal((await fetch(preview.url + '/workflow.json')).status, 404);
  assert.equal((await fetch(preview.url + '/../../untouched.txt')).status, 404);
  await assert.rejects(() => previewProject(project, { port: Number(new URL(preview.url).port) }), { code: 'EADDRINUSE' });
  const workflow = JSON.parse(await readFile(join(directory, 'workflow.json')));
  workflow.title = 'Updated preview'; await json(join(directory, 'workflow.json'), workflow);
  for (let i = 0; i < 100; i++) {
    if ((await (await fetch(preview.url)).text()).includes('Updated preview')) break;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  const updated = await (await fetch(preview.url)).text();
  assert.notEqual(updated, before); assert.match(updated, /Updated preview/);
  await writeFile(join(directory, 'workflow.json'), '{');
  for (let i = 0; i < 100 && !errors.length; i++) await new Promise(resolve => setTimeout(resolve, 20));
  assert.match(errors[0], /workflow.json/);
  assert.equal(await (await fetch(preview.url)).text(), updated);
  await preview.close(); await preview.close();
  await assert.rejects(() => fetch(preview.url));
  await json(join(directory, 'workflow.json'), workflow);
  const again = await previewProject(project, { port: Number(new URL(preview.url).port) });
  await again.close();
});

test('preview CLI terminates on SIGTERM and frees its port', async t => {
  const { project, base } = await fixture(t);
  const child = spawn(process.execPath, [join(skill, 'scripts/diagram.mjs'), 'preview', '--project', project, '--port', '0'], { cwd: base });
  t.after(() => child.kill());
  let output = '';
  const url = await new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) resolve(match[0]); });
    child.on('error', reject); child.on('exit', code => reject(new Error(`Preview exited before readiness: ${code}`)));
  });
  const exited = once(child, 'exit'); child.kill('SIGTERM');
  assert.deepEqual(await exited, [0, null]);
  await assert.rejects(() => fetch(url));
});

test('standalone installed assets require no npm, network, or writable installation', { skip: process.platform !== 'darwin' ? 'Network denial uses macOS sandbox-exec; supply an OS network sandbox elsewhere' : false }, async t => {
  let installed;
  t.after(async () => { if (installed) for (const dir of ['', 'scripts', 'assets']) await chmod(join(installed, dir), 0o755); });
  const { base, project } = await fixture(t, 'minimal');
  installed = join(base, 'installed skill');
  await mkdir(installed);
  for (const dir of ['scripts', 'assets']) await cp(join(skill, dir), join(installed, dir), { recursive: true });
  const before = await inventory(installed);
  for (const file of before) await chmod(join(installed, file), 0o444);
  for (const dir of ['scripts', 'assets', '']) await chmod(join(installed, dir), 0o555);
  for (const operation of ['check', 'build']) {
    const args = [join(installed, 'scripts/diagram.mjs'), operation, '--project', project];
    const policy = `(version 1)(allow default)(deny network*)(deny file-write* (subpath ${JSON.stringify(installed)}))`;
    await exec('/usr/bin/sandbox-exec', ['-p', policy, process.execPath, ...args], { cwd: base, env: { PATH: '' } });
  }
  assert.deepEqual(await inventory(installed), before);
});

test('generated assets are deterministic and detect source or schema drift', async t => {
  const base = await mkdtemp(join(cache, 'assets-')); t.after(() => rm(base, { recursive: true, force: true }));
  const repository = join(base, 'repository'), copy = join(repository, 'skills/workflow-diagram');
  const cwd = join(repository, 'tools/workflow-diagram');
  await mkdir(copy, { recursive: true });
  for (const dir of ['scripts', 'assets']) await cp(join(skill, dir), join(copy, dir), { recursive: true });
  for (const dir of ['src', 'schema', 'build']) await cp(join(root, dir), join(cwd, dir), { recursive: true });
  for (const file of ['LICENSE', 'VERSION']) await cp(join(repositoryRoot, file), join(repository, file));
  for (const file of ['package.json', 'package-lock.json']) await cp(join(root, file), join(cwd, file));
  await symlink(join(root, 'node_modules'), join(cwd, 'node_modules'));
  const run = (...args) => exec(process.execPath, ['build/assets.mjs', ...args], { cwd });
  await run('--check');
  const before = await readFile(join(copy, 'assets/manifest.json'));
  await run(); assert.deepEqual(await readFile(join(copy, 'assets/manifest.json')), before);
  for (const path of ['src/geometry.js', 'schema/layout.schema.json']) {
    const source = join(cwd, path), text = await readFile(source, 'utf8');
    await writeFile(source, text + '\n');
    await assert.rejects(() => run('--check'), /Stale generated asset/);
    await run(); await run('--check');
  }
  await writeFile(join(repository, 'VERSION'), '9.9.9');
  await assert.rejects(() => run('--check'), /Stale generated asset/);
  await run();
  assert.equal(JSON.parse(await readFile(join(copy, 'assets/manifest.json'), 'utf8')).generatorVersion, '9.9.9');
});

test('CLI executes through an installed skill symlink', async t => {
  const { base, project, directory } = await fixture(t, 'minimal');
  const linked = join(base, 'linked skill'); await symlink(skill, linked);
  const { stdout } = await exec(process.execPath, [join(linked, 'scripts/diagram.mjs'), 'build', '--project', project], { cwd: base });
  assert.match(stdout, /Built /);
  assert.match(await readFile(join(directory, 'diagram.html'), 'utf8'), /Minimal example/);
});
