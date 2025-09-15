import { useState } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditableTextProps {
  entity?: string;
  id: string;
  field: string;
  value?: string;
  onSaved?: (row: any) => void;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
}

export function EditableText({
  entity = "services",
  id,
  field,
  value,
  onSaved,
  className = "",
  inputClassName = "",
  multiline = false
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // View mode - just show the text
  if (!isEditMode) {
    return <span className={className}>{value}</span>;
  }

  // Edit mode but not currently editing - show text with pencil on hover
  if (!isEditing) {
    return (
      <span className={`relative inline-block group ${className}`}>
        {value}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditValue(value ?? "");
            setIsEditing(true);
          }}
          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-1 text-xs hover:bg-primary/90"
          aria-label={`Edit ${field}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
      </span>
    );
  }

  // Currently editing - show slide-out editor
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setIsEditing(false)}
      />
      
      {/* Slide-out editor */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-background shadow-2xl border-l z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Edit {field}</h3>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`min-h-[200px] ${inputClassName}`}
              placeholder={`Enter ${field}...`}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={inputClassName}
              placeholder={`Enter ${field}...`}
            />
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={async () => {
                if (isSaving) return;
                
                setIsSaving(true);
                try {
                  const { error } = await supabase
                    .from(entity)
                    .update({ [field]: editValue })
                    .eq('id', id);
                  
                  if (error) throw error;
                  
                  // Fetch updated row to return to parent
                  const { data, error: fetchError } = await supabase
                    .from(entity)
                    .select('*')
                    .eq('id', id)
                    .single();
                  
                  if (fetchError) throw fetchError;
                  
                  onSaved?.(data);
                  setIsEditing(false);
                  
                  toast({
                    title: "Saved",
                    description: `${field} updated successfully`,
                  });
                } catch (error: any) {
                  console.error('Save error:', error);
                  toast({
                    title: "Save Failed",
                    description: error.message || 'Failed to save changes',
                    variant: "destructive",
                  });
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setEditValue(value ?? "");
                setIsEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}