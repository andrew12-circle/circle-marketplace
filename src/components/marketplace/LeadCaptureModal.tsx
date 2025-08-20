import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    vendor: {
      name: string;
    };
  };
  externalUrl: string;
  onLeadCaptured: () => void;
}

export const LeadCaptureModal = ({ 
  isOpen, 
  onClose, 
  service, 
  externalUrl, 
  onLeadCaptured 
}: LeadCaptureModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide your name and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a consultation booking record as a lead
      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          service_id: service.id,
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone || null,
          scheduled_date: new Date().toISOString().split('T')[0], // Placeholder
          scheduled_time: '00:00', // Placeholder
          status: 'lead_captured',
          is_external: true,
          external_link: externalUrl,
          source: 'external_redirect',
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        });

      if (error) throw error;

      toast({
        title: "Information captured",
        description: "Redirecting you to the booking calendar..."
      });

      onLeadCaptured();

      // Redirect to external URL
      window.open(externalUrl, '_blank');
      onClose();

    } catch (error) {
      console.error('Error capturing lead:', error);
      toast({
        title: "Error",
        description: "Failed to capture your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Your Consultation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Service: <span className="font-medium">{service.title}</span></p>
            <p>Provider: <span className="font-medium">{service.vendor.name}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number (optional)"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              We'll capture your information and then redirect you to the booking calendar.
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Processing..." : "Continue to Calendar"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};