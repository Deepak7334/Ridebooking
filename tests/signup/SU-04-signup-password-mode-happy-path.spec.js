// @ts-check
// SU-04 | Signup | Customer registration with password mode — optional email | Priority: High
// Documents defect AUTH-003: when the optional email is left empty the UI
// sends email:'' to /auth/register. The unique sparse email index treats ''
// as a value, so any registration after the first one fails with an
// E11000 duplicate-key 500 ("Server error").
// If this defect is fixed, this test must be rewritten as a happy path.
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { API_BASE_URL, uniqueName, uniquePhone } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-04: DEFECT AUTH-003 — signup with the optional email left empty fails with a server error', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-04' });
  test.info().annotations.push({ type: 'defect', description: 'AUTH-003' });
  const signup = new SignupPage(page);
  const name = uniqueName();
  const phone = uniquePhone();

  // Defect precondition: make sure a user with an empty-string email exists.
  // Outcome is irrelevant (201 when none existed, 500 duplicate otherwise).
  await request.post(`${API_BASE_URL}/auth/register`, {
    data: { name: uniqueName(), phone: uniquePhone(), email: '', password: 'Secret@123' },
  });

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.switchToPasswordMode();
  await signup.nameInput.fill(name);
  await signup.phoneInput.fill(phone);
  // Email (optional) left empty on purpose
  await signup.passwordInput.fill('Secret@123');
  await signup.createAccountButton.click();

  // Actual behaviour: registration fails with a generic server error
  await expect(signup.errorBanner).toContainText('Server error');
  await expect(page).toHaveURL(/\/signup$/);
});
