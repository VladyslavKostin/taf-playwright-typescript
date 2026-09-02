import { Locator, Page } from '@playwright/test';

export class ProductCard {
  private constructor(private readonly root: Locator) {}

  /** Same widget on Home, Products, Category, Brand, and Recommended sections. */
  static in(scope: Page | Locator, name: string): ProductCard {
    return new ProductCard(
      scope.locator('.product-image-wrapper').filter({ hasText: name }).first(),
    );
  }

  async price(): Promise<number> {
    const raw = await this.root.locator('.productinfo h2').innerText();
    return Number(raw.replace(/\D/g, ''));
  }

  async addToCart(): Promise<void> {
    await this.root.hover();
    await this.root.locator('.overlay-content .add-to-cart').click();
  }
}
