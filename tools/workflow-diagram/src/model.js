import Ajv from 'ajv';
import workflowSchema from '../schema/workflow.schema.json' with { type: 'json' };
import layoutSchema from '../schema/layout.schema.json' with { type: 'json' };
import { touchesCard } from './geometry.js';

const ajv = new Ajv({ allErrors: true, strict: true });
const validators = [ajv.compile(workflowSchema), ajv.compile(layoutSchema)];
const pointer = value => String(value).replaceAll('~', '~0').replaceAll('/', '~1');

export class DiagramValidationError extends Error {
  constructor(errors) {
    super(errors.join('\n'));
    this.name = 'DiagramValidationError';
    this.errors = errors;
  }
}

export function resolveLink(href, { standalone = false, documentationBase } = {}) {
  if (/[\u0000-\u0020\u007f\\]/u.test(href) || href.startsWith('//')) throw new Error('use HTTPS, a fragment, or a relative documentation path');
  if (href.startsWith('#')) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('only HTTPS links without credentials are supported');
    return url.href;
  }
  if (documentationBase) {
    const base = new URL(documentationBase);
    if (base.protocol !== 'https:' || base.username || base.password) throw new Error('documentationBase must be an HTTPS URL without credentials');
    return new URL(href, base).href;
  }
  if (standalone) throw new Error('relative link requires an explicit documentationBase for standalone export');
  return href;
}

export function validateModel(workflow, layout, options = {}) {
  const errors = [], warnings = [];
  for (const [i, value] of [workflow, layout].entries()) {
    if (!validators[i](value)) for (const e of validators[i].errors) {
      const field = e.params.additionalProperty ?? e.params.missingProperty;
      errors.push(`${i ? 'layout.json' : 'workflow.json'}${e.instancePath || ''}${field ? '/' + pointer(field) : ''}: ${e.message}`);
    }
  }
  if (errors.length) throw new DiagramValidationError(errors);
  const unique = (items, field) => {
    const ids = new Set();
    items.forEach((item, i) => {
      if (ids.has(item.id)) errors.push(`workflow.json/${field}/${i}/id: duplicate ID ${JSON.stringify(item.id)}`);
      ids.add(item.id);
    });
    return ids;
  };
  const laneIds = unique(workflow.lanes ?? [], 'lanes');
  const nodeIds = unique(workflow.nodes, 'nodes');
  const edgeIds = unique(workflow.edges, 'edges');
  const warnWords = (text, limit, path) => {
    if (text?.trim().split(/\s+/u).length > limit) warnings.push(`${path}: recommended maximum is ${limit} words`);
  };
  workflow.nodes.forEach((node, i) => {
    const path = `workflow.json/nodes/${i}`;
    if (node.lane !== undefined && !laneIds.has(node.lane)) errors.push(`${path}/lane: unknown lane ${JSON.stringify(node.lane)}`);
    if (!Object.hasOwn(layout.nodes, node.id)) errors.push(`layout.json/nodes/${pointer(node.id)}: missing position`);
    warnWords(node.summary, 30, `${path}/summary`);
    warnWords(node.details?.body, 60, `${path}/details/body`);
    warnWords(node.details?.when, 25, `${path}/details/when`);
    for (const [text, field] of [[node.summary, 'summary'], [node.details?.when, 'details/when']]) {
      if (text?.match(/[.!?](?:\s|$)/gu)?.length > 1) warnings.push(`${path}/${field}: recommended maximum is one sentence`);
    }
    for (const [field, limit] of [['commands', 2], ['links', 3]]) {
      if (node.details?.[field]?.length > limit) warnings.push(`${path}/details/${field}: recommended maximum is ${limit} entries`);
    }
    if (node.details?.body?.match(/[.!?](?:\s|$)/gu)?.length > 2) warnings.push(`${path}/details/body: recommended maximum is two sentences`);
    node.details?.links?.forEach((link, j) => {
      try { resolveLink(link.href, options); }
      catch (error) { errors.push(`${path}/details/links/${j}/href: ${error.message}`); }
    });
  });
  for (const id of Object.keys(layout.nodes)) if (!nodeIds.has(id)) errors.push(`layout.json/nodes/${pointer(id)}: orphan position`);
  workflow.edges.forEach((edge, i) => {
    for (const field of ['from', 'to']) if (!nodeIds.has(edge[field])) errors.push(`workflow.json/edges/${i}/${field}: unknown node ${JSON.stringify(edge[field])}`);
    if (!Object.hasOwn(layout.edges, edge.id)) errors.push(`layout.json/edges/${pointer(edge.id)}: missing route`);
    else {
      const route = layout.edges[edge.id];
      for (const [field, point] of [['from', route.start], ['to', route.segments.at(-1).slice(4)]]) {
        if (Object.hasOwn(layout.nodes, edge[field]) && !touchesCard(point, layout.nodes[edge[field]])) {
          errors.push(`layout.json/edges/${pointer(edge.id)}/${field === 'from' ? 'start' : 'segments'}: route must touch the ${field} card boundary (${JSON.stringify(edge[field])})`);
        }
      }
    }
  });
  for (const id of Object.keys(layout.edges)) if (!edgeIds.has(id)) errors.push(`layout.json/edges/${pointer(id)}: orphan route`);
  layout.regions?.forEach((region, i) => {
    if (!laneIds.has(region.lane)) errors.push(`layout.json/regions/${i}/lane: unknown lane ${JSON.stringify(region.lane)}`);
  });
  if (errors.length) throw new DiagramValidationError(errors);
  // Clone so normalization never mutates caller-owned content or layout.
  const normalized = structuredClone(workflow);
  normalized.lanes ??= [];
  for (const node of normalized.nodes) {
    node.kind ??= 'skill';
    for (const link of node.details?.links ?? []) link.href = resolveLink(link.href, options);
  }
  for (const edge of normalized.edges) edge.kind ??= 'primary';
  return { workflow: normalized, layout: structuredClone(layout), warnings };
}
