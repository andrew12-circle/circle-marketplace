import { useState, useEffect } from "react";
import { ServiceCard } from "./ServiceCard";
import { EnhancedVendorCard } from "./EnhancedVendorCard";
import { MarketplaceFilters } from "./MarketplaceFilters";
import { CampaignServicesHeader } from "./CampaignServicesHeader";
import { CircleProBanner } from "./CircleProBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  original_price?: string;
  discount_percentage?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  contribution_amount: string;
  estimated_roi?: number;
  duration?: string;
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
}

type ViewMode = "services" | "vendors";

export const MarketplaceGrid = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("services");
  const [filters, setFilters] = useState({
    category: "all",
    priceRange: [0, 2000],
    verified: false,
    featured: false,
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

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

      // Load vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('rating', { ascending: false });

      if (vendorsError) throw vendorsError;

      // Convert the database response to match our interface
      const formattedServices = (servicesData || []).map(service => ({
        ...service,
        price: String(service.price || "0"),
        original_price: service.original_price ? String(service.original_price) : undefined,
        discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
        contribution_amount: String(service.contribution_amount || "0"),
      }));
      
      setServices(formattedServices);
      setVendors(vendorsData || []);
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

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === "all" || service.category === filters.category;
    const priceValue = parseFloat(service.price) || 0;
    const matchesPrice = priceValue >= filters.priceRange[0] && priceValue <= filters.priceRange[1];
    const matchesVerified = !filters.verified || service.vendor.is_verified;
    const matchesFeatured = !filters.featured || service.is_featured;

    return matchesSearch && matchesCategory && matchesPrice && matchesVerified && matchesFeatured;
  });

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVerified = !filters.verified || vendor.is_verified;

    return matchesSearch && matchesVerified;
  });

  const handleSaveService = async (serviceId: string) => {
    // This would integrate with user authentication and saved services
    toast({
      title: "Feature coming soon",
      description: "Service saving will be available after user authentication is implemented.",
    });
  };

  const handleViewServiceDetails = (serviceId: string) => {
    toast({
      title: "Service Details",
      description: `Viewing details for service: ${serviceId}`,
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circle-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading marketplace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-12">
          <h1 className="font-inter font-black text-4xl sm:text-6xl lg:text-[72px] leading-tight sm:leading-[72px] text-gray-900 mb-3 sm:mb-6">Marketplace.</h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-4xl">
            Finally, we silenced the noise. Welcome to the Marketplace. Discover premium marketing services and connect with top-performing vendors who will actually move your business forward.
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
              placeholder="Search services, vendors, or categories..."
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
              Services
            </Button>
            <Button
              variant={viewMode === "vendors" ? "default" : "outline"}
              onClick={() => setViewMode("vendors")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              Vendors
            </Button>
          </div>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={Array.from(new Set(services.map(s => s.category).filter(category => category && category.trim() !== "")))}
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
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          (viewMode === "vendors" && filteredVendors.length === 0)) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No {viewMode} found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
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
                });
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};