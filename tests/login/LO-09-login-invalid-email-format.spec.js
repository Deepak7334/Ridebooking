// @ts-check
// LO-09 | Login | Invalid email format on login | Priority: High
// Documents current behaviour: neither client nor server validates the email
// format on login — any non-existent email yields the generic credentials error.
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LandingPage } from '../pages/LandingPage.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-09: a malformed email address is not accepted as a login', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-09' });
  const login = new LoginPage(page);

  await login.goto();
  await login.loginWithEmail('not-an-email', 'Whatever@123');

  // No format validation exists; the server treats it as an unknown user.
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
