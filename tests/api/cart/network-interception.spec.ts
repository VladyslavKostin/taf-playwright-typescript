import { test, expect } from '../../../src/core/fixtures';
import { ProductCard } from '../../../src/components/product/product-card.component';
import { CartTable } from '../../../src/components/cart/cart-table.component';
import { Header } from '../../../src/components/navigation/header.component';

/**
 * This file runs under the `api` project (baseURL = https://automationexercise.com/api), but needs a
 * real browser page to exercise ProductCard.addToCart() and inspect the network calls it triggers.
 * `Header.open()`/navigation methods use the configured web base URL internally, so they work correctly
 * here regardless of this project's own (API) baseURL.
 *
 * Target route: `GET /add_to_cart/<product_id>` — an undocumented, session-based site route (not part of
 * the public REST API), confirmed live via tasks/api-spike-findings.md and by observing the real request
 * fired from ProductCard.addToCart() below.
 */

test(
  'adding a product to cart fires a real add_to_cart request',
  { tag: ['@page:products', '@regression'] },
  async ({ page, catalog }) => {
    const product = catalog.byName('Blue Top');

    await Header.open(page);
    await Header.in(page).goToProducts();

    let interceptedUrl: string | undefined;
    await page.route('**/add_to_cart/**', async (route) => {
      interceptedUrl = route.request().url();
      await route.continue();
    });

    const requestPromise = page.waitForRequest('**/add_to_cart/**');
    await ProductCard.in(page, product.name).addToCart();
    const firedRequest = await requestPromise;

    // Real, observed shape: GET https://automationexercise.com/add_to_cart/1 (no query string needed —
    // ProductCard.addToCart() doesn't set a quantity, so the site defaults to 1).
    expect(firedRequest.method()).toBe('GET');
    expect(firedRequest.url()).toContain('/add_to_cart/');
    expect(interceptedUrl).toBe(firedRequest.url());

    const response = await firedRequest.response();
    expect(response?.status()).toBe(200);
  },
);

test(
  'a failed add_to_cart response does not add the product to the cart',
  { tag: ['@page:products', '@regression'] },
  async ({ page, catalog }) => {
    const product = catalog.byName('Men Tshirt');

    await Header.open(page);
    await Header.in(page).goToProducts();

    await page.route('**/add_to_cart/**', (route) =>
      route.fulfill({ status: 500, contentType: 'text/html', body: 'Internal Server Error' }),
    );

    const requestPromise = page.waitForRequest('**/add_to_cart/**');
    await ProductCard.in(page, product.name).addToCart();
    await requestPromise;

    // Mocking the request to fail means the real server never processed it, so the product must not
    // show up in the cart. `#cart_info` (CartTable's root) isn't even rendered on an empty cart —
    // verified live — so lines() resolving to an empty array is the correct, observable proof that the
    // failed add-to-cart never reached the server.
    await Header.in(page).goToCart();
    const lines = await CartTable.in(page).lines();

    expect(lines).toHaveLength(0);
  },
);
