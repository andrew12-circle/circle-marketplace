import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AgentSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgentSubmissionDialog = ({ open, onOpenChange }: AgentSubmissionDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    market: "",
    brokerage: "",
    yearsInRealEstate: "",
    annualVolume: "",
    systemDescription: "",
    linkedinWebsite: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("agent_submissions").insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        market: formData.market,
        brokerage: formData.brokerage || null,
        years_in_real_estate: parseInt(formData.yearsInRealEstate),
        annual_volume: formData.annualVolume,
        system_description: formData.systemDescription,
        linkedin_website: formData.linkedinWebsite || null,
      });

      if (error) throw error;

      toast({
        title: "Thanks for submitting!",
        description: "We'll review your submission and reach out within 5 business days if you're a fit for a playbook interview.",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        market: "",
        brokerage: "",
        yearsInRealEstate: "",
        annualVolume: "",
        systemDescription: "",
        linkedinWebsite: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Your Playbook</DialogTitle>
          <DialogDescription>
            We interview top agents and turn their proven systems into playbooks. Tell us about yours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market">Market/City *</Label>
              <Input
                id="market"
                required
                value={formData.market}
                onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                placeholder="Beverly Hills, CA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brokerage">Brokerage</Label>
              <Input
                id="brokerage"
                value={formData.brokerage}
                onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                placeholder="Compass, Keller Williams, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsInRealEstate">Years in Real Estate *</Label>
              <Input
                id="yearsInRealEstate"
                type="number"
                min="0"
                required
                value={formData.yearsInRealEstate}
                onChange={(e) => setFormData({ ...formData, yearsInRealEstate: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualVolume">Annual Volume or GCI *</Label>
            <Input
              id="annualVolume"
              required
              value={formData.annualVolume}
              onChange={(e) => setFormData({ ...formData, annualVolume: e.target.value })}
              placeholder="$5M+ volume or $250K+ GCI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemDescription">What makes your system unique? *</Label>
            <Textarea
              id="systemDescription"
              required
              value={formData.systemDescription}
              onChange={(e) => setFormData({ ...formData, systemDescription: e.target.value })}
              placeholder="Describe your approach, strategies, or methods that set you apart from other agents..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinWebsite">LinkedIn or Website</Label>
            <Input
              id="linkedinWebsite"
              type="url"
              value={formData.linkedinWebsite}
              onChange={(e) => setFormData({ ...formData, linkedinWebsite: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Your Story"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
