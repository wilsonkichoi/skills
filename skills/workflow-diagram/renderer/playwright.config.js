import { defineConfig } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep browser profiles, traces, and temporary files inside this project.
process.env.TMPDIR = resolve('.cache/tmp');
mkdirSync(process.env.TMPDIR, { recursive: true });
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (existsSync(localChrome) ? localChrome : undefined);
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 30_000,
  reporter: 'list', outputDir: './test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 900 },
    headless: true, launchOptions: { executablePath }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 30_000 },
});
