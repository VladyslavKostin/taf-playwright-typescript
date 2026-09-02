import { faker } from '@faker-js/faker';
import type { User } from '../../types/auth/user';
import { AddressBuilder } from './address.builder';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function randomBirthDate(): User['birthDate'] {
  const date = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });
  return {
    day: String(date.getDate()),
    month: MONTH_NAMES[date.getMonth()] ?? 'January',
    year: String(date.getFullYear()),
  };
}

export class UserBuilder {
  private user: User;

  constructor() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    this.user = {
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: faker.internet.password({ length: 12 }),
      title: faker.helpers.arrayElement(['Mr', 'Mrs']),
      birthDate: randomBirthDate(),
      firstName,
      lastName,
      company: faker.company.name(),
      address: new AddressBuilder().build(),
      mobileNumber: faker.phone.number(),
    };
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withPassword(password: string): this {
    this.user.password = password;
    return this;
  }

  withName(firstName: string, lastName: string): this {
    this.user.firstName = firstName;
    this.user.lastName = lastName;
    this.user.name = `${firstName} ${lastName}`;
    return this;
  }

  withAddress(address: User['address']): this {
    this.user.address = address;
    return this;
  }

  build(): User {
    return { ...this.user, birthDate: { ...this.user.birthDate }, address: { ...this.user.address } };
  }
}
