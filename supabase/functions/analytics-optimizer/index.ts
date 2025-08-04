import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false },
      }
    );

    const { action, vendor_id } = await req.json();

    console.log(`Analytics optimizer called with action: ${action}`);

    let result;

    switch (action) {
      case 'refresh_vendor_analytics':
        result = await refreshVendorAnalytics(supabaseClient, vendor_id);
        break;

      case 'get_optimized_analytics':
        result = await getOptimizedAnalytics(supabaseClient, vendor_id);
        break;

      case 'cleanup_old_data':
        result = await cleanupOldAnalyticsData(supabaseClient);
        break;

      case 'aggregate_monthly_stats':
        result = await aggregateMonthlyStats(supabaseClient);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics optimizer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function refreshVendorAnalytics(supabase: any, vendorId?: string) {
  console.log('Refreshing vendor analytics materialized view');
  
  try {
    // Refresh the materialized view
    const { error } = await supabase.rpc('refresh_vendor_analytics');
    
    if (error) {
      throw error;
    }

    // If specific vendor requested, return their updated analytics
    if (vendorId) {
      const { data: analytics, error: analyticsError } = await supabase
        .from('vendor_service_analytics')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (analyticsError) {
        console.warn('Could not fetch specific vendor analytics:', analyticsError);
      }

      return {
        success: true,
        message: 'Analytics refreshed successfully',
        vendor_analytics: analytics
      };
    }

    return {
      success: true,
      message: 'Vendor analytics materialized view refreshed successfully'
    };

  } catch (error) {
    console.error('Error refreshing vendor analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getOptimizedAnalytics(supabase: any, vendorId: string) {
  console.log(`Getting optimized analytics for vendor: ${vendorId}`);
  
  try {
    // Get from materialized view first (fastest)
    const { data: quickStats, error: quickError } = await supabase
      .from('vendor_service_analytics')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();

    if (quickError && quickError.code !== 'PGRST116') {
      throw quickError;
    }

    // Get detailed service analytics using optimized queries
    const { data: serviceDetails, error: serviceError } = await supabase
      .from('services')
      .select(`
        id,
        title,
        category,
        service_views!service_views_service_id_fkey(count),
        consultation_bookings!consultation_bookings_service_id_fkey(count)
      `)
      .eq('vendor_id', vendorId)
      .limit(20); // Limit for performance

    if (serviceError) {
      console.warn('Could not fetch detailed service analytics:', serviceError);
    }

    // Get recent activity (last 30 days) with indexed query
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentActivity, error: activityError } = await supabase
      .from('vendor_agent_activities')
      .select('activity_type, created_at')
      .eq('vendor_id', vendorId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (activityError) {
      console.warn('Could not fetch recent activity:', activityError);
    }

    return {
      success: true,
      data: {
        overview: quickStats,
        services: serviceDetails || [],
        recent_activity: recentActivity || [],
        last_updated: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error getting optimized analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function cleanupOldAnalyticsData(supabase: any) {
  console.log('Cleaning up old analytics data');
  
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Clean up old service views (keep last 6 months)
    const { error: viewsError } = await supabase
      .from('service_views')
      .delete()
      .lt('viewed_at', sixMonthsAgo.toISOString());

    if (viewsError) {
      console.warn('Error cleaning up service views:', viewsError);
    }

    // Clean up old vendor activities (keep last 6 months)
    const { error: activitiesError } = await supabase
      .from('vendor_agent_activities')
      .delete()
      .lt('created_at', sixMonthsAgo.toISOString());

    if (activitiesError) {
      console.warn('Error cleaning up vendor activities:', activitiesError);
    }

    // Clean up old engagement events (keep last 6 months)
    const { error: engagementError } = await supabase
      .from('content_engagement_events')
      .delete()
      .lt('created_at', sixMonthsAgo.toISOString());

    if (engagementError) {
      console.warn('Error cleaning up engagement events:', engagementError);
    }

    return {
      success: true,
      message: 'Analytics data cleanup completed'
    };

  } catch (error) {
    console.error('Error during analytics cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function aggregateMonthlyStats(supabase: any) {
  console.log('Aggregating monthly statistics');
  
  try {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    
    // Aggregate vendor performance for current month
    const { data: monthlyVendorStats, error: vendorStatsError } = await supabase
      .rpc('get_monthly_vendor_performance', { target_month: currentMonth });

    if (vendorStatsError) {
      console.warn('Error aggregating vendor stats:', vendorStatsError);
    }

    // Aggregate content performance for current month
    const { data: monthlyContentStats, error: contentStatsError } = await supabase
      .rpc('get_monthly_content_performance', { target_month: currentMonth });

    if (contentStatsError) {
      console.warn('Error aggregating content stats:', contentStatsError);
    }

    return {
      success: true,
      message: 'Monthly statistics aggregation completed',
      data: {
        vendor_stats: monthlyVendorStats,
        content_stats: monthlyContentStats
      }
    };

  } catch (error) {
    console.error('Error aggregating monthly stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
