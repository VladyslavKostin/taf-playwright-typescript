export const PAGE_REGISTRY = [
  'home',
  'products',
  'product-details',
  'cart',
  'login',
  'signup',
  'checkout',
] as const;

export type PageId = (typeof PAGE_REGISTRY)[number];

export function pageTag(id: PageId): `@page:${PageId}` {
  return `@page:${id}`;
}
