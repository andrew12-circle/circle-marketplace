import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  FileText,
  Plus
} from "lucide-react";

interface AffiliatePaymentsProps {
  affiliateId: string;
}

export const AffiliatePayments = ({ affiliateId }: AffiliatePaymentsProps) => {
  const [payoutMethod, setPayoutMethod] = useState<string>("");
  const [isSettingUpPayout, setIsSettingUpPayout] = useState(false);

  // Mock data - in real app this would come from API
  const paymentData = {
    currentBalance: 234.50,
    pendingEarnings: 78.90,
    lifetimeEarnings: 1247.80,
    nextPayoutDate: "2024-02-15",
    minimumThreshold: 50.00,
    hasPayoutMethod: false,
    hasTaxInfo: false,
    payoutHistory: [
      {
        id: "1",
        date: "2024-01-15",
        amount: 189.30,
        status: "paid",
        reference: "po_1234567890",
        method: "stripe_connect"
      },
      {
        id: "2", 
        date: "2023-12-15",
        amount: 156.20,
        status: "paid",
        reference: "po_1234567891",
        method: "stripe_connect"
      }
    ]
  };

  const setupPayoutMethod = async () => {
    setIsSettingUpPayout(true);
    
    // In a real implementation, this would integrate with Stripe Connect or save ACH details
    setTimeout(() => {
      toast.success("Payout method saved successfully!");
      setIsSettingUpPayout(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payments</h2>
      </div>

      {/* Earnings Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold">${paymentData.currentBalance.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Available for next payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold">${paymentData.pendingEarnings.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-primary" />
              <span className="text-3xl font-bold">${paymentData.lifetimeEarnings.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total all time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Setup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Payout Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Payout Method</div>
                  <div className="text-sm text-muted-foreground">
                    {paymentData.hasPayoutMethod ? "Stripe Connect configured" : "Not configured"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {paymentData.hasPayoutMethod ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Setup
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Setup Payout Method</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Payout Method</Label>
                          <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose your payout method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stripe_connect">Stripe Connect (Recommended)</SelectItem>
                              <SelectItem value="ach_manual">Manual ACH Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {payoutMethod === "stripe_connect" && (
                          <div className="p-4 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm">
                              Stripe Connect provides the fastest, most secure payouts with automatic 
                              tax document handling and fraud protection.
                            </p>
                          </div>
                        )}
                        
                        {payoutMethod === "ach_manual" && (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="account_name">Account Holder Name</Label>
                              <Input id="account_name" placeholder="Full name on account" />
                            </div>
                            <div>
                              <Label htmlFor="routing_number">Routing Number</Label>
                              <Input id="routing_number" placeholder="9-digit routing number" />
                            </div>
                            <div>
                              <Label htmlFor="account_number">Account Number</Label>
                              <Input id="account_number" placeholder="Account number" />
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          onClick={setupPayoutMethod}
                          disabled={!payoutMethod || isSettingUpPayout}
                          className="w-full"
                        >
                          {isSettingUpPayout ? "Setting up..." : "Save Payout Method"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Tax Information</div>
                  <div className="text-sm text-muted-foreground">
                    {paymentData.hasTaxInfo ? "W-9 on file" : "W-9 or W-8BEN required"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {paymentData.hasTaxInfo ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {(!paymentData.hasPayoutMethod || !paymentData.hasTaxInfo) && (
            <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Action Required</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Complete your payout profile to receive payments. Payouts are held until all information is provided.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Next Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{paymentData.nextPayoutDate}</div>
              <div className="text-sm text-muted-foreground">
                Minimum threshold: ${paymentData.minimumThreshold}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${paymentData.currentBalance.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {paymentData.currentBalance >= paymentData.minimumThreshold 
                  ? "Ready for payout" 
                  : `$${(paymentData.minimumThreshold - paymentData.currentBalance).toFixed(2)} to minimum`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentData.payoutHistory.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No payouts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentData.payoutHistory.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payout.status)}
                    <div>
                      <div className="font-medium">${payout.amount.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">{payout.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(payout.status)}
                    <div className="text-sm font-mono text-muted-foreground">
                      {payout.reference}
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