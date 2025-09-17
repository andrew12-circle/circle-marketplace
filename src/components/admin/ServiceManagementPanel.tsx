import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, Search, Edit, Globe, MapPin, Star, DollarSign, Eye, Building, Tag, ShoppingCart, CheckCircle, Clock, Mail } from 'lucide-react';
import { ServiceFunnelEditor } from './ServiceFunnelEditor';
import { ServicePricingTiersEditor } from '@/components/marketplace/ServicePricingTiersEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvalidateMarketplace, QUERY_KEYS } from '@/hooks/useMarketplaceData';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ServiceConsultationEmails } from './ServiceConsultationEmails';
import { ServiceComplianceTracker } from './ServiceComplianceTracker';
import { ServiceDisclaimerSection } from './ServiceDisclaimerSection';
import { ServiceAIResearchEditor } from './ServiceAIResearchEditor';
import { ServiceImageUploader } from './ServiceImageUploader';
import { diffPatch } from '@/lib/diff';
import { dlog, dwarn } from '@/utils/debugLogger';
import { DISPLAY_TO_TAG, tagToDisplayName, normalizeCategoryToTag } from "@/utils/categoryTags";
import { AIServiceUpdater } from './AIServiceUpdater';
import { updateServiceById, toggleServiceField, normalizeServiceNumbers } from '@/lib/updateService';
import { useUnifiedServiceSave } from '@/hooks/useUnifiedServiceSave';
import ServiceCard from './ServiceCard';

interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
  isHtml?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  duration: string;
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  badge?: string;
  position: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  profile_image_url?: string;
  website_url?: string;
  retail_price?: string;
  pro_price?: string;
  price_duration?: string;
  co_pay_price?: string;
  copay_allowed?: boolean; // Database field name
  respa_split_limit?: number;
  max_split_percentage_non_ssp?: number;
  estimated_roi?: number;
  duration?: string;
  setup_time?: string;
  tags?: string[];
  rating?: number;
  requires_quote: boolean;
  is_featured: boolean;
  is_top_pick: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  is_affiliate?: boolean;
  is_booking_link?: boolean;
  direct_purchase_enabled?: boolean;
  vendor_id?: string;
  service_provider_id?: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  core_version?: number;
  funnel_version?: number;
  service_providers?: {
    name: string;
    logo_url?: string;
  };
  funnel_content?: any;
  pricing_tiers?: any;
  pricing_screenshot_url?: string;
  pricing_screenshot_captured_at?: string;
  pricing_page_url?: string;
}

interface ThumbnailItem {
  id: string;
  label: string;
  icon: string;
  mediaUrl?: string;
  description?: string;
}

interface FunnelContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  estimatedRoi: number;
  duration: string;
  whyChooseUs: {
    title: string;
    benefits: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  media: {
    id: string;
    type: 'image' | 'video' | 'document';
    url: string;
    title: string;
    description?: string;
  }[];
  packages: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[];
    popular: boolean;
    proOnly?: boolean;
    savings?: string;
  }[];
  thumbnailGallery: {
    enabled: boolean;
    title: string;
    items: ThumbnailItem[];
  };
  roiCalculator: {
    enabled: boolean;
    title: string;
    currentMonthlyClosings: number;
    averageCommission: number;
    increasePercentage: number;
    calculatedAdditionalIncome: number;
    calculatedAnnualIncrease: number;
  };
  testimonialCards: {
    enabled: boolean;
    title: string;
    cards: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
      timeAgo: string;
      borderColor: string;
      iconColor: string;
      icon: string;
    }[];
  };
  urgencySection: {
    enabled: boolean;
    title: string;
    message: string;
    spotsRemaining: number;
    totalSpots: number;
  };
  socialProof: {
    testimonials: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
    }[];
    stats: {
      label: string;
      value: string;
    }[];
  };
  trustIndicators: {
    guarantee: string;
    cancellation: string;
    certification: string;
  };
  callToAction: {
    primaryHeadline: string;
    primaryDescription: string;
    primaryButtonText: string;
    secondaryHeadline: string;
    secondaryDescription: string;
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
  };
  urgency: {
    enabled: boolean;
    message: string;
  };
}

const safeParseJSON = (val: string) => {
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
};

export const ServiceManagementPanel = () => {
  const { toast } = useToast();
  const { invalidateServices } = useInvalidateMarketplace();
  const queryClient = useQueryClient();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Service | null>(null);
  const [baseline, setBaseline] = useState<Service | null>(null);
  
  // Memoize service lookup for performance
  const serviceById = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'funnel'>('details');

  // Default funnel content for new services
  const [funnelContent, setFunnelContent] = useState<FunnelContent>({
    headline: '',
    subheadline: '',
    heroDescription: '',
    estimatedRoi: 0,
    duration: '',
    whyChooseUs: {
      title: 'Why Choose This Service',
      benefits: []
    },
    media: [],
    packages: [],
    thumbnailGallery: {
      enabled: false,
      title: 'What You\'ll Get',
      items: [{
        id: '1',
        label: 'Demo Video',
        icon: 'video'
      }, {
        id: '2',
        label: 'Case Study',
        icon: 'chart'
      }, {
        id: '3',
        label: 'Training',
        icon: 'book'
      }, {
        id: '4',
        label: 'Results',
        icon: 'trophy'
      }]
    },
    roiCalculator: {
      enabled: false,
      title: 'ROI Calculator',
      currentMonthlyClosings: 3,
      averageCommission: 8500,
      increasePercentage: 150,
      calculatedAdditionalIncome: 38250,
      calculatedAnnualIncrease: 459000
    },
    testimonialCards: {
      enabled: false,
      title: 'Recent Success Stories',
      cards: [{
        id: '1',
        name: 'Sarah T.',
        role: 'Keller Williams',
        content: 'Increased my closings by 200% in just 3 months!',
        rating: 5,
        timeAgo: '2 weeks ago',
        borderColor: 'green',
        iconColor: 'green',
        icon: 'trending'
      }, {
        id: '2',
        name: 'Mike R.',
        role: 'RE/MAX',
        content: 'ROI was 320% in the first quarter alone.',
        rating: 5,
        timeAgo: '1 week ago',
        borderColor: 'blue',
        iconColor: 'blue',
        icon: 'dollar'
      }]
    },
    urgencySection: {
      enabled: false,
      title: 'Limited Availability',
      message: 'We only take on 5 new clients per month to ensure quality service.',
      spotsRemaining: 2,
      totalSpots: 5
    },
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
      primaryButtonText: 'Get Started',
      secondaryHeadline: '',
      secondaryDescription: '',
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      }
    },
    urgency: {
      enabled: false,
      message: ''
    }
  });

  // Default pricing tiers
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([{
    id: '1',
    name: 'Basic',
    description: 'Perfect for getting started',
    price: '99',
    duration: 'mo',
    features: [{
      id: '1',
      text: 'Basic Support',
      included: true
    }, {
      id: '2',
      text: 'Standard Features',
      included: true
    }, {
      id: '3',
      text: 'Email Support',
      included: true
    }, {
      id: '4',
      text: 'Priority Support',
      included: false
    }],
    isPopular: false,
    buttonText: 'Get Started',
    position: 0
  }, {
    id: '2',
    name: 'Professional',
    description: 'Most popular choice for professionals',
    price: '199',
    originalPrice: '249',
    duration: 'mo',
    features: [{
      id: '1',
      text: 'Priority Support',
      included: true
    }, {
      id: '2',
      text: 'Advanced Features',
      included: true
    }, {
      id: '3',
      text: 'Phone & Email Support',
      included: true
    }, {
      id: '4',
      text: 'Custom Integrations',
      included: true
    }, {
      id: '5',
      text: 'Dedicated Account Manager',
      included: false
    }],
    isPopular: true,
    buttonText: 'Choose Professional',
    badge: 'Most Popular',
    position: 1
  }]);

  // Filter formData to only core fields (exclude funnel-specific fields)
  const getCoreFieldsOnly = (service: Service | null) => {
    if (!service) return {};
    
    const {
      // Exclude funnel-specific fields that exist in the interface
      funnel_content,
      pricing_tiers,
      // Keep all other fields (they're core fields)
      ...coreFields
    } = service;
    
    return coreFields;
  };

  // Unified save for core service fields using direct table updates (not RPC)
  const { save, isSaving, hasUnsavedChanges, setOriginalData, markChanged } = useUnifiedServiceSave({
    showToasts: true,
    autoInvalidateCache: true,
    onSaveSuccess: (serviceId, result) => {
      // Update local state after successful save
      if (selectedService?.id === serviceId && formData) {
        const updatedService = { ...selectedService, ...result };
        setServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));
        
        // Only update selectedService and reset form if not currently editing
        if (!isEditingDetails) {
          setSelectedService(updatedService);
          setBaseline(updatedService);
          setFormData(updatedService);
        }
        
        // Update query cache  
        queryClient.setQueryData(QUERY_KEYS.services, (old: any) => 
          old?.map((s: any) => s.id === serviceId ? updatedService : s) || old
        );
      }
    },
    onSaveError: (serviceId, error) => {
      console.error(`[ServiceManagementPanel] Save failed for ${serviceId}:`, error);
    }
  });

  useEffect(() => {
    fetchServices();
  }, []);
  
  useEffect(() => {
    const filtered = services.filter(service => 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      service.service_providers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  // Set baseline and form data when service changes
  useEffect(() => {
    if (selectedService && !isEditingDetails) {
      // Only reset form data if we're not currently editing
      // This prevents the form from reverting during active editing sessions
      const baseline = JSON.parse(JSON.stringify(selectedService));
      setBaseline(baseline);
      setFormData(selectedService);
      setOriginalData(selectedService); // Set original data for unified save
    }
  }, [selectedService?.id, setOriginalData, isEditingDetails]); // Only reset when switching to different service or not editing

  // Compute dirty state from stable baseline
  const isDirty = useMemo(() => {
    if (!formData || !baseline) return false;
    return JSON.stringify(formData) !== JSON.stringify(baseline);
  }, [formData, baseline]);

  // Handle form field changes with auto-save through unified system
  const handleFieldChange = useCallback(async (field: string, value: any) => {
    if (!formData || !selectedService?.id) return;
    
    // Mark as editing when user starts typing
    setIsEditingDetails(true);
    
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    markChanged(); // Mark as having unsaved changes
    
    // Auto-save the change using unified system
    const patch = { [field]: value };
    const normalizedPatch = normalizeServiceNumbers(patch);
    
    try {
      await save(selectedService.id, normalizedPatch, 'field-change');
    } catch (error: any) {
      console.error(`Failed to save field ${field}:`, error);
      // Don't revert the form data - let user retry or see error state
    }
  }, [formData, selectedService?.id, markChanged, save]);

  // Handle toggle fields through unified save system
  const handleToggleField = useCallback(async (field: string, value: boolean) => {
    if (!selectedService?.id) return;
    
    try {
      // Update form data immediately
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);
      
      // Save using unified system
      await save(selectedService.id, { [field]: value }, 'toggle');
    } catch (error: any) {
      console.error(`Failed to update ${field}:`, error);
      // Revert form data on error
      setFormData(prev => prev ? { ...prev, [field]: !value } : null);
    }
  }, [selectedService?.id, formData, save]);

  const fetchServices = async () => {
    try {
      setError(null);
      dlog('📋 ServiceManagementPanel: Fetching services...');

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      dlog('✅ ServiceManagementPanel: Successfully loaded', data?.length || 0, 'services');
      setServices(data || []);
    } catch (error) {
      console.error('❌ ServiceManagementPanel: Error fetching services:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch services';
      setError(errorMessage);
      toast({
        title: 'Error Loading Services',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData(service);
    setIsEditingDetails(false);

    // Load saved funnel content if present and normalize keys; otherwise seed from service
    const rawFunnel: any = (service as any).funnel_content;
    if (rawFunnel) {
      const parsed = typeof rawFunnel === 'string' ? safeParseJSON(rawFunnel) : rawFunnel;
      const merged: any = { ...funnelContent, ...(parsed || {}) };
      const normalized: FunnelContent = {
        ...merged,
        headline: merged.headline ?? service.title,
        subheadline: merged.subheadline ?? merged.subHeadline ?? merged.sub_headline ?? (service.description || ''),
        heroDescription: merged.heroDescription ?? merged.hero_description ?? merged.description ?? (service.description || ''),
        estimatedRoi: typeof merged.estimatedRoi === 'number' ? merged.estimatedRoi : service.estimated_roi || 0,
        duration: merged.duration ?? (service.duration || '')
      };
      setFunnelContent(normalized);
    } else {
      setFunnelContent({
        ...funnelContent,
        headline: service.title,
        subheadline: service.description || '',
        heroDescription: service.description || '',
        estimatedRoi: service.estimated_roi || 0,
        duration: service.duration || ''
      });
    }

    // Load saved pricing tiers if present
    const rawTiers: any = (service as any).pricing_tiers;
    if (rawTiers) {
      if (typeof rawTiers === 'string') {
        const parsed = safeParseJSON(rawTiers);
        if (Array.isArray(parsed)) setPricingTiers(parsed as PricingTier[]);
      } else if (Array.isArray(rawTiers)) {
        setPricingTiers(rawTiers as PricingTier[]);
      }
    }
  };

  // Handle funnel save with unified system
  const handleFunnelSave = async () => {
    if (!selectedService?.id) return;
    
    try {
      const funnelPatch = {
        funnel_content: JSON.parse(JSON.stringify(funnelContent)),
        pricing_tiers: JSON.parse(JSON.stringify(pricingTiers))
      };
      
      await updateServiceById(selectedService.id, funnelPatch);
      
      // Update local state
      const updatedService = { ...selectedService, ...funnelPatch };
      setSelectedService(updatedService);
      setServices(prev => prev.map(s => s.id === selectedService.id ? updatedService : s));
      
      toast({
        title: 'Success',
        description: 'Service funnel saved successfully'
      });
      
      // Invalidate cache
      invalidateServices();
    } catch (error: any) {
      console.error('❌ Error saving funnel:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save funnel changes',
        variant: 'destructive'
      });
    }
  };

  const handleVerificationToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    await handleToggleField('is_verified', !currentStatus);
  };

  const handleVisibilityToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    await handleToggleField('is_active', !currentStatus);
  };

  const handleAffiliateToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    await handleToggleField('is_affiliate', !currentStatus);
  };

  const handleBookingLinkToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    await handleToggleField('is_booking_link', !currentStatus);
  };

  const handleTabChange = (value: 'details' | 'funnel') => {
    setActiveTab(value);
  };

  if (loading) {
    return <p>Loading services...</p>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Services</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => {
              setError(null);
              fetchServices();
            }} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Management - Edit Service Cards & Funnels
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const { data: adminStatus, error } = await supabase.rpc('get_user_admin_status');
                const { data: session } = await supabase.auth.getSession();
                dlog('Debug - Admin Status:', adminStatus);
                dlog('Debug - Session:', session);
                dlog('Debug - User ID:', session?.session?.user?.id);
                toast({
                  title: 'Debug Info',
                  description: `Admin: ${adminStatus}, User: ${session?.session?.user?.id ? 'Logged in' : 'Not logged in'}`
                });
              } catch (err) {
                console.error('Debug error:', err);
                toast({
                  title: 'Debug Error',
                  description: String(err),
                  variant: 'destructive'
                });
              }
            }}>
              Test Admin Status
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use AI to auto-generate service content, or manually select a service to edit its details, pricing, and funnel pages
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search services, categories, or companies..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-9" 
                />
              </div>
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Auto-saving...
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedService?.id === service.id}
                  onSelect={handleServiceSelect}
                  onVerificationToggle={handleVerificationToggle}
                  onVisibilityToggle={handleVisibilityToggle}
                  onAffiliateToggle={handleAffiliateToggle}
                  onBookingLinkToggle={handleBookingLinkToggle}
                />
              ))}
            </div>

            {filteredServices.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No services found matching your search.' : 'No services available.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editing: {selectedService.title}
              {isDirty && (
                <Badge variant="outline" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedService.website_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedService.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="details">Marketplace Settings</TabsTrigger>
                <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
                <TabsTrigger value="ai-research">AI Research</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="notifications">
                  <Mail className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="funnel">Service Funnel (Live)</TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Edits here update the live funnel page after saving.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {isEditingDetails ? (
                  <div className="space-y-4">
                    {/* Basic Service Information */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service Title</label>
                        <Input
                          value={formData?.title || ''}
                          onChange={e => handleFieldChange('title', e.target.value)}
                          placeholder="Enter service title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={formData?.description || ''}
                          onChange={e => handleFieldChange('description', e.target.value)}
                          placeholder="Enter service description"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Categories</label>
                           <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                             {Object.entries(DISPLAY_TO_TAG).map(([displayName, tag]: [string, string]) => {
                               const isSelected = formData?.category?.includes(tag) || false;
                              return (
                                <div key={tag} className="flex items-center justify-between">
                                  <label className="text-sm font-medium cursor-pointer flex-1">
                                    {displayName}
                                  </label>
                                  <Switch
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (!formData) return;
                                      
                                      let currentCategories = formData.category ? formData.category.split(',').map(c => c.trim()) : [];
                                      
                                      if (checked) {
                                        // Add category if not already present
                                        if (!currentCategories.includes(tag)) {
                                          currentCategories.push(tag);
                                        }
                                      } else {
                                        // Remove category
                                        currentCategories = currentCategories.filter(c => c !== tag);
                                      }
                                      
                                      const updatedCategory = currentCategories.join(', ');
                                      handleFieldChange('category', updatedCategory);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                           {formData?.category && (
                             <div className="text-xs text-muted-foreground">
                               Selected: {formData.category.split(',').map((c: string) => tagToDisplayName(c.trim())).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Duration</label>
                          <Input
                            value={formData?.duration || ''}
                            onChange={e => handleFieldChange('duration', e.target.value)}
                            placeholder="e.g., 30 days, 1 hour"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Retail Price</label>
                          <Input
                            value={formData?.retail_price || ''}
                            onChange={e => handleFieldChange('retail_price', e.target.value)}
                            placeholder="$99"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pro Price</label>
                          <Input
                            value={formData?.pro_price || ''}
                            onChange={e => handleFieldChange('pro_price', e.target.value)}
                            placeholder="$79"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Co-Pay Price</label>
                          <Input
                            value={formData?.co_pay_price || ''}
                            onChange={e => handleFieldChange('co_pay_price', e.target.value)}
                            placeholder="$49"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estimated ROI (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="10000"
                          value={formData?.estimated_roi || ''}
                          onChange={e => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            handleFieldChange('estimated_roi', value);
                          }}
                          placeholder="150"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Website URL</label>
                        <Input
                          value={formData?.website_url || ''}
                          onChange={e => handleFieldChange('website_url', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    {/* Status Switches */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        Status Settings
                        {isSaving && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                            Saving...
                          </div>
                        )}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium">Active</label>
                            <p className="text-xs text-muted-foreground">Show in marketplace</p>
                          </div>
                          <Switch
                            checked={formData?.is_active || false}
                            onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
                            disabled={isSaving}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium">Verified</label>
                            <p className="text-xs text-muted-foreground">Circle verified service</p>
                          </div>
                          <Switch
                            checked={formData?.is_verified || false}
                            onCheckedChange={(checked) => handleFieldChange('is_verified', checked)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium">Featured</label>
                            <p className="text-xs text-muted-foreground">Show in featured section</p>
                          </div>
                          <Switch
                            checked={formData?.is_featured || false}
                            onCheckedChange={(checked) => handleFieldChange('is_featured', checked)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium">Top Pick</label>
                            <p className="text-xs text-muted-foreground">Recommended service</p>
                          </div>
                          <Switch
                            checked={formData?.is_top_pick || false}
                            onCheckedChange={(checked) => handleFieldChange('is_top_pick', checked)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium">Affiliate</label>
                            <p className="text-xs text-muted-foreground">Has affiliate program</p>
                          </div>
                          <Switch
                            checked={formData?.is_affiliate || false}
                            onCheckedChange={(checked) => handleFieldChange('is_affiliate', checked)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium">Requires Quote</label>
                            <p className="text-xs text-muted-foreground">Custom pricing only</p>
                          </div>
                          <Switch
                            checked={formData?.requires_quote || false}
                            onCheckedChange={(checked) => handleFieldChange('requires_quote', checked)}
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        if (selectedService) {
                          setFormData(selectedService);
                          setIsEditingDetails(false);
                        }
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsEditingDetails(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Service Details</h3>
                      <Button onClick={() => setIsEditingDetails(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Basic Information</h4>
                        <p className="text-sm text-muted-foreground">Title: {selectedService.title}</p>
                        <p className="text-sm text-muted-foreground">Category: {selectedService.category || 'Not set'}</p>
                        <p className="text-sm text-muted-foreground">Duration: {selectedService.duration || 'Not set'}</p>
                        <p className="text-sm text-muted-foreground">ROI: {selectedService.estimated_roi || 0}%</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Status</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedService.is_featured && <Badge>Featured</Badge>}
                          {selectedService.is_top_pick && <Badge variant="secondary">Top Pick</Badge>}
                          {selectedService.requires_quote && <Badge variant="outline">Requires Quote</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="disclaimer" className="space-y-4">
                <ServiceDisclaimerSection serviceId={selectedService.id} serviceName={selectedService.title} />
              </TabsContent>

              <TabsContent value="ai-research" className="space-y-4">
                <ServiceAIResearchEditor serviceId={selectedService.id} serviceName={selectedService.title} />
              </TabsContent>

              <TabsContent value="funnel" className="space-y-4">
                <div className="space-y-4">
                  <ServiceFunnelEditor 
                    service={selectedService} 
                    onUpdate={updatedService => {
                      dlog("[ServiceManagementPanel] Received updated service from funnel editor:", {
                        id: updatedService.id,
                        retail_price: updatedService.retail_price,
                        pro_price: updatedService.pro_price,
                        co_pay_price: updatedService.co_pay_price
                      });

                      // Update services state
                      setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService as Service : s));

                      // Update selected service if it matches
                      setSelectedService(prev => prev && prev.id === updatedService.id ? updatedService as Service : prev);
                      
                      // Update form data to sync with the new selected service data
                      if (selectedService && selectedService.id === updatedService.id) {
                        setFormData(updatedService as Service);
                      }
                      
                      dlog("[ServiceManagementPanel] Updated services state with fresh pricing data");
                    }} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <ServiceComplianceTracker serviceId={selectedService.id} serviceName={selectedService.title} />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <ServiceConsultationEmails 
                  serviceId={selectedService.id} 
                  serviceName={selectedService.title} 
                  initialEmails={(selectedService as any).consultation_emails || []} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* AI Service Updater */}
      <AIServiceUpdater 
        services={services} 
        onServiceUpdate={(serviceId) => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.services
          });
          toast({
            title: 'Service Updated',
            description: 'Service has been updated by AI. Please review and verify the changes.'
          });
        }} 
      />
    </div>
  );
};