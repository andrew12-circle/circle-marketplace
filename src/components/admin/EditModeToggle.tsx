import React from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { Edit3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function EditModeToggle() {
  const { isEditMode, setEditMode, isAdmin } = useEditMode();

  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isEditMode ? "default" : "outline"}
        size="sm"
        onClick={() => setEditMode(!isEditMode)}
        className="gap-2"
      >
        {isEditMode ? (
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
      
      {isEditMode && (
        <Badge variant="secondary" className="text-xs">
          Ctrl+E to toggle • Click pencil icons to edit
        </Badge>
      )}
    </div>
  );
}