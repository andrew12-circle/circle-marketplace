import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Settings, 
  DollarSign, 
  Calendar,
  Users,
  TrendingUp
} from "lucide-react";

export const AffiliatePayrollScreen = () => {
  const [payoutPeriod, setPayoutPeriod] = useState("2024-01");
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalCommissions: 0,
    totalPayouts: 0,
    avgPayout: 0
  });

  useEffect(() => {
    loadPayrollData();
  }, [payoutPeriod]);

  const loadPayrollData = async () => {
    try {
      // Load payout data for the selected period
      const { data: payoutData, error: payoutError } = await supabase
        .from("affiliate_payouts")
        .select(`
          *,
          affiliates:affiliate_id (
            legal_name,
            business_name,
            email,
            payout_method
          )
        `)
        .eq("period_start", `${payoutPeriod}-01`)
        .order("created_at", { ascending: false });

      if (payoutError) throw payoutError;

      setPayouts(payoutData || []);

      // Calculate stats
      const totalCommissions = payoutData?.reduce((sum, p) => sum + Number(p.total_commission), 0) || 0;
      const totalPayouts = payoutData?.reduce((sum, p) => sum + Number(p.payout_amount), 0) || 0;
      const avgPayout = payoutData?.length ? totalPayouts / payoutData.length : 0;

      setStats({
        totalAffiliates: payoutData?.length || 0,
        totalCommissions,
        totalPayouts,
        avgPayout
      });
    } catch (error: any) {
      console.error("Error loading payroll data:", error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const generatePayouts = async () => {
    setProcessing(true);
    try {
      // Call edge function to generate payouts for the period
      const { data, error } = await supabase.functions.invoke('generate-affiliate-payouts', {
        body: { period: payoutPeriod }
      });

      if (error) throw error;

      toast.success(`Generated ${data.count} payouts for ${payoutPeriod}`);
      loadPayrollData();
    } catch (error: any) {
      console.error("Error generating payouts:", error);
      toast.error("Failed to generate payouts");
    } finally {
      setProcessing(false);
    }
  };

  const processStripePayouts = async () => {
    setProcessing(true);
    try {
      const stripePendingPayouts = payouts.filter(p => 
        p.payout_method === 'stripe_connect' && 
        p.payout_status === 'pending'
      );

      if (stripePendingPayouts.length === 0) {
        toast.error("No pending Stripe payouts to process");
        return;
      }

      // Process Stripe payouts
      const { data, error } = await supabase.functions.invoke('process-stripe-payouts', {
        body: { payoutIds: stripePendingPayouts.map(p => p.id) }
      });

      if (error) throw error;

      toast.success(`Processed ${data.processed} Stripe payouts`);
      loadPayrollData();
    } catch (error: any) {
      console.error("Error processing Stripe payouts:", error);
      toast.error("Failed to process Stripe payouts");
    } finally {
      setProcessing(false);
    }
  };

  const exportACHFile = () => {
    const achPayouts = payouts.filter(p => 
      p.payout_method === 'ach_manual' && 
      p.payout_status === 'pending'
    );

    if (achPayouts.length === 0) {
      toast.error("No ACH payouts to export");
      return;
    }

    // Generate CSV for ACH payments
    const csvHeaders = ['Bank Name', 'Account Name', 'Routing Number', 'Account Number (Last 4)', 'Amount', 'Memo', 'Reference ID'];
    const csvRows = achPayouts.map(payout => [
      'Manual Entry Required',
      payout.affiliates?.legal_name || payout.affiliates?.business_name,
      'XXXX-XXXX',
      'XXXX',
      payout.payout_amount,
      `Affiliate Payout ${payoutPeriod}`,
      payout.id
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-ach-payouts-${payoutPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${achPayouts.length} ACH payouts`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Affiliate Payroll</h2>
          <p className="text-muted-foreground">
            Manage monthly affiliate payouts and process payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={payoutPeriod} onValueChange={setPayoutPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">January 2024</SelectItem>
              <SelectItem value="2024-02">February 2024</SelectItem>
              <SelectItem value="2024-03">March 2024</SelectItem>
              <SelectItem value="2024-04">April 2024</SelectItem>
              <SelectItem value="2024-05">May 2024</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={generatePayouts}
            disabled={processing}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Payouts
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Affiliates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold">{stats.totalAffiliates}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold">${stats.totalCommissions.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <span className="text-3xl font-bold">${stats.totalPayouts.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-orange-500" />
              <span className="text-3xl font-bold">${stats.avgPayout.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Processing */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Stripe Connect Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Process automatic payouts for affiliates using Stripe Connect.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {payouts.filter(p => p.payout_method === 'stripe_connect' && p.payout_status === 'pending').length} pending
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ready for processing
                  </p>
                </div>
                <Button
                  onClick={processStripePayouts}
                  disabled={processing}
                >
                  Process All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manual ACH Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export CSV file for manual ACH processing through your bank.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {payouts.filter(p => p.payout_method === 'ach_manual' && p.payout_status === 'pending').length} pending
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ready for export
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={exportACHFile}
                >
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Details</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No payouts for selected period</p>
              <p className="text-sm text-muted-foreground">Generate payouts to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4">Affiliate</th>
                    <th className="text-left p-4">Method</th>
                    <th className="text-right p-4">Commission</th>
                    <th className="text-right p-4">Payout</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {payout.affiliates?.legal_name || payout.affiliates?.business_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payout.affiliates?.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {payout.payout_method === 'stripe_connect' ? 'Stripe' : 'ACH Manual'}
                        </span>
                      </td>
                      <td className="text-right p-4 font-medium">
                        ${Number(payout.total_commission).toFixed(2)}
                      </td>
                      <td className="text-right p-4 font-medium">
                        ${Number(payout.payout_amount).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          payout.payout_status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : payout.payout_status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payout.payout_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono">
                          {payout.payout_reference || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};