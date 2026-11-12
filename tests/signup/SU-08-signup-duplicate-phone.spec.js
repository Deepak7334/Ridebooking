// @ts-check
// SU-08 | Signup | Duplicate phone number registration | Priority: Medium
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { createOtpUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-08: registering with an already-registered phone number is rejected', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-08' });
  const existing = await createOtpUser(request, { role: 'customer' });
  const signup = new SignupPage(page);

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.switchToPasswordMode();
  await signup.nameInput.fill('Duplicate Phone Tester');
  await signup.phoneInput.fill(existing.phone);
  await signup.passwordInput.fill('Secret@123');
  await signup.createAccountButton.click();

  await expect(signup.errorBanner).toContainText('Phone already registered');
  await expect(page).toHaveURL(/\/signup$/);
});
