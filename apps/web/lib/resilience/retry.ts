/**
 * L4 – Retry with exponential backoff.
 * Does NOT retry if the error is a 4xx (client error — retrying won't help).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseMs = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Don't retry on explicit 4xx responses from upstream APIs
      const status = err?.response?.status ?? err?.status;
      if (status && status >= 400 && status < 500) throw err;
      if (attempt < maxAttempts) {
        await sleep(baseMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
