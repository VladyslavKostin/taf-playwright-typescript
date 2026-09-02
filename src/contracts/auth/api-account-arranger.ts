import type { APIRequestContext } from '@playwright/test';
import type { AccountArranger } from './account-arranger.contract';
import type { User } from '../../types/auth/user';
import { AccountApi } from '../../api/auth/account.api';

export class ApiAccountArranger implements AccountArranger {
  private readonly accountApi: AccountApi;

  constructor(request: APIRequestContext) {
    this.accountApi = new AccountApi(request);
  }

  async createAccount(user: User): Promise<void> {
    await this.accountApi.createAccount(user);
  }
}
