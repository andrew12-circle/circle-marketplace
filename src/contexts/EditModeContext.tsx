import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAdminStatus } from '@/hooks/useAdminStatus';

const EditModeContext = createContext<{
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  isAdmin: boolean;
}>({
  isEditMode: false,
  setEditMode: () => {},
  isAdmin: false,
});

export const useEditMode = () => useContext(EditModeContext);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const { data: isAdmin } = useAdminStatus();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const qp = new URL(window.location.href).searchParams.get('edit');
    setIsEditMode(!!isAdmin && qp === '1');
  }, [isAdmin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e' && isAdmin) {
        e.preventDefault();
        setIsEditMode(v => {
          const newValue = !v;
          // Update URL
          const url = new URL(window.location.href);
          if (newValue) {
            url.searchParams.set('edit', '1');
          } else {
            url.searchParams.delete('edit');
          }
          window.history.replaceState({}, '', url.toString());
          return newValue;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAdmin]);

  const setEditMode = (enabled: boolean) => {
    if (!isAdmin) return;
    setIsEditMode(enabled);
    // Update URL
    const url = new URL(window.location.href);
    if (enabled) {
      url.searchParams.set('edit', '1');
    } else {
      url.searchParams.delete('edit');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const value = useMemo(() => ({ 
    isEditMode, 
    setEditMode, 
    isAdmin: !!isAdmin 
  }), [isEditMode, isAdmin]);

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}