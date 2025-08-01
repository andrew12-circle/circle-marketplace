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
  Star
} from "lucide-react";
import { toast } from "sonner";
import { VendorProfileEditor } from "@/components/marketplace/VendorProfileEditor";

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

      // Try to find vendor by email
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Profile Not Found</h1>
          <p className="text-gray-600 mb-6">You don't appear to be registered as a vendor or your vendor profile is not activated.</p>
          <Button onClick={() => window.location.href = '/vendor-registration'}>
            Register as Vendor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {vendorData.logo_url ? (
                <img 
                  src={vendorData.logo_url} 
                  alt={vendorData.name}
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vendorData.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  {vendorData.is_verified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Verified
                    </Badge>
                  )}
                  {vendorData.nmls_id && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      NMLS #{vendorData.nmls_id}
                    </Badge>
                  )}
                  {vendorData.location && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {vendorData.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => setIsEditingProfile(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partnered Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorData.co_marketing_agents}</div>
              <p className="text-xs text-muted-foreground">
                Active partnerships
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.campaignSpend.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {vendorData.campaigns_funded} campaigns funded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recentViews} last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.consultationBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conversionRate}% conversion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
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

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>View Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Views</span>
                      <span className="font-semibold">{stats.totalViews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last 30 Days</span>
                      <span className="font-semibold">{stats.recentViews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-semibold">{stats.monthlyViews}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Consultation Bookings</span>
                      <span className="font-semibold">{stats.consultationBookings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="font-semibold">{stats.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Agent Partnerships</span>
                      <span className="font-semibold">{vendorData.co_marketing_agents}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Edit Funnel Page</CardTitle>
                <p className="text-sm text-gray-600">
                  Customize your vendor funnel page that agents see when they click on your card
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Funnel page editor coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};