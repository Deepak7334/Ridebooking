// @ts-check
// SU-06 | Signup | Phone number boundary validation (9 vs 10 digits, maxLength) | Priority: Medium
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { uniqueName, uniquePhone } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-06: signup rejects a 9-digit phone but accepts a 10-digit phone', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-06' });
  const signup = new SignupPage(page);
  const phone = uniquePhone(); // 10 digits
  const nineDigits = phone.slice(0, 9);

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.nameInput.fill(uniqueName());

  // Boundary below the valid range
  await signup.phoneInput.fill(nineDigits);
  await signup.sendOtpButton.click();
  await expect(signup.errorBanner).toContainText('Enter a valid 10-digit phone number');
  await expect(signup.otpInput).toBeHidden();

  // Input caps at 10 characters
  await signup.phoneInput.fill('1234567890123');
  await expect(signup.phoneInput).toHaveValue('1234567890');

  // Boundary value (10 digits) is accepted
  await signup.phoneInput.fill(phone);
  await signup.sendOtpButton.click();
  await expect(signup.otpInput).toBeVisible();
});
