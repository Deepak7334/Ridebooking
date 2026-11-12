// @ts-check
// LO-01 | Login | Phone OTP login for an existing user | Priority: High
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { createOtpUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-01: an existing user can log in with phone OTP and lands on the home page', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-01' });
  const user = await createOtpUser(request, { role: 'customer' });
  const login = new LoginPage(page);

  await login.goto();
  await login.phoneInput.fill(user.phone);
  await login.sendOtpButton.click();

  await expect(page.getByText(`Enter OTP for +91 ${user.phone}`)).toBeVisible();
  const otpCode = await login.readDemoOtp();
  await login.fillOtp(otpCode);
  await login.verifyAndLogin();

  await LandingPage.expectCustomerHome(page);

  const storedUser = await LandingPage.getStoredUser(page);
  expect(storedUser.phone).toBe(user.phone);
  expect(storedUser.role).toBe('customer');
});
