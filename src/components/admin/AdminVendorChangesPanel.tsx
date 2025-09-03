import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  X, 
  Eye, 
  FileText, 
  User, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_id: string;
  entity_type: string;
  vendor_id: string;
  vendor_name: string;
  priority: string;
  read: boolean;
  created_at: string;
}

interface DraftItem {
  id: string;
  service_id?: string;
  vendor_id: string;
  draft_data: any;
  funnel_data?: any;
  change_type: string;
  change_summary: string;
  status: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

export const AdminVendorChangesPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [serviceDrafts, setServiceDrafts] = useState<DraftItem[]>([]);
  const [vendorDrafts, setVendorDrafts] = useState<DraftItem[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotifications(),
        loadServiceDrafts(),
        loadVendorDrafts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor changes data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setNotifications(data || []);
  };

  const loadServiceDrafts = async () => {
    const { data, error } = await supabase
      .from('service_drafts')
      .select(`
        *,
        services!inner(title, category)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setServiceDrafts(data || []);
  };

  const loadVendorDrafts = async () => {
    const { data, error } = await supabase
      .from('vendor_drafts')
      .select(`
        *,
        vendors!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setVendorDrafts(data || []);
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleReviewDraft = async () => {
    if (!selectedDraft) return;

    try {
      setLoading(true);

      const draftTable = 'service_id' in selectedDraft ? 'service_drafts' : 'vendor_drafts';
      
      const { data, error } = await supabase.rpc('admin_review_draft', {
        draft_table: draftTable,
        draft_id: selectedDraft.id,
        action: reviewAction,
        rejection_reason: reviewAction === 'reject' ? rejectionReason : null
      });

      if (error) throw error;

      toast({
        title: reviewAction === 'approve' ? "Changes Approved" : "Changes Rejected",
        description: `The ${draftTable === 'service_drafts' ? 'service' : 'vendor'} changes have been ${reviewAction}d.`,
      });

      setReviewModalOpen(false);
      setSelectedDraft(null);
      setRejectionReason('');
      await loadData();

    } catch (error) {
      console.error('Error reviewing draft:', error);
      toast({
        title: "Error",
        description: "Failed to review changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (draft: DraftItem, action: 'approve' | 'reject') => {
    setSelectedDraft(draft);
    setReviewAction(action);
    setReviewModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'yellow', icon: Clock, text: 'Pending' },
      approved: { color: 'green', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: X, text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`bg-${config.color}-50 border-${config.color}-200 text-${config.color}-700`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-blue-50 border-blue-200 text-blue-700',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      high: 'bg-red-50 border-red-200 text-red-700'
    };

    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const pendingServiceDrafts = serviceDrafts.filter(d => d.status === 'pending');
  const pendingVendorDrafts = vendorDrafts.filter(d => d.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Changes</h2>
          <p className="text-muted-foreground">Review and approve vendor-submitted changes</p>
        </div>
        <Button onClick={loadData} disabled={loading} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">Unread notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Service Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingServiceDrafts.length}</div>
            <p className="text-xs text-muted-foreground">Pending service updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVendorDrafts.length}</div>
            <p className="text-xs text-muted-foreground">Pending profile updates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="service-changes">
            Service Changes ({pendingServiceDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="profile-changes">
            Profile Changes ({pendingVendorDrafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className={notification.read ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        {getPriorityBadge(notification.priority)}
                        {!notification.read && (
                          <Badge variant="destructive" className="bg-red-100 text-red-700">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="service-changes" className="space-y-4">
          {serviceDrafts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No service changes</p>
              </CardContent>
            </Card>
          ) : (
            serviceDrafts.map((draft) => (
              <Card key={draft.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {(draft as any).services?.title || 'Service Update'}
                        </h4>
                        {getStatusBadge(draft.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {draft.change_summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(draft.created_at)}
                      </p>
                      {draft.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {draft.rejection_reason}
                        </div>
                      )}
                    </div>
                    {draft.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewModal(draft, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewModal(draft, 'reject')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="profile-changes" className="space-y-4">
          {vendorDrafts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No profile changes</p>
              </CardContent>
            </Card>
          ) : (
            vendorDrafts.map((draft) => (
              <Card key={draft.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {(draft as any).vendors?.name || 'Profile Update'}
                        </h4>
                        {getStatusBadge(draft.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {draft.change_summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(draft.created_at)}
                      </p>
                      {draft.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {draft.rejection_reason}
                        </div>
                      )}
                    </div>
                    {draft.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewModal(draft, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewModal(draft, 'reject')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Changes' : 'Reject Changes'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {reviewAction === 'approve' ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <p>This will apply the changes to the live data immediately.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <p>Please provide a reason for rejection.</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why these changes are being rejected..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewDraft}
              disabled={loading || (reviewAction === 'reject' && !rejectionReason.trim())}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {loading ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};