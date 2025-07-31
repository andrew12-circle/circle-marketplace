import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Star, MapPin, Users, TrendingUp, ExternalLink, Info, Building, Globe, AlertTriangle, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";
import { useState } from "react";
import { VendorFunnelModal } from "./VendorFunnelModal";
import { useCoPayRequests } from "@/hooks/useCoPayRequests";

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  mls_areas?: string[];
  service_radius_miles?: number;
  license_states?: string[];
  latitude?: number;
  longitude?: number;
  vendor_type?: string;
  local_representatives?: any; // JSON data from database
  ad_budget_min?: number;
  ad_budget_max?: number;
  budget_currency?: string;
}

interface LocalRepresentative {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  license_number?: string;
  nmls_id?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

interface EnhancedVendorCardProps {
  vendor: Vendor;
  onConnect?: (vendorId: string) => void;
  onViewProfile?: (vendorId: string) => void;
}

export const EnhancedVendorCard = ({ vendor, onConnect, onViewProfile }: EnhancedVendorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const { createCoPayRequest } = useCoPayRequests();
  // Determine risk level based on vendor name/description
  const riskLevel = determineServiceRisk(vendor.name, vendor.description);
  
  // Mock service area and budget data
  const serviceArea = vendor.location || "Service area not specified";
  const mockBudgetRange = riskLevel === 'high' ? "$1,000-2,500/mo" : 
                          riskLevel === 'medium' ? "$500-1,500/mo" : 
                          "$1,000-3,000/mo";

  const getCardBorderClass = () => {
    // Remove special border styling - all cards look normal
    return "border-border";
  };

  const handleCardClick = () => {
    setIsFunnelModalOpen(true);
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFunnelModalOpen(true);
  };

  return (
    <>
      <Card 
        className={`h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer ${getCardBorderClass()}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
      <CardContent className="p-0 flex-1">
        {/* Vendor Image at Top */}
        <div className="relative w-full h-48 bg-muted rounded-t-lg overflow-hidden">
          {vendor.logo_url ? (
            <img 
              src={vendor.logo_url} 
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Building className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Overlays */}
          <div className="absolute top-3 left-3">
            {vendor.is_verified && (
              <Badge className="bg-white/90 text-blue-800 border-0">
                ✓ Verified
              </Badge>
            )}
          </div>
          
          <div className="absolute top-3 right-3">
            {getRiskBadge(riskLevel)}
          </div>
          
          {/* Rating overlay */}
          {vendor.rating > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{vendor.rating}</span>
              <span className="text-xs text-muted-foreground">({vendor.review_count})</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-4">
          {/* Header */}
          <div>
            <h3 className="font-semibold text-lg leading-tight mb-1">{vendor.name}</h3>
            {vendor.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{vendor.location}</span>
              </div>
            )}
          </div>

          {/* Compliance Alert - smaller and more subtle */}
          {getComplianceAlert(riskLevel) && (
            <div className="mb-4">
              {getComplianceAlert(riskLevel)}
            </div>
          )}

          {/* Description */}
          {vendor.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {vendor.description}
            </p>
          )}

          {/* Service Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span>Ad Budget: {vendor.ad_budget_min && vendor.ad_budget_max 
                ? `$${(vendor.ad_budget_min / 100).toLocaleString()} - $${(vendor.ad_budget_max / 100).toLocaleString()}/mo`
                : 'Contact for pricing'}</span>
            </div>
            {vendor.license_states && vendor.license_states.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Licensed in:</span>
                {vendor.license_states.slice(0, 3).map((state) => (
                  <Badge key={state} variant="outline" className="text-xs">{state}</Badge>
                ))}
                {vendor.license_states.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{vendor.license_states.length - 3} more</Badge>
                )}
              </div>
            )}
            {vendor.service_radius_miles && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Radius: {vendor.service_radius_miles} miles</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-lg font-bold text-circle-primary">{vendor.co_marketing_agents}</div>
              <div className="text-xs text-muted-foreground">Co-Marketing Agents</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-lg font-bold text-circle-primary">{vendor.campaigns_funded}</div>
              <div className="text-xs text-muted-foreground">Campaigns Funded</div>
            </div>
          </div>

          {/* Local Representatives */}
          {vendor.local_representatives && vendor.local_representatives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Local Representatives:</h4>
              <div className="space-y-2 max-h-20 overflow-y-auto">
                {vendor.local_representatives.slice(0, 2).map((rep) => (
                  <div key={rep.id} className="text-xs bg-muted/30 p-2 rounded">
                    <div className="font-medium">{rep.name}</div>
                    <div className="text-muted-foreground">{rep.title}</div>
                    <div className="text-muted-foreground">{rep.location}</div>
                  </div>
                ))}
                {vendor.local_representatives.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{vendor.local_representatives.length - 2} more representatives
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Services */}
          <div>
            <h4 className="text-sm font-medium mb-2">Available for:</h4>
            <div className="flex flex-wrap gap-1">
              {riskLevel === 'high' ? (
                <>
                  <Badge variant="outline" className="text-xs">Digital Ads</Badge>
                  <Badge variant="outline" className="text-xs">Print Ads</Badge>
                  <Badge variant="outline" className="text-xs">Billboards</Badge>
                </>
              ) : riskLevel === 'medium' ? (
                <>
                  <Badge variant="outline" className="text-xs">Digital</Badge>
                  <Badge variant="outline" className="text-xs">Events</Badge>
                  <Badge variant="outline" className="text-xs">Direct Mail</Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="text-xs">All Advertising</Badge>
                  <Badge variant="outline" className="text-xs">Events</Badge>
                  <Badge variant="outline" className="text-xs">Co-Marketing</Badge>
                </>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {(vendor.website_url) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span className="truncate">{vendor.website_url}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onConnect?.(vendor.id);
          }}
          className="flex-1"
        >
          Request Co-pay Support
        </Button>
        <Button 
          variant="outline"
          onClick={handleArrowClick}
        >
          <ArrowRight className={`h-4 w-4 transition-transform ${
            isHovered ? "translate-x-1" : ""
          }`} />
        </Button>
      </CardFooter>
      </Card>

      <VendorFunnelModal
        isOpen={isFunnelModalOpen}
        onClose={() => setIsFunnelModalOpen(false)}
        vendor={vendor}
        onRequestCoMarketing={onConnect || (() => {})}
      />
    </>
  );
};