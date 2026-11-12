// @ts-check
// LO-05 | Login | Resending an OTP invalidates the previous one | Priority: Medium
// Note: real 5-minute expiry cannot be forced in a UI test; this verifies the
// resend flow replaces the old OTP so the stale code is rejected.
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { createOtpUser } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-05: an OTP from a previous request is rejected after a resend; the new OTP logs in', async ({ page, request }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-05' });
  const user = await createOtpUser(request, { role: 'customer' });
  const login = new LoginPage(page);

  await login.goto();

  // First OTP request
  await login.phoneInput.fill(user.phone);
  await login.sendOtpButton.click();
  const firstOtp = await login.readDemoOtp();

  // Resend: go back to the phone step and request a new OTP
  await login.changeNumberButton.click();
  await login.phoneInput.fill(user.phone);
  await login.sendOtpButton.click();
  const secondOtp = await login.readDemoOtp();
  expect(secondOtp, 'resending must issue a fresh OTP').not.toBe(firstOtp);

  // The stale first OTP is now invalid.
  // Actual behaviour (defect AUTH-002): the 401 interceptor redirects to
  // /login instead of showing the "Invalid OTP" message.
  await login.fillOtp(firstOtp);
  await login.verifyAndLogin();
  await expect(page).toHaveURL(/\/login$/);
  // Poll: the 401 redirect reloads the page, which can briefly destroy the
  // execution context while the token is being read.
  await expect
    .poll(() => LandingPage.getStoredToken(page), { timeout: 5000 })
    .toBeNull();

  // The user recovers by logging in with a fresh OTP
  await login.requestDemoOtp(user.phone);
  await login.fillOtp(await login.readDemoOtp());
  await login.verifyAndLogin();
  await LandingPage.expectCustomerHome(page);
});
