import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, MapPin, Star, Users, TrendingUp, Building, Plus, CheckCircle, Info, AlertTriangle } from "lucide-react";
import confirmationImage from "@/assets/confirmation-image.png";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/useLocation";
import { InviteVendorModal } from "./InviteVendorModal";
import { VendorFunnelModal } from "./VendorFunnelModal";
import { VendorReferralModal } from "./VendorReferralModal";
import { CoPayVendorCard } from "./CoPayVendorCard";
import { isSSP, isNonSSP, getVendorTypeInfo, filterVendorsForService } from "@/utils/sspHelpers";

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  vendor_type?: string;
  parent_vendor_id?: string | null;
}

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorSelect: (vendor: Vendor) => void;
  service: {
    id: string;
    title: string;
    co_pay_price?: string;
    retail_price?: string;
    pro_price?: string;
    image_url?: string;
    respa_split_limit?: number;
    requires_quote?: boolean;
  };
}

export const VendorSelectionModal = ({ 
  isOpen, 
  onClose, 
  onVendorSelect, 
  service 
}: VendorSelectionModalProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingVendor, setIsSelectingVendor] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const [funnelVendor, setFunnelVendor] = useState<Vendor | null>(null);
  const [showAllVendors, setShowAllVendors] = useState(false);
  const { toast } = useToast();
  const { location } = useLocation();
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [pledgedPointsMap, setPledgedPointsMap] = useState<Record<string, number>>({});

  // Helper function to get state abbreviation - must be defined before useMemo
  const getStateAbbreviation = (stateName: string) => {
    const stateMap: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateMap[stateName];
  };

  // Memoized filtered vendors to avoid re-computation
  const filteredVendors = useMemo(() => {
    console.log('VendorSelectionModal: Filtering vendors...', { 
      totalVendors: vendors.length, 
      searchQuery, 
      userLocation: location?.state,
      showAllVendors
    });

    let filtered = filterVendorsForService(vendors, service, !showAllVendors);

    // Apply location filter if available - but be more lenient
    if (location?.state && vendors.length > 0) {
      const locationFiltered = filtered.filter(vendor => {
        // Check service_states array
        if (vendor.service_states?.includes(location.state)) return true;
        // Check location string
        if (vendor.location?.toLowerCase().includes(location.state.toLowerCase())) return true;
        // Check for state abbreviations (e.g., "TN" for Tennessee)
        const stateAbbrev = getStateAbbreviation(location.state);
        if (stateAbbrev && vendor.service_states?.includes(stateAbbrev)) return true;
        return false;
      });
      
      // Only apply location filter if we have matches, otherwise show all
      if (locationFiltered.length > 0) {
        filtered = locationFiltered;
        console.log('VendorSelectionModal: Applied location filter, found matches:', locationFiltered.length);
      } else {
        console.log('VendorSelectionModal: No location matches, showing all vendors');
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.description?.toLowerCase().includes(searchLower) ||
        vendor.location?.toLowerCase().includes(searchLower) ||
        vendor.service_states?.some(state => 
          state.toLowerCase().includes(searchLower)
        )
      );
    }

    // Sort with Non-SSP first if not showing all vendors
    if (!showAllVendors) {
      filtered.sort((a, b) => {
        const aIsNonSSP = isNonSSP(a);
        const bIsNonSSP = isNonSSP(b);
        if (aIsNonSSP && !bIsNonSSP) return -1;
        if (!aIsNonSSP && bIsNonSSP) return 1;
        return 0;
      });
    }

    console.log('VendorSelectionModal: Filtering complete', { 
      filteredCount: filtered.length,
      originalCount: vendors.length 
    });

    return filtered;
  }, [vendors, searchQuery, location?.state, getStateAbbreviation, service, showAllVendors]);

  useEffect(() => {
    if (isOpen) {
      console.log('VendorSelectionModal: Modal opened, loading vendors...');
      // Reset state immediately when modal opens
      setVendors([]);
      setSearchQuery("");
      setSelectedVendor(null);
      setShowConfirmation(false);
      setShowFunnelModal(false);
      setFunnelVendor(null);
      setExpandedCompanyId(null);
      setPledgedPointsMap({});
      setShowAllVendors(false); // Default to Non-SSP preferred
      
      loadVendors();
    } else {
      console.log('VendorSelectionModal: Modal closed, resetting state...');
    }
  }, [isOpen]);

  // Load pledged points when vendors change
  useEffect(() => {
    if (vendors.length > 0) {
      fetchPledges();
    }
  }, [vendors]);

  const fetchPledges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || vendors.length === 0) return;
      
      const vendorIds = Array.from(new Set(vendors.map(v => v.id)));
      const { data, error } = await supabase
        .from('point_allocations')
        .select('vendor_id, remaining_points, start_date, end_date, status')
        .eq('agent_id', user.id)
        .in('vendor_id', vendorIds)
        .eq('status', 'active');
        
      if (error) throw error;
      
      const today = new Date();
      const map: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const startOk = !row.start_date || new Date(row.start_date) <= today;
        const endOk = !row.end_date || new Date(row.end_date) >= today;
        if (startOk && endOk) {
          map[row.vendor_id] = (map[row.vendor_id] || 0) + (row.remaining_points || 0);
        }
      });
      setPledgedPointsMap(map);
    } catch (e) {
      console.error('VendorSelectionModal: Error loading pledged points', e);
    }
  };

  const loadVendors = async () => {
    console.log('VendorSelectionModal: Starting to load vendors...');
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Authentication error:', userError);
        return;
      }

      // Query vendors with calculated real-time stats
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          id, 
          name, 
          description, 
          logo_url, 
          location, 
          rating, 
          review_count, 
          is_verified, 
          service_states, 
          vendor_type, 
          parent_vendor_id
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('rating', { ascending: false })
        .limit(20);

      console.log('VendorSelectionModal: Supabase response:', { data, error, dataLength: data?.length });

      if (error) {
        console.error('VendorSelectionModal: Supabase error details:', error);
        throw error;
      }

      // Filter vendors based on agent profile and calculate real-time stats
      const vendorsWithStatsAndFiltering = await Promise.all(
        (data || []).map(async (vendor) => {
          try {
            // Check if agent matches vendor criteria
            const { data: matchResult, error: matchError } = await supabase
              .rpc('check_agent_vendor_match', { 
                p_agent_id: user.id, 
                p_vendor_id: vendor.id 
              });
            
            if (matchError) {
              console.error('Error checking agent match for vendor:', vendor.id, matchError);
              // If match check fails, include vendor by default
            }

            // Calculate real-time stats
            const { data: statsData, error: statsError } = await supabase
              .rpc('calculate_vendor_stats', { vendor_uuid: vendor.id });
            
            if (statsError) {
              console.error('Error calculating stats for vendor:', vendor.id, statsError);
            }

            return {
              ...vendor,
              co_marketing_agents: (statsData as any)?.co_marketing_agents || 0,
              campaigns_funded: (statsData as any)?.campaigns_funded || 0,
              matches_agent_profile: matchResult !== false // Include if match check failed
            };
          } catch (err) {
            console.error('Error processing vendor:', err);
            return {
              ...vendor,
              co_marketing_agents: 0,
              campaigns_funded: 0,
              matches_agent_profile: true // Include by default on error
            };
          }
        })
      );

      // Filter out vendors that don't match agent criteria
      const filteredVendors = vendorsWithStatsAndFiltering.filter(vendor => 
        vendor.matches_agent_profile
      );

      setVendors(filteredVendors);
      console.log('VendorSelectionModal: Vendors set successfully with live stats and filtering, count:', filteredVendors.length);
    } catch (error) {
      console.error('VendorSelectionModal: Error loading vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('VendorSelectionModal: Loading complete');
    }
  };

  const handleVendorSelect = async (vendor: Vendor) => {
    if (isSelectingVendor) return;
    
    try {
      setIsSelectingVendor(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Authentication error:', userError);
        toast({
          title: "Authentication Error",
          description: "Please log in to send co-pay requests.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedVendor(vendor);
      setShowConfirmation(true);
      onVendorSelect(vendor);
      
      toast({
        title: "Request Sent!",
        description: `Co-pay request sent to ${vendor.name}`,
      });

      const coPayRequestPromise = supabase
        .from('co_pay_requests')
        .insert({
          agent_id: user.id,
          vendor_id: vendor.id,
          service_id: service.id,
          requested_split_percentage: service.respa_split_limit || 50,
          status: 'pending',
          agent_notes: `Co-pay request for "${service.title}" service`
        })
        .select('id')
        .single();

      try {
        const { data: coPayRequest, error } = await coPayRequestPromise;

        if (error) {
          console.error('Error creating co-pay request:', error);
          setShowConfirmation(false);
          setSelectedVendor(null);
          toast({
            title: "Error",
            description: "Failed to create co-pay request. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const cartItem = {
          id: coPayRequest.id,
          type: 'co-pay-request',
          vendor: vendor,
          service: {
            title: service.title,
            image_url: service.image_url,
            co_pay_price: service.co_pay_price,
            retail_price: service.retail_price,
            pro_price: service.pro_price
          },
          status: 'pending-approval',
          requestedSplit: service.respa_split_limit || 50,
          createdAt: new Date().toISOString()
        };

        const addToCartEvent = new CustomEvent('addCoPayToCart', { 
          detail: cartItem 
        });
        window.dispatchEvent(addToCartEvent);
      } catch (backgroundError) {
        console.error('Background database error:', backgroundError);
      }
    } catch (error) {
      console.error('Error in vendor selection:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSelectingVendor(false);
    }
  };

  const handleLearnMore = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setFunnelVendor(vendor);
    setShowFunnelModal(true);
  };

  const handleCoMarketingRequest = (vendorId: string) => {
    const vendor = funnelVendor;
    if (vendor) {
      setShowFunnelModal(false);
      handleVendorSelect(vendor);
    }
  };

  const handleSendAnotherRequest = () => {
    setShowConfirmation(false);
    setSelectedVendor(null);
  };

  const handleFinish = () => {
    setShowConfirmation(false);
    setSelectedVendor(null);
    onClose();
    const cartEvent = new CustomEvent('openCart');
    window.dispatchEvent(cartEvent);
  };

  const mockBudgetRange = (vendor: Vendor) => {
    const rating = vendor.rating || 3;
    if (rating >= 4.5) return "$1,000-3,000/mo";
    if (rating >= 4) return "$500-1,500/mo";
    return "$1,000-2,500/mo";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-6xl max-h-[95vh] overflow-hidden z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle>Select Co-Pay Partner</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose a vendor to help with "{service.title}" - they'll cover {service.respa_split_limit}% of the cost
            </p>
            {location?.state && (
              <p className="text-xs text-muted-foreground">
                Showing vendors available in {location.state}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 shrink-0 mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReferralModal(true)}
              className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Your Vendors
            </Button>
          </div>
        </DialogHeader>
        
        {showConfirmation ? (
          <div className="text-center py-12">
            <img src={confirmationImage} alt="Success" className="h-24 mx-auto mb-4" />
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Request Sent!</h3>
            <p className="text-muted-foreground mb-6">
              Your co-pay request has been sent to {selectedVendor?.name}. They've been notified via push notification, text, and email. They have 3 days to respond. You'll be notified instantly once they respond. 
              <br /><br />
              <strong>The request has been added to your cart as "Pending Approval".</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleSendAnotherRequest} variant="outline">
                Send Another Request
              </Button>
              <Button 
                onClick={() => {
                  const cartEvent = new CustomEvent('openCart');
                  window.dispatchEvent(cartEvent);
                }}
                variant="outline"
              >
                View Cart
              </Button>
              <Button onClick={handleFinish}>
                Finish
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search vendors by name, location, or service area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

           <div className="max-h-[60vh] overflow-y-auto relative">
            {isSelectingVendor && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Sending co-pay request...</p>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                          <div className="flex gap-2 mt-3">
                            <Skeleton className="h-7 flex-1" />
                            <Skeleton className="h-7 flex-1" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  {vendors.length === 0 
                    ? "Loading vendors..." 
                    : searchQuery 
                      ? "No vendors found matching your search." 
                      : "No vendors available."
                  }
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const companies = filteredVendors.filter(v => !v.parent_vendor_id);
                  const childrenByParent = filteredVendors.reduce((acc, v) => {
                    if (v.parent_vendor_id) {
                      (acc[v.parent_vendor_id] ||= []).push(v);
                    }
                    return acc;
                  }, {} as Record<string, Vendor[]>);
                  const orphanChildren = filteredVendors.filter(v => v.parent_vendor_id && !companies.find(c => c.id === v.parent_vendor_id));

                  return (
                    <>
                      {companies.map((company) => {
                        const children = childrenByParent[company.id] || [];
                        const pledged = pledgedPointsMap[company.id] || 0;
                        const isCircleHomeLoan = company.name.toLowerCase().includes('circle home loan');
                        return (
                          <Card 
                            key={company.id} 
                            className={`transition-shadow border ${
                              isCircleHomeLoan 
                                ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-200/50 ring-2 ring-blue-200' 
                                : ''
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                  {company.logo_url ? (
                                    <img 
                                      src={company.logo_url} 
                                      alt={company.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Building className="w-8 h-8 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-start justify-between mb-2">
                                     <h3 className="font-semibold text-sm truncate">{company.name}</h3>
                                     <div className="flex items-center gap-2">
                                       {(() => {
                                         const typeInfo = getVendorTypeInfo(company);
                                         return (
                                           <TooltipProvider>
                                             <Tooltip>
                                               <TooltipTrigger>
                                                 <Badge variant={typeInfo.badgeVariant} className="text-xs">
                                                   {typeInfo.badge}
                                                 </Badge>
                                               </TooltipTrigger>
                                               <TooltipContent>
                                                 <p className="text-xs">{typeInfo.tooltip}</p>
                                               </TooltipContent>
                                             </Tooltip>
                                           </TooltipProvider>
                                         );
                                       })()}
                                       {pledged > 0 && (
                                         <Badge variant="outline" className="text-xs">Pledged: {pledged.toLocaleString()} pts</Badge>
                                       )}
                                       {company.is_verified && (
                                         <Badge variant="outline" className="text-xs">✓ Verified</Badge>
                                       )}
                                     </div>
                                   </div>

                                  {company.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{company.location}</span>
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <Users className="w-3 h-3 text-muted-foreground" />
                                      <span>{company.co_marketing_agents} agents • {company.campaigns_funded} campaigns</span>
                                    </div>
                                  </div>

                                  {company.description && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                      {company.description}
                                    </p>
                                  )}

                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => handleLearnMore(company, e)}
                                      className="text-xs h-7 flex-1"
                                      disabled={isSelectingVendor}
                                    >
                                      Learn More
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVendorSelect(company);
                                      }}
                                      className="text-xs h-7 flex-1"
                                      disabled={isSelectingVendor}
                                    >
                                      Request Copay
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedCompanyId(expandedCompanyId === company.id ? null : company.id);
                                      }}
                                      className="text-xs h-7 flex-1"
                                    >
                                      {expandedCompanyId === company.id ? 'Hide Loan Officers' : `View Loan Officers (${children.length})`}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {expandedCompanyId === company.id && children.length > 0 && (
                                <div className="mt-4 border-t pt-3 space-y-2 max-h-64 overflow-y-auto">
                                  {children.map((officer) => {
                                    const officerPledged = pledgedPointsMap[officer.id] || pledged;
                                    return (
                                      <div key={officer.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                          {officer.logo_url ? (
                                            <img src={officer.logo_url} alt={officer.name} className="w-full h-full object-cover rounded" />
                                          ) : (
                                            <Building className="w-5 h-5 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium truncate">{officer.name}</div>
                                            {officerPledged > 0 && (
                                              <Badge variant="outline" className="text-xs">Pledged: {officerPledged.toLocaleString()} pts</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-2 mt-2">
                                            <Button size="sm" variant="outline" onClick={(e) => handleLearnMore(officer, e)} className="text-xs h-7 flex-1">Learn</Button>
                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleVendorSelect(officer); }} className="text-xs h-7 flex-1">Select Officer</Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {orphanChildren.map((vendor) => {
                        const pledged = pledgedPointsMap[vendor.id] || 0;
                        return (
                          <Card key={vendor.id} className="cursor-pointer hover:shadow-md transition-shadow border" onClick={() => handleVendorSelect(vendor)}>
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                  {vendor.logo_url ? (
                                    <img 
                                      src={vendor.logo_url} 
                                      alt={vendor.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Building className="w-8 h-8 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-sm truncate">{vendor.name}</h3>
                                    <div className="flex items-center gap-2">
                                      {pledged > 0 && (
                                        <Badge variant="outline" className="text-xs">Pledged: {pledged.toLocaleString()} pts</Badge>
                                      )}
                                      {vendor.is_verified && (
                                        <Badge variant="outline" className="text-xs">✓ Verified</Badge>
                                      )}
                                    </div>
                                  </div>
                                  {vendor.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{vendor.location}</span>
                                    </div>
                                  )}
                                  <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="outline" onClick={(e) => handleLearnMore(vendor, e)} className="text-xs h-7">Learn More</Button>
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleVendorSelect(vendor); }} className="text-xs h-7">Select Partner</Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <VendorReferralModal 
      isOpen={showReferralModal}
      onClose={() => setShowReferralModal(false)}
      serviceTitle={service.title}
    />

    <InviteVendorModal 
      open={showInviteModal}
      onOpenChange={(open) => setShowInviteModal(open)}
    />

    {funnelVendor && (
      <VendorFunnelModal
        isOpen={showFunnelModal}
        onClose={() => {
          setShowFunnelModal(false);
          setFunnelVendor(null);
        }}
        vendor={funnelVendor}
        onCoMarketingRequest={handleCoMarketingRequest}
      />
    )}
    </>
  );
};
