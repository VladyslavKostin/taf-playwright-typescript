import { faker } from '@faker-js/faker';
import type { Address } from '../../types/auth/user';

export class AddressBuilder {
  private address: Address = {
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    country: 'United States',
    state: faker.location.state(),
    city: faker.location.city(),
    zipcode: faker.location.zipCode('#####'),
  };

  withAddress1(address1: string): this {
    this.address.address1 = address1;
    return this;
  }

  withCountry(country: string): this {
    this.address.country = country;
    return this;
  }

  withCity(city: string): this {
    this.address.city = city;
    return this;
  }

  build(): Address {
    return { ...this.address };
  }
}
