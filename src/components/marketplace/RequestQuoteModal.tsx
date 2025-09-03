import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X } from 'lucide-react';

interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    vendor?: {
      name: string;
      id?: string;
    } | null;
  };
  selectedTierId?: string;
}

export const RequestQuoteModal = ({ 
  isOpen, 
  onClose, 
  service, 
  selectedTierId = '' 
}: RequestQuoteModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, Word document, text file, or image.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    // Reset the input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

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
      let fileUrl = null;

      // Upload file if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `quote-request-${service.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue without file if upload fails
        } else {
          const { data: publicUrl } = supabase.storage
            .from('quote-attachments')
            .getPublicUrl(uploadData.path);
          fileUrl = publicUrl.publicUrl;
        }
      }

      // Create a consultation booking as a quote request
      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          service_id: service.id,
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone || null,
          scheduled_date: new Date().toISOString().split('T')[0], // Placeholder
          scheduled_time: '00:00', // Placeholder
          status: 'quote_requested',
          project_details: formData.notes || null,
          consultation_notes: selectedTierId ? `Selected tier: ${selectedTierId}` : null,
          source: 'pricing_section',
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
          company: formData.company || null,
          attachment_url: fileUrl
        });

      if (error) throw error;

      // Send email notification to vendor if we have their contact info
      try {
        await supabase.functions.invoke('send-quote-request-email', {
          body: {
            vendorName: service.vendor?.name || 'Vendor',
            serviceName: service.title,
            clientName: formData.name,
            clientEmail: formData.email,
            clientCompany: formData.company,
            clientPhone: formData.phone,
            notes: formData.notes,
            selectedTier: selectedTierId,
            hasAttachment: !!fileUrl
          }
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Don't fail the whole process if email fails
      }

      toast({
        title: "Quote request sent!",
        description: `We've forwarded your request to ${service.vendor?.name || 'the provider'}. They'll contact you soon.`
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        notes: ''
      });
      setSelectedFile(null);
      onClose();

    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: "Error",
        description: "Failed to submit your quote request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Custom Quote</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Service: <span className="font-medium">{service.title}</span></p>
            <p>Provider: <span className="font-medium">{service.vendor?.name || 'Direct Service'}</span></p>
            {selectedTierId && (
              <p>Package: <span className="font-medium">{selectedTierId}</span></p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote-name">Full Name *</Label>
                <Input
                  id="quote-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-email">Email Address *</Label>
                <Input
                  id="quote-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote-company">Company</Label>
                <Input
                  id="quote-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-phone">Phone Number</Label>
                <Input
                  id="quote-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-notes">Project Details</Label>
              <Textarea
                id="quote-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Tell us about your project, timeline, specific requirements, or any questions you have..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Attach File (Optional)</Label>
              <div className="relative">
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="file-upload"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Drop a file here or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, Text, or Image files (max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              We'll forward your request to {service.vendor?.name || 'the provider'} and they'll contact you directly with a custom quote.
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Sending Request..." : "Request Quote"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};