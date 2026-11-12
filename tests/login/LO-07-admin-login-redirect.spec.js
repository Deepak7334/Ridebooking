// @ts-check
// LO-07 | Login | Admin email login redirects to the admin portal | Priority: Medium
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { createPasswordUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-07: an admin account logging in with email lands on the admin portal', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-07' });
  const admin = await createPasswordUser(request, { role: 'admin' });
  const login = new LoginPage(page);

  await login.goto();
  await login.loginWithEmail(admin.email, admin.password);

  await LandingPage.expectAdminHome(page);

  const storedUser = await LandingPage.getStoredUser(page);
  expect(storedUser.role).toBe('admin');
});
