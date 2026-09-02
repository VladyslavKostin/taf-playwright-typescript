import { Page } from '@playwright/test';
import { CartModal } from '../../components/cart/cart-modal.component';
import { ProductCard } from '../../components/product/product-card.component';

/** Named, reusable options for `addToCart`'s `after` parameter — never pass the raw strings directly. */
export const CartFollowUp = {
  KeepShopping: 'keep-shopping',
  OpenCart: 'open-cart',
} as const;
export type CartFollowUp = (typeof CartFollowUp)[keyof typeof CartFollowUp];

/**
 * Adds a product to the cart and dismisses (or follows through) the "Added!" confirmation modal that
 * Bootstrap shows after every successful add — see `CartModal`'s doc comment. `after` controls which of
 * the modal's two actions closes it: `CartFollowUp.KeepShopping` (default) stays on the current page,
 * `CartFollowUp.OpenCart` navigates to `/view_cart`.
 */
export async function addToCart(
  page: Page,
  productName: string,
  after: CartFollowUp = CartFollowUp.KeepShopping,
): Promise<void> {
  await ProductCard.in(page, productName).addToCart();

  const modal = CartModal.in(page);
  if (after === CartFollowUp.OpenCart) {
    await modal.viewCart();
  } else {
    await modal.continueShopping();
  }
}
