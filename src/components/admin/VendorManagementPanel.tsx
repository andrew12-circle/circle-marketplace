import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Search, 
  Edit, 
  Globe, 
  MapPin, 
  Star,
  Users,
  DollarSign
} from 'lucide-react';
import { VendorProfileEditor } from '@/components/marketplace/VendorProfileEditor';
import { VendorFunnelEditor } from '@/components/marketplace/VendorFunnelEditor';
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
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors',
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

  if (loading) {
    return <p>Loading vendors...</p>;
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
                        <h3 className="font-semibold truncate">{vendor.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          {vendor.is_verified && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Verified
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
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="funnel">Funnel Pages</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                {isEditingProfile ? (
                  <VendorProfileEditor
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
                )}
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Service management will be implemented here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will allow editing services associated with this vendor
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="funnel" className="space-y-4">
                {isEditingFunnel ? (
                  <VendorFunnelEditor
                    vendorId={selectedVendor.id}
                    onSave={handleFunnelSave}
                    onCancel={handleFunnelCancel}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Funnel Pages</h3>
                      <Button onClick={() => setIsEditingFunnel(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Funnel
                      </Button>
                    </div>
                    
                    <div className="text-center py-8 border rounded-lg">
                      <p className="text-muted-foreground">Click "Edit Funnel" to customize this vendor's funnel pages</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};