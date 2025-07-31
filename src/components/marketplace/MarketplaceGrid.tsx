import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ServiceCard } from "./ServiceCard";
import { EnhancedVendorCard } from "./EnhancedVendorCard";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { CampaignServicesHeader } from "./CampaignServicesHeader";
import { CircleProBanner } from "./CircleProBanner";
import { ServiceDetailsModal } from "./ServiceDetailsModal";
import { AddProductModal } from "./AddProductModal";
import { LocationFilterBanner } from "./LocationFilterBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles, Zap, Facebook, Globe, Mail, Share2, Monitor, TrendingUp, Database, Camera, Video, Printer, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { determineServiceRisk } from "./RESPAComplianceSystem";

interface FilterState {
  category: string;
  priceRange: number[];
  verified: boolean;
  featured: boolean;
  coPayEligible: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  vendor: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  };
}

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  mls_areas?: string[];
  service_radius_miles?: number;
  license_states?: string[];
  latitude?: number;
  longitude?: number;
  vendor_type?: string;
  local_representatives?: any; // JSON data from database
}

interface LocalRepresentative {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  license_number?: string;
  nmls_id?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

type ViewMode = "services" | "products" | "vendors";

export const MarketplaceGrid = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("services");
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  
  // Define product categories with enhanced styling
  const PRODUCT_CATEGORIES = [
    { 
      id: 'facebook-ads', 
      name: 'Facebook Ad Campaigns', 
      description: 'Professional Facebook advertising services for real estate',
      icon: Facebook,
      gradient: 'from-blue-500 to-blue-600',
      color: 'text-blue-600'
    },
    { 
      id: 'google-ads', 
      name: 'Google Ad Campaigns', 
      description: 'Google Ads and search marketing services',
      icon: Globe,
      gradient: 'from-green-500 to-green-600',
      color: 'text-green-600'
    },
    { 
      id: 'direct-mail', 
      name: 'Direct Mail Campaigns', 
      description: 'Postcards, flyers, and targeted mail services',
      icon: Mail,
      gradient: 'from-purple-500 to-purple-600',
      color: 'text-purple-600'
    },
    { 
      id: 'social-media', 
      name: 'Social Media Management', 
      description: 'Complete social media marketing packages',
      icon: Share2,
      gradient: 'from-pink-500 to-pink-600',
      color: 'text-pink-600'
    },
    { 
      id: 'website-design', 
      name: 'Website Design', 
      description: 'Professional real estate websites and landing pages',
      icon: Monitor,
      gradient: 'from-indigo-500 to-indigo-600',
      color: 'text-indigo-600'
    },
    { 
      id: 'seo-services', 
      name: 'SEO Services', 
      description: 'Search engine optimization for real estate',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      color: 'text-orange-600'
    },
    { 
      id: 'crm-tools', 
      name: 'CRM & Lead Management', 
      description: 'Customer relationship management systems',
      icon: Database,
      gradient: 'from-teal-500 to-teal-600',
      color: 'text-teal-600'
    },
    { 
      id: 'photography', 
      name: 'Real Estate Photography', 
      description: 'Professional listing photography services',
      icon: Camera,
      gradient: 'from-yellow-500 to-yellow-600',
      color: 'text-yellow-600'
    },
    { 
      id: 'videography', 
      name: 'Video Marketing', 
      description: 'Real estate video production and marketing',
      icon: Video,
      gradient: 'from-red-500 to-red-600',
      color: 'text-red-600'
    },
    { 
      id: 'print-marketing', 
      name: 'Print Marketing Materials', 
      description: 'Business cards, brochures, and signage',
      icon: Printer,
      gradient: 'from-gray-500 to-gray-600',
      color: 'text-gray-600'
    },
  ];
  const [savedServiceIds, setSavedServiceIds] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isLocationFilterActive, setIsLocationFilterActive] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    priceRange: [0, 2000],
    verified: false,
    featured: false,
    coPayEligible: false,
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { location } = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (profile?.user_id) {
      loadSavedServices();
    }
  }, [profile?.user_id]);

  const loadSavedServices = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('saved_services')
        .select('service_id')
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setSavedServiceIds(data?.map(item => item.service_id) || []);
    } catch (error) {
      console.error('Error loading saved services:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load services with vendor information
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          vendor:vendors (
            name,
            rating,
            review_count,
            is_verified
          )
        `);

      if (servicesError) throw servicesError;

      // Load vendors with location filtering
      let vendorQuery = supabase
        .from('vendors_with_local_reps')
        .select('*')
        .order('rating', { ascending: false });

      const { data: vendorsData, error: vendorsError } = await vendorQuery;

      if (vendorsError) throw vendorsError;

      // Convert the database response to match our interface
      const formattedServices = (servicesData || []).map(service => ({
        ...service,
        discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
      }));
      
      setServices(formattedServices);
      
      // Format vendors data and parse JSON representatives
      const formattedVendors = (vendorsData || []).map(vendor => ({
        ...vendor,
        local_representatives: vendor.local_representatives || []
      }));
      
      setVendors(formattedVendors);
    } catch (error) {
      // Log error for internal tracking without exposing details
      const errorId = Date.now();
      toast({
        title: "Error loading data",
        description: "Failed to load marketplace data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract numeric price from strings like "$150" or "150"
  const extractNumericPrice = (priceString: string | null | undefined): number => {
    if (!priceString) return 0;
    // Remove currency symbols, commas, and other non-numeric characters except decimal points
    const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
    return parseFloat(cleanedPrice) || 0;
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === "all" || service.category === filters.category;
    
    // Fix price filtering to handle currency symbols
    const priceValue = extractNumericPrice(service.retail_price);
    const matchesPrice = priceValue >= filters.priceRange[0] && priceValue <= filters.priceRange[1];
    const matchesVerified = !filters.verified || service.vendor?.is_verified;
    const matchesFeatured = !filters.featured || service.is_featured;

    // Co-pay eligibility filtering
    let matchesCoPayEligible = true;
    if (filters.coPayEligible) {
      const category = service.category?.toLowerCase() || '';
      const title = service.title?.toLowerCase() || '';
      const tags = service.tags?.map(tag => tag.toLowerCase()) || [];
      
      // Safe for co-pay (True advertising)
      const safeKeywords = [
        'digital ads', 'facebook ads', 'google ads', 'display ads', 'retargeting',
        'postcards', 'direct mail', 'flyers', 'door hangers', 'brochures',
        'educational', 'seminar', 'workshop', 'market report', 'buyer education',
        'joint advertising', 'co-branded', 'print advertising'
      ];
      
      // Never allow co-pay (Business tools/lead generation)
      const restrictedKeywords = [
        'crm', 'lead capture', 'lead generation', 'funnel', 'drip email',
        'follow-up', 'seo', 'landing page', 'chatbot', 'sms', 'automation',
        'business card', 'sign', 'social media management', 'posting',
        'content calendar', 'listing video', 'drone', 'agent video',
        'testimonial', 'open house', 'appreciation', 'pop-by', 'gift',
        'closing gift', 'referral', 'past client', 'database', 'strategy',
        'coaching', 'consulting', 'accountability'
      ];
      
      const hasRestricted = restrictedKeywords.some(keyword => 
        title.includes(keyword) || category.includes(keyword) || 
        tags.some(tag => tag.includes(keyword))
      );
      
      const hasSafe = safeKeywords.some(keyword => 
        title.includes(keyword) || category.includes(keyword) || 
        tags.some(tag => tag.includes(keyword))
      );
      
    // Only show services that are eligible for co-pay (safe keywords and no restricted keywords)
      matchesCoPayEligible = hasSafe && !hasRestricted;
    }

    return matchesSearch && matchesCategory && matchesPrice && matchesVerified && matchesFeatured && matchesCoPayEligible;
  });

  const filteredVendors = vendors.filter(vendor => {
    // Skip null vendors
    if (!vendor) return false;
    
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVerified = !filters.verified || vendor.is_verified;
    
    // Location-based filtering
    let matchesLocation = true;
    if (isLocationFilterActive && location?.state) {
      matchesLocation = vendor.license_states?.includes(location.state) ||
                       vendor.service_states?.includes(location.state) ||
                       false;
    }

    return matchesSearch && matchesVerified && matchesLocation;
  });

  // Count local vendors for the banner
  const localVendorCount = location?.state ? vendors.filter(vendor => 
    vendor && (vendor.license_states?.includes(location.state) ||
    vendor.service_states?.includes(location.state))
  ).length : 0;

  // Get categories based on view mode
  const getCategories = () => {
    switch (viewMode) {
      case 'services':
        return Array.from(new Set(services.map(s => s.category).filter(category => category && category.trim() !== "")));
      case 'vendors':
        return []; // CategoryMegaMenu has its own vendor categories
      case 'products':
        return []; // CategoryMegaMenu has its own product categories
      default:
        return [];
    }
  };

  // Filter product categories based on search term
  const filteredProducts = PRODUCT_CATEGORIES.filter(product => {
    if (!searchTerm) return true;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSaveService = async (serviceId: string) => {
    if (!profile?.user_id) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save services.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already saved
      const { data: existingSave } = await supabase
        .from('saved_services')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('service_id', serviceId)
        .maybeSingle();

      if (existingSave) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_services')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('service_id', serviceId);

        if (error) throw error;

        // Update local state
        setSavedServiceIds(prev => prev.filter(id => id !== serviceId));

        toast({
          title: "Removed from saved",
          description: "Service removed from your saved list",
        });
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_services')
          .insert({
            user_id: profile.user_id,
            service_id: serviceId,
            notes: ''
          });

        if (error) throw error;

        // Update local state
        setSavedServiceIds(prev => [...prev, serviceId]);

        toast({
          title: "Saved successfully",
          description: "Service added to your saved list",
        });
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewServiceDetails = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setIsServiceModalOpen(true);
    }
  };

  const handleCloseServiceModal = () => {
    setIsServiceModalOpen(false);
    setSelectedService(null);
  };

  const handleConnectVendor = (vendorId: string) => {
    toast({
      title: "Connect with Vendor",
      description: "Connection feature coming soon!",
    });
  };

  const handleViewVendorProfile = (vendorId: string) => {
    toast({
      title: "Vendor Profile",
      description: `Viewing profile for vendor: ${vendorId}`,
    });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductCategory(productId);
  };

  const handleBackToProducts = () => {
    setSelectedProductCategory(null);
  };

  // Filter services by selected product category
  const getServicesForProduct = (productId: string) => {
    const productMapping: { [key: string]: string[] } = {
      'facebook-ads': ['facebook', 'social media ads', 'digital marketing', 'meta ads', 'instagram ads', 'social advertising', 'paid social'],
      'google-ads': ['google', 'ppc', 'search ads', 'google adwords', 'paid search', 'sem', 'display ads', 'youtube ads'],
      'direct-mail': ['direct mail', 'postcards', 'flyers', 'mailers', 'print marketing', 'door hangers', 'marketing materials'],
      'social-media': ['social media', 'social marketing', 'instagram', 'linkedin', 'social management', 'content creation'],
      'website-design': ['website', 'web design', 'landing page', 'web development', 'site design', 'wordpress', 'real estate website'],
      'seo-services': ['seo', 'search optimization', 'search engine', 'organic search', 'local seo', 'google ranking'],
      'crm-tools': ['crm', 'lead management', 'customer management', 'database', 'contact management', 'follow up', 'automation'],
      'photography': ['photography', 'photos', 'listing photos', 'real estate photography', 'professional photos', 'photo shoot'],
      'videography': ['video', 'videography', 'virtual tour', 'listing video', 'drone video', 'property video', 'video production'],
      'print-marketing': ['print', 'business cards', 'brochures', 'signage', 'yard signs', 'banners', 'flyers', 'marketing materials'],
      // Adding more comprehensive mappings for new categories
      'Business Cards': ['business cards', 'cards', 'professional cards', 'networking cards'],
      'Yard Signs': ['yard signs', 'signs', 'real estate signs', 'property signs', 'lawn signs'],
      'Open House Signs': ['open house', 'open house signs', 'directional signs', 'event signs'],
      'Property Flyers': ['flyers', 'property flyers', 'listing flyers', 'marketing flyers'],
      'Listing Brochures': ['brochures', 'listing brochures', 'property brochures', 'marketing brochures'],
      'Door Hangers': ['door hangers', 'door marketing', 'neighborhood marketing'],
      'Postcards': ['postcards', 'direct mail', 'mailers', 'farming postcards'],
      'Branded Materials': ['branded', 'branding', 'logo design', 'brand materials'],
      'Social Media Graphics': ['graphics', 'social graphics', 'design', 'social media design'],
      'Website Templates': ['templates', 'website templates', 'web templates', 'real estate templates'],
      'Email Marketing Templates': ['email', 'email marketing', 'email templates', 'newsletters'],
      'Virtual Tour Software': ['virtual tours', 'virtual tour', '3d tours', 'matterport'],
      'Professional Photography': ['photography', 'professional photos', 'listing photography'],
      'Drone Photography': ['drone', 'aerial photography', 'drone photos', 'aerial shots'],
      'Zillow Leads': ['zillow', 'zillow leads', 'online leads', 'internet leads'],
      'Realtor.com Advertising': ['realtor.com', 'realtor advertising', 'listing syndication'],
      'Lead Generation Software': ['lead generation', 'leads', 'lead capture', 'lead system'],
      'CRM Systems': ['crm', 'customer management', 'contact management', 'database management'],
      'Contact Management Tools': ['contact management', 'contacts', 'database', 'client management'],
      'Sphere Marketing Tools': ['sphere', 'past clients', 'database marketing', 'relationship marketing'],
      'Referral Programs': ['referrals', 'referral system', 'referral marketing'],
      'Expired Listing Data': ['expired listings', 'expired', 'listing data', 'prospect data']
    };

    const keywords = productMapping[productId] || [];
    return services.filter(service => {
      const title = service.title?.toLowerCase() || '';
      const description = service.description?.toLowerCase() || '';
      const category = service.category?.toLowerCase() || '';
      const tags = service.tags?.map(tag => tag?.toLowerCase() || '') || [];
      
      return keywords.some(keyword => 
        title.includes(keyword) || 
        description.includes(keyword) || 
        category.includes(keyword) ||
        tags.some(tag => tag.includes(keyword))
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circle-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('loading')} marketplace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold text-black mb-4">{t('marketplaceTitle')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              {t('marketplaceDescription')}
            </p>
          </div>

          {/* Circle Pro Banner - Show for non-signed-in users and non-pro members */}
          {(!user || !profile?.is_pro_member) && (
            <CircleProBanner />
          )}

          {/* Campaign Services Header */}
          <CampaignServicesHeader />

          {/* Search and View Toggle - Mobile Optimized */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:pl-12 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "services" ? "default" : "outline"}
                onClick={() => setViewMode("services")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('services')}
              </Button>
              <Button
                variant={viewMode === "products" ? "default" : "outline"}
                onClick={() => setViewMode("products")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                Products
              </Button>
              <Button
                variant={viewMode === "vendors" ? "default" : "outline"}
                onClick={() => setViewMode("vendors")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('vendors')}
              </Button>
            </div>
          </div>

          {/* Location Filter Banner - Only for vendors */}
          {viewMode === "vendors" && (
            <LocationFilterBanner 
              onToggleLocationFilter={() => setIsLocationFilterActive(!isLocationFilterActive)}
              isLocationFilterActive={isLocationFilterActive}
              vendorCount={vendors.length}
              localVendorCount={localVendorCount}
            />
          )}

          {/* Filters - Mobile Optimized */}
          <div className="mb-6 sm:mb-8">
            <MarketplaceFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={getCategories()}
              viewMode={viewMode}
            />
          </div>

          {/* Grid - Mobile Responsive */}
          {viewMode === "services" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSave={handleSaveService}
                  onViewDetails={handleViewServiceDetails}
                  isSaved={savedServiceIds.includes(service.id)}
                />
              ))}
            </div>
          ) : viewMode === "products" ? (
            selectedProductCategory ? (
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <Button variant="outline" onClick={handleBackToProducts}>
                    ← Back to Products
                  </Button>
                  <h2 className="text-2xl font-bold">
                    {PRODUCT_CATEGORIES.find(p => p.id === selectedProductCategory)?.name}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {getServicesForProduct(selectedProductCategory).map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onSave={handleSaveService}
          onViewDetails={handleViewServiceDetails}
          isSaved={savedServiceIds.includes(service.id)}
        />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const IconComponent = product.icon;
                  return (
                    <div
                      key={product.id}
                      className="group relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      onClick={() => handleSelectProduct(product.id)}
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      {/* Content */}
                      <div className="relative p-6">
                        {/* Icon and Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${product.gradient} flex items-center justify-center shadow-lg`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transform group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                          {product.name}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.gradient}`} />
                            <span className="text-sm font-medium text-gray-700">
                              {getServicesForProduct(product.id).length} providers
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className={`${product.color} hover:bg-gray-50 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0`}
                          >
                            Explore →
                          </Button>
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 ring-1 ring-gray-200 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredVendors.map((vendor) => (
                <EnhancedVendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onConnect={handleConnectVendor}
                  onViewProfile={handleViewVendorProfile}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {((viewMode === "services" && filteredServices.length === 0) || 
            (viewMode === "vendors" && filteredVendors.length === 0) ||
            (viewMode === "products" && !selectedProductCategory && filteredProducts.length === 0) ||
            (viewMode === "products" && selectedProductCategory && getServicesForProduct(selectedProductCategory).length === 0)) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('noResultsFound', { type: viewMode })}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('tryAdjustingFilters')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilters({
                    category: "all",
                    priceRange: [0, 2000],
                    verified: false,
                    featured: false,
                    coPayEligible: false,
                  });
                }}
              >
                {t('clearAll')} filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          isOpen={isServiceModalOpen}
          onClose={handleCloseServiceModal}
        />
      )}

      {/* Add Product Modal */}
      <AddProductModal
        open={isAddProductModalOpen}
        onOpenChange={setIsAddProductModalOpen}
        onProductAdded={loadData}
      />
    </>
  );
};