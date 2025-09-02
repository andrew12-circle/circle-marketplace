import { useEffect, useRef } from 'react';
import { logServiceEvent } from '@/lib/events';

export function useLogPageViewOnce(event_type: string, page: string) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // fire and forget
    void logServiceEvent({ event_type, page });
  }, [event_type, page]);
}