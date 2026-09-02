# Tasks: taf-playwright-typescript

Expands `tasks/plan.md`'s build order into discrete, dependency-ordered tasks. Each is scoped to ≤5 files
and independently verifiable. **Agent** notes which `.claude/agents/` persona (see SPEC.md's Agent-Based
Development Workflow) should execute it during Implement — `orchestrator` itself does no file writes.

---

- [x] **T0 — Write the five agent definitions**
  - Acceptance: `.claude/agents/test-orchestrator.md`, `test-case-planner.md`, `component-creator.md`,
    `flow-creator.md`, `test-creator.md` each exist with clear scope/responsibility/write-boundary matching
    the table in SPEC.md's Agent-Based Development Workflow section.
  - Verify: manual read-through — each file's "may write to" matches SPEC.md exactly; no overlap between
    component-creator/flow-creator/test-creator write scopes.
  - Files: `.claude/agents/test-orchestrator.md`, `.claude/agents/test-case-planner.md`,
    `.claude/agents/component-creator.md`, `.claude/agents/flow-creator.md`, `.claude/agents/test-creator.md`
  - Depends on: —
  - Agent: orchestrator (self-authored, precedes delegation)

- [x] **T1 — Spike: confirm automationexercise.com/api's real endpoint surface**
  - Acceptance: a short findings note lists every callable endpoint discovered (method, path, auth
    requirement, response shape) and states explicitly whether a server-side cart endpoint exists; resolves
    Risk 1 from `tasks/plan.md` — either "Cart is fully API-backed" or "API covers account/session only,
    cart mutation stays UI-only."
  - Verify: findings note exists and each listed endpoint was actually hit once (curl or Playwright
    `request`) with the real response recorded, not assumed.
  - Files: `tasks/api-spike-findings.md`
  - Depends on: —
  - Agent: test-case-planner

- [x] **T2 — Project scaffolding: package + TS + lint/format**
  - Acceptance: `npm install` succeeds; `npm run typecheck` and `npm run lint` both run (even with zero
    source files) and exit 0; strict TS mode on; ESLint config forbids `page.locator(` outside
    `src/components/**` (or documents that this is enforced by convention/review if a working lint rule
    isn't feasible — note which, in the file).
  - Verify: `npm install && npm run typecheck && npm run lint`
  - Files: `package.json`, `tsconfig.json`, `.eslintrc.json` (or `eslint.config.js`), `.prettierrc`,
    `.gitignore`
  - Depends on: —
  - Agent: orchestrator (infra, not delegated)

- [x] **T3 — Playwright config + env example**
  - Acceptance: `playwright.config.ts` defines exactly 3 projects (`component`, `api`, `e2e`) each with its
    own `testDir`, reads `WebBaseUrl`/`ApiBaseUrl` from env (default to the values in `.env.example`), `html`
    + `list` reporters locally and `github` reporter added when `process.env.CI` is set, retries=1 in CI/0
    locally.
  - Verify: `npx playwright test --list` runs without error and shows 3 empty projects.
  - Files: `playwright.config.ts`, `.env.example`
  - Depends on: T2
  - Agent: orchestrator

- [x] **T4 — Shared types + config loader**
  - Acceptance: domain types for `Product`, `User`, `Address`, `CartLine` exist; a `loadConfig()` (or
    equivalent) reads `WebBaseUrl`/`ApiBaseUrl` from env with dotenv, typed and validated (throws a clear
    error if missing).
  - Verify: `npm run typecheck` passes; a throwaway `console.log(loadConfig())` run confirms it reads
    `.env.example`-shaped values.
  - Files: `src/types/product.ts`, `src/types/user.ts`, `src/types/cart.ts`, `src/core/config.ts`
  - Depends on: T2
  - Agent: orchestrator

- [x] **T5 — Page registry + fixture skeleton**
  - Acceptance: `page-registry.ts` exports the fixed list of pages (`home`, `products`, `product-details`,
    `cart`, `login`, `signup`, `checkout`) matching the `@page:*` tags defined in SPEC.md; a fixture skeleton
    exists (`test.extend` scaffold) ready for `cart`/`setup` fixtures to be added in T13.
  - Verify: `npm run typecheck` passes; the page-registry list is imported and manually diffed against
    SPEC.md's tag list — no mismatches.
  - Files: `src/core/coverage/page-registry.ts`, `src/core/fixtures.ts`
  - Depends on: T4
  - Agent: orchestrator

- [x] **T6 — AccountArranger contract**
  - Acceptance: `AccountArranger` interface (`createAccount(user): Promise<void>`) defined per T1's spike
    findings — Cart has no server-side endpoint, so no Cart contract; Account creation is the one workflow
    where API-backed arrangement is real.
  - Verify: `npm run typecheck` passes; interface reviewed against `tasks/api-spike-findings.md` for
    consistency.
  - Files: `src/contracts/account-arranger.contract.ts`
  - Depends on: T1, T4
  - Agent: orchestrator

- [x] **T7 — TestData builders**
  - Acceptance: `UserBuilder`, `ProductBuilder`, `AddressBuilder` each support fluent `.withX().build()`,
    produce valid faker-backed defaults when `.build()` is called with no `.withX()` calls at all.
  - Verify: a throwaway script builds one of each with zero overrides and asserts the result matches the
    corresponding type; `npm run typecheck` passes.
  - Files: `src/builders/user.builder.ts`, `src/builders/product.builder.ts`, `src/builders/address.builder.ts`
  - Depends on: T4
  - Agent: orchestrator

- [x] **T8 — API clients**
  - Acceptance: thin clients wrapping Playwright's `request` fixture for whatever T1 confirmed is callable
    (at minimum products/brands read, account create/login); each method returns typed data, no assertions
    inside the client.
  - Verify: a throwaway script calls each client method against the live API and logs the typed result;
    `npm run typecheck` passes.
  - Files: `src/api/products.api.ts`, `src/api/account.api.ts`
  - Depends on: T1, T4
  - Agent: orchestrator

- [x] **T9 — Components: cart-related**
  - Acceptance: `ProductCard`, `CartTable`, `CartModal` follow the Code Style conventions exactly (root
    locator, `static in()` factory where applicable, zero assertions, typed reads for `CartTable.lines()`).
  - Verify: a throwaway `--headed` script instantiates each against the live site and logs real data (price,
    cart lines) — confirms selectors are real, not just typechecked.
  - Files: `src/components/product-card.component.ts`, `src/components/cart-table.component.ts`,
    `src/components/cart-modal.component.ts`
  - Depends on: T5
  - Agent: component-creator

- [x] **T10 — Components: auth-related**
  - Acceptance: `LoginForm`, `SignupForm` follow the same conventions; expose typed actions (`submit(...)`)
    and reads (e.g. error message text) with zero assertions.
  - Verify: throwaway `--headed` script drives each against the live site once.
  - Files: `src/components/login-form.component.ts`, `src/components/signup-form.component.ts`
  - Depends on: T5
  - Agent: component-creator

- [x] **T11 — Components: navigation/misc**
  - Acceptance: `Header` (nav/search/cart-count) and `ProductDetails` follow the same conventions.
  - Verify: throwaway `--headed` script drives each against the live site once.
  - Files: `src/components/header.component.ts`, `src/components/product-details.component.ts`
  - Depends on: T5
  - Agent: component-creator

- [x] **T12 — Flows**
  - Acceptance: `addToCart`, `placeOrder` (shopping.flow.ts) and `registerNewUser`, `login`
    (auth.flow.ts) exist as exported async functions, compose only existing Components, contain zero
    selectors and zero assertions.
  - Verify: throwaway script runs `addToCart` then reads `CartTable.lines()` directly — confirms the flow
    actually results in the expected component-readable state.
  - Files: `src/flows/shopping.flow.ts`, `src/flows/auth.flow.ts`
  - Depends on: T9, T10, T11
  - Agent: flow-creator

- [x] **T13 — Contract implementation + fixture wiring**
  - Acceptance: `ApiAccountArranger` implements `AccountArranger` (drives T8's `AccountApi`); `setup` fixture
    (arrangement, API-backed) and `page`/flow-driven access (the thing under test) both wired into
    `src/core/fixtures.ts` per SPEC.md's `test.extend` example.
  - Verify: a throwaway spec uses the `setup` fixture to create an account via API, then logs in through
    `LoginForm` in the UI — confirms the arrange/act split actually works end to end.
  - Files: `src/contracts/api-account-arranger.ts`, `src/core/fixtures.ts` (edit)
  - Depends on: T6, T8, T12
  - Agent: orchestrator

- [x] **T14 — Test-case planning pass**
  - Acceptance: a concrete list mapping each planned spec file to its pyramid level, page tag(s), priority
    tag, and the components/flows/builders it will use — turning SPEC.md's example specs into an exact,
    reviewable file list before any spec is written.
  - Verify: every SPEC.md "Example specs" entry (Testing Strategy table) is accounted for in the list.
  - Files: `tasks/test-case-plan.md`
  - Depends on: T13
  - Agent: test-case-planner

- [x] **T15 — Component specs**
  - Acceptance: ≥2 specs in `tests/component/`, each tagged per T14's plan, asserting in the spec (not the
    component) per the "specs read, never act on a component directly for assertions" rule.
  - Verify: `npm run test:component`
  - Files: `tests/component/product-card.spec.ts`, `tests/component/cart-table.spec.ts`
  - Depends on: T14
  - Agent: test-creator

- [x] **T16 — API specs incl. network interception**
  - Acceptance: ≥2 direct API specs (products read, account create/login) plus 1 network-interception spec
    (`context.route()` on the add-to-cart request — asserts the request fires, and separately simulates a
    failed/slow response to verify UI handling); real request shape confirmed by inline discovery (log
    `page.on('request', ...)` once) before finalizing the mock.
  - Verify: `npm run test:api`
  - Files: `tests/api/products.spec.ts`, `tests/api/account.spec.ts`, `tests/api/network-interception.spec.ts`
  - Depends on: T14
  - Agent: test-creator

- [x] **T17 — E2E specs**
  - Acceptance: ≥2 Intent specs composing flows+components across pages (cart totals reflect quantity
    changes; register → login → place order), tagged per T14's plan.
  - Verify: `npm run test:e2e`
  - Files: `tests/e2e/cart-totals.spec.ts`, `tests/e2e/registration-to-order.spec.ts`
  - Depends on: T14
  - Agent: test-creator

- [x] **T18 — Coverage tooling**
  - Acceptance: `scripts/coverage-report.ts` reads all specs' tags, cross-references `page-registry.ts`,
    emits a Page × Tag matrix (console + HTML), warns on any spec missing a page tag; `npm run
    report:coverage` wired in `package.json`.
  - Verify: `npm run report:coverage` runs clean, shows zero pages with no coverage, zero untagged-spec
    warnings.
  - Files: `scripts/coverage-report.ts`, `package.json` (edit)
  - Depends on: T15, T16, T17
  - Agent: orchestrator

- [x] **T19 — CI workflow**
  - Acceptance: `.github/workflows/ci.yml` triggers on push + pull_request only, runs
    `npm ci && npx playwright install --with-deps && npm run typecheck && npm run lint && npm test`, uploads
    the Playwright HTML report as an artifact.
  - Verify: YAML lints (`yamllint` or manual read); dry-run locally by executing the same command sequence.
  - Files: `.github/workflows/ci.yml`
  - Depends on: T18
  - Agent: orchestrator

- [x] **T20 — Testing approach document**
  - Acceptance: `docs/TESTING_APPROACH.md` defines functional scope covered vs. explicitly out of scope
    (perf/accessibility/security/real payment completion), per-pyramid-level rationale, the tagging
    strategy, and coverage goals/definition-of-done — matching what was actually built, not just planned.
  - Verify: manual read-through against the final `tests/` tree — no claim in the doc is false.
  - Files: `docs/TESTING_APPROACH.md`
  - Depends on: T18
  - Agent: test-case-planner

- [x] **T21 — README**
  - Acceptance: covers setup (clone → install → run), the Intent-Flow-Component pattern (short rationale +
    six rules), how to run each pyramid level + coverage report, how to add a new test, and links to
    `docs/TESTING_APPROACH.md`.
  - Verify: every command mentioned in the README is copy-pasted and actually run once.
  - Files: `README.md`
  - Depends on: T19, T20
  - Agent: orchestrator

- [x] **T22 — Final verification pass**
  - Acceptance: `npm run typecheck`, `npm run lint`, `npm test`, `npm run report:coverage` all pass clean in
    one sitting; every SPEC.md Success Criteria checkbox is genuinely true.
  - Verify: run the four commands above in sequence; walk the SPEC.md Success Criteria list item by item.
  - Files: none planned — fix whatever the verification surfaces
  - Depends on: T21
  - Agent: orchestrator

---

## Post-delivery code review round (human feedback, applied after initial build)

- **Test data**: added `ProductCatalog`/`catalog` fixture (`src/builders/product/product-catalog.builder.ts`)
  — real live-catalog product lookups (`catalog.byName('Blue Top')`) replacing hardcoded
  `{ name, price }` literals in every spec.
- **Navigation**: added `Header.open(page)` and page-owning `static open()` methods (`ProductDetails`) so no
  spec calls `page.goto('/some/path')` directly — either via the header's nav links or a component's own
  known URL.
- **Magic strings**: `addToCart`'s `'open-cart'`/`'keep-shopping'` became a named `CartFollowUp` const
  (`as const` object + derived type) in `src/flows/cart/cart.flow.ts`.
- **Folder reorg by area**: every layer with more than one file (`components/`, `flows/`, `builders/`,
  `api/`, `contracts/`, `types/`, and `tests/<level>/`) was regrouped into `navigation/product/cart/auth/
  checkout` subfolders; `shopping.flow.ts` was split into `cart/cart.flow.ts` (addToCart) and
  `checkout/checkout.flow.ts` (placeOrder) along the same lines. `core/` stayed flat (cross-cutting).
- **Real bug found during the review pass**: `OrderConfirmation.successMessage()` used `innerText()`, which
  reflects the heading's CSS `text-transform: uppercase` ("ORDER PLACED!") — sometimes matching the spec's
  `toContain('Order Placed')` assertion and sometimes not, depending on render timing. Fixed by switching to
  `textContent()` (the true, presentation-independent DOM text).

## Deviations found during implementation (not in the original plan)

- **T14 expanded mid-flight**: the "register → login → place order" E2E success criterion needed a
  checkout/payment journey the original component list (T9–T11) didn't cover. An extra investigation pass
  mapped the real `/checkout` → `/payment` → `/payment_done/<id>` flow, leading to 4 new components
  (`CartCheckoutBar`, `CheckoutPage`, `PaymentPage`, `OrderConfirmation`) and a widened `CartTable` root
  (`#cart_info_table` → `#cart_info`, since the same widget also renders on `/checkout`).
- **Real bug found and fixed**: `src/api/products.api.ts`/`account.api.ts` used leading-slash paths against
  an `API_BASE_URL` with no trailing slash — per URL resolution rules this silently dropped `/api` from
  every request. Fixed by making paths relative (no leading `/`) and giving `API_BASE_URL` a trailing slash
  everywhere it's defined.
- **Real environmental quirk found and fixed**: the live site's third-party ad-consent overlay
  (`fundingchoicesmessages.google.com`) blocks hover/click actions on fresh page loads. Fixed once, globally,
  in `src/core/fixtures.ts`'s `page` fixture — all specs import `test`/`expect` from there, never from
  `@playwright/test` directly (this convention is now documented in SPEC.md and `test-creator.md`).
- **Coverage gaps closed**: the original T15 scope (2 component specs) left `home`, `product-details`, and
  `login` at zero coverage even though components existed for them — 3 more specs added. A further gap
  (the `AccountArranger`/`setup` fixture existing but never actually exercised by any spec) was closed with
  one more spec (`login-form-valid.spec.ts`).
- **Type/agent-definition corrections**: `test-case-planner.md`'s declared tools originally excluded `Write`
  even though its own task cards (T1, T14) require producing files under `tasks/`/`docs/` — corrected.

**Deferred until after your review of the built solution (not part of this task list):**
- Public GitHub repo creation, MIT license, branch protection/permissions restricted to the owner
- Push + confirm GitHub Actions runs on a real PR
