import { Locator, Page } from '@playwright/test';
import { Product } from '../../types/product/product';
import { loadConfig } from '../../core/config';

/**
 * The single-product panel on a product detail page (e.g. https://automationexercise.com/product_details/1)
 * — verified by curling that URL directly. Real markup:
 *
 * ```html
 * <div class="product-details">
 *   ...
 *   <div class="product-information">
 *     <h2>Blue Top</h2>
 *     <p>Category: Women &gt; Tops</p>
 *     <span>
 *       <span>Rs. 500</span>
 *       <label>Quantity:</label>
 *       <input type="number" id="quantity" value="1" min="1" />
 *       <input type="hidden" id="product_id" value="1">
 *       <button type="button" class="btn btn-default cart">Add to cart</button>
 *     </span>
 *     <p><b>Availability:</b> In Stock</p>
 *     <p><b>Condition:</b> New</p>
 *     <p><b>Brand:</b> Polo</p>
 *   </div>
 * </div>
 * ```
 *
 * Note this page's add-to-cart control (`button.cart` next to a `#quantity` number input) is a different
 * element from the hover-overlay `.add-to-cart` button used by the product-card widget on listing pages —
 * they are two distinct, separately-verified layouts, not the same selector reused.
 */
export class ProductDetails {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): ProductDetails {
    return new ProductDetails(scope.locator('.product-details'));
  }

  /** Navigates directly to a product's detail page and returns a `ProductDetails` scoped there. */
  static async open(page: Page, productId: number): Promise<ProductDetails> {
    await page.goto(`${loadConfig().webBaseUrl}/product_details/${productId}`);
    return ProductDetails.in(page);
  }

  async name(): Promise<string> {
    return this.root.locator('.product-information h2').innerText();
  }

  async price(): Promise<number> {
    const raw = await this.root.locator('.product-information > span > span').innerText();
    return Number(raw.replace(/\D/g, ''));
  }

  /** Raw "Category: X > Y" text with the "Category:" label stripped, e.g. "Women > Tops". */
  async category(): Promise<string> {
    const raw = await this.root.locator('.product-information p', { hasText: 'Category:' }).innerText();
    return raw.replace('Category:', '').trim();
  }

  async availability(): Promise<string> {
    return this.labelledText('Availability:');
  }

  async condition(): Promise<string> {
    return this.labelledText('Condition:');
  }

  async brand(): Promise<string> {
    return this.labelledText('Brand:');
  }

  private async productId(): Promise<number> {
    const raw = await this.root.locator('#product_id').getAttribute('value');
    return Number(raw);
  }

  /** Reads `<p><b>{label}</b> {value}</p>` and returns just the value. */
  private async labelledText(label: string): Promise<string> {
    const raw = await this.root.locator('.product-information p', { hasText: label }).innerText();
    return raw.replace(label, '').trim();
  }

  /** Aggregates the reads above into the shared `Product` shape. */
  async product(): Promise<Product> {
    const [id, name, price, brand, category] = await Promise.all([
      this.productId(),
      this.name(),
      this.price(),
      this.brand(),
      this.category(),
    ]);
    return { id, name, price, brand, category };
  }

  async setQuantityAndAddToCart(quantity: number): Promise<void> {
    await this.root.locator('#quantity').fill(String(quantity));
    await this.root.locator('button.cart').click();
  }
}
