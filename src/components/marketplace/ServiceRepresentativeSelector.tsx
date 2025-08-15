import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone, MapPin, Star, Award, Clock, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceRepresentative {
  id: string;
  vendor_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  profile_picture_url?: string;
  bio?: string;
  location?: string;
  specialties?: string[];
  years_experience?: number;
  website?: string;
  rating: number;
  reviews_count: number;
  is_primary: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Vendor {
  id: string;
  name: string;
  vendor_type?: string;
}

interface ServiceRepresentativeSelectorProps {
  vendor: Vendor;
  onSelect?: (representative: ServiceRepresentative) => void;
  selected?: ServiceRepresentative;
}

const getVendorTypeDisplayName = (vendorType?: string): string => {
  const typeMap: Record<string, string> = {
    'mortgage': 'Loan Officer',
    'title': 'Title Agent',
    'insurance': 'Insurance Agent',
    'inspection': 'Inspector',
    'photography': 'Photographer',
    'staging': 'Staging Professional',
    'moving': 'Moving Specialist',
    'warranty': 'Warranty Representative'
  };
  
  return typeMap[vendorType || ''] || 'Representative';
};

const getVendorTypeTitle = (vendorType?: string): string => {
  const titleMap: Record<string, string> = {
    'mortgage': 'Choose Your Loan Officer',
    'title': 'Select Your Title Agent',
    'insurance': 'Choose Your Insurance Agent',
    'inspection': 'Select Your Inspector',
    'photography': 'Choose Your Photographer',
    'staging': 'Select Your Staging Professional',
    'moving': 'Choose Your Moving Specialist',
    'warranty': 'Select Your Warranty Representative'
  };
  
  return titleMap[vendorType || ''] || 'Choose Your Representative';
};

export const ServiceRepresentativeSelector: React.FC<ServiceRepresentativeSelectorProps> = ({
  vendor,
  onSelect,
  selected
}) => {
  const [representatives, setRepresentatives] = useState<ServiceRepresentative[]>([]);
  const [selectedRepresentative, setSelectedRepresentative] = useState<ServiceRepresentative | null>(selected || null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadRepresentatives();
  }, [vendor.id]);

  const loadRepresentatives = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('service_representatives')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading service representatives:', error);
        return;
      }

      const reps = data || [];
      setRepresentatives(reps);

      // Auto-select primary representative if none selected
      if (!selected && reps.length > 0) {
        const primaryRep = reps.find(rep => rep.is_primary) || reps[0];
        setSelectedRepresentative(primaryRep);
        onSelect?.(primaryRep);
      }
    } catch (error) {
      console.error('Error loading service representatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepresentativeSelect = (representative: ServiceRepresentative) => {
    setSelectedRepresentative(representative);
    onSelect?.(representative);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (representatives.length === 0) {
    return null;
  }

  const displayedRepresentatives = showAll ? representatives : representatives.slice(0, 3);
  const hasMoreRepresentatives = representatives.length > 3;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {getVendorTypeTitle(vendor.vendor_type)}
      </h3>

      {/* Selected Representative Display */}
      {selectedRepresentative && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedRepresentative.profile_picture_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedRepresentative.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {selectedRepresentative.name}
                  </h4>
                  {selectedRepresentative.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedRepresentative.title || getVendorTypeDisplayName(vendor.vendor_type)}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {selectedRepresentative.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{selectedRepresentative.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {selectedRepresentative.years_experience && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{selectedRepresentative.years_experience}+ years</span>
                    </div>
                  )}
                  {selectedRepresentative.license_number && (
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      <span>License: {selectedRepresentative.license_number}</span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {selectedRepresentative.email && (
                    <a
                      href={`mailto:${selectedRepresentative.email}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{selectedRepresentative.email}</span>
                    </a>
                  )}
                  {selectedRepresentative.phone && (
                    <a
                      href={`tel:${selectedRepresentative.phone}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{selectedRepresentative.phone}</span>
                    </a>
                  )}
                  {selectedRepresentative.website && (
                    <a
                      href={selectedRepresentative.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Globe className="h-3 w-3" />
                      <span>{selectedRepresentative.website}</span>
                    </a>
                  )}
                </div>

                {selectedRepresentative.specialties && selectedRepresentative.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRepresentative.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Representative Selection Accordion */}
      {representatives.length > 1 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="representatives">
            <AccordionTrigger className="text-sm">
              Browse All {getVendorTypeDisplayName(vendor.vendor_type)}s ({representatives.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 mt-3">
                {displayedRepresentatives.map((representative) => (
                  <Card
                    key={representative.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedRepresentative?.id === representative.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleRepresentativeSelect(representative)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={representative.profile_picture_url} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {representative.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm text-foreground truncate">
                              {representative.name}
                            </h5>
                            {representative.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-1">
                            {representative.title || getVendorTypeDisplayName(vendor.vendor_type)}
                          </p>
                          
                          {representative.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{representative.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {representative.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{representative.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {representative.years_experience && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{representative.years_experience}y</span>
                              </div>
                            )}
                          </div>

                          {representative.specialties && representative.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {representative.specialties.slice(0, 2).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {hasMoreRepresentatives && !showAll && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="w-full"
                  >
                    View All {representatives.length} {getVendorTypeDisplayName(vendor.vendor_type)}s
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};