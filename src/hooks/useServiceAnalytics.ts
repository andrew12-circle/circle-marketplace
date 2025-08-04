import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceAnalytics {
  service_id: string;
  total_views: number;
  total_bookings: number;
  conversion_rate: number;
  views_this_month: number;
  bookings_this_month: number;
}

export interface VendorAnalytics {
  total_services: number;
  total_views: number;
  total_bookings: number;
  conversion_rate: number;
  monthly_revenue: number;
  services: ServiceAnalytics[];
}

export const useServiceAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trackServiceView = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('service_views')
        .insert({
          service_id: serviceId,
          user_id: user?.id || null,
          ip_address: null, // Could be enhanced with actual IP tracking
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null
        });

      if (error) {
        console.error('Error tracking service view:', error);
      }
    } catch (err) {
      console.error('Error tracking service view:', err);
    }
  };

  const fetchVendorAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // First, try to get data from optimized materialized view
      const { data: cachedAnalytics, error: cacheError } = await supabase
        .from('vendor_service_analytics')
        .select('*')
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (!cacheError && cachedAnalytics) {
        // Use cached analytics if available
        setAnalytics({
          total_services: cachedAnalytics.total_services || 0,
          total_views: cachedAnalytics.total_views || 0,
          total_bookings: cachedAnalytics.total_bookings || 0,
          conversion_rate: cachedAnalytics.conversion_rate || 0,
          monthly_revenue: cachedAnalytics.total_bookings * 150, // Mock calculation
          services: [] // Detailed service analytics would need separate query
        });
        setLoading(false);
        return;
      }

      // Fallback to detailed analytics calculation
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('vendor_id', user.id);

      if (servicesError) throw servicesError;

      if (!services || services.length === 0) {
        setAnalytics({
          total_services: 0,
          total_views: 0,
          total_bookings: 0,
          conversion_rate: 0,
          monthly_revenue: 0,
          services: []
        });
        setLoading(false);
        return;
      }

      const serviceIds = services.map(s => s.id);
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Get total views for all services
      const { data: allViews, error: viewsError } = await supabase
        .from('service_views')
        .select('service_id, viewed_at')
        .in('service_id', serviceIds);

      if (viewsError) throw viewsError;

      // Get total bookings for all services
      const { data: allBookings, error: bookingsError } = await supabase
        .from('consultation_bookings')
        .select('service_id, created_at')
        .in('service_id', serviceIds);

      if (bookingsError) throw bookingsError;

      // Calculate analytics per service
      const serviceAnalytics: ServiceAnalytics[] = services.map(service => {
        const serviceViews = allViews?.filter(v => v.service_id === service.id) || [];
        const serviceBookings = allBookings?.filter(b => b.service_id === service.id) || [];
        
        const viewsThisMonth = serviceViews.filter(v => 
          new Date(v.viewed_at) >= startOfMonth
        ).length;
        
        const bookingsThisMonth = serviceBookings.filter(b => 
          new Date(b.created_at) >= startOfMonth
        ).length;

        const totalViews = serviceViews.length;
        const totalBookings = serviceBookings.length;
        const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

        return {
          service_id: service.id,
          total_views: totalViews,
          total_bookings: totalBookings,
          conversion_rate: conversionRate,
          views_this_month: viewsThisMonth,
          bookings_this_month: bookingsThisMonth
        };
      });

      // Calculate overall analytics
      const totalViews = serviceAnalytics.reduce((sum, s) => sum + s.total_views, 0);
      const totalBookings = serviceAnalytics.reduce((sum, s) => sum + s.total_bookings, 0);
      const overallConversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

      // Mock monthly revenue for now - this could be enhanced with actual payment tracking
      const monthlyRevenue = totalBookings * 150; // Assuming average booking value

      setAnalytics({
        total_services: services.length,
        total_views: totalViews,
        total_bookings: totalBookings,
        conversion_rate: overallConversionRate,
        monthly_revenue: monthlyRevenue,
        services: serviceAnalytics
      });

    } catch (err) {
      console.error('Error fetching vendor analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorAnalytics();
  }, [user?.id]);

  return {
    analytics,
    loading,
    error,
    trackServiceView,
    refreshAnalytics: fetchVendorAnalytics
  };
};