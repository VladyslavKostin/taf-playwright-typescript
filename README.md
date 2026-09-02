# taf-playwright-typescript

A sample Playwright + TypeScript test automation framework, built around the **Intent → Flow → Component**
pattern, testing the full pyramid (Component / API / E2E) against a real public site —
[automationexercise.com](https://automationexercise.com).

This is a reference implementation, not a product test suite: it exists to show the pattern working end to
end on real pages, not to exhaustively cover the site.

## Quick start

```bash
git clone <this-repo>
cd taf-playwright-typescript
npm install
npx playwright install --with-deps
cp .env.example .env   # defaults already point at automationexercise.com — edit only if needed
npm test
npm run report          # open the Playwright HTML report
npm run report:coverage # open coverage-report.html — which pages/tags are exercised
```

No credentials, API keys, or accounts are required — the site under test is public, and account creation
happens live as part of the tests that need it.

## Why Intent → Flow → Component (not Page Object Model or Screenplay)

Both POM and Screenplay model something that looks stable but isn't: POM models **pages** (a routing
decision that changes for reasons unrelated to the tests), Screenplay models the **actor** (a framing
decision). This framework instead models **widgets** (Components) that survive redesigns, and **procedures**
(Flows) that compose them — the page itself isn't a unit at all.

```
        ┌────────────────────────────────────────────────────────┐
  WHY   │  INTENT      tests/*.spec.ts                            │
        │  "cart total reflects quantity changes"                 │  reads like an AC
        └─────────────────────────┬────────────────────────────────┘
                                  │ calls
        ┌─────────────────────────▼────────────────────────────────┐
  HOW   │  FLOW        src/flows/*.flow.ts                          │
        │  addToCart() · placeOrder() · registerNewUser()           │  zero selectors
        └─────────────────────────┬────────────────────────────────┘
                                  │ composes
        ┌─────────────────────────▼────────────────────────────────┐
  WITH  │  COMPONENT   src/components/*.component.ts                │
        │  ProductCard · CartTable · Header · LoginForm             │  zero assertions
        └─────────────────────────┬────────────────────────────────┘
                                  │ drives
        ┌─────────────────────────▼────────────────────────────────┐
        │  DRIVER      Playwright page · API request context        │
        └────────────────────────────────────────────────────────┘

        Arrows only ever point down. Nothing points back up.
```

### The six rules

1. Dependencies point down: Intent → Flow → Component → Driver. Never up, never sideways.
2. Selectors exist only in `src/components/` (an ESLint rule enforces this — see `eslint.config.js`).
3. Components never assert. They return typed data.
4. Flows contain no selectors and no assertions. They contain procedure.
5. A spec may **read** a component; it may not **act** on one — actions go through flows (the
   network-interception spec is a deliberate, documented exception, since there the component's action IS
   the thing under test).
6. Arrange through the fastest legal path (API/builder); act through the UI only on the subject of the test.

Full rationale: see the pattern's source article, and [`SPEC.md`](SPEC.md) for this project's specific
conventions.

## The testing pyramid, with real examples

| Level | Where | What it proves | Run it |
|---|---|---|---|
| **Component** | `tests/component/` | One widget works correctly against real markup | `npm run test:component` |
| **API** | `tests/api/` | Backend contract + real network behavior underneath UI actions | `npm run test:api` |
| **E2E** | `tests/e2e/` | Full user journeys across pages | `npm run test:e2e` |

See [`docs/TESTING_APPROACH.md`](docs/TESTING_APPROACH.md) for what's in/out of scope, why each level exists,
the tagging strategy, and coverage goals.

## Project structure

Every layer with more than one file is grouped into **area subfolders** (`navigation/`, `product/`, `cart/`,
`auth/`, `checkout/`) — a change to one part of the site touches one folder per layer, not a flat pile of
files. `core/` stays flat since it's cross-cutting, not area-specific.

```
src/
  components/   Widgets — one root locator each, zero assertions — navigation/ product/ cart/ auth/ checkout/
  flows/        Procedures composing components — zero selectors, zero assertions — cart/ checkout/ auth/
  contracts/    Interfaces + implementations for fastest-legal-path arrangement — auth/ (AccountArranger)
  api/          Thin API clients — product/ auth/
  builders/     Fluent test data builders (faker-backed) + ProductCatalog (real live-catalog lookups)
  core/         Config loader, shared Playwright fixtures (incl. `catalog`), page-registry (for coverage)
  types/        Shared domain types — product/ cart/ auth/ checkout/

tests/
  component/    One component in isolation — navigation/ product/ cart/ auth/
  api/          Direct API calls + network-interception example — product/ auth/ cart/
  e2e/          Full journeys via flows + components — cart/ checkout/

scripts/coverage-report.ts   Page x Tag coverage matrix
.claude/agents/               Sub-agent definitions this framework is built/extended with
```

## Adding a new test

1. Read `SPEC.md`'s Code Style section and the six rules above.
2. If a component you need doesn't exist yet, add it under `src/components/<area>/` (one root locator,
   `static in()` factory, zero assertions) — verify real selectors against the live site, don't guess. A
   component that owns a whole page (like `LoginForm` or `ProductDetails`) may also expose a `static
   open(page, ...)` that navigates there directly; pages reachable from the nav bar are navigated via
   `Header.open(page)` + `Header.in(page).goToX()` instead — specs never call `page.goto()` with a raw path.
3. If the action needs composing multiple components into a procedure, add/extend a flow under
   `src/flows/<area>/`, then re-export it under the matching area key in `src/flows/flow.ts`. Avoid raw
   string literals for named options (see `CartFollowUp` in `src/flows/cart/cart.flow.ts` for the pattern —
   an `as const` object + derived type, not bare strings).
4. Write the spec in the matching `tests/<level>/<area>/` directory. Import `test`/`expect` from
   `src/core/fixtures` (not `@playwright/test` directly — the shared fixture handles a third-party overlay
   that otherwise breaks hover/click actions, and provides the `catalog` fixture for real product lookups —
   never hardcode a product's name/price as a literal). Act through flows via the `flow` aggregator —
   `import { flow } from '.../src/flows/flow'`, then `flow.cart.addToCart(...)`, `flow.auth.login(...)` —
   never a bare function imported straight from an area flow file. Tag it with a page tag (see
   `src/core/coverage/page-registry.ts`) and a priority tag (`@smoke`/`@regression`).
5. Run it, then run `npm run report:coverage` to confirm your new page/tag shows up.

This project was itself built using a small set of Claude Code sub-agents (`.claude/agents/`) —
`test-orchestrator` coordinating `test-case-planner`, `component-creator`, `flow-creator`, and
`test-creator`, each restricted to its own layer's files. See `SPEC.md`'s Agent-Based Development Workflow
section if you want to extend the framework the same way.

## Commands

```
Setup:        npm install && npx playwright install --with-deps
Typecheck:    npm run typecheck
Lint:         npm run lint          (npm run lint:fix to auto-fix)
Format:       npm run format

Test (all):        npm test
Test (component):  npm run test:component
Test (api):        npm run test:api
Test (e2e):        npm run test:e2e

Report:       npm run report              # Playwright HTML report
Coverage:     npm run report:coverage     # Page x Tag coverage matrix
```

## CI

`.github/workflows/ci.yml` runs typecheck, lint, the full suite, and the coverage report on every push and
pull request to `main`, uploading the Playwright HTML report and coverage report as artifacts.

## License

MIT — see [`LICENSE`](LICENSE).
