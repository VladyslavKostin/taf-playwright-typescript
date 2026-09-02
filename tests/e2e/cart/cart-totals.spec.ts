import { expect, test } from '../../../src/core/fixtures';
import { CartTable } from '../../../src/components/cart/cart-table.component';
import { Header } from '../../../src/components/navigation/header.component';
import { flow } from '../../../src/flows/flow';

function totalQuantityFor(lines: { name: string; quantity: number }[], name: string): number {
  return lines.filter((line) => line.name === name).reduce((sum, line) => sum + line.quantity, 0);
}

test(
  'cart totals stay correct as the cart contents change',
  { tag: ['@page:cart', '@smoke'] },
  async ({ page, catalog }) => {
    const winterTop = catalog.byName('Winter Top');
    const sleevelessDress = catalog.byName('Sleeveless Dress');
    const products = [winterTop, sleevelessDress];

    await Header.open(page);
    await Header.in(page).goToProducts();

    await flow.cart.addToCart(page, winterTop.name);
    await flow.cart.addToCart(page, sleevelessDress.name, flow.cart.CartFollowUp.OpenCart);

    const initialLines = await CartTable.in(page).lines();

    // Every line's total is exactly price * quantity, and exactly the added products are present.
    expect(new Set(initialLines.map((line) => line.name))).toEqual(new Set(products.map((p) => p.name)));
    for (const line of initialLines) {
      expect(line.total).toBe(line.price * line.quantity);
    }
    const winterTopQtyBefore = totalQuantityFor(initialLines, winterTop.name);

    // Re-adding a product already in the cart changes its contents (quantity) without introducing a new
    // product — re-verify totals stay correct and reflect the change.
    await Header.in(page).goToProducts();
    await flow.cart.addToCart(page, winterTop.name, flow.cart.CartFollowUp.OpenCart);

    const updatedLines = await CartTable.in(page).lines();

    expect(new Set(updatedLines.map((line) => line.name))).toEqual(new Set(products.map((p) => p.name)));
    for (const line of updatedLines) {
      expect(line.total).toBe(line.price * line.quantity);
    }
    const winterTopQtyAfter = totalQuantityFor(updatedLines, winterTop.name);
    expect(winterTopQtyAfter).toBeGreaterThan(winterTopQtyBefore);
  },
);
