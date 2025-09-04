import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAutoRecovery } from "@/hooks/useAutoRecovery";
import { 
  Plus, 
  MessageSquare,
  Calendar,
  User,
  Trash2,
  RefreshCw
} from "lucide-react";

interface AdminNote {
  id: string;
  note_text: string;
  created_by: string;
  service_id: string;
  created_at: string;
  updated_at: string;
}

interface AdminNotesProps {
  serviceId: string;
  serviceName: string;
}

export const AdminNotes = ({ serviceId, serviceName }: AdminNotesProps) => {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { triggerRecovery, isRecovering } = useAutoRecovery();

  useEffect(() => {
    if (serviceId) {
      loadNotes();
      
      // Auto-recovery for stuck loading states
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('AdminNotes stuck in loading state, triggering recovery');
          triggerRecovery();
        }
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [serviceId, loading, triggerRecovery]);

  const loadNotes = async () => {
    try {
      console.log('AdminNotes: Starting to load notes for service:', serviceId);
      
      // Debug: Check admin status first
      const { data: adminCheck, error: adminError } = await supabase.rpc('get_user_admin_status');
      console.log('AdminNotes: Admin status check result:', { adminCheck, adminError });
      
      const { data, error } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      console.log('AdminNotes: Query result:', { data, error });

      if (error) {
        console.error('AdminNotes: Database error:', error);
        if (error.code === 'PGRST116' || error.message?.includes('permission')) {
          toast.error('Permission denied. Admin access required to view notes.');
        } else {
          toast.error('Failed to load admin notes');
        }
        return;
      }

      console.log('AdminNotes: Setting notes data:', data);
      setNotes((data as any[]) || []);
    } catch (error) {
      console.error('AdminNotes: Exception loading notes:', error);
      toast.error('Failed to load admin notes');
    } finally {
      console.log('AdminNotes: Setting loading to false');
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_notes')
        .insert([{
          note_text: newNote.trim(),
          service_id: serviceId,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast.success('Note added successfully');
      setNewNote('');
      setShowAddForm(false);
      await loadNotes();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Note deleted successfully');
      await loadNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDisplayName = (note: AdminNote) => {
    return 'Admin User';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="text-center">Loading admin notes...</div>
            {isRecovering && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Refreshing system...
              </div>
            )}
            <Button
              variant="outline" 
              size="sm"
              onClick={triggerRecovery}
              disabled={isRecovering}
              className="mt-2"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
              {isRecovering ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Service Notes - {serviceName}
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Track progress, payment status, vendor communications, etc..."
              className="mb-3"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </Button>
              <Button 
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote('');
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes for this service yet</p>
            <p className="text-sm">Add notes to track progress, payments, vendor communications, etc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <Badge variant="outline" className="text-xs">
                      {getDisplayName(note)}
                    </Badge>
                    <Calendar className="w-4 h-4 ml-2" />
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  <Button
                    onClick={() => handleDeleteNote(note.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {note.note_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};