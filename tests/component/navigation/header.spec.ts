import { test, expect } from '../../../src/core/fixtures';
import { Header } from '../../../src/components/navigation/header.component';

// No flow wraps plain nav-link navigation (checked src/flows/ — cart.flow.ts, checkout.flow.ts, and auth.flow.ts only
// compose Header as one step inside a larger procedure, e.g. auth.flow.ts's `login()` calling
// `goToSignupLogin()` before driving LoginForm). A bare "click Products in the header, land on
// /products" check has no multi-step procedure to wrap, so calling Header.in(page).goToProducts()
// directly here is the single action under test, not an action being taken on the way to something else.
test(
  'Header.goToProducts() navigates from the home page to /products',
  { tag: ['@page:home', '@smoke'] },
  async ({ page }) => {
    await Header.open(page);

    await Header.in(page).goToProducts();

    await expect(page).toHaveURL(/\/products/);
  },
);
