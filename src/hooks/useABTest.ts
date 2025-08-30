// @ts-nocheck
import { useEffect, useState } from 'react';

export type ABVariant = 'ranked' | 'holdout';

interface Options {
  holdout?: number; // default 0.1 (10%)
}

export function useABTest(testName: string, options: Options = {}) {
  const { holdout = 0.1 } = options;
  const storageKey = `ab_${testName}`;
  const [variant, setVariant] = useState<ABVariant>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const forced = params.get('ab');
      if (forced === 'ranked' || forced === 'holdout') {
        localStorage.setItem(storageKey, forced);
        return forced;
      }
      const existing = localStorage.getItem(storageKey) as ABVariant | null;
      if (existing === 'ranked' || existing === 'holdout') return existing;
      const assigned: ABVariant = Math.random() < holdout ? 'holdout' : 'ranked';
      localStorage.setItem(storageKey, assigned);
      return assigned;
    } catch {
      return 'ranked';
    }
  });

  useEffect(() => {
    // Keep storage in sync if variant changes externally
    try {
      localStorage.setItem(storageKey, variant);
    } catch { }
  }, [storageKey, variant]);

  return { variant };
}
