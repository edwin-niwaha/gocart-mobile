const isDevRuntime = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export function logError(message: string, details?: unknown) {
  if (!isDevRuntime) return;

  if (details !== undefined) {
    console.warn(`[GoCart] ${message}`, details);
    return;
  }

  console.warn(`[GoCart] ${message}`);
}

export function logInfo(message: string, details?: unknown) {
  if (!isDevRuntime) return;

  if (details !== undefined) {
    console.warn(`[GoCart] ${message}`, details);
    return;
  }

  console.warn(`[GoCart] ${message}`);
}
