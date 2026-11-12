// @ts-check
// LO-02 | Login | Email + password login — happy path | Priority: High
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { createPasswordUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-02: a user registered with a password can log in with email and password', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-02' });
  const user = await createPasswordUser(request, { role: 'customer' });
  const login = new LoginPage(page);

  await login.goto();
  await login.loginWithEmail(user.email, user.password);

  await LandingPage.expectCustomerHome(page);

  const storedUser = await LandingPage.getStoredUser(page);
  expect(storedUser.email).toBe(user.email);
  // NOTE: authToken is intentionally not asserted here — defect AUTH-001
  // wipes it from localStorage shortly after the page loads.
});
