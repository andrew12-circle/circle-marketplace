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

interface MarketplaceVendorCardProps extends Omit<BaseVendorCardProps, 'variant' | 'onConnect'> {
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
    const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
    const { trackActivity } = useVendorActivityTracking();

    const handleConnect = async (vendorData: BaseVendorData) => {
      try {
        await trackActivity(vendorData.id, 'consultation_booking');
        onConnect(vendorData.id);
      } catch (error) {
        console.error('Failed to track interaction:', error);
        onConnect(vendorData.id);
      }
    };

    const handleViewFunnel = () => {
      console.log('Opening funnel for vendor:', vendor.name);
      setIsFunnelModalOpen(true);
    };

    return (
      <>
        <BaseVendorCard
          {...props}
          vendor={vendor}
          onConnect={handleConnect}
          onViewProfile={handleViewFunnel}
          localRepresentative={vendor.local_representative}
        />

        <VendorFunnelModal
          isOpen={isFunnelModalOpen}
          onClose={() => setIsFunnelModalOpen(false)}
          vendor={vendor}
          onCoMarketingRequest={(vendorId) => onConnect(vendorId)}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.vendor.id === nextProps.vendor.id &&
      prevProps.vendor.name === nextProps.vendor.name &&
      prevProps.vendor.is_verified === nextProps.vendor.is_verified &&
      prevProps.vendor.rating === nextProps.vendor.rating &&
      prevProps.vendor.review_count === nextProps.vendor.review_count
    );
  }
);

MarketplaceVendorCard.displayName = "MarketplaceVendorCard";