export function money(value: string | number | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function normalizeList<T>(data: T[] | { results?: T[] } | undefined | null): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export function orderSlug() {
  return `order-${Date.now()}`;
}

export function fullName(first?: string, last?: string, username?: string) {
  const name = `${first ?? ''} ${last ?? ''}`.trim();
  return name || username || 'Customer';
}
