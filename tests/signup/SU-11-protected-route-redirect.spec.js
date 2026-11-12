// @ts-check
// SU-11 | Signup | Protected routes require authentication | Priority: Medium
import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-11: unauthenticated users are redirected to login from protected routes', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-11' });

  await page.goto('/home');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/driver');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
});
