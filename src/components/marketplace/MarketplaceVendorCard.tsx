import React, { memo, useState } from "react";
import { BaseVendorCard, BaseVendorData, BaseVendorCardProps } from "./BaseVendorCard";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { VendorFunnelModal } from "./VendorFunnelModal";
import { useCoPayRequests } from "@/hooks/useCoPayRequests";
import { useVendorActivityTracking } from "@/hooks/useVendorActivityTracking";

interface LocalRepresentative {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  photo_url?: string;
}

interface MarketplaceVendorCardProps extends Omit<BaseVendorCardProps, 'variant'> {
  vendor: BaseVendorData & {
    // Additional marketplace-specific fields
    local_representative?: LocalRepresentative;
    risk_level?: 'low' | 'medium' | 'high';
    licensed_states?: string[];
    service_radius_miles?: number;
    ad_budget_spent_last_30_days?: number;
  };
  onConnect: (vendorId: string) => void;
  onViewProfile: (vendorId: string) => void;
}

export const MarketplaceVendorCard = memo<MarketplaceVendorCardProps>(
  ({ vendor, onConnect, onViewProfile, ...props }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
    const { createCoPayRequest } = useCoPayRequests();
    const { trackActivity } = useVendorActivityTracking();

    const determineServiceRisk = () => {
      if (vendor.risk_level) return vendor.risk_level;
      if (vendor.campaigns_funded && vendor.campaigns_funded > 10) return 'low';
      if (vendor.campaigns_funded && vendor.campaigns_funded > 5) return 'medium';
      return 'high';
    };

    const handleViewFunnel = () => {
      console.log('Opening funnel for vendor:', vendor.name, vendor.id);
      trackActivity(vendor.id, 'vendor_profile_view', {
        vendor_name: vendor.name,
        source: 'marketplace_card'
      });
      setIsFunnelModalOpen(true);
      console.log('Modal state set to true');
    };

    const handleConnect = (vendorId: string) => {
      trackActivity(vendorId, 'vendor_contact', {
        vendor_name: vendor.name,
        source: 'marketplace_card'
      });
      onConnect(vendorId);
    };

    const handleViewProfile = (vendorId: string) => {
      trackActivity(vendorId, 'vendor_profile_view', {
        vendor_name: vendor.name,
        source: 'marketplace_card'
      });
      onViewProfile(vendorId);
    };

    const handleCardClick = () => {
      console.log('Card clicked - opening funnel for:', vendor.name);
      trackActivity(vendor.id, 'vendor_profile_view', {
        vendor_name: vendor.name,
        source: 'marketplace_card'
      });
      handleViewFunnel(); // Changed this to open funnel instead of profile
    };

    const handleArrowClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleViewFunnel();
    };

    const getCardBorderClass = () => {
      return vendor.name.toLowerCase().includes('circle home loans') 
        ? 'border-primary/20 shadow-primary/10' 
        : '';
    };

    const getRiskBadgeColor = (risk: string) => {
      switch (risk) {
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const serviceRisk = determineServiceRisk();

    return (
      <>
        <BaseVendorCard
          {...props}
          vendor={vendor}
          variant="detailed"
          className={`transition-all duration-200 ${getCardBorderClass()} ${
            isHovered ? 'shadow-lg scale-[1.02]' : ''
          }`}
          onConnect={handleConnect}
          onViewProfile={handleViewFunnel} // Changed this to open funnel
          onLearnMore={undefined} // Remove learn more since main click opens funnel
          localRepresentative={vendor.local_representative}
          showStats={true}
          showSpecialties={true}
          showArrow={false} // Remove arrow since main click opens funnel
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* RESPA Compliance and Risk Assessment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {vendor.licensed_states && vendor.licensed_states.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Licensed in {vendor.licensed_states.length} states
                  </span>
                )}
              </div>
            </div>

            {/* Service Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {vendor.ad_budget_spent_last_30_days && (
                <div>
                  <span className="text-muted-foreground">Ad Budget:</span>
                  <div className="font-medium">
                    ${vendor.ad_budget_spent_last_30_days?.toLocaleString()}/mo
                  </div>
                </div>
              )}
              {vendor.service_radius_miles && (
                <div>
                  <span className="text-muted-foreground">Service Radius:</span>
                  <div className="font-medium">{vendor.service_radius_miles} miles</div>
                </div>
              )}
            </div>

            {/* Co-Pay Explanation */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                  What is co-pay marketing?
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Co-Pay Marketing</h4>
                  <p className="text-sm text-muted-foreground">
                    The vendor covers a percentage of your marketing costs in exchange for qualified referrals. 
                    This is a RESPA-compliant way to reduce your marketing expenses while building valuable business relationships.
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            {/* Available Services based on risk level */}
            {serviceRisk === 'low' && (
              <div className="text-sm">
                <span className="text-muted-foreground">Available Services:</span>
                <div className="text-green-600 font-medium">Full Co-Marketing Suite</div>
              </div>
            )}
          </div>
        </BaseVendorCard>

        <VendorFunnelModal
          isOpen={isFunnelModalOpen}
          onClose={() => setIsFunnelModalOpen(false)}
          vendor={vendor}
          onCoMarketingRequest={handleConnect}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.vendor.id === nextProps.vendor.id &&
      prevProps.vendor.name === nextProps.vendor.name &&
      prevProps.vendor.rating === nextProps.vendor.rating &&
      prevProps.vendor.is_verified === nextProps.vendor.is_verified &&
      prevProps.vendor.co_marketing_agents === nextProps.vendor.co_marketing_agents &&
      prevProps.vendor.campaigns_funded === nextProps.vendor.campaigns_funded
    );
  }
);

MarketplaceVendorCard.displayName = "MarketplaceVendorCard";