import { expect, test } from '../../../src/core/fixtures';
import { ProductCard } from '../../../src/components/product/product-card.component';
import { Header } from '../../../src/components/navigation/header.component';

test(
  'ProductCard.price() reads the correct price for a known product',
  { tag: ['@page:products', '@smoke'] },
  async ({ page, catalog }) => {
    const product = catalog.byName('Blue Top');

    await Header.open(page);
    await Header.in(page).goToProducts();

    const price = await ProductCard.in(page, product.name).price();

    expect(price).toBe(product.price);
  },
);
