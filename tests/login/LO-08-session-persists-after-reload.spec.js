// @ts-check
// LO-08 | Login | Auth session across page reloads | Priority: Low
// Documents defect AUTH-001: AuthContext.checkAuthStatus calls GET /auth/login
// (which has no GET handler) instead of /auth/me, so its catch block removes
// authToken from localStorage on every page load. The session therefore does
// NOT survive a reload — the token is wiped shortly after the page renders.
// If this app defect is fixed, this test must be rewritten to assert that the
// session DOES persist.
import { test, expect } from '../fixtures/auth.fixture.js';
import { LandingPage } from '../pages/LandingPage.js';

test('LO-08: DEFECT AUTH-001 — the auth token is wiped after a page reload', async ({ authenticatedPage }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-08' });
  test.info().annotations.push({ type: 'defect', description: 'AUTH-001' });
  const page = authenticatedPage;

  await page.goto('/home');
  await LandingPage.expectCustomerHome(page);

  // AUTH-001: the broken auth-status check removes the token from
  // localStorage shortly after the page loads.
  // Poll: the removal races with page load, which can briefly destroy the
  // execution context while the token is being read.
  await expect
    .poll(() => LandingPage.getStoredToken(page), { timeout: 5000 })
    .toBeNull();

  // With the token already wiped, the next load cannot restore the session:
  // reloading bounces the user back to the login page.
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
