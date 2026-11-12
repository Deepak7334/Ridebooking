// @ts-check
// SU-03 | Signup | Driver registration with password mode — vehicle data collected | Priority: Medium
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { uniqueName, uniquePhone, uniqueEmail } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-03: driver signup with password mode collects vehicle type and number', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-03' });
  const signup = new SignupPage(page);
  const name = uniqueName();
  const phone = uniquePhone();

  await signup.goto();
  await signup.selectDriverRole();
  await signup.switchToPasswordMode();
  await signup.nameInput.fill(name);
  await signup.phoneInput.fill(phone);
  // A unique email is provided on purpose: leaving it empty sends email:''
  // to the API, which fails with a duplicate-key 500 (defect AUTH-003).
  await signup.emailInput.fill(uniqueEmail('driver'));
  await signup.passwordInput.fill('Secret@123');
  await signup.fillVehicleDetails('bike', 'MH01AB1234');
  await signup.createAccountButton.click();

  await LandingPage.expectDriverHome(page);

  const user = await LandingPage.getStoredUser(page);
  expect(user.role).toBe('driver');
  expect(user.vehicleType).toBe('bike');
  expect(user.vehicleNumber).toBe('MH01AB1234');
});
