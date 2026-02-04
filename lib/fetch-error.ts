export function isIgnorableFetchError(error: unknown): boolean {
  if (!error) return false;

  const maybeError = error as { name?: string; message?: string };
  const name = maybeError?.name;
  const message = typeof maybeError?.message === 'string' ? maybeError.message : '';

  if (name === 'AbortError') {
    return true;
  }

  if (name === 'TypeError' && message === 'Failed to fetch') {
    return true;
  }

  if (message.includes('Failed to fetch')) {
    return true;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  return false;
}
