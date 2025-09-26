import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MatchRequest {
  service_category: string;
  budget?: number;
  urgency?: 'low' | 'medium' | 'high';
  location?: string;
  specific_requirements?: Record<string, any>;
}

interface MatchResult {
  vendor_id: string;
  vendor_name: string;
  match_score: number;
  match_reasons: string[];
  estimated_response_time: string;
}

interface RequestStatus {
  id: string;
  status: string;
  service_category: string;
  budget?: number;
  urgency: string;
  location?: string;
  created_at: string;
  candidates: MatchResult[];
}

export const useMatchEngine = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<RequestStatus | null>(null);
  const { toast } = useToast();

  const createMatchRequest = useCallback(async (requestData: MatchRequest) => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'create_request',
          data: {
            ...requestData,
            agent_id: user.id
          }
        }
      });

      if (error) throw error;

      // Get detailed status
      if (data.request_id) {
        const statusData = await getRequestStatus(data.request_id);
        setCurrentRequest(statusData);
      }

      toast({
        title: "Match Request Created! ⚡",
        description: `Found ${data.matches} potential matches`,
      });

      return data;

    } catch (error) {
      console.error('Error creating match request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to create match request. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getRequestStatus = useCallback(async (requestId: string): Promise<RequestStatus> => {
    const { data, error } = await supabase.functions.invoke('match-engine', {
      body: {
        action: 'get_request_status',
        data: { request_id: requestId }
      }
    });

    if (error) throw error;

    return {
      id: data.request.id,
      status: data.request.status,
      service_category: data.request.service_category,
      budget: data.request.budget,
      urgency: data.request.urgency,
      location: data.request.location,
      created_at: data.request.created_at,
      candidates: data.candidates.map((candidate: any) => ({
        vendor_id: candidate.vendor_id,
        vendor_name: candidate.vendors?.name || 'Unknown Vendor',
        match_score: candidate.match_score,
        match_reasons: candidate.match_reasons || [],
        estimated_response_time: candidate.vendors?.response_time_avg || '24 hours'
      }))
    };
  }, []);

  const findMatches = useCallback(async (requestId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'find_matches',
          data: { request_id: requestId }
        }
      });

      if (error) throw error;

      toast({
        title: "Matches Updated! 🎯",
        description: `Found ${data.matches.length} matching vendors`,
      });

      // Update current request status
      const statusData = await getRequestStatus(requestId);
      setCurrentRequest(statusData);

      return data.matches;

    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Search Failed",
        description: "Failed to find matches. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast, getRequestStatus]);

  const routeToVendor = useCallback(async (matchCandidateId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'route_to_vendor',
          data: { match_candidate_id: matchCandidateId }
        }
      });

      if (error) throw error;

      toast({
        title: "Routed to Vendor! 📤",
        description: "Your request has been sent to the vendor",
      });

      return data;

    } catch (error) {
      console.error('Error routing to vendor:', error);
      toast({
        title: "Routing Failed",
        description: "Failed to route to vendor. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const submitVendorDecision = useCallback(async (
    routingId: string,
    vendorId: string,
    decision: 'accept' | 'decline',
    responseMessage?: string,
    estimatedDelivery?: string
  ) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'vendor_decision',
          data: {
            routing_id: routingId,
            vendor_id: vendorId,
            decision,
            response_message: responseMessage,
            estimated_delivery: estimatedDelivery
          }
        }
      });

      if (error) throw error;

      toast({
        title: decision === 'accept' ? "Request Accepted! ✅" : "Request Declined",
        description: decision === 'accept' 
          ? "You've accepted this match request"
          : "Request declined and routed to next match",
      });

      return data;

    } catch (error) {
      console.error('Error submitting vendor decision:', error);
      toast({
        title: "Decision Failed",
        description: "Failed to submit decision. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Real-time subscription for match updates
  const subscribeToMatches = useCallback((userId: string, onUpdate: (payload: any) => void) => {
    const subscription = supabase
      .channel(`match_updates_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_candidate',
          filter: `vendor_id=eq.${userId}`
        },
        (payload) => {
          console.log('Match update received:', payload);
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'request',
          filter: `agent_id=eq.${userId}`
        },
        (payload) => {
          console.log('Request update received:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isLoading,
    currentRequest,
    createMatchRequest,
    getRequestStatus,
    findMatches,
    routeToVendor,
    submitVendorDecision,
    subscribeToMatches,
    setCurrentRequest
  };
};