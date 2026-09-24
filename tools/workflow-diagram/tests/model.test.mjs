import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateModel, resolveLink, DiagramValidationError } from '../src/model.js';
import { makeStandalone, serializeData, readJSON } from '../build/standalone.mjs';

const load = async dir => Promise.all(['workflow', 'layout'].map(name => readFile(new URL(`../${dir}/${name}.json`, import.meta.url), 'utf8').then(JSON.parse)));
const initial = await load('examples/branching');
const fixture = () => structuredClone(initial);
for (const dir of ['examples/setup-tracker', 'examples/minimal', 'examples/branching']) {
  test(`${dir} satisfies the shared contract without editorial warnings`, async () => {
    const [workflow, layout] = await load(dir);
    assert.deepEqual(validateModel(workflow, layout).warnings, []);
  });
}
const invalid = [
  ['required field', (w) => delete w.title, /workflow.json\/title/],
  ['unknown workflow field', w => w.surprise = true, /workflow.json\/surprise/],
  ['unknown nested detail field', w => w.nodes[0].details.html = '<b>no</b>', /details\/html/],
  ['unknown layout field', (w, l) => l.edges.forward.nope = 1, /layout.json\/edges\/forward\/nope/],
  ['unsupported workflow version', w => w.schemaVersion = 2, /workflow.json\/schemaVersion/],
  ['unsupported layout version', (w, l) => l.schemaVersion = 0, /layout.json\/schemaVersion/],
  ['wrong node type', w => w.nodes[0].label = 7, /nodes\/0\/label/],
  ['empty nodes', w => w.nodes = [], /workflow.json\/nodes/],
  ['blank ID', w => w.nodes[0].id = '  ', /nodes\/0\/id/],
  ['unknown node kind', w => w.nodes[0].kind = 'action', /nodes\/0\/kind/],
  ['unknown edge kind', w => w.edges[0].kind = 'unknown', /edges\/0\/kind/],
  ['unsafe lane color', w => w.lanes[0].color.light = 'url(evil)', /color\/light/],
  ['duplicate node ID', w => w.nodes.push(w.nodes[0]), /duplicate ID/],
  ['duplicate lane ID', w => w.lanes.push(w.lanes[0]), /duplicate ID/],
  ['duplicate edge ID', w => w.edges.push(w.edges[0]), /duplicate ID/],
  ['unknown node lane', w => w.nodes[0].lane = 'missing', /unknown lane/],
  ['unknown edge source', w => w.edges[0].from = 'missing', /edges\/0\/from: unknown node/],
  ['unknown edge target', w => w.edges[0].to = 'missing', /edges\/0\/to: unknown node/],
  ['unknown region lane', (w, l) => l.regions[0].lane = 'missing', /regions\/0\/lane: unknown lane/],
  ['missing position', (w, l) => delete l.nodes.source, /nodes\/source: missing position/],
  ['missing route', (w, l) => delete l.edges.forward, /edges\/forward: missing route/],
  ['orphan position', (w, l) => l.nodes.orphan = { x: 0, y: 0 }, /nodes\/orphan: orphan position/],
  ['orphan route', (w, l) => l.edges.orphan = l.edges.forward, /edges\/orphan: orphan route/],
  ['empty route', (w, l) => l.edges.forward.segments = [], /segments: must NOT have fewer than 1/],
  ['malformed cubic segment', (w, l) => l.edges.forward.segments = [[1, 2]], /segments\/0/],
  ['non-numeric coordinate', (w, l) => l.nodes.source.x = '0', /nodes\/source\/x/],
  ['infinite coordinate', (w, l) => l.nodes.source.x = Infinity, /nodes\/source\/x/],
  ['NaN control point', (w, l) => l.edges.forward.segments[0][0] = NaN, /segments\/0\/0/],
  ['nonpositive region', (w, l) => l.regions[0].width = 0, /regions\/0\/width/],
  ['negative region', (w, l) => l.regions[0].height = -1, /regions\/0\/height/],
  ['route starts inside card', (w, l) => l.edges.forward.start = [120, 400], /start: route must touch/],
  ['route ends outside card', (w, l) => l.edges.forward.segments[0][4] = 470, /segments: route must touch/],
  ['script link', w => w.nodes[0].details.links = [{ label: 'bad', href: 'javascript:alert(1)' }], /links\/0\/href/],
  ['HTTP link', w => w.nodes[0].details.links = [{ label: 'bad', href: 'http://example.com' }], /only HTTPS/],
];
for (const [name, change, expected] of invalid) test(`rejects ${name} with a field path`, () => {
  const [w, l] = fixture(); change(w, l);
  assert.throws(() => validateModel(w, l), error => error instanceof DiagramValidationError && expected.test(error.message));
});

test('normalization does not mutate input and defaults kind and lanes', async () => {
  const [w, l] = await load('examples/minimal'); const before = structuredClone(w);
  const model = validateModel(w, l);
  assert.equal(model.workflow.nodes[0].kind, 'skill'); assert.deepEqual(model.workflow.lanes, []);
  assert.deepEqual(w, before);
});

test('parallel edges and disconnected nodes are preserved', () => {
  const [w, l] = fixture(); const model = validateModel(w, l);
  assert.equal(model.workflow.edges.filter(e => e.from === 'source' && e.to === 'transform').length, 2);
  assert.equal(model.workflow.nodes.at(-1).id, 'note');
});

test('arbitrary IDs use own properties, including prototype-looking IDs', async () => {
  const [w, l] = await load('examples/minimal');
  w.nodes[0].id = '__proto__'; l.nodes = JSON.parse('{"__proto__":{"x":0,"y":0}}');
  assert.equal(validateModel(w, l).workflow.nodes[0].id, '__proto__');
  l.nodes = {}; assert.throws(() => validateModel(w, l), /missing position/);
});

test('HTML, closing scripts, and paired backticks remain literal content', () => {
  const [w, l] = fixture(); w.nodes[0].summary = '</script><script>globalThis.pwned=1</script> `code` & <img onerror=alert(1)>';
  assert.equal(validateModel(w, l).workflow.nodes[0].summary, w.nodes[0].summary);
  const encoded = serializeData(w);
  assert.equal(encoded.includes('</script>'), false); assert.deepEqual(JSON.parse(encoded), w);
});

test('editorial limits warn without truncating valid content', () => {
  const [w, l] = fixture(); const long = 'word '.repeat(70);
  w.nodes[0].summary = long;
  w.nodes[0].details = { body: long, when: long, commands: Array.from({ length: 3 }, () => ({ label: 'label', text: 'text' })), links: Array.from({ length: 4 }, () => ({ label: 'ref', href: '#ref' })) };
  const model = validateModel(w, l);
  assert.equal(model.warnings.length, 5); assert.equal(model.workflow.nodes[0].summary, long);
});

test('sentence recommendations warn without rejecting content', () => {
  const [w, l] = fixture();
  w.nodes[0].summary = 'First sentence. Second sentence.';
  w.nodes[0].details = { body: 'One. Two. Three.', when: 'First. Second.' };
  assert.equal(validateModel(w, l).warnings.filter(message => message.includes('sentence')).length, 3);
});

for (const href of ['javascript:alert(1)', 'data:text/html,hi', 'file:///tmp/a', '//evil.test', '\\evil.test', ' https://test.com', 'java\nscript:hi', 'https://user:pass@test.com']) {
  test(`rejects unsupported link ${JSON.stringify(href)}`, () => assert.throws(() => resolveLink(href)));
}
test('link rules distinguish embedded, standalone, and explicitly based links', () => {
  assert.equal(resolveLink('docs/guide.md'), 'docs/guide.md');
  assert.equal(resolveLink('#node=hello', { standalone: true }), '#node=hello');
  assert.throws(() => resolveLink('guide.md', { standalone: true }), /documentationBase/);
  assert.throws(() => resolveLink('guide.md', { documentationBase: 'file:///tmp/' }), /HTTPS/);
  assert.equal(resolveLink('skills/setup/SKILL.md', { standalone: true, documentationBase: 'https://example.com/project/' }), 'https://example.com/project/skills/setup/SKILL.md');
});

test('standalone rejects unresolved documentation and missing routes', async () => {
  const [relativeWorkflow] = fixture(); relativeWorkflow.nodes[0].details.links = [{ label: 'Guide', href: 'guide.md' }];
  assert.throws(() => validateModel(relativeWorkflow, fixture()[1], { standalone: true }), /documentationBase/);
  const [w, l] = fixture(); delete l.edges.forward;
  assert.throws(() => validateModel(w, l, { standalone: true }), /missing route/);
});
test('malformed JSON names its input file', async () => {
  await assert.rejects(() => readJSON('src/model.js'), /model.js:/);
});
test('standalone inlines runtime, styles, and safely encoded data', async () => {
  const { html } = await makeStandalone({ workflowPath: 'examples/minimal/workflow.json', layoutPath: 'examples/minimal/layout.json' });
  assert.match(html, /<script id="diagram-data" type="application\/json">/);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|new EventSource/);
  assert.match(html, /Minimal example/);
});
