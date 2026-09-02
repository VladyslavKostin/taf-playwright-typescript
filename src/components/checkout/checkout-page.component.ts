import { Locator, Page } from '@playwright/test';

/**
 * The main section (`#cart_items`) of https://automationexercise.com/checkout — delivery/billing
 * addresses, an order-review table, an order comment box, and "Place Order". Rooting at `#cart_items` is
 * safe only because `.in()` is always called after navigating to `/checkout`, the same precedent already
 * used by `Header` rooting at `#header`.
 *
 * The order-review table nested inside this section is the same `#cart_info` widget as on `/view_cart` —
 * reuse `CartTable.in()` for those reads rather than duplicating them here.
 */
export class CheckoutPage {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): CheckoutPage {
    return new CheckoutPage(scope.locator('#cart_items'));
  }

  async deliveryAddressText(): Promise<string> {
    return (await this.root.locator('#address_delivery').innerText()).trim();
  }

  async billingAddressText(): Promise<string> {
    return (await this.root.locator('#address_invoice').innerText()).trim();
  }

  async addComment(text: string): Promise<void> {
    await this.root.locator('#ordermsg textarea[name="message"]').fill(text);
  }

  async placeOrder(): Promise<void> {
    await this.root.locator('a[href="/payment"]').click();
  }
}
