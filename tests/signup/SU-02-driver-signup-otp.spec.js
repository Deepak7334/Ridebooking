// @ts-check
// SU-02 | Signup | Driver registration via OTP | Priority: High
// Documents current behaviour: vehicle fields are shown but NOT persisted
// on OTP registration (backend otp/verify does not accept vehicle data).
// Raised as a defect: driver OTP signup loses vehicle information.
import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage.js';
import { LandingPage } from '../pages/LandingPage.js';
import { uniqueName, uniquePhone } from '../helpers/testData.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('SU-02: driver can register via OTP, but vehicle data is not persisted (known defect)', async ({ page }) => {
  test.info().annotations.push({ type: 'id', description: 'SU-02' });
  const signup = new SignupPage(page);
  const name = uniqueName();
  const phone = uniquePhone();

  await signup.goto();
  await signup.selectDriverRole();
  // Vehicle section is visible in the form even in OTP mode
  await signup.fillVehicleDetails('bike', 'MH01AB9999');

  await signup.nameInput.fill(name);
  await signup.phoneInput.fill(phone);
  await signup.sendOtpButton.click();
  const otpCode = await signup.readDemoOtp();
  await signup.fillOtp(otpCode);
  await signup.verifyAndRegister();

  await LandingPage.expectDriverHome(page);

  const user = await LandingPage.getStoredUser(page);
  expect(user.role).toBe('driver');
  // Actual (defective) behaviour: vehicle data is not sent to the API
  expect(user.vehicleType, 'DEFECT: vehicleType is lost on OTP registration').toBeFalsy();
  expect(user.vehicleNumber, 'DEFECT: vehicleNumber is lost on OTP registration').toBeFalsy();
});
