import { Locator, Page } from '@playwright/test';

/**
 * The "Proceed To Checkout" bar (`#do_action`) on https://automationexercise.com/view_cart, a sibling of
 * the cart table rather than part of it. Clicking the button always reveals a Bootstrap modal
 * (`#checkoutModal`) prompting the visitor to register/login before checking out — verified markup shows
 * no logged-in variant that skips the modal, so this component only models the prompt flow.
 */
export class CartCheckoutBar {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): CartCheckoutBar {
    return new CartCheckoutBar(scope.locator('#do_action'));
  }

  async proceedToCheckout(): Promise<void> {
    await this.root.locator('a.check_out').click();
  }

  async isLoginPromptVisible(): Promise<boolean> {
    return this.root.locator('#checkoutModal').isVisible();
  }

  async loginPromptText(): Promise<string> {
    return (await this.root.locator('#checkoutModal .modal-body').innerText()).trim();
  }

  async goToLoginFromPrompt(): Promise<void> {
    await this.root.locator('#checkoutModal a[href="/login"]').click();
  }

  async continueOnCart(): Promise<void> {
    await this.root.locator('.close-checkout-modal').click();
  }
}
