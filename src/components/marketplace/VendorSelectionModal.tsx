import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, Users, TrendingUp, Building, Plus, CheckCircle } from "lucide-react";
import confirmationImage from "@/assets/confirmation-image.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/useLocation";
import { InviteVendorModal } from "./InviteVendorModal";
import { VendorFunnelModal } from "./VendorFunnelModal";

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
}

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorSelect: (vendor: Vendor) => void;
  service: {
    title: string;
    co_pay_price?: string;
    max_vendor_split_percentage?: number;
  };
}

export const VendorSelectionModal = ({ 
  isOpen, 
  onClose, 
  onVendorSelect, 
  service 
}: VendorSelectionModalProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const [funnelVendor, setFunnelVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();
  const { location } = useLocation();

  useEffect(() => {
    if (isOpen) {
      console.log('VendorSelectionModal: Modal opened, loading vendors...');
      setVendors([]); // Reset vendors to ensure clean state
      setFilteredVendors([]);
      loadVendors();
    } else {
      console.log('VendorSelectionModal: Modal closed, resetting state...');
      setSearchQuery("");
      setSelectedVendor(null);
      setShowConfirmation(false);
      setShowFunnelModal(false);
      setFunnelVendor(null);
    }
  }, [isOpen]);

  useEffect(() => {
    filterVendors();
  }, [searchQuery, vendors]);

  const loadVendors = async () => {
    console.log('VendorSelectionModal: Starting to load vendors...');
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, description, logo_url, location, rating, review_count, is_verified, co_marketing_agents, campaigns_funded, service_states, vendor_type')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }) // Higher sort_order = higher priority
        .order('rating', { ascending: false })
        .limit(20); // Limit initial results for faster loading

      console.log('VendorSelectionModal: Supabase response:', { data, error, dataLength: data?.length });

      if (error) {
        console.error('VendorSelectionModal: Supabase error details:', error);
        throw error;
      }
      setVendors(data || []);
      console.log('VendorSelectionModal: Vendors set successfully, count:', (data || []).length);
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

  const filterVendors = () => {
    let filtered = vendors;
    console.log('VendorSelectionModal: Filtering vendors...', { 
      totalVendors: vendors.length, 
      searchQuery, 
      userLocation: location?.state 
    });

    // Filter by location if available - but don't filter out ALL vendors
    if (location?.state) {
      const locationFiltered = filtered.filter(vendor => 
        vendor.service_states?.includes(location.state) ||
        vendor.location?.toLowerCase().includes(location.state.toLowerCase())
      );
      // Only apply location filter if we still have vendors, otherwise show all
      if (locationFiltered.length > 0) {
        filtered = locationFiltered;
      } else {
        console.log('VendorSelectionModal: No vendors found for location, showing all vendors');
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.service_states?.some(state => 
          state.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    console.log('VendorSelectionModal: Filtering complete', { 
      filteredCount: filtered.length,
      originalCount: vendors.length 
    });
    setFilteredVendors(filtered);
  };

  const handleVendorSelect = async (vendor: Vendor) => {
    try {
      setIsLoading(true);
      
      // Get current user
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
      
      // Create co-pay request in database
      const { data: coPayRequest, error } = await supabase
        .from('co_pay_requests')
        .insert({
          agent_id: user.id,
          vendor_id: vendor.id,
          service_id: null, // Set to null since we don't have a specific service ID
          requested_split_percentage: service.max_vendor_split_percentage || 50,
          status: 'pending',
          agent_notes: `Co-pay request for "${service.title}" service`
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating co-pay request:', error);
        toast({
          title: "Error",
          description: "Failed to create co-pay request. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Co-pay request created:', coPayRequest);
      
      // Add to cart context with the request data
      const cartItem = {
        id: coPayRequest.id,
        type: 'co-pay-request',
        vendor: vendor,
        service: service,
        status: 'pending-approval',
        requestedSplit: service.max_vendor_split_percentage || 50,
        createdAt: new Date().toISOString()
      };

      // Dispatch custom event to add to cart
      const addToCartEvent = new CustomEvent('addCoPayToCart', { 
        detail: cartItem 
      });
      window.dispatchEvent(addToCartEvent);

      setSelectedVendor(vendor);
      setShowConfirmation(true);
      onVendorSelect(vendor);
    } catch (error) {
      console.error('Error in vendor selection:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLearnMore = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering vendor selection
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
    // Keep modal open for another selection
  };

  const handleFinish = () => {
    setShowConfirmation(false);
    setSelectedVendor(null);
    onClose();
    // Open cart to show pending vendor approval items
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
              Choose a vendor to help with "{service.title}" - they'll cover {service.max_vendor_split_percentage}% of the cost
            </p>
            {location?.state && (
              <p className="text-xs text-muted-foreground">
                Showing vendors available in {location.state}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="shrink-0 mr-8 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Your Vendors
          </Button>
        </DialogHeader>
        
        {showConfirmation ? (
          <div className="text-center py-12">
            <img src={confirmationImage} alt="Success" className="w-24 h-24 mx-auto mb-4" />
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
              <Button onClick={handleFinish}>
                Finish
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
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

          {/* Vendor Grid */}
          <div className="max-h-[60vh] overflow-y-auto">
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
                  {searchQuery ? "No vendors found matching your search." : "No vendors available."}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVendors.map((vendor) => {
                  const isCircleHomeLoan = vendor.name.toLowerCase().includes('circle home loan');
                  return (
                    <Card 
                      key={vendor.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow border ${
                        isCircleHomeLoan 
                          ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-200/50 ring-2 ring-blue-200' 
                          : ''
                      }`}
                      onClick={() => handleVendorSelect(vendor)}
                    >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Logo */}
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

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm truncate">{vendor.name}</h3>
                            {vendor.is_verified && (
                              <Badge variant="outline" className="text-xs ml-2">
                                ✓ Verified
                              </Badge>
                            )}
                          </div>

                          {vendor.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{vendor.location}</span>
                            </div>
                          )}

                          {vendor.rating > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{vendor.rating}</span>
                              <span className="text-xs text-muted-foreground">({vendor.review_count})</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <span>Budget: {mockBudgetRange(vendor)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span>{vendor.co_marketing_agents} agents • {vendor.campaigns_funded} campaigns</span>
                            </div>
                          </div>

                           {vendor.description && (
                             <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                               {vendor.description}
                             </p>
                           )}

                           <div className="flex gap-2 mt-3">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={(e) => handleLearnMore(vendor, e)}
                               className="flex-1 text-xs h-7"
                             >
                               Learn More
                             </Button>
                             <Button
                               size="sm"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleVendorSelect(vendor);
                               }}
                               className="flex-1 text-xs h-7"
                             >
                               Select Partner
                             </Button>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                  );
                })}
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
          // Don't close the parent modal automatically
        }}
        vendor={funnelVendor}
        onRequestCoMarketing={handleCoMarketingRequest}
      />
    )}
    </>
  );
};