import { build } from 'esbuild';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(root, '../..');
const skill = resolve(repository, 'skills/workflow-diagram');
const hash = data => createHash('sha256').update(data).digest('hex');
const outputs = {}, dependencies = new Map();
const common = { absWorkingDir: root, bundle: true, write: false, metafile: true, minify: true,
  target: 'es2022', loader: { '.css': 'text' }, logLevel: 'silent', legalComments: 'inline' };
for (const [name, entry, platform, format] of [
  ['model.mjs', 'src/export.js', 'node', 'esm'],
  ['workflow-diagram.js', 'src/index.js', 'browser', 'esm'],
  ['standalone.js', 'src/standalone-entry.js', 'browser', 'iife'],
]) {
  const result = await build({ ...common, entryPoints: [entry], platform, format });
  outputs[name] = result.outputFiles[0].text;
  for (const input of Object.keys(result.metafile.inputs).filter(path => path.includes('node_modules/'))) {
    let directory = dirname(resolve(root, input));
    while (directory !== root) {
      try {
        const pkg = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
        dependencies.set(pkg.name, { directory, pkg }); break;
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      directory = dirname(directory);
    }
  }
}
const notices = [];
for (const [name, { directory, pkg }] of [...dependencies].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
  const license = (await readdir(directory)).find(file => /^licen[sc]e(?:\.(?:txt|md))?$/i.test(file));
  if (!license) throw new Error(`Missing bundled license: ${name}`);
  notices.push(`${name} ${pkg.version} (${pkg.license})\n${await readFile(resolve(directory, license), 'utf8')}`);
}
for (const name of ['workflow.schema.json', 'layout.schema.json']) outputs[name] = await readFile(resolve(root, 'schema', name), 'utf8');
outputs['THIRD-PARTY-NOTICES.txt'] = notices.join('\n----------------------------------------\n\n');
const ownLicense = await readFile(resolve(repository, 'LICENSE'), 'utf8');
const licenseBanner = '/*!\n' + (ownLicense + '\nBundled dependencies\n\n' + outputs['THIRD-PARTY-NOTICES.txt']).replaceAll('*/', '* /') + '\n*/\n';
for (const name of ['model.mjs', 'standalone.js', 'workflow-diagram.js']) outputs[name] = licenseBanner + outputs[name];
async function sourceFiles(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    paths.push(...(entry.isDirectory() ? await sourceFiles(path) : [path]));
  }
  return paths;
}
const sources = {};
const files = [resolve(repository, 'LICENSE'), resolve(root, 'package.json'), resolve(root, 'package-lock.json')];
for (const dir of [resolve(root, 'src'), resolve(root, 'schema'), resolve(root, 'build'), resolve(skill, 'scripts')]) files.push(...await sourceFiles(dir));
for (const path of files.sort()) sources[relative(repository, path)] = hash(await readFile(path));
outputs['manifest.json'] = JSON.stringify({ schemaVersion: 1,
  generatorVersion: JSON.parse(await readFile(resolve(root, 'package.json'))).version,
  sources, outputs: Object.fromEntries(Object.entries(outputs).map(([path, data]) => [path, hash(data)])),
}, null, 2) + '\n';
const checking = process.argv.includes('--check');
if (!checking) await mkdir(resolve(skill, 'assets'), { recursive: true });
for (const [name, data] of Object.entries(outputs)) {
  const path = resolve(skill, 'assets', name);
  if (checking) {
    const current = await readFile(path).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (!current?.equals(Buffer.from(data))) throw new Error(`Stale generated asset: ${name}; run npm run build:assets`);
  } else await writeFile(path, data);
}
console.log(checking ? 'Generated assets are current.' : 'Generated runtime assets and dependency notices.');
