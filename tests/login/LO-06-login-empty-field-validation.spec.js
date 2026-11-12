// @ts-check
// LO-06 | Login | Empty-field client-side validation | Priority: Medium
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('LO-06: login blocks empty submissions with validation messages', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'LO-06' });
  const login = new LoginPage(page);

  await login.goto();

  // OTP flow: Send OTP stays disabled until 10 digits are entered
  await expect(login.phoneInput).toBeVisible();
  await expect(login.sendOtpButton).toBeDisabled();
  await login.phoneInput.fill('9123456789');
  await expect(login.sendOtpButton).toBeEnabled();

  // OTP flow: Verify & Login stays disabled until at least 4 digits are entered
  await login.sendOtpButton.click();
  await expect(login.otpInput).toBeVisible();
  await expect(login.verifyOtpButton).toBeDisabled();

  // Email flow: submitting empty fields shows the validation message
  await login.switchToEmailMode();
  await login.loginButton.click();
  await expect(login.errorBanner).toContainText('All fields required');
  await expect(page).toHaveURL(/\/login$/);
});
