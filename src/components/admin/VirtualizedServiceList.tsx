import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ServiceCard from './ServiceCard';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  is_featured?: boolean;
  is_top_pick?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  is_affiliate?: boolean;
  is_booking_link?: boolean;
  sort_order?: number;
  updated_at: string;
  service_providers?: {
    name: string;
  };
}

interface VirtualizedServiceListProps {
  services: Service[];
  selectedService: Service | null;
  onServiceSelect: (service: Service) => void;
  onVerificationToggle: (serviceId: string, currentStatus: boolean) => void;
  onVisibilityToggle: (serviceId: string, currentStatus: boolean) => void;
  onAffiliateToggle: (serviceId: string, currentStatus: boolean) => void;
  onBookingLinkToggle: (serviceId: string, currentStatus: boolean) => void;
  height?: number;
}

const ITEM_HEIGHT = 180; // Estimated height of each service card

export function VirtualizedServiceList({
  services,
  selectedService,
  onServiceSelect,
  onVerificationToggle,
  onVisibilityToggle,
  onAffiliateToggle,
  onBookingLinkToggle,
  height = 600
}: VirtualizedServiceListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: `${height}px` }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const service = services[virtualRow.index];
          if (!service) return null;

          return (
            <div
              key={service.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                padding: '4px'
              }}
            >
              <ServiceCard
                service={service}
                isSelected={selectedService?.id === service.id}
                onSelect={onServiceSelect}
                onVerificationToggle={onVerificationToggle}
                onVisibilityToggle={onVisibilityToggle}
                onAffiliateToggle={onAffiliateToggle}
                onBookingLinkToggle={onBookingLinkToggle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}