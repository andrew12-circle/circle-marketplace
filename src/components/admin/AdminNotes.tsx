"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveWithTimeout } from "@/lib/saveWithTimeout";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

type Note = {
  id: string;
  service_id: string;
  note_text: string;
  created_at: string;
  created_by: string | null;
};

interface AdminNotesProps {
  serviceId: string;
  serviceName: string;
}

export const AdminNotes = ({ serviceId, serviceName }: AdminNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // If no service chosen, don't sit in a loading state forever
    if (!serviceId) {
      setNotes([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // 15s protection so the UI never spins forever
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timed out loading notes")), 15000)
        );
        const query = supabase
          .from("admin_notes")
          .select("id, service_id, note_text, created_at, created_by")
          .eq("service_id", serviceId)
          .order("created_at", { ascending: false });

        const { data, error } = await Promise.race([query, timeout]) as any;
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          toast.error(error.message);
          setNotes([]);
        } else {
          setNotes(data ?? []);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || "Failed to load admin notes";
          setLoadError(msg);
          toast.error(msg);
          setNotes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [serviceId]);

  async function addNote() {
    if (!serviceId) {
      toast.error("Select a service first");
      return;
    }
    const note_text = draft.trim();
    if (!note_text) return;
    try {
      const { data: user } = await supabase.auth.getUser();
      const created_by = user?.user?.id ?? null;

      const { data, error } = await saveWithTimeout(async () =>
        supabase.from("admin_notes").insert({ service_id: serviceId, note_text, created_by }).select("*").single()
      );
      if (error) throw error;
      setNotes(prev => [data as Note, ...prev]);
      setDraft("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add note");
    }
  }

  async function deleteNote(id: string) {
    try {
      const { error } = await saveWithTimeout(async () =>
        supabase.from("admin_notes").delete().eq("id", id)
      );
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete note");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Service Notes - {serviceName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError && (
          <div className="text-sm text-destructive">
            {loadError.includes("permission") ? "You don't have permission to view notes." : loadError}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Add a private admin note…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={2}
          />
          <button 
            onClick={addNote} 
            disabled={loading || !draft.trim()}
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading notes…</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No notes yet.</div>
        ) : (
          <ul className="space-y-2">
            {notes.map(n => (
              <li key={n.id} className="rounded-md border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                <div className="whitespace-pre-wrap text-sm mt-1">{n.note_text}</div>
                <button 
                  onClick={() => deleteNote(n.id)} 
                  className="mt-2 text-xs text-destructive hover:underline"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};