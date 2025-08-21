import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  MessageSquare,
  Calendar,
  User,
  Trash2
} from "lucide-react";

interface AdminNote {
  id: string;
  note_text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const AdminNotes = () => {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading admin notes:', error);
      toast.error('Failed to load admin notes');
    } finally {
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
      const { error } = await supabase
        .from('admin_notes')
        .insert([{
          note_text: newNote.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id
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
          <div className="text-center">Loading admin notes...</div>
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
            Admin Notes
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
              placeholder="Enter your admin note..."
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
            <p>No admin notes yet</p>
            <p className="text-sm">Add your first note to get started</p>
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