// @ts-check
// SU-01 | Signup | Customer registration via OTP — happy path | Priority: High
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { uniqueName, uniquePhone } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-01: customer can register via OTP and lands on the home page', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-01' });
  const signup = new SignupPage(page);
  const name = uniqueName();
  const phone = uniquePhone();

  await signup.goto();
  await signup.registerWithOtp({ name, phone, role: 'customer' });

  await LandingPage.expectCustomerHome(page);

  const user = await LandingPage.getStoredUser(page);
  expect(user, 'a user object should be stored after signup').toBeTruthy();
  expect(user.name).toBe(name);
  expect(user.phone).toBe(phone);
  expect(user.role).toBe('customer');
  // NOTE: authToken is intentionally not asserted here — defect AUTH-001
  // wipes it from localStorage shortly after the page loads.
});
