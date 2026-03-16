/**
 * Retries an async function up to maxAttempts times with linear backoff.
 * Only retries on network errors, HTTP 429 (rate limit), or HTTP 5xx (server errors).
 * Does NOT retry on HTTP 4xx client errors (except 429).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status ?? error?.status;
      const isRetryable = !status || status === 429 || status >= 500;

      if (!isRetryable || attempt === maxAttempts) throw error;

      console.warn(`[retry] attempt ${attempt}/${maxAttempts} failed (status=${status ?? 'network'}), retrying in ${backoffMs * attempt}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
    }
  }

  throw lastError;
}
