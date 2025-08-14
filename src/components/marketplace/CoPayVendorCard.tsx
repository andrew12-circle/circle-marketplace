import React, { memo } from "react";
import { BaseVendorCard, BaseVendorData, BaseVendorCardProps } from "./BaseVendorCard";
import { Badge } from "@/components/ui/badge";

interface CoPayVendorCardProps extends Omit<BaseVendorCardProps, 'variant'> {
  vendor: BaseVendorData & {
    parent_vendor_id?: string | null;
    pledgedPoints?: number;
  };
  onSelect: (vendor: BaseVendorData) => void;
  onLearnMore?: (vendor: BaseVendorData, e: React.MouseEvent) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export const CoPayVendorCard = memo<CoPayVendorCardProps>(
  ({ vendor, onSelect, onLearnMore, isSelected, disabled, ...props }) => {
    const handleConnect = () => {
      if (!disabled) {
        onSelect(vendor);
      }
    };

    const handleLearnMoreClick = (e: React.MouseEvent) => {
      if (onLearnMore && !disabled) {
        onLearnMore(vendor, e);
      }
    };

    const mockBudgetRange = () => {
      const rating = vendor.rating || 3;
      if (rating >= 4.5) return "$1,000-3,000/mo";
      if (rating >= 4) return "$500-1,500/mo";
      return "$1,000-2,500/mo";
    };

    return (
      <BaseVendorCard
        {...props}
        vendor={vendor}
        variant="compact"
        className={`transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onConnect={handleConnect}
        onLearnMore={onLearnMore ? () => {} : undefined}
        connectButtonText="Select Vendor"
        showStats={true}
        showSpecialties={false}
        disabled={disabled}
      >
        {/* Co-Pay Specific Information */}
        <div className="space-y-2">
          {/* Budget Range */}
          <div className="text-sm">
            <span className="text-muted-foreground">Budget Range:</span>
            <div className="font-medium text-green-600">{mockBudgetRange()}</div>
          </div>

          {/* Pledged Points */}
          {vendor.pledgedPoints && vendor.pledgedPoints > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available Points:</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {vendor.pledgedPoints.toLocaleString()} points
              </Badge>
            </div>
          )}

          {/* Service States */}
          {vendor.service_states && vendor.service_states.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Service Areas:</span>
              <div className="text-xs text-muted-foreground mt-1">
                {vendor.service_states.slice(0, 3).join(', ')}
                {vendor.service_states.length > 3 && ` +${vendor.service_states.length - 3} more`}
              </div>
            </div>
          )}

          {/* Vendor Type */}
          {vendor.vendor_type && (
            <div className="text-sm">
              <span className="text-muted-foreground">Type:</span>
              <div className="font-medium">{vendor.vendor_type}</div>
            </div>
          )}
        </div>

        {/* Custom Learn More Button */}
        {onLearnMore && (
          <button
            onClick={handleLearnMoreClick}
            className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            Learn More About This Vendor
          </button>
        )}
      </BaseVendorCard>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.vendor.id === nextProps.vendor.id &&
      prevProps.vendor.name === nextProps.vendor.name &&
      prevProps.vendor.rating === nextProps.vendor.rating &&
      prevProps.vendor.is_verified === nextProps.vendor.is_verified &&
      prevProps.vendor.pledgedPoints === nextProps.vendor.pledgedPoints &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

CoPayVendorCard.displayName = "CoPayVendorCard";