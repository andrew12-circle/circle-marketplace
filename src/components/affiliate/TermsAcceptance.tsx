import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download
} from "lucide-react";

interface TermsAcceptanceProps {
  onAccepted: (accepted: boolean) => void;
  required?: boolean;
}

export const TermsAcceptance = ({ onAccepted, required = true }: TermsAcceptanceProps) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const { toast } = useToast();

  const currentTermsVersion = "2024.1";

  const termsPreview = `
CIRCLE AFFILIATE PROGRAM TERMS OF SERVICE

Last Updated: January 2024
Version: ${currentTermsVersion}

1. AFFILIATE PROGRAM OVERVIEW
Welcome to the Circle Affiliate Program. By participating, you agree to promote Circle's real estate tools and services in exchange for commissions.

2. COMMISSION STRUCTURE
- Circle Pro Subscriptions: 30% recurring commission
- Marketplace Tools: 15% one-time commission  
- Consultation Bookings: $50 per booking

3. PAYMENT TERMS
- Payments processed monthly on the 15th
- 30-day validation period for new conversions
- Minimum payout threshold: $100

4. COMPLIANCE REQUIREMENTS
- No spam or unsolicited promotion
- Must disclose affiliate relationship
- Follow FTC guidelines for endorsements
- Maintain professional conduct

5. FRAUD PREVENTION
- Self-referrals are prohibited
- Cookie stuffing is not allowed
- Any fraudulent activity results in immediate termination

6. TERMINATION
Either party may terminate participation with 30 days notice.
  `;

  const handleAcceptTerms = async () => {
    if (!accepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms to continue",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user's affiliate profile
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!affiliate) {
        throw new Error("Affiliate profile not found");
      }

      // Record terms acceptance via edge function
      const { error } = await supabase.functions.invoke('affiliate-fraud-detection/terms-acceptance', {
        body: {
          affiliate_id: affiliate.id,
          terms_version: currentTermsVersion,
          ip_address: await fetch('https://ipapi.co/ip').then(r => r.text()).catch(() => null),
          user_agent: navigator.userAgent,
          acceptance_method: 'web_form'
        }
      });

      if (error) throw error;

      toast({
        title: "Terms Accepted",
        description: "Your agreement has been recorded and approval process initiated.",
      });

      onAccepted(true);

    } catch (error: any) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record terms acceptance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTerms = () => {
    const element = document.createElement('a');
    const file = new Blob([termsPreview], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Circle_Affiliate_Terms_${currentTermsVersion}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Affiliate Program Terms of Service
          <Badge variant="outline">Version {currentTermsVersion}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Terms Preview */}
        <div className="border rounded-lg">
          <div className="p-4 max-h-64 overflow-y-auto bg-muted/50 text-sm whitespace-pre-line">
            {showFullTerms ? termsPreview : termsPreview.substring(0, 800) + "..."}
          </div>
          <div className="p-3 border-t bg-background flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFullTerms(!showFullTerms)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showFullTerms ? 'Show Less' : 'Read Full Terms'}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTerms}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Key Points Summary */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700">✓ What You Get</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 30% recurring commission on subscriptions</li>
              <li>• 15% commission on tool purchases</li>
              <li>• $50 per consultation booking</li>
              <li>• Monthly payments on the 15th</li>
              <li>• Marketing materials provided</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700">⚠ Important Rules</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Must disclose affiliate relationship</li>
              <li>• No spam or unsolicited promotion</li>
              <li>• Self-referrals are prohibited</li>
              <li>• Follow FTC endorsement guidelines</li>
              <li>• Maintain professional conduct</li>
            </ul>
          </div>
        </div>

        {/* Acceptance Section */}
        <div className="border-t pt-4">
          <div className="flex items-start space-x-2 mb-4">
            <Checkbox 
              id="accept-terms" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label 
              htmlFor="accept-terms" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I have read, understood, and agree to be bound by the Circle Affiliate Program Terms of Service (Version {currentTermsVersion}). I acknowledge that I must comply with all applicable laws and regulations, including FTC disclosure requirements.
            </label>
          </div>

          {required && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800">
                Terms acceptance is required to participate in the affiliate program.
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleAcceptTerms}
              disabled={!accepted || loading}
              className="flex-1"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Terms & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};