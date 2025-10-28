// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, User, DollarSign, Calendar, MessageSquare, Edit3, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CoPayRequest {
  id: string;
  agent_id: string | null;
  service_id: string | null;
  requested_split_percentage: number;
  status: 'pending' | 'approved' | 'denied';
  compliance_status: string;
  agent_notes?: string | null;
  vendor_notes?: string | null;
  compliance_notes?: string | null;
  requires_documentation?: boolean;
  marketing_campaign_details?: any;
  created_at: string;
  expires_at: string;
  agent_profile?: {
    display_name?: string;
    avatar_url?: string | null;
    business_name?: string | null;
    circle_points?: number | null;
  } | null;
  service?: {
    title?: string;
    retail_price?: string;
    category?: string;
  } | null;
}

export const CoPayRequestsManager = () => {
  const [requests, setRequests] = useState<CoPayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CoPayRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingSplitPercentage, setEditingSplitPercentage] = useState<number>(0);
  const [vendorNotes, setVendorNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoPayRequests();
    
    // Set up real-time subscription for co-pay requests
    const subscription = supabase
      .channel('copay-requests-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'co_pay_requests'
      }, (payload) => {
        console.log('Co-pay request update:', payload);
        fetchCoPayRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCoPayRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          agent_profile:profiles!co_pay_requests_agent_id_fkey(
            display_name,
            avatar_url,
            business_name,
            circle_points
          ),
          service:services!co_pay_requests_service_id_fkey(
            title,
            retail_price,
            category
          )
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type cast the data to ensure status field matches our interface
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'denied'
      })) as CoPayRequest[];

      setRequests(typedData);
    } catch (error) {
      console.error('Error fetching co-pay requests:', error);
      toast({
        title: "Error",
        description: "Failed to load Circle Match requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'denied', splitPercentage?: number) => {
    try {
      setProcessingId(requestId);
      
      const updates: any = {
        status: action,
        compliance_status: action === 'approved' ? 'vendor_approved' : 'compliance_rejected',
        vendor_notes: vendorNotes || null
      };

      if (action === 'approved' && splitPercentage) {
        updates.requested_split_percentage = splitPercentage;
      }

      const { error } = await supabase
        .from('co_pay_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: action === 'approved' ? "Request Approved! ✅" : "Request Denied",
        description: action === 'approved' 
          ? `Circle Match request approved with ${splitPercentage || 'original'}% split. Now pending compliance review.`
          : "Circle Match request has been denied",
        variant: action === 'approved' ? "default" : "destructive"
      });

      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      setVendorNotes('');
      await fetchCoPayRequests();
    } catch (error) {
      console.error('Error updating co-pay request:', error);
      toast({
        title: "Error",
        description: "Failed to update Circle Match request",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRequestDetail = (request: CoPayRequest) => {
    setSelectedRequest(request);
    setEditingSplitPercentage(request.requested_split_percentage);
    setVendorNotes(request.vendor_notes || '');
    setIsDetailModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'denied': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const calculateCoPayAmount = (retailPrice: string, splitPercentage: number) => {
    const price = parseFloat(retailPrice.replace(/[^0-9.]/g, ''));
    return (price * splitPercentage / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.compliance_status === 'pending_vendor' && !isExpired(r.expires_at));
  const expiredRequests = requests.filter(r => r.compliance_status === 'pending_vendor' && isExpired(r.expires_at));
  const processedRequests = requests.filter(r => !['pending_vendor'].includes(r.compliance_status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Circle Match Requests</h2>
          <p className="text-gray-600">Manage agent Circle Match requests for your services</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {pendingRequests.length} Pending
        </Badge>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openRequestDetail(request)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.agent_profile?.avatar_url} />
                      <AvatarFallback>
                        {request.agent_profile?.display_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {request.agent_profile?.display_name || 'Unknown Agent'}
                        </h4>
                        {request.agent_profile?.business_name && (
                          <span className="text-sm text-gray-500">
                            • {request.agent_profile.business_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.service?.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {request.requested_split_percentage}% split requested
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${calculateCoPayAmount(request.service?.retail_price || '0', request.requested_split_percentage)}
                    </div>
                    <div className="text-sm text-gray-500">Circle Match amount</div>
                    <Badge className={`mt-2 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Circle Match Requests</h3>
            <p className="text-gray-600">When agents request Circle Match assistance, they'll appear here for your review.</p>
          </CardContent>
        </Card>
      )}

      {/* Request Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Circle Match Request Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Agent Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedRequest.agent_profile?.avatar_url} />
                  <AvatarFallback>
                    {selectedRequest.agent_profile?.display_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {selectedRequest.agent_profile?.display_name || 'Unknown Agent'}
                  </h3>
                  {selectedRequest.agent_profile?.business_name && (
                    <p className="text-gray-600">{selectedRequest.agent_profile.business_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {selectedRequest.agent_profile?.circle_points || 0} Circle Points
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Service</label>
                  <p className="text-gray-900">{selectedRequest.service?.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{selectedRequest.service?.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Retail Price</label>
                  <p className="text-gray-900">${selectedRequest.service?.retail_price}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Circle Match Amount</label>
                  <p className="text-green-600 font-semibold">
                    ${calculateCoPayAmount(selectedRequest.service?.retail_price || '0', editingSplitPercentage)}
                  </p>
                </div>
              </div>

              {/* Split Percentage Editor */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Split Percentage
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingSplitPercentage}
                    onChange={(e) => setEditingSplitPercentage(parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-gray-600">%</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Originally requested: {selectedRequest.requested_split_percentage}%)
                  </span>
                </div>
              </div>

              {/* Agent Notes */}
              {selectedRequest.agent_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Agent Notes</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-gray-900">{selectedRequest.agent_notes}</p>
                  </div>
                </div>
              )}

              {/* Vendor Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700">Your Notes (Optional)</label>
                <Textarea
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="Add any notes for this decision..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDetailModalOpen(false)}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRequest && handleRequestAction(selectedRequest.id, 'denied')}
              disabled={processingId !== null}
            >
              {processingId === selectedRequest?.id ? 'Processing...' : 'Deny Request'}
            </Button>
            <Button 
              onClick={() => selectedRequest && handleRequestAction(selectedRequest.id, 'approved', editingSplitPercentage)}
              disabled={processingId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId === selectedRequest?.id ? 'Processing...' : 'Approve Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};