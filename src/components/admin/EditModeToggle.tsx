import React from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { Edit3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function EditModeToggle() {
  const { isEdit, setEdit } = useEditMode();
  const isAdmin = true; // This component only renders for admins anyway

  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isEdit ? "default" : "outline"}
        size="sm"
        onClick={() => setEdit(!isEdit)}
        className="gap-2"
      >
        {isEdit ? (
          <>
            <Eye className="h-4 w-4" />
            Exit Edit Mode
          </>
        ) : (
          <>
            <Edit3 className="h-4 w-4" />
            Edit Mode
          </>
        )}
      </Button>
      
      {isEdit && (
        <Badge variant="secondary" className="text-xs">
          Ctrl+E to toggle • Click pencil icons to edit
        </Badge>
      )}
    </div>
  );
}