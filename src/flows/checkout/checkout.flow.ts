import { Page } from '@playwright/test';
import { CartCheckoutBar } from '../../components/cart/cart-checkout-bar.component';
import { CheckoutPage } from '../../components/checkout/checkout-page.component';
import { PaymentPage } from '../../components/checkout/payment-page.component';
import type { CardDetails } from '../../types/checkout/payment';

/**
 * Completes checkout from the cart page through to payment. Assumes the caller is already on
 * `/view_cart` while logged in (otherwise `CartCheckoutBar.proceedToCheckout()` only reveals the
 * register/login prompt modal — driving that prompt is the calling spec/flow's concern, not this one's).
 * Leaves the browser on the post-payment `/payment_done/<order_id>` confirmation page; asserting the
 * result is the calling spec's job, via `OrderConfirmation`.
 */
export async function placeOrder(page: Page, card: CardDetails, comment?: string): Promise<void> {
  await CartCheckoutBar.in(page).proceedToCheckout();

  const checkout = CheckoutPage.in(page);
  if (comment) {
    await checkout.addComment(comment);
  }
  await checkout.placeOrder();

  await PaymentPage.in(page).payWithCard(card);
}
