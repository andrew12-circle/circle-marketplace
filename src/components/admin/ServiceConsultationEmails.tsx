"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveWithTimeout } from "@/lib/saveWithTimeout";
import { toast } from "@/components/ui/sonner";
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
      // Validate emails before saving
      const filtered = (emails || [])
        .map((e) => (e || "").trim().toLowerCase())
        .filter(Boolean);

      const invalid = filtered.filter((e) => !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e));
      if (invalid.length) {
        toast.error(`Invalid email address${invalid.length > 1 ? "es" : ""}: ${invalid.join(", ")}`);
        return;
      }

      const unique = Array.from(new Set(filtered)).slice(0, 4);

      console.log("📤 Making Supabase update call...", { unique });
      
      // Use promise-based timeout instead of function-based
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), 15000)
      );
      
      const savePromise = supabase
        .from("services")
        .update({ consultation_emails: unique })
        .eq("id", serviceId)
        .select();

      await Promise.race([savePromise, timeoutPromise]);
      
      console.log("✅ Save successful");
      toast.success("Consultation emails saved");
    } catch (e: any) {
      console.error("❌ Save failed:", e);
      // Helpful message if RLS/permissions issue
      const msg = e?.message?.includes("permission") 
        ? "Permission denied: need admin access to update emails" 
        : e?.message;
      toast.error(msg || "Failed to save emails");
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