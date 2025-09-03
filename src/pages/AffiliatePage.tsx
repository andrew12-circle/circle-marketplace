import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AffiliateDashboard } from "@/components/affiliate/AffiliateDashboard";
import { AffiliateLinkGenerator } from "@/components/affiliate/AffiliateLinkGenerator";
import { MarketingAssets } from "@/components/affiliate/MarketingAssets";
import { AffiliateAnalytics } from "@/components/affiliate/AffiliateAnalytics";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Link as LinkIcon, 
  Image, 
  TrendingUp,
  UserPlus 
} from "lucide-react";
import { toast } from "sonner";

export default function AffiliatePage() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setAffiliate(data);
    } catch (error: any) {
      console.error("Error loading affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const createAffiliateProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          email: user.email || "",
          legal_name: user.user_metadata?.full_name || "",
          country: "US",
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data);
      toast.success("Affiliate profile created successfully!");
    } catch (error: any) {
      console.error("Error creating affiliate profile:", error);
      toast.error("Failed to create affiliate profile");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join the Circle Affiliate Program</CardTitle>
            <p className="text-muted-foreground">
              Start earning 15% commission on all referrals. Create your affiliate profile to get started.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-semibold text-green-700">15% Commission</div>
                  <div className="text-green-600">On all sales and subscriptions</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-700">30-Day Cookies</div>
                  <div className="text-blue-600">Extended attribution window</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="font-semibold text-purple-700">Marketing Assets</div>
                  <div className="text-purple-600">Banners, templates & more</div>
                </div>
              </div>
              
              <Button onClick={createAffiliateProfile} size="lg" className="w-full">
                Create Affiliate Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your affiliate links and track your earnings
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Link Generator
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Marketing Assets
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AffiliateDashboard affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="links">
          <AffiliateLinkGenerator affiliateId={affiliate.id} />
        </TabsContent>

        <TabsContent value="assets">
          <MarketingAssets 
            affiliateId={affiliate.id} 
            affiliateCode={affiliate.id.slice(0, 8)} 
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AffiliateAnalytics affiliateId={affiliate.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}