import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Mail, ExternalLink, Award, Users, TrendingUp, Building, ArrowRight } from 'lucide-react';

export interface BaseVendorData {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  review_count?: number;
  location?: string;
  phone?: string;
  contact_email?: string;
  website_url?: string;
  logo_url?: string;
  is_verified?: boolean;
  co_marketing_agents?: number;
  campaigns_funded?: number;
  vendor_type?: string;
  specialties?: string[];
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
  variant?: 'compact' | 'standard' | 'detailed';
  className?: string;
  onConnect?: (vendorId: string) => void;
  onViewProfile?: (vendorId: string) => void;
  onLearnMore?: (vendor: BaseVendorData, e?: React.MouseEvent) => void;
  localRepresentative?: LocalRepresentative;
  connectButtonText?: string;
  viewButtonText?: string;
  showStats?: boolean;
  showContact?: boolean;
  showSpecialties?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const BaseVendorCard: React.FC<BaseVendorCardProps> = ({
  vendor,
  variant = 'standard',
  className = '',
  onConnect,
  onViewProfile,
  onLearnMore,
  localRepresentative,
  connectButtonText = 'Request Co-Pay Support',
  viewButtonText = 'View Profile',
  showStats = true,
  showContact = false,
  showSpecialties = true,
  showArrow = false,
  disabled = false,
  children,
  onMouseEnter,
  onMouseLeave
}) => {
  const {
    id,
    name,
    description,
    rating = 0,
    review_count = 0,
    location,
    phone,
    contact_email,
    website_url,
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
      onConnect(id);
    }
  };

  const handleLearnMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLearnMore && !disabled) {
      onLearnMore(vendor, e);
    }
  };

  const getCardSize = () => {
    // Remove max-width constraints to allow grid to control sizing
    return '';
  };

  const getLogoSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-10 h-10';
      case 'detailed':
        return 'w-16 h-16';
      default:
        return 'w-12 h-12';
    }
  };

  return (
    <Card 
      className={`h-full flex flex-col ${getCardSize()} ${onViewProfile && !disabled ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CardHeader className={variant === 'compact' ? 'pb-3' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {logo_url ? (
              <img
                src={logo_url}
                alt={`${name} logo`}
                className={`${getLogoSize()} rounded-lg object-cover`}
              />
            ) : (
              <div className={`${getLogoSize()} rounded-lg bg-muted flex items-center justify-center`}>
                <Building className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold leading-tight truncate ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>
                {name}
              </h3>
              {vendor_type && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {vendor_type}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {is_verified && (
              <Badge variant="default" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                Verified
              </Badge>
            )}
            {showArrow && (
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {(rating > 0 || review_count > 0) && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {rating.toFixed(1)} ({review_count} reviews)
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        {description && variant !== 'compact' && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        )}

        {showSpecialties && specialties.length > 0 && variant !== 'compact' && (
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{specialties.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-2">
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

        {showStats && (co_marketing_agents > 0 || campaigns_funded > 0) && (
          <div className="flex justify-between text-sm">
            {co_marketing_agents > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-1" />
                {co_marketing_agents} agents
              </div>
            )}
            {campaigns_funded > 0 && (
              <div className="flex items-center text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1" />
                {campaigns_funded} campaigns
              </div>
            )}
          </div>
        )}

        {localRepresentative && variant === 'detailed' && (
          <div className="border-t pt-3">
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
              <div>
                <p className="text-sm font-medium">{localRepresentative.name}</p>
                <p className="text-xs text-muted-foreground">{localRepresentative.title}</p>
              </div>
            </div>
          </div>
        )}

        {children}

        <div className={`flex ${variant === 'compact' ? 'flex-col gap-2' : 'space-x-2'} pt-2`}>
          {onConnect && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleConnectClick}
              disabled={disabled}
            >
              {connectButtonText}
            </Button>
          )}
          {onLearnMore && (
            <Button 
              size="sm" 
              variant="outline"
              className={variant === 'compact' ? 'w-full' : ''}
              onClick={handleLearnMoreClick}
              disabled={disabled}
            >
              {variant === 'compact' ? 'Learn More' : <ExternalLink className="w-4 h-4" />}
            </Button>
          )}
          {onViewProfile && !onConnect && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleCardClick}
              disabled={disabled}
            >
              {viewButtonText}
            </Button>
          )}
          {website_url && !onLearnMore && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(website_url, '_blank');
              }}
              disabled={disabled}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};