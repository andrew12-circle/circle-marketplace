import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Star, Users, TrendingUp, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadVendors();
    }
  }, [isOpen]);

  useEffect(() => {
    filterVendors();
  }, [searchQuery, vendors]);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterVendors = () => {
    if (!searchQuery.trim()) {
      setFilteredVendors(vendors);
      return;
    }

    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.service_states?.some(state => 
        state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredVendors(filtered);
  };

  const handleVendorSelect = (vendor: Vendor) => {
    onVendorSelect(vendor);
    onClose();
  };

  const mockBudgetRange = (vendor: Vendor) => {
    const rating = vendor.rating || 3;
    if (rating >= 4.5) return "$1,000-3,000/mo";
    if (rating >= 4) return "$500-1,500/mo";
    return "$1,000-2,500/mo";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden z-[100]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Select Co-Pay Partner</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a vendor to help with "{service.title}" - they'll cover {service.max_vendor_split_percentage}% of the cost
          </p>
        </DialogHeader>
        
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
              <div className="flex justify-center items-center h-32">
                <div className="text-sm text-muted-foreground">Loading vendors...</div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? "No vendors found matching your search." : "No vendors available."}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVendors.map((vendor) => (
                  <Card 
                    key={vendor.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border"
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};