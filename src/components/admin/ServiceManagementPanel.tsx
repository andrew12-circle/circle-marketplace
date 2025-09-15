// @ts-nocheck
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
import { ServiceFunnelModal } from '@/components/marketplace/ServiceFunnelModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvalidateMarketplace, QUERY_KEYS } from '@/hooks/useMarketplaceData';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ServiceConsultationEmails } from './ServiceConsultationEmails';
import { ServiceDisclaimerSection } from './ServiceDisclaimerSection';
import { ServiceAIResearchEditor } from './ServiceAIResearchEditor';
import { ServiceImageUploader } from './ServiceImageUploader';
import { useDebouncedServiceSave } from '@/hooks/useDebouncedServiceSave';
import { diffPatch } from '@/lib/diff';
import { dlog, dwarn } from '@/utils/debugLogger';
import { AIServiceUpdater } from './AIServiceUpdater';
import { updateServiceResilient } from '@/lib/resilientServiceUpdate';
import { ServiceComplianceTracker } from './ServiceComplianceTracker';
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
type SaveResult = {
  savedAt?: string;
  verified?: boolean;
  message?: string;
};
const safeParseJSON = (val: string) => {
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
};

// Helper function to compare values with proper type handling
const compareValues = (a: any, b: any): boolean => {
  // Handle null/undefined cases
  if (a === null || a === undefined) a = '';
  if (b === null || b === undefined) b = '';

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Handle numbers
  if (typeof a === 'number' || typeof b === 'number') {
    return Number(a) === Number(b);
  }

  // Handle booleans
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Boolean(a) === Boolean(b);
  }

  // Handle strings
  return String(a) === String(b);
};
export const ServiceManagementPanel = () => {
  const {
    toast
  } = useToast();
  const { invalidateAll: invalidateCache } = useInvalidateMarketplace();
  const queryClient = useQueryClient();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  // Auto-save system for marketplace settings
  const { debouncedSave, isSaving: isDebouncedSaving } = useDebouncedServiceSave({
    onSaveSuccess: async (id: string, result: any) => {
      console.log('[ServicePanel] Save successful', { id, result });
      
      // Update local state - get fresh data from the result
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
      if (selectedService?.id === id) {
        setSelectedService(prev => prev ? { ...prev, ...result } : null);
        setEditForm(prev => ({ ...prev, ...result }));
      }
      
      // Clear saving state
      setSaving(false);
      
      // Invalidate cache to ensure consistency
      await invalidateCache();
    },
    onSaveError: (id: string, error: any) => {
      console.error('[ServicePanel] Save failed', { id, error });
      setSaving(false);
    }
  });
  
  // Memoize service lookup for performance
  const serviceById = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  // Removed showFunnelEditor state - editor shows directly on funnel tab
  // Removed showFunnelPreview state - preview handled inside editor
  const [editForm, setEditForm] = useState<Partial<Service>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastFunnelSavedAt, setLastFunnelSavedAt] = useState<string | null>(null);
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
  useEffect(() => {
    fetchServices();
  }, []);
  
  useEffect(() => {
    const filtered = services.filter(service => service.title.toLowerCase().includes(searchTerm.toLowerCase()) || service.category?.toLowerCase().includes(searchTerm.toLowerCase()) || service.service_providers?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  // Sync editForm when selectedService changes (critical for form stability)
  useEffect(() => {
    if (selectedService) {
      setEditForm(selectedService);
    }
  }, [selectedService]);
  const fetchServices = async () => {
    try {
      setError(null);
      dlog('📋 ServiceManagementPanel: Fetching services...');

      // First try a simple query without the join to see if that's the issue
      const {
        data,
        error
      } = await supabase.from('services').select('*').order('sort_order', {
        ascending: true
      }).order('created_at', {
        ascending: false
      });
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
    setEditForm(service);
    setIsEditingDetails(false);
    // Removed setShowFunnelEditor(false) - editor shows directly on funnel tab

    // Load saved funnel content if present and normalize keys; otherwise seed from service
    const rawFunnel: any = (service as any).funnel_content;
    if (rawFunnel) {
      const parsed = typeof rawFunnel === 'string' ? safeParseJSON(rawFunnel) : rawFunnel;
      const merged: any = {
        ...funnelContent,
        ...(parsed || {})
      };
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
  const handleServiceUpdate = async () => {
    dlog('handleServiceUpdate called:', { selectedService: !!selectedService, saving, saveInProgress });
    
    if (!selectedService || saving || saveInProgress) {
      dlog('Early return from handleServiceUpdate:', { 
        hasSelectedService: !!selectedService, 
        saving, 
        saveInProgress 
      });
      return;
    }
    
    dlog('Starting save process...');
    setSaveInProgress(true);
    setSaving(true);
    try {
      dlog('Step 1: Starting validation...');
      
      // Basic required field validation
      if (!editForm.title || !editForm.category) {
        dlog('Validation failed: missing required fields');
        toast({
          title: 'Missing required fields',
          description: 'Please provide both Title and Category before saving.',
          variant: 'destructive'
        });
        return;
      }
      
      dlog('Step 2: Validation passed, processing numeric fields...');
      
      // Normalize numeric fields to match DB constraints
      let roi = editForm.estimated_roi ?? null;
      let respa = editForm.respa_split_limit ?? null;
      let nonSsp = editForm.max_split_percentage_non_ssp ?? null;
      const adjustments: string[] = [];

      // Allow high ROI values up to 10000%
      if (typeof roi === 'number') {
        if (roi > 10000) {
          roi = 10000;
          adjustments.push(`ROI capped at 10000%`);
        }
        if (roi < 0) {
          roi = 0;
          adjustments.push(`ROI cannot be negative`);
        }
      }
      if (typeof respa === 'number') {
        const original = respa;
        respa = Math.min(1000, Math.max(0, Math.round(respa)));
        if (respa !== original) adjustments.push(`RESPA split normalized to ${respa}%`);
      }
      if (typeof nonSsp === 'number') {
        const original = nonSsp;
        nonSsp = Math.min(1000, Math.max(0, Math.round(nonSsp)));
        if (nonSsp !== original) adjustments.push(`Non-SSP split normalized to ${nonSsp}%`);
      }
      if (adjustments.length) {
        toast({
          title: 'Adjusted values',
          description: adjustments.join(' • ')
        });
      }

      // Prepare update data with only valid database fields
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        duration: editForm.duration,
        setup_time: editForm.setup_time ?? null,
        estimated_roi: roi,
        sort_order: editForm.sort_order || null,
        is_featured: !!editForm.is_featured,
        is_top_pick: !!editForm.is_top_pick,
        is_verified: !!editForm.is_verified,
        requires_quote: !!editForm.requires_quote,
        copay_allowed: !!editForm.copay_allowed,
        direct_purchase_enabled: !!editForm.direct_purchase_enabled,
        respa_split_limit: respa,
        max_split_percentage_non_ssp: nonSsp,
        retail_price: editForm.retail_price ?? null,
        pro_price: editForm.pro_price ?? null,
        price_duration: editForm.price_duration ?? null,
        website_url: editForm.website_url ?? null,
        tags: Array.isArray(editForm.tags) ? editForm.tags : null,
        updated_at: new Date().toISOString()
      };
      
      // Filter out any undefined values that might cause issues
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      dlog('Step 3: Prepared update data, sending to database...');
      dlog('Updating service with cleaned data:', cleanUpdateData);
      dlog('Service ID:', selectedService.id);
      dlog('Update data keys:', Object.keys(cleanUpdateData));
      dlog('Update data types:', Object.entries(cleanUpdateData).map(([key, value]) => [key, typeof value, value]));
      
      let error = null;
      let result = null;
      
      try {
        // Add timeout to prevent hanging
        const updatePromise = supabase
          .from('services')
          .update(cleanUpdateData as any)
          .eq('id', selectedService.id as any);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database update timeout after 15 seconds')), 15000)
        );
        
        dlog('Step 4: Starting database update...');
        result = await Promise.race([updatePromise, timeoutPromise]) as any;
        error = result?.error;
        
        dlog('Step 5: Database update completed, result:', result);
      } catch (timeoutError) {
        console.error('Database update timed out:', timeoutError);
        toast({
          title: 'Database Timeout',
          description: 'The save operation took too long and timed out. Please try again.',
          variant: 'destructive'
        });
        throw timeoutError;
      }
      
      dlog('Step 6: Checking for database errors...');
      
      if (error) {
        console.error('Update error details:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          serviceId: selectedService.id,
          updateData: cleanUpdateData
        });
        toast({
          title: 'Failed to save service',
          description: `Database error: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
        throw error;
      }
      
      dlog('Step 7: No database error, fetching updated service...');
      
      // Fetch updated service to get latest data
      const {
        data: updatedServiceData,
        error: fetchError
      } = await supabase.from('services').select(`
          *,
          service_providers (name, logo_url)
        `).eq('id' as any, selectedService.id as any).single();
      if (fetchError) {
        console.error('Step 6: Fetch error:', fetchError);
        throw fetchError;
      }

      dlog('Step 7: Successfully fetched updated service, updating local state...');

      // Update local state with fresh data
      setSelectedService(updatedServiceData as any);
      setServices(services.map(s => s.id === selectedService.id ? updatedServiceData as any : s));
      setEditForm(updatedServiceData as any);

      // Optimistically update marketplace cache so front-end reflects changes immediately
      queryClient.setQueryData(QUERY_KEYS.marketplaceCombined, (prev: any) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          services: Array.isArray(prev.services) ? prev.services.map((s: any) => s.id === selectedService.id ? {
            ...s,
            ...(updatedServiceData as any)
          } : s) : prev.services
        };
        return updated;
      });
      // Narrow cache invalidation - only invalidate services, not everything
      invalidateCache.invalidateServices();
      
      dlog('Save completed successfully!');
      toast({
        title: 'Success',
        description: 'Service updated successfully'
      });
    } catch (error) {
      console.error('Error updating service:', error);
      const err: any = error;
      const code = err?.code || err?.status || '';
      const details = err?.details || err?.hint || err?.message || 'Failed to update service';
      const permissionHint = typeof details === 'string' && details.toLowerCase().includes('permission') || code === '42501';
      const isPrecisionError = code === '22003';
      toast({
        title: 'Error',
        description: isPrecisionError ? 'Numeric limit exceeded: use percentages below 1000 (e.g., 999.99) and valid 2‑decimal values.' : permissionHint ? 'You do not have permission to update services. Please ensure you are signed in as an admin.' : `${details}${code ? ` (code: ${code})` : ''}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      setSaveInProgress(false);
    }
  };
  const handleVerificationToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      const {
        error
      } = await (supabase.from('services').update as any)({
        is_verified: !currentStatus
      }).eq('id' as any, serviceId);
      if (error) throw error;

      // Update local state
      setServices(services.map(service => service.id === serviceId ? {
        ...service,
        is_verified: !currentStatus
      } : service));
      if (selectedService?.id === serviceId) {
        const updatedService = {
          ...selectedService,
          is_verified: !currentStatus
        };
        setSelectedService(updatedService);
        setEditForm(updatedService);
      }
      toast({
        title: 'Success',
        description: `Service ${!currentStatus ? 'verified' : 'unverified'} successfully`
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive'
      });
    }
  };
  const handleVisibilityToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      const {
        error
      } = await (supabase.from('services').update as any)({
        is_active: !currentStatus
      }).eq('id' as any, serviceId);
      if (error) throw error;

      // Update local state
      setServices(services.map(service => service.id === serviceId ? {
        ...service,
        is_active: !currentStatus
      } : service));
      if (selectedService?.id === serviceId) {
        const updatedService = {
          ...selectedService,
          is_active: !currentStatus
        };
        setSelectedService(updatedService);
        setEditForm(updatedService);
      }
      toast({
        title: 'Success',
        description: `Service ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update visibility status',
        variant: 'destructive'
      });
    }
  };
  const handleAffiliateToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      const {
        error
      } = await (supabase.from('services').update as any)({
        is_affiliate: !currentStatus
      }).eq('id' as any, serviceId);
      if (error) throw error;

      // Update local state
      setServices(services.map(service => service.id === serviceId ? {
        ...service,
        is_affiliate: !currentStatus
      } : service));
      if (selectedService?.id === serviceId) {
        const updatedService = {
          ...selectedService,
          is_affiliate: !currentStatus
        };
        setSelectedService(updatedService);
        setEditForm(updatedService);
      }
      toast({
        title: 'Success',
        description: `Service affiliate status ${!currentStatus ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update affiliate status',
        variant: 'destructive'
      });
    }
  };
  const handleBookingLinkToggle = async (serviceId: string, currentStatus: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      const {
        error
      } = await (supabase.from('services').update as any)({
        is_booking_link: !currentStatus
      }).eq('id' as any, serviceId);
      if (error) throw error;

      // Update local state
      setServices(services.map(service => service.id === serviceId ? {
        ...service,
        is_booking_link: !currentStatus
      } : service));
      if (selectedService?.id === serviceId) {
        const updatedService = {
          ...selectedService,
          is_booking_link: !currentStatus
        };
        setSelectedService(updatedService);
        setEditForm(updatedService);
      }
      toast({
        title: 'Success',
        description: `Service booking link ${!currentStatus ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating booking link status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking link status',
        variant: 'destructive'
      });
    }
  };
  const handleFunnelSave = async (): Promise<SaveResult> => {
    if (!selectedService) return {
      savedAt: new Date().toISOString(),
      verified: false
    };
    try {
      // Save the funnel content to the database
      const {
        error: updateError
      } = await (supabase.from('services').update as any)({
        funnel_content: JSON.parse(JSON.stringify(funnelContent)),
        pricing_tiers: JSON.parse(JSON.stringify(pricingTiers))
      }).eq('id' as any, selectedService.id);
      if (updateError) throw updateError;

      // Read back to verify persistence with detailed logging
      const {
        data: verifyRow,
        error: fetchError
      } = await supabase.from('services').select('id, funnel_content, pricing_tiers, updated_at').eq('id' as any, selectedService.id as any).single();
      if (fetchError) throw fetchError;
      
      const rowData = verifyRow as any;
      console.log("🔍 Fresh row data from database:", {
        id: rowData?.id,
        funnelContentSize: JSON.stringify(rowData?.funnel_content || {}).length,
        pricingTiersSize: JSON.stringify(rowData?.pricing_tiers || {}).length,
        updatedAt: rowData?.updated_at
      });
      
      const savedAt = rowData?.updated_at || new Date().toISOString();
      const verified = !!rowData && JSON.stringify(rowData.funnel_content ?? null) === JSON.stringify(funnelContent) && JSON.stringify(rowData.pricing_tiers ?? null) === JSON.stringify(pricingTiers);

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
          services: Array.isArray(prev.services) ? prev.services.map((s: any) => s.id === selectedService.id ? {
            ...s,
            funnel_content: funnelContent,
            pricing_tiers: pricingTiers
          } : s) : prev.services
        };
        return updated;
      });
      // Enhanced success feedback with debugging info
      const payloadSize = JSON.stringify(funnelContent).length + JSON.stringify(pricingTiers).length;
      console.log("💾 Save completed:", { verified, payloadSize, serviceName: selectedService.title });
      
      if (payloadSize > 50000) {
        console.warn("⚠️ Large payload detected:", { payloadSize, serviceName: selectedService.title });
      }
      
      toast({
        title: 'Success',
        description: verified 
          ? `Service funnel saved and verified (${Math.round(payloadSize/1024)}KB)` 
          : `Service funnel saved (${Math.round(payloadSize/1024)}KB) - verification pending`
      });
      
      // Broad cache invalidation to ensure all marketplace data refreshes
      invalidateCache.invalidateAll();
      
      // Warm cache with fresh data after invalidation
      setTimeout(() => {
        console.log("🔄 Warming cache after save...");
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.services });
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.marketplaceCombined });
      }, 100);
      return {
        savedAt,
        verified
      };
    } catch (error) {
      console.error('❌ Error saving funnel:', error);
      const err: any = error;
      
      // Enhanced error messaging for common issues
      let message = err?.message || err?.error_description || 'Failed to save funnel changes';
      if (message.includes('permission') || message.includes('RLS')) {
        message = 'Permission denied: Admin access required to save service data';
      } else if (message.includes('timeout')) {
        message = 'Save timed out - please try again with smaller changes';
      } else if (message.includes('JSON')) {
        message = 'Invalid data format - please check for special characters';
      }
      
      console.error('💥 Save failed with enhanced error:', { originalError: err?.message, enhancedMessage: message });
      const code = err?.code;
      toast({
        title: 'Save failed',
        description: code ? `${message} (code: ${code})` : message,
        variant: 'destructive'
      });
      return {
        savedAt: new Date().toISOString(),
        verified: false,
        message
      };
    }
  };
  const handleTabChange = (value: 'details' | 'funnel') => {
    setActiveTab(value);
  };
  const detailKeys = ['title', 'description', 'category', 'duration', 'estimated_roi', 'sort_order', 'is_featured', 'is_top_pick', 'is_verified', 'requires_quote', 'copay_allowed', 'direct_purchase_enabled', 'respa_split_limit', 'max_split_percentage_non_ssp', 'retail_price', 'pro_price', 'price_duration', 'tags'] as const;
  const isDetailsDirty = selectedService ? detailKeys.some(key => {
    const currentValue = (editForm as any)[key];
    const originalValue = (selectedService as any)[key];
    const isDifferent = !compareValues(currentValue, originalValue);
    
    // Only log when DEBUG is enabled to prevent render cascade
    if (isDifferent) {
      dlog(`Field ${key} is dirty:`, { current: currentValue, original: originalValue });
    }
    
    return isDifferent;
  }) : false;
  const formatRelativeTime = (iso?: string | null) => {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 minute ago';
    return `${mins} minutes ago`;
  };
  if (loading) {
    return <p>Loading services...</p>;
  }
  if (error) {
    return <div className="p-6">
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
      </div>;
  }
  return <div className="space-y-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Management - Edit Service Cards & Funnels
            <Button variant="outline" size="sm" onClick={async () => {
            try {
              const {
                data: adminStatus,
                error
              } = await supabase.rpc('get_user_admin_status');
              const {
                data: session
              } = await supabase.auth.getSession();
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
                <Input placeholder="Search services, categories, or companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
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

            {filteredServices.length === 0 && <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No services found matching your search.' : 'No services available.'}
              </p>}
          </div>
        </CardContent>
      </Card>

      {selectedService && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editing: {selectedService.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedService.website_url && <Button variant="outline" size="sm" asChild>
                  <a href={selectedService.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>}
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
                {isEditingDetails ? <div className="space-y-4">
                    {/* Current Performance Metrics (Read-only) */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                      <h4 className="font-medium text-gray-900">Current Performance</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{selectedService.rating || 'No rating'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{selectedService.review_count || 0}</div>
                          <p className="text-xs text-muted-foreground">Reviews</p>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{selectedService.sort_order || '-'}</div>
                          <p className="text-xs text-muted-foreground">Sort Order</p>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{selectedService.is_verified ? 'Yes' : 'No'}</div>
                          <p className="text-xs text-muted-foreground">Verified</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ratings and reviews are managed automatically. Sort order and verification status can be changed below.
                      </p>
                    </div>
                    
                    {/* Live Preview Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50">
                      <h4 className="font-medium text-purple-900">Card Preview</h4>
                      <p className="text-xs text-muted-foreground">Preview how your changes will appear on service cards</p>
                      
                      <div className="bg-white p-4 rounded-lg border shadow-sm max-w-sm">
                        <div className="flex items-start gap-3 mb-3">
                          {editForm.profile_image_url ? <img src={editForm.profile_image_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {(editForm.title || selectedService.title || 'S').charAt(0).toUpperCase()}
                              </span>
                            </div>}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-2">
                              {selectedService.title || 'Service Title'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {editForm.category || selectedService.category || 'Category'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                          {selectedService.description || 'Service description will appear here...'}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            {selectedService.duration || 'Duration not set'}
                          </span>
                          <span className="font-medium">
                            {selectedService.retail_price || 'Price TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isDetailsDirty && <Badge variant="outline" className="text-xs">Unsaved changes</Badge>}
                    {/* Basic service info is managed in Service Funnel tab */}

                      {/* Category and Classification */}
                      <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                        <h4 className="font-medium text-green-900">Category & Classification</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-green-900">Primary Category</label>
                            <p className="text-xs text-muted-foreground">Main category for filtering (shown prominently on cards)</p>
                            <Input value={editForm.category || ''} onChange={e => {
                              const newForm = { ...editForm, category: e.target.value };
                              setEditForm(newForm);
                              if (selectedService) {
                                const patch = diffPatch(selectedService, newForm);
                                if (Object.keys(patch).length > 0) {
                                  debouncedSave(selectedService.id, patch);
                                }
                              }
                            }} placeholder="e.g., Marketing, CRM, Lead Generation" className="bg-white" />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-green-900">Search Keywords</label>
                            <p className="text-xs text-muted-foreground">Additional searchable terms (comma-separated)</p>
                            <Input value={(editForm.tags || []).filter(tag => !tag.startsWith('cat:')).join(', ')} onChange={e => {
                      const categoryTags = (editForm.tags || []).filter(tag => tag.startsWith('cat:'));
                      const additionalTags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setEditForm({
                        ...editForm,
                        tags: [...categoryTags, ...additionalTags]
                      });
                    }} placeholder="automation, lead-gen, crm, marketing" className="bg-white" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Duration and setup time are managed in Service Funnel tab */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ROI (%)</label>
                        <div className="relative">
                          {!editForm.is_verified ? <Input value="TBD" disabled className="pr-8 text-muted-foreground" /> : <Input type="number" min="0" max="10000" step="0.1" value={editForm.estimated_roi || ''} onChange={e => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      setEditForm({
                        ...editForm,
                        estimated_roi: value
                      });
                    }} placeholder="Enter ROI percentage (e.g., 1200 for 1200%)" className="pr-8" />}
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {!editForm.is_verified ? 'ROI will show TBD until service is verified' : 'Enter the ROI as a percentage. Values can go beyond 1000% (e.g., 1200 for 1200%)'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sort Order</label>
                        <Input type="number" value={editForm.sort_order || ''} onChange={e => {
                          const newForm = { ...editForm, sort_order: Number(e.target.value) };
                          setEditForm(newForm);
                          if (selectedService) {
                            const patch = diffPatch(selectedService, newForm);
                            if (Object.keys(patch).length > 0) {
                              debouncedSave(selectedService.id, patch);
                            }
                          }
                        }} />
                      </div>
                    </div>

                    {/* Pricing is managed in Service Funnel tab */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quick Category Tags</label>
                        <p className="text-xs text-muted-foreground">
                          Select relevant categories to help users find your service. These sync with the marketplace filtering system.
                        </p>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                    // Digital-first categories
                    {
                      tag: 'cat:crms',
                      label: 'CRMs'
                    }, {
                      tag: 'cat:ads-lead-gen',
                      label: 'Ads & Lead Gen'
                    }, {
                      tag: 'cat:website-idx',
                      label: 'Website / IDX'
                    }, {
                      tag: 'cat:seo',
                      label: 'SEO'
                    }, {
                      tag: 'cat:coaching',
                      label: 'Coaching'
                    }, {
                      tag: 'cat:marketing-automation',
                      label: 'Marketing Automation & Content'
                    }, {
                      tag: 'cat:video-media',
                      label: 'Video & Media Tools'
                    }, {
                      tag: 'cat:listing-showing',
                      label: 'Listing & Showing Tools'
                    }, {
                      tag: 'cat:data-analytics',
                      label: 'Data & Analytics'
                    }, {
                      tag: 'cat:finance-business',
                      label: 'Finance & Business Tools'
                    }, {
                      tag: 'cat:productivity',
                      label: 'Productivity & Collaboration'
                    }, {
                      tag: 'cat:virtual-assistants',
                      label: 'Virtual Assistants & Dialers'
                    }, {
                      tag: 'cat:team-recruiting',
                      label: 'Team & Recruiting Tools'
                    }, {
                      tag: 'cat:ce-licensing',
                      label: 'CE & Licensing'
                    },
                    // Old-school categories
                    {
                      tag: 'cat:client-events',
                      label: 'Client Event Kits'
                    }, {
                      tag: 'cat:print-mail',
                      label: 'Print & Mail'
                    }, {
                      tag: 'cat:signs',
                      label: 'Signage & Branding'
                    }, {
                      tag: 'cat:presentations',
                      label: 'Presentations'
                    }, {
                      tag: 'cat:branding',
                      label: 'Branding'
                    }, {
                      tag: 'cat:client-retention',
                      label: 'Client Retention'
                    }, {
                      tag: 'cat:transaction-coordinator',
                      label: 'Transaction Coordinator'
                    }].map(({
                      tag,
                      label
                    }) => <div key={tag} className="flex items-center space-x-2">
                              <Switch checked={(editForm.tags || []).includes(tag)} onCheckedChange={checked => {
                                const currentTags = editForm.tags || [];
                                let newTags;
                                if (checked) {
                                  newTags = [...currentTags, tag];
                                  setEditForm({
                                    ...editForm,
                                    tags: newTags
                                  });
                                } else {
                                  newTags = currentTags.filter(t => t !== tag);
                                  setEditForm({
                                    ...editForm,
                                    tags: newTags
                                  });
                                }
                                
                                // Trigger debounced save for category tag change
                                if (selectedService?.id) {
                                  debouncedSave(selectedService.id, { tags: newTags }, 'category-tag-change');
                                }
                              }} />
                              <label className="text-xs font-medium">{label}</label>
                            </div>)}
                        </div>
                         <div className="mt-2">
                           <label className="text-sm font-medium">Additional Search Keywords</label>
                           <p className="text-xs text-muted-foreground">Extra searchable terms beyond the standard categories (comma-separated)</p>
                            <Input value={(editForm.tags || []).filter(tag => !tag.startsWith('cat:')).join(', ')} onChange={e => {
                              const categoryTags = (editForm.tags || []).filter(tag => tag.startsWith('cat:'));
                              const additionalTags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              const newTags = [...categoryTags, ...additionalTags];
                              setEditForm({
                                ...editForm,
                                tags: newTags
                              });
                              
                              // Trigger debounced save for tags change
                              if (selectedService?.id) {
                                debouncedSave(selectedService.id, { tags: newTags }, 'tags-change');
                              }
                            }} placeholder="automation, luxury, enterprise, local" />
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                     <div className="flex items-center space-x-2">
                        <Switch checked={editForm.is_verified || false} onCheckedChange={checked => {
                          setEditForm({
                            ...editForm,
                            is_verified: checked
                          });
                          
                          // Trigger debounced save for verified status change
                          if (selectedService?.id) {
                            debouncedSave(selectedService.id, { is_verified: checked }, 'verified-change');
                          }
                        }} />
                       <label className="text-sm font-medium">Verified</label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <Switch checked={editForm.is_featured || false} onCheckedChange={checked => {
                          setEditForm({
                            ...editForm,
                            is_featured: checked
                          });
                          
                          // Trigger debounced save for featured status change
                          if (selectedService?.id) {
                            debouncedSave(selectedService.id, { is_featured: checked }, 'featured-change');
                          }
                        }} />
                       <label className="text-sm font-medium">Featured</label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <Switch checked={editForm.is_top_pick || false} onCheckedChange={checked => {
                          setEditForm({
                            ...editForm,
                            is_top_pick: checked
                          });
                          
                          // Trigger debounced save for top pick status change
                          if (selectedService?.id) {
                            debouncedSave(selectedService.id, { is_top_pick: checked }, 'top-pick-change');
                          }
                        }} />
                       <label className="text-sm font-medium">Top Pick</label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <Switch checked={editForm.requires_quote || false} onCheckedChange={checked => {
                          setEditForm({
                            ...editForm,
                            requires_quote: checked
                          });
                          
                          // Trigger debounced save for requires quote change
                          if (selectedService?.id) {
                            debouncedSave(selectedService.id, { requires_quote: checked }, 'requires-quote-change');
                          }
                        }} />
                       <label className="text-sm font-medium">Requires Quote</label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <Switch checked={editForm.copay_allowed || false} onCheckedChange={checked => {
                          setEditForm({
                            ...editForm,
                            copay_allowed: checked
                          });
                          
                          // Trigger debounced save for copay allowed change
                          if (selectedService?.id) {
                            debouncedSave(selectedService.id, { copay_allowed: checked }, 'copay-allowed-change');
                          }
                        }} />
                       <label className="text-sm font-medium">Co-Pay Allowed</label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <Switch checked={editForm.direct_purchase_enabled || false} onCheckedChange={checked => {
                          setEditForm({
                            ...editForm,
                            direct_purchase_enabled: checked
                          });
                          
                          // Trigger debounced save for direct purchase change
                          if (selectedService?.id) {
                            debouncedSave(selectedService.id, { direct_purchase_enabled: checked }, 'direct-purchase-change');
                          }
                        }} />
                       <div className="flex items-center gap-1">
                         <ShoppingCart className="h-3 w-3 text-green-600" />
                         <label className="text-sm font-medium">Direct Purchase</label>
                       </div>
                     </div>
                   </div>

                    <div className="space-y-4">
                      {/* SSP Coverage Section */}
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="text-sm font-semibold mb-3">Settlement Service Provider Coverage</h4>
                        <div className="flex items-center space-x-2 mb-3">
                          <Switch checked={editForm.ssp_allowed !== false} onCheckedChange={checked => {
                            const updatedForm = {
                              ...editForm,
                              ssp_allowed: checked
                            };
                            setEditForm(updatedForm);
                            
                            // Trigger debounced save for SSP setting change
                            if (selectedService?.id) {
                              debouncedSave(selectedService.id, { ssp_allowed: checked }, 'ssp-allowed-change');
                            }
                          }} />
                          <label className="text-sm font-medium">SSP Allowed</label>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Max SSP Percentage (0–100)</label>
                          <div className="relative">
                             <Input type="number" min="0" max="100" step="1" className="pr-10" disabled={editForm.ssp_allowed === false} value={editForm.ssp_allowed === false ? 0 : editForm.max_split_percentage_ssp || ''} onChange={e => {
                              const value = Number(e.target.value);
                              if (value >= 0 && value <= 100) {
                                setEditForm({
                                  ...editForm,
                                  max_split_percentage_ssp: value
                                });
                                
                                // Trigger debounced save for max SSP percentage change
                                if (selectedService?.id) {
                                  debouncedSave(selectedService.id, { max_split_percentage_ssp: value }, 'max-ssp-percentage-change');
                                }
                              }
                            }} placeholder="Enter percentage" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                          {editForm.max_split_percentage_ssp && (editForm.max_split_percentage_ssp < 0 || editForm.max_split_percentage_ssp > 100) && <p className="text-red-500 text-xs">Percentage must be between 0 and 100</p>}
                        </div>
                      </div>

                      {/* Non-SSP Coverage Section */}
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <h4 className="text-sm font-semibold mb-3">Non-Settlement Service Provider Coverage</h4>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Max Non-SSP Percentage (0–100)</label>
                          <div className="relative">
                             <Input type="number" min="0" max="100" step="1" className="pr-10" value={editForm.max_split_percentage_non_ssp || ''} onChange={e => {
                              const value = Number(e.target.value);
                              if (value >= 0 && value <= 100) {
                                setEditForm({
                                  ...editForm,
                                  max_split_percentage_non_ssp: value
                                });
                                
                                // Trigger debounced save for max non-SSP percentage change
                                if (selectedService?.id) {
                                  debouncedSave(selectedService.id, { max_split_percentage_non_ssp: value }, 'max-non-ssp-percentage-change');
                                }
                              }
                            }} placeholder="Enter percentage" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                          {editForm.max_split_percentage_non_ssp && (editForm.max_split_percentage_non_ssp < 0 || editForm.max_split_percentage_non_ssp > 100) && <p className="text-red-500 text-xs">Percentage must be between 0 and 100</p>}
                        </div>
                      </div>
                    </div>

                    {editForm.direct_purchase_enabled && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                            <ShoppingCart className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Direct Purchase Enabled</h4>
                            <p className="text-sm text-blue-700 mb-2">
                              This service will show a "Buy Now" button that redirects to your Purchase URL below,
                              bypassing consultation booking and allowing customers to purchase directly.
                            </p>
                            <div className="text-xs text-blue-600">
                              ✓ Customers can purchase instantly • ✓ Reduced acquisition costs • ✓ Direct to checkout
                            </div>
                          </div>
                        </div>

                         {/* Website/Purchase URL Field - Only shown when direct purchase is enabled */}
                         <div className="space-y-2">
                           <label className="text-sm font-medium text-blue-900">Website / Purchase URL</label>
                            <Input value={editForm.website_url || ''} onChange={e => {
                              const newForm = { ...editForm, website_url: e.target.value };
                              setEditForm(newForm);
                              if (selectedService) {
                                const patch = diffPatch(selectedService, newForm);
                                if (Object.keys(patch).length > 0) {
                                  debouncedSave(selectedService.id, patch);
                                }
                              }
                            }} placeholder="https://example.com/checkout or https://calendly.com/yourlink" className="bg-white" />
                           <p className="text-xs text-blue-600">
                             Official website or direct purchase/booking link. Used for "View Website" and "Buy Now" buttons.
                           </p>
                         </div>
                       </div>}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        if (selectedService) {
                          setEditForm(selectedService);
                          setIsEditingDetails(false);
                        }
                      }}>
                        Cancel
                      </Button>
                      {isDebouncedSaving && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          Auto-saving...
                        </div>
                      )}
                    </div>
                  </div> : <div className="space-y-4">
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
                        <div className="text-sm text-muted-foreground">
                          <span>Primary Category: {selectedService.category || 'Not set'}</span>
                          {selectedService.tags && selectedService.tags.length > 0 && <div className="mt-1">
                              <span>Tags: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedService.tags.map((tag: string, index: number) => <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>)}
                              </div>
                            </div>}
                        </div>
                        <p className="text-sm text-muted-foreground">Duration: {selectedService.duration || 'Not set'}</p>
                        <p className="text-sm text-muted-foreground">ROI: {selectedService.estimated_roi || 0}%</p>
                        <p className="text-sm text-muted-foreground">
                          Purchase URL: {selectedService.website_url ? <a href={selectedService.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              {selectedService.website_url}
                            </a> : 'Not set'}
                        </p>
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
                  </div>}
              </TabsContent>

              <TabsContent value="disclaimer" className="space-y-4">
                <ServiceDisclaimerSection serviceId={selectedService.id} serviceName={selectedService.title} />
              </TabsContent>

              <TabsContent value="ai-research" className="space-y-4">
                <ServiceAIResearchEditor serviceId={selectedService.id} serviceName={selectedService.title} />
              </TabsContent>

              <TabsContent value="funnel" className="space-y-4">
                <div className="space-y-4">
                <ServiceFunnelEditor service={selectedService} onUpdate={updatedService => {
                dlog("[ServiceManagementPanel] Received updated service from funnel editor:", {
                  id: updatedService.id,
                  retail_price: updatedService.retail_price,
                  pro_price: updatedService.pro_price,
                  co_pay_price: updatedService.co_pay_price
                });

                // CRITICAL: Replace entire service object by ID (no mutation)
                setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService as Service : s));

                // Also update selected service if it matches
                setSelectedService(prev => prev && prev.id === updatedService.id ? updatedService as Service : prev);
                
                // Update editForm to sync with the new selected service data
                if (selectedService && selectedService.id === updatedService.id) {
                  setEditForm(updatedService as Service);
                }
                
                dlog("[ServiceManagementPanel] Updated services state with fresh pricing data");
              }} />
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <ServiceComplianceTracker serviceId={selectedService.id} serviceName={selectedService.title} />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <ServiceConsultationEmails serviceId={selectedService.id} serviceName={selectedService.title} initialEmails={(selectedService as any).consultation_emails || []} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>}

      {/* AI Service Updater */}
      <AIServiceUpdater services={services} onServiceUpdate={serviceId => {
      // Invalidate queries to trigger refresh without full refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.services
      });
      toast({
        title: 'Service Updated',
        description: 'Service has been updated by AI. Please review and verify the changes.'
      });
    }} />
    </div>;
};