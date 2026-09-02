import { Locator, Page } from '@playwright/test';

/**
 * The "Added!" confirmation modal Bootstrap shows after ProductCard.addToCart() succeeds.
 * It's already present in the DOM (id="cartModal") on Home/Products/Category/Brand pages,
 * hidden until jQuery adds the "show" class.
 */
export class CartModal {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): CartModal {
    return new CartModal(scope.locator('#cartModal'));
  }

  async continueShopping(): Promise<void> {
    await this.root.locator('.close-modal').click();
  }

  async viewCart(): Promise<void> {
    await this.root.locator('.modal-body a').click();
  }
}
