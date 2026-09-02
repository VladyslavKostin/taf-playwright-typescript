import { faker } from '@faker-js/faker';
import type { Product } from '../../types/product/product';

export class ProductBuilder {
  private product: Product = {
    id: faker.number.int({ min: 1, max: 50 }),
    name: faker.commerce.productName(),
    price: faker.number.int({ min: 100, max: 2000 }),
    brand: faker.company.name(),
    category: faker.commerce.department(),
  };

  withName(name: string): this {
    this.product.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.product.price = price;
    return this;
  }

  build(): Product {
    return { ...this.product };
  }
}
