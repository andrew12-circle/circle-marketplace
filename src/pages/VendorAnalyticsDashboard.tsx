import { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import { VendorProfileEditor } from "@/components/marketplace/VendorProfileEditor";
import { VendorFunnelEditor } from "@/components/marketplace/VendorFunnelEditor";
import { VendorAnalytics } from "@/components/marketplace/VendorAnalytics";
import { VendorCardPreview } from "@/components/marketplace/VendorCardPreview";

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
  const { user } = useAuth();
  const navigate = useNavigate();
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
      setLoading(true);
      
      // First try to find vendor by user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Failed to load profile data');
        setLoading(false);
        return;
      }

      if (!profile?.vendor_enabled) {
        console.log('Vendor not enabled for user');
        setLoading(false);
        return;
      }

      // Try to find vendor through vendor_user_associations first
      const { data: vendorAssociation, error: associationError } = await supabase
        .from('vendor_user_associations')
        .select(`
          vendor_id,
          vendors (*)
        `)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (associationError) {
        console.error('Error fetching vendor association:', associationError);
      }

      if (vendorAssociation?.vendors) {
        console.log('Found vendor via association:', vendorAssociation.vendors);
        setVendorData(vendorAssociation.vendors);
        setLoading(false);
        return;
      }

      // Fallback: Try to find vendor by email
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('contact_email', user?.email)
        .maybeSingle();

      if (vendorError && vendorError.code !== 'PGRST116') {
        console.error('Error fetching vendor by email:', vendorError);
        toast.error('Failed to load vendor data');
        setLoading(false);
        return;
      }

      if (vendor) {
        console.log('Found vendor by email:', vendor);
        setVendorData(vendor);
      } else {
        console.log('No vendor found for user');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Unexpected error in fetchVendorData:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent/40 rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Loading Dashboard</h3>
              <p className="text-sm text-muted-foreground">Fetching your analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <Building className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Vendor Profile Not Found</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                You don't appear to be registered as a vendor or your vendor profile is not activated.
              </p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/vendor-registration'}
              className="w-full"
            >
              Register as Vendor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Modern Header with Glass Effect */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="hover:bg-muted/50 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center space-x-4">
                {vendorData.logo_url ? (
                  <div className="relative group">
                    <img 
                      src={vendorData.logo_url} 
                      alt={vendorData.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-border shadow-lg group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Building className="w-7 h-7 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {vendorData.name}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1">
                    {vendorData.is_verified && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm">
                        <Star className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {vendorData.nmls_id && (
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                        NMLS #{vendorData.nmls_id}
                      </Badge>
                    )}
                    {vendorData.location && (
                      <span className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {vendorData.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" className="hover:bg-muted/50 border-border/50">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => setIsEditingProfile(true)} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-lg">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                onClick={() => setShowCardPreview(!showCardPreview)}
                variant={showCardPreview ? "default" : "outline"}
                className={showCardPreview ? "bg-gradient-to-r from-accent to-primary" : "hover:bg-muted/50"}
              >
                {showCardPreview ? "Hide Preview" : "Preview Card"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Partnered Agents</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-colors duration-300">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{vendorData.co_marketing_agents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active partnerships
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Campaign Spend</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 group-hover:from-green-500/20 group-hover:to-green-600/20 transition-colors duration-300">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${stats.campaignSpend.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {vendorData.campaigns_funded} campaigns funded
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-colors duration-300">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.recentViews} last 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Consultations</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 group-hover:from-orange-500/20 group-hover:to-orange-600/20 transition-colors duration-300">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.consultationBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.conversionRate}% conversion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Modern Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </TabsTrigger>
            <TabsTrigger value="funnel" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              Edit Funnel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 mr-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(vendorData.rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-foreground">{vendorData.rating}/5.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium text-muted-foreground">Total Reviews</span>
                    <span className="font-semibold text-foreground">{vendorData.review_count}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium text-muted-foreground">Service Radius</span>
                    <span className="font-semibold text-foreground">{vendorData.service_radius_miles || 'N/A'} miles</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium text-muted-foreground">Monthly Views</span>
                    <span className="font-semibold text-foreground">{stats.monthlyViews}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 mr-3">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start hover:bg-muted/50 transition-colors duration-200">
                    <Edit className="w-4 h-4 mr-3" />
                    Update Company Description
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-muted/50 transition-colors duration-200">
                    <Calendar className="w-4 h-4 mr-3" />
                    Manage Availability
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-muted/50 transition-colors duration-200">
                    <DollarSign className="w-4 h-4 mr-3" />
                    Update Pricing
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-muted/50 transition-colors duration-200">
                    <Eye className="w-4 h-4 mr-3" />
                    Preview Vendor Card
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Contact Information */}
            {(vendorData.contact_email || vendorData.phone || vendorData.website_url) && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 mr-3">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {vendorData.contact_email && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10">
                          <Mail className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{vendorData.contact_email}</span>
                      </div>
                    )}
                    {vendorData.phone && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                          <Phone className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{vendorData.phone}</span>
                      </div>
                    )}
                    {vendorData.website_url && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                          <Building className="w-4 h-4 text-purple-600" />
                        </div>
                        <a 
                          href={vendorData.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200"
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

          <TabsContent value="analytics" className="space-y-6">
            <div className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm p-6">
              <VendorAnalytics 
                data={{
                  totalViews: stats.totalViews,
                  consultationBookings: stats.consultationBookings,
                  campaignSpend: stats.campaignSpend,
                  recentViews: stats.recentViews,
                  monthlyViews: stats.monthlyViews,
                  conversionRate: stats.conversionRate,
                  partneredAgents: vendorData.co_marketing_agents,
                  campaignsFunded: vendorData.campaigns_funded,
                }}
                vendorData={{
                  name: vendorData.name,
                  location: vendorData.location,
                  co_marketing_agents: vendorData.co_marketing_agents,
                  campaigns_funded: vendorData.campaigns_funded,
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm p-6">
              {isEditingProfile ? (
                <VendorProfileEditor
                  vendorData={vendorData}
                  onSave={handleProfileSave}
                  onCancel={handleProfileCancel}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-4">
                    <Edit className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Edit Your Profile</h3>
                  <p className="text-muted-foreground mb-6">Update your vendor information and settings</p>
                  <Button 
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Start Editing
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <div className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm p-6">
              {isEditingFunnel ? (
                <VendorFunnelEditor
                  vendorId={vendorData.id}
                  initialContent={funnelContent}
                  onSave={handleFunnelSave}
                  onCancel={handleFunnelCancel}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent/10 to-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Create Your Funnel</h3>
                  <p className="text-muted-foreground mb-6">Design a custom landing page for your services</p>
                  <Button 
                    onClick={() => setIsEditingFunnel(true)}
                    className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Start Creating
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Card Preview */}
        {showCardPreview && (
          <div className="mt-8 animate-fade-in">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 mr-3">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  Vendor Card Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md mx-auto">
                  <VendorCardPreview vendorData={vendorData} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};