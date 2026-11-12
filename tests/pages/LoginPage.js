// @ts-check
import { expect } from '@playwright/test';

/**
 * Page Object for the login page (/login).
 * Covers both login modes: Phone OTP (default) and Email + Password.
 */
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Welcome Back' });
    this.errorBanner = page.locator('p').filter({ hasText: '⚠️' });
    this.phoneInput = page.getByPlaceholder('10-digit number');
    this.sendOtpButton = page.getByRole('button', { name: 'Send OTP' });
    this.otpInput = page.getByPlaceholder('••••');
    this.verifyOtpButton = page.getByRole('button', { name: 'Verify & Login' });
    this.changeNumberButton = page.getByRole('button', { name: '← Change number' });
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.createAccountLink = page.getByRole('link', { name: 'Create Account' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  async switchToEmailMode() {
    await this.page.getByRole('button', { name: /Email/ }).click();
    await expect(this.emailInput).toBeVisible();
  }

  /** Send an OTP to the given phone number and return the on-screen demo OTP code. */
  async requestDemoOtp(phone) {
    await this.phoneInput.fill(phone);
    await expect(this.sendOtpButton).toBeEnabled();
    await this.sendOtpButton.click();
    return this.readDemoOtp();
  }

  /** Read the 4-6 digit demo OTP displayed on screen. */
  async readDemoOtp() {
    const otpElement = this.page.locator('p').filter({ hasText: /^\d{4,6}$/ });
    await expect(otpElement).toBeVisible();
    return (await otpElement.last().textContent()).trim();
  }

  async fillOtp(code) {
    await this.otpInput.fill(code);
  }

  async verifyAndLogin() {
    await this.verifyOtpButton.click();
  }

  /** Full phone OTP login with an existing account. */
  async loginWithOtp(phone) {
    const otpCode = await this.requestDemoOtp(phone);
    await this.fillOtp(otpCode);
    await this.verifyAndLogin();
  }

  async loginWithEmail(email, password) {
    await this.switchToEmailMode();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
