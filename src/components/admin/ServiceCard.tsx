import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Package, Star, Building, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Editable } from './Editable';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  retail_price?: number;
  pro_price?: number;
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

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (service: Service) => void;
  onVerificationToggle: (serviceId: string, currentStatus: boolean) => void;
  onVisibilityToggle: (serviceId: string, currentStatus: boolean) => void;
  onAffiliateToggle: (serviceId: string, currentStatus: boolean) => void;
  onBookingLinkToggle: (serviceId: string, currentStatus: boolean) => void;
}

const ServiceCard = React.memo<ServiceCardProps>(({ 
  service, 
  isSelected, 
  onSelect,
  onVerificationToggle,
  onVisibilityToggle,
  onAffiliateToggle,
  onBookingLinkToggle
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'ring-2 ring-primary' : ''}`} 
      onClick={() => onSelect(service)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="secondary" className="text-[10px] shrink-0">
                #{service.sort_order ?? '-'}
              </Badge>
              <Editable
                entity="service"
                entityId={service.id}
                field="title"
                value={service.title}
                type="text"
                onSave={(newValue) => {
                  // Update local state if needed
                  console.log('Title updated:', newValue);
                }}
              >
                <h3 className="font-semibold truncate">{service.title}</h3>
              </Editable>
            </div>
            {service.image_url ? (
              <img 
                src={service.image_url} 
                alt={service.title} 
                className="w-32 h-12 rounded-lg object-contain" 
              />
            ) : (
              <div className="w-32 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mt-1">
              {service.is_featured && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {service.is_top_pick && (
                <Badge variant="outline" className="text-xs">
                  Top Pick
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Editable
                entity="service"
                entityId={service.id}
                field="category"
                value={service.category}
                type="select"
                options={[
                  { value: 'CRMs', label: 'CRMs' },
                  { value: 'Ads & Lead Gen', label: 'Ads & Lead Gen' },
                  { value: 'Website / IDX', label: 'Website / IDX' },
                  { value: 'SEO', label: 'SEO' },
                  { value: 'Coaching', label: 'Coaching' },
                  { value: 'Marketing Automation & Content', label: 'Marketing Automation & Content' },
                  { value: 'Video & Media Tools', label: 'Video & Media Tools' },
                  { value: 'Listing & Showing Tools', label: 'Listing & Showing Tools' },
                  { value: 'Data & Analytics', label: 'Data & Analytics' },
                  { value: 'Finance & Business Tools', label: 'Finance & Business Tools' },
                  { value: 'Productivity & Collaboration', label: 'Productivity & Collaboration' },
                  { value: 'Virtual Assistants & Dialers', label: 'Virtual Assistants & Dialers' },
                  { value: 'Team & Recruiting Tools', label: 'Team & Recruiting Tools' },
                  { value: 'CE & Licensing', label: 'CE & Licensing' },
                  { value: 'Client Event Kits', label: 'Client Event Kits' },
                  { value: 'Print & Mail', label: 'Print & Mail' },
                  { value: 'Signage & Branding', label: 'Signage & Branding' },
                  { value: 'Presentations', label: 'Presentations' },
                  { value: 'Branding', label: 'Branding' },
                  { value: 'Client Retention', label: 'Client Retention' },
                  { value: 'Transaction Coordinator', label: 'Transaction Coordinator' }
                ]}
                onSave={(newValue) => {
                  console.log('Category updated:', newValue);
                }}
              >
                <Badge variant="outline" className="text-xs">
                  {service.category}
                </Badge>
              </Editable>

              {service.retail_price && (
                <div className="flex gap-2 text-xs">
                  <Editable
                    entity="service"
                    entityId={service.id}
                    field="retail_price"
                    value={service.retail_price}
                    type="price"
                    onSave={(newValue) => {
                      console.log('Retail price updated:', newValue);
                    }}
                  >
                    <span className="text-muted-foreground">
                      Retail: ${service.retail_price}
                    </span>
                  </Editable>
                  
                  {service.pro_price && (
                    <Editable
                      entity="service"
                      entityId={service.id}
                      field="pro_price"
                      value={service.pro_price}
                      type="price"
                      onSave={(newValue) => {
                        console.log('Pro price updated:', newValue);
                      }}
                    >
                      <span className="text-primary font-medium">
                        Pro: ${service.pro_price}
                      </span>
                    </Editable>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {service.service_providers?.name && service.service_providers.name !== 'Circle Marketplace' && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {service.service_providers.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.updated_at ? formatDistanceToNow(new Date(service.updated_at), {
                    addSuffix: true
                  }) : 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-start mt-2">
              {/* Left side switches */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Verified</span>
                  <Switch 
                    checked={service.is_verified || false} 
                    onCheckedChange={() => onVerificationToggle(service.id, service.is_verified || false)} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Active</span>
                  <Switch 
                    checked={service.is_active || false} 
                    onCheckedChange={() => onVisibilityToggle(service.id, service.is_active || false)} 
                  />
                </div>
              </div>
              
              {/* Right side switches */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Affiliate</span>
                  <Switch 
                    checked={service.is_affiliate || false} 
                    onCheckedChange={() => onAffiliateToggle(service.id, service.is_affiliate || false)} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Booking</span>
                  <Switch 
                    checked={service.is_booking_link || false} 
                    onCheckedChange={() => onBookingLinkToggle(service.id, service.is_booking_link || false)} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;