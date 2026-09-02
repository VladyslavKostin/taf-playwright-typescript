import { test, expect } from '../../../src/core/fixtures';
import { ProductDetails } from '../../../src/components/product/product-details.component';

const PRODUCT_ID = 1;

test(
  'ProductDetails reads match the live product data on its detail page',
  { tag: ['@page:product-details', '@smoke'] },
  async ({ catalog, page }) => {
    const expected = catalog.byName('Blue Top');
    expect(expected.id).toBe(PRODUCT_ID);

    const details = await ProductDetails.open(page, PRODUCT_ID);

    const product = await details.product();
    expect(product.name).toBe(expected.name);
    expect(product.price).toBe(expected.price);
    expect(product.brand).toBe(expected.brand);

    // Availability/condition text isn't part of the productsList API response, so only assert the page
    // actually renders non-empty values rather than assuming exact wording.
    const availability = await details.availability();
    const condition = await details.condition();
    expect(availability.length).toBeGreaterThan(0);
    expect(condition.length).toBeGreaterThan(0);
  },
);
