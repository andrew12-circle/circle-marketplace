import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Star, MapPin, Users, TrendingUp, ExternalLink, Info, Building, Globe, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";

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
}

interface EnhancedVendorCardProps {
  vendor: Vendor;
  onConnect?: (vendorId: string) => void;
  onViewProfile?: (vendorId: string) => void;
}

export const EnhancedVendorCard = ({ vendor, onConnect, onViewProfile }: EnhancedVendorCardProps) => {
  // Determine risk level based on vendor name/description
  const riskLevel = determineServiceRisk(vendor.name, vendor.description);
  
  // Mock service area and budget data
  const serviceArea = vendor.location || "Service area not specified";
  const mockBudgetRange = riskLevel === 'high' ? "$1,000-2,500/mo" : 
                          riskLevel === 'medium' ? "$500-1,500/mo" : 
                          "$1,000-3,000/mo";

  const getCardBorderClass = () => {
    switch (riskLevel) {
      case 'high':
        return "border-red-200 bg-red-50/30";
      case 'medium':
        return "border-orange-200 bg-orange-50/30";
      case 'low':
        return "border-green-200 bg-green-50/30";
      default:
        return "border-border";
    }
  };

  return (
    <Card className={`h-full flex flex-col hover:shadow-lg transition-shadow ${getCardBorderClass()}`}>
      <CardContent className="p-4 flex-1">
        {/* Header with Logo and Risk Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {vendor.logo_url ? (
              <img 
                src={vendor.logo_url} 
                alt={vendor.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Building className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-base">{vendor.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-circle-accent text-circle-accent" />
                    <span className="text-sm font-medium">{vendor.rating}</span>
                    <span className="text-xs text-muted-foreground">({vendor.review_count})</span>
                  </div>
                )}
                {vendor.is_verified && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {getRiskBadge(riskLevel)}
        </div>

        {/* Compliance Alert */}
        <div className="mb-4">
          {getComplianceAlert(riskLevel)}
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {vendor.description}
          </p>
        )}

        {/* Service Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>Service Area: {serviceArea}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span>Ad Budget: {mockBudgetRange}</span>
          </div>
          {vendor.service_radius_miles && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Radius: {vendor.service_radius_miles} miles</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-circle-primary">{vendor.co_marketing_agents}</div>
            <div className="text-xs text-muted-foreground">Co-Marketing Agents</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-circle-primary">{vendor.campaigns_funded}</div>
            <div className="text-xs text-muted-foreground">Campaigns Funded</div>
          </div>
        </div>

        {/* Available Services */}
        <div className="mb-4">
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
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {riskLevel === 'high' ? (
          <>
            <Button 
              variant="outline"
              onClick={() => onViewProfile?.(vendor.id)}
              className="w-full"
            >
              View Compliance Guide
            </Button>
            <Button 
              onClick={() => onConnect?.(vendor.id)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Contact with Caution
            </Button>
          </>
        ) : riskLevel === 'medium' ? (
          <>
            <Button 
              variant="outline"
              onClick={() => onViewProfile?.(vendor.id)}
              className="w-full"
            >
              View Guidelines
            </Button>
            <Button 
              onClick={() => onConnect?.(vendor.id)}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Contact
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={() => onConnect?.(vendor.id)}
              className="w-full"
            >
              Contact
            </Button>
            <Button 
              variant="outline"
              onClick={() => onViewProfile?.(vendor.id)}
              className="w-full"
            >
              View Profile
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};