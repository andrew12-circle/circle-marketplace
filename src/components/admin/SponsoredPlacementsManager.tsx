import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFeatureFlags, setFeatureFlags } from '@/utils/featureSafety';
import { Star, TrendingUp, Eye, MousePointer, Percent } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SponsoredService {
  id: string;
  title: string;
  vendor_name: string;
  is_sponsored: boolean;
  sponsored_rank_boost: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export const SponsoredPlacementsManager = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<SponsoredService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [flags, setFlagsState] = useState(getFeatureFlags());

  useEffect(() => {
    if (profile?.is_admin) {
      loadServices();
      loadStats();
    }
  }, [profile?.is_admin]);

  const loadServices = async () => {
    try {
      console.log('Loading services for sponsored placements...');
      
      // First, let's get a count of total services to debug
      const { count: totalCount, error: countError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      console.log('Total active services:', totalCount);

      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          is_sponsored,
          sponsored_rank_boost,
          is_active,
          vendors!inner(
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('title');

      if (error) {
        console.error('Services query error:', error);
        throw error;
      }

      console.log('Raw services data:', data);

      if (!data || data.length === 0) {
        console.log('No services found. Checking if any services exist at all...');
        
        // Check if there are any services at all (without vendor join)
        const { data: allServices, error: allError } = await supabase
          .from('services')
          .select('id, title, is_active')
          .limit(5);
          
        console.log('All services (first 5):', allServices);
        
        toast({
          title: 'No Services Found',
          description: 'No active services were found in the database.',
          variant: 'destructive'
        });
        setServices([]);
        return;
      }

      const servicesWithStats = await Promise.all(
        data.map(async (service: any) => {
          const stats = await getServiceStats(service.id);
          return {
            id: service.id,
            title: service.title,
            vendor_name: service.vendors?.name || 'Unknown Vendor',
            is_sponsored: service.is_sponsored || false,
            sponsored_rank_boost: service.sponsored_rank_boost || 0,
            ...stats
          };
        })
      );

      console.log('Services with stats:', servicesWithStats);
      setServices(servicesWithStats);
      
      toast({
        title: 'Services Loaded',
        description: `Found ${servicesWithStats.length} services`,
      });
      
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: `Failed to load services: ${error.message}`,
        variant: 'destructive'
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceStats = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_tracking_events')
        .select('event_type')
        .eq('service_id', serviceId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const impressions = data?.filter(e => e.event_type === 'sponsored_impression').length || 0;
      const clicks = data?.filter(e => e.event_type === 'sponsored_click').length || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return { impressions, clicks, ctr };
    } catch (error) {
      console.error('Error loading stats for service:', serviceId, error);
      return { impressions: 0, clicks: 0, ctr: 0 };
    }
  };

  const loadStats = async () => {
    // Load overall sponsored placement stats
    try {
      const { data, error } = await supabase
        .from('service_tracking_events')
        .select('event_type, created_at')
        .in('event_type', ['sponsored_impression', 'sponsored_click'])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!error && data) {
        const impressions = data.filter(e => e.event_type === 'sponsored_impression').length;
        const clicks = data.filter(e => e.event_type === 'sponsored_click').length;
        console.log('Sponsored stats (7 days):', { impressions, clicks, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0 });
      }
    } catch (error) {
      console.error('Error loading overall stats:', error);
    }
  };

  const handleFlagToggle = (flagName: keyof typeof flags) => {
    const newFlags = { ...flags, [flagName]: !flags[flagName] };
    setFlagsState(newFlags);
    setFeatureFlags(newFlags);
    
    toast({
      title: `Feature ${!flags[flagName] ? 'Enabled' : 'Disabled'}`,
      description: `${flagName} is now ${!flags[flagName] ? 'active' : 'inactive'}`,
    });
  };

  const handleSponsoredToggle = async (serviceId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_sponsored: !currentValue })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.map(s => 
        s.id === serviceId 
          ? { ...s, is_sponsored: !currentValue }
          : s
      ));

      toast({
        title: 'Updated Successfully',
        description: `Service ${!currentValue ? 'marked as sponsored' : 'removed from sponsored'}`,
      });
    } catch (error) {
      console.error('Error updating sponsored status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sponsored status',
        variant: 'destructive'
      });
    }
  };

  const handleRankBoostChange = async (serviceId: string, boost: number) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ sponsored_rank_boost: boost })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.map(s => 
        s.id === serviceId 
          ? { ...s, sponsored_rank_boost: boost }
          : s
      ));

      toast({
        title: 'Updated Successfully',
        description: 'Rank boost updated',
      });
    } catch (error) {
      console.error('Error updating rank boost:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rank boost',
        variant: 'destructive'
      });
    }
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!profile?.is_admin) {
    return <div className="text-center py-8">Admin access required</div>;
  }

  return (
    <div className="space-y-6">
      {/* Feature Flags Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Sponsored Placements Control
          </CardTitle>
          <CardDescription>
            Master controls for sponsored placement features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Master Switch</label>
                <p className="text-xs text-muted-foreground">Enable all sponsored features</p>
              </div>
              <Switch
                checked={flags.sponsoredPlacements}
                onCheckedChange={() => handleFlagToggle('sponsoredPlacements')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Sponsored Badges</label>
                <p className="text-xs text-muted-foreground">Show sponsored labels</p>
              </div>
              <Switch
                checked={flags.sponsoredBadges}
                onCheckedChange={() => handleFlagToggle('sponsoredBadges')}
                disabled={!flags.sponsoredPlacements}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Top Deals Slots</label>
                <p className="text-xs text-muted-foreground">Sponsored slots in Top Deals</p>
              </div>
              <Switch
                checked={flags.sponsoredTopDeals}
                onCheckedChange={() => handleFlagToggle('sponsoredTopDeals')}
                disabled={!flags.sponsoredPlacements}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Grid Injection</label>
                <p className="text-xs text-muted-foreground">Sponsored items in search grid</p>
              </div>
              <Switch
                checked={flags.sponsoredGrid}
                onCheckedChange={() => handleFlagToggle('sponsoredGrid')}
                disabled={!flags.sponsoredPlacements}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Management */}
      <Card>
        <CardHeader>
          <CardTitle>Service Management</CardTitle>
          <CardDescription>
            Configure which services are sponsored and their placement priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={loadServices} variant="outline" size="sm">
                Refresh Services
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading services...</div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {services.length === 0 
                    ? "No services found. Make sure services exist in the database and are marked as active."
                    : "No services match your search criteria."
                  }
                </p>
                {services.length === 0 && (
                  <Button onClick={loadServices} variant="outline" className="mt-4">
                    Try Loading Again
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{service.title}</h4>
                      <p className="text-sm text-muted-foreground">{service.vendor_name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {service.impressions}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MousePointer className="w-3 h-3" />
                          {service.clicks}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Percent className="w-3 h-3" />
                          {service.ctr.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Rank Boost:</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={service.sponsored_rank_boost}
                          onChange={(e) => handleRankBoostChange(service.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                          disabled={!service.is_sponsored}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Sponsored:</label>
                        <Switch
                          checked={service.is_sponsored}
                          onCheckedChange={() => handleSponsoredToggle(service.id, service.is_sponsored)}
                        />
                      </div>
                      
                      {service.is_sponsored && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Sponsored
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
