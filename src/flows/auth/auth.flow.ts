import { Page } from '@playwright/test';
import { Header } from '../../components/navigation/header.component';
import { LoginForm } from '../../components/auth/login-form.component';
import { AccountInfoForm, SignupForm } from '../../components/auth/signup-form.component';
import { User } from '../../types/auth/user';

/**
 * Registers a brand-new account end to end: navigates to the login/signup page, submits the
 * name+email mini-form, fills out the full account-information form, and follows the resulting
 * "Account Created!" page's Continue link back to a logged-in state. Whether the account was actually
 * created is for the calling spec to assert (e.g. via `AccountInfoForm.accountCreatedText()`).
 */
export async function registerNewUser(page: Page, user: User): Promise<void> {
  await Header.in(page).goToSignupLogin();
  await SignupForm.in(page).startSignup(user.name, user.email);
  const accountInfoForm = AccountInfoForm.in(page);
  await accountInfoForm.completeRegistration(user);
  await accountInfoForm.continue();
}

/** Navigates to the login/signup page and submits the login form with the given credentials. */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await Header.in(page).goToSignupLogin();
  await LoginForm.in(page).login(email, password);
}
