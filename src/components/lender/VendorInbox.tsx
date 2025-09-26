import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VendorRequest {
  id: string;
  agent_id: string;
  sku_id: string;
  requested_vendor_share: number;
  status: string;
  created_at: string;
  lender_request_snapshot: Array<{
    agent_stats_json: any;
    goals_json: any;
    geo_json: any;
  }>;
  lender_match_routing: Array<{
    distance_km: number;
    routing_reason: string;
  }>;
}

export function VendorInbox() {
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('vendor-requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lender_request' },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      // For demo purposes, fetch all awaiting_vendor requests
      // In production, filter by vendor_org_id from user's vendor association
      const { data, error } = await supabase
        .from('lender_request')
        .select(`
          *,
          lender_request_snapshot(*),
          lender_match_routing(*)
        `)
        .eq('status', 'awaiting_vendor')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();
    
    if (remaining <= 0) return "Expired";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getUrgencyVariant = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = now.getTime() - created.getTime();
    const hours = elapsed / (1000 * 60 * 60);
    
    if (hours > 20) return "destructive";
    if (hours > 12) return "secondary";
    return "default";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading vendor inbox...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending requests at this time.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Vendor Inbox</h2>
      
      <div className="grid gap-4">
        {requests.map((request) => {
          const snapshot = request.lender_request_snapshot[0];
          const routing = request.lender_match_routing[0];
          const agentStats = snapshot?.agent_stats_json || {};
          const geo = snapshot?.geo_json || {};
          
          return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Agent {request.agent_id}</span>
                  </div>
                  <Badge variant={getUrgencyVariant(request.created_at)}>
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeRemaining(request.created_at)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">SKU</div>
                    <div className="font-medium">{request.sku_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Requested Share</div>
                    <div className="font-medium">{request.requested_vendor_share}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Buyers (12mo)</div>
                    <div className="font-medium">{agentStats.buyers_12mo || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Units</div>
                    <div className="font-medium">{agentStats.total_units || 'N/A'}</div>
                  </div>
                </div>

                {routing && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Distance: {routing.distance_km?.toFixed(1)} km</span>
                    <span>•</span>
                    <span>Routing: {routing.routing_reason}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      // Navigate to request detail
                      window.location.href = `/lender/requests/${request.id}`;
                    }}
                  >
                    Review Request
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Quick Decline",
                        description: "Request declined successfully."
                      });
                    }}
                  >
                    Quick Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}