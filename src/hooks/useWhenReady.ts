import { useEffect } from 'react';
import { useAuthBoot } from '@/lib/auth-bootstrap';

export function useWhenReady(fn: () => void, deps: any[] = []) {
  const { status } = useAuthBoot();
  useEffect(() => {
    if (status === 'ready') fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ...deps]);
}