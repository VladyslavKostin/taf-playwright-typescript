import { addToCart, CartFollowUp } from './cart/cart.flow';
import { placeOrder } from './checkout/checkout.flow';
import { registerNewUser, login } from './auth/auth.flow';

/**
 * Single entry point for every flow, grouped by area so a spec can discover what's available via
 * autocomplete (`flow.cart.`, `flow.auth.`, ...) instead of tracking down which file exports which
 * function. Add a new flow function to its area file as usual, then re-export it here.
 */
export const flow = {
  cart: { addToCart, CartFollowUp },
  checkout: { placeOrder },
  auth: { registerNewUser, login },
};
