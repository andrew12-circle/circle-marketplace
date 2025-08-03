import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PenTool, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface CoPayRequest {
  id: string;
  agent_signature_date: string | null;
  vendor_signature_date: string | null;
  comarketing_agreement_url: string | null;
  agreement_template_version: string | null;
  compliance_status: string;
  requested_split_percentage: number;
  agent_id: string;
  vendor_id: string;
  agent?: {
    display_name: string;
    email: string;
  };
  vendor?: {
    display_name: string;
    business_name: string;
    email: string;
  };
  service?: {
    title: string;
  };
}

interface SignatureWorkflowProps {
  coPayRequestId: string;
}

export const SignatureWorkflow: React.FC<SignatureWorkflowProps> = ({ 
  coPayRequestId 
}) => {
  const [request, setRequest] = useState<CoPayRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreementContent, setAgreementContent] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const loadRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          agent:profiles!agent_id(display_name, email),
          vendor:profiles!vendor_id(display_name, email, business_name),
          service:services(title)
        `)
        .eq('id', coPayRequestId)
        .single();

      if (error) throw error;
      setRequest(data);

      // Decode agreement content if available
      if (data.comarketing_agreement_url?.startsWith('data:text/plain;base64,')) {
        const base64Content = data.comarketing_agreement_url.split(',')[1];
        const decodedContent = atob(base64Content);
        setAgreementContent(decodedContent);
      }
    } catch (error) {
      console.error('Error loading co-pay request:', error);
      toast({
        title: "Error",
        description: "Failed to load co-pay request details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignAgreement = async () => {
    if (!user || !request) return;

    setSigning(true);
    try {
      // Determine signer type
      const signerType = user.id === request.agent_id ? 'agent' : 'vendor';
      const signatureField = signerType === 'agent' ? 'agent_signature_date' : 'vendor_signature_date';

      // Create signature record
      const { error: signatureError } = await supabase
        .from('agreement_signatures')
        .insert({
          co_pay_request_id: coPayRequestId,
          signer_id: user.id,
          signer_type: signerType,
          signature_data: `${signerType}_signature_${Date.now()}`,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent
        });

      if (signatureError) throw signatureError;

      // Update co-pay request with signature date
      const { error: updateError } = await supabase
        .from('co_pay_requests')
        .update({
          [signatureField]: new Date().toISOString()
        })
        .eq('id', coPayRequestId);

      if (updateError) throw updateError;

      toast({
        title: "Agreement Signed",
        description: `You have successfully signed the co-marketing agreement.`,
      });

      // Reload request to show updated status
      await loadRequest();

    } catch (error) {
      console.error('Error signing agreement:', error);
      toast({
        title: "Error",
        description: "Failed to sign agreement",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [coPayRequestId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Co-pay request not found</p>
        </CardContent>
      </Card>
    );
  }

  const userIsAgent = user?.id === request.agent_id;
  const userIsVendor = user?.id === request.vendor_id;
  const userCanSign = userIsAgent || userIsVendor;
  const userSignature = userIsAgent ? request.agent_signature_date : request.vendor_signature_date;
  const otherSignature = userIsAgent ? request.vendor_signature_date : request.agent_signature_date;
  const bothSigned = request.agent_signature_date && request.vendor_signature_date;

  const getStatusBadge = () => {
    if (bothSigned) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Both Signed</Badge>;
    }
    if (request.compliance_status === 'pending_signatures') {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending Signatures</Badge>;
    }
    return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Awaiting Approval</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Co-Marketing Agreement Signature
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Agent</h4>
              <p className="font-medium">{request.agent?.display_name}</p>
              <p className="text-sm text-muted-foreground">{request.agent?.email}</p>
              {request.agent_signature_date ? (
                <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Signed {new Date(request.agent_signature_date).toLocaleDateString()}
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Vendor</h4>
              <p className="font-medium">{request.vendor?.business_name || request.vendor?.display_name}</p>
              <p className="text-sm text-muted-foreground">{request.vendor?.email}</p>
              {request.vendor_signature_date ? (
                <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Signed {new Date(request.vendor_signature_date).toLocaleDateString()}
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Service Details</h4>
            <p className="text-sm"><span className="font-medium">Service:</span> {request.service?.title}</p>
            <p className="text-sm"><span className="font-medium">Split Percentage:</span> {request.requested_split_percentage}%</p>
            <p className="text-sm"><span className="font-medium">Agreement Version:</span> {request.agreement_template_version}</p>
          </div>

          {agreementContent && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Agreement Content</h4>
                <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{agreementContent}</pre>
                </div>
              </div>
            </>
          )}

          {userCanSign && !userSignature && request.compliance_status === 'pending_signatures' && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to Sign</p>
                  <p className="text-sm text-muted-foreground">
                    By clicking "Sign Agreement", you agree to the terms outlined above.
                  </p>
                </div>
                <Button 
                  onClick={handleSignAgreement}
                  disabled={signing}
                  className="flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  {signing ? 'Signing...' : 'Sign Agreement'}
                </Button>
              </div>
            </>
          )}

          {userSignature && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-medium">✓ You have signed this agreement</p>
              <p className="text-green-600 text-sm">
                Signed on {new Date(userSignature).toLocaleDateString()} at {new Date(userSignature).toLocaleTimeString()}
              </p>
              {!otherSignature && (
                <p className="text-sm text-muted-foreground mt-1">
                  Waiting for the other party to sign...
                </p>
              )}
            </div>
          )}

          {bothSigned && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-medium">✓ Agreement Fully Executed</p>
              <p className="text-green-600 text-sm">
                Both parties have signed this co-marketing agreement. The co-pay request will now proceed to final approval.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};