// @ts-check
import { expect } from '@playwright/test';

/**
 * Shared assertions for the post-login landing pages.
 * Reused by every signup/login happy-path test instead of re-writing them.
 */
export const LandingPage = {
  /** Assert the user landed on the customer home page (/home). */
  async expectCustomerHome(page) {
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText('Where to?')).toBeVisible();
  },

  /** Assert the user landed on the driver dashboard (/driver). */
  async expectDriverHome(page) {
    await expect(page).toHaveURL(/\/driver$/);
    await expect(page.getByLabel('Go Online')).toBeVisible();
  },

  /** Assert the user landed on the admin portal (/admin). */
  async expectAdminHome(page) {
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Admin Portal')).toBeVisible();
  },

  /** Read the authenticated user stored by the app in localStorage. */
  async getStoredUser(page) {
    return page.evaluate(() => {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    });
  },

  /** Read the auth token stored by the app in localStorage. */
  getStoredToken(page) {
    return page.evaluate(() => localStorage.getItem('authToken'));
  },
};
