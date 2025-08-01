import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, UserPlus } from 'lucide-react';

export const VendorInvitationPanel = () => {
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorCompany: '',
    customMessage: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setInviteData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendInvitation = async () => {
    if (!inviteData.vendorName || !inviteData.vendorEmail) {
      toast({
        title: "Error",
        description: "Vendor name and email are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('invite-vendor', {
        body: {
          vendor_name: inviteData.vendorName,
          vendor_email: inviteData.vendorEmail,
          vendor_company: inviteData.vendorCompany,
          custom_message: inviteData.customMessage
        }
      });

      if (error) {
        console.error('Invitation error:', error);
        toast({
          title: "Error",
          description: "Failed to send invitation. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Invitation Sent!",
          description: `Vendor invitation sent to ${inviteData.vendorEmail}`,
        });
        
        // Reset form
        setInviteData({
          vendorName: '',
          vendorEmail: '',
          vendorCompany: '',
          customMessage: ''
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite New Vendor
        </CardTitle>
        <CardDescription>
          Send an invitation to a vendor to join the platform and manage their services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name *</Label>
            <Input
              id="vendorName"
              placeholder="Enter vendor's full name"
              value={inviteData.vendorName}
              onChange={(e) => handleInputChange('vendorName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vendorEmail">Email Address *</Label>
            <Input
              id="vendorEmail"
              type="email"
              placeholder="vendor@company.com"
              value={inviteData.vendorEmail}
              onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendorCompany">Company Name</Label>
          <Input
            id="vendorCompany"
            placeholder="Enter company name (optional)"
            value={inviteData.vendorCompany}
            onChange={(e) => handleInputChange('vendorCompany', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customMessage">Custom Message</Label>
          <Textarea
            id="customMessage"
            placeholder="Add a personal message to the invitation (optional)"
            value={inviteData.customMessage}
            onChange={(e) => handleInputChange('customMessage', e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSendInvitation} 
          disabled={loading || !inviteData.vendorName || !inviteData.vendorEmail}
          className="w-full"
        >
          {loading ? (
            <>
              <Mail className="w-4 h-4 mr-2 animate-spin" />
              Sending Invitation...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Vendor Invitation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};