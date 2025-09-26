import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, X, Clock, AlertCircle } from 'lucide-react';

interface VendorMatch {
  id: string;
  request: {
    id: string;
    service_category: string;
    budget?: number;
    urgency: string;
    location?: string;
    specific_requirements?: any;
    agent_id: string;
  };
  match_score: number;
  match_reasons: string[];
  status: string;
  created_at: string;
  routing?: {
    id: string;
    status: string;
    routed_at: string;
  };
}

export const VendorMatchDashboard = () => {
  const [matches, setMatches] = useState<VendorMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<{[key: string]: {message?: string, delivery?: string}}>({});
  const { toast } = useToast();

  useEffect(() => {
    loadVendorMatches();
  }, []);

  const loadVendorMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get vendor matches for current user
      const { data: matchData, error } = await supabase
        .from('match_candidate')
        .select(`
          *,
          request(*),
          match_routing(*)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMatches(matchData || []);
    } catch (error) {
      console.error('Error loading vendor matches:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load matches. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVendorDecision = async (
    matchId: string, 
    routingId: string, 
    decision: 'accept' | 'decline'
  ) => {
    setProcessingId(matchId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = responseData[matchId] || { message: '', delivery: '' };

      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'vendor_decision',
          data: {
            routing_id: routingId,
            vendor_id: user.id,
            decision,
            response_message: response.message,
            estimated_delivery: response.delivery
          }
        }
      });

      if (error) throw error;

      toast({
        title: decision === 'accept' ? "Request Accepted! ✅" : "Request Declined",
        description: decision === 'accept' 
          ? "You've accepted this match request. The agent has been notified."
          : "Request declined. The system will try the next best match.",
      });

      // Reload matches to show updated status
      await loadVendorMatches();

    } catch (error) {
      console.error('Error processing vendor decision:', error);
      toast({
        title: "Decision Failed",
        description: "Failed to process your decision. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const updateResponseData = (matchId: string, field: 'message' | 'delivery', value: string) => {
    setResponseData(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'routed': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'accepted': return <Check className="h-4 w-4 text-green-500" />;
      case 'declined': return <X className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Match Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and respond to agent requests matched to your services
          </p>
        </CardHeader>
      </Card>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
            <p className="text-muted-foreground">
              When agents request services that match your criteria, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(match.routing?.status || match.status)}
                      Service Request - {match.request.service_category}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getUrgencyColor(match.request.urgency)}>
                        {match.request.urgency} priority
                      </Badge>
                      <Badge variant="outline">
                        {match.match_score}% match
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(match.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Request Details</h4>
                    <div className="space-y-1 text-sm">
                      {match.request.budget && (
                        <p><span className="font-medium">Budget:</span> ${match.request.budget}/month</p>
                      )}
                      {match.request.location && (
                        <p><span className="font-medium">Location:</span> {match.request.location}</p>
                      )}
                      {match.request.specific_requirements?.description && (
                        <p><span className="font-medium">Requirements:</span> {match.request.specific_requirements.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Why You're a Match</h4>
                    <div className="space-y-1">
                      {match.match_reasons.map((reason, index) => (
                        <div key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {match.routing?.status === 'routed' && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Respond to Request</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`message-${match.id}`}>Response Message</Label>
                        <Textarea
                          id={`message-${match.id}`}
                          placeholder="Tell the agent how you can help them..."
                          value={responseData[match.id]?.message || ''}
                          onChange={(e) => updateResponseData(match.id, 'message', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`delivery-${match.id}`}>Estimated Delivery Time</Label>
                        <Input
                          id={`delivery-${match.id}`}
                          placeholder="e.g., 2-3 business days, 1 week, etc."
                          value={responseData[match.id]?.delivery || ''}
                          onChange={(e) => updateResponseData(match.id, 'delivery', e.target.value)}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleVendorDecision(match.id, match.routing!.id, 'accept')}
                          disabled={processingId === match.id}
                          className="flex-1"
                        >
                          {processingId === match.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Accept Request
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleVendorDecision(match.id, match.routing!.id, 'decline')}
                          disabled={processingId === match.id}
                          className="flex-1"
                        >
                          {processingId === match.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {match.routing?.status === 'accepted' && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Request Accepted</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've accepted this request. The agent has been notified and will contact you soon.
                    </p>
                  </div>
                )}

                {match.routing?.status === 'declined' && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Request Declined</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      You declined this request. The system has routed it to the next best match.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};