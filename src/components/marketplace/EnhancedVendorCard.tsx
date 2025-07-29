import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Users, TrendingUp, ExternalLink } from "lucide-react";

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
}

interface EnhancedVendorCardProps {
  vendor: Vendor;
  onConnect?: (vendorId: string) => void;
  onViewProfile?: (vendorId: string) => void;
}

export const EnhancedVendorCard = ({ vendor, onConnect, onViewProfile }: EnhancedVendorCardProps) => {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={vendor.logo_url || "/placeholder.svg"}
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {vendor.name}
              </h3>
              {vendor.is_verified && (
                <Badge className="bg-circle-primary text-primary-foreground text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {vendor.rating}
              </span>
              <span className="text-sm text-muted-foreground">
                ({vendor.review_count} reviews)
              </span>
            </div>
            {vendor.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{vendor.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {vendor.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 py-3 border-t border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-circle-primary mb-1">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{vendor.co_marketing_agents}</span>
            </div>
            <span className="text-xs text-muted-foreground">Co-marketing</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-circle-accent mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{vendor.campaigns_funded}</span>
            </div>
            <span className="text-xs text-muted-foreground">Campaigns</span>
          </div>
        </div>

        {/* Investment Highlight */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
          <p className="text-sm font-medium text-circle-primary mb-1">
            💰 Invests in Your Business
          </p>
          <p className="text-xs text-muted-foreground">
            This vendor provides financial support for marketing campaigns
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            onClick={() => onConnect?.(vendor.id)}
          >
            Connect
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onViewProfile?.(vendor.id)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};