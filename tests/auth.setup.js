// @ts-check
import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { uniqueName, uniquePhone } from './helpers/testData.js';

const authFile = 'playwright/.auth/customer.json';

setup('register a customer and save authentication state', async ({ page }) => {
  // Unique data per run avoids phone uniqueness collisions in MongoDB.
  const name = process.env.E2E_CUSTOMER_NAME || uniqueName('E2E Customer');
  const phone = process.env.E2E_CUSTOMER_PHONE || uniquePhone();

  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

  await page.getByRole('button', { name: /Customer/ }).click();
  await page.getByPlaceholder('Your full name').fill(name);
  await page.getByPlaceholder('10-digit number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();

  const otp = page.locator('p').filter({ hasText: /^\d{4,6}$/ }).last();
  await expect(otp).toBeVisible();
  const otpCode = await otp.textContent();
  if (!otpCode) {
    throw new Error('The signup page did not expose a demo OTP.');
  }

  await page.getByPlaceholder('••••').fill(otpCode.trim());
  await page.getByRole('button', { name: 'Verify & Register' }).click();
  await expect(page).toHaveURL(/\/home$/);

  // The app authenticates via localStorage, so make sure the session is
  // actually present before persisting it for the browser projects.
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  expect(token).toBeTruthy();

  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
