import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Calendar,
  Edit,
  Settings,
  BarChart3,
  FileText,
  Building,
  MapPin,
  Phone,
  Mail,
  Star,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { VendorProfileEditor } from "@/components/marketplace/VendorProfileEditor";
import { VendorFunnelEditor } from "@/components/marketplace/VendorFunnelEditor";
import { VendorAnalytics } from "@/components/marketplace/VendorAnalytics";
import { VendorCardPreview } from "@/components/marketplace/VendorCardPreview";
import { CoPayRequestsManager } from "@/components/vendor/CoPayRequestsManager";
import { PaymentScheduleManager } from "@/components/vendor/PaymentScheduleManager";

interface VendorData {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  mls_areas?: string[];
  service_radius_miles?: number;
  nmls_id?: string;
  contact_email?: string;
  phone?: string;
  vendor_type?: string;
  license_states?: string[];
  individual_name?: string;
  individual_title?: string;
  individual_email?: string;
  individual_phone?: string;
  individual_license_number?: string;
}

interface DashboardStats {
  totalViews: number;
  consultationBookings: number;
  campaignSpend: number;
  recentViews: number;
  monthlyViews: number;
  conversionRate: number;
}

export const VendorAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 0,
    consultationBookings: 0,
    campaignSpend: 0,
    recentViews: 0,
    monthlyViews: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [funnelContent, setFunnelContent] = useState(null);

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  useEffect(() => {
    if (vendorData) {
      fetchAnalytics();
    }
  }, [vendorData]);

  const fetchVendorData = async () => {
    try {
      // First try to find vendor by user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.vendor_enabled) {
        setLoading(false);
        return;
      }

      // Try to find vendor through vendor_user_associations first
      const { data: vendorAssociation } = await supabase
        .from('vendor_user_associations')
        .select(`
          vendor_id,
          vendors (*)
        `)
        .eq('user_id', user?.id)
        .single();

      if (vendorAssociation?.vendors) {
        setVendorData(vendorAssociation.vendors);
        setLoading(false);
        return;
      }

      // Fallback: Try to find vendor by email
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('contact_email', user?.email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching vendor data:', error);
        toast.error('Failed to load vendor data');
        setLoading(false);
        return;
      }

      if (vendor) {
        setVendorData(vendor);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load vendor data');
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!vendorData?.id) return;

    try {
      // Fetch vendor's services
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('vendor_id', vendorData.id);

      const serviceIds = services?.map(s => s.id) || [];

      if (serviceIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch service views
      const { data: viewsData } = await supabase
        .from('service_views')
        .select('*')
        .in('service_id', serviceIds);

      // Fetch consultation bookings
      const { data: bookingsData } = await supabase
        .from('consultation_bookings')
        .select('*')
        .in('service_id', serviceIds);

      // Calculate date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Calculate stats
      const totalViews = viewsData?.length || 0;
      const recentViews = viewsData?.filter(view => 
        new Date(view.viewed_at) > thirtyDaysAgo
      ).length || 0;
      
      const monthlyViews = viewsData?.filter(view => 
        new Date(view.viewed_at) > oneMonthAgo
      ).length || 0;

      const totalBookings = bookingsData?.length || 0;
      const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

      setStats({
        totalViews,
        consultationBookings: totalBookings,
        campaignSpend: vendorData.campaigns_funded * 500, // Estimated spend per campaign
        recentViews,
        monthlyViews,
        conversionRate: Math.round(conversionRate * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (updatedData: any) => {
    setVendorData(prev => prev ? { ...prev, ...updatedData } : null);
    setIsEditingProfile(false);
    toast.success('Profile updated successfully');
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
  };

  const handleFunnelSave = async (content: any) => {
    setFunnelContent(content);
    setIsEditingFunnel(false);
    toast.success('Funnel page saved successfully');
  };

  const handleFunnelCancel = () => {
    setIsEditingFunnel(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading your co-marketing dashboard...</div>
        </div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-200/20 dark:border-slate-700/20">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Vendor Profile Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">You don't appear to be registered as a vendor or your vendor profile is not activated.</p>
          <Button onClick={() => window.location.href = '/vendor-registration'}>
            Register as Vendor
          </Button>
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
                onClick={() => navigate(-1)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-3">
                {vendorData.logo_url ? (
                  <img 
                    src={vendorData.logo_url} 
                    alt={vendorData.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{vendorData.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Co-Marketing Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => setIsEditingProfile(true)} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-6 h-6" />
                  <span className="text-lg font-medium">Co-Marketing Analytics</span>
                </div>
                <h2 className="text-3xl font-bold">Partnership Performance</h2>
                <p className="text-lg text-white/90 max-w-2xl">
                  Track your co-marketing campaigns, monitor agent partnerships, and analyze your marketplace presence.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  {vendorData.is_verified && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      Verified Vendor
                    </Badge>
                  )}
                  {vendorData.nmls_id && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      NMLS #{vendorData.nmls_id}
                    </Badge>
                  )}
                  {vendorData.location && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{vendorData.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden lg:flex items-center">
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold">${stats.campaignSpend.toLocaleString()}</div>
                  <div className="text-white/80">Total Campaign Investment</div>
                  <div className="flex items-center gap-2 text-green-300">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{vendorData.campaigns_funded} campaigns active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Partnered Agents</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{vendorData.co_marketing_agents}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Active</span>
                </div>
                <span className="text-xs text-blue-600/70 dark:text-blue-400/70">partnerships</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Campaign Spend</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                ${stats.campaignSpend.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">{vendorData.campaigns_funded}</span>
                </div>
                <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">campaigns funded</span>
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
                {stats.totalViews.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">+{stats.recentViews}</span>
                </div>
                <span className="text-xs text-purple-600/70 dark:text-purple-400/70">last 30 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Consultations</CardTitle>
              <Calendar className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">{stats.consultationBookings}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-orange-600 dark:text-orange-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">{stats.conversionRate}%</span>
                </div>
                <span className="text-xs text-orange-600/70 dark:text-orange-400/70">conversion rate</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="copay-requests">Co-Pay Requests</TabsTrigger>
            <TabsTrigger value="partnerships">Active Partnerships</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Edit Profile</TabsTrigger>
            <TabsTrigger value="funnel">Edit Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-semibold">{vendorData.rating}/5.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{vendorData.review_count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service Radius</span>
                    <span className="font-semibold">{vendorData.service_radius_miles || 'N/A'} miles</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Views</span>
                    <span className="font-semibold">{stats.monthlyViews}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Update Company Description
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Availability
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Update Pricing
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Vendor Card
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            {(vendorData.contact_email || vendorData.phone || vendorData.website_url) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {vendorData.contact_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{vendorData.contact_email}</span>
                      </div>
                    )}
                    {vendorData.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{vendorData.phone}</span>
                      </div>
                    )}
                    {vendorData.website_url && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <a 
                          href={vendorData.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {vendorData.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="copay-requests">
            <CoPayRequestsManager />
          </TabsContent>

          <TabsContent value="partnerships">
            <PaymentScheduleManager />
          </TabsContent>

          <TabsContent value="analytics">
            <VendorAnalytics 
              data={{
                totalViews: stats.totalViews,
                consultationBookings: stats.consultationBookings,
                campaignSpend: stats.campaignSpend,
                recentViews: stats.recentViews,
                monthlyViews: stats.monthlyViews,
                conversionRate: stats.conversionRate,
                partneredAgents: vendorData.co_marketing_agents,
                campaignsFunded: vendorData.campaigns_funded
              }}
              vendorData={{
                name: vendorData.name,
                location: vendorData.location,
                co_marketing_agents: vendorData.co_marketing_agents,
                campaigns_funded: vendorData.campaigns_funded
              }}
            />
          </TabsContent>

          <TabsContent value="profile">
            {isEditingProfile ? (
              <VendorProfileEditor
                vendorData={vendorData}
                onSave={handleProfileSave}
                onCancel={handleProfileCancel}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Vendor Profile</CardTitle>
                  <p className="text-sm text-gray-600">
                    Update your company information and how it appears to agents
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">Click "Edit Profile" in the header or the button below to update your vendor information.</p>
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="funnel">
            {isEditingFunnel ? (
              <VendorFunnelEditor
                vendorId={vendorData.id}
                initialContent={funnelContent}
                onSave={handleFunnelSave}
                onCancel={handleFunnelCancel}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Funnel Page</CardTitle>
                  <p className="text-sm text-gray-600">
                    Customize your vendor funnel page that agents see when they click on your card
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">
                      Create and customize your vendor funnel page to showcase your services, testimonials, and convert more leads.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">What you can customize:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Hero section with compelling headlines</li>
                          <li>• Service benefits and value propositions</li>
                          <li>• Pricing packages and offerings</li>
                          <li>• Customer testimonials and reviews</li>
                          <li>• Contact information and CTAs</li>
                          <li>• Trust indicators and guarantees</li>
                        </ul>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Benefits of a custom funnel:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Higher conversion rates</li>
                          <li>• Professional brand presentation</li>
                          <li>• Better lead qualification</li>
                          <li>• Showcase your expertise</li>
                          <li>• Build trust with social proof</li>
                          <li>• Clear pricing communication</li>
                        </ul>
                      </div>
                    </div>
                   <Button onClick={() => setIsEditingFunnel(true)} className="mt-4">
                      <Edit className="w-4 h-4 mr-2" />
                      Start Editing Funnel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Card Preview Modal */}
        {showCardPreview && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Card Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  This is how your vendor card will appear to customers in the marketplace.
                </p>
              </CardHeader>
              <CardContent>
                <VendorCardPreview
                  vendorData={{
                    name: vendorData?.name || "Your Company Name",
                    description: vendorData?.description || "Your company description will appear here...",
                    rating: vendorData?.rating || 0,
                    reviewCount: vendorData?.review_count || 0,
                    location: vendorData?.location || "Your Location",
                    phone: vendorData?.phone || "Your Phone",
                    contactEmail: vendorData?.contact_email || "your@email.com",
                    websiteUrl: vendorData?.website_url,
                    logoUrl: vendorData?.logo_url,
                    isVerified: vendorData?.is_verified || false,
                    coMarketingAgents: vendorData?.co_marketing_agents || 0,
                    campaignsFunded: vendorData?.campaigns_funded || 0,
                    vendorType: vendorData?.vendor_type || "company",
                    specialties: vendorData?.license_states || []
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};