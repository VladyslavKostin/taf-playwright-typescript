import { Locator, Page } from '@playwright/test';
import type { CartLine } from '../../types/cart/cart';

function parsePrice(raw: string): number {
  return Number(raw.replace(/\D/g, ''));
}

export class CartTable {
  private constructor(private readonly root: Locator) {}

  /**
   * The line-item table shown on both https://automationexercise.com/view_cart (rooted at
   * `<div id="cart_info">` wrapping `<table id="cart_info_table">`) and
   * https://automationexercise.com/checkout (the order-review table, same `#cart_info` wrapper but the
   * inner `<table>` has no id there). Rooting at `#cart_info` instead of `#cart_info_table` lets one class
   * cover both pages — the row markup (`.cart_description h4 a`, `.cart_price p`, `.cart_quantity button`,
   * `.cart_total .cart_total_price`) is identical on each.
   */
  static in(scope: Page | Locator): CartTable {
    return new CartTable(scope.locator('#cart_info'));
  }

  async lines(): Promise<CartLine[]> {
    const rows = this.root.locator('tbody tr');
    const count = await rows.count();

    const lines: CartLine[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const name = (await row.locator('.cart_description h4 a').innerText()).trim();
      const price = parsePrice(await row.locator('.cart_price p').innerText());
      const quantity = parsePrice(await row.locator('.cart_quantity button').innerText());
      const total = parsePrice(await row.locator('.cart_total .cart_total_price').innerText());
      lines.push({ name, price, quantity, total });
    }

    return lines;
  }
}
