import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sbInvoke } from '@/utils/sb';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionData {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  plan_interval: string | null;
  pro_price_id: string | null;
  current_period_end: string | null;
  subscription_created_at: string | null;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // Check if user is subscribed and active
  const isProActive = subscription?.subscription_status === 'active' || 
                     subscription?.subscription_status === 'trialing';

  // Get subscription details
  const subscriptionTier = subscription?.subscription_tier || 'Free';
  const planInterval = subscription?.plan_interval || 'month';
  const currentPeriodEnd = subscription?.current_period_end 
    ? new Date(subscription.current_period_end) 
    : null;

  // Format renewal date
  const renewalDate = currentPeriodEnd 
    ? currentPeriodEnd.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching subscription:', error);
        setSubscription(null);
      } else {
        setSubscription(data || null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh subscription status from Stripe
  const refreshSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await sbInvoke('check-subscription');
      await fetchSubscription();
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    }
  };

  // Open customer portal
  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      setPortalLoading(true);
      const { data, error } = await sbInvoke('customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/profile-settings`
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  // Load subscription on mount and user change
  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Set up real-time subscription for changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    subscription,
    loading,
    portalLoading,
    isProActive,
    subscriptionTier,
    planInterval,
    renewalDate,
    refreshSubscription,
    openCustomerPortal,
  };
}