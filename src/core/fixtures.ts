import { test as base, expect, request as pwRequest } from '@playwright/test';
import { loadConfig } from './config';
import { ApiAccountArranger } from '../contracts/auth/api-account-arranger';
import type { AccountArranger } from '../contracts/auth/account-arranger.contract';
import { ProductCatalog } from '../builders/product/product-catalog.builder';

type Fixtures = {
  /**
   * Arrangement, not the thing under test — always API-backed, independent of which project's
   * baseURL the test itself runs under (component/e2e projects point `request` at the web app,
   * not the API, so `setup` opens its own API-scoped request context).
   */
  setup: { accounts: AccountArranger };
  /**
   * Real, live-catalog product data — see `ProductCatalog`'s doc comment. Opens its own API-scoped
   * request context for the same reason `setup` does: the test's own `request`/`page.request` may be
   * scoped to the web app's baseURL, not the API's, depending on which project is running.
   */
  catalog: ProductCatalog;
};

export const test = base.extend<Fixtures>({
  // The live site loads Google's "Funding Choices" ad-consent overlay on every fresh page load; it
  // covers the product grid and swallows pointer events, timing out ProductCard.addToCart()'s hover.
  // Blocked once here for every test that uses `page`, instead of every component/flow/spec repeating it.
  page: async ({ page }, use) => {
    await page.route('https://fundingchoicesmessages.google.com/**', (route) => route.abort());
    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture functions always take a destructured deps object
  setup: async ({}, use) => {
    const { apiBaseUrl } = loadConfig();
    const apiContext = await pwRequest.newContext({ baseURL: apiBaseUrl });
    await use({ accounts: new ApiAccountArranger(apiContext) });
    await apiContext.dispose();
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture functions always take a destructured deps object
  catalog: async ({}, use) => {
    const { apiBaseUrl } = loadConfig();
    const apiContext = await pwRequest.newContext({ baseURL: apiBaseUrl });
    const catalog = await ProductCatalog.load(apiContext);
    await use(catalog);
    await apiContext.dispose();
  },
});

export { expect };
