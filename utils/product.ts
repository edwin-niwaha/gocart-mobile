import type { CartItem, Product, ProductVariant } from '@/types';

export function normalizeQuantity(value: number) {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getActiveVariants(product: Product): ProductVariant[] {
  return product.variants?.filter((variant) => variant.is_active) ?? [];
}

export function getPrimaryVariant(product: Product) {
  const activeVariants = getActiveVariants(product);
  return (
    activeVariants.find((variant) => variant.is_in_stock) ??
    activeVariants[0] ??
    null
  );
}

export function getPrimaryImage(product: Product) {
  return product.hero_image ?? product.image_urls?.[0] ?? null;
}

export function getVariantUnitPrice(product: Product, variant: ProductVariant) {
  const price = Number(variant.price ?? product.base_price ?? 0);
  return Number.isFinite(price) ? price : 0;
}

export function getCartItemTotal(item: CartItem) {
  const unitPrice = Number(item.unit_price ?? item.variant?.price ?? 0);
  const lineTotal = Number(item.line_total ?? unitPrice * item.quantity);
  return Number.isFinite(lineTotal) ? lineTotal : 0;
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + getCartItemTotal(item), 0);
}
