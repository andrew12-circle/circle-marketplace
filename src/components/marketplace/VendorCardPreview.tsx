import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Mail, ExternalLink, Award, Users, TrendingUp } from 'lucide-react';

interface VendorPreviewData {
  name: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  phone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  logoUrl?: string;
  isVerified?: boolean;
  coMarketingAgents?: number;
  campaignsFunded?: number;
  vendorType?: string;
  specialties?: string[];
}

interface VendorCardPreviewProps {
  vendorData: VendorPreviewData;
  className?: string;
}

export const VendorCardPreview: React.FC<VendorCardPreviewProps> = ({ 
  vendorData, 
  className 
}) => {
  const {
    name,
    description,
    rating = 0,
    reviewCount = 0,
    location,
    phone,
    contactEmail,
    websiteUrl,
    logoUrl,
    isVerified,
    coMarketingAgents = 0,
    campaignsFunded = 0,
    vendorType,
    specialties = []
  } = vendorData;

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-lg font-semibold text-muted-foreground">
                  {name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight">{name}</CardTitle>
              {vendorType && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {vendorType}
                </Badge>
              )}
            </div>
          </div>
          {isVerified && (
            <Badge variant="default" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
        
        {(rating > 0 || reviewCount > 0) && (
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
              {rating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        )}

        {specialties.length > 0 && (
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
              <MapPin className="w-4 h-4 mr-2" />
              {location}
            </div>
          )}
          
          {phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-2" />
              {phone}
            </div>
          )}
          
          {contactEmail && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-2" />
              {contactEmail}
            </div>
          )}
        </div>

        {(coMarketingAgents > 0 || campaignsFunded > 0) && (
          <div className="flex justify-between text-sm">
            {coMarketingAgents > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-1" />
                {coMarketingAgents} agents
              </div>
            )}
            {campaignsFunded > 0 && (
              <div className="flex items-center text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1" />
                {campaignsFunded} campaigns
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button size="sm" className="flex-1">
            View Profile
          </Button>
          {websiteUrl && (
            <Button size="sm" variant="outline">
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};