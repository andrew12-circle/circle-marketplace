import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, AlertTriangle, Crown, CheckCircle, Clock, X, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CoPayRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    retail_price?: string;
    max_vendor_split_percentage?: number;
    respa_category?: string;
  };
}

type FlowStep = 'membership-check' | 'vendor-search' | 'vendor-found' | 'invite-vendor' | 'request-submitted';

interface Vendor {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  is_verified?: boolean;
}

export const CoPayRequestModal = ({ isOpen, onClose, service }: CoPayRequestModalProps) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>(profile?.is_pro_member ? 'vendor-search' : 'membership-check');
  const [searchQuery, setSearchQuery] = useState("");
  const [foundVendors, setFoundVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    company: "",
  });
  const [agentNotes, setAgentNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const coPayPrice = service.retail_price && service.max_vendor_split_percentage 
    ? parseFloat(service.retail_price.replace(/[^\d.]/g, '')) * (1 - (service.max_vendor_split_percentage / 100))
    : 0;

  const handleMembershipCheck = () => {
    if (profile?.is_pro_member) {
      setCurrentStep('vendor-search');
    } else {
      // Show upgrade prompt
      toast({
        title: "Circle Pro Required",
        description: "Unlock discounted pricing and vendor-backed co-marketing with Circle Pro.",
        action: (
          <Button size="sm" onClick={() => window.location.href = '/pricing'}>
            Join Now
          </Button>
        )
      });
    }
  };

  const handleVendorSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Search for vendors in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, business_name, vendor_company_name')
        .or(`display_name.ilike.%${searchQuery}%,business_name.ilike.%${searchQuery}%,vendor_company_name.ilike.%${searchQuery}%`)
        .eq('vendor_enabled', true)
        .limit(5);

      if (error) throw error;

      const vendors: Vendor[] = data?.map(profile => ({
        id: profile.user_id,
        name: profile.display_name || 'Unknown',
        company: profile.business_name || profile.vendor_company_name,
      })) || [];

      setFoundVendors(vendors);
      if (vendors.length === 0) {
        setCurrentStep('invite-vendor');
      }
    } catch (error) {
      console.error('Error searching vendors:', error);
      toast({
        title: "Search Error",
        description: "Unable to search vendors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setCurrentStep('vendor-found');
  };

  const handleRequestCoPay = async () => {
    if (!selectedVendor || !service.max_vendor_split_percentage) return;
    
    setIsLoading(true);
    try {
      const { error: requestError } = await supabase
        .from('co_pay_requests')
        .insert({
          agent_id: profile?.user_id,
          vendor_id: selectedVendor.id,
          service_id: service.id,
          requested_split_percentage: service.max_vendor_split_percentage,
          agent_notes: agentNotes,
          ip_address: '0.0.0.0', // This would be populated by an edge function in production
        });

      if (requestError) throw requestError;

      // Log the audit trail
      const { error: auditError } = await supabase
        .from('co_pay_audit_log')
        .insert({
          action_type: 'requested',
          performed_by: profile?.user_id,
          action_details: {
            service_id: service.id,
            vendor_id: selectedVendor.id,
            requested_percentage: service.max_vendor_split_percentage,
          }
        });

      if (auditError) console.error('Audit log error:', auditError);

      setCurrentStep('request-submitted');
      toast({
        title: "Co-Pay Request Sent",
        description: "Your vendor will receive a notification to approve the co-pay arrangement.",
      });
    } catch (error) {
      console.error('Error submitting co-pay request:', error);
      toast({
        title: "Request Failed",
        description: "Unable to submit co-pay request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteVendor = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in vendor name and email.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_invitations')
        .insert({
          invited_by: profile?.user_id,
          vendor_name: inviteForm.name,
          vendor_email: inviteForm.email,
          vendor_company: inviteForm.company,
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: "We'll notify you when your vendor joins the network.",
      });
      
      setCurrentStep('request-submitted');
    } catch (error) {
      console.error('Error inviting vendor:', error);
      toast({
        title: "Invitation Failed",
        description: "Unable to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(profile?.is_pro_member ? 'vendor-search' : 'membership-check');
    setSearchQuery("");
    setFoundVendors([]);
    setSelectedVendor(null);
    setInviteForm({ name: "", email: "", company: "" });
    setAgentNotes("");
    onClose();
  };

  const renderMembershipCheck = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Crown className="w-16 h-16 text-circle-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Circle Pro Membership Required</h3>
        <p className="text-muted-foreground mb-4">
          Co-pay pricing is only available for Circle Pro members. Unlock vendor-backed co-marketing opportunities.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Co-Pay Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span>Your Co-Pay:</span>
            <span className="text-lg font-bold text-green-600">
              ${coPayPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Vendor Support:</span>
            <span>{service.max_vendor_split_percentage}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleMembershipCheck} className="flex-1">
          {profile?.is_pro_member ? 'Continue' : 'Join Circle Pro'}
        </Button>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderVendorSearch = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Find Your Vendor</h3>
        <p className="text-muted-foreground">
          Search for your loan officer, title company, or other professional partner.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleVendorSearch()}
          />
        </div>
        <Button onClick={handleVendorSearch} disabled={isLoading}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {foundVendors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Found Vendors:</h4>
          {foundVendors.map((vendor) => (
            <Card key={vendor.id} className="cursor-pointer hover:bg-accent" onClick={() => handleVendorSelect(vendor)}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{vendor.name}</div>
                    {vendor.company && <div className="text-sm text-muted-foreground">{vendor.company}</div>}
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="border-t pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('invite-vendor')} className="w-full">
          Can't find your vendor? Invite them
        </Button>
      </div>
    </div>
  );

  const renderVendorFound = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Request Co-Pay Approval</h3>
        <p className="text-muted-foreground">
          Send a co-pay request to your selected vendor for approval.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selected Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-medium">{selectedVendor?.name}</div>
          {selectedVendor?.company && <div className="text-sm text-muted-foreground">{selectedVendor.company}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Co-Pay Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Service:</span>
            <span>{service.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Your Co-Pay:</span>
            <span className="font-bold text-green-600">${coPayPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Vendor Support:</span>
            <span>{service.max_vendor_split_percentage}%</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information for your vendor..."
          value={agentNotes}
          onChange={(e) => setAgentNotes(e.target.value)}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-amber-800 mb-1">Important Compliance Notice</div>
            <p className="text-amber-700">
              Co-pay pricing is only available for RESPA-eligible services. Vendor participation is optional, 
              not guaranteed, and subject to review. Co-marketing must be reasonably related to promotional 
              services actually performed by the agent.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleRequestCoPay} disabled={isLoading} className="flex-1">
          Request Co-Pay Approval
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep('vendor-search')}>
          Back
        </Button>
      </div>
    </div>
  );

  const renderInviteVendor = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Invite Your Vendor</h3>
        <p className="text-muted-foreground">
          Your vendor isn't part of Circle Network yet. Send them an invitation to join.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="vendor-name">Vendor Name *</Label>
          <Input
            id="vendor-name"
            value={inviteForm.name}
            onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter vendor's full name"
          />
        </div>
        
        <div>
          <Label htmlFor="vendor-email">Email Address *</Label>
          <Input
            id="vendor-email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="vendor@company.com"
          />
        </div>
        
        <div>
          <Label htmlFor="vendor-company">Company Name</Label>
          <Input
            id="vendor-company"
            value={inviteForm.company}
            onChange={(e) => setInviteForm(prev => ({ ...prev, company: e.target.value }))}
            placeholder="Company or organization name"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-blue-800 mb-1">Vendor Invite Notice</div>
            <p className="text-blue-700">
              Vendor onboarding typically takes 2 weeks. Co-pay pricing is not guaranteed until 
              vendor approval is confirmed. No guarantees can be made about participation or eligibility.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleInviteVendor} disabled={isLoading} className="flex-1">
          Send Invitation
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep('vendor-search')}>
          Back to Search
        </Button>
      </div>
    </div>
  );

  const renderRequestSubmitted = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold mb-2">Request Submitted</h3>
        <p className="text-muted-foreground">
          Your co-pay request has been sent. You'll receive a notification when your vendor responds.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant="secondary">Pending Approval</Badge>
            </div>
            <div className="flex justify-between">
              <span>Next Steps:</span>
              <span className="text-right">Check Agent Wallet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">
          <strong>Need help now?</strong> Use Circle Home Loans as your co-pay partner — 
          instant approval available on most services.
        </p>
      </div>

      <Button onClick={handleClose} className="w-full">
        Done
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'membership-check':
        return renderMembershipCheck();
      case 'vendor-search':
        return renderVendorSearch();
      case 'vendor-found':
        return renderVendorFound();
      case 'invite-vendor':
        return renderInviteVendor();
      case 'request-submitted':
        return renderRequestSubmitted();
      default:
        return renderMembershipCheck();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Co-Pay Request</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};