import { useMemo } from "react";
import type { Service, Vendor } from "./useMarketplaceData";

interface FilterState {
  category: string;
  priceRange: number[];
  verified: boolean;
  featured: boolean;
  coPayEligible: boolean;
  locationFilter: boolean;
}

// Extracted filtering logic for better performance
export const useMarketplaceFilters = (
  services: Service[],
  vendors: Vendor[],
  searchTerm: string,
  filters: FilterState,
  location?: { state: string }
) => {
  // Memoized service filtering
  const filteredServices = useMemo(() => {
    const extractNumericPrice = (priceString: string | null | undefined): number => {
      if (!priceString) return 0;
      const cleanedPrice = priceString.replace(/[^0-9.]/g, '');
      return parseFloat(cleanedPrice) || 0;
    };

    return services.filter(service => {
      // Build search tokens with simple synonyms
      const baseQuery = (searchTerm || '').toLowerCase().trim();

      const tokens = new Set<string>(
        baseQuery ? [baseQuery, ...baseQuery.split(/[\s-]+/).filter(Boolean)] : []
      );

      // Synonym expansion to make "360 marketing" find "360 branding" and vice versa
      const expandToken = (tok: string) => {
        if (tok === 'marketing') tokens.add('branding');
        if (tok === 'branding') tokens.add('marketing');
        if (tok === '360') {
          tokens.add('360 branding');
          tokens.add('360 marketing');
        }
        if (tok === '360branding' || tok === '360-branding') tokens.add('360 branding');
        if (tok === '360marketing' || tok === '360-marketing') tokens.add('360 marketing');
      };
      Array.from(tokens).forEach(expandToken);

      const haystackParts = [
        service.title?.toLowerCase() || '',
        service.description?.toLowerCase() || '',
        service.vendor?.name?.toLowerCase() || '',
        service.category?.toLowerCase() || '',
        ...(service.tags?.map(t => (t || '').toLowerCase()) || [])
      ];

      const matchesSearch = tokens.size === 0
        ? true
        : Array.from(tokens).some(tok => haystackParts.some(part => part.includes(tok)));
      
      const matchesCategory = filters.category === "all" || service.category === filters.category;
      
      const priceValue = extractNumericPrice(service.retail_price);
      const matchesPrice = priceValue >= filters.priceRange[0] && priceValue <= filters.priceRange[1];
      
      const matchesVerified = !filters.verified || service.vendor?.is_verified;
      const matchesFeatured = !filters.featured || service.is_featured;

      // Co-pay eligibility filtering (optimized)
      let matchesCoPayEligible = true;
      if (filters.coPayEligible) {
        const category = service.category?.toLowerCase() || '';
        const title = service.title?.toLowerCase() || '';
        const tags = service.tags?.map(tag => tag.toLowerCase()) || [];

        // Optimized keyword matching
        const safeKeywords = ['digital ads', 'facebook ads', 'google ads', 'display ads', 'retargeting', 'postcards', 'direct mail', 'flyers', 'door hangers', 'brochures', 'educational', 'seminar', 'workshop', 'market report', 'buyer education', 'joint advertising', 'co-branded', 'print advertising'];
        const restrictedKeywords = ['crm', 'lead capture', 'lead generation', 'funnel', 'drip email', 'follow-up', 'seo', 'landing page', 'chatbot', 'sms', 'automation', 'business card', 'sign', 'social media management', 'posting', 'content calendar', 'listing video', 'drone', 'agent video', 'testimonial', 'open house', 'appreciation', 'pop-by', 'gift', 'closing gift', 'referral', 'past client', 'database', 'strategy', 'coaching', 'consulting', 'accountability'];
        
        const hasRestricted = restrictedKeywords.some(keyword => 
          title.includes(keyword) || category.includes(keyword) || tags.some(tag => tag.includes(keyword))
        );
        const hasSafe = safeKeywords.some(keyword => 
          title.includes(keyword) || category.includes(keyword) || tags.some(tag => tag.includes(keyword))
        );

        matchesCoPayEligible = hasSafe && !hasRestricted;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesVerified && matchesFeatured && matchesCoPayEligible;
    });
  }, [services, searchTerm, filters]);

  // Memoized vendor filtering
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      if (!vendor) return false;
      
      const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           vendor.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVerified = !filters.verified || vendor.is_verified;

      let matchesLocation = true;
      if (filters.locationFilter && location?.state) {
        matchesLocation = vendor.license_states?.includes(location.state) || 
                         vendor.service_states?.includes(location.state) || false;
      }

      return matchesSearch && matchesVerified && matchesLocation;
    });
  }, [vendors, searchTerm, filters, location]);

  // Memoized categories
  const categories = useMemo(() => {
    return Array.from(new Set(services.map(s => s.category).filter(category => category && category.trim() !== "")));
  }, [services]);

  // Memoized local vendor count
  const localVendorCount = useMemo(() => {
    if (!location?.state) return 0;
    return vendors.filter(vendor => 
      vendor && (vendor.license_states?.includes(location.state) || vendor.service_states?.includes(location.state))
    ).length;
  }, [vendors, location]);

  return {
    filteredServices,
    filteredVendors,
    categories,
    localVendorCount
  };
};