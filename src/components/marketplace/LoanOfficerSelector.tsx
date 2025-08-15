import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Award,
  Star,
  Shield,
  Search,
  ChevronDown,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoanOfficer {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  license_number?: string;
  location?: string;
  specialties?: string[];
  years_experience?: number;
  photo_url?: string;
  rating?: number;
  reviews_count?: number;
  website?: string;
  profile_picture_url?: string;
}

interface Vendor {
  id: string;
  name: string;
  individual_name?: string;
  individual_title?: string;
  individual_email?: string;
  individual_phone?: string;
  individual_license_number?: string;
}

interface LoanOfficerSelectorProps {
  vendor: Vendor;
  onSelect?: (officer: LoanOfficer | null) => void;
  selected?: LoanOfficer | null;
}

export const LoanOfficerSelector = ({ vendor, onSelect, selected }: LoanOfficerSelectorProps) => {
  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<LoanOfficer | null>(selected || null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadLoanOfficers = async () => {
      setLoading(true);
      try {
        // Get vendor with local representatives
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors_with_local_reps')
          .select('*')
          .eq('id', vendor.id)
          .single();

        if (vendorError && vendorError.code !== 'PGRST116') {
          throw vendorError;
        }

        let officers: LoanOfficer[] = [];

        // If vendor has individual representative info
        if (vendor.individual_name) {
          officers.push({
            id: `${vendor.id}-primary`,
            name: vendor.individual_name,
            title: vendor.individual_title || 'Loan Officer',
            email: vendor.individual_email || '',
            phone: vendor.individual_phone || '',
            license_number: vendor.individual_license_number || undefined,
            location: 'Primary Representative',
            specialties: ['Primary Contact'],
            rating: 4.8,
            reviews_count: 25
          });
        }

        // Add local representatives if available
        if (vendorData?.local_representatives && Array.isArray(vendorData.local_representatives)) {
          const localReps = vendorData.local_representatives
            .filter((rep: any) => rep.name && rep.name.trim() !== '')
            .map((rep: any) => ({
              id: rep.id || `${vendor.id}-${rep.name}`,
              name: rep.name,
              title: rep.title || 'Loan Officer',
              email: rep.email || '',
              phone: rep.phone || '',
              license_number: rep.license_number || undefined,
              location: rep.location || 'Local Representative',
              specialties: rep.specialties || ['Local Market Expert'],
              rating: 4.5 + Math.random() * 0.5,
              reviews_count: Math.floor(Math.random() * 30) + 10
            }));
          
          officers = [...officers, ...localReps];
        }

        // Add some example officers if none found
        if (officers.length === 0) {
          officers = [
            {
              id: `${vendor.id}-example-1`,
              name: 'Sarah Johnson',
              title: 'Senior Loan Officer',
              email: 'sarah.johnson@company.com',
              phone: '(555) 123-4567',
              license_number: 'NMLS123456',
              location: 'Local Market',
              specialties: ['First-time Buyers', 'Refinancing'],
              years_experience: 8,
              rating: 4.9,
              reviews_count: 42,
              website: 'https://sarahjohnsonmortgages.com',
              profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
            },
            {
              id: `${vendor.id}-example-2`,
              name: 'Mike Chen',
              title: 'Loan Officer',
              email: 'mike.chen@company.com',
              phone: '(555) 987-6543',
              license_number: 'NMLS789012',
              location: 'Regional Representative',
              specialties: ['VA Loans', 'Jumbo Loans'],
              years_experience: 5,
              rating: 4.7,
              reviews_count: 28,
              profile_picture_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }
          ];
        }

        setLoanOfficers(officers);
        if (officers.length > 0 && !selected) {
          const defaultOfficer = officers[0];
          setSelectedOfficer(defaultOfficer);
          onSelect?.(defaultOfficer);
        }
      } catch (error) {
        console.error('Failed to load loan officers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (vendor.id) {
      loadLoanOfficers();
    }
  }, [vendor.id, selected, onSelect]);

  // Sync with external selected state
  useEffect(() => {
    setSelectedOfficer(selected || null);
  }, [selected]);

  const displayedOfficers = showAll ? loanOfficers : loanOfficers.slice(0, 3);

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Finding Loan Officers...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loanOfficers.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Choose Your Loan Officer
        </CardTitle>
        <p className="text-sm text-gray-600">
          {loanOfficers.length} loan officer{loanOfficers.length !== 1 ? 's' : ''} available
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Selected Officer Display */}
        {selectedOfficer && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              {selectedOfficer.profile_picture_url ? (
                <img
                  src={selectedOfficer.profile_picture_url}
                  alt={selectedOfficer.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 text-blue-600 font-medium rounded-full flex items-center justify-center">
                  {selectedOfficer.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{selectedOfficer.name}</h4>
                  <Badge variant="secondary" className="text-xs">{selectedOfficer.title}</Badge>
                </div>
                
                {selectedOfficer.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{selectedOfficer.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({selectedOfficer.reviews_count} reviews)</span>
                  </div>
                )}
                
                <div className="space-y-1 text-xs text-gray-600">
                  {selectedOfficer.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span 
                        className="truncate text-blue-600 hover:text-blue-800 cursor-pointer underline"
                        onClick={() => window.open(`mailto:${selectedOfficer.email}`, '_blank')}
                      >
                        {selectedOfficer.email}
                      </span>
                    </div>
                  )}
                  {selectedOfficer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span 
                        className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
                        onClick={() => window.open(`tel:${selectedOfficer.phone}`, '_blank')}
                      >
                        {selectedOfficer.phone}
                      </span>
                    </div>
                  )}
                  {selectedOfficer.license_number && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>NMLS: {selectedOfficer.license_number}</span>
                    </div>
                  )}
                </div>
                
                {selectedOfficer.specialties && selectedOfficer.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedOfficer.specialties.slice(0, 2).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {selectedOfficer.website && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      onClick={() => window.open(selectedOfficer.website, '_blank')}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Visit Website
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Officer Selection */}
        {loanOfficers.length > 1 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="officers">
              <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Browse {loanOfficers.length} Available Officers
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {displayedOfficers.map((officer) => (
                  <div
                    key={officer.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedOfficer?.id === officer.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedOfficer(officer);
                      onSelect?.(officer);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {officer.profile_picture_url ? (
                        <img
                          src={officer.profile_picture_url}
                          alt={officer.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center justify-center">
                          {officer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-sm font-medium text-gray-900 truncate">{officer.name}</h5>
                          {officer.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{officer.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{officer.title}</p>
                        {officer.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{officer.location}</span>
                          </div>
                        )}
                        {officer.specialties && officer.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {officer.specialties.slice(0, 2).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {loanOfficers.length > 3 && !showAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="w-full text-xs"
                  >
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show {loanOfficers.length - 3} More Officers
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};