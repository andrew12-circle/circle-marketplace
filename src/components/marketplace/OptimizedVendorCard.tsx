import React, { memo } from "react";
import { EnhancedVendorCard } from "./EnhancedVendorCard";
import type { Vendor } from "@/hooks/useMarketplaceData";

interface OptimizedVendorCardProps {
  vendor: Vendor;
  onConnect: (vendorId: string) => void;
  onViewProfile: (vendorId: string) => void;
}

export const OptimizedVendorCard = memo<OptimizedVendorCardProps>(
  ({ vendor, onConnect, onViewProfile }) => {
    return (
      <EnhancedVendorCard
        vendor={vendor}
        onConnect={onConnect}
        onViewProfile={onViewProfile}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimization
    return (
      prevProps.vendor.id === nextProps.vendor.id &&
      prevProps.vendor.name === nextProps.vendor.name &&
      prevProps.vendor.rating === nextProps.vendor.rating &&
      prevProps.vendor.is_verified === nextProps.vendor.is_verified
    );
  }
);

OptimizedVendorCard.displayName = "OptimizedVendorCard";