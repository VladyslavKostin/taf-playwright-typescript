import { test, expect } from '../../../src/core/fixtures';
import { LoginForm } from '../../../src/components/auth/login-form.component';
import { Header } from '../../../src/components/navigation/header.component';
import { UserBuilder } from '../../../src/builders/auth/user.builder';

// Arrangement (account existence) goes through the fastest legal path — the API-backed `setup` fixture
// (see src/core/fixtures.ts, src/contracts/api-account-arranger.ts) — while login itself, the thing
// actually under test, always goes through LoginForm in the UI: automationexercise.com's API can verify
// credentials but issues no session token/cookie, so a browser session can only ever be created by really
// submitting the form (see tasks/api-spike-findings.md).
//
// Header (src/components/header.component.ts) intentionally exposes no logged-in-state read — its
// docstring notes the "Logged in as <user>" markup couldn't be verified independently, so it wasn't
// guessed at. The most defensible observable signal available from existing components is therefore
// twofold: (1) the app redirects away from /login on a successful submit (it only ever re-renders /login
// with an inline error on failure — see login-form.spec.ts), and (2) LoginForm's own error slot, which is
// only ever populated after a failed attempt, stays empty. Confirmed live that an invalid login leaves the
// URL on /login with a non-null error text, so this pair of signals does distinguish success from failure.
test('a registered user can log in with valid credentials', { tag: ['@page:login', '@smoke'] }, async ({
  page,
  setup,
}) => {
  const user = new UserBuilder().build();
  await setup.accounts.createAccount(user);

  await Header.open(page);
  await Header.in(page).goToSignupLogin();
  await LoginForm.in(page).login(user.email, user.password);

  await expect(page).not.toHaveURL(/\/login$/);
  expect(await LoginForm.in(page).loginErrorText()).toBeNull();
});
