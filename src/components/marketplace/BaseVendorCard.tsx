import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Award
} from "lucide-react";

export interface BaseVendorData {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  rating?: number;
  review_count?: number;
  is_verified?: boolean;
  co_marketing_agents?: number;
  campaigns_funded?: number;
  vendor_type?: string;
  specialties?: string[];
  phone?: string;
  contact_email?: string;
  licensed_states?: string[];
  nmls_id?: string;
  service_states?: string[];
}

interface LocalRepresentative {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  photo_url?: string;
}

export interface BaseVendorCardProps {
  vendor: BaseVendorData;
  onViewProfile?: (vendorId: string) => void;
  onConnect?: (vendor: BaseVendorData, e?: React.MouseEvent) => void;
  onLearnMore?: (vendor: BaseVendorData, e?: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showArrow?: boolean;
  showSpecialties?: boolean;
  showContact?: boolean;
  showStats?: boolean;
  showConnectButton?: boolean;
  localRepresentative?: LocalRepresentative;
  className?: string;
}

export const BaseVendorCard = ({
  vendor,
  onViewProfile,
  onConnect,
  onLearnMore,
  onMouseEnter,
  onMouseLeave,
  disabled = false,
  variant = 'default',
  showArrow = false,
  showSpecialties = true,
  showContact = false,
  showStats = true,
  showConnectButton = true,
  localRepresentative,
  className = ""
}: BaseVendorCardProps) => {
  const {
    id,
    name,
    description,
    rating = 0,
    review_count = 0,
    location,
    phone,
    contact_email,
    logo_url,
    is_verified,
    co_marketing_agents = 0,
    campaigns_funded = 0,
    vendor_type,
    specialties = []
  } = vendor;

  const handleCardClick = () => {
    if (onViewProfile && !disabled) {
      onViewProfile(id);
    }
  };

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnect && !disabled) {
      onConnect(vendor, e);
    }
  };

  const handleLearnMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLearnMore && !disabled) {
      onLearnMore(vendor, e);
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50 h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {is_verified && (
          <Badge className="bg-emerald-500 text-white text-xs font-medium flex items-center gap-1">
            <Award className="w-3 h-3" />
            Verified
          </Badge>
        )}
        {vendor_type && (
          <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
            {vendor_type}
          </Badge>
        )}
      </div>

      {/* Logo Image - Fixed height like service cards */}
      <div className="relative h-48 overflow-hidden bg-white flex-shrink-0 p-4">
        {logo_url ? (
          <img
            src={logo_url}
            alt={`${name} logo`}
            className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
            <Building className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        {/* Title - Fixed height like service cards */}
        <div className="h-6 mb-3">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {name}
          </h3>
        </div>

        {/* Rating */}
        {(rating > 0 || review_count > 0) && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              {rating > 0 ? `${rating.toFixed(1)} (${review_count})` : `(${review_count})`}
            </span>
          </div>
        )}

        {/* Description - Fixed height with line clamp */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-3">
            {description}
          </p>
        )}

        {/* Specialties - Fixed height */}
        {showSpecialties && specialties.length > 0 && (
          <div className="h-8 mb-3">
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{specialties.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Location and Contact Info */}
        <div className="space-y-2 mb-3 flex-grow">
          {location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          
          {showContact && phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{phone}</span>
            </div>
          )}
          
          {showContact && contact_email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{contact_email}</span>
            </div>
          )}
        </div>

        {/* Stats - Similar to service card pricing section */}
        {showStats && (co_marketing_agents > 0 || campaigns_funded > 0) && (
          <div className="space-y-2 mb-3">
            {co_marketing_agents > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">Active Agents:</span>
                </div>
                <span className="text-sm font-medium">{co_marketing_agents}</span>
              </div>
            )}
            {campaigns_funded > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Campaigns:</span>
                </div>
                <span className="text-sm font-medium">{campaigns_funded}</span>
              </div>
            )}
          </div>
        )}

        {/* Local Representative */}
        {localRepresentative && (
          <div className="border-t pt-3 mt-auto">
            <h4 className="text-sm font-medium mb-2">Local Representative</h4>
            <div className="flex items-center space-x-2">
              {localRepresentative.photo_url ? (
                <img
                  src={localRepresentative.photo_url}
                  alt={localRepresentative.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {localRepresentative.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{localRepresentative.name}</p>
                <p className="text-xs text-muted-foreground truncate">{localRepresentative.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onLearnMore && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleLearnMoreClick}
              disabled={disabled}
            >
              Learn More
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          
          {showConnectButton && onConnect && (
            <Button
              size="sm"
              className="flex-1"
              onClick={handleConnectClick}
              disabled={disabled}
            >
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};