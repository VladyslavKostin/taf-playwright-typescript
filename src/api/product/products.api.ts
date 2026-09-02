import type { APIRequestContext } from '@playwright/test';
import type { Product } from '../../types/product/product';

type RawProduct = {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: { category: string };
};

function parsePrice(raw: string): number {
  return Number(raw.replace(/\D/g, ''));
}

function toProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    price: parsePrice(raw.price),
    brand: raw.brand,
    category: raw.category.category,
  };
}

export class ProductsApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<Product[]> {
    const res = await this.request.get('productsList');
    const body = (await res.json()) as { responseCode: number; products: RawProduct[] };
    return body.products.map(toProduct);
  }

  async search(query: string): Promise<Product[]> {
    const res = await this.request.post('searchProduct', { form: { search_product: query } });
    const body = (await res.json()) as { responseCode: number; products: RawProduct[] };
    return body.products.map(toProduct);
  }
}
