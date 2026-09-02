# Spec: taf-playwright-typescript

## Objective

Build a **sample test automation framework** that demonstrates, on a real public site, how to structure a
maintainable, maximally-extendable Playwright + TypeScript test suite using:

- The **Intent → Flow → Component** architecture (three layers, dependencies point one direction only —
  see the attached article for full rationale).
- The **testing pyramid** — Component, API, and E2E — with working examples at every level, not just E2E.
- SOLID / OOP / KISS applied concretely (interfaces at boundaries, single-responsibility components,
  dependency inversion for UI-vs-API test data arrangement).

**Who is this for:** engineers evaluating or adopting this pattern as a reference implementation — either to
fork it for a real project, or to read it as a worked example of the pattern described in the article.

**Success looks like:** a stranger can `git clone`, run one setup command, run `npm test`, get a Playwright
HTML report, and — by reading `README.md` plus a handful of example files — understand how to add a new
test at any pyramid level without touching architecture.

**Example site under test** (public, no auth secrets needed):
- Web: `https://automationexercise.com`
- API: `https://automationexercise.com/api`

## Tech Stack

- **TypeScript** 5.x (strict mode)
- **Playwright Test** (`@playwright/test`, latest) — single runner for all three pyramid levels
- **Node.js** 20 LTS
- **@faker-js/faker** — realistic random data for TestData builders
- **dotenv** — environment-based config (base URLs, etc.)
- **ESLint + Prettier** — linting/formatting, including a project-specific rule of thumb enforced by folder
  convention (selectors only allowed under `src/components/`)

## Commands

```
Setup:        npm install && npx playwright install --with-deps
Typecheck:    npm run typecheck            # tsc --noEmit
Lint:         npm run lint                 # eslint . --ext .ts
Lint (fix):   npm run lint:fix
Format:       npm run format               # prettier --write .

Test (all):        npm test
Test (component):   npm run test:component
Test (api):          npm run test:api
Test (e2e):           npm run test:e2e

Report:        npm run report              # npx playwright show-report
Coverage:      npm run report:coverage     # scripts/coverage-report.ts — Page x Tag matrix
```

## Project Structure

Every layer that has more than one file is grouped into **area subfolders** — `navigation/`, `product/`,
`cart/`, `auth/`, `checkout/` — so a change to one part of the site (e.g. checkout) touches one folder per
layer, not a flat pile of unrelated files. `core/` stays flat: it's cross-cutting (config, fixtures,
coverage), not tied to one area.

```
src/
  components/       # COMPONENT layer — one class per UI widget, one root locator, zero assertions
    navigation/       header.component.ts
    product/          product-card.component.ts, product-details.component.ts
    cart/             cart-table.component.ts, cart-modal.component.ts, cart-checkout-bar.component.ts
    auth/             login-form.component.ts, signup-form.component.ts (+ AccountInfoForm)
    checkout/         checkout-page.component.ts, payment-page.component.ts, order-confirmation.component.ts
  flows/            # FLOW layer — reusable async procedures, zero selectors, zero assertions
    flow.ts           the aggregator every spec imports — flow.cart.*, flow.checkout.*, flow.auth.*
    cart/             cart.flow.ts (addToCart)
    checkout/         checkout.flow.ts (placeOrder)
    auth/             auth.flow.ts (registerNewUser, login)
  contracts/        # Interfaces shared across UI/API implementations
    auth/             account-arranger.contract.ts, api-account-arranger.ts
  api/              # Thin API clients (wrap Playwright's `request` fixture)
    product/          products.api.ts
    auth/             account.api.ts
  builders/         # TestData builder classes (fluent, faker-backed)
    product/          product.builder.ts, product-catalog.builder.ts (real catalog lookups, not faked data)
    auth/             user.builder.ts, address.builder.ts
    checkout/         card-details.builder.ts
  types/            # Shared domain types
    product/ cart/ auth/ checkout/
  core/             # Cross-cutting — not area-specific, stays flat
    config.ts, fixtures.ts, coverage/page-registry.ts

tests/
  component/        # One Component class in isolation, against a real page — same area subfolders
    navigation/ product/ cart/ auth/
  api/              # Direct API-level tests, incl. a network-interception example — same area subfolders
    product/ auth/ cart/
  e2e/              # INTENT specs — full user journeys via flows + components — same area subfolders
    cart/ checkout/

scripts/
  coverage-report.ts   # scans test tags, cross-references src/core/coverage/page-registry.ts,
                        # emits a Page x Tag coverage matrix (HTML + console summary)

.claude/agents/       # sub-agent definitions used to build and extend this framework
  test-orchestrator.md
  test-case-planner.md
  component-creator.md
  flow-creator.md
  test-creator.md

playwright.config.ts   # defines 3 projects: component / api / e2e
.env.example
.github/workflows/ci.yml
docs/TESTING_APPROACH.md
README.md
SPEC.md
```

## Agent-Based Development Workflow

This framework is built (and meant to be extended) using a small set of Claude Code sub-agents defined in
`.claude/agents/`, each scoped to one layer so the six Intent-Flow-Component rules are enforced by *who is
allowed to touch what*, not just by convention:

| Agent | Responsibility | May write to |
|---|---|---|
| **test-orchestrator** | Entry point. Receives a feature/AC, always calls `test-case-planner` first, reviews its output, then dispatches `component-creator` / `flow-creator` / `test-creator` in dependency order (components → flows → specs), verifying each stage before the next starts. | Nothing directly — coordinates only |
| **test-case-planner** | Turns an Intent/acceptance criterion into a concrete list: which pyramid level(s) it needs, which components/flows already exist vs. must be created, what test data it needs, and which tags apply (level, page, priority). | Nothing — planning output only |
| **component-creator** | Implements one Component class per widget per the Code Style conventions (root locator, `static in()`, zero assertions). | `src/components/**` only |
| **flow-creator** | Implements Flow functions composing existing Components (zero selectors, zero assertions). | `src/flows/**` only |
| **test-creator** | Writes the spec file(s) for the planned pyramid level(s), using existing Flows/Components/Builders, and applies the tags `test-case-planner` assigned. | `tests/**` only |

This project's own Tasks/Implement phase uses this same orchestration — the orchestrator plans before any
component/flow/test file is written, and each creation agent stays inside its own directory. Contributors
extending the framework later are expected to use the same agents rather than hand-rolling new layers.

## Code Style

One component, showing the pattern end to end (adapted from the reference article):

```typescript
// src/components/product/product-card.component.ts
import { Locator, Page } from '@playwright/test';

export class ProductCard {
  private constructor(private readonly root: Locator) {}

  /** Same widget on Home, Products, Category, Brand, and Recommended sections. */
  static in(scope: Page | Locator, name: string): ProductCard {
    return new ProductCard(
      scope.locator('.product-image-wrapper').filter({ hasText: name }).first(),
    );
  }

  async price(): Promise<number> {
    const raw = await this.root.locator('.productinfo h2').innerText();
    return Number(raw.replace(/\D/g, ''));
  }

  async addToCart(): Promise<void> {
    await this.root.hover();
    await this.root.locator('.overlay-content .add-to-cart').click();
  }
}
```

Conventions:
- Specs import `test`/`expect` from `src/core/fixtures`, never directly from `@playwright/test` — the
  shared `page` fixture there blocks a third-party ad-consent overlay
  (`fundingchoicesmessages.google.com`) that the live site loads on every fresh page load and that
  otherwise intercepts pointer events, breaking any hover/click-based component action.
- File suffixes: `.component.ts`, `.flow.ts`, `.builder.ts`, `.api.ts`, `.contract.ts`.
- **Area folders**: any layer with more than one file is grouped by domain area
  (`navigation/product/cart/auth/checkout`) — `src/components/cart/cart-table.component.ts`, not a flat
  `src/components/cart-table.component.ts`. Mirrored in `tests/<level>/<area>/`. `core/` is the one
  exception (cross-cutting, not area-specific).
- Components: PascalCase class, one root `Locator`, `static in(scope, ...)` factory, no `expect(...)` calls.
  A component that owns an entire page (e.g. `LoginForm`, `ProductDetails`, `CheckoutPage`) may also expose
  a `static open(page, ...)` that navigates there directly and returns the instantiated component — a spec
  never calls `page.goto('/some/path')` with a raw string. For pages reachable from the nav bar, navigate
  via `Header.open(page)` (lands on home) then `Header.in(page).goToX()` instead.
- Flows: exported `async function`, verbs (`addToCart`, `placeOrder`, `registerNewUser`), no `page.locator(...)`.
  Named options use an `as const` object + derived type (see `CartFollowUp` in
  `src/flows/cart/cart.flow.ts`) — never a bare string literal passed at the call site.
- **`flow` aggregator** (`src/flows/flow.ts`): specs never import a flow function directly from its area
  file. They import the single `flow` object and call it by area — `flow.cart.addToCart(...)`,
  `flow.auth.login(...)`, `flow.cart.CartFollowUp.OpenCart` — so a spec reads as "which area, which action"
  instead of an unlabeled function name that could be from anywhere. Adding a new flow function means
  writing it in its area file as usual, then re-exporting it under the matching key in `flow.ts`.
- Specs: read from components directly for assertions; only ever *act* through flows (via the `flow`
  aggregator). Real product data (name/price that must match the live catalog) comes from the `catalog`
  fixture (`catalog.byName('Blue Top')`), never a hand-typed `{ name, price }` literal that can silently go
  stale.
- Builders: fluent `.withX().withY().build()`, sensible faker-generated defaults so `.build()` alone is
  valid. `ProductCatalog` (`src/builders/product/product-catalog.builder.ts`) is the one builder-folder
  exception — it looks up *real* catalog data instead of generating fake data, for the cases above.

## Testing Strategy

Playwright Test runs all three levels as separate **projects** in `playwright.config.ts`, each scoped to its
own `testDir`, so `npm test` runs everything and `npm run test:<level>` filters to one.

| Level | Dir | What it proves | Example specs |
|---|---|---|---|
| **Component** | `tests/component/` | One Component class works correctly against real markup | `ProductCard.price()` reads the right number; `CartTable.lines()` parses rows correctly |
| **API** | `tests/api/` | Backend contract, no UI involved — includes both read-only and authenticated endpoints, plus a network-interception example | `GET /productsList` returns 200 + expected shape; `POST /verifyLogin` with valid/invalid creds; `POST /createAccount`; intercepting `context.route()` on `addToCart` to assert the expected request fires and to simulate a failed/slow response and verify the UI handles it |
| **E2E** | `tests/e2e/` | Full user journeys via Flow + Component composition | Add products to cart → totals correct; register → login → place order |

Reporting: Playwright's built-in `html` reporter (local) + `list` reporter (console), `github` reporter added
automatically in CI for annotations. `test.step()` used inside flows for readable reports. No third-party
reporting dependency.

**Tagging strategy** — every spec is tagged along two axes using Playwright's native `tag` option:
- Page tag(s): `@page:home`, `@page:products`, `@page:product-details`, `@page:cart`, `@page:login`,
  `@page:signup`, `@page:checkout` — matched against the fixed list in `src/core/coverage/page-registry.ts`.
- Priority tag: `@smoke` or `@regression`.

**Coverage report** (`npm run report:coverage`) — `scripts/coverage-report.ts` reads every test's tags,
cross-references them against `page-registry.ts`, and emits a Page × Tag matrix (HTML + console) showing
which pages have zero coverage and the smoke/regression split per page. This is a coverage-visibility tool,
not a code-coverage instrumentation tool — it reports what pages and priorities are exercised, not lines
executed.

## Boundaries

- **Always do:** follow the six Intent-Flow-Component rules (deps point down only; selectors live only in
  `src/components/`; components never assert; flows contain no selectors/assertions; specs may *read* a
  component but not *act* on one directly; arrange test data through the fastest legal path — API/builder
  over UI — and drive the UI only for the thing actually under test). Run `npm run typecheck` and
  `npm run lint` before considering a task done. Route feature work through `test-orchestrator` →
  `test-case-planner` before any component/flow/test file is written, and keep each creation agent inside
  its own directory (see Agent-Based Development Workflow). Tag every new spec with its page and priority.
- **Ask first:** adding any new npm dependency beyond what's listed in Tech Stack, changing
  `playwright.config.ts` retry/timeout defaults, modifying `.github/workflows/ci.yml` after initial creation.
- **Never do:** commit secrets/tokens, put a `page.locator(...)` outside `src/components/`, add assertions
  inside `src/components/` or `src/flows/`, silently skip/disable a failing test.

## Success Criteria

- [x] `npm install && npx playwright install --with-deps` then `npm test` runs green end-to-end and produces
      a Playwright HTML report. — 12/12 passing, `playwright-report/index.html` generated.
- [x] Each pyramid level (component / api / e2e) has at least 2 example spec files. — component: 6, api: 3,
      e2e: 2.
- [x] `ProductCard` (or equivalent) demonstrates the "same widget, multiple pages" case from the article. —
      verified live on Home/Products/Category/Brand.
- [x] An `AccountArranger` contract (API-backed) is used by the `setup` fixture to create accounts as a
      precondition, while login itself (the thing actually under test) always goes through `LoginForm` in
      the UI — demonstrating "arrange through the fastest legal path" for the one workflow on this site
      where that's achievable (`Cart` has no server-side endpoint at all — see
      `tasks/api-spike-findings.md` — so it stays UI-only with no contract abstraction). —
      `tests/component/auth/login-form-valid.spec.ts`.
- [x] README explains: setup, the Intent-Flow-Component pattern (with a short version of the article's
      rationale + six rules), how to run each pyramid level, and how to add a new test.
- [x] `npm run typecheck` and `npm run lint` both pass with zero errors.
- [x] GitHub Actions workflow file exists and would run `npm test` + upload the HTML report as an artifact
      on push/PR (validated locally with `act` or by inspection — actual CI run happens after repo creation). —
      YAML structurally validated; actual CI run happens once the repo is pushed.
- [x] `.claude/agents/` contains the five agent definitions (orchestrator, planner, and the three creators),
      and this project's own component/flow/test files were produced through that workflow.
- [x] `npm run report:coverage` runs and produces a Page × Tag matrix covering every page in
      `page-registry.ts`, with no page left entirely untested. — all 7 pages covered.
- [x] At least one API-level spec demonstrates network interception (asserting a request fired, and
      simulating a failed/slow response to verify UI handling). — `tests/api/cart/network-interception.spec.ts`.
- [x] `docs/TESTING_APPROACH.md` exists and defines: functional scope covered vs. explicitly out of scope
      (e.g. performance, accessibility, security, real payment completion), the rationale for what belongs
      at each pyramid level, the tagging strategy, and coverage goals/definition-of-done.

**Deferred until after your review of the built solution** (explicit, not part of this spec's build steps):
- [ ] Public GitHub repo created, MIT license added, default branch protected so only the repo owner can
      approve/merge PRs (others may open PRs but not merge).
- [ ] Code pushed, GitHub Actions confirmed running on a real PR.

## Open Questions

None outstanding — resolved:
1. Repo name: `taf-playwright-typescript`.
2. API tests cover both read-only and authenticated endpoints (login/create account).
3. CI triggers: push + pull_request only, no scheduled/nightly run.
