// @ts-check
// SU-09 | Signup | Duplicate email registration | Priority: Medium
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { createPasswordUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-09: registering with an already-used email address is rejected', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-09' });
  const existing = await createPasswordUser(request, { role: 'customer' });
  const signup = new SignupPage(page);

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.switchToPasswordMode();
  await signup.nameInput.fill('Duplicate Email Tester');
  // Different phone so only the email collides
  await signup.phoneInput.fill('9' + existing.phone.slice(1));
  await signup.emailInput.fill(existing.email);
  await signup.passwordInput.fill('Secret@123');
  await signup.createAccountButton.click();

  await expect(signup.errorBanner).toContainText('Email already in use');
  await expect(page).toHaveURL(/\/signup$/);
});
