"use client";
import { useState, useMemo, useEffect } from "react";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Check, AlertCircle } from "lucide-react";

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
  const { debouncedSave, isSaving } = useDebouncedSave();

  // Auto-save when emails change
  useEffect(() => {
    if (emails.length > 0) {
      // Validate emails before saving
      const filtered = emails
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const invalid = filtered.filter((e) => !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e));
      
      if (invalid.length === 0) {
        // Only save if all emails are valid
        const unique = Array.from(new Set(filtered)).slice(0, 4);
        debouncedSave(serviceId, { consultation_emails: unique });
      }
    } else if (value.trim() === "") {
      // Clear emails if input is empty
      debouncedSave(serviceId, { consultation_emails: [] });
    }
  }, [emails, value, serviceId, debouncedSave]);

  const invalid = emails.filter((e) => !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e));
  const hasInvalidEmails = invalid.length > 0;

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
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Will save: {emails.join(", ") || "None"}
              {hasInvalidEmails && (
                <span className="text-destructive ml-2">
                  • Invalid: {invalid.join(", ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {isSaving ? (
                <>
                  <AlertCircle className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-600">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Auto-saved</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};