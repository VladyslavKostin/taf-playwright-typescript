import { expect, test } from '../../../src/core/fixtures';
import { flow } from '../../../src/flows/flow';
import { OrderConfirmation } from '../../../src/components/checkout/order-confirmation.component';
import { Header } from '../../../src/components/navigation/header.component';
import { UserBuilder } from '../../../src/builders/auth/user.builder';
import { CardDetailsBuilder } from '../../../src/builders/checkout/card-details.builder';

test(
  'a new user can register, log in, and place an order',
  { tag: ['@page:checkout', '@regression'] },
  async ({ page, catalog }) => {
    const product = catalog.byName('Blue Top');

    // Registration is the thing under test here, so it is driven through the UI (not the API `setup`
    // fixture, which would arrange away the very behavior this spec exists to prove).
    const user = new UserBuilder().build();

    // `registerNewUser` starts by clicking the header's Login/Signup link, so the browser needs to be on
    // a page that renders the header first.
    await Header.open(page);
    await flow.auth.registerNewUser(page, user);

    // No separate `login(...)` call here: verified live that `registerNewUser`'s final "Continue" click
    // already lands back on the home page in a logged-in state (header shows "Logged in as <name>" /
    // Logout / Delete Account, with no `/login` link left to click) — matching `registerNewUser`'s own
    // doc comment ("...back to a logged-in state"). Calling `login(...)` again here would hang forever:
    // its first step, `Header.goToSignupLogin()`, waits on a `/login` link that no longer exists once the
    // session just created by registration is already authenticated.

    await Header.in(page).goToProducts();
    await flow.cart.addToCart(page, product.name, flow.cart.CartFollowUp.OpenCart);
    await flow.checkout.placeOrder(page, new CardDetailsBuilder().build());

    const message = await OrderConfirmation.in(page).successMessage();
    expect(message).toContain('Order Placed');
  },
);
