export function createIdempotencyKey(scope: string) {
  const safeScope = scope.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);

  return `gocart-${safeScope || 'request'}-${timePart}-${randomPart}`;
}
