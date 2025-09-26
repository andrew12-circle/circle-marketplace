import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LenderRequest {
  id: string;
  agent_id: string;
  sku_id: string;
  requested_vendor_share: number;
  status: string;
  created_at: string;
  lender_request_snapshot?: Array<{
    agent_stats_json: any;
    goals_json: any;
    geo_json: any;
  }>;
  lender_match_candidate?: Array<{
    vendor_org_id: string;
    eligibility: string;
    rank_score: number;
  }>;
}

export function LenderRequestDashboard() {
  const [requests, setRequests] = useState<LenderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('lender_request')
        .select(`
          *,
          lender_request_snapshot(*),
          lender_match_candidate(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load lender requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, icon: Clock },
      searching: { variant: "default" as const, icon: Clock },
      awaiting_vendor: { variant: "secondary" as const, icon: Clock },
      approved: { variant: "default" as const, icon: CheckCircle },
      declined: { variant: "destructive" as const, icon: XCircle },
      expired: { variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const triggerMatchEngine = async (requestId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('lender-match-engine', {
        body: { request_id: requestId }
      });

      if (error) throw error;

      toast({
        title: "Match Engine Triggered",
        description: "Processing vendor matches for this request."
      });

      // Refresh requests after a delay
      setTimeout(fetchRequests, 2000);
    } catch (error) {
      console.error('Error triggering match engine:', error);
      toast({
        title: "Error",
        description: "Failed to trigger match engine.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading lender requests...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lender Request Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No lender requests found. Create one using the form above.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Lender Request Dashboard</h2>
      
      <div className="grid gap-4">
        {requests.map((request) => {
          const snapshot = request.lender_request_snapshot?.[0];
          const agentStats = snapshot?.agent_stats_json || {};
          const geo = snapshot?.geo_json || {};
          const matches = request.lender_match_candidate || [];
          const eligibleMatches = matches.filter(m => m.eligibility === 'eligible');
          
          return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Agent {request.agent_id.slice(0, 8)}...</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">SKU</div>
                    <div className="font-medium">{request.sku_id.slice(0, 12)}...</div>
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

                {geo.location && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {geo.location}</span>
                  </div>
                )}

                {matches.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Vendor Matches</div>
                    <div className="flex gap-2 text-sm">
                      <Badge variant="default">{eligibleMatches.length} Eligible</Badge>
                      <Badge variant="secondary">{matches.length - eligibleMatches.length} Ineligible</Badge>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {request.status === 'searching' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => triggerMatchEngine(request.id)}
                      disabled={loading}
                    >
                      Run Match Engine
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Request Details",
                        description: `Request ID: ${request.id}`
                      });
                    }}
                  >
                    View Details
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