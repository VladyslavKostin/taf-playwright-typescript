import type { APIRequestContext } from '@playwright/test';
import type { User } from '../../types/auth/user';

export class AccountApi {
  constructor(private readonly request: APIRequestContext) {}

  async createAccount(user: User): Promise<void> {
    const res = await this.request.post('createAccount', {
      form: {
        name: user.name,
        email: user.email,
        password: user.password,
        title: user.title,
        birth_date: user.birthDate.day,
        birth_month: user.birthDate.month,
        birth_year: user.birthDate.year,
        firstname: user.firstName,
        lastname: user.lastName,
        company: user.company,
        address1: user.address.address1,
        address2: user.address.address2,
        country: user.address.country,
        zipcode: user.address.zipcode,
        state: user.address.state,
        city: user.address.city,
        mobile_number: user.mobileNumber,
      },
    });
    const body = (await res.json()) as { responseCode: number; message: string };
    if (body.responseCode !== 201) {
      throw new Error(`createAccount failed (${body.responseCode}): ${body.message}`);
    }
  }

  async verifyLogin(email: string, password: string): Promise<boolean> {
    const res = await this.request.post('verifyLogin', { form: { email, password } });
    const body = (await res.json()) as { responseCode: number };
    return body.responseCode === 200;
  }
}
