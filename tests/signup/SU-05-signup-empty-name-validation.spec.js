// @ts-check
// SU-05 | Signup | Empty name validation | Priority: Medium
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { uniquePhone } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-05: signup without a full name shows a validation error and does not proceed', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-05' });
  const signup = new SignupPage(page);

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.phoneInput.fill(uniquePhone());
  await signup.sendOtpButton.click();

  await expect(signup.errorBanner).toContainText('Full name is required');
  // Still on the form step: no OTP step was reached
  await expect(signup.otpInput).toBeHidden();
  await expect(page).toHaveURL(/\/signup$/);
});
