import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceImageUpload } from '@/components/marketplace/ServiceImageUpload';
// Remove unused import
import { AlertTriangle, Save, Clock, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VendorServiceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
  vendorId: string;
  onSave?: () => void;
}

export const VendorServiceEditor: React.FC<VendorServiceEditorProps> = ({
  open,
  onOpenChange,
  service,
  vendorId,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    retail_price: '',
    pro_price: '',
    category: '',
    image_url: ''
  });
  
  const [funnelContent, setFunnelContent] = useState({
    headline: '',
    subheadline: '',
    heroDescription: '',
    estimatedRoi: 0,
    duration: '',
    whyChooseUs: {
      title: '',
      benefits: []
    },
    media: [],
    packages: [],
    socialProof: {
      testimonials: [],
      stats: []
    },
    trustIndicators: {
      guarantee: '',
      cancellation: '',
      certification: ''
    },
    callToAction: {
      primaryHeadline: '',
      primaryDescription: '',
      primaryButtonText: '',
      secondaryHeadline: '',
      secondaryDescription: '',
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      }
    }
  });

  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    if (service && open) {
      // Load current service data
      setFormData({
        title: service.title || '',
        description: service.description || '',
        retail_price: service.retail_price || '',
        pro_price: service.pro_price || '',
        category: service.category || '',
        image_url: service.image_url || ''
      });

      // Load funnel content
      if (service.funnel_content) {
        setFunnelContent(service.funnel_content);
      }

      // Check for pending draft
      checkPendingDraft();
    }
  }, [service, open]);

  const checkPendingDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('service_drafts')
        .select('*')
        .eq('service_id', service.id)
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

  const handleFunnelChange = (updatedContent: any) => {
    setFunnelContent(updatedContent);
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
        service_id: service.id,
        vendor_id: vendorId,
        draft_data: formData,
        funnel_data: funnelContent,
        change_summary: changeSummary,
        change_type: 'update'
      };

      // Save or update draft
      if (pendingDraft) {
        const { error } = await supabase
          .from('service_drafts')
          .update(draftData)
          .eq('id', pendingDraft.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_drafts')
          .insert([draftData]);

        if (error) throw error;
      }

      toast({
        title: "Changes Saved",
        description: "Your changes have been submitted for admin review.",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Service: {service?.title}
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

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Service Details</TabsTrigger>
            <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Service Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="retail_price">Retail Price</Label>
                    <Input
                      id="retail_price"
                      type="number"
                      value={formData.retail_price}
                      onChange={(e) => handleInputChange('retail_price', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pro_price">Pro Price</Label>
                    <Input
                      id="pro_price"
                      type="number"
                      value={formData.pro_price}
                      onChange={(e) => handleInputChange('pro_price', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Service Image</Label>
                  <ServiceImageUpload
                    value={formData.image_url}
                    onChange={(url) => handleInputChange('image_url', url)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={funnelContent.headline}
                  onChange={(e) => setFunnelContent(prev => ({ ...prev, headline: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="subheadline">Sub-headline</Label>
                <Input
                  id="subheadline"
                  value={funnelContent.subheadline}
                  onChange={(e) => setFunnelContent(prev => ({ ...prev, subheadline: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="heroDescription">Description</Label>
                <Textarea
                  id="heroDescription"
                  value={funnelContent.heroDescription}
                  onChange={(e) => setFunnelContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Change Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="changeSummary">What changes are you making?</Label>
            <Textarea
              id="changeSummary"
              placeholder="Briefly describe the changes you're making to this service..."
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

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