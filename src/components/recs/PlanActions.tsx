import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PlanActions({
  onAccept,
  onEmail,
}: {
  onAccept: () => Promise<void>;
  onEmail: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    setSaving(true);
    try { 
      await onAccept(); 
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <Button onClick={handleAccept} disabled={saving}>
        {saving ? "Saving…" : "Accept plan"}
      </Button>
      <Button variant="secondary" onClick={onEmail}>Email me this plan</Button>
    </div>
  );
}