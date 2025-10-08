import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Building, Phone, Mail, FileText } from "lucide-react";

interface VendorReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle?: string;
}

export const VendorReferralModal = ({ isOpen, onClose, serviceTitle }: VendorReferralModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_email: '',
    vendor_phone: '',
    vendor_company: '',
    vendor_type: '',
    relationship: '',
    service_interest: serviceTitle || '',
    referral_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_name.trim() || !formData.vendor_email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide vendor name and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('refer-vendor', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Referral Submitted!",
        description: "We'll reach out to your vendor within 2-3 business days to explain the opportunity.",
      });

      // Reset form
      setFormData({
        vendor_name: '',
        vendor_email: '',
        vendor_phone: '',
        vendor_company: '',
        vendor_type: '',
        relationship: '',
        service_interest: serviceTitle || '',
        referral_notes: ''
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting vendor referral:', error);
      toast({
        title: "Submission Failed",
        description: error?.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto z-[150]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            Refer Your Vendor
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tell us about a vendor you'd like us to contact about joining our co-pay program.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Name */}
          <div className="space-y-2">
            <Label htmlFor="vendor_name" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Vendor Name *
            </Label>
            <Input
              id="vendor_name"
              value={formData.vendor_name}
              onChange={(e) => handleInputChange('vendor_name', e.target.value)}
              placeholder="John Smith or ABC Title Company"
              required
            />
          </div>

          {/* Vendor Email */}
          <div className="space-y-2">
            <Label htmlFor="vendor_email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </Label>
            <Input
              id="vendor_email"
              type="email"
              value={formData.vendor_email}
              onChange={(e) => handleInputChange('vendor_email', e.target.value)}
              placeholder="contact@vendor.com"
              required
            />
          </div>

          {/* Vendor Phone */}
          <div className="space-y-2">
            <Label htmlFor="vendor_phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="vendor_phone"
              type="tel"
              value={formData.vendor_phone}
              onChange={(e) => handleInputChange('vendor_phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="vendor_company">Company Name</Label>
            <Input
              id="vendor_company"
              value={formData.vendor_company}
              onChange={(e) => handleInputChange('vendor_company', e.target.value)}
              placeholder="ABC Title Company"
            />
          </div>

          {/* Vendor Type */}
          <div className="space-y-2">
            <Label htmlFor="vendor_type">Vendor Type</Label>
            <Select value={formData.vendor_type} onValueChange={(value) => handleInputChange('vendor_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lender">Lender</SelectItem>
                <SelectItem value="title_company">Title Company</SelectItem>
                <SelectItem value="inspector">Inspector</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="software_provider">Software Provider</SelectItem>
                <SelectItem value="marketing_company">Marketing Company</SelectItem>
                <SelectItem value="photographer">Photographer</SelectItem>
                <SelectItem value="stager">Stager</SelectItem>
                <SelectItem value="general">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor="relationship">Your Relationship</Label>
            <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
              <SelectTrigger>
                <SelectValue placeholder="How do you know them?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_partner">Current Business Partner</SelectItem>
                <SelectItem value="preferred">My Preferred Vendor</SelectItem>
                <SelectItem value="recommended">Recommended by Others</SelectItem>
                <SelectItem value="past_client">Worked With Before</SelectItem>
                <SelectItem value="colleague">Industry Colleague</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Interest */}
          <div className="space-y-2">
            <Label htmlFor="service_interest">Service They Might Help With</Label>
            <Input
              id="service_interest"
              value={formData.service_interest}
              onChange={(e) => handleInputChange('service_interest', e.target.value)}
              placeholder="e.g., Home inspections, Marketing tools"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="referral_notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Additional Notes
            </Label>
            <Textarea
              id="referral_notes"
              value={formData.referral_notes}
              onChange={(e) => handleInputChange('referral_notes', e.target.value)}
              placeholder="Any additional context about this vendor or why they'd be a good fit..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Submit Referral
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>What happens next:</strong> We'll reach out to your vendor within 2-3 business days to explain how they can help agents like you save money while growing their own business through our co-pay program.
        </div>
      </DialogContent>
    </Dialog>
  );
};