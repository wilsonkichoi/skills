# workflow-diagram renderer

Maintainer source for the [`workflow-diagram`](../../skills/workflow-diagram/SKILL.md) skill. This
directory is not installed: the installer ships only directories that contain a `SKILL.md`.

## Why this skill has code

This is the repository's one exception to the no-script guidance in [AGENTS.md](../../AGENTS.md).
Interactive rendering, shared validation, and deterministic bundling require executable code. It
adds no consumer build step and no per-harness source copies.

## Layout

`src/` and `schema/` are canonical. The build writes these generated files into
`skills/workflow-diagram/assets/`:

- `standalone.js`, the browser runtime inlined into `diagram.html`
- `workflow-diagram.js`, the embeddable ESM library
- `model.mjs`, the Node validator and exporter used by `scripts/diagram.mjs`
- `workflow.schema.json` and `layout.schema.json`, copies of the schemas
- `THIRD-PARTY-NOTICES.txt` and `manifest.json`

Never edit those assets directly. The installed helper uses Node built-ins and those assets only.
The manifest takes `generatorVersion` from this directory's `package.json` and hashes every source
and output, including `skills/workflow-diagram/scripts/diagram.mjs`. The generator version is the
renderer's own version, independent of the repository `VERSION`. Bump it only when a change alters
rendering, validation, or the helper, then rebuild the assets.

## Checks

For renderer, schema, helper, build, or version changes, run these from this directory:

```sh
npm ci
npm run build:assets
npm run check
```

`check` rejects stale generated assets, then runs unit, packaging, and browser checks. Its browser
uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when set, available macOS Chrome otherwise, and Playwright's
Chromium fallback. Install that fallback locally when needed:

```sh
PLAYWRIGHT_BROWSERS_PATH=.cache/browsers npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=.cache/browsers npm run check
```

Keep dependencies, browser binaries, caches, traces, and test screenshots out of the skill
directory. Install a clean source export when testing a local directory, because the installer
copies ignored files too. Verify installer discovery counts against shipped skills. Run
[`validation/workflow-diagram.md`](../../validation/workflow-diagram.md) from the repository root
after behavior changes, and update its cases when commands or guarantees change. Report unavailable
harness or browser checks as SKIP, never PASS.
