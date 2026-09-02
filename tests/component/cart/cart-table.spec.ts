import { expect, test } from '../../../src/core/fixtures';
import { CartTable } from '../../../src/components/cart/cart-table.component';
import { Header } from '../../../src/components/navigation/header.component';
import { flow } from '../../../src/flows/flow';

test(
  'CartTable.lines() reflects the products added to the cart',
  { tag: ['@page:cart', '@smoke'] },
  async ({ page, catalog }) => {
    const blueTop = catalog.byName('Blue Top');
    const menTshirt = catalog.byName('Men Tshirt');
    const products = [blueTop, menTshirt];

    // The `page` fixture (src/core/fixtures.ts) already blocks the site's third-party ad-consent
    // overlay that would otherwise intercept pointer events during ProductCard.addToCart()'s hover step.
    await Header.open(page);
    await Header.in(page).goToProducts();

    await flow.cart.addToCart(page, blueTop.name);
    await flow.cart.addToCart(page, menTshirt.name, flow.cart.CartFollowUp.OpenCart);

    const lines = await CartTable.in(page).lines();

    for (const product of products) {
      const line = lines.find((l) => l.name === product.name);
      expect(line, `expected a cart line for "${product.name}"`).toBeDefined();
      expect(line!.price).toBe(product.price);
      expect(line!.total).toBe(line!.price * line!.quantity);
    }
  },
);
