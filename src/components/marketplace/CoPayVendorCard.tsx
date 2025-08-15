import React, { memo } from "react";
import { BaseVendorCard, BaseVendorData, BaseVendorCardProps } from "./BaseVendorCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface LocalRepresentative {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  photo_url?: string;
}

interface CoPayVendorCardProps extends Omit<BaseVendorCardProps, 'variant' | 'onConnect' | 'onLearnMore'> {
  vendor: BaseVendorData & {
    parent_vendor_id?: string;
    pledgedPoints?: number;
  };
  onConnect?: () => void;
  onLearnMore?: () => void;
  onVendorSelect?: (vendor: BaseVendorData & { parent_vendor_id?: string; pledgedPoints?: number }) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

const mockBudgetRange = () => {
  const ranges = ['$1,000 - $5,000', '$5,000 - $10,000', '$10,000 - $25,000', '$25,000+'];
  return ranges[Math.floor(Math.random() * ranges.length)];
};

export const CoPayVendorCard = memo<CoPayVendorCardProps>(
  ({ vendor, onConnect, onLearnMore, onVendorSelect, isSelected = false, disabled = false, ...props }) => {
    const handleConnect = () => {
      if (onConnect && !disabled) {
        onConnect();
      }
      if (onVendorSelect && !disabled) {
        onVendorSelect(vendor);
      }
    };

    return (
      <div className="space-y-3">
        <BaseVendorCard
          {...props}
          vendor={vendor}
          variant="compact"
          className={`transition-all duration-200 hover:shadow-md ${
            isSelected ? 'ring-2 ring-primary' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onConnect={handleConnect}
          onLearnMore={onLearnMore ? () => {} : undefined}
          showStats={true}
          showSpecialties={false}
          disabled={disabled}
        />
        
        {/* Co-Pay Specific Information Card */}
        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-2">
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

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-background rounded">
                <div className="font-semibold text-blue-600">Response Rate</div>
                <div className="text-muted-foreground">92%</div>
              </div>
              <div className="text-center p-2 bg-background rounded">
                <div className="font-semibold text-green-600">Success Rate</div>
                <div className="text-muted-foreground">87%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.vendor.id === nextProps.vendor.id &&
      prevProps.vendor.name === nextProps.vendor.name &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.vendor.pledgedPoints === nextProps.vendor.pledgedPoints
    );
  }
);

CoPayVendorCard.displayName = "CoPayVendorCard";