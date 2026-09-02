import { test, expect } from '../../../src/core/fixtures';
import { LoginForm } from '../../../src/components/auth/login-form.component';
import { Header } from '../../../src/components/navigation/header.component';

// An invalid login attempt is the single action under test (mirrors network-interception.spec.ts, where
// the component action being exercised is the subject of the assertion rather than a step toward
// something else), so calling LoginForm.in(page).login(...) directly here — with no flow wrapping it — is
// consistent with the framework's "specs act through flows for procedures" rule.
test(
  'an invalid login attempt shows the real inline error message',
  { tag: ['@page:login', '@regression'] },
  async ({ page }) => {
    await Header.open(page);
    await Header.in(page).goToSignupLogin();

    await LoginForm.in(page).login('not-a-real-user@example.com', 'wrong-password');

    const errorText = await LoginForm.in(page).loginErrorText();
    expect(errorText).toBe('Your email or password is incorrect!');
  },
);
