import { createServer } from 'node:http';
import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { makeStandalone, bundleOptions, root } from './standalone.mjs';

const clients = new Set();
let reloadTimer;
const targets = new Map([['/', 'examples/interaction'], ['/setup-tracker', 'examples/setup-tracker'], ['/minimal', 'examples/minimal'], ['/branching', 'examples/branching']]);
const watchers = ['src', 'examples'].map(dir => watch(resolve(root, dir), { recursive: true }, (event, filename) => {
  // Node --watch restarts the server for its own module dependencies. The client
  // reloads on SSE reconnection; do not race that restart with an early reload.
  if (dir === 'src' && ['model.js', 'geometry.js'].includes(String(filename))) return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const response of clients) response.write('data: change\n\n');
  }, 80);
}));
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/__changes') {
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    response.write(': connected\n\n'); clients.add(response);
    request.on('close', () => clients.delete(response)); return;
  }
  try {
    if (targets.has(path)) {
      const dir = targets.get(path);
      const { html } = await makeStandalone({ workflowPath: `${dir}/workflow.json`, layoutPath: `${dir}/layout.json`, live: true });
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(html);
    } else if (path === '/embed') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(await readFile(resolve(root, 'examples/embed.html')));
    } else if (path === '/library.js') {
      const result = await build({ ...bundleOptions, entryPoints: [resolve(root, 'src/index.js')], write: false, format: 'esm' });
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); response.end(result.outputFiles[0].text);
    } else if (path === '/standalone.js') {
      const result = await build({ ...bundleOptions, entryPoints: [resolve(root, 'src/standalone.js')], write: false, format: 'esm' });
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); response.end(result.outputFiles[0].text);
    } else if (/^\/(examples\/(minimal|branching|setup-tracker))\/(workflow|layout)\.json$/.test(path)) {
      response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(await readFile(resolve(root, path.slice(1))));
    } else { response.writeHead(404); response.end('Not found'); }
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(error.message);
  }
});
const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}\nExamples: /minimal, /branching, /embed\nSource and data changes reload the preview.`));
for (const event of ['SIGINT', 'SIGTERM']) process.once(event, () => {
  clearTimeout(reloadTimer);
  for (const watcher of watchers) watcher.close();
  for (const response of clients) response.end();
  server.close();
});
