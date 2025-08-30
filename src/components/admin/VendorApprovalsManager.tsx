import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, ExternalLink } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  contact_email: string;
  phone?: string;
  website_url?: string;
  location?: string;
  description?: string;
  approval_status: string;
  auto_score: number;
  verification_notes?: string;
  automated_checks: any;
  created_at: string;
  is_active: boolean;
  is_verified: boolean;
}

export const VendorApprovalsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data as any || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVendor = async (vendorId: string) => {
    setProcessing(prev => new Set(prev).add(vendorId));
    
    try {
      const { error } = await (supabase
        .from('vendors')
        .update as any)({
          approval_status: 'approved',
          is_active: true,
          is_verified: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          verification_notes: 'Manually approved by admin'
        })
        .eq('id' as any, vendorId as any);

      if (error) throw error;

      toast({
        title: "Vendor Approved",
        description: "Vendor has been approved and is now active"
      });

      fetchVendors();
    } catch (error) {
      console.error('Error approving vendor:', error);
      toast({
        title: "Error",
        description: "Failed to approve vendor",
        variant: "destructive"
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  const handleRejectVendor = async (vendorId: string) => {
    setProcessing(prev => new Set(prev).add(vendorId));
    
    try {
      const { error } = await (supabase
        .from('vendors')
        .update as any)({
          approval_status: 'rejected',
          is_active: false,
          is_verified: false,
          verification_notes: 'Rejected by admin'
        })
        .eq('id' as any, vendorId as any);

      if (error) throw error;

      toast({
        title: "Vendor Rejected",
        description: "Vendor has been rejected"
      });

      fetchVendors();
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to reject vendor",
        variant: "destructive"
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  const runAutomatedScreening = async (vendorId: string) => {
    setProcessing(prev => new Set(prev).add(vendorId));
    
    try {
      const { error } = await supabase.functions.invoke('process-vendor-onboarding', {
        body: { vendorId }
      });

      if (error) throw error;

      toast({
        title: "Screening Complete",
        description: "Automated screening has been run for this vendor"
      });

      fetchVendors();
    } catch (error) {
      console.error('Error running screening:', error);
      toast({
        title: "Error",
        description: "Failed to run automated screening",
        variant: "destructive"
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'auto_approved':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Auto-Approved</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'needs_review':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><AlertCircle className="w-3 h-3 mr-1" />Needs Review</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const renderVendorCard = (vendor: Vendor) => (
    <Card key={vendor.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{vendor.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{vendor.contact_email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(vendor.approval_status)}
            {vendor.auto_score > 0 && (
              <span className={`text-sm font-medium ${getScoreColor(vendor.auto_score)}`}>
                Score: {vendor.auto_score}/100
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Phone:</strong> {vendor.phone || 'Not provided'}
            </div>
            <div>
              <strong>Location:</strong> {vendor.location || 'Not provided'}
            </div>
            <div>
              <strong>Website:</strong> {vendor.website_url ? (
                <a href={vendor.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  {vendor.website_url}
                </a>
              ) : 'Not provided'}
            </div>
            <div>
              <strong>Registered:</strong> {new Date(vendor.created_at).toLocaleDateString()}
            </div>
          </div>

          {vendor.description && (
            <div>
              <strong>Description:</strong>
              <p className="text-sm text-muted-foreground mt-1">{vendor.description}</p>
            </div>
          )}

          {vendor.verification_notes && (
            <div>
              <strong>Notes:</strong>
              <p className="text-sm text-muted-foreground mt-1">{vendor.verification_notes}</p>
            </div>
          )}

          {vendor.automated_checks && (
            <div>
              <strong>Automated Checks:</strong>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                {Object.entries(vendor.automated_checks.completeness || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1">
                    {value ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {vendor.approval_status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => runAutomatedScreening(vendor.id)}
                disabled={processing.has(vendor.id)}
              >
                Run Screening
              </Button>
            )}
            
            {(['pending', 'needs_review'].includes(vendor.approval_status)) && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApproveVendor(vendor.id)}
                  disabled={processing.has(vendor.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectVendor(vendor.id)}
                  disabled={processing.has(vendor.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const pendingVendors = vendors.filter(v => v.approval_status === 'pending');
  const needsReviewVendors = vendors.filter(v => v.approval_status === 'needs_review');
  const approvedVendors = vendors.filter(v => ['approved', 'auto_approved'].includes(v.approval_status));
  const rejectedVendors = vendors.filter(v => v.approval_status === 'rejected');

  if (loading) {
    return <div className="p-8 text-center">Loading vendor approvals...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Vendor Approvals</h2>
        <p className="text-muted-foreground">Review and approve new vendor applications</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({pendingVendors.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            Needs Review ({needsReviewVendors.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedVendors.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedVendors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending vendors
            </div>
          ) : (
            pendingVendors.map(renderVendorCard)
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          {needsReviewVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vendors need review
            </div>
          ) : (
            needsReviewVendors.map(renderVendorCard)
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved vendors
            </div>
          ) : (
            approvedVendors.map(renderVendorCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rejected vendors
            </div>
          ) : (
            rejectedVendors.map(renderVendorCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};