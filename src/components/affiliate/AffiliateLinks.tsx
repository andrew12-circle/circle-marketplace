import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Copy, 
  MousePointer, 
  TrendingUp, 
  DollarSign,
  QrCode,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";

interface AffiliateLinksProps {
  affiliateId: string;
}

export const AffiliateLinks = ({ affiliateId }: AffiliateLinksProps) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newLink, setNewLink] = useState({
    destination_type: "",
    custom_code: ""
  });

  useEffect(() => {
    loadLinks();
  }, [affiliateId]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      console.error("Error loading links:", error);
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    if (!newLink.destination_type) {
      toast.error("Please select a destination type");
      return;
    }

    setIsCreating(true);

    try {
      // Generate unique code
      const code = newLink.custom_code || `link${Math.random().toString(36).substr(2, 6)}`;
      
      // Set destination URL based on type
      const destinationUrls = {
        marketplace: "https://circle.example.com/marketplace",
        academy: "https://circle.example.com/academy", 
        pro_membership: "https://circle.example.com/pro",
        funnel: "https://circle.example.com/signup"
      };

      const { error } = await supabase
        .from("affiliate_links")
        .insert({
          affiliate_id: affiliateId,
          code,
          destination_type: newLink.destination_type,
          destination_url: destinationUrls[newLink.destination_type as keyof typeof destinationUrls],
          status: "active"
        });

      if (error) throw error;

      toast.success("Link created successfully!");
      setNewLink({ destination_type: "", custom_code: "" });
      loadLinks();
    } catch (error: any) {
      console.error("Error creating link:", error);
      toast.error(error.message || "Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (link: any) => {
    const url = `${link.destination_url}?aff=${link.code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const generateQRCode = (link: any) => {
    const url = `${link.destination_url}?aff=${link.code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    window.open(qrUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
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
        <h2 className="text-2xl font-bold">Affiliate Links</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Affiliate Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="destination_type">Destination</Label>
                <Select
                  value={newLink.destination_type}
                  onValueChange={(value) => setNewLink(prev => ({ ...prev, destination_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Where should this link go?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro_membership">Circle Pro Membership</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="academy">Academy</SelectItem>
                    <SelectItem value="funnel">Signup Funnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="custom_code">Custom Code (Optional)</Label>
                <Input
                  id="custom_code"
                  value={newLink.custom_code}
                  onChange={(e) => setNewLink(prev => ({ ...prev, custom_code: e.target.value }))}
                  placeholder="e.g. john123 (leave blank for auto-generated)"
                />
              </div>
              
              <Button 
                onClick={createLink} 
                disabled={isCreating || !newLink.destination_type}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ExternalLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No links yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first affiliate link to start earning commissions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {link.destination_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                      {link.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateQRCode(link)}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-4">
                  {link.destination_url}?aff={link.code}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <MousePointer className="w-4 h-4" />
                      Clicks
                    </div>
                    <div className="text-xl font-bold">0</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Conversions
                    </div>
                    <div className="text-xl font-bold">0</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      Earnings
                    </div>
                    <div className="text-xl font-bold">$0.00</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};