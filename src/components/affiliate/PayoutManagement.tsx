import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, CreditCard, Download, Filter } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Payout {
  id: string;
  period_start: string;
  period_end: string;
  total_commission: number;
  payout_amount: number;
  payout_status: string;
  payout_method: string;
  payout_reference?: string;
  created_at: string;
}

export const PayoutManagement = ({ affiliateId }: { affiliateId: string }) => {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPayouts();
  }, [affiliateId]);

  const loadPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast({
        title: "Error",
        description: "Failed to load payout history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-affiliate-payout', {
        body: { affiliate_id: affiliateId }
      });

      if (error) throw error;

      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for processing.",
      });

      loadPayouts();
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Error",
        description: "Failed to request payout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportPayouts = () => {
    const csv = [
      'Date,Period,Amount,Status,Method,Reference',
      ...payouts.map(p => 
        `${new Date(p.created_at).toLocaleDateString()},${p.period_start} to ${p.period_end},$${p.payout_amount.toFixed(2)},${p.payout_status},${p.payout_method},${p.payout_reference || ''}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-payouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesFilter = filter === 'all' || payout.payout_status === filter;
    const matchesSearch = searchTerm === '' || 
      payout.payout_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.period_start.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const totalEarnings = payouts.reduce((sum, p) => sum + p.total_commission, 0);
  const totalPaid = payouts.filter(p => p.payout_status === 'completed').reduce((sum, p) => sum + p.payout_amount, 0);
  const pendingAmount = payouts.filter(p => p.payout_status === 'pending').reduce((sum, p) => sum + p.payout_amount, 0);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Payout Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={requestPayout} disabled={pendingAmount <= 0}>
              Request Payout
            </Button>
            <Button variant="outline" onClick={exportPayouts}>
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search payouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payouts found</p>
            ) : (
              filteredPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">${payout.payout_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {payout.period_start} to {payout.period_end}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Method: {payout.payout_method}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(payout.payout_status)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </p>
                    {payout.payout_reference && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payout.payout_reference}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};