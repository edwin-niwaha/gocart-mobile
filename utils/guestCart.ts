import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TENANT_SLUG } from '@/api/client';
import type { Cart, CartItem, Product, ProductVariant } from '@/types';
import {
  getPrimaryImage,
  getVariantUnitPrice,
  normalizeQuantity,
} from '@/utils/product';

const GUEST_CART_STORAGE_PREFIX = 'gocart_guest_cart';

type GuestProduct = Product & {
  image?: string | null;
  image_url?: string | null;
};

type GuestVariant = ProductVariant & {
  product?: GuestProduct;
};

type StoredGuestCartItem = {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  product: GuestProduct;
  variant: GuestVariant;
  created_at: string;
  updated_at: string;
};

export type GuestCartSyncItem = {
  id: number;
  quantity: number;
  variant_id: number;
};

export type GuestCartAddPayload = {
  product: Product;
  quantity: number;
  variant: ProductVariant;
};

function getStorageKey() {
  return `${GUEST_CART_STORAGE_PREFIX}:${DEFAULT_TENANT_SLUG || 'default'}`;
}

function matchesGuestCartItemId(item: StoredGuestCartItem, id: number) {
  return item.id === id || item.variant_id === Math.abs(id);
}

function createProductSnapshot(product: Product): GuestProduct {
  const image = getPrimaryImage(product);

  return {
    ...product,
    image: image ?? null,
    image_url: image ?? null,
    image_urls:
      product.image_urls?.filter((value) => typeof value === 'string' && value.trim()) ??
      (image ? [image] : []),
  };
}

function createVariantSnapshot(product: GuestProduct, variant: ProductVariant): GuestVariant {
  return {
    ...variant,
    product,
  };
}

async function readStoredItems(): Promise<StoredGuestCartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey());
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const record = item as Partial<StoredGuestCartItem>;
        if (
          typeof record.id !== 'number' ||
          typeof record.variant_id !== 'number' ||
          typeof record.quantity !== 'number' ||
          typeof record.unit_price !== 'number' ||
          !record.product ||
          !record.variant
        ) {
          return null;
        }

        return {
          id: record.id,
          variant_id: record.variant_id,
          quantity: normalizeQuantity(record.quantity),
          unit_price: Number.isFinite(record.unit_price) ? record.unit_price : 0,
          product: record.product as GuestProduct,
          variant: record.variant as GuestVariant,
          created_at:
            typeof record.created_at === 'string'
              ? record.created_at
              : new Date().toISOString(),
          updated_at:
            typeof record.updated_at === 'string'
              ? record.updated_at
              : new Date().toISOString(),
        } satisfies StoredGuestCartItem;
      })
      .filter((item): item is StoredGuestCartItem => Boolean(item));
  } catch {
    return [];
  }
}

async function writeStoredItems(items: StoredGuestCartItem[]) {
  try {
    if (!items.length) {
      await AsyncStorage.removeItem(getStorageKey());
      return;
    }

    await AsyncStorage.setItem(getStorageKey(), JSON.stringify(items));
  } catch {
    // Storage failures should not block browsing.
  }
}

function toCartItem(item: StoredGuestCartItem): CartItem {
  return {
    id: item.id,
    product: item.product,
    quantity: item.quantity,
    unit_price: String(item.unit_price),
    line_total: String(item.unit_price * item.quantity),
    variant: item.variant,
  };
}

export function isGuestCartItemId(id: number) {
  return id < 0;
}

export async function listGuestCartItems() {
  const items = await readStoredItems();
  return items.map(toCartItem);
}

export async function addGuestCartItem(payload: GuestCartAddPayload) {
  const items = await readStoredItems();
  const quantity = normalizeQuantity(payload.quantity);
  const product = createProductSnapshot(payload.product);
  const variant = createVariantSnapshot(product, payload.variant);
  const unitPrice = getVariantUnitPrice(payload.product, payload.variant);
  const now = new Date().toISOString();

  const existingItem = items.find((item) => item.variant_id === payload.variant.id);

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.unit_price = unitPrice;
    existingItem.product = product;
    existingItem.variant = variant;
    existingItem.updated_at = now;
    await writeStoredItems(items);
    return toCartItem(existingItem);
  }

  const nextItem: StoredGuestCartItem = {
    id: -Math.abs(payload.variant.id),
    variant_id: payload.variant.id,
    quantity,
    unit_price: unitPrice,
    product,
    variant,
    created_at: now,
    updated_at: now,
  };

  items.push(nextItem);
  await writeStoredItems(items);
  return toCartItem(nextItem);
}

export async function updateGuestCartItem(id: number, quantity: number) {
  const items = await readStoredItems();
  const item = items.find((entry) => matchesGuestCartItemId(entry, id));

  if (!item) {
    throw new Error('Cart item could not be found.');
  }

  item.quantity = normalizeQuantity(quantity);
  item.updated_at = new Date().toISOString();

  await writeStoredItems(items);
  return toCartItem(item);
}

export async function removeGuestCartItem(id: number) {
  const items = await readStoredItems();
  await writeStoredItems(items.filter((item) => !matchesGuestCartItemId(item, id)));
}

export async function clearGuestCart() {
  await writeStoredItems([]);
}

export async function retainGuestCartItems(ids: number[]) {
  const idSet = new Set(ids);
  const items = await readStoredItems();
  await writeStoredItems(items.filter((item) => idSet.has(item.id)));
}

export async function listGuestCartSyncItems(): Promise<GuestCartSyncItem[]> {
  const items = await readStoredItems();
  return items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant_id: item.variant_id,
  }));
}

export async function buildGuestCart(): Promise<Cart> {
  const items = await listGuestCartItems();
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + Number(item.line_total ?? 0), 0);

  return {
    id: 0,
    items,
    total_items: totalItems,
    total_price: String(totalPrice),
  };
}
