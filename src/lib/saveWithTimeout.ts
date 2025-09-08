type Fn<T> = () => Promise<T>;

export async function saveWithTimeout<T>(
  fn: Fn<T>,
  { timeoutMs = 8000, retries = 1 }: { timeoutMs?: number; retries?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      // NOTE: pass controller.signal to fetch calls inside fn if needed
      const out = await fn();
      clearTimeout(timer);
      return out;
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      await new Promise(r => setTimeout(r, 300 + attempt * 300));
    }
  }
  throw lastErr;
}