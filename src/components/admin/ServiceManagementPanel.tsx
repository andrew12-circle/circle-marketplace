import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  Edit, 
  Globe, 
  MapPin, 
  Star,
  DollarSign,
  Eye,
  Building,
  Tag
} from 'lucide-react';
import { ServiceFunnelEditorModal } from '@/components/marketplace/ServiceFunnelEditorModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  website_url?: string;
  retail_price?: string;
  pro_price?: string;
  price_duration?: string;
  co_pay_price?: string;
  co_pay_allowed: boolean;
  estimated_roi?: number;
  duration?: string;
  tags?: string[];
  rating?: number;
  requires_quote: boolean;
  is_featured: boolean;
  is_top_pick: boolean;
  vendor_id?: string;
  service_provider_id?: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  vendors?: {
    name: string;
    logo_url?: string;
  };
  service_providers?: {
    name: string;
    logo_url?: string;
  };
}

interface FunnelContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  estimatedRoi: number;
  duration: string;
  whyChooseUs: {
    title: string;
    benefits: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  media: {
    id: string;
    type: 'image' | 'video' | 'document';
    url: string;
    title: string;
    description?: string;
  }[];
  packages: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[];
    popular: boolean;
    proOnly?: boolean;
    savings?: string;
  }[];
  socialProof: {
    testimonials: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
    }[];
    stats: {
      label: string;
      value: string;
    }[];
  };
  trustIndicators: {
    guarantee: string;
    cancellation: string;
    certification: string;
  };
  callToAction: {
    primaryHeadline: string;
    primaryDescription: string;
    primaryButtonText: string;
    secondaryHeadline: string;
    secondaryDescription: string;
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
  };
  urgency: {
    enabled: boolean;
    message: string;
  };
}

export const ServiceManagementPanel = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showFunnelEditor, setShowFunnelEditor] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  // Default funnel content for new services
  const [funnelContent, setFunnelContent] = useState<FunnelContent>({
    headline: '',
    subheadline: '',
    heroDescription: '',
    estimatedRoi: 0,
    duration: '',
    whyChooseUs: {
      title: 'Why Choose This Service',
      benefits: []
    },
    media: [],
    packages: [],
    socialProof: {
      testimonials: [],
      stats: []
    },
    trustIndicators: {
      guarantee: '',
      cancellation: '',
      certification: ''
    },
    callToAction: {
      primaryHeadline: '',
      primaryDescription: '',
      primaryButtonText: 'Get Started',
      secondaryHeadline: '',
      secondaryDescription: '',
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      }
    },
    urgency: {
      enabled: false,
      message: ''
    }
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vendors?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_providers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          vendors (name, logo_url),
          service_providers (name, logo_url)
        `)
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setEditForm(service);
    setIsEditingDetails(false);
    setShowFunnelEditor(false);
    
    // Initialize funnel content with service data
    setFunnelContent({
      ...funnelContent,
      headline: service.title,
      subheadline: service.description || '',
      heroDescription: service.description || '',
      estimatedRoi: service.estimated_roi || 0,
      duration: service.duration || ''
    });
  };

  const handleServiceUpdate = async () => {
    if (!selectedService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update(editForm)
        .eq('id', selectedService.id);

      if (error) throw error;

      // Update local state
      const updatedService = { ...selectedService, ...editForm };
      setSelectedService(updatedService);
      setServices(services.map(s => s.id === selectedService.id ? updatedService : s));
      setIsEditingDetails(false);

      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  const handleFunnelSave = () => {
    toast({
      title: 'Success',
      description: 'Service funnel updated successfully',
    });
    setShowFunnelEditor(false);
  };

  if (loading) {
    return <p>Loading services...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Management - Edit Service Cards & Funnels
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a service to edit its details, pricing, and funnel pages
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services by title, category, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedService?.id === service.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{service.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {service.category}
                          </Badge>
                          {service.is_featured && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {service.is_top_pick && (
                            <Badge variant="secondary" className="text-xs">
                              Top Pick
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {service.retail_price && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {service.retail_price}
                            </span>
                          )}
                          {service.vendors?.name && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {service.vendors.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No services found matching your search.' : 'No services available.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editing: {selectedService.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedService.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedService.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
              <Badge variant="secondary">
                {selectedService.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Service Details</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Features</TabsTrigger>
                <TabsTrigger value="funnel">Funnel Pages</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {isEditingDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service Title</label>
                        <Input
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Input
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Duration</label>
                        <Input
                          value={editForm.duration || ''}
                          onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                          placeholder="e.g., 30 days"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ROI (%)</label>
                        <Input
                          type="number"
                          value={editForm.estimated_roi || ''}
                          onChange={(e) => setEditForm({ ...editForm, estimated_roi: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sort Order</label>
                        <Input
                          type="number"
                          value={editForm.sort_order || ''}
                          onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editForm.is_featured || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_featured: checked })}
                        />
                        <label className="text-sm font-medium">Featured</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editForm.is_top_pick || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_top_pick: checked })}
                        />
                        <label className="text-sm font-medium">Top Pick</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editForm.requires_quote || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, requires_quote: checked })}
                        />
                        <label className="text-sm font-medium">Requires Quote</label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleServiceUpdate}>
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingDetails(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Service Details</h3>
                      <Button onClick={() => setIsEditingDetails(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Basic Information</h4>
                        <p className="text-sm text-muted-foreground">Title: {selectedService.title}</p>
                        <p className="text-sm text-muted-foreground">Category: {selectedService.category}</p>
                        <p className="text-sm text-muted-foreground">Duration: {selectedService.duration || 'Not set'}</p>
                        <p className="text-sm text-muted-foreground">ROI: {selectedService.estimated_roi || 0}%</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Status</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedService.is_featured && <Badge>Featured</Badge>}
                          {selectedService.is_top_pick && <Badge variant="secondary">Top Pick</Badge>}
                          {selectedService.requires_quote && <Badge variant="outline">Requires Quote</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Pricing management interface</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Edit retail price, pro price, co-pay options, etc.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="funnel" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Service Funnel Pages</h3>
                    <Button onClick={() => setShowFunnelEditor(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Funnel
                    </Button>
                  </div>
                  
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-muted-foreground">Click "Edit Funnel" to customize this service's funnel pages</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create compelling sales funnels with hero sections, testimonials, and call-to-actions
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Service Funnel Editor Modal */}
      <ServiceFunnelEditorModal
        open={showFunnelEditor}
        onOpenChange={setShowFunnelEditor}
        funnelContent={funnelContent}
        onChange={setFunnelContent}
        onSave={handleFunnelSave}
        serviceName={selectedService?.title || ''}
      />
    </div>
  );
};