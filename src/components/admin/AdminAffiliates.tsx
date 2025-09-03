import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Settings as SettingsIcon,
  BarChart3,
  CreditCard
} from "lucide-react";

export const AdminAffiliates = () => {
  const { data: isAdmin, isLoading: adminLoading } = useAdminStatus();
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    totalEarnings: 0,
    pendingPayouts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (isAdmin) {
      loadAffiliateData();
    }
  }, [isAdmin]);

  const loadAffiliateData = async () => {
    try {
      // Load affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (affiliatesError) throw affiliatesError;

      setAffiliates(affiliatesData || []);

      // Calculate stats
      const total = affiliatesData?.length || 0;
      const pending = affiliatesData?.filter(a => a.onboarding_status === 'pending_kyc').length || 0;
      const approved = affiliatesData?.filter(a => a.onboarding_status === 'approved').length || 0;

      setStats({
        total,
        pending,
        approved,
        totalEarnings: 12487.50, // Mock data
        pendingPayouts: 3421.80  // Mock data
      });
    } catch (error: any) {
      console.error("Error loading affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ 
          onboarding_status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", affiliateId);

      if (error) throw error;

      toast.success(`Affiliate ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      loadAffiliateData();
    } catch (error: any) {
      console.error("Error updating affiliate status:", error);
      toast.error("Failed to update affiliate status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      not_started: { variant: 'outline' as const, label: 'Not Started' },
      pending_kyc: { variant: 'secondary' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.not_started;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    if (filter === "all") return true;
    return affiliate.onboarding_status === filter;
  });

  if (adminLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

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
          <h2 className="text-3xl font-bold">Affiliate Management</h2>
          <p className="text-muted-foreground">
            Manage affiliate applications, approvals, and payouts
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Affiliates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold">{stats.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-8 h-8 text-orange-500" />
                  <span className="text-3xl font-bold">{stats.pending}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-8 h-8 text-purple-500" />
                  <span className="text-3xl font-bold">${stats.pendingPayouts.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Performance chart would go here</p>
                  <p className="text-sm text-muted-foreground">Showing signups, conversions, and earnings over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Affiliates</SelectItem>
                <SelectItem value="pending_kyc">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="Search affiliates..." 
              className="max-w-sm"
            />
          </div>

          {/* Affiliates Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">Affiliate</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Channel</th>
                      <th className="text-left p-4">Applied</th>
                      <th className="text-left p-4">Earnings</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{affiliate.legal_name}</div>
                            {affiliate.business_name && (
                              <div className="text-sm text-muted-foreground">{affiliate.business_name}</div>
                            )}
                            <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(affiliate.onboarding_status)}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{affiliate.marketing_channels}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {new Date(affiliate.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">$0.00</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {affiliate.onboarding_status === 'pending_kyc' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateAffiliateStatus(affiliate.id, 'approved')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => updateAffiliateStatus(affiliate.id, 'rejected')}
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredAffiliates.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No affiliates found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Conversion tracking will be implemented</p>
                <p className="text-sm text-muted-foreground">Review and approve affiliate conversions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Payout system will be implemented</p>
                <p className="text-sm text-muted-foreground">Process monthly affiliate payouts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};