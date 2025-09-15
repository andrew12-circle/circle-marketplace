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

  // Debug logging when state changes
  useEffect(() => {
    console.log('🔧 EditMode: State changed', { isEditMode, isAdmin });
  }, [isEditMode, isAdmin]);

  useEffect(() => {
    const qp = new URL(window.location.href).searchParams.get('edit');
    const newEditMode = !!isAdmin && qp === '1';
    console.log('🔧 EditMode: URL parameter check', { isAdmin, editParam: qp, newEditMode });
    if (newEditMode !== isEditMode) {
      setIsEditMode(newEditMode);
    }
  }, [isAdmin, isEditMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e' && isAdmin) {
        e.preventDefault();
        setIsEditMode(v => {
          const newValue = !v;
          console.log('🔧 EditMode: Ctrl+E toggle', { oldValue: v, newValue });
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
    console.log('🔧 EditMode: setEditMode called', { enabled, isAdmin, currentEditMode: isEditMode });
    if (!isAdmin) {
      console.log('🔧 EditMode: Blocked - not admin', { isAdmin });
      return;
    }
    
    console.log('🔧 EditMode: About to call setIsEditMode', { enabled });
    
    // Force React state update with callback
    setIsEditMode(prev => {
      console.log('🔧 EditMode: setIsEditMode callback', { prev, enabled, willChange: prev !== enabled });
      return enabled;
    });
    
    // Update URL
    const url = new URL(window.location.href);
    if (enabled) {
      url.searchParams.set('edit', '1');
    } else {
      url.searchParams.delete('edit');
    }
    window.history.replaceState({}, '', url.toString());
    console.log('🔧 EditMode: URL updated', { url: url.toString(), newEditMode: enabled });
  };

  const value = useMemo(() => ({ 
    isEditMode, 
    setEditMode, 
    isAdmin: !!isAdmin 
  }), [isEditMode, isAdmin]);

  return (
    <EditModeContext.Provider value={value}>
      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium z-50 shadow-lg">
          🔧 Edit Mode Active - Click pencil icons to edit content | Press Ctrl+E to toggle
        </div>
      )}
      <div className={isEditMode ? "pt-10" : ""}>
        {children}
      </div>
    </EditModeContext.Provider>
  );
}