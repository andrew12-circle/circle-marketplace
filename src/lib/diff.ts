export function diffPatch<T extends Record<string, any>>(prev: T, next: T): Partial<T> {
  const patch: Partial<T> = {};
  
  for (const k in next) {
    if (Object.is(prev[k], next[k])) continue;
    patch[k] = next[k];
  }
  
  return patch;
}