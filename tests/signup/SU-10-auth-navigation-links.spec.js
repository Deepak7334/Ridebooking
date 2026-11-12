// @ts-check
// SU-10 | Signup | Navigation between login and signup, unknown routes | Priority: Low
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { SignupPage } from '../pages/SignupPage.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-10: login/signup pages link to each other and unknown routes redirect to login', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-10' });
  const login = new LoginPage(page);
  const signup = new SignupPage(page);

  await login.goto();
  await login.createAccountLink.click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(signup.heading).toBeVisible();

  await signup.loginLink.click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(login.heading).toBeVisible();

  // Unknown route falls back to the login page
  await page.goto('/definitely-not-a-route');
  await expect(page).toHaveURL(/\/login$/);
});
