import { Locator, Page } from '@playwright/test';

/**
 * The order-confirmation section (`#form`) on https://automationexercise.com/payment_done/<order_id>,
 * shown after a successful payment.
 */
export class OrderConfirmation {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): OrderConfirmation {
    return new OrderConfirmation(scope.locator('#form'));
  }

  /**
   * Uses `textContent()`, not `innerText()` — the heading's CSS applies `text-transform: uppercase`
   * (rendering as "ORDER PLACED!"), which `innerText()` reflects but `textContent()` doesn't. The raw DOM
   * text ("Order Placed!") is the true, stable value; the uppercase rendering is presentational only.
   */
  async successMessage(): Promise<string> {
    const text = await this.root.locator('[data-qa="order-placed"]').textContent();
    return (text ?? '').trim();
  }

  async continueShopping(): Promise<void> {
    await this.root.locator('[data-qa="continue-button"]').click();
  }
}
