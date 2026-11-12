// @ts-check
import { expect } from '@playwright/test';

/**
 * Page Object for the signup page (/signup).
 * Covers Customer/Driver roles, OTP mode (default) and password mode,
 * and the driver vehicle information section.
 */
export class SignupPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Create Account' });
    this.errorBanner = page.locator('p').filter({ hasText: '⚠️' });
    this.customerRoleButton = page.getByRole('button', { name: /Customer/ });
    this.driverRoleButton = page.getByRole('button', { name: /Driver/ });
    this.nameInput = page.getByPlaceholder('Your full name');
    this.phoneInput = page.getByPlaceholder('10-digit number');
    this.otpModeToggleText = page.getByText(/Register via OTP|Register with password/);
    // The onClick handler lives on the switch div, not on the text span
    this.otpModeSwitch = this.otpModeToggleText.locator('xpath=preceding-sibling::div');
    this.emailInput = page.getByPlaceholder('email@example.com');
    this.passwordInput = page.getByPlaceholder('Min. 6 characters');
    this.vehicleSection = page.getByText('Vehicle Information');
    this.vehicleTypeSelect = page.locator('select');
    this.vehicleNumberInput = page.getByPlaceholder('e.g. MH01AB1234');
    this.sendOtpButton = page.getByRole('button', { name: 'Send OTP' });
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' });
    this.otpInput = page.getByPlaceholder('••••');
    this.verifyRegisterButton = page.getByRole('button', { name: 'Verify & Register' });
    this.changePhoneButton = page.getByRole('button', { name: '← Change phone' });
    this.loginLink = page.getByRole('link', { name: 'Login' });
  }

  async goto() {
    await this.page.goto('/signup');
    await expect(this.heading).toBeVisible();
  }

  async selectCustomerRole() {
    await this.customerRoleButton.click();
  }

  async selectDriverRole() {
    await this.driverRoleButton.click();
    await expect(this.vehicleSection).toBeVisible();
  }

  /** Toggle between OTP registration and password registration. */
  async switchToPasswordMode() {
    await this.otpModeSwitch.click();
    await expect(this.passwordInput).toBeVisible();
  }

  async readDemoOtp() {
    const otpElement = this.page.locator('p').filter({ hasText: /^\d{4,6}$/ });
    await expect(otpElement).toBeVisible();
    return (await otpElement.last().textContent()).trim();
  }

  async fillOtp(code) {
    await this.otpInput.fill(code);
  }

  async verifyAndRegister() {
    await this.verifyRegisterButton.click();
  }

  async fillVehicleDetails(type, number) {
    await this.vehicleTypeSelect.selectOption(type);
    await this.vehicleNumberInput.fill(number);
  }

  /**
   * Full OTP signup for a new account (customer or driver).
   * Returns the demo OTP code that was used.
   */
  async registerWithOtp({ name, phone, role = 'customer' }) {
    if (role === 'driver') {
      await this.selectDriverRole();
    } else {
      await this.selectCustomerRole();
    }
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.sendOtpButton.click();
    const otpCode = await this.readDemoOtp();
    await this.fillOtp(otpCode);
    await this.verifyAndRegister();
    return otpCode;
  }
}
