import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Calendar, 
  CreditCard, 
  Users, 
  BarChart3, 
  Globe, 
  Phone, 
  Mail,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  PlayCircle,
  MessageSquare,
  TrendingUp,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProviderIntegrationProps {
  service: {
    id: string;
    title: string;
    vendor_id?: string;
    website_url?: string;
    funnel_content?: any;
    vendor: {
      name: string;
      rating: number;
      review_count: number;
      is_verified: boolean;
    } | null;
  };
  onActionComplete?: (action: string, data?: any) => void;
}

interface IntegrationStatus {
  api_connected: boolean;
  webhook_configured: boolean;
  tracking_active: boolean;
  booking_system: 'internal' | 'external' | 'hybrid';
  payment_integration: 'stripe' | 'external' | 'none';
  last_sync: string | null;
}

export const EnhancedProviderIntegration = ({ 
  service, 
  onActionComplete 
}: ProviderIntegrationProps) => {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadIntegrationStatus();
    loadTrackingData();
  }, [service.id]);

  const loadIntegrationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('service_integrations')
        .select('*')
        .eq('service_id', service.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading integration status:', error);
        return;
      }

      setIntegrationStatus(data || {
        api_connected: false,
        webhook_configured: false,
        tracking_active: true,
        booking_system: 'internal',
        payment_integration: 'stripe',
        last_sync: null
      });
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const loadTrackingData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_service_analytics', {
        p_service_id: service.id,
        p_time_period: '7d'
      });

      if (error) {
        console.error('Error loading tracking data:', error);
        return;
      }

      setTrackingData(data);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  };

  const handleDirectBooking = async () => {
    setIsLoading(true);
    try {
      // Track the booking initiation
      await supabase.rpc('track_service_engagement', {
        p_service_id: service.id,
        p_user_id: user?.id,
        p_engagement_type: 'booking_initiated',
        p_engagement_data: {
          source: 'enhanced_integration',
          timestamp: new Date().toISOString()
        }
      });

      // Check for provider's preferred booking method
      if (integrationStatus?.api_connected) {
        // Use API integration for seamless booking
        const { data, error } = await supabase.functions.invoke('provider-api-booking', {
          body: {
            service_id: service.id,
            vendor_id: service.vendor_id,
            user_id: user?.id,
            booking_type: 'consultation'
          }
        });

        if (error) throw error;

        toast({
          title: "Booking Initiated",
          description: "Connecting to provider's booking system...",
        });

        onActionComplete?.('booking_initiated', data);
      } else {
        // Fallback to internal booking system
        onActionComplete?.('show_booking_modal');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Error",
        description: "Unable to connect to provider. Using internal booking system.",
        variant: "destructive",
      });
      
      onActionComplete?.('show_booking_modal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPurchase = async (packageType: string) => {
    setIsLoading(true);
    try {
      // Track purchase initiation
      await supabase.rpc('track_service_engagement', {
        p_service_id: service.id,
        p_user_id: user?.id,
        p_engagement_type: 'purchase_initiated',
        p_engagement_data: {
          package_type: packageType,
          source: 'enhanced_integration'
        }
      });

      if (integrationStatus?.payment_integration === 'external' && service.website_url) {
        // Redirect to provider's site with tracking parameters
        const trackingUrl = new URL(service.website_url);
        trackingUrl.searchParams.set('ref', 'circle_platform');
        trackingUrl.searchParams.set('user_id', user?.id || '');
        trackingUrl.searchParams.set('service_id', service.id);
        trackingUrl.searchParams.set('package', packageType);

        window.open(trackingUrl.toString(), '_blank');
        
        toast({
          title: "Redirected to Provider",
          description: "You'll receive credit for any purchases made.",
        });
      } else {
        // Use internal purchase flow
        onActionComplete?.('show_purchase_modal', { packageType });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Error",
        description: "Using internal purchase system.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderConnect = async () => {
    setIsLoading(true);
    try {
      // Open provider connection flow
      const { data, error } = await supabase.functions.invoke('initiate-provider-connection', {
        body: {
          service_id: service.id,
          vendor_id: service.vendor_id,
          user_id: user?.id
        }
      });

      if (error) throw error;

      if (data?.connection_url) {
        window.open(data.connection_url, '_blank');
        toast({
          title: "Provider Connection",
          description: "Complete the connection process in the new tab.",
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to initiate provider connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderIntegrationStatus = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Integration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {integrationStatus?.api_connected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">API Connected</span>
          </div>
          <div className="flex items-center gap-2">
            {integrationStatus?.webhook_configured ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">Webhooks Active</span>
          </div>
          <div className="flex items-center gap-2">
            {integrationStatus?.tracking_active ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">Tracking Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Secure Integration</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Booking System:</span>
            <Badge variant={integrationStatus?.booking_system === 'external' ? 'default' : 'secondary'}>
              {integrationStatus?.booking_system || 'internal'}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Payment Integration:</span>
            <Badge variant={integrationStatus?.payment_integration === 'stripe' ? 'default' : 'secondary'}>
              {integrationStatus?.payment_integration || 'stripe'}
            </Badge>
          </div>
        </div>

        {!integrationStatus?.api_connected && (
          <Button 
            onClick={handleProviderConnect}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect Provider API
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleDirectBooking}
          disabled={isLoading}
          className="w-full flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Book Consultation
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => handleQuickPurchase('standard')}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Buy Now
          </Button>
          <Button 
            onClick={() => onActionComplete?.('show_demo')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            View Demo
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => onActionComplete?.('contact_provider')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Contact
          </Button>
          <Button 
            onClick={() => onActionComplete?.('request_quote')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Get Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackingData ? (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {trackingData.total_views || 0}
                </div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {trackingData.conversion_rate || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {trackingData.total_bookings || 0}
                </div>
                <div className="text-xs text-muted-foreground">Bookings</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Last 7 days engagement:</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  +{trackingData.growth_percentage || 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Revenue attributed:</span>
                <span className="font-medium">${trackingData.revenue_attributed || 0}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p>Loading analytics...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProviderInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Provider Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {service.vendor?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h3 className="font-semibold">{service.vendor?.name || 'Direct Service'}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                ⭐ {service.vendor?.rating || 0} ({service.vendor?.review_count || 0} reviews)
              </span>
              {service.vendor?.is_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {service.website_url && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a 
                href={service.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Visit Provider Website
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Response time: Usually within 2 hours</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Call
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="provider">Provider</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          {renderQuickActions()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          {renderIntegrationStatus()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalytics()}
        </TabsContent>

        <TabsContent value="provider" className="space-y-4">
          {renderProviderInfo()}
        </TabsContent>
      </Tabs>
    </div>
  );
};