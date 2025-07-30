import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VendorPricingModal } from '@/components/marketplace/VendorPricingModal';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Settings, 
  Bell, 
  Users, 
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  Plus,
  Package,
  Eye,
  BarChart3,
  ShoppingCart,
  FileText,
  Image,
  Palette,
  Layout,
  Monitor,
  Smartphone
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  pricing_model: string;
  is_featured: boolean;
  image_url?: string;
  funnel_content?: {
    headline: string;
    subheadline: string;
    features: string[];
    testimonials: Array<{ name: string; text: string; role: string }>;
    call_to_action: string;
  };
  created_at: string;
  views: number;
  conversions: number;
}

interface VendorStats {
  total_services: number;
  total_views: number;
  total_bookings: number;
  conversion_rate: number;
  monthly_revenue: number;
}

export const VendorDashboard = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<VendorStats>({
    total_services: 0,
    total_views: 0,
    total_bookings: 0,
    conversion_rate: 0,
    monthly_revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showServiceBuilder, setShowServiceBuilder] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [currentStep, setCurrentStep] = useState<'basic' | 'funnel' | 'preview'>('basic');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [vendorPlan, setVendorPlan] = useState<string | null>(null);
  const { toast } = useToast();

  // Service Builder Form State
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    pricing_model: 'one_time',
    is_featured: false,
    image_url: '',
    funnel_content: {
      headline: '',
      subheadline: '',
      features: [''],
      testimonials: [{ name: '', text: '', role: '' }],
      call_to_action: 'Book a Demo'
    }
  });

  useEffect(() => {
    loadDashboardData();
    // Check if vendor needs to select a pricing plan
    checkVendorPlan();
  }, []);

  const checkVendorPlan = async () => {
    // In a real app, you'd check if the vendor has selected a plan
    // For now, we'll show the pricing modal if no plan is stored
    const savedPlan = localStorage.getItem('vendorPlan');
    if (!savedPlan) {
      setShowPricingModal(true);
    } else {
      setVendorPlan(savedPlan);
    }
  };

  const handlePlanSelected = (plan: string) => {
    setVendorPlan(plan);
    localStorage.setItem('vendorPlan', plan);
    toast({
      title: "Welcome to your new plan!",
      description: `You can now create unlimited services with your ${plan} plan.`,
    });
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls - replace with actual Supabase calls
      const mockServices: Service[] = [
        {
          id: '1',
          title: 'CRM Marketing Automation',
          description: 'Complete CRM solution with automated email campaigns, lead scoring, and real estate specific workflows.',
          category: 'crm_software',
          price: '$299/month',
          pricing_model: 'subscription',
          is_featured: true,
          image_url: '/api/placeholder/400/300',
          views: 1250,
          conversions: 45,
          created_at: '2024-01-15T00:00:00Z',
          funnel_content: {
            headline: 'Close More Deals with Smart CRM Automation',
            subheadline: 'Automate your lead nurturing and never miss a follow-up again',
            features: [
              'Automated email sequences for different lead types',
              'Smart lead scoring and prioritization',
              'Real estate transaction pipeline management',
              'Integration with MLS and showing platforms'
            ],
            testimonials: [
              {
                name: 'Sarah Johnson',
                text: 'Increased my conversions by 40% in the first month!',
                role: 'Top Producer, Keller Williams'
              }
            ],
            call_to_action: 'Start Free Trial'
          }
        },
        {
          id: '2',
          title: 'Premium Yard Signs',
          description: 'High-quality, weather-resistant yard signs with custom branding and fast turnaround.',
          category: 'signs_materials',
          price: '$45 each',
          pricing_model: 'one_time',
          is_featured: false,
          views: 890,
          conversions: 67,
          created_at: '2024-01-10T00:00:00Z',
          funnel_content: {
            headline: 'Professional Yard Signs That Get Noticed',
            subheadline: 'Make every listing stand out with premium quality signs',
            features: [
              '4mm corrugated plastic - weatherproof',
              'Full-color, double-sided printing',
              'Custom branding with your photo and contact info',
              '24-48 hour production time'
            ],
            testimonials: [
              {
                name: 'Mike Rodriguez',
                text: 'These signs look amazing and really help my listings pop!',
                role: 'Real Estate Agent'
              }
            ],
            call_to_action: 'Order Now'
          }
        }
      ];

      setServices(mockServices);
      setStats({
        total_services: mockServices.length,
        total_views: mockServices.reduce((sum, s) => sum + s.views, 0),
        total_bookings: mockServices.reduce((sum, s) => sum + s.conversions, 0),
        conversion_rate: 4.2,
        monthly_revenue: 15847
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      title: '',
      description: '',
      category: '',
      price: '',
      pricing_model: 'one_time',
      is_featured: false,
      image_url: '',
      funnel_content: {
        headline: '',
        subheadline: '',
        features: [''],
        testimonials: [{ name: '', text: '', role: '' }],
        call_to_action: 'Book a Demo'
      }
    });
    setCurrentStep('basic');
    setEditingService(null);
  };

  const openServiceBuilder = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        title: service.title,
        description: service.description,
        category: service.category,
        price: service.price,
        pricing_model: service.pricing_model,
        is_featured: service.is_featured,
        image_url: service.image_url || '',
        funnel_content: service.funnel_content || {
          headline: '',
          subheadline: '',
          features: [''],
          testimonials: [{ name: '', text: '', role: '' }],
          call_to_action: 'Book a Demo'
        }
      });
    } else {
      resetServiceForm();
    }
    setShowServiceBuilder(true);
  };

  const closeServiceBuilder = () => {
    setShowServiceBuilder(false);
    resetServiceForm();
  };

  const addFeature = () => {
    setServiceForm(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        features: [...prev.funnel_content.features, '']
      }
    }));
  };

  const removeFeature = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        features: prev.funnel_content.features.filter((_, i) => i !== index)
      }
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setServiceForm(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        features: prev.funnel_content.features.map((f, i) => i === index ? value : f)
      }
    }));
  };

  const addTestimonial = () => {
    setServiceForm(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        testimonials: [...prev.funnel_content.testimonials, { name: '', text: '', role: '' }]
      }
    }));
  };

  const removeTestimonial = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        testimonials: prev.funnel_content.testimonials.filter((_, i) => i !== index)
      }
    }));
  };

  const updateTestimonial = (index: number, field: string, value: string) => {
    setServiceForm(prev => ({
      ...prev,
      funnel_content: {
        ...prev.funnel_content,
        testimonials: prev.funnel_content.testimonials.map((t, i) => 
          i === index ? { ...t, [field]: value } : t
        )
      }
    }));
  };

  const saveService = () => {
    // Here you would save to Supabase
    const newService: Service = {
      id: editingService?.id || Date.now().toString(),
      ...serviceForm,
      views: editingService?.views || 0,
      conversions: editingService?.conversions || 0,
      created_at: editingService?.created_at || new Date().toISOString()
    };

    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? newService : s));
      toast({ title: "Success", description: "Service updated successfully!" });
    } else {
      setServices(prev => [...prev, newService]);
      toast({ title: "Success", description: "Service created successfully!" });
    }

    closeServiceBuilder();
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    toast({ title: "Success", description: "Service deleted successfully!" });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading vendor dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/10">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Vendor Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Manage your services, track performance, and grow your business
            </p>
          </div>
          <Button 
            onClick={() => openServiceBuilder()}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Service
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Services</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.total_services}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Active listings</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800 dark:text-green-200">{stats.total_views.toLocaleString()}</div>
              <p className="text-xs text-green-600 dark:text-green-400">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">{stats.total_bookings}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Total conversions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">{stats.conversion_rate}%</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Average rate</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">${stats.monthly_revenue.toLocaleString()}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>My Services</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="relative">
                    {service.image_url && (
                      <div className="h-48 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-t-lg flex items-center justify-center">
                        <Image className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    {service.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold line-clamp-2">{service.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{service.category.replace('_', ' ')}</Badge>
                      <span className="text-lg font-bold text-primary">{service.price}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{service.views}</div>
                        <div className="text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{service.conversions}</div>
                        <div className="text-muted-foreground">Conversions</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openServiceBuilder(service)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteService(service.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Recent Bookings</CardTitle>
                <p className="text-muted-foreground">Manage your customer appointments and demos</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                  <p>When customers book demos or consultations, they'll appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                        <div>
                          <div className="font-medium">{service.title}</div>
                          <div className="text-sm text-muted-foreground">{service.views} views</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">{service.conversions} conversions</div>
                          <div className="text-sm text-muted-foreground">
                            {((service.conversions / service.views) * 100).toFixed(1)}% rate
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Analytics charts coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <p className="text-muted-foreground">Manage your vendor profile and preferences</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications for new bookings</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-respond to Inquiries</Label>
                    <p className="text-sm text-muted-foreground">Send automatic responses to new leads</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Calendar Integration</h3>
                  <div className="space-y-2">
                    <Label htmlFor="calendar-link">Booking Calendar Link</Label>
                    <Input
                      id="calendar-link"
                      placeholder="https://calendly.com/your-link"
                      defaultValue="https://calendly.com/your-marketing-tools"
                    />
                    <p className="text-sm text-muted-foreground">
                      Customers will use this link to book demos and consultations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Builder Dialog */}
        <Dialog open={showServiceBuilder} onOpenChange={setShowServiceBuilder}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Step Navigation */}
              <div className="flex items-center space-x-4 border-b pb-4">
                <Button
                  variant={currentStep === 'basic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentStep('basic')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Basic Info
                </Button>
                <Button
                  variant={currentStep === 'funnel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentStep('funnel')}
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Funnel Page
                </Button>
                <Button
                  variant={currentStep === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentStep('preview')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>

              {/* Basic Info Step */}
              {currentStep === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="service-title">Service Title *</Label>
                      <Input
                        id="service-title"
                        value={serviceForm.title}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., CRM Marketing Automation"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service-category">Category *</Label>
                      <Select 
                        value={serviceForm.category} 
                        onValueChange={(value) => setServiceForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketing_tools">Marketing Tools & Platforms</SelectItem>
                          <SelectItem value="signs_materials">Signs & Marketing Materials</SelectItem>
                          <SelectItem value="crm_software">CRM & Contact Management</SelectItem>
                          <SelectItem value="lead_generation">Lead Generation Services</SelectItem>
                          <SelectItem value="website_design">Website Design & Development</SelectItem>
                          <SelectItem value="social_media">Social Media Management</SelectItem>
                          <SelectItem value="photography">Photography & Virtual Tours</SelectItem>
                          <SelectItem value="staging_services">Home Staging Services</SelectItem>
                          <SelectItem value="printing_services">Printing & Design Services</SelectItem>
                          <SelectItem value="coaching_training">Coaching & Training</SelectItem>
                          <SelectItem value="transaction_management">Transaction Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service-price">Price *</Label>
                      <Input
                        id="service-price"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g., $299/month or $45 each"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricing-model">Pricing Model *</Label>
                      <Select 
                        value={serviceForm.pricing_model} 
                        onValueChange={(value) => setServiceForm(prev => ({ ...prev, pricing_model: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One-time Payment</SelectItem>
                          <SelectItem value="subscription">Monthly Subscription</SelectItem>
                          <SelectItem value="per_transaction">Per Transaction</SelectItem>
                          <SelectItem value="custom">Custom Quote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-description">Service Description *</Label>
                    <Textarea
                      id="service-description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your service, what it does, and how it helps real estate professionals..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-image">Featured Image URL</Label>
                    <Input
                      id="service-image"
                      value={serviceForm.image_url}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/your-service-image.jpg"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={serviceForm.is_featured}
                      onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label>Mark as Featured Service</Label>
                  </div>
                </div>
              )}

              {/* Funnel Page Step */}
              {currentStep === 'funnel' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="funnel-headline">Main Headline *</Label>
                      <Input
                        id="funnel-headline"
                        value={serviceForm.funnel_content.headline}
                        onChange={(e) => setServiceForm(prev => ({
                          ...prev,
                          funnel_content: { ...prev.funnel_content, headline: e.target.value }
                        }))}
                        placeholder="e.g., Close More Deals with Smart CRM Automation"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="call-to-action">Call to Action Button</Label>
                      <Input
                        id="call-to-action"
                        value={serviceForm.funnel_content.call_to_action}
                        onChange={(e) => setServiceForm(prev => ({
                          ...prev,
                          funnel_content: { ...prev.funnel_content, call_to_action: e.target.value }
                        }))}
                        placeholder="e.g., Start Free Trial, Book a Demo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funnel-subheadline">Subheadline</Label>
                    <Input
                      id="funnel-subheadline"
                      value={serviceForm.funnel_content.subheadline}
                      onChange={(e) => setServiceForm(prev => ({
                        ...prev,
                        funnel_content: { ...prev.funnel_content, subheadline: e.target.value }
                      }))}
                      placeholder="e.g., Automate your lead nurturing and never miss a follow-up again"
                    />
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Key Features</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>
                    {serviceForm.funnel_content.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Describe a key feature or benefit"
                          className="flex-1"
                        />
                        {serviceForm.funnel_content.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Testimonials */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Customer Testimonials</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTestimonial}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Testimonial
                      </Button>
                    </div>
                    {serviceForm.funnel_content.testimonials.map((testimonial, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Testimonial {index + 1}</h4>
                            {serviceForm.funnel_content.testimonials.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTestimonial(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              value={testimonial.name}
                              onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                              placeholder="Customer name"
                            />
                            <Input
                              value={testimonial.role}
                              onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                              placeholder="Customer role/title"
                            />
                          </div>
                          <Textarea
                            value={testimonial.text}
                            onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                            placeholder="What did they say about your service?"
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Step */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-secondary/20">
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                      {/* Hero Section */}
                      <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-primary">
                          {serviceForm.funnel_content.headline || 'Your Amazing Headline'}
                        </h1>
                        <p className="text-xl text-muted-foreground">
                          {serviceForm.funnel_content.subheadline || 'Your compelling subheadline goes here'}
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                          <Badge variant="outline">{serviceForm.category.replace('_', ' ')}</Badge>
                          <span className="text-2xl font-bold text-primary">{serviceForm.price || '$299'}</span>
                        </div>
                      </div>

                      {/* Features Section */}
                      {serviceForm.funnel_content.features.filter(f => f.trim()).length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold">Key Features</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                            {serviceForm.funnel_content.features.filter(f => f.trim()).map((feature, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Testimonials */}
                      {serviceForm.funnel_content.testimonials.filter(t => t.text.trim()).length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold">What Our Customers Say</h2>
                          <div className="space-y-4">
                            {serviceForm.funnel_content.testimonials.filter(t => t.text.trim()).map((testimonial, index) => (
                              <Card key={index} className="p-4 text-left">
                                <p className="italic mb-2">"{testimonial.text}"</p>
                                <div className="flex items-center space-x-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">{testimonial.name || 'Customer'}</span>
                                  {testimonial.role && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground text-sm">{testimonial.role}</span>
                                    </>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CTA Section */}
                      <div className="space-y-4 pt-6 border-t">
                        <h2 className="text-2xl font-semibold">Ready to Get Started?</h2>
                        <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-white">
                          {serviceForm.funnel_content.call_to_action || 'Book a Demo'}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          {serviceForm.description || 'Your service description will appear here'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Preview */}
                  <div className="bg-secondary/20 p-4 rounded-lg">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <Monitor className="w-5 h-5" />
                      <span className="text-sm font-medium">Desktop Preview Above</span>
                      <Smartphone className="w-5 h-5" />
                      <span className="text-sm text-muted-foreground">Mobile-optimized automatically</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button variant="outline" onClick={closeServiceBuilder}>
                  Cancel
                </Button>
                <div className="flex space-x-2">
                  {currentStep !== 'basic' && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(currentStep === 'preview' ? 'funnel' : 'basic')}
                    >
                      Previous
                    </Button>
                  )}
                  {currentStep !== 'preview' && (
                    <Button 
                      onClick={() => setCurrentStep(currentStep === 'basic' ? 'funnel' : 'preview')}
                    >
                      Next
                    </Button>
                  )}
                  {currentStep === 'preview' && (
                    <Button onClick={saveService} className="bg-gradient-to-r from-primary to-accent text-white">
                      <Save className="w-4 h-4 mr-2" />
                      {editingService ? 'Update Service' : 'Create Service'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pricing Selection Modal */}
        <VendorPricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onPlanSelected={handlePlanSelected}
        />
      </div>
    </div>
  );
};