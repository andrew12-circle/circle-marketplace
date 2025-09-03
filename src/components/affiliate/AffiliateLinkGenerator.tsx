import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Settings,
  Download,
  Share,
  BarChart3,
  Link as LinkIcon,
  Globe,
  Target,
  Tags,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AffiliateLinkGeneratorProps {
  affiliateId: string;
}

interface LinkFormData {
  destination_type: string;
  custom_code: string;
  campaign_name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  expires_at?: string;
  notes: string;
}

const DESTINATION_OPTIONS = [
  { value: "home", label: "Homepage", url: "/" },
  { value: "pro_membership", label: "Circle Pro Membership", url: "/pricing" },
  { value: "marketplace", label: "Marketplace", url: "/marketplace" },
  { value: "academy", label: "Academy", url: "/academy" },
  { value: "signup", label: "Signup Funnel", url: "/signup" },
  { value: "consultation", label: "Free Consultation", url: "/consultation" },
  { value: "about", label: "About Us", url: "/about" },
  { value: "contact", label: "Contact", url: "/contact" }
];

const CAMPAIGN_TEMPLATES = [
  {
    name: "Social Media Campaign",
    utm_source: "social",
    utm_medium: "social",
    utm_campaign: "q1_social_push"
  },
  {
    name: "Email Newsletter",
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: "weekly_newsletter"
  },
  {
    name: "YouTube Video",
    utm_source: "youtube",
    utm_medium: "video",
    utm_campaign: "tutorial_series"
  },
  {
    name: "Blog Post",
    utm_source: "blog",
    utm_medium: "content",
    utm_campaign: "how_to_guide"
  },
  {
    name: "Webinar",
    utm_source: "webinar",
    utm_medium: "event",
    utm_campaign: "monthly_webinar"
  }
];

export const AffiliateLinkGenerator = ({ affiliateId }: AffiliateLinkGeneratorProps) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState<LinkFormData>({
    destination_type: "",
    custom_code: "",
    campaign_name: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    notes: ""
  });

  useEffect(() => {
    loadLinks();
  }, [affiliateId]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select(`
          *,
          affiliate_clicks(count),
          affiliate_conversions(count, commission_amount)
        `)
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

  const applyTemplate = (template: typeof CAMPAIGN_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      utm_source: template.utm_source,
      utm_medium: template.utm_medium,
      utm_campaign: template.utm_campaign,
      campaign_name: template.name
    }));
    setSelectedTemplate(template.name);
  };

  const generateFullUrl = (baseUrl: string, code: string, utmParams?: Partial<LinkFormData>) => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('aff', code);
    
    if (utmParams?.utm_source) url.searchParams.set('utm_source', utmParams.utm_source);
    if (utmParams?.utm_medium) url.searchParams.set('utm_medium', utmParams.utm_medium);
    if (utmParams?.utm_campaign) url.searchParams.set('utm_campaign', utmParams.utm_campaign);
    if (utmParams?.utm_content) url.searchParams.set('utm_content', utmParams.utm_content);
    if (utmParams?.utm_term) url.searchParams.set('utm_term', utmParams.utm_term);
    
    return url.toString();
  };

  const createLink = async () => {
    if (!formData.destination_type) {
      toast.error("Please select a destination");
      return;
    }

    setIsCreating(true);

    try {
      const code = formData.custom_code || `${affiliateId.slice(0, 6)}${Math.random().toString(36).substr(2, 4)}`;
      const destinationUrl = DESTINATION_OPTIONS.find(opt => opt.value === formData.destination_type)?.url || "/";
      
      const linkData = {
        affiliate_id: affiliateId,
        code,
        destination_type: formData.destination_type,
        destination_url: destinationUrl,
        campaign_name: formData.campaign_name,
        utm_source: formData.utm_source,
        utm_medium: formData.utm_medium,
        utm_campaign: formData.utm_campaign,
        utm_content: formData.utm_content,
        utm_term: formData.utm_term,
        expires_at: formData.expires_at || null,
        notes: formData.notes,
        status: "active"
      };

      const { error } = await supabase
        .from("affiliate_links")
        .insert(linkData);

      if (error) throw error;

      toast.success("Affiliate link created successfully!");
      setFormData({
        destination_type: "",
        custom_code: "",
        campaign_name: "",
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_content: "",
        utm_term: "",
        notes: ""
      });
      setSelectedTemplate("");
      loadLinks();
    } catch (error: any) {
      console.error("Error creating link:", error);
      toast.error(error.message || "Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (link: any) => {
    const url = generateFullUrl(link.destination_url, link.code, link);
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const downloadQRCode = async (link: any) => {
    const url = generateFullUrl(link.destination_url, link.code, link);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link_element = document.createElement('a');
      link_element.href = downloadUrl;
      link_element.download = `qr-code-${link.code}.png`;
      document.body.appendChild(link_element);
      link_element.click();
      document.body.removeChild(link_element);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("QR code downloaded!");
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const shareLink = async (link: any) => {
    const url = generateFullUrl(link.destination_url, link.code, link);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Circle ${link.destination_type.replace('_', ' ')} - Affiliate Link`,
          text: "Check out Circle's amazing real estate tools!",
          url: url
        });
      } catch (error) {
        // User cancelled sharing, copy to clipboard instead
        copyToClipboard(link);
      }
    } else {
      copyToClipboard(link);
    }
  };

  const toggleLinkExpansion = (linkId: string) => {
    const newExpanded = new Set(expandedLinks);
    if (newExpanded.has(linkId)) {
      newExpanded.delete(linkId);
    } else {
      newExpanded.add(linkId);
    }
    setExpandedLinks(newExpanded);
  };

  const calculateStats = (link: any) => {
    const clicks = link.affiliate_clicks?.length || 0;
    const conversions = link.affiliate_conversions?.length || 0;
    const earnings = link.affiliate_conversions?.reduce((sum: number, conv: any) => sum + (conv.commission_amount || 0), 0) || 0;
    const conversionRate = clicks > 0 ? (conversions / clicks * 100).toFixed(1) : "0.0";
    
    return { clicks, conversions, earnings, conversionRate };
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Link Generator</h2>
          <p className="text-muted-foreground">Create and manage your affiliate links with advanced tracking</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="hover-scale">
              <Plus className="w-4 h-4 mr-2" />
              Generate New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Generate New Affiliate Link
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="tracking">UTM Tracking</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="destination_type">Destination Page</Label>
                  <Select
                    value={formData.destination_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, destination_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Where should this link redirect?" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="campaign_name">Campaign Name</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="e.g. Q1 Social Media Push"
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom_code">Custom Link Code (Optional)</Label>
                  <Input
                    id="custom_code"
                    value={formData.custom_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_code: e.target.value }))}
                    placeholder="e.g. social_jan2024 (leave blank for auto-generated)"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="tracking" className="space-y-4">
                <div>
                  <Label>Quick Templates</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {CAMPAIGN_TEMPLATES.map(template => (
                      <Button
                        key={template.name}
                        variant={selectedTemplate === template.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="justify-start"
                      >
                        <Tags className="w-4 h-4 mr-2" />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="utm_source">UTM Source</Label>
                    <Input
                      id="utm_source"
                      value={formData.utm_source}
                      onChange={(e) => setFormData(prev => ({ ...prev, utm_source: e.target.value }))}
                      placeholder="e.g. facebook, google, newsletter"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="utm_medium">UTM Medium</Label>
                    <Input
                      id="utm_medium"
                      value={formData.utm_medium}
                      onChange={(e) => setFormData(prev => ({ ...prev, utm_medium: e.target.value }))}
                      placeholder="e.g. social, email, cpc"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                    <Input
                      id="utm_campaign"
                      value={formData.utm_campaign}
                      onChange={(e) => setFormData(prev => ({ ...prev, utm_campaign: e.target.value }))}
                      placeholder="e.g. spring_promo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="utm_content">UTM Content</Label>
                    <Input
                      id="utm_content"
                      value={formData.utm_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, utm_content: e.target.value }))}
                      placeholder="e.g. banner_ad, text_link"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="utm_term">UTM Term</Label>
                    <Input
                      id="utm_term"
                      value={formData.utm_term}
                      onChange={(e) => setFormData(prev => ({ ...prev, utm_term: e.target.value }))}
                      placeholder="e.g. real estate tools"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="expires_at">Link Expiration (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this link..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={createLink} 
                disabled={isCreating || !formData.destination_type}
                className="flex-1"
              >
                {isCreating ? "Generating..." : "Generate Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <Card className="animate-scale-in">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No affiliate links yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first affiliate link to start earning commissions and tracking your performance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => {
            const stats = calculateStats(link);
            const isExpanded = expandedLinks.has(link.id);
            const fullUrl = generateFullUrl(link.destination_url, link.code, link);
            
            return (
              <Card key={link.id} className="hover-scale transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {link.destination_type.replace('_', ' ')}
                      </Badge>
                      {link.campaign_name && (
                        <Badge variant="secondary">
                          {link.campaign_name}
                        </Badge>
                      )}
                      <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                        {link.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareLink(link)}
                        className="hover-scale"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadQRCode(link)}
                        className="hover-scale"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link)}
                        className="hover-scale"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLinkExpansion(link.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-4 break-all">
                    {fullUrl}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-sm text-blue-600 mb-1">
                        <MousePointer className="w-4 h-4" />
                        Clicks
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{stats.clicks}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-sm text-green-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        Conversions
                      </div>
                      <div className="text-2xl font-bold text-green-700">{stats.conversions}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 mb-1">
                        <Target className="w-4 h-4" />
                        Rate
                      </div>
                      <div className="text-2xl font-bold text-purple-700">{stats.conversionRate}%</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-sm text-orange-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Earnings
                      </div>
                      <div className="text-2xl font-bold text-orange-700">${stats.earnings.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3 animate-fade-in">
                      {link.utm_source && (
                        <div className="text-sm">
                          <span className="font-medium">UTM Parameters:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {link.utm_source && <Badge variant="outline">Source: {link.utm_source}</Badge>}
                            {link.utm_medium && <Badge variant="outline">Medium: {link.utm_medium}</Badge>}
                            {link.utm_campaign && <Badge variant="outline">Campaign: {link.utm_campaign}</Badge>}
                            {link.utm_content && <Badge variant="outline">Content: {link.utm_content}</Badge>}
                            {link.utm_term && <Badge variant="outline">Term: {link.utm_term}</Badge>}
                          </div>
                        </div>
                      )}
                      
                      {link.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span>
                          <p className="mt-1 text-muted-foreground">{link.notes}</p>
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Created:</span> {new Date(link.created_at).toLocaleDateString()}
                        {link.expires_at && (
                          <>
                            {" | "}
                            <span className="font-medium">Expires:</span> {new Date(link.expires_at).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};