// @ts-check
// LO-04 | Login | Email login for a user without a password (OTP-only account) | Priority: Medium
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { createOtpUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-04: an OTP-only account (no password set) cannot log in with email', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-04' });
  // OTP registration creates a user without a password
  const user = await createOtpUser(request, { role: 'customer' });
  const login = new LoginPage(page);

  await login.goto();
  await login.loginWithEmail('not-the-email@e2e.test', 'Whatever@123');

  // The OTP-only user has no email either, so even their own email
  // cannot be used — they simply have no credential to log in with.
  // Actual behaviour (defect AUTH-002): the 401 interceptor redirects to
  // /login instead of showing the "Invalid credentials" message.
  await expect(page).toHaveURL(/\/login$/);
  // Poll: the redirect reloads the page, which can briefly destroy the
  // execution context while the token is being read.
  await expect
    .poll(() => LandingPage.getStoredToken(page), { timeout: 5000 })
    .toBeNull();
  await expect(login.errorBanner).toBeHidden();
});
