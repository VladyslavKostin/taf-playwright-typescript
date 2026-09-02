# Plan: taf-playwright-typescript

Derived from `SPEC.md`. Covers build order, parallelization, risks, and verification checkpoints for the
Implement phase. Task-by-task acceptance/verify detail belongs in `tasks/todo.md` (Phase 3).

## Components & Build Order

```
0. .claude/agents/ definitions (orchestrator, planner, 3 creators)      [must exist first — everything
                                                                          after is delegated through them]
1. Scaffolding (package.json, tsconfig, eslint/prettier, .env.example,
   .gitignore, npm scripts, playwright.config.ts skeleton)
        │
        ▼
2. Core (config loader, shared types, page-registry.ts, fixture
   skeleton)
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
3. Contracts     4. Builders     5. API clients            } parallelizable —
   (Cart, etc.)     (User,          (ProductsApi,           each only depends
                     Product,        AccountApi)            on step 2
                     Address)
        │              │              │
        │              │              ▼
        │              │        (spike: confirm actual automationexercise
        │              │         API surface before finalizing client shape
        │              │         — see Risk 1)
        │              │
        ▼              │
6. Components (ProductCard, CartTable, Header, LoginForm,
   SignupForm, ProductDetails, CartModal)                    } components are
        │                                                     mutually independent,
        ▼                                                     parallelizable per widget
7. Flows (shopping.flow, auth.flow) — composes 6
        │
        ▼
8. Contract implementations (UiCart via 6/7, ApiCart via 5) + fixture
   wiring (test.extend, per-project fixtures)
        │
        ▼
9. Test-case planning pass (test-case-planner persona) — turns the
   Success Criteria's example specs into a concrete file+tag list
        │
        ▼
10. Test creation (test-creator persona)                     } component/api/e2e specs
    - component/*.spec.ts (2+)                                  are largely independent
    - api/*.spec.ts (2+, incl. network-interception)             once 6-9 exist —
    - e2e/*.spec.ts (2+)                                         parallelizable per file
        │
        ▼
11. Coverage tooling (scripts/coverage-report.ts) run against the
    now-tagged suite; fix any page left at zero coverage
        │
        ▼
12. CI workflow (.github/workflows/ci.yml) — runs npm test + uploads
    HTML report + (optionally) coverage report as artifacts
        │
        ▼
13. Docs (README.md, docs/TESTING_APPROACH.md) — written last so they
    describe what actually got built, not what was planned
        │
        ▼
14. Final verification pass (see Verification Checkpoints)
```

## Parallelization Notes

- Steps 3, 4, 5 depend only on step 2 and are independent of each other — buildable in parallel (e.g. three
  concurrent `component-creator`/general-purpose delegations aren't right here since these aren't components;
  they can simply be done back-to-back or via parallel tool calls without needing separate agent personas).
- Step 6 (components): each widget class is independent of the others — good candidate for parallel
  `component-creator` delegations, one per widget.
- Step 10 (tests): once prerequisites exist, individual spec files are independent — good candidate for
  parallel `test-creator` delegations, one per spec file or small group.
- Everything else (0→1→2, 7 after 6, 8 after 3/5/7, 9 after 8, 11 after 10, 12 after 11, 13 after 12) is
  strictly sequential.

## Risks & Mitigations

1. **automationexercise.com's public API surface may not match assumed shape.** The spec assumes a `Cart`
   contract with a UI-backed and an API-backed implementation, but the site's documented API is products/
   brands/search/account/login — there may be no true server-side cart endpoint.
   *Mitigation:* before building step 5 (API clients) and step 3 (Cart contract), do a short spike hitting
   `https://automationexercise.com/api` to confirm what's actually callable. If no cart endpoint exists,
   adjust `ApiCart`'s "fastest legal path" to mean *arrange the account/session via API, then drive the cart
   itself through the UI* — still demonstrates the same principle (API for what's cheap, UI for what's under
   test), just with cart operations UI-only. Update SPEC.md's Success Criteria wording if this shift happens.

2. **Public site flakiness** (third-party ads, layout drift, non-deterministic promo banners) can make
   component/e2e specs flaky in ways that have nothing to do with the framework's design.
   *Mitigation:* prefer resilient locators (already the pattern — scoped root locators, `.filter({hasText})`),
   keep retries in `playwright.config.ts` reasonable (e.g. 1 retry in CI), and document any known-flaky
   interaction points in `docs/TESTING_APPROACH.md` rather than papering over them with arbitrary waits.

3. **Custom `.claude/agents/*.md` definitions may not be hot-loaded as selectable `subagent_type` values
   within this already-running session** (agent discovery may only refresh on session start).
   *Mitigation:* write the five definition files first regardless (they're the durable deliverable for
   future sessions/contributors). For *this* session's actual delegation, use `general-purpose` agents primed
   with the corresponding `.claude/agents/<role>.md` file's content as their instructions, so the effect
   (scoped, single-responsibility delegation) is the same even if the named subagent_type isn't selectable
   yet. Confirm in a future session that the named types are then selectable directly.

4. **Network interception example needs the real request shape** `Add to Cart` triggers (URL, method,
   payload) before a meaningful mock/assert can be written.
   *Mitigation:* a short manual spike (a throwaway script or a first draft test that just logs
   `page.on('request', ...)`) during step 10 to discover the actual call, before finalizing the interception
   spec.

5. **Tag coverage drift** — a spec written without a `@page:*` tag silently breaks the coverage report's
   accuracy.
   *Mitigation:* `scripts/coverage-report.ts` explicitly warns (non-zero exit optional) on any spec missing a
   page tag, not just on pages with zero specs — turns a silent gap into a visible one.

## Verification Checkpoints

- After step 2: `npm run typecheck` passes with only scaffolding + core in place.
- After step 6/7: manual smoke run of one component + one flow against the live site (ad hoc script or
  `--headed` run) before formal specs are written on top of them — confirms selectors are real before
  multiplying them across spec files.
- After step 10: `npm test` green, `npm run lint` clean.
- After step 11: `npm run report:coverage` shows zero pages with no coverage; any warnings about untagged
  specs resolved.
- After step 12: workflow YAML reviewed for correctness (it can't truly execute until the repo exists on
  GitHub — that's the deferred step from SPEC.md).
- Final (step 14): fresh-eyes README walkthrough — every command in README/SPEC "Commands" section actually
  runs as documented.

## Open Item Carried Into Tasks Phase

Whether the `ApiCart` implementation stays API-backed for cart mutations or shifts to "API for account/
session, UI for cart" depends on Risk 1's spike result — this will be resolved as the first task in Phase 3,
before contracts/API-client tasks are finalized.
