import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface EditModeContextType {
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  isAdmin: boolean;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  setEditMode: () => {},
  isAdmin: false,
});

export const useEditMode = () => useContext(EditModeContext);

interface EditModeProviderProps {
  children: ReactNode;
}

export function EditModeProvider({ children }: EditModeProviderProps) {
  const { data: isAdmin = false } = useAdminStatus();
  const [isEditMode, setIsEditMode] = useState(false);

  // Check URL for edit mode on mount
  useEffect(() => {
    if (!isAdmin) return;
    
    const url = new URL(window.location.href);
    if (url.searchParams.get('edit') === '1') {
      setIsEditMode(true);
    }
  }, [isAdmin]);

  // Keyboard shortcut: Ctrl+E to toggle edit mode
  useEffect(() => {
    if (!isAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        console.log('Ctrl+E pressed, current edit mode:', isEditMode);
        setIsEditMode(prev => !prev);
        
        // Update URL
        const url = new URL(window.location.href);
        if (!isEditMode) {
          url.searchParams.set('edit', '1');
        } else {
          url.searchParams.delete('edit');
        }
        window.history.replaceState({}, '', url.toString());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, isEditMode]);

  const handleSetEditMode = (enabled: boolean) => {
    if (!isAdmin) return;
    
    console.log('Setting edit mode:', enabled, 'isAdmin:', isAdmin);
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

  return (
    <EditModeContext.Provider value={{ isEditMode, setEditMode: handleSetEditMode, isAdmin }}>
      {children}
    </EditModeContext.Provider>
  );
}