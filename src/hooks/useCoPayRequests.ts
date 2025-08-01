import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CoPayRequest {
  id: string;
  service_id: string;
  vendor_id: string;
  agent_id: string;
  status: string;
  requested_split_percentage: number;
  expires_at: string;
  agent_notes?: string;
  vendor_notes?: string;
  created_at: string;
  updated_at: string;
  services?: Service | null;
  vendors?: Vendor | null;
}

interface Service {
  id: string;
  title: string;
  image_url?: string;
  pro_price?: string;
  retail_price?: string;
  max_vendor_split_percentage?: number;
}

interface Vendor {
  id: string;
  name: string;
  logo_url?: string;
}

export const useCoPayRequests = () => {
  const [requests, setRequests] = useState<CoPayRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadRequests();
      subscribeToUpdates();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          vendors (
            id,
            name,
            logo_url
          )
        `)
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading co-pay requests:', error);
        throw error;
      }
      
      setRequests((data as unknown as CoPayRequest[]) || []);
    } catch (error) {
      console.error('Error loading co-pay requests:', error);
      toast({
        title: "Error",
        description: "Failed to load co-pay requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel('co-pay-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'co_pay_requests',
          filter: `agent_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Co-pay request update:', payload);
          loadRequests(); // Reload data when changes occur
          
          // Show toast for status changes
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as CoPayRequest;
            if (newData.status === 'approved') {
              toast({
                title: "Co-pay Approved! 🎉",
                description: "Your co-pay request has been approved. You can now proceed to checkout.",
              });
            } else if (newData.status === 'declined') {
              toast({
                title: "Co-pay Declined",
                description: "Your co-pay request was declined. You can try with another vendor.",
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createCoPayRequest = async (
    serviceId: string,
    vendorId: string,
    requestedSplitPercentage: number,
    agentNotes?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14 days from now

      const { data, error } = await supabase
        .from('co_pay_requests')
        .insert({
          service_id: serviceId,
          vendor_id: vendorId,
          agent_id: user.id,
          requested_split_percentage: requestedSplitPercentage,
          agent_notes: agentNotes,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Co-pay Request Sent! 📤",
        description: "Your request has been sent to the vendor. You'll be notified when they respond.",
      });

      // Send notification to vendor (if notification system exists)
      await notifyVendor(data.id, vendorId);

      loadRequests(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating co-pay request:', error);
      toast({
        title: "Error",
        description: "Failed to send co-pay request",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('co_pay_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Removed",
        description: "Co-pay request has been removed from your cart",
      });

      loadRequests();
    } catch (error) {
      console.error('Error removing co-pay request:', error);
      toast({
        title: "Error",
        description: "Failed to remove request",
        variant: "destructive",
      });
    }
  };

  const notifyVendor = async (requestId: string, vendorId: string) => {
    try {
      // Call the notification edge function
      const { error } = await supabase.functions.invoke('send-consultation-notification', {
        body: {
          type: 'co_pay_request',
          request_id: requestId,
          vendor_id: vendorId
        }
      });

      if (error) {
        console.error('Error sending vendor notification:', error);
      }
    } catch (error) {
      console.error('Error notifying vendor:', error);
    }
  };

  const getApprovedRequests = () => {
    return requests.filter(req => req.status === 'approved');
  };

  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending');
  };

  return {
    requests,
    isLoading,
    createCoPayRequest,
    removeRequest,
    loadRequests,
    getApprovedRequests,
    getPendingRequests
  };
};