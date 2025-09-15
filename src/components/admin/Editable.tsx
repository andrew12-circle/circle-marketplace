import React, { useState, ReactNode } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { Edit3, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nanoid } from 'nanoid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditableProps {
  children: ReactNode;
  entity: 'service' | 'package';
  entityId: string;
  field: string;
  value: any;
  type?: 'text' | 'textarea' | 'price' | 'select';
  options?: { value: string; label: string; }[];
  onSave?: (newValue: any) => void;
}

export function Editable({
  children,
  entity,
  entityId,
  field,
  value,
  type = 'text',
  options = [],
  onSave
}: EditableProps) {
  const { isEditMode, isAdmin } = useEditMode();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  // Don't show edit UI if not admin or not in edit mode
  if (!isAdmin || !isEditMode) {
    return <>{children}</>;
  }

  const handleSave = async () => {
    const traceId = nanoid();
    setIsSaving(true);

    try {
      // Call the update function
      const { data, error } = await supabase
        .from(`${entity}s`)
        .update({ [field]: editValue })
        .eq('id', entityId)
        .select()
        .single();

      if (error) throw error;

      // Success
      toast({
        title: "Saved",
        description: `${field} updated successfully (${traceId})`,
        duration: 2000
      });

      setIsEditing(false);
      onSave?.(editValue);
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const renderEditor = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[120px] resize-none"
            placeholder={`Enter ${field}...`}
          />
        );
      
      case 'price':
        return (
          <Input
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${field}...`}
          />
        );
      
      case 'select':
        return (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field}...`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Enter ${field}...`}
          />
        );
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3 p-3 border border-primary/20 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Edit3 className="h-4 w-4" />
          Editing {field}
        </div>
        
        {renderEditor()}
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8"
          >
            {isSaving ? (
              <>
                <AlertCircle className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                Save
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {children}
      <button
        onClick={() => {
          setEditValue(value || '');
          setIsEditing(true);
        }}
        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-primary-foreground rounded-full p-1 shadow-md hover:bg-primary/90"
        aria-label={`Edit ${field}`}
      >
        <Edit3 className="h-3 w-3" />
      </button>
    </div>
  );
}