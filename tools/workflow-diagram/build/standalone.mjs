import { build } from 'esbuild';
import { readFile, mkdir, writeFile, realpath } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateModel } from '../src/model.js';

import { renderStandalone } from '../src/export.js';
export const root = fileURLToPath(new URL('../', import.meta.url));
export { serializeData } from '../src/export.js';
export async function readJSON(path) {
  const absolute = resolve(root, path);
  try { return JSON.parse(await readFile(absolute, 'utf8')); }
  catch (error) { throw new Error(`${relative(root, absolute)}: ${error.message}`, { cause: error }); }
}
export const bundleOptions = { bundle: true, platform: 'browser', target: ['es2022'], loader: { '.css': 'text' }, logLevel: 'silent', legalComments: 'inline' };

export async function makeStandalone({ workflowPath, layoutPath, documentationBase, live = false } = {}) {
  const [workflow, layout] = await Promise.all([readJSON(workflowPath), readJSON(layoutPath)]);
  const model = validateModel(workflow, layout, { standalone: true, documentationBase });
  const result = await build({ ...bundleOptions, write: false, format: 'iife', minify: !live,
    entryPoints: [resolve(root, 'src/standalone-entry.js')] });
  return renderStandalone(model, result.outputFiles[0].text, { live });
}

export async function buildLibrary() {
  await mkdir(resolve(root, 'dist'), { recursive: true });
  await build({ ...bundleOptions, entryPoints: [resolve(root, 'src/index.js')], outfile: resolve(root, 'dist/workflow-diagram.js'), format: 'esm', minify: true });
}

export async function buildAll() {
  await buildLibrary();
  for (const [dir, output] of [['examples/setup-tracker', 'diagram'], ['examples/minimal', 'minimal'], ['examples/branching', 'branching']]) {
    const { html, warnings } = await makeStandalone({ workflowPath: `${dir}/workflow.json`, layoutPath: `${dir}/layout.json` });
    for (const warning of warnings) console.warn(warning);
    await writeFile(resolve(root, `dist/${output}.html`), html);
    console.log(`Built dist/${output}.html (${Buffer.byteLength(html).toLocaleString()} bytes)`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(resolve(process.argv[1]))).href) {
  try {
    await buildAll();
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
