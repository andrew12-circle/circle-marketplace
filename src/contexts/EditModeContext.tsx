'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Ctx = { isEdit: boolean; setEdit: (v: boolean) => void };
const EditCtx = createContext<Ctx>({ isEdit: false, setEdit: () => {} });
export const useEditMode = () => useContext(EditCtx);

export function EditModeProvider({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const [isEdit, setEdit] = useState(false);

  // read from URL once admin is known
  useEffect(() => {
    if (!isAdmin) { setEdit(false); return; }
    const params = new URL(window.location.href).searchParams;
    setEdit(params.get('edit') === '1');
  }, [isAdmin]);

  // ctrl+e toggle
  useEffect(() => {
    if (!isAdmin) return;
    const onKey = (e: KeyboardEvent) => { 
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setEdit(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAdmin]);

  // keep URL in sync without reloads
  useEffect(() => {
    const url = new URL(window.location.href);
    if (isEdit) url.searchParams.set('edit', '1'); else url.searchParams.delete('edit');
    window.history.replaceState(null, '', url.toString());
  }, [isEdit]);

  const value = useMemo(() => ({ isEdit, setEdit }), [isEdit]);
  return <EditCtx.Provider value={value}>{children}</EditCtx.Provider>;
}