import type { APIRequestContext } from '@playwright/test';
import { ProductsApi } from '../../api/product/products.api';
import type { Product } from '../../types/product/product';

/**
 * Supplies real, live-catalog `Product` data to tests — the counterpart to `ProductBuilder` for cases
 * where a test needs a product that actually exists on the site (to add to cart, view details, etc.)
 * rather than arbitrary faker-generated data. Looking products up here instead of hardcoding
 * `{ name, price }` literals in spec files means a test never asserts a stale price if the site's
 * catalog changes.
 */
export class ProductCatalog {
  private constructor(private readonly products: Product[]) {}

  static async load(request: APIRequestContext): Promise<ProductCatalog> {
    const products = await new ProductsApi(request).list();
    return new ProductCatalog(products);
  }

  byName(name: string): Product {
    const product = this.products.find((p) => p.name === name);
    if (!product) {
      throw new Error(`No product named "${name}" found in the live catalog`);
    }
    return product;
  }
}
