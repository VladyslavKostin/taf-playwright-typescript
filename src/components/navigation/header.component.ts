import { Locator, Page } from '@playwright/test';
import { loadConfig } from '../../core/config';

/**
 * Top navigation bar (`#header`), present on every page of the site — verified against
 * https://automationexercise.com/ and https://automationexercise.com/product_details/1, both of which
 * render the identical `<header id="header">...<ul class="nav navbar-nav">` markup.
 *
 * Only the logged-out nav links (Home, Products, Cart, Signup / Login) are exposed here: the logged-in
 * variant (a "Logged in as <user>" dropdown, Delete Account, Logout) could not be verified — creating a
 * session via curl was blocked (403) — so it is intentionally left out rather than guessed at. There is no
 * cart-item-count badge in the nav markup for either logged-out state, so no such read is exposed.
 */
export class Header {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): Header {
    return new Header(scope.locator('#header'));
  }

  /**
   * Navigates to the home page and returns a `Header` scoped there — the canonical first navigation for
   * any test, so no spec needs a raw `page.goto('/')`. Uses the configured web base URL directly (not a
   * relative path) so it works the same regardless of which Playwright project's own baseURL is active.
   */
  static async open(page: Page): Promise<Header> {
    await page.goto(loadConfig().webBaseUrl);
    return Header.in(page);
  }

  async goToHome(): Promise<void> {
    await this.root.locator('.shop-menu a[href="/"]').click();
  }

  async goToProducts(): Promise<void> {
    await this.root.locator('.shop-menu a[href="/products"]').click();
  }

  async goToCart(): Promise<void> {
    await this.root.locator('.shop-menu a[href="/view_cart"]').click();
  }

  async goToSignupLogin(): Promise<void> {
    await this.root.locator('.shop-menu a[href="/login"]').click();
  }
}
