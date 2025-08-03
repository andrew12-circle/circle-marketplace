import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  Shield,
  Users,
  Calendar,
  FileUp
} from 'lucide-react';
import { ComplianceDocumentUpload } from './ComplianceDocumentUpload';
import { ComplianceWorkflowLog } from './ComplianceWorkflowLog';

interface CoPayRequest {
  id: string;
  agent_id: string;
  vendor_id: string;
  service_id: string;
  requested_split_percentage: number;
  compliance_status: string;
  compliance_notes: string;
  marketing_campaign_details: any;
  created_at: string;
  expires_at: string;
  requires_documentation: boolean;
  agent_profile?: { display_name: string; business_name: string } | null;
  vendor_profile?: { display_name: string; business_name: string } | null;
  service?: { name: string; category: string } | null;
}

export const ComplianceDashboard = () => {
  const [requests, setRequests] = useState<CoPayRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CoPayRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
    subscribeToUpdates();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          agent_profile:profiles!agent_id(display_name, business_name),
          vendor_profile:profiles!vendor_id(display_name, business_name),
          service:services!service_id(name, category)
        `)
        .in('compliance_status', ['vendor_approved', 'pending_compliance', 'compliance_approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any[])?.map(item => ({
        ...item,
        agent_profile: item.agent_profile?.error ? null : item.agent_profile,
        vendor_profile: item.vendor_profile?.error ? null : item.vendor_profile,
        service: item.service?.error ? null : item.service
      })) || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('compliance-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'co_pay_requests' },
        () => loadRequests()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    try {
      const newStatus = reviewAction === 'approve' ? 'compliance_approved' : 'compliance_rejected';
      
      const { error } = await supabase
        .from('co_pay_requests')
        .update({
          compliance_status: newStatus,
          compliance_notes: reviewNotes,
          compliance_reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          compliance_reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: `Request ${reviewAction === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Co-pay request has been ${reviewAction}d by compliance team.`,
      });

      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      loadRequests();
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      vendor_approved: { variant: 'outline', icon: Clock, text: 'Vendor Approved', color: 'text-blue-600' },
      pending_compliance: { variant: 'outline', icon: AlertTriangle, text: 'Pending Review', color: 'text-orange-600' },
      compliance_approved: { variant: 'default', icon: CheckCircle, text: 'Compliance Approved', color: 'text-green-600' },
      compliance_rejected: { variant: 'destructive', icon: XCircle, text: 'Compliance Rejected', color: 'text-red-600' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const pendingReviews = requests.filter(r => r.compliance_status === 'pending_compliance');
  const approvedRequests = requests.filter(r => r.compliance_status === 'compliance_approved');
  const rejectedRequests = requests.filter(r => r.compliance_status === 'compliance_rejected');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-gray-600">Review and approve co-pay requests for RESPA compliance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{rejectedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Pending Review ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Compliance Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Split %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReviews.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs">
                        {request.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {request.agent_profile?.display_name || request.agent_profile?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {request.vendor_profile?.display_name || request.vendor_profile?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{request.service?.name || 'Unknown'}</TableCell>
                      <TableCell>{request.requested_split_percentage}%</TableCell>
                      <TableCell>{getStatusBadge(request.compliance_status)}</TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Split %</TableHead>
                    <TableHead>Approved Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs">
                        {request.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {request.agent_profile?.display_name || request.agent_profile?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {request.vendor_profile?.display_name || request.vendor_profile?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{request.service?.name || 'Unknown'}</TableCell>
                      <TableCell>{request.requested_split_percentage}%</TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Split %</TableHead>
                    <TableHead>Rejected Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs">
                        {request.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {request.agent_profile?.display_name || request.agent_profile?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {request.vendor_profile?.display_name || request.vendor_profile?.business_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{request.service?.name || 'Unknown'}</TableCell>
                      <TableCell>{request.requested_split_percentage}%</TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.compliance_notes || 'No reason provided'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compliance Review</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Request Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Agent:</strong> {selectedRequest.agent_profile?.display_name || 'Unknown'}</p>
                    <p><strong>Vendor:</strong> {selectedRequest.vendor_profile?.display_name || 'Unknown'}</p>
                    <p><strong>Service:</strong> {selectedRequest.service?.name || 'Unknown'}</p>
                    <p><strong>Split Percentage:</strong> {selectedRequest.requested_split_percentage}%</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedRequest.compliance_status)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Campaign Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Documentation Required:</strong> {selectedRequest.requires_documentation ? 'Yes' : 'No'}</p>
                    <p><strong>Created:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                    <p><strong>Expires:</strong> {new Date(selectedRequest.expires_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Document Management */}
              <div>
                <h3 className="font-semibold mb-2">Compliance Documents</h3>
                <ComplianceDocumentUpload requestId={selectedRequest.id} />
              </div>

              {/* Workflow Log */}
              <div>
                <h3 className="font-semibold mb-2">Workflow History</h3>
                <ComplianceWorkflowLog requestId={selectedRequest.id} />
              </div>

              {/* Review Actions */}
              {selectedRequest.compliance_status === 'pending_compliance' && (
                <div className="space-y-4 border-t pt-4">
                  <Label>Compliance Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter your compliance review notes..."
                    rows={3}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setReviewAction('approve');
                        handleReview();
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setReviewAction('reject');
                        handleReview();
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};