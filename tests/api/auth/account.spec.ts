import { test, expect } from '../../../src/core/fixtures';
import { AccountApi } from '../../../src/api/auth/account.api';
import { UserBuilder } from '../../../src/builders/auth/user.builder';

test.describe('Account API', () => {
  test(
    'createAccount followed by verifyLogin succeeds with correct credentials and fails with a wrong password',
    { tag: ['@page:signup', '@regression'] },
    async ({ request }) => {
      const accountApi = new AccountApi(request);
      const user = new UserBuilder().build();

      await accountApi.createAccount(user);

      const correctLogin = await accountApi.verifyLogin(user.email, user.password);
      expect(correctLogin).toBe(true);

      const wrongPasswordLogin = await accountApi.verifyLogin(user.email, 'not-the-real-password');
      expect(wrongPasswordLogin).toBe(false);
    },
  );
});
