import { test, expect } from '../../../src/core/fixtures';
import { ProductsApi } from '../../../src/api/product/products.api';

test(
  'GET /productsList returns a non-empty list of well-typed products',
  { tag: ['@page:products', '@smoke'] },
  async ({ request }) => {
    const products = await new ProductsApi(request).list();

    expect(products.length).toBeGreaterThan(0);

    for (const product of products) {
      expect(typeof product.id).toBe('number');
      expect(Number.isFinite(product.id)).toBe(true);

      expect(typeof product.name).toBe('string');
      expect(product.name.length).toBeGreaterThan(0);

      expect(typeof product.brand).toBe('string');
      expect(product.brand.length).toBeGreaterThan(0);

      expect(typeof product.category).toBe('string');
      expect(product.category.length).toBeGreaterThan(0);

      // The raw API returns price as a "Rs. 500" string — ProductsApi.list() must parse it into a
      // real positive number, not leave it as text.
      expect(typeof product.price).toBe('number');
      expect(Number.isFinite(product.price)).toBe(true);
      expect(product.price).toBeGreaterThan(0);
    }
  },
);
