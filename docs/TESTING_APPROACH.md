# Testing Approach

This document defines what this framework tests, why, and how coverage is judged "enough." It's a
companion to [`SPEC.md`](../SPEC.md) (architecture/conventions) and
[`tasks/api-spike-findings.md`](../tasks/api-spike-findings.md) (what's actually callable on the site under
test) — read those first if you haven't.

## Scope

**In scope** — functional correctness of the core shopping journey on
[automationexercise.com](https://automationexercise.com):

- Browsing products (listing, search, product detail).
- Cart mechanics (add, quantity accumulation, line totals).
- Account creation and login (both UI-driven and API-arranged).
- Checkout → payment → order confirmation.
- The site's real (if undocumented) network behavior for cart mutations (`/add_to_cart/<id>`), demonstrated
  via the network-interception example.

**Explicitly out of scope:**

- **Performance/load testing** — no assertions on response time, no load generation. This is a functional
  framework sample, not a performance harness.
- **Accessibility testing** — no axe-core/WCAG scanning. A real project layering this in would add it as a
  parallel concern, not mixed into functional specs.
- **Security testing** — no injection/auth-bypass/fuzzing. automationexercise.com is a public demo site;
  testing it adversarially would be inappropriate regardless.
- **Real payment processing** — moot here: `/payment` is a fake form with no actual payment gateway behind
  it (confirmed during the checkout investigation — see `tasks/api-spike-findings.md`'s companion
  findings), so "placing an order" in this suite never touches real money or a real processor. There's
  nothing to exclude that isn't already excluded by the site itself.
- **Cross-browser/cross-device matrices** — the suite runs against Desktop Chrome only. Extending
  `playwright.config.ts`'s `use.devices` per project is a mechanical follow-up, not a scoping decision this
  document needs to defend.
- **Visual regression** — no screenshot-diffing. Playwright's `screenshot: 'only-on-failure'` setting exists
  for debugging failures, not for pixel comparison.

## Why each pyramid level exists, and what belongs where

| Level | Answers the question | Because |
|---|---|---|
| **Component** | "Does this one widget correctly read/manipulate its own piece of the DOM?" | Fast, isolated, and pinpoints exactly which widget broke — no need to drive a full journey to catch a broken price parser. |
| **API** | "Does the backend contract behave correctly, independent of any UI?" | Faster than driving a browser for pure data-shape/business-rule checks (`productsList`, `verifyLogin`), and the network-interception example proves the framework can assert on real network traffic underneath a UI action — a class of bug (wrong request, silently-swallowed failure) that DOM-only assertions can't see. |
| **E2E** | "Does an actual user-shaped journey work end to end, across pages, through real navigation?" | Everything below this level can pass while the journey itself is broken (e.g. a correct `CartTable` and a correct `PaymentPage` don't guarantee checkout actually connects them) — E2E is the only level that proves the seams. |

Component and API levels are deliberately kept cheap and numerous; E2E is deliberately kept to the few
journeys that actually justify a full, slower, more failure-prone browser run across multiple pages.

## Test data strategy

- **Builders** (`src/builders/`, grouped by area) generate realistic, valid-by-default data via
  `@faker-js/faker` — `UserBuilder`, `ProductBuilder`, `AddressBuilder`, `CardDetailsBuilder`. `.build()`
  with zero overrides is always valid; overrides are for the specific field a test cares about.
- **`ProductCatalog`** (`src/builders/product/product-catalog.builder.ts`, exposed to every spec via the
  `catalog` fixture) is the counterpart for data that must be *real*, not generated — a product's actual
  name/price on the live site. Specs look products up via `catalog.byName('Blue Top')` instead of hardcoding
  `{ name: 'Blue Top', price: 500 }` literals that would silently go stale if the site's catalog changes.
- **Fastest legal path**: arrange preconditions through the cheapest path that's actually real, act through
  the UI only for what the test is actually about. On this site, that specifically means:
  - Account **existence** as a precondition → `setup.accounts.createAccount()` (API-backed, see
    `src/contracts/auth/account-arranger.contract.ts`).
  - Account **creation as the thing under test** (e.g. the registration journey itself) → UI, via
    `registerNewUser`.
  - Cart operations → always UI. There is no cart API to arrange through (see
    `tasks/api-spike-findings.md`) — every cart-touching test drives the cart for real.
  - Login can never be arranged via API — `verifyLogin` checks credentials but returns no session
    token/cookie, so it cannot seed a browser session. Login is always exercised through `LoginForm`.

## Tagging strategy

Every spec carries exactly two kinds of tag, via Playwright's native `test(..., { tag: [...] })`:

- **Page tag** — which page in `src/core/coverage/page-registry.ts` the spec primarily exercises
  (`@page:home`, `@page:products`, `@page:product-details`, `@page:cart`, `@page:login`, `@page:signup`,
  `@page:checkout`). A journey spanning multiple pages is tagged with whichever page its Intent is centered
  on (e.g. `registration-to-order.spec.ts` is tagged `@page:checkout` — the journey's payoff — not `@page:signup`).
- **Priority tag** — `@smoke` (fast, high-value, safe to run on every push) or `@regression` (slower or
  edge-case coverage, still run in CI but not what you'd reach for first when triaging a red build).

Run a subset with Playwright's `--grep`, e.g. `npx playwright test --grep @smoke`.

## Coverage goals / definition of done

- **Every page in `page-registry.ts` has at least one test.** Enforced visibly by
  `npm run report:coverage` (`scripts/coverage-report.ts`) — it fails loudly (a `⚠ Pages with ZERO coverage`
  line) rather than silently, and separately warns on any spec missing a page tag at all, so a gap can't hide
  behind a tag typo.
- **This is coverage *visibility*, not a numeric gate.** The report tells you where the suite is thin; it
  doesn't claim a page with one smoke test is "fully covered." Use the smoke/regression split per page as
  the next signal — a page with only `@smoke` coverage and zero `@regression` is a candidate for more
  edge-case tests, not a failure.
- **New features extend, not bypass, this.** Per `SPEC.md`'s Agent-Based Development Workflow, new coverage
  goes through `test-case-planner` first specifically so its tags are decided deliberately, not
  retrofitted after the fact.

## Known environmental quirk

The live site loads a third-party Google "Funding Choices" ad-consent overlay on every fresh page load,
which intercepts pointer events and breaks hover/click-based actions if left unhandled. This is blocked
globally in `src/core/fixtures.ts`'s `page` fixture — see `SPEC.md`'s Code Style section. It's not a defect
in the site under test from a real-user perspective (real users see and dismiss/ignore the same banner); it
only matters here because Playwright's synthetic hover doesn't wait for a banner a human would glance past.
