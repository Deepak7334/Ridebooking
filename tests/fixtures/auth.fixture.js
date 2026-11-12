// @ts-check
import { test as base, expect } from '@playwright/test';

/**
 * Auth session fixture.
 *
 * `auth.setup.js` registers a customer through the UI and saves the session
 * (localStorage authToken + user) to `customer.json`. Any test can either
 * - rely on the project-level `storageState` (all browser projects already
 *   start logged in as the setup customer), or
 * - inject the `authenticatedPage` fixture below to get a page bound to a
 *   fresh context that reuses the captured customer session.
 */
export const customerAuthFile = 'playwright/.auth/customer.json';

export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: customerAuthFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
