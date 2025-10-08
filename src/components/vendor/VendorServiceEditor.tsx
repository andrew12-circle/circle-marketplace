import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVersionedDraft } from '@/hooks/useVersionedDraft';
import { Switch } from '@/components/ui/switch';
import { X, Upload, Plus, Image as ImageIcon, AlertTriangle, Save, Clock, CheckCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { MediaUploadGrid } from './MediaUploadGrid';
import { ServicePricingEditor } from './ServicePricingEditor';

const SERVICE_CATEGORIES = [
  'CRMs', 'Ads & Lead Gen', 'Website / IDX', 'SEO', 'Coaching',
  'Marketing Automation & Content', 'Video & Media Tools', 'Listing & Showing Tools',
  'Data & Analytics', 'Finance & Business Tools', 'Productivity & Collaboration',
  'Virtual Assistants & Dialers', 'Team & Recruiting Tools', 'CE & Licensing',
  'Client Event Kits', 'Print & Mail', 'Signage & Branding', 'Presentations',
  'Branding', 'Client Retention', 'Transaction Coordinator'
];

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
  const [changeSummary, setChangeSummary] = useState('');
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    retail_price: '',
    pro_price: '',
    tags: [] as string[],
    image_url: '',
    pricing_tiers: [] as any[]
  });

  const [funnelContent, setFunnelContent] = useState({
    whyShouldICare: '',
    whatIsMyROI: '',
    howSoonWillISeeResults: '',
    howMuchDoesItCost: '',
    whatDoIGetWithIt: '',
    doesItRequireCallOrCanIBuyNow: '',
    proofItWorks: '',
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    ctaText: '',
    ctaLink: '',
    mediaGallery: [] as any[]
  });

  // Versioned draft hook
  const {
    draftState,
    isSaving,
    hasUnsavedChanges,
    showConflictBanner,
    lastSaved,
    saveDraft,
    submitDraft,
    refreshDraft
  } = useVersionedDraft({
    entityId: service?.id || '',
    entityType: 'service',
    autosaveDelay: 5000,
    onConflict: () => {
      toast({
        title: "Draft conflict",
        description: "This draft was modified in another session.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (service && open) {
      loadServiceData();
      checkPendingDraft();
    }
  }, [service, open]);

  const loadServiceData = () => {
    if (!service) return;

    setFormData({
      title: service.title || '',
      description: service.description || '',
      category: service.category || '',
      retail_price: service.retail_price || '',
      pro_price: service.pro_price || '',
      tags: service.tags || [],
      image_url: service.image_url || '',
      pricing_tiers: service.pricing_tiers || []
    });

    if (service.funnel_content) {
      setFunnelContent({
        whyShouldICare: service.funnel_content.whyShouldICare || '',
        whatIsMyROI: service.funnel_content.whatIsMyROI || '',
        howSoonWillISeeResults: service.funnel_content.howSoonWillISeeResults || '',
        howMuchDoesItCost: service.funnel_content.howMuchDoesItCost || '',
        whatDoIGetWithIt: service.funnel_content.whatDoIGetWithIt || '',
        doesItRequireCallOrCanIBuyNow: service.funnel_content.doesItRequireCallOrCanIBuyNow || '',
        proofItWorks: service.funnel_content.proofItWorks || '',
        heroTitle: service.funnel_content.heroTitle || '',
        heroSubtitle: service.funnel_content.heroSubtitle || '',
        heroImage: service.funnel_content.heroImage || '',
        ctaText: service.funnel_content.ctaText || '',
        ctaLink: service.funnel_content.ctaLink || '',
        mediaGallery: service.funnel_content.mediaGallery || []
      });
    }
  };

  const checkPendingDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('service_drafts')
        .select('*')
        .eq('service_id', service?.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      setPendingDraft(data);
    } catch (error) {
      console.error('Error checking pending draft:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Trigger autosave
    const newPayload = {
      core: newFormData,
      funnel: funnelContent
    };
    saveDraft(newPayload);
  };

  const handleFunnelChange = (field: string, value: any) => {
    const newFunnelContent = { ...funnelContent, [field]: value };
    setFunnelContent(newFunnelContent);
    
    // Trigger autosave
    const newPayload = {
      core: formData,
      funnel: newFunnelContent
    };
    saveDraft(newPayload);
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

  const handleImageUpload = async (file: File, isMainImage = false) => {
    try {
      const user = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('service-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('service-assets')
        .getPublicUrl(fileName);

      if (isMainImage) {
        setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSaveDraft = async () => {
    if (!changeSummary.trim()) {
      toast({
        title: "Change summary required",
        description: "Please provide a summary of your changes.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('service_drafts')
        .insert({
          service_id: service?.id,
          vendor_id: vendorId,
          draft_data: formData,
          funnel_data: funnelContent,
          change_summary: changeSummary,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Changes submitted for review",
        description: "Your service updates have been submitted and are pending admin approval."
      });

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
      <Badge variant="outline" className="mb-4">
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Edit Service: {service?.title}</span>
              <Badge variant="outline">
                v{draftState?.version_number || 0}
                {draftState?.state === 'DRAFT' && ' (Draft)'}
                {draftState?.state === 'SUBMITTED' && ' (Pending Review)'}
                {draftState?.state === 'CHANGES_REQUESTED' && ' (Changes Requested)'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              {isSaving && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              
              {!isSaving && lastSaved && (
                <span className="text-muted-foreground">
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              
              {hasUnsavedChanges && !isSaving && (
                <span className="text-amber-600">Unsaved changes</span>
              )}

              {draftState?.state === 'DRAFT' && (
                <Button onClick={submitDraft} disabled={hasUnsavedChanges || isSaving} size="sm">
                  Submit for Review
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Conflict Banner */}
        {showConflictBanner && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Draft Out of Sync</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>This draft was modified in another session. Please refresh to see the latest version.</span>
              <Button onClick={refreshDraft} size="sm" variant="outline" className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {pendingDraft?.status === 'rejected' && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Changes Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive text-sm">{pendingDraft.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Service Details</TabsTrigger>
              <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Service Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter service title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Service Card Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description that appears on your service card in the marketplace"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retail_price">Retail Price</Label>
                  <Input
                    id="retail_price"
                    value={formData.retail_price}
                    onChange={(e) => handleInputChange('retail_price', e.target.value)}
                    placeholder="e.g., $99/month"
                  />
                </div>
                <div>
                  <Label htmlFor="pro_price">Circle Pro Price</Label>
                  <Input
                    id="pro_price"
                    value={formData.pro_price}
                    onChange={(e) => handleInputChange('pro_price', e.target.value)}
                    placeholder="e.g., $79/month"
                  />
                </div>
              </div>

              <div>
                <Label>Main Service Image</Label>
                <Card className="mt-2">
                  <CardContent className="p-4">
                    {formData.image_url ? (
                      <div className="relative">
                        <img
                          src={formData.image_url}
                          alt="Service preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center relative">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload your main service image
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, true);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button type="button">
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="funnel" className="space-y-6">
              {/* Circle's 5 Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Circle's 5 Questions</CardTitle>
                  <p className="text-sm text-muted-foreground">Answer these key questions to help agents understand your service value</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="whyShouldICare">1. Why should I care?</Label>
                    <Textarea
                      id="whyShouldICare"
                      value={funnelContent.whyShouldICare}
                      onChange={(e) => handleFunnelChange('whyShouldICare', e.target.value)}
                      placeholder="Explain why this service matters for a realtor's business"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whatIsMyROI">2. What's my ROI?</Label>
                    <Textarea
                      id="whatIsMyROI"
                      value={funnelContent.whatIsMyROI}
                      onChange={(e) => handleFunnelChange('whatIsMyROI', e.target.value)}
                      placeholder="Show typical returns or agent testimonials"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="howSoonWillISeeResults">3. How soon will I see results?</Label>
                    <Textarea
                      id="howSoonWillISeeResults"
                      value={funnelContent.howSoonWillISeeResults}
                      onChange={(e) => handleFunnelChange('howSoonWillISeeResults', e.target.value)}
                      placeholder="Immediate, weeks, or months - set realistic expectations"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="howMuchDoesItCost">4. How much does it cost?</Label>
                    <Textarea
                      id="howMuchDoesItCost"
                      value={funnelContent.howMuchDoesItCost}
                      onChange={(e) => handleFunnelChange('howMuchDoesItCost', e.target.value)}
                      placeholder="List monthly + annual price clearly"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatDoIGetWithIt">5. What do I get with it?</Label>
                    <Textarea
                      id="whatDoIGetWithIt"
                      value={funnelContent.whatDoIGetWithIt}
                      onChange={(e) => handleFunnelChange('whatDoIGetWithIt', e.target.value)}
                      placeholder="Bullet out features and deliverables"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Proof It Works */}
              <Card>
                <CardHeader>
                  <CardTitle>Proof It Works</CardTitle>
                  <p className="text-sm text-muted-foreground">Share testimonials, case studies, and proof points</p>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="proof_it_works">Proof It Works</Label>
                    <Textarea
                      id="proof_it_works"
                      value={funnelContent.proofItWorks}
                      onChange={(e) => handleFunnelChange('proofItWorks', e.target.value)}
                      placeholder="Share testimonials, case studies, or proof points"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Media Gallery</CardTitle>
                  <p className="text-sm text-muted-foreground">Upload images and videos to showcase your service</p>
                </CardHeader>
                <CardContent>
                  <MediaUploadGrid
                    mediaItems={funnelContent.mediaGallery}
                    onMediaChange={(items) => handleFunnelChange('mediaGallery', items)}
                    maxItems={4}
                    bucketName="service-assets"
                    folderPath={`funnel`}
                  />
                </CardContent>
              </Card>

              {/* Hero Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Hero Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={funnelContent.heroTitle}
                      onChange={(e) => handleFunnelChange('heroTitle', e.target.value)}
                      placeholder="Compelling headline for your service"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                    <Input
                      id="heroSubtitle"
                      value={funnelContent.heroSubtitle}
                      onChange={(e) => handleFunnelChange('heroSubtitle', e.target.value)}
                      placeholder="Supporting subtitle"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card>
                <CardHeader>
                  <CardTitle>Call to Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ctaText">CTA Button Text</Label>
                    <Input
                      id="ctaText"
                      value={funnelContent.ctaText}
                      onChange={(e) => handleFunnelChange('ctaText', e.target.value)}
                      placeholder="e.g., Get Started, Try Free, Contact Us"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ctaLink">CTA Link</Label>
                    <Input
                      id="ctaLink"
                      value={funnelContent.ctaLink}
                      onChange={(e) => handleFunnelChange('ctaLink', e.target.value)}
                      placeholder="https://your-website.com/signup"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <ServicePricingEditor
                pricingTiers={formData.pricing_tiers}
                onPricingTiersChange={(tiers) => handleInputChange('pricing_tiers', tiers)}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Additional service settings will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Change Summary and Save */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Changes for Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="changeSummary">Change Summary *</Label>
                <Textarea
                  id="changeSummary"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Briefly describe what you've changed or updated"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDraft} disabled={loading || !changeSummary.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};