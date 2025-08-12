import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  Edit, 
  Globe, 
  MapPin, 
  Star,
  DollarSign,
  Eye,
  Building,
  Tag,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';
import { ServiceFunnelEditor } from './ServiceFunnelEditor';
import { ServicePricingTiersEditor } from '@/components/marketplace/ServicePricingTiersEditor';
import { ServiceFunnelModal } from '@/components/marketplace/ServiceFunnelModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvalidateMarketplace, QUERY_KEYS } from '@/hooks/useMarketplaceData';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  tags?: string[];
  rating?: number;
  requires_quote: boolean;
  is_featured: boolean;
  is_top_pick: boolean;
  is_verified?: boolean;
  direct_purchase_enabled?: boolean;
  vendor_id?: string;
  service_provider_id?: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  vendors?: {
    name: string;
    logo_url?: string;
  };
  service_providers?: {
    name: string;
    logo_url?: string;
  };
  funnel_content?: any;
  pricing_tiers?: any;
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

type SaveResult = {
  savedAt?: string;
  verified?: boolean;
  message?: string;
};

const safeParseJSON = (val: string) => {
  try { return JSON.parse(val); } catch { return null; }
};

export const ServiceManagementPanel = () => {
  const { toast } = useToast();
  const invalidateCache = useInvalidateMarketplace();
  const queryClient = useQueryClient();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showFunnelEditor, setShowFunnelEditor] = useState(false);
  const [showFunnelPreview, setShowFunnelPreview] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Service>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastFunnelSavedAt, setLastFunnelSavedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'pricing' | 'funnel'>('details');

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
      items: [
        { id: '1', label: 'Demo Video', icon: 'video' },
        { id: '2', label: 'Case Study', icon: 'chart' },
        { id: '3', label: 'Training', icon: 'book' },
        { id: '4', label: 'Results', icon: 'trophy' }
      ]
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
      cards: [
        {
          id: '1',
          name: 'Sarah T.',
          role: 'Keller Williams',
          content: 'Increased my closings by 200% in just 3 months!',
          rating: 5,
          timeAgo: '2 weeks ago',
          borderColor: 'green',
          iconColor: 'green',
          icon: 'trending'
        },
        {
          id: '2',
          name: 'Mike R.',
          role: 'RE/MAX',
          content: 'ROI was 320% in the first quarter alone.',
          rating: 5,
          timeAgo: '1 week ago',
          borderColor: 'blue',
          iconColor: 'blue',
          icon: 'dollar'
        }
      ]
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
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    {
      id: '1',
      name: 'Basic',
      description: 'Perfect for getting started',
      price: '99',
      duration: 'mo',
      features: [
        { id: '1', text: 'Basic Support', included: true },
        { id: '2', text: 'Standard Features', included: true },
        { id: '3', text: 'Email Support', included: true },
        { id: '4', text: 'Priority Support', included: false }
      ],
      isPopular: false,
      buttonText: 'Get Started',
      position: 0
    },
    {
      id: '2',
      name: 'Professional',
      description: 'Most popular choice for professionals',
      price: '199',
      originalPrice: '249',
      duration: 'mo',
      features: [
        { id: '1', text: 'Priority Support', included: true },
        { id: '2', text: 'Advanced Features', included: true },
        { id: '3', text: 'Phone & Email Support', included: true },
        { id: '4', text: 'Custom Integrations', included: true },
        { id: '5', text: 'Dedicated Account Manager', included: false }
      ],
      isPopular: true,
      buttonText: 'Choose Professional',
      badge: 'Most Popular',
      position: 1
    }
  ]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vendors?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_providers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          vendors (name, logo_url),
          service_providers (name, logo_url)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch services';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setEditForm(service);
    setIsEditingDetails(false);
    setShowFunnelEditor(false);
    
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
        estimatedRoi: typeof merged.estimatedRoi === 'number' ? merged.estimatedRoi : (service.estimated_roi || 0),
        duration: merged.duration ?? (service.duration || ''),
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

  const handleServiceUpdate = async () => {
    if (!selectedService) return;

    // Basic required field validation to prevent silent failures
    if (!editForm.title || !editForm.category) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide both Title and Category before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
        // Auto-calculate co_pay_price based on pro_price and SSP split percentage
        let calculatedCoPayPrice: string | null = null;
        if (editForm.pro_price && editForm.respa_split_limit) {
          const proPrice = parseFloat(editForm.pro_price.replace(/[^\d.]/g, ''));
          const splitPercentage = editForm.respa_split_limit;
          if (!Number.isNaN(proPrice) && typeof splitPercentage === 'number') {
            const coPayAmount = proPrice * (1 - (splitPercentage / 100));
            calculatedCoPayPrice = coPayAmount.toFixed(2);
          }
        }

      // Prepare update data with direct field mapping
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        duration: editForm.duration,
        estimated_roi: editForm.estimated_roi || null,
        sort_order: editForm.sort_order || null,
        is_featured: !!editForm.is_featured,
        is_top_pick: !!editForm.is_top_pick,
        is_verified: !!editForm.is_verified,
        requires_quote: !!editForm.requires_quote,
        copay_allowed: !!editForm.copay_allowed, // Use database field name
        direct_purchase_enabled: !!editForm.direct_purchase_enabled,
        respa_split_limit: editForm.respa_split_limit ?? null,
        max_split_percentage_non_ssp: editForm.max_split_percentage_non_ssp ?? null,
        co_pay_price: calculatedCoPayPrice
      };

      console.log('Updating service with data:', updateData);

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', selectedService.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      // Fetch updated service to get latest data
      const { data: updatedServiceData, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          vendors (name, logo_url),
          service_providers (name, logo_url)
        `)
        .eq('id', selectedService.id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      // Update local state with fresh data
      setSelectedService(updatedServiceData);
      setServices(services.map(s => s.id === selectedService.id ? updatedServiceData : s));
      setEditForm(updatedServiceData);
      setIsEditingDetails(false);
      
      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
    } catch (error) {
      console.error('Error updating service:', error);
      const err: any = error;
      const code = err?.code || err?.status || '';
      const details = err?.details || err?.hint || err?.message || 'Failed to update service';
      const permissionHint = (typeof details === 'string' && details.toLowerCase().includes('permission')) || code === '42501';
      toast({
        title: 'Error',
        description: permissionHint
          ? 'You do not have permission to update services. Please ensure you are signed in as an admin.'
          : `${details}${code ? ` (code: ${code})` : ''}`,
        variant: 'destructive',
      });
    }
  };

  const handleVerificationToggle = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_verified: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      // Update local state
      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, is_verified: !currentStatus }
          : service
      ));

      if (selectedService?.id === serviceId) {
        const updatedService = { ...selectedService, is_verified: !currentStatus };
        setSelectedService(updatedService);
        setEditForm(updatedService);
      }

      toast({
        title: 'Success',
        description: `Service ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    }
  };

  const handleFunnelSave = async (): Promise<SaveResult> => {
    if (!selectedService) return { savedAt: new Date().toISOString(), verified: false };

    try {
      // Save the funnel content to the database
      const { error: updateError } = await supabase
        .from('services')
        .update({ 
          funnel_content: JSON.parse(JSON.stringify(funnelContent)),
          pricing_tiers: JSON.parse(JSON.stringify(pricingTiers))
        })
        .eq('id', selectedService.id);

      if (updateError) throw updateError;

      // Read back to verify persistence
      const { data: verifyRow, error: fetchError } = await supabase
        .from('services')
        .select('id, funnel_content, pricing_tiers, updated_at')
        .eq('id', selectedService.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const savedAt = verifyRow?.updated_at || new Date().toISOString();
      const verified = !!verifyRow &&
        JSON.stringify(verifyRow.funnel_content ?? null) === JSON.stringify(funnelContent) &&
        JSON.stringify(verifyRow.pricing_tiers ?? null) === JSON.stringify(pricingTiers);

      // Update local state
      const updatedService = { 
        ...selectedService, 
        funnel_content: funnelContent,
        pricing_tiers: pricingTiers,
        updated_at: savedAt as any
      };
      setSelectedService(updatedService);
      setServices(services.map(s => s.id === selectedService.id ? updatedService : s));
      setLastFunnelSavedAt(savedAt);

      // Optimistically update marketplace cache so front-end reflects changes immediately
      queryClient.setQueryData(QUERY_KEYS.marketplaceCombined, (prev: any) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          services: Array.isArray(prev.services)
            ? prev.services.map((s: any) =>
                s.id === selectedService.id
                  ? { ...s, funnel_content: funnelContent, pricing_tiers: pricingTiers }
                  : s
              )
            : prev.services,
        };
        return updated;
      });

      toast({
        title: 'Success',
        description: verified ? 'Service funnel saved and verified' : 'Service funnel saved',
      });
      // Refresh marketplace data so changes are visible immediately (non-blocking)
      supabase.functions.invoke('warm-marketplace-cache').catch((e) => console.warn('Cache warm failed', e));
      invalidateCache.invalidateAll();

      return { savedAt, verified };
    } catch (error) {
      console.error('Error saving funnel:', error);
      const err: any = error;
      const message = err?.message || err?.error_description || 'Failed to save funnel changes';
      const code = err?.code;
      toast({
        title: 'Save failed',
        description: code ? `${message} (code: ${code})` : message,
        variant: 'destructive',
      });
      return { savedAt: new Date().toISOString(), verified: false, message };
    }
  };
  const isPricingDirty = selectedService
    ? JSON.stringify(pricingTiers) !== JSON.stringify((selectedService as any).pricing_tiers || [])
    : false;

  const formatRelativeTime = (iso?: string | null) => {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 minute ago';
    return `${mins} minutes ago`;
  };

  const handleTabChange = (value: 'details' | 'pricing' | 'funnel') => {
    if (activeTab === 'pricing' && value !== 'pricing' && isPricingDirty) {
      const proceed = window.confirm('You have unsaved pricing changes. Save before leaving this tab?');
      if (proceed) {
        handleFunnelSave();
      }
    }
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
            <Button onClick={() => { setError(null); fetchServices(); }} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Management - Edit Service Cards & Funnels
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a service to edit its details, pricing, and funnel pages
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services by title, category, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedService?.id === service.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="secondary" className="text-[10px] shrink-0">#{service.sort_order ?? '-'}</Badge>
                              <h3 className="font-semibold truncate">{service.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Verified</span>
                              <Switch
                                checked={service.is_verified || false}
                                onCheckedChange={() => handleVerificationToggle(service.id, service.is_verified || false)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                            {service.is_verified && (
                              <Badge variant="default" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            {service.is_featured && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {service.is_top_pick && (
                              <Badge variant="outline" className="text-xs">
                                Top Pick
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {service.retail_price && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {service.retail_price}
                              </span>
                            )}
                            {(service.vendors?.name && service.vendors.name !== 'Circle Marketplace') && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {service.vendors.name}
                              </span>
                            )}
                            {(service.service_providers?.name && service.service_providers.name !== 'Circle Marketplace') && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {service.service_providers.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                  </CardContent>
                </Card>
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
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedService.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedService.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
              <Badge variant="secondary">
                {selectedService.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Service Details</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Features</TabsTrigger>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service Title</label>
                        <Input
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Input
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Duration</label>
                        <Input
                          value={editForm.duration || ''}
                          onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                          placeholder="e.g., 30 days"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ROI (%)</label>
                        <Input
                          type="number"
                          value={editForm.estimated_roi || ''}
                          onChange={(e) => setEditForm({ ...editForm, estimated_roi: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sort Order</label>
                        <Input
                          type="number"
                          value={editForm.sort_order || ''}
                          onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                     <div className="flex items-center space-x-2">
                       <Switch
                         checked={editForm.is_verified || false}
                         onCheckedChange={(checked) => setEditForm({ ...editForm, is_verified: checked })}
                       />
                       <label className="text-sm font-medium">Verified</label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Switch
                         checked={editForm.is_featured || false}
                         onCheckedChange={(checked) => setEditForm({ ...editForm, is_featured: checked })}
                       />
                       <label className="text-sm font-medium">Featured</label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Switch
                         checked={editForm.is_top_pick || false}
                         onCheckedChange={(checked) => setEditForm({ ...editForm, is_top_pick: checked })}
                       />
                       <label className="text-sm font-medium">Top Pick</label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Switch
                         checked={editForm.requires_quote || false}
                         onCheckedChange={(checked) => setEditForm({ ...editForm, requires_quote: checked })}
                       />
                       <label className="text-sm font-medium">Requires Quote</label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Switch
                         checked={editForm.copay_allowed || false}
                         onCheckedChange={(checked) => setEditForm({ ...editForm, copay_allowed: checked })}
                       />
                       <label className="text-sm font-medium">Co-Pay Allowed</label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Switch
                         checked={editForm.direct_purchase_enabled || false}
                         onCheckedChange={(checked) => setEditForm({ ...editForm, direct_purchase_enabled: checked })}
                       />
                       <div className="flex items-center gap-1">
                         <ShoppingCart className="h-3 w-3 text-green-600" />
                         <label className="text-sm font-medium">Direct Purchase</label>
                       </div>
                     </div>
                   </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       <div className="space-y-2">
                         <label className="text-sm font-medium">RESPA Split Limit %</label>
                         <Input
                           type="number"
                           min="0"
                           max="100"
                           value={editForm.respa_split_limit || ''}
                           onChange={(e) => setEditForm({ ...editForm, respa_split_limit: Number(e.target.value) })}
                           placeholder="0-100"
                         />
                       </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Non-SSP Split %</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.max_split_percentage_non_ssp || ''}
                          onChange={(e) => setEditForm({ ...editForm, max_split_percentage_non_ssp: Number(e.target.value) })}
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    {editForm.direct_purchase_enabled && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                            <ShoppingCart className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Direct Purchase Enabled</h4>
                            <p className="text-sm text-blue-700 mb-2">
                              This service will show a "Buy Now" option that bypasses consultation booking, 
                              reducing sales staff costs and allowing customers to purchase directly.
                            </p>
                            <div className="text-xs text-blue-600">
                              ✓ Customers can purchase instantly • ✓ Reduced acquisition costs • ✓ Direct to onboarding
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={handleServiceUpdate}>
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingDetails(false)}
                      >
                        Cancel
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
                        <p className="text-sm text-muted-foreground">Category: {selectedService.category}</p>
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

              <TabsContent value="pricing" className="space-y-4">
                <ServicePricingTiersEditor 
                  tiers={pricingTiers}
                  onChange={setPricingTiers}
                />
              </TabsContent>

              <TabsContent value="funnel" className="space-y-4">
                {showFunnelEditor ? (
                  <ServiceFunnelEditor
                    service={selectedService}
                    onUpdate={(updatedService) => {
                      setSelectedService(updatedService as Service);
                      setServices(services.map(s => s.id === updatedService.id ? updatedService as Service : s));
                      setShowFunnelEditor(false);
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Service Funnel Pages</h3>
                      <div className="flex items-center gap-3">
                        {lastFunnelSavedAt && (
                          <span className="text-xs text-muted-foreground">
                            Saved {formatRelativeTime(lastFunnelSavedAt)}
                          </span>
                        )}
                        {isPricingDirty && (
                          <Badge variant="outline" className="text-xs">Unsaved pricing</Badge>
                        )}
                        <Button variant="outline" onClick={() => setShowFunnelPreview(true)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Funnel
                        </Button>
                        <Button onClick={() => setShowFunnelEditor(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Funnel
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center py-8 border rounded-lg">
                      <p className="text-muted-foreground">Click "Edit Funnel" to customize this service's funnel pages</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create compelling sales funnels with hero sections, testimonials, and call-to-actions
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}


      {showFunnelPreview && selectedService && (
        <ServiceFunnelModal
          isOpen={showFunnelPreview}
          onClose={() => setShowFunnelPreview(false)}
          service={{
            ...(selectedService as any),
            funnel_content: funnelContent,
            pricing_tiers: pricingTiers,
            vendor: selectedService.vendors ? {
              name: selectedService.vendors.name,
              rating: selectedService.rating || 5,
              review_count: 25,
              is_verified: true
            } : null
          } as any}
        />
      )}
    </div>
  );
};
