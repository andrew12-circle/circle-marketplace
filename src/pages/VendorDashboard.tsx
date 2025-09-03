// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, DollarSign, Users, Star, Eye, Package, Calendar, Bell, Settings, BarChart3, Zap, Target, Award, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ServiceCard } from '@/components/marketplace/ServiceCard';
import { ServiceDetailsModal } from '@/components/marketplace/ServiceDetailsModal';
import { ServiceFunnelEditorModal } from '@/components/marketplace/ServiceFunnelEditorModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVendorActivityTracking } from '@/hooks/useVendorActivityTracking';


interface VendorService {
  id: string;
  title: string;
  description: string;
  retail_price?: string;
  category: string;
  vendor_location: string;
  image_url?: string;
  rating?: number;
  reviews_count?: number;
  views_count?: number;
  bookings_count?: number;
  is_featured?: boolean;
  status?: string;
  service_views?: any[];
  consultation_bookings?: any[];
}

interface VendorStats {
  total_services: number;
  total_views: number;
  total_bookings: number;
  monthly_revenue: number;
  conversion_rate: number;
  avg_rating: number;
  total_reviews: number;
  trending_score: number;
}

export const VendorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackFunnelView } = useVendorActivityTracking();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [stats, setStats] = useState<VendorStats>({
    total_services: 0,
    total_views: 0,
    total_bookings: 0,
    monthly_revenue: 0,
    conversion_rate: 0,
    avg_rating: 0,
    total_reviews: 0,
    trending_score: 0
  });
  const [analytics, setAnalytics] = useState({
    currentPeriod: { revenue: 0, views: 0, consultations: 0, conversionRate: 0 },
    previousPeriod: { revenue: 0, views: 0, consultations: 0, conversionRate: 0 },
    growth: { revenue: 0, views: 0, consultations: 0, conversionRate: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [isServiceBuilderOpen, setIsServiceBuilderOpen] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
  const [pricingTiers, setPricingTiers] = useState([
    {
      id: '1',
      name: 'Basic',
      description: 'Perfect for getting started',
      price: '99',
      duration: 'mo',
      features: [
        { id: '1', text: 'Basic feature 1', included: true },
        { id: '2', text: 'Basic feature 2', included: true },
        { id: '3', text: 'Advanced feature 1', included: false }
      ],
      isPopular: false,
      buttonText: 'Get Started',
      position: 1
    }
  ]);
  const [funnelContent, setFunnelContent] = useState({
    headline: "",
    subheadline: "",
    heroDescription: "",
    estimatedRoi: 0,
    duration: "",
    whyChooseUs: {
      title: "",
      benefits: []
    },
    media: [],
    packages: [],
    thumbnailGallery: {
      enabled: false,
      title: 'What You\'ll Get',
      items: [
        { id: '1', label: 'Demo Video', icon: 'video' },
        { id: '2', label: 'Case Study', icon: 'chart' },
        { id: '3', label: 'Training', icon: 'book' },
        { id: '4', label: 'Results', icon: 'trophy' }
      ]
    },
    roiCalculator: {
      enabled: false,
      title: 'ROI Calculator',
      currentMonthlyClosings: 3,
      averageCommission: 8500,
      increasePercentage: 150,
      calculatedAdditionalIncome: 38250,
      calculatedAnnualIncrease: 459000
    },
    testimonialCards: {
      enabled: false,
      title: 'Recent Success Stories',
      cards: [
        {
          id: '1',
          name: 'Sarah T.',
          role: 'Keller Williams',
          content: 'Increased my closings by 200% in just 3 months!',
          rating: 5,
          timeAgo: '2 weeks ago',
          borderColor: 'green',
          iconColor: 'green',
          icon: 'trending'
        }
      ]
    },
    urgencySection: {
      enabled: false,
      title: 'Limited Availability',
      message: 'We only take on 5 new clients per month to ensure quality service.',
      spotsRemaining: 2,
      totalSpots: 5
    },
    socialProof: {
      testimonials: [],
      stats: []
    },
    trustIndicators: {
      guarantee: "",
      cancellation: "",
      certification: ""
    },
    callToAction: {
      primaryHeadline: "",
      primaryDescription: "",
      primaryButtonText: "",
      secondaryHeadline: "",
      secondaryDescription: "",
      contactInfo: {
        phone: "",
        email: "",
        website: ""
      }
    },
          urgency: {
            enabled: false,
            message: ""
          },
          proofItWorks: {
            testimonials: {
              enabled: false,
              items: []
            },
            caseStudy: {
              enabled: false,
              data: {
                beforeValue: 0,
                afterValue: 0,
                beforeLabel: "",
                afterLabel: "",
                percentageIncrease: 0,
                timeframe: "",
                description: ""
              }
            },
            vendorVerification: {
              enabled: false,
              data: {
                badges: [],
                description: ""
              }
            }
          }
  });
  const [selectedService, setSelectedService] = useState<VendorService | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  // Track dashboard page view (temporarily disabled until vendor table is set up)
  // useEffect(() => {
  //   if (vendorId) {
  //     trackFunnelView(vendorId, {
  //       vendorName: 'Current Vendor',
  //       section: 'vendor_dashboard',
  //       timeSpent: 0,
  //     });
  //   }
  // }, [vendorId, trackFunnelView]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      
      // Get current user profile to find vendor ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to view your dashboard",
          variant: "destructive"
        });
        return;
      }

      // Set vendor ID for activity tracking
      setVendorId(user.id);

      // Fetch services for the current user (vendor)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          service_views(id, viewed_at),
          consultation_bookings(status, created_at),
          saved_services(id)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      if (!servicesData) {
        setServices([]);
        return;
      }

      // Calculate current and previous period analytics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      let currentRevenue = 0, currentViews = 0, currentConsultations = 0;
      let previousRevenue = 0, previousViews = 0, previousConsultations = 0;

      // Map the data to match our interface with enhanced analytics
      const mappedServices: VendorService[] = servicesData.map((service: any) => {
        const views = service.service_views || [];
        const bookings = service.consultation_bookings || [];
        const saves = service.saved_services || [];
        const price = parseFloat(service.retail_price || '0');

        // Calculate current period (last 30 days)
        const currentPeriodViews = views.filter((view: any) => 
          new Date(view.viewed_at) >= thirtyDaysAgo
        );
        const currentPeriodBookings = bookings.filter((booking: any) => 
          new Date(booking.created_at) >= thirtyDaysAgo
        );

        // Calculate previous period (30-60 days ago)
        const previousPeriodViews = views.filter((view: any) => {
          const viewDate = new Date(view.viewed_at);
          return viewDate >= sixtyDaysAgo && viewDate < thirtyDaysAgo;
        });
        const previousPeriodBookings = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate >= sixtyDaysAgo && bookingDate < thirtyDaysAgo;
        });

        // Accumulate totals
        currentViews += currentPeriodViews.length;
        currentConsultations += currentPeriodBookings.length;
        currentRevenue += currentPeriodBookings.length * price;

        previousViews += previousPeriodViews.length;
        previousConsultations += previousPeriodBookings.length;
        previousRevenue += previousPeriodBookings.length * price;
        
        return {
          id: service.id,
          title: service.title || 'Untitled Service',
          description: service.description || '',
          retail_price: service.retail_price || '0',
          category: service.category || 'General',
          vendor_location: service.vendor_location || 'Location not specified',
          image_url: service.image_url,
          rating: service.rating || 4.5,
          reviews_count: 0,
          views_count: views.length,
          bookings_count: bookings.length,
          is_featured: service.is_featured || false,
          status: service.status || 'active',
          service_views: views,
          consultation_bookings: bookings
        };
      });

      // Calculate conversion rates
      const currentConversionRate = currentViews > 0 ? (currentConsultations / currentViews) * 100 : 0;
      const previousConversionRate = previousViews > 0 ? (previousConsultations / previousViews) * 100 : 0;

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const analyticsData = {
        currentPeriod: {
          revenue: currentRevenue,
          views: currentViews,
          consultations: currentConsultations,
          conversionRate: currentConversionRate
        },
        previousPeriod: {
          revenue: previousRevenue,
          views: previousViews,
          consultations: previousConsultations,
          conversionRate: previousConversionRate
        },
        growth: {
          revenue: calculateGrowth(currentRevenue, previousRevenue),
          views: calculateGrowth(currentViews, previousViews),
          consultations: calculateGrowth(currentConsultations, previousConsultations),
          conversionRate: calculateGrowth(currentConversionRate, previousConversionRate)
        }
      };

      setAnalytics(analyticsData);
      setServices(mappedServices);

      // Calculate real stats from the data
      const totalViews = mappedServices.reduce((sum, s) => sum + s.views_count, 0);
      const totalBookings = mappedServices.reduce((sum, s) => sum + s.bookings_count, 0);
      const totalReviews = mappedServices.reduce((sum, s) => sum + s.reviews_count, 0);
      const avgRating = totalReviews > 0 
        ? mappedServices.reduce((sum, s) => sum + (s.rating * s.reviews_count), 0) / totalReviews 
        : 0;
      const conversionRate = totalViews > 0 ? (totalBookings / totalViews * 100) : 0;
      const estimatedRevenue = totalBookings * 150; // $150 average per booking
      const trendingScore = Math.min(100, Math.max(0, 
        (totalViews * 0.1) + (totalBookings * 5) + (totalReviews * 2)
      ));

      const realStats: VendorStats = {
        total_services: mappedServices.length,
        total_views: totalViews,
        total_bookings: totalBookings,
        monthly_revenue: estimatedRevenue,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        avg_rating: Math.round(avgRating * 100) / 100,
        total_reviews: totalReviews,
        trending_score: Math.round(trendingScore)
      };

      setStats(realStats);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openServiceBuilder = () => {
    setIsServiceBuilderOpen(true);
  };

  const handleServiceClick = (service: VendorService) => {
    setSelectedService(service);
    setIsDetailsModalOpen(true);
  };

  const handleSaveService = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save services",
          variant: "destructive"
        });
        return;
      }

      const serviceData = {
        title: funnelContent.headline || "New Service",
        description: funnelContent.heroDescription || "",
        vendor_id: user.id,
        category: "professional_services",
        retail_price: pricingTiers.length > 0 ? pricingTiers[0].price : "99",
        pricing_tiers: pricingTiers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('services')
        .insert([serviceData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service created successfully!",
        variant: "default"
      });

      // Refresh the services list
      await fetchVendorData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Header with Back Button */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/20 dark:border-slate-700/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  // Try to go back, but fallback to home if no history
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Vendor Dashboard</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Professional Services Hub</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-lg font-medium">Welcome back, Pro Vendor!</span>
                </div>
                <h2 className="text-3xl font-bold">Grow Your Business Today</h2>
                <p className="text-lg text-white/90 max-w-2xl">
                  Your professional marketplace to showcase services, connect with customers, and build your reputation.
                </p>
                <div className="flex items-center gap-4 mt-6">
                  <Button 
                    onClick={openServiceBuilder}
                    className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-6 py-3"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Service
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white hover:text-primary"
                    size="lg"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>
              <div className="hidden lg:flex items-center">
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold">${stats.monthly_revenue.toLocaleString()}</div>
                  <div className="text-white/80">This Month's Revenue</div>
                  <div className="flex items-center gap-2 text-green-300">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+23% from last month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Monthly Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                ${stats.monthly_revenue.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">+23%</span>
                </div>
                <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.total_bookings}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">+15%</span>
                </div>
                <span className="text-xs text-blue-600/70 dark:text-blue-400/70">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Profile Views</CardTitle>
              <Eye className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                {stats.total_views.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">+18%</span>
                </div>
                <span className="text-xs text-purple-600/70 dark:text-purple-400/70">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Rating</CardTitle>
              <Star className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">
                {stats.avg_rating.toFixed(1)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-3 h-3 ${star <= Math.floor(stats.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-amber-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs text-amber-600/70 dark:text-amber-400/70">({stats.total_reviews} reviews)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-sm text-muted-foreground">{stats.conversion_rate}%</span>
                </div>
                <Progress value={stats.conversion_rate} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Trending Score</span>
                  <span className="text-sm text-muted-foreground">{stats.trending_score}%</span>
                </div>
                <Progress value={stats.trending_score} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={openServiceBuilder}
                className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Service
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Zap className="w-4 h-4 mr-2" />
                Boost Visibility
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2" />
                Manage Reviews
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Customer Insights
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="services" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Your Services ({services.length})
                  </CardTitle>
                  <Button 
                    onClick={openServiceBuilder}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No services yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Start building your business by creating your first service listing. 
                      Showcase your expertise and connect with customers.
                    </p>
                    <Button 
                      onClick={openServiceBuilder}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Service
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={{
                          id: service.id,
                          title: service.title,
                          description: service.description,
                          category: service.category,
                          retail_price: service.retail_price || '0',
                          image_url: service.image_url,
                          is_featured: service.is_featured || false,
                          is_top_pick: false,
                          vendor: {
                            name: 'Your Business',
                            rating: service.rating || 4.5,
                            review_count: service.reviews_count || 0,
                            is_verified: true
                          }
                        }}
                        onViewDetails={() => handleServiceClick(service)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        ${analytics.currentPeriod.revenue.toLocaleString()}
                      </p>
                      <p className={`text-sm mt-1 ${
                        analytics.growth.revenue >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {analytics.growth.revenue >= 0 ? '+' : ''}{analytics.growth.revenue.toFixed(1)}% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Views</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {analytics.currentPeriod.views.toLocaleString()}
                      </p>
                      <p className={`text-sm mt-1 ${
                        analytics.growth.views >= 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {analytics.growth.views >= 0 ? '+' : ''}{analytics.growth.views.toFixed(1)}% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Eye className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Consultations</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {analytics.currentPeriod.consultations}
                      </p>
                      <p className={`text-sm mt-1 ${
                        analytics.growth.consultations >= 0 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {analytics.growth.consultations >= 0 ? '+' : ''}{analytics.growth.consultations.toFixed(1)}% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Conversion Rate</p>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {analytics.currentPeriod.conversionRate.toFixed(1)}%
                      </p>
                      <p className={`text-sm mt-1 ${
                        analytics.growth.conversionRate >= 0 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {analytics.growth.conversionRate >= 0 ? '+' : ''}{analytics.growth.conversionRate.toFixed(1)}% from last month
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Performance Table */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Service Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Services to Analyze</h3>
                    <p className="text-muted-foreground">
                      Create your first service to start tracking performance analytics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                      <div>Service</div>
                      <div className="text-center">Views</div>
                      <div className="text-center">Consultations</div>
                      <div className="text-center">Conversion</div>
                      <div className="text-center">Revenue</div>
                      <div className="text-center">Status</div>
                    </div>
                    {services.map((service) => {
                      const views = service.service_views?.length || 0;
                      const bookings = service.consultation_bookings?.length || 0;
                      const conversionRate = views > 0 ? (bookings / views * 100) : 0;
                      const revenue = bookings * parseFloat(service.retail_price || '0');
                      
                      return (
                        <div key={service.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b border-muted/30 hover:bg-muted/20 rounded-lg px-2 transition-colors">
                          <div className="flex items-center gap-3">
                            {service.image_url ? (
                              <img src={service.image_url} alt={service.title} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{service.title}</p>
                              <p className="text-xs text-muted-foreground">{service.category}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium">{views}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium">{bookings}</span>
                          </div>
                          <div className="text-center">
                            <Badge variant={conversionRate > 5 ? "default" : conversionRate > 2 ? "secondary" : "outline"}>
                              {conversionRate.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium">${revenue.toFixed(0)}</span>
                          </div>
                          <div className="text-center">
                            <Badge variant={service.is_featured ? "default" : "secondary"}>
                              {service.is_featured ? "Featured" : "Active"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.slice(0, 5).map((service, index) => (
                    <div key={service.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{service.title} received new views</p>
                        <p className="text-xs text-muted-foreground">
                          {service.service_views?.length || 0} total views • {Math.floor(Math.random() * 24)} hours ago
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        +{Math.floor(Math.random() * 10) + 1}
                      </Badge>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {isServiceBuilderOpen && (
        <ServiceFunnelEditorModal
          open={isServiceBuilderOpen}
          onOpenChange={(open) => setIsServiceBuilderOpen(open)}
          funnelContent={funnelContent}
          onChange={setFunnelContent}
          onSave={async () => {
            await handleSaveService();
            setIsServiceBuilderOpen(false);
          }}
          serviceName="New Service"
          pricingTiers={pricingTiers}
          onPricingTiersChange={setPricingTiers}
        />
      )}

      {selectedService && (
        <ServiceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedService(null);
          }}
          service={{
            id: selectedService.id,
            title: selectedService.title,
            description: selectedService.description,
            retail_price: selectedService.retail_price || '0',
            category: selectedService.category,
            image_url: selectedService.image_url,
            is_featured: selectedService.is_featured || false,
            is_top_pick: false,
            vendor: {
              name: 'Vendor Name',
              rating: selectedService.rating || 4.5,
              review_count: selectedService.reviews_count || 0,
              is_verified: true
            }
          }}
        />
      )}
    </div>
  );
};