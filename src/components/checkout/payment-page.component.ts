import { Locator, Page } from '@playwright/test';
import type { CardDetails } from '../../types/checkout/payment';

/**
 * The card-details form (`#payment-form`, a verified-unique id) on
 * https://automationexercise.com/payment. Submitting navigates to `/payment_done/<order_id>`.
 */
export class PaymentPage {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): PaymentPage {
    return new PaymentPage(scope.locator('#payment-form'));
  }

  async payWithCard(card: CardDetails): Promise<void> {
    await this.root.locator('[data-qa="name-on-card"]').fill(card.nameOnCard);
    await this.root.locator('[data-qa="card-number"]').fill(card.cardNumber);
    await this.root.locator('[data-qa="cvc"]').fill(card.cvc);
    await this.root.locator('[data-qa="expiry-month"]').fill(card.expiryMonth);
    await this.root.locator('[data-qa="expiry-year"]').fill(card.expiryYear);
    await this.root.locator('[data-qa="pay-button"]').click();
  }
}
