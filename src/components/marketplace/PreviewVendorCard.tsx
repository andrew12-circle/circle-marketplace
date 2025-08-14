import React, { memo } from "react";
import { BaseVendorCard, BaseVendorData, BaseVendorCardProps } from "./BaseVendorCard";

interface PreviewVendorCardProps extends Omit<BaseVendorCardProps, 'variant' | 'onConnect' | 'onViewProfile'> {
  vendor: BaseVendorData;
}

export const PreviewVendorCard = memo<PreviewVendorCardProps>(
  ({ vendor, ...props }) => {
    return (
      <BaseVendorCard
        {...props}
        vendor={vendor}
        variant="standard"
        className="mx-auto"
        showStats={true}
        showContact={true}
        showSpecialties={true}
        connectButtonText="View Profile"
        viewButtonText="Visit Website"
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.vendor.id === nextProps.vendor.id &&
      prevProps.vendor.name === nextProps.vendor.name &&
      prevProps.vendor.rating === nextProps.vendor.rating &&
      prevProps.vendor.is_verified === nextProps.vendor.is_verified
    );
  }
);

PreviewVendorCard.displayName = "PreviewVendorCard";