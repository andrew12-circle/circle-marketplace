import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Search, 
  Edit, 
  Globe, 
  MapPin, 
  Star,
  Users,
  DollarSign,
  Shield,
  ShieldCheck,
  Trophy,
  Crown
} from 'lucide-react';
import { StreamlinedVendorEditor } from './StreamlinedVendorEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  contact_email?: string;
  phone?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_premium_provider?: boolean;
  service_radius_miles?: number;
  service_states?: string[];
  license_states?: string[];
  mls_areas?: string[];
  service_zip_codes?: string[];
  vendor_type?: string;
  individual_name?: string;
  individual_title?: string;
  individual_email?: string;
  individual_phone?: string;
  individual_license_number?: string;
  nmls_id?: string;
  campaigns_funded: number;
  co_marketing_agents: number;
  created_at: string;
  updated_at: string;
}

export const VendorManagementPanel = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [vendors, searchTerm]);

  const fetchVendors = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vendors';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditingProfile(false);
    setIsEditingFunnel(false);
  };

  const handleProfileSave = async (updatedData: any) => {
    if (!selectedVendor) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .update(updatedData)
        .eq('id', selectedVendor.id);

      if (error) throw error;

      // Update local state
      const updatedVendor = { ...selectedVendor, ...updatedData };
      setSelectedVendor(updatedVendor);
      setVendors(vendors.map(v => v.id === selectedVendor.id ? updatedVendor : v));
      setIsEditingProfile(false);

      toast({
        title: 'Success',
        description: 'Vendor profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vendor profile',
        variant: 'destructive',
      });
    }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
  };

  const handleFunnelSave = async (funnelData: any) => {
    // Implementation for funnel save
    toast({
      title: 'Success',
      description: 'Vendor funnel updated successfully',
    });
    setIsEditingFunnel(false);
  };

  const handleFunnelCancel = () => {
    setIsEditingFunnel(false);
  };

  const handleVerificationToggle = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_verified: !currentStatus })
        .eq('id', vendorId);

      if (error) throw error;

      // Update local state
      setVendors(vendors.map(v => 
        v.id === vendorId ? { ...v, is_verified: !currentStatus } : v
      ));
      
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor({ ...selectedVendor, is_verified: !currentStatus });
      }

      toast({
        title: 'Success',
        description: `Vendor ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    }
  };

  const handlePremiumProviderToggle = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_premium_provider: !currentStatus })
        .eq('id', vendorId);

      if (error) throw error;

      // Update local state
      setVendors(vendors.map(v => 
        v.id === vendorId ? { ...v, is_premium_provider: !currentStatus } : v
      ));
      
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor({ ...selectedVendor, is_premium_provider: !currentStatus });
      }

      toast({
        title: 'Success',
        description: `Vendor ${!currentStatus ? 'marked as premium provider' : 'removed from premium providers'} successfully`,
      });
    } catch (error) {
      console.error('Error updating premium provider status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update premium provider status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <p>Loading vendors...</p>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Vendors</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => { setError(null); fetchVendors(); }} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Vendor Management - Edit Vendor Pages
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a vendor to edit their profile, services, and funnel pages on their behalf
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, location, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredVendors.map((vendor) => (
                <Card 
                  key={vendor.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedVendor?.id === vendor.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleVendorSelect(vendor)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {vendor.logo_url ? (
                        <img
                          src={vendor.logo_url}
                          alt={vendor.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                           <h3 className="font-semibold truncate">{vendor.name}</h3>
                           <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1">
                               {vendor.is_verified ? (
                                 <ShieldCheck className="h-3 w-3 text-green-600" />
                               ) : (
                                 <Shield className="h-3 w-3 text-muted-foreground" />
                               )}
                                <Switch
                                  checked={vendor.is_verified}
                                  onCheckedChange={() => handleVerificationToggle(vendor.id, vendor.is_verified)}
                                  className="scale-75"
                                />
                             </div>
                           </div>
                         </div>
                          <div className="flex items-center gap-1 mt-1">
                            {vendor.is_verified && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {vendor.is_premium_provider && (
                              <Badge variant="default" className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
                                <Trophy className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                            {vendor.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {vendor.location}
                              </p>
                            )}
                          </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {vendor.co_marketing_agents}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {vendor.campaigns_funded}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVendors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No vendors found matching your search.' : 'No vendors available.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedVendor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editing: {selectedVendor.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedVendor.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedVendor.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
              <Badge variant="secondary">
                {selectedVendor.vendor_type || 'company'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isEditingProfile ? (
              <StreamlinedVendorEditor
                vendorData={selectedVendor}
                onSave={handleProfileSave}
                onCancel={handleProfileCancel}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Vendor Profile</h3>
                  <Button onClick={() => setIsEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      {selectedVendor.is_verified ? (
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <h4 className="font-medium">Verification Status</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedVendor.is_verified ? 'This vendor is verified' : 'This vendor is not verified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={selectedVendor.is_verified ? "default" : "secondary"}
                        className={selectedVendor.is_verified ? "bg-green-100 text-green-800" : ""}
                      >
                        {selectedVendor.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Switch
                        checked={selectedVendor.is_verified}
                        onCheckedChange={() => handleVerificationToggle(selectedVendor.id, selectedVendor.is_verified)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50/50">
                    <div className="flex items-center gap-3">
                      {selectedVendor.is_premium_provider ? (
                        <Trophy className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Crown className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <h4 className="font-medium">Premium Provider Status</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedVendor.is_premium_provider ? 'This vendor is marked as a premium provider' : 'This vendor is not a premium provider'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={selectedVendor.is_premium_provider ? "default" : "secondary"}
                        className={selectedVendor.is_premium_provider ? "bg-amber-100 text-amber-800" : ""}
                      >
                        {selectedVendor.is_premium_provider ? 'Premium Provider' : 'Standard Provider'}
                      </Badge>
                      <Switch
                        checked={selectedVendor.is_premium_provider || false}
                        onCheckedChange={() => handlePremiumProviderToggle(selectedVendor.id, selectedVendor.is_premium_provider || false)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Company Information</h4>
                      <p className="text-sm text-muted-foreground">Name: {selectedVendor.name}</p>
                      <p className="text-sm text-muted-foreground">Location: {selectedVendor.location || 'Not set'}</p>
                      <p className="text-sm text-muted-foreground">Type: {selectedVendor.vendor_type || 'company'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Contact Information</h4>
                      <p className="text-sm text-muted-foreground">Email: {selectedVendor.contact_email || 'Not set'}</p>
                      <p className="text-sm text-muted-foreground">Phone: {selectedVendor.phone || 'Not set'}</p>
                      <p className="text-sm text-muted-foreground">Website: {selectedVendor.website_url || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};