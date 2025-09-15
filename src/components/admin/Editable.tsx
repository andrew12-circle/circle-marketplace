import React, { useState } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

async function patchServiceField(id: string, field: string, value: any) {
  const { error } = await supabase.from('services').update({ [field]: value }).eq('id', id);
  if (error) throw error;
  const { data, error: fetchError } = await supabase.from('services').select('*').eq('id', id).single();
  if (fetchError) throw fetchError;
  return data;
}

export function Editable({
  entity = 'services', 
  id, 
  field, 
  value: initial, 
  children, 
  type = 'text', 
  options = [],
  onApply
}: {
  entity?: 'services' | string; 
  id: string; 
  field: string; 
  value?: any; 
  type?: 'text' | 'textarea' | 'price' | 'select';
  options?: { value: string; label: string; }[];
  children: React.ReactNode; 
  onApply?: (row: any) => void;
}) {
  const { isEditMode } = useEditMode();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);

  if (!isEditMode) return <>{children}</>;

  return (
    <span className="relative group inline-block">
      {children}
      <button 
        type="button" 
        onClick={(e) => {
          e.preventDefault(); 
          e.stopPropagation(); 
          setOpen(true);
        }}
        className="absolute -top-2 -right-2 hidden group-hover:block rounded-full bg-white border shadow px-2 py-0.5 text-xs hover:bg-gray-50"
      >
        ✎
      </button>

      {open && (
        <div className="fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl p-4 z-[9999] border-l">
          <div className="flex items-center justify-between mb-3">
            <strong>Edit: {field}</strong>
            <button 
              type="button" 
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          {type === 'textarea' ? (
            <textarea 
              className="w-full h-60 border rounded p-2 resize-none" 
              value={val} 
              onChange={e => setVal(e.target.value)} 
              placeholder={`Enter ${field}...`}
            />
          ) : type === 'price' ? (
            <input 
              type="number"
              step="0.01"
              className="w-full border rounded p-2" 
              value={val} 
              onChange={e => setVal(parseFloat(e.target.value) || 0)} 
              placeholder={`Enter ${field}...`}
            />
          ) : type === 'select' ? (
            <select 
              className="w-full border rounded p-2" 
              value={val} 
              onChange={e => setVal(e.target.value)}
            >
              <option value="">Select {field}...</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input 
              className="w-full border rounded p-2" 
              value={val} 
              onChange={e => setVal(e.target.value)} 
              placeholder={`Enter ${field}...`}
            />
          )}
          <div className="mt-3 flex gap-2">
            <button 
              type="button" 
              disabled={saving} 
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
              onClick={async () => {
                try { 
                  setSaving(true);
                  const row = entity === 'services'
                    ? await patchServiceField(id, field, val)
                    : null;
                  onApply?.(row);
                  setOpen(false);
                  toast({
                    title: "Saved",
                    description: `${field} updated successfully`,
                    duration: 2000
                  });
                } catch (error) {
                  toast({
                    title: "Save Failed",
                    description: error instanceof Error ? error.message : 'Unknown error',
                    variant: "destructive",
                    duration: 5000
                  });
                } finally { 
                  setSaving(false); 
                }
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button 
              type="button"
              onClick={() => setOpen(false)}
              className="border px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </span>
  );
}