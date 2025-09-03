import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Save, Clock, CheckCircle, X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VendorProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  onSave?: () => void;
}

export const VendorProfileEditor: React.FC<VendorProfileEditorProps> = ({
  open,
  onOpenChange,
  vendorId,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    logo_url: ''
  });

  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    if (open) {
      loadVendorData();
      checkPendingDraft();
    }
  }, [open, vendorId]);

  const loadVendorData = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      
      setCurrentVendor(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        website_url: data.website_url || '',
        logo_url: data.logo_url || ''
      });
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const checkPendingDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_drafts')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      setPendingDraft(data);
    } catch (error) {
      console.error('Error checking pending draft:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorId}/logo.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('vendor-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-assets')
        .getPublicUrl(fileName);

      handleInputChange('logo_url', publicUrl);
      
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);

      if (!changeSummary.trim()) {
        toast({
          title: "Change Summary Required",
          description: "Please provide a brief summary of your changes for admin review.",
          variant: "destructive"
        });
        return;
      }

      // Prepare draft data
      const draftData = {
        vendor_id: vendorId,
        draft_data: formData,
        change_summary: changeSummary,
        change_type: 'update'
      };

      // Save or update draft
      if (pendingDraft) {
        const { error } = await supabase
          .from('vendor_drafts')
          .update(draftData)
          .eq('id', pendingDraft.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendor_drafts')
          .insert([draftData]);

        if (error) throw error;
      }

      toast({
        title: "Changes Saved",
        description: "Your profile changes have been submitted for admin review.",
      });

      // Check for new pending draft
      await checkPendingDraft();
      onSave?.();
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!pendingDraft) return null;
    
    const statusConfig = {
      pending: { color: 'yellow', icon: Clock, text: 'Pending Review' },
      approved: { color: 'green', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: X, text: 'Rejected' }
    };

    const config = statusConfig[pendingDraft.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`mb-4 bg-${config.color}-50 border-${config.color}-200 text-${config.color}-700`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Vendor Profile
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        {pendingDraft?.status === 'rejected' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Changes Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 text-sm">{pendingDraft.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  placeholder="Tell potential clients about your company..."
                />
              </div>

              <div>
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    <img 
                      src={formData.logo_url} 
                      alt="Company Logo" 
                      className="w-16 h-16 object-contain border rounded"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleLogoUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="changeSummary">What changes are you making?</Label>
              <Textarea
                id="changeSummary"
                placeholder="Briefly describe the changes you're making to your profile..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveDraft} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Submit for Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};