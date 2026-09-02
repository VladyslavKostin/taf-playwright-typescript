import { Locator, Page } from '@playwright/test';
import { User } from '../../types/auth/user';

/**
 * Registration spans two widgets on two different pages, verified end to end with a real curl-driven
 * signup (mini-form submit -> account-info form fill -> account_created page):
 *
 * 1. `SignupForm` — the "New User Signup!" mini-form on https://automationexercise.com/login:
 *    ```html
 *    <div class="signup-form">
 *      <h2>New User Signup!</h2>
 *      <form action="/signup" method="POST">
 *        <input type="text" data-qa="signup-name" name="name" required />
 *        <input type="email" data-qa="signup-email" name="email" required />
 *        <p style="color: red;">Email Address already exist!</p>  <!-- only present after a failed submit -->
 *        <button type="submit" data-qa="signup-button" class="btn btn-default">Signup</button>
 *      </form>
 *    </div>
 *    ```
 *    Submitting valid, unused values navigates to `/signup` again, which now renders the full
 *    "Enter Account Information" form (still POSTing to `/signup`, still wrapped in a `.login-form` div —
 *    a same-URL, same-wrapper-class re-render of a *different* widget, not the same one).
 *
 * 2. `AccountInfoForm` — that "Enter Account Information" + "Address Information" form, whose fields were
 *    read directly off the rendered HTML (title radios, name/password/DOB, then first/last name, company,
 *    address1/2, country/state/city/zipcode, mobile number), and whose submit (`data-qa="create-account"`)
 *    was verified to redirect to `/account_created`:
 *    ```html
 *    <h2 data-qa="account-created" style="color: green;">Account Created!</h2>
 *    <a href="/" data-qa="continue-button" class="btn btn-primary">Continue</a>
 *    ```
 *
 * These are kept as two separate classes (one root `Locator` each) rather than one, because they are
 * genuinely different widgets on different pages — a single shared root can't span a navigation. Both live
 * in this file because together they form the one registration flow a `registerNewUser` flow would drive.
 * `AccountInfoForm`'s `completeRegistration`/`accountCreatedText` re-derive locators from `this.root.page()`
 * once the create-account submit has navigated away from the form the root was scoped to; see the private
 * `page()` helper below.
 */
export class SignupForm {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): SignupForm {
    return new SignupForm(
      scope.locator('form').filter({ has: scope.locator('input[data-qa="signup-email"]') }),
    );
  }

  async startSignup(name: string, email: string): Promise<void> {
    await this.root.locator('input[data-qa="signup-name"]').fill(name);
    await this.root.locator('input[data-qa="signup-email"]').fill(email);
    await this.root.locator('button[data-qa="signup-button"]').click();
  }

  /** The red inline error text shown after a failed signup attempt (e.g. a taken email), or `null`. */
  async signupErrorText(): Promise<string | null> {
    const error = this.root.locator('p');
    if ((await error.count()) === 0) return null;
    return (await error.first().textContent())?.trim() ?? null;
  }
}

export class AccountInfoForm {
  private constructor(private readonly root: Locator) {}

  static in(scope: Page | Locator): AccountInfoForm {
    return new AccountInfoForm(
      scope.locator('form').filter({ has: scope.locator('input[data-qa="password"]') }),
    );
  }

  /** Fills every field the site marks required (plus company) and submits. Name/email arrive pre-filled
   *  from the `SignupForm` step, but name is set again here so this method is usable on its own. */
  async completeRegistration(user: User): Promise<void> {
    await this.root.locator(`input[name="title"][value="${user.title}"]`).check();
    await this.root.locator('input[data-qa="name"]').fill(user.name);
    await this.root.locator('input[data-qa="password"]').fill(user.password);
    await this.root.locator('select[data-qa="days"]').selectOption(String(Number(user.birthDate.day)));
    // birthDate.month is a name ("January"), not a select `value` — match the option's visible text instead.
    await this.root.locator('select[data-qa="months"]').selectOption({ label: user.birthDate.month });
    await this.root.locator('select[data-qa="years"]').selectOption(user.birthDate.year);
    await this.root.locator('input[data-qa="first_name"]').fill(user.firstName);
    await this.root.locator('input[data-qa="last_name"]').fill(user.lastName);
    await this.root.locator('input[data-qa="company"]').fill(user.company);
    await this.root.locator('input[data-qa="address"]').fill(user.address.address1);
    await this.root.locator('input[data-qa="address2"]').fill(user.address.address2);
    await this.root.locator('select[data-qa="country"]').selectOption(user.address.country);
    await this.root.locator('input[data-qa="state"]').fill(user.address.state);
    await this.root.locator('input[data-qa="city"]').fill(user.address.city);
    await this.root.locator('input[data-qa="zipcode"]').fill(user.address.zipcode);
    await this.root.locator('input[data-qa="mobile_number"]').fill(user.mobileNumber);
    await this.root.locator('button[data-qa="create-account"]').click();
  }

  /** The green "Account Created!" heading on the post-submit `/account_created` page, or `null` if the
   *  submit didn't get there (e.g. validation kept the form on `/signup`). */
  async accountCreatedText(): Promise<string | null> {
    const heading = this.page().locator('[data-qa="account-created"]');
    if ((await heading.count()) === 0) return null;
    return (await heading.textContent())?.trim() ?? null;
  }

  /** Clicks the "Continue" link on the `/account_created` page. */
  async continue(): Promise<void> {
    await this.page().locator('[data-qa="continue-button"]').click();
  }

  /** `create-account` navigates away from the form `root` was scoped to, so post-submit reads/actions
   *  re-query from the underlying page instead of the now-stale `root`. */
  private page(): Page {
    return this.root.page();
  }
}
