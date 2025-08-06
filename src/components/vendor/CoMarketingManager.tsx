import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Clock, 
  User, 
  DollarSign, 
  Calendar,
  Check,
  X,
  Edit,
  AlertCircle,
  TrendingUp,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CoPayRequest {
  id: string;
  agent_id: string;
  service_id: string;
  requested_split_percentage: number;
  status: string;
  compliance_status: string;
  agent_notes?: string;
  vendor_notes?: string;
  payment_duration_months?: number;
  payment_start_date?: string;
  payment_end_date?: string;
  created_at: string;
  expires_at: string;
  // Joined data
  agent_name?: string;
  agent_email?: string;
  service_title?: string;
  service_category?: string;
}

interface ActiveVenture {
  id: string;
  agent_id: string;
  service_id: string;
  payment_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
  total_amount_covered: number;
  auto_renewal: boolean;
  // Joined data
  agent_name?: string;
  service_title?: string;
  co_pay_request_id: string;
}

export const CoMarketingManager = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<CoPayRequest[]>([]);
  const [activeVentures, setActiveVentures] = useState<ActiveVenture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CoPayRequest | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    percentage: 0,
    duration_months: 12,
    vendor_notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchCoMarketingData();
    }
  }, [user]);

  const fetchCoMarketingData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Fetch pending co-pay requests
      const { data: requests, error: requestsError } = await supabase
        .from('co_pay_requests')
        .select('*')
        .eq('vendor_id', user.id)
        .in('compliance_status', ['pending_vendor', 'vendor_approved'])
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching pending requests:', requestsError);
        // Don't throw - continue with empty array
        setPendingRequests([]);
      } else {
        // Get unique agent and service IDs to batch queries
        const agentIds = [...new Set(requests?.map(req => req.agent_id) || [])];
        const serviceIds = [...new Set(requests?.map(req => req.service_id) || [])];

        // Batch fetch profiles and services
        const [profilesResult, servicesResult] = await Promise.all([
          agentIds.length > 0 
            ? supabase.from('profiles').select('user_id, display_name').in('user_id', agentIds)
            : Promise.resolve({ data: [], error: null }),
          serviceIds.length > 0
            ? supabase.from('services').select('id, title, category').in('id', serviceIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        // Create lookup maps
        const profilesMap = new Map<string, any>();
        const servicesMap = new Map<string, any>();
        
        profilesResult.data?.forEach(p => profilesMap.set(p.user_id, p));
        servicesResult.data?.forEach(s => servicesMap.set(s.id, s));

        // Format requests with joined data
        const formattedRequests: CoPayRequest[] = (requests || []).map(req => ({
          ...req,
          agent_name: profilesMap.get(req.agent_id)?.display_name || 'Unknown Agent',
          agent_email: profilesMap.get(req.agent_id)?.display_name || 'Unknown Email',
          service_title: servicesMap.get(req.service_id)?.title || 'Unknown Service',
          service_category: servicesMap.get(req.service_id)?.category
        }));

        setPendingRequests(formattedRequests);
      }

      // Fetch active co-marketing ventures
      const { data: approvedRequests, error: approvedError } = await supabase
        .from('co_pay_requests')
        .select('*')
        .eq('vendor_id', user.id)
        .eq('compliance_status', 'final_approved')
        .order('created_at', { ascending: false });

      if (approvedError) {
        console.error('Error fetching approved requests:', approvedError);
        setActiveVentures([]);
      } else {
        // Get unique agent and service IDs for approved requests
        const approvedAgentIds = [...new Set(approvedRequests?.map(req => req.agent_id) || [])];
        const approvedServiceIds = [...new Set(approvedRequests?.map(req => req.service_id) || [])];

        // Batch fetch profiles and services for approved requests
        const [approvedProfilesResult, approvedServicesResult] = await Promise.all([
          approvedAgentIds.length > 0
            ? supabase.from('profiles').select('user_id, display_name').in('user_id', approvedAgentIds)
            : Promise.resolve({ data: [], error: null }),
          approvedServiceIds.length > 0
            ? supabase.from('services').select('id, title').in('id', approvedServiceIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        // Create lookup maps for approved requests
        const approvedProfilesMap = new Map<string, any>();
        const approvedServicesMap = new Map<string, any>();
        
        approvedProfilesResult.data?.forEach(p => approvedProfilesMap.set(p.user_id, p));
        approvedServicesResult.data?.forEach(s => approvedServicesMap.set(s.id, s));

        // Format active ventures
        const formattedVentures: ActiveVenture[] = (approvedRequests || []).map(req => {
          const endDate = (() => {
            const end = new Date();
            end.setMonth(end.getMonth() + 12);
            return end.toISOString().split('T')[0];
          })();

          return {
            id: req.id,
            agent_id: req.agent_id,
            service_id: req.service_id,
            payment_percentage: req.requested_split_percentage,
            start_date: req.created_at.split('T')[0],
            end_date: endDate,
            status: 'active',
            total_amount_covered: 0,
            auto_renewal: false,
            co_pay_request_id: req.id,
            agent_name: approvedProfilesMap.get(req.agent_id)?.display_name || 'Unknown Agent',
            service_title: approvedServicesMap.get(req.service_id)?.title || 'Unknown Service'
          };
        });

        setActiveVentures(formattedVentures);
      }

    } catch (error) {
      console.error('Error fetching co-marketing data:', error);
      toast.error('Failed to load co-marketing data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, percentage?: number, durationMonths?: number, notes?: string) => {
    try {
      const updateData: any = {
        compliance_status: 'vendor_approved',
        vendor_notes: notes
      };

      if (percentage !== undefined) {
        updateData.requested_split_percentage = percentage;
      }
      if (durationMonths !== undefined) {
        updateData.payment_duration_months = durationMonths;
        updateData.payment_start_date = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);
        updateData.payment_end_date = endDate.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('co_pay_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Co-marketing request approved');
      fetchCoMarketingData();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleDenyRequest = async (requestId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('co_pay_requests')
        .update({
          compliance_status: 'compliance_rejected',
          vendor_notes: notes
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Co-marketing request denied');
      fetchCoMarketingData();
    } catch (error) {
      console.error('Error denying request:', error);
      toast.error('Failed to deny request');
    }
  };

  const openEditDialog = (request: CoPayRequest) => {
    setSelectedRequest(request);
    setEditData({
      percentage: request.requested_split_percentage,
      duration_months: request.payment_duration_months || 12,
      vendor_notes: request.vendor_notes || ""
    });
    setEditDialogOpen(true);
  };

  const calculateTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "1 day left";
    if (diffDays < 30) return `${diffDays} days left`;
    
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    return `${months}mo ${remainingDays}d left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading co-marketing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Co-Marketing Manager
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage agent partnership requests and active ventures
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl rounded-2xl p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            Pending Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            Active Ventures ({activeVentures.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Pending Requests</h3>
                <p className="text-slate-600 dark:text-slate-400 text-center">
                  You don't have any pending co-marketing requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="relative overflow-hidden border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5"></div>
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg text-slate-800 dark:text-white">
                          {request.service_title}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {request.agent_name}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {request.requested_split_percentage}% split
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {request.payment_duration_months || 12} months
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={request.compliance_status === 'pending_vendor' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {request.compliance_status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    {request.agent_notes && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Agent Notes:</Label>
                        <p className="text-sm text-slate-800 dark:text-white mt-1">{request.agent_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleApproveRequest(request.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Quick Approve
                      </Button>
                      
                      <Dialog open={editDialogOpen && selectedRequest?.id === request.id} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            onClick={() => openEditDialog(request)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit & Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Co-Marketing Terms</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="percentage">Split Percentage</Label>
                              <Input
                                id="percentage"
                                type="number"
                                min="1"
                                max="100"
                                value={editData.percentage}
                                onChange={(e) => setEditData(prev => ({ ...prev, percentage: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="duration">Duration (months)</Label>
                              <Input
                                id="duration"
                                type="number"
                                min="1"
                                max="60"
                                value={editData.duration_months}
                                onChange={(e) => setEditData(prev => ({ ...prev, duration_months: parseInt(e.target.value) || 12 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes">Vendor Notes</Label>
                              <Textarea
                                id="notes"
                                value={editData.vendor_notes}
                                onChange={(e) => setEditData(prev => ({ ...prev, vendor_notes: e.target.value }))}
                                placeholder="Add any notes or conditions..."
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleApproveRequest(
                                  request.id, 
                                  editData.percentage, 
                                  editData.duration_months, 
                                  editData.vendor_notes
                                )}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                              >
                                Approve with Changes
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleDenyRequest(request.id, "Request denied by vendor")}
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Deny
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeVentures.length === 0 ? (
            <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Active Ventures</h3>
                <p className="text-slate-600 dark:text-slate-400 text-center">
                  You don't have any active co-marketing ventures at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeVentures.map((venture) => (
                <Card key={venture.id} className="relative overflow-hidden border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5"></div>
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg text-slate-800 dark:text-white">
                          {venture.service_title}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {venture.agent_name}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {venture.payment_percentage}% split
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {calculateTimeRemaining(venture.end_date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                        {venture.auto_renewal && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Auto-renew
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Start Date</Label>
                        <p className="text-slate-800 dark:text-white">{new Date(venture.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">End Date</Label>
                        <p className="text-slate-800 dark:text-white">{new Date(venture.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Covered</Label>
                        <p className="text-slate-800 dark:text-white">${venture.total_amount_covered.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</Label>
                        <p className="text-slate-800 dark:text-white capitalize">{venture.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};