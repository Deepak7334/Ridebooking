// @ts-check
// SU-12 | Signup | Valid email format is accepted and stored | Priority: High
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { uniqueName, uniquePhone, uniqueEmail } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-12: signup accepts a well-formed email address and stores it on the account', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-12' });
  const signup = new SignupPage(page);
  const email = uniqueEmail('valid-rider');

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.switchToPasswordMode();
  await signup.nameInput.fill(uniqueName());
  await signup.phoneInput.fill(uniquePhone());
  await signup.emailInput.fill(email);
  await signup.passwordInput.fill('Secret@123');
  await signup.createAccountButton.click();

  await LandingPage.expectCustomerHome(page);

  const user = await LandingPage.getStoredUser(page);
  expect(user.email).toBe(email);
});
