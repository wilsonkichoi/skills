import { test, expect } from '@playwright/test';
const card = (page, id) => page.locator(`.wd-card[data-node-id="${id}"]`);
test('setup/tracker fixture includes only wkc-setup and wkc-tracker, with optional concise details', async ({ page }) => {
  await page.goto('/setup-tracker');
  await expect(page.locator('.wd-card')).toHaveCount(2);
  await card(page, 'setup').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'wkc-setup', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'When', exact: true })).toBeVisible();
  await expect(page.locator('.wd-command')).toHaveCount(2);
  await expect(page.locator('.wd-relationships')).toContainText('wkc-setup → wkc-tracker: Shared configuration');
  await expect(page.getByRole('link', { name: 'Read the wkc-setup skill' })).toHaveAttribute('href', 'https://github.com/wilsonkichoi/skills/blob/main/skills/wkc-setup/SKILL.md');
  await expect(page.getByRole('button', { name: 'Previous node' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next node' }).click();
  await expect(page.getByRole('heading', { name: 'wkc-tracker', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next node' })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous node' }).click();
  await expect(page.getByRole('heading', { name: 'wkc-setup', exact: true })).toBeVisible();
});
