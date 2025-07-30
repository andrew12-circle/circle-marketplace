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
  pricing_model: string;
  is_featured: boolean;
  image_url?: string;
  funnel_content?: {
    headline: string;
    subheadline: string;
    heroDescription: string;
    whyChooseUs: {
      title: string;
      benefits: Array<{
        icon: string;
        text: string;
      }>;
    };
    valueProposition: {
      title: string;
      items: Array<{
        icon: string;
        title: string;
        description: string;
      }>;
    };
    packages: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      originalPrice?: number;
      features: string[];
      popular: boolean;
    }>;
    socialProof: Array<{
      id: string;
      authorName: string;
      authorTitle: string;
      text: string;
      rating: number;
      date: string;
    }>;
    mediaGallery: Array<{
      id: string;
      type: 'image' | 'video' | 'document';
      url: string;
      title: string;
      description?: string;
    }>;
    callToAction: string;
    guarantees: string[];
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
      heroDescription: '',
      whyChooseUs: {
        title: 'Why Choose Our Service?',
        benefits: [
          { icon: 'check', text: 'Proven results' },
          { icon: 'check', text: 'Expert support' },
          { icon: 'check', text: 'Fast implementation' }
        ]
      },
      valueProposition: {
        title: 'What You\'ll Get',
        items: [
          {
            icon: 'target',
            title: 'Complete Solution',
            description: 'Everything you need to succeed'
          }
        ]
      },
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
      socialProof: [
        {
          id: '1',
          authorName: 'John Smith',
          authorTitle: 'Real Estate Agent',
          text: 'This service transformed my business...',
          rating: 5,
          date: new Date().toLocaleDateString()
        }
      ],
      mediaGallery: [],
      callToAction: 'Get Started Today',
      guarantees: ['30-day money back guarantee', '24/7 support'],
      urgency: {
        enabled: false,
        message: 'Limited time offer!'
      }
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
            heroDescription: 'Complete CRM solution with automated email campaigns, lead scoring, and real estate specific workflows.',
            whyChooseUs: {
              title: 'Why Choose Our CRM?',
              benefits: [
                { icon: 'check', text: 'Proven results' },
                { icon: 'check', text: 'Expert support' },
                { icon: 'check', text: 'Fast implementation' }
              ]
            },
            valueProposition: {
              title: 'What You\'ll Get',
              items: [
                {
                  icon: 'target',
                  title: 'Complete Solution',
                  description: 'Everything you need to succeed'
                }
              ]
            },
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
            socialProof: [
              {
                id: '1',
                authorName: 'Sarah Johnson',
                authorTitle: 'Top Producer, Keller Williams',
                text: 'Increased my conversions by 40% in the first month!',
                rating: 5,
                date: new Date().toLocaleDateString()
              }
            ],
            mediaGallery: [],
            callToAction: 'Start Free Trial',
            guarantees: ['30-day money back guarantee', '24/7 support'],
            urgency: {
              enabled: false,
              message: 'Limited time offer!'
            }
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
        heroDescription: '',
        whyChooseUs: {
          title: 'Why Choose Our Service?',
          benefits: [
            { icon: 'check', text: 'Proven results' },
            { icon: 'check', text: 'Expert support' },
            { icon: 'check', text: 'Fast implementation' }
          ]
        },
        valueProposition: {
          title: 'What You\'ll Get',
          items: [
            {
              icon: 'target',
              title: 'Complete Solution',
              description: 'Everything you need to succeed'
            }
          ]
        },
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
        socialProof: [
          {
            id: '1',
            authorName: 'John Smith',
            authorTitle: 'Real Estate Agent',
            text: 'This service transformed my business...',
            rating: 5,
            date: new Date().toLocaleDateString()
          }
        ],
        mediaGallery: [],
        callToAction: 'Get Started Today',
        guarantees: ['30-day money back guarantee', '24/7 support'],
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
        pricing_model: service.pricing_model,
        is_featured: service.is_featured,
        image_url: service.image_url || '',
        funnel_content: service.funnel_content || {
          headline: '',
          subheadline: '',
          heroDescription: '',
          whyChooseUs: {
            title: 'Why Choose Our Service?',
            benefits: [
              { icon: 'check', text: 'Proven results' },
              { icon: 'check', text: 'Expert support' },
              { icon: 'check', text: 'Fast implementation' }
            ]
          },
          valueProposition: {
            title: 'What You\'ll Get',
            items: [
              {
                icon: 'target',
                title: 'Complete Solution',
                description: 'Everything you need to succeed'
              }
            ]
          },
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
          socialProof: [
            {
              id: '1',
              authorName: 'John Smith',
              authorTitle: 'Real Estate Agent',
              text: 'This service transformed my business...',
              rating: 5,
              date: new Date().toLocaleDateString()
            }
          ],
          mediaGallery: [],
          callToAction: 'Get Started Today',
          guarantees: ['30-day money back guarantee', '24/7 support'],
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

                      {/* Value Proposition Section */}
                      {serviceForm.funnel_content.valueProposition.items.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold">{serviceForm.funnel_content.valueProposition.title}</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                            {serviceForm.funnel_content.valueProposition.items.map((item, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-semibold">{item.title}</h3>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Proof */}
                      {serviceForm.funnel_content.socialProof.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold">What Our Customers Say</h2>
                          <div className="space-y-4">
                            {serviceForm.funnel_content.socialProof.map((proof, index) => (
                              <Card key={index} className="p-4 text-left">
                                <p className="italic mb-2">"{proof.text}"</p>
                                <div className="flex items-center space-x-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">{proof.authorName}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground text-sm">{proof.authorTitle}</span>
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
                          {serviceForm.funnel_content.callToAction || 'Book a Demo'}
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