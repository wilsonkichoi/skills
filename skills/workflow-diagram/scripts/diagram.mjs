#!/usr/bin/env node
import { readFile, lstat, realpath, open, rename, unlink } from 'node:fs/promises';
import { watch } from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { validateModel, renderStandalone } from '../assets/model.mjs';

const asset = name => new URL(`../assets/${name}`, import.meta.url);
export const generatorVersion = JSON.parse(await readFile(asset('manifest.json'), 'utf8')).generatorVersion;

// Reject links below the canonical project root, including dangling output links.
// No path is derived from content, URL paths, or the installation directory.
async function guarded(project, path, { missing = false } = {}) {
  const rel = relative(project, path);
  if (!rel || rel === '..' || rel.startsWith('../') || isAbsolute(rel)) throw new Error(`Path escapes project: ${path}`);
  let current = project;
  const parts = rel.split(/[\\/]/);
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    let stat;
    try { stat = await lstat(current); }
    catch (error) { if (missing && index === parts.length - 1 && error.code === 'ENOENT') return path; throw error; }
    if (stat.isSymbolicLink()) throw new Error(`Symlink is not allowed in diagram paths: ${current}`);
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`Expected directory: ${current}`);
    if (index === parts.length - 1 && !stat.isFile() && !stat.isDirectory()) throw new Error(`Expected regular file or directory: ${current}`);
  }
  return path;
}
export async function projectPaths(project) {
  if (!project) throw new Error('--project is required');
  const root = await realpath(resolve(project));
  if (!(await lstat(root)).isDirectory()) throw new Error(`Expected project directory: ${root}`);
  const directory = join(root, 'docs/dev-agents/diagram');
  await guarded(root, directory);
  return { root, directory };
}
async function readJSON(paths, name) {
  const path = join(paths.directory, name);
  try { return JSON.parse(await readFile(await guarded(paths.root, path), 'utf8')); }
  catch (error) { throw new Error(`${path}: ${error.message}`, { cause: error }); }
}
export async function checkProject(project, { documentationBase } = {}) {
  const paths = await projectPaths(project);
  const [workflow, layout] = await Promise.all(['workflow.json', 'layout.json'].map(name => readJSON(paths, name)));
  const model = validateModel(workflow, layout, { standalone: true, documentationBase });
  return { paths, model };
}
export async function buildProject(project, options = {}) {
  const { paths, model } = await checkProject(project, options);
  const runtime = await readFile(asset('standalone.js'), 'utf8');
  const { html } = renderStandalone(model, runtime);
  const output = join(paths.directory, 'diagram.html');
  await guarded(paths.root, output, { missing: true });
  const temporary = join(paths.directory, `.diagram-${randomUUID()}.tmp`);
  let created = false;
  try {
    await guarded(paths.root, temporary, { missing: true });
    const file = await open(temporary, 'wx', 0o644); created = true;
    try { await file.writeFile(html); await file.sync(); } finally { await file.close(); }
    await guarded(paths.root, output, { missing: true });
    await guarded(paths.root, temporary);
    await rename(temporary, output); created = false;
  } finally {
    if (created) {
      await guarded(paths.root, temporary);
      await unlink(temporary);
    }
  }
  return { ...paths, output, html, warnings: model.warnings };
}
export async function previewProject(project, { port = 4173, documentationBase, onError = console.error } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('--port must be an integer from 0 to 65535');
  const options = { documentationBase };
  let result = await checkProject(project, options);
  const runtime = await readFile(asset('standalone.js'), 'utf8');
  let html = renderStandalone(result.model, runtime, { live: true }).html;
  const clients = new Set();
  let timer, watcher, closed = false, pending = Promise.resolve();
  const server = createServer((request, response) => {
    if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }
    if (request.url === '/__changes') {
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      response.write(': connected\n\n'); clients.add(response);
      request.on('close', () => clients.delete(response)); return;
    }
    if (request.url !== '/' && request.url !== '/diagram.html') { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(html);
  });
  async function close() {
    if (closed) return;
    closed = true; clearTimeout(timer); watcher?.close();
    for (const response of clients) response.end();
    clients.clear();
    const stopped = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    server.closeAllConnections();
    await Promise.all([stopped, pending]);
  }
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { server.off('error', reject); resolve(); });
  });
  try {
    watcher = watch(result.paths.directory, (event, filename) => {
      if (filename && !['workflow.json', 'layout.json'].includes(String(filename))) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        pending = pending.then(async () => {
          if (closed) return;
          try {
            result = await checkProject(project, options);
            html = renderStandalone(result.model, runtime, { live: true }).html;
            if (!closed) for (const response of clients) response.write('data: change\n\n');
          } catch (error) { onError(error.message); }
        });
      }, 80);
    });
    watcher.on('error', error => { onError(error.message); void close().catch(onError); });
    server.on('error', error => { onError(error.message); void close().catch(onError); });
  } catch (error) { await close(); throw error; }
  return { url: `http://127.0.0.1:${server.address().port}`, close };
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(resolve(process.argv[1]))).href) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22 or newer is required');
    const { values, positionals } = parseArgs({ allowPositionals: true, options: {
      project: { type: 'string' }, 'documentation-base': { type: 'string' }, port: { type: 'string' },
    } });
    const [operation] = positionals;
    if (positionals.length !== 1 || !['check', 'build', 'preview'].includes(operation)) throw new Error('Usage: node diagram.mjs check|build|preview --project <path> [--documentation-base <HTTPS URL>] [--port <port>]');
    if (!values.project) throw new Error('--project is required');
    if (values.port !== undefined && operation !== 'preview') throw new Error('--port is only supported by preview');
    const options = { documentationBase: values['documentation-base'] };
    if (operation === 'preview') {
      if (values.port !== undefined && !/^\d+$/.test(values.port)) throw new Error('--port must be an integer from 0 to 65535');
      const preview = await previewProject(values.project, { ...options, port: Number(values.port ?? 4173) });
      const shutdown = () => preview.close().catch(error => { console.error(error.message); process.exitCode = 1; });
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, shutdown);
      console.log(`Preview: ${preview.url}`);
    } else {
      const result = operation === 'build' ? await buildProject(values.project, options) : await checkProject(values.project, options);
      for (const warning of result.warnings ?? result.model.warnings) console.warn(warning);
      console.log(operation === 'build' ? `Built ${result.output}` : `Valid ${result.paths.directory}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
