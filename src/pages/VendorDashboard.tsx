import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { VendorPricingModal } from '@/components/marketplace/VendorPricingModal';
import { ServiceImageUpload } from '@/components/marketplace/ServiceImageUpload';
import { ServiceFunnelEditor } from '@/components/marketplace/ServiceFunnelEditor';
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
  image_url?: string;
  is_featured: boolean;
  vendor_id: string;
  base_pricing_tiers?: Array<{
    tier_name: string;
    price: number;
    description?: string;
    features?: string[];
  }>;
  pro_pricing_tiers?: Array<{
    tier_name: string;
    price: number;
    description?: string;
    features?: string[];
  }>;
  copay_pricing_tiers?: Array<{
    tier_name: string;
    price: number;
    description?: string;
    features?: string[];
  }>;
  supports_copay?: boolean;
  funnel_content?: {
    headline: string;
    subheadline: string;
    heroDescription: string;
    estimatedRoi: number;
    duration: string;
    whyChooseUs: {
      title: string;
      benefits: Array<{
        icon: string;
        title: string;
        description: string;
      }>;
    };
    media: Array<{
      id: string;
      type: 'image' | 'video' | 'document';
      url: string;
      title: string;
      description?: string;
    }>;
    packages: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      originalPrice?: number;
      features: string[];
      popular: boolean;
      proOnly?: boolean;
      savings?: string;
    }>;
    socialProof: {
      testimonials: Array<{
        id: string;
        name: string;
        role: string;
        content: string;
        rating: number;
      }>;
      stats: Array<{
        label: string;
        value: string;
      }>;
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
    is_featured: false,
    image_url: '',
    vendor_id: '',
    base_pricing_tiers: [] as Array<{
      tier_name: string;
      price: number;
      description?: string;
      features?: string[];
    }>,
    pro_pricing_tiers: [] as Array<{
      tier_name: string;
      price: number;
      description?: string;
      features?: string[];
    }>,
    copay_pricing_tiers: [] as Array<{
      tier_name: string;
      price: number;
      description?: string;
      features?: string[];
    }>,
    supports_copay: false,
    funnel_content: {
      headline: '',
      subheadline: '',
      heroDescription: '',
      estimatedRoi: 3,
      duration: '30 days',
      whyChooseUs: {
        title: 'Why Choose Our Service?',
        benefits: [
          { icon: 'check', title: 'Proven Results', description: 'Get measurable results fast' },
          { icon: 'check', title: 'Expert Support', description: '24/7 professional assistance' },
          { icon: 'check', title: 'Fast Implementation', description: 'Up and running in minutes' }
        ]
      },
      media: [],
      packages: [
        {
          id: 'standard',
          name: 'Standard Package',
          description: 'Perfect for most businesses',
          price: 299,
          features: ['Core features', 'Email support', 'Monthly updates'],
          popular: true
        }
      ],
      socialProof: {
        testimonials: [
          {
            id: '1',
            name: 'John Smith',
            role: 'Real Estate Agent',
            content: 'This service transformed my business...',
            rating: 5
          }
        ],
        stats: [
          { label: 'Happy Customers', value: '1000+' },
          { label: 'Success Rate', value: '98%' }
        ]
      },
      trustIndicators: {
        guarantee: '30-day money back guarantee',
        cancellation: 'Cancel anytime',
        certification: 'Industry certified'
      },
      callToAction: {
        primaryHeadline: 'Need More Information?',
        primaryDescription: 'Visit our website for detailed documentation and resources.',
        primaryButtonText: 'Visit Official Website',
        secondaryHeadline: 'Questions? We\'re Here to Help!',
        secondaryDescription: 'Speak with our experts to find the perfect package for your business.',
        contactInfo: {
          phone: '',
          email: '',
          website: ''
        }
      },
      urgency: {
        enabled: false,
        message: 'Limited time offer!'
      }
    }
  });

  useEffect(() => {
    // Check authentication first
    if (!authLoading) {
      if (!user) {
        // Redirect to auth page if not authenticated
        navigate('/auth');
        return;
      }
      
      // User is authenticated, load dashboard data
      loadDashboardData();
      checkVendorPlan();
    }
  }, [user, authLoading, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);

      // Fetch vendor's services
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          price,
          image_url,
          is_featured,
          vendor_id,
          created_at
        `)
        .eq('vendor_id', user.id);

      if (error) {
        throw error;
      }

      // Transform services data
      const transformedServices: Service[] = (services || []).map(service => ({
        id: service.id,
        title: service.title,
        description: service.description || '',
        category: service.category,
        price: service.price,
        image_url: service.image_url,
        is_featured: service.is_featured,
        vendor_id: service.vendor_id,
        base_pricing_tiers: [],
        pro_pricing_tiers: [],
        copay_pricing_tiers: [],
        supports_copay: false,
        created_at: service.created_at,
        views: 0, // These would come from analytics tables
        conversions: 0,
        funnel_content: {
          headline: service.title,
          subheadline: 'Transform your real estate business',
          heroDescription: service.description || '',
          estimatedRoi: 3,
          duration: '30 days',
          whyChooseUs: {
            title: 'Why Choose Our Service?',
            benefits: [
              { icon: 'check', title: 'Proven Results', description: 'Get measurable results fast' },
              { icon: 'check', title: 'Expert Support', description: '24/7 professional assistance' },
              { icon: 'check', title: 'Fast Implementation', description: 'Up and running in minutes' }
            ]
          },
          media: [],
          packages: [
            {
              id: 'standard',
              name: 'Standard Package',
              description: 'Perfect for most businesses',
              price: 299,
              features: ['Core features', 'Email support', 'Monthly updates'],
              popular: true
            }
          ],
          socialProof: {
            testimonials: [
              {
                id: '1',
                name: 'John Smith',
                role: 'Real Estate Agent',
                content: 'This service transformed my business...',
                rating: 5
              }
            ],
            stats: [
              { label: 'Happy Customers', value: '1000+' },
              { label: 'Success Rate', value: '98%' }
            ]
          },
          trustIndicators: {
            guarantee: '30-day money back guarantee',
            cancellation: 'Cancel anytime',
            certification: 'Industry certified'
          },
          callToAction: {
            primaryHeadline: 'Need More Information?',
            primaryDescription: 'Visit our website for detailed documentation and resources.',
            primaryButtonText: 'Visit Official Website',
            secondaryHeadline: 'Questions? We\'re Here to Help!',
            secondaryDescription: 'Speak with our experts to find the perfect package for your business.',
            contactInfo: {
              phone: '',
              email: '',
              website: ''
            }
          },
          urgency: {
            enabled: false,
            message: 'Limited time offer!'
          }
        }
      }));

      setServices(transformedServices);
      setStats({
        total_services: transformedServices.length,
        total_views: transformedServices.reduce((sum, s) => sum + s.views, 0),
        total_bookings: transformedServices.reduce((sum, s) => sum + s.conversions, 0),
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
      is_featured: false,
      image_url: '',
      vendor_id: '',
      base_pricing_tiers: [],
      pro_pricing_tiers: [],
      copay_pricing_tiers: [],
      supports_copay: false,
      funnel_content: {
        headline: '',
        subheadline: '',
        heroDescription: '',
        estimatedRoi: 3,
        duration: '30 days',
        whyChooseUs: {
          title: 'Why Choose Our Service?',
          benefits: [
            { icon: 'check', title: 'Proven Results', description: 'Get measurable results fast' },
            { icon: 'check', title: 'Expert Support', description: '24/7 professional assistance' },
            { icon: 'check', title: 'Fast Implementation', description: 'Up and running in minutes' }
          ]
        },
        media: [],
        packages: [
          {
            id: 'standard',
            name: 'Standard Package',
            description: 'Perfect for most businesses',
            price: 299,
            features: ['Core features', 'Email support', 'Monthly updates'],
            popular: true
          }
        ],
        socialProof: {
          testimonials: [
            {
              id: '1',
              name: 'John Smith',
              role: 'Real Estate Agent',
              content: 'This service transformed my business...',
              rating: 5
            }
          ],
          stats: [
            { label: 'Happy Customers', value: '1000+' },
            { label: 'Success Rate', value: '98%' }
          ]
        },
        trustIndicators: {
          guarantee: '30-day money back guarantee',
          cancellation: 'Cancel anytime',
          certification: 'Industry certified'
        },
        callToAction: {
          primaryHeadline: 'Need More Information?',
          primaryDescription: 'Visit our website for detailed documentation and resources.',
          primaryButtonText: 'Visit Official Website',
          secondaryHeadline: 'Questions? We\'re Here to Help!',
          secondaryDescription: 'Speak with our experts to find the perfect package for your business.',
          contactInfo: {
            phone: '',
            email: '',
            website: ''
          }
        },
        urgency: {
          enabled: false,
          message: 'Limited time offer!'
        }
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
        is_featured: service.is_featured,
        image_url: service.image_url || '',
        vendor_id: service.vendor_id,
        base_pricing_tiers: service.base_pricing_tiers || [],
        pro_pricing_tiers: service.pro_pricing_tiers || [],
        copay_pricing_tiers: service.copay_pricing_tiers || [],
        supports_copay: service.supports_copay || false,
        funnel_content: service.funnel_content || {
          headline: '',
          subheadline: '',
          heroDescription: '',
          estimatedRoi: 3,
          duration: '30 days',
          whyChooseUs: {
            title: 'Why Choose Our Service?',
            benefits: [
              { icon: 'check', title: 'Proven Results', description: 'Get measurable results fast' },
              { icon: 'check', title: 'Expert Support', description: '24/7 professional assistance' },
              { icon: 'check', title: 'Fast Implementation', description: 'Up and running in minutes' }
            ]
          },
          media: [],
          packages: [
            {
              id: 'standard',
              name: 'Standard Package',
              description: 'Perfect for most businesses',
              price: 299,
              features: ['Core features', 'Email support', 'Monthly updates'],
              popular: true
            }
          ],
          socialProof: {
            testimonials: [
              {
                id: '1',
                name: 'John Smith',
                role: 'Real Estate Agent',
                content: 'This service transformed my business...',
                rating: 5
              }
            ],
            stats: [
              { label: 'Happy Customers', value: '1000+' },
              { label: 'Success Rate', value: '98%' }
            ]
          },
          trustIndicators: {
            guarantee: '30-day money back guarantee',
            cancellation: 'Cancel anytime',
            certification: 'Industry certified'
          },
          callToAction: {
            primaryHeadline: 'Need More Information?',
            primaryDescription: 'Visit our website for detailed documentation and resources.',
            primaryButtonText: 'Visit Official Website',
            secondaryHeadline: 'Questions? We\'re Here to Help!',
            secondaryDescription: 'Speak with our experts to find the perfect package for your business.',
            contactInfo: {
              phone: '',
              email: '',
              website: ''
            }
          },
          urgency: {
            enabled: false,
            message: 'Limited time offer!'
          }
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

  const saveService = async () => {
    if (!user) return;
    
    try {

      const serviceData = {
        title: serviceForm.title,
        description: serviceForm.description,
        category: serviceForm.category,
        price: serviceForm.price,
        image_url: serviceForm.image_url,
        is_featured: serviceForm.is_featured,
        vendor_id: user.id
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        
        toast({ title: "Success", description: "Service updated successfully!" });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
        
        toast({ title: "Success", description: "Service created successfully!" });
      }

      // Reload services data
      await loadDashboardData();
      closeServiceBuilder();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive"
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast({ title: "Success", description: "Service deleted successfully!" });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      });
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Checking authentication...</div>
      </div>
    );
  }

  // Show loading while dashboard data is being loaded
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
              Services Dashboard
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
                <div key={service.id} className="group relative">
                  {/* Service Card - matches marketplace design */}
                  <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50 h-full flex flex-col">
                    {/* Edit Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openServiceBuilder(service)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteService(service.id)}>
                          <X className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 z-10 flex gap-2">
                      {service.is_featured && (
                        <Badge className="bg-circle-primary text-primary-foreground text-xs font-medium">
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Performance Stats */}
                    <div className="absolute top-3 right-3 z-10 flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {service.views || 0} views
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {service.conversions || 0} leads
                      </Badge>
                    </div>

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-muted flex-shrink-0">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                          <Image className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex flex-col flex-grow">
                      {/* Title */}
                      <div className="h-6 mb-3">
                        <h3 className="font-semibold text-foreground leading-tight line-clamp-1">
                          {service.title}
                        </h3>
                      </div>

                      {/* Rating placeholder */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-gray-300" />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          0.0 (0 reviews)
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-3">
                        {service.description}
                      </p>

                      {/* Category & Tags */}
                      <div className="h-8 mb-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {service.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="space-y-2 mb-3 flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <span className="text-xl font-bold text-foreground">
                            ${service.price}
                          </span>
                        </div>
                      </div>

                      {/* Performance metrics */}
                      <div className="h-4 mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Conv. Rate: {((service.conversions || 0) / Math.max(service.views || 1, 1) * 100).toFixed(1)}%</span>
                          <span>Revenue: $0</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto">
                        <Button 
                          className="flex-1"
                          variant="outline"
                          onClick={() => openServiceBuilder(service)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Service
                        </Button>
                        
                        <Button 
                          variant="outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                       <Label htmlFor="copay-support">Supports Co-pay</Label>
                       <Switch
                         checked={serviceForm.supports_copay}
                         onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, supports_copay: checked }))}
                       />
                       <p className="text-xs text-muted-foreground">
                         Enable if this service offers co-pay pricing options
                       </p>
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

                  <ServiceImageUpload
                    value={serviceForm.image_url}
                    onChange={(url) => setServiceForm(prev => ({ ...prev, image_url: url }))}
                  />

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
                <ServiceFunnelEditor
                  funnelContent={serviceForm.funnel_content}
                  onChange={(content) => setServiceForm(prev => ({ ...prev, funnel_content: content }))}
                />
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

                      {/* Benefits Section */}
                      {serviceForm.funnel_content.whyChooseUs.benefits.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold">{serviceForm.funnel_content.whyChooseUs.title}</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                            {serviceForm.funnel_content.whyChooseUs.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-semibold">{benefit.title}</h3>
                                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Proof */}
                      {serviceForm.funnel_content.socialProof.testimonials.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold">What Our Customers Say</h2>
                          <div className="space-y-4">
                            {serviceForm.funnel_content.socialProof.testimonials.map((testimonial, index) => (
                              <Card key={index} className="p-4 text-left">
                                <p className="italic mb-2">"{testimonial.content}"</p>
                                <div className="flex items-center space-x-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">{testimonial.name}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground text-sm">{testimonial.role}</span>
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
                          {serviceForm.funnel_content.callToAction.primaryButtonText || 'Book a Demo'}
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