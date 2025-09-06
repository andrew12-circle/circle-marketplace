import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookAdvisorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookAdvisorModal = ({ open, onOpenChange }: BookAdvisorModalProps) => {
  const { user } = useAuth();
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to book a consultation");
      return;
    }

    if (!contact.trim()) {
      toast.error("Please provide your contact information");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          user_id: user.id,
          contact: contact.trim(),
          notes: notes.trim() || null
        });

      if (error) throw error;

      toast.success("Consultation request submitted! We'll reach out within 24 hours.");
      onOpenChange(false);
      setContact("");
      setNotes("");
    } catch (error) {
      console.error('Error booking consultation:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Book a Human Advisor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Phone or Email *</Label>
            <Input
              id="contact"
              type="text"
              placeholder="Your phone number or email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              We'll use this to schedule your consultation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Preferred time or specific questions (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., 'Best to call mornings' or 'Questions about lead generation'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              What to expect:
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• 30-minute strategy call with a real estate growth expert</li>
              <li>• Review of your current business and growth goals</li>
              <li>• Personalized recommendations beyond what the AI suggests</li>
              <li>• No sales pressure — just honest guidance</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !contact.trim()}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Request Consultation"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Free consultation • No commitment required
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};