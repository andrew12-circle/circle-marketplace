import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  CreditCard,
  FileText,
  Building,
  Play,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface PayoutSummary {
  total_payouts: number;
  total_amount: number;
  ready_to_pay: number;
  needs_verification: number;
  needs_setup: number;
  needs_tax_info: number;
  below_minimum: number;
}

interface CreatorPayout {
  creator_id: string;
  payout_month: string;
  total_earnings: number;
  final_amount: number;
  status: string;
  creator_name: string;
  stripe_onboarding_completed: boolean;
  verified: boolean;
  tax_form_completed: boolean;
}

export const CreatorPayoutDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // YYYY-MM format
  );

  useEffect(() => {
    fetchPayoutData();
  }, [selectedMonth]);

  const fetchPayoutData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-creator-payouts', {
        body: { 
          payout_month: selectedMonth,
          action: 'summary'
        }
      });

      if (error) throw error;

      setSummary(data.summary);
      setPayouts(data.payouts || []);
    } catch (error) {
      console.error('Error fetching payout data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payout data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePayouts = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-creator-payouts', {
        body: { 
          payout_month: selectedMonth,
          action: 'generate'
        }
      });

      if (error) throw error;

      toast({
        title: 'Payouts Generated',
        description: `Successfully generated ${data.generated_count} payout records`,
      });

      await fetchPayoutData();
    } catch (error) {
      console.error('Error generating payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate payouts',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const processAutomaticPayouts = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-creator-payouts', {
        body: { 
          payout_month: selectedMonth,
          action: 'auto_process'
        }
      });

      if (error) throw error;

      toast({
        title: 'Payouts Processed',
        description: `Successfully processed ${data.successful_payouts} payouts. ${data.failed_payouts} failed. ${data.skipped_payouts} skipped.`,
      });

      await fetchPayoutData();
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to process automatic payouts',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (payout: CreatorPayout) => {
    if (payout.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    
    if (!payout.stripe_onboarding_completed) {
      return <Badge variant="destructive">Needs Stripe Setup</Badge>;
    }
    
    if (!payout.verified) {
      return <Badge variant="secondary">Needs Verification</Badge>;
    }
    
    if (!payout.tax_form_completed) {
      return <Badge className="bg-yellow-100 text-yellow-800">Needs Tax Info</Badge>;
    }
    
    if (payout.final_amount < 25) {
      return <Badge variant="outline">Below Minimum</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800">Ready to Pay</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Creator Payouts</h2>
          <p className="text-muted-foreground">Manage monthly creator payouts and earnings</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button 
            onClick={generatePayouts}
            disabled={processing}
            variant="outline"
          >
            Generate Payouts
          </Button>
          <Button 
            onClick={processAutomaticPayouts}
            disabled={processing || !summary?.ready_to_pay}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {processing ? 'Processing...' : 'Process Payments'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.total_amount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_payouts} creators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Pay</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.ready_to_pay}</div>
              <p className="text-xs text-muted-foreground">
                Verified creators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Setup</CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.needs_setup + summary.needs_verification + summary.needs_tax_info}
              </div>
              <p className="text-xs text-muted-foreground">
                Require action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Below Minimum</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.below_minimum}</div>
              <p className="text-xs text-muted-foreground">
                Under $25 threshold
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      {summary && summary.ready_to_pay > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {summary.ready_to_pay} creators ready for automatic payout
                </div>
                <div className="text-sm">
                  Total amount: ${summary.total_amount.toFixed(2)}
                </div>
              </div>
              <Button 
                onClick={processAutomaticPayouts}
                disabled={processing}
                className="ml-4"
              >
                {processing ? 'Processing...' : 'Process All Payments'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payout List */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Payouts - {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Payouts Found</h3>
              <p className="text-muted-foreground mb-4">
                Generate payouts for {selectedMonth} to see creator earnings
              </p>
              <Button onClick={generatePayouts} disabled={processing}>
                Generate Payouts for {selectedMonth}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.creator_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{payout.creator_name}</h4>
                      {getStatusBadge(payout)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Creator ID: {payout.creator_id}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Stripe: {payout.stripe_onboarding_completed ? '✓' : '✗'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Verified: {payout.verified ? '✓' : '✗'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Tax Info: {payout.tax_form_completed ? '✓' : '✗'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${payout.final_amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Earnings: ${payout.total_earnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};