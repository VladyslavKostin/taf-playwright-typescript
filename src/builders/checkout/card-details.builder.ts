import { faker } from '@faker-js/faker';
import type { CardDetails } from '../../types/checkout/payment';

export class CardDetailsBuilder {
  private card: CardDetails = {
    nameOnCard: faker.person.fullName(),
    cardNumber: faker.finance.creditCardNumber('4###-####-####-####'),
    cvc: faker.finance.creditCardCVV(),
    expiryMonth: String(faker.number.int({ min: 1, max: 12 })),
    expiryYear: String(faker.date.future({ years: 4 }).getFullYear()),
  };

  withNameOnCard(name: string): this {
    this.card.nameOnCard = name;
    return this;
  }

  build(): CardDetails {
    return { ...this.card };
  }
}
