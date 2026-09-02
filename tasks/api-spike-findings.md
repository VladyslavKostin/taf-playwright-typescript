# API Spike Findings — automationexercise.com/api

Resolves Risk 1 from `tasks/plan.md`. Verified live on 2026-09-02 via `curl`.

## Endpoints confirmed callable

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/productsList` | none | 200, returns `{ responseCode, products: [{id, name, price, brand, category}] }` |
| GET | `/api/brandsList` | none | 200 |
| POST | `/api/searchProduct` | none | body: `search_product`; GET returns 200 with a "not supported" body — must POST |
| POST | `/api/verifyLogin` | none | body: `email`, `password`; returns `responseCode` 200/404 — **verifies credentials, does not return a session token or set a cookie usable by the browser** |
| POST | `/api/createAccount` | none | body: full user fields; creates a real account server-side |
| PUT | `/api/updateAccount`, DELETE `/api/deleteAccount`, POST `/api/getUserDetailByEmail` | none | documented but not exercised in this spike |

## No cart/order endpoint in the documented public API — but a real backend route exists

There is no `addToCart`, `cart`, `order`, or `checkout` endpoint in the documented `/api/*` REST surface.
However, `static/js/cart.js` shows the site itself calls real (undocumented, session-based) routes:

- `GET /add_to_cart/<product_id>` (optionally with a `quantity` param) — fired by `.add-to-cart` and `.cart`
  click handlers; on success shows the cart modal.
- `GET /delete_cart/<product_id>` — fired by the cart page's quantity-delete control.

These are exactly what the network-interception example (T16) should target with `context.route()` /
`page.route('**/add_to_cart/**', ...)` — real, observable network calls, just not part of the documented
public API, so they don't count as an "API-backed Cart" for arrangement purposes (no stable documented
contract to build a client against).

## Conclusion — resolves Risk 1

- **`Cart` stays UI-only.** There is nothing to build an `ApiCart` against, so SPEC.md's "Cart contract, two
  implementations" success criterion is not achievable as written and needs updating.
- **The "fastest legal path" principle is still demonstrable — via Account, not Cart.** `createAccount` lets
  a test arrange "an account that already exists" over the API (fast, no browser) when account existence is
  a precondition, not the thing under test — the actual login (the thing under test in a login spec) still
  goes through `LoginForm` in the UI. `verifyLogin` cannot be used to seed a browser session (no cookie/token
  returned), so login itself is always exercised through the UI component, never faked.
- Net effect: `src/contracts/` gets an `AccountArranger` (API-backed, used by the `setup` fixture) instead of
  a dual-implementation `Cart`. `Cart`/`CartTable`/`ProductCard` remain UI-only components with no contract
  abstraction needed, since there's only ever one way to touch a cart on this site.

## Follow-up

`SPEC.md` and `tasks/todo.md` updated to reflect this (see next commit/edit) — replacing the Cart
dual-implementation criterion with the Account-arrangement one.
