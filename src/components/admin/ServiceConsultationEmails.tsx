"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveWithTimeout } from "@/lib/saveWithTimeout";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

function normalizeEmails(input: string | string[]): string[] {
  const asArray = Array.isArray(input) ? input : input.split(/[,\n]/);
  const unique = new Set(
    asArray
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
      .filter(e => /\S+@\S+\.\S+/.test(e))
  );
  return Array.from(unique).slice(0, 4); // keep in sync with DB constraint
}

interface ServiceConsultationEmailsProps {
  serviceId: string;
  serviceName: string;
  initialEmails?: string[];
}

export const ServiceConsultationEmails = ({ 
  serviceId, 
  serviceName, 
  initialEmails = [] 
}: ServiceConsultationEmailsProps) => {
  const [value, setValue] = useState(initialEmails.join(", "));
  const emails = useMemo(() => normalizeEmails(value), [value]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    console.log("🔄 Saving consultation emails:", { serviceId, emails });
    setSaving(true);
    try {
      await saveWithTimeout(async () => {
        console.log("📤 Making Supabase update call...");
        const { error, data } = await supabase
          .from("services")
          .update({ consultation_emails: emails })
          .eq("id", serviceId)
          .select();
        
        console.log("📨 Supabase response:", { data, error });
        if (error) throw error;
      });
      console.log("✅ Save successful");
      toast.success("Consultation emails saved");
    } catch (e: any) {
      console.error("❌ Save failed:", e);
      toast.error(e?.message ?? "Failed to save emails");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Consultation Alert Emails - {serviceName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Consultation alert recipients (max 4)</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="name@domain.com, ops@domain.com"
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={3}
          />
          <div className="text-xs text-muted-foreground">
            Will save: {emails.join(", ") || "None"}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm disabled:opacity-60 hover:bg-primary/90"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};