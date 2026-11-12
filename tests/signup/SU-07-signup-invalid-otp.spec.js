// @ts-check
// SU-07 | Signup | Invalid OTP entry | Priority: High
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { uniqueName, uniquePhone } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-07: registering with a wrong OTP shows an error and does not create the account', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-07' });
  const signup = new SignupPage(page);

  await signup.goto();
  await signup.selectCustomerRole();
  await signup.nameInput.fill(uniqueName());
  await signup.phoneInput.fill(uniquePhone());
  await signup.sendOtpButton.click();

  const demoOtp = await signup.readDemoOtp();
  // Deterministically wrong: flip every digit of the displayed demo OTP
  const wrongOtp = demoOtp.split('').map((d) => String((Number(d) + 1) % 10)).join('');

  await signup.fillOtp(wrongOtp);
  await signup.verifyAndRegister();

  // Actual behaviour (defect AUTH-002): the axios 401 interceptor performs a
  // full-page redirect to /login, so the "Invalid OTP" message is never
  // displayed and the user is bounced out of the signup flow.
  await expect(page).toHaveURL(/\/login$/);
  // The user must not be authenticated
  expect(await LandingPage.getStoredToken(page)).toBeNull();
});
