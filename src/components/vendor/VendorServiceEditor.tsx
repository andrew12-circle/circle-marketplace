import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceImageUpload } from '@/components/marketplace/ServiceImageUpload';
import { AlertTriangle, Save, Clock, CheckCircle, X, Plus, Trash2, ShoppingCart } from 'lucide-react';
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
  
  // Form state - comprehensive service data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    retail_price: '',
    pro_price: '',
    category: '',
    image_url: '',
    duration: '',
    estimated_roi: 0,
    tags: [] as string[],
    is_featured: false,
    is_top_pick: false,
    requires_quote: false,
    direct_purchase_enabled: false,
    website_url: '',
    respa_split_limit: 0,
    max_split_percentage_non_ssp: 0
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

  const [newTag, setNewTag] = useState('');
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
        image_url: service.image_url || '',
        duration: service.duration || '',
        estimated_roi: service.estimated_roi || 0,
        tags: service.tags || [],
        is_featured: service.is_featured || false,
        is_top_pick: service.is_top_pick || false,
        requires_quote: service.requires_quote || false,
        direct_purchase_enabled: service.direct_purchase_enabled || false,
        website_url: service.website_url || '',
        respa_split_limit: service.respa_split_limit || 0,
        max_split_percentage_non_ssp: service.max_split_percentage_non_ssp || 0
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

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFunnelChange = (field: string, value: any) => {
    setFunnelContent(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Service Details</TabsTrigger>
            <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Service Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_generation">Lead Generation</SelectItem>
                        <SelectItem value="marketing_automation">Marketing Automation</SelectItem>
                        <SelectItem value="crm_management">CRM Management</SelectItem>
                        <SelectItem value="transaction_coordination">Transaction Coordination</SelectItem>
                        <SelectItem value="professional_services">Professional Services</SelectItem>
                        <SelectItem value="coaching_training">Coaching & Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <Label htmlFor="estimated_roi">Estimated ROI (%)</Label>
                    <Input
                      id="estimated_roi"
                      type="number"
                      value={formData.estimated_roi}
                      onChange={(e) => handleInputChange('estimated_roi', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="e.g., 30 days, 3 months, ongoing"
                  />
                </div>

                <div>
                  <Label>Service Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} disabled={!newTag.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={funnelContent.headline}
                    onChange={(e) => handleFunnelChange('headline', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="subheadline">Sub-headline</Label>
                  <Input
                    id="subheadline"
                    value={funnelContent.subheadline}
                    onChange={(e) => handleFunnelChange('subheadline', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="heroDescription">Description</Label>
                  <Textarea
                    id="heroDescription"
                    value={funnelContent.heroDescription}
                    onChange={(e) => handleFunnelChange('heroDescription', e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call to Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryHeadline">Primary CTA Headline</Label>
                  <Input
                    id="primaryHeadline"
                    value={funnelContent.callToAction.primaryHeadline}
                    onChange={(e) => handleFunnelChange('callToAction', {
                      ...funnelContent.callToAction,
                      primaryHeadline: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="primaryButtonText">Primary Button Text</Label>
                  <Input
                    id="primaryButtonText"
                    value={funnelContent.callToAction.primaryButtonText}
                    onChange={(e) => handleFunnelChange('callToAction', {
                      ...funnelContent.callToAction,
                      primaryButtonText: e.target.value
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Service</Label>
                    <p className="text-sm text-muted-foreground">Display prominently on marketplace</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Top Pick</Label>
                    <p className="text-sm text-muted-foreground">Mark as a top recommendation</p>
                  </div>
                  <Switch
                    checked={formData.is_top_pick}
                    onCheckedChange={(checked) => handleInputChange('is_top_pick', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requires Quote</Label>
                    <p className="text-sm text-muted-foreground">Custom pricing required</p>
                  </div>
                  <Switch
                    checked={formData.requires_quote}
                    onCheckedChange={(checked) => handleInputChange('requires_quote', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Direct Purchase</Label>
                    <p className="text-sm text-muted-foreground">Enable direct buy-now functionality</p>
                  </div>
                  <Switch
                    checked={formData.direct_purchase_enabled}
                    onCheckedChange={(checked) => handleInputChange('direct_purchase_enabled', checked)}
                  />
                </div>

                {formData.direct_purchase_enabled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Direct Purchase Enabled</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          This service will show a "Buy Now" button that redirects to your purchase URL.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website_url">Website / Purchase URL</Label>
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                        placeholder="https://example.com/checkout"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="respa_split">RESPA Split % (0–1000)</Label>
                    <Input
                      id="respa_split"
                      type="number"
                      min="0"
                      max="1000"
                      value={formData.respa_split_limit}
                      onChange={(e) => handleInputChange('respa_split_limit', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="non_ssp_split">Non-SSP Split % (0–1000)</Label>
                    <Input
                      id="non_ssp_split"
                      type="number"
                      min="0"
                      max="1000"
                      value={formData.max_split_percentage_non_ssp}
                      onChange={(e) => handleInputChange('max_split_percentage_non_ssp', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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