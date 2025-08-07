import React, { memo } from "react";
import { ServiceCard } from "./ServiceCard";
import type { Service } from "@/hooks/useMarketplaceData";

interface OptimizedServiceCardProps {
  service: Service;
  isSaved: boolean;
  onSave: (serviceId: string) => void;
  onViewDetails: (serviceId: string) => void;
}

export const OptimizedServiceCard = memo<OptimizedServiceCardProps>(
  ({ service, isSaved, onSave, onViewDetails }) => {
    return (
      <ServiceCard
        service={service}
        isSaved={isSaved}
        onSave={onSave}
        onViewDetails={onViewDetails}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimization
    return (
      prevProps.service.id === nextProps.service.id &&
      prevProps.isSaved === nextProps.isSaved &&
      prevProps.service.title === nextProps.service.title &&
      prevProps.service.retail_price === nextProps.service.retail_price &&
      prevProps.service.is_verified === nextProps.service.is_verified &&
      prevProps.service.pro_price === nextProps.service.pro_price
    );
  }
);

OptimizedServiceCard.displayName = "OptimizedServiceCard";