import { Locator, Page } from '@playwright/test';

/**
 * The "Login to your account" form on https://automationexercise.com/login — verified by curling that URL
 * directly, and by POSTing bad credentials to `/login` to observe the real error markup. Real markup:
 *
 * ```html
 * <div class="login-form">
 *   <h2>Login to your account</h2>
 *   <form action="/login" method="POST">
 *     <input type="email" data-qa="login-email" name="email" required />
 *     <input type="password" data-qa="login-password" name="password" required />
 *     <p style="color: red;">Your email or password is incorrect!</p>  <!-- only present after a failed submit -->
 *     <button type="submit" data-qa="login-button" class="btn btn-default">Login</button>
 *   </form>
 * </div>
 * ```
 *
 * Scoped to the `<form>` that contains the `login-email` input (rather than `.login-form`) because the
 * account-info page rendered mid-registration (see signup-form.component.ts) reuses the same `.login-form`
 * class for a completely different form — this selector stays unambiguous even if both were ever present.
 */
export class LoginForm {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): LoginForm {
    return new LoginForm(
      scope.locator('form').filter({ has: scope.locator('input[data-qa="login-email"]') }),
    );
  }

  async login(email: string, password: string): Promise<void> {
    await this.root.locator('input[data-qa="login-email"]').fill(email);
    await this.root.locator('input[data-qa="login-password"]').fill(password);
    await this.root.locator('button[data-qa="login-button"]').click();
  }

  /** The red inline error text shown after an invalid login attempt, or `null` if none is present. */
  async loginErrorText(): Promise<string | null> {
    const error = this.root.locator('p');
    if ((await error.count()) === 0) return null;
    return (await error.first().textContent())?.trim() ?? null;
  }
}
