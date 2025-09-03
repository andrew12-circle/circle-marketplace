import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Copy, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Link as LinkIcon,
  Palette,
  Code,
  Mail
} from "lucide-react";

interface MarketingAssetsProps {
  affiliateId: string;
  affiliateCode: string;
}

const BANNERS = [
  {
    id: "banner_728x90",
    name: "Leaderboard Banner",
    size: "728x90",
    description: "Perfect for website headers",
    url: "/marketing-assets/banner-728x90.png"
  },
  {
    id: "banner_300x250",
    name: "Medium Rectangle",
    size: "300x250", 
    description: "Great for sidebars",
    url: "/marketing-assets/banner-300x250.png"
  },
  {
    id: "banner_160x600",
    name: "Wide Skyscraper",
    size: "160x600",
    description: "Vertical sidebar placement",
    url: "/marketing-assets/banner-160x600.png"
  },
  {
    id: "square_500x500",
    name: "Social Square",
    size: "500x500",
    description: "Instagram and Facebook posts",
    url: "/marketing-assets/square-500x500.png"
  }
];

const EMAIL_TEMPLATES = [
  {
    id: "intro_email",
    name: "Introduction Email",
    subject: "Discovered an amazing real estate tool!",
    body: `Hi [Name],

I've been using Circle's real estate tools and they've completely transformed my business. The marketplace alone has saved me thousands on services I was already paying for.

Check it out here: [AFFILIATE_LINK]

The platform includes:
- Vetted vendor marketplace with co-pay options
- Professional development academy  
- Powerful networking tools
- ROI tracking and analytics

Worth taking a look if you're serious about growing your real estate business.

Best,
[Your Name]`
  },
  {
    id: "social_post",
    name: "Social Media Post",
    subject: "Social Media Template",
    body: `🏠 Real estate agents: Stop overpaying for services! 

I just discovered Circle's marketplace where you can get co-pays on everything from photography to marketing services. 

Plus their academy content is 🔥

Check it out: [AFFILIATE_LINK]

#RealEstate #PropTech #RealEstateTools #CirclePlatform`
  }
];

const HTML_WIDGETS = [
  {
    id: "cta_button",
    name: "Call-to-Action Button",
    description: "Stylish button for your website",
    code: `<a href="[AFFILIATE_LINK]" style="
  display: inline-block;
  padding: 12px 24px;
  background: #3B82F6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
" onmouseover="this.style.background='#2563EB'" 
   onmouseout="this.style.background='#3B82F6'">
  Join Circle Platform →
</a>`
  },
  {
    id: "feature_card", 
    name: "Feature Card",
    description: "Complete feature card with benefits",
    code: `<div style="
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  font-family: Arial, sans-serif;
">
  <h3 style="color: #1F2937; margin: 0 0 12px 0; font-size: 20px;">
    Circle Real Estate Platform
  </h3>
  <p style="color: #6B7280; margin: 0 0 16px 0; line-height: 1.5;">
    Save money on real estate services with co-pay options, access premium training, and connect with top professionals.
  </p>
  <a href="[AFFILIATE_LINK]" style="
    display: inline-block;
    padding: 10px 20px;
    background: #10B981;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
  ">Get Started Free</a>
</div>`
  }
];

export const MarketingAssets = ({ affiliateId, affiliateCode }: MarketingAssetsProps) => {
  const [activeTab, setActiveTab] = useState("banners");

  const generateAffiliateLink = (baseUrl: string = "https://circle.andrewheisley.com") => {
    return `${baseUrl}?aff=${affiliateCode}`;
  };

  const copyToClipboard = (content: string, type: string) => {
    const processedContent = content.replace(/\[AFFILIATE_LINK\]/g, generateAffiliateLink());
    navigator.clipboard.writeText(processedContent);
    toast.success(`${type} copied to clipboard!`);
  };

  const downloadAsset = (assetUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = assetUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Asset downloaded!");
  };

  const TabButton = ({ id, label, icon: Icon, active }: any) => (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={() => setActiveTab(id)}
      className="flex items-center gap-2"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Marketing Assets</h2>
        <p className="text-muted-foreground">Ready-to-use banners, templates, and widgets for your campaigns</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton id="banners" label="Banners" icon={ImageIcon} active={activeTab === "banners"} />
        <TabButton id="emails" label="Email Templates" icon={Mail} active={activeTab === "emails"} />
        <TabButton id="widgets" label="HTML Widgets" icon={Code} active={activeTab === "widgets"} />
      </div>

      {activeTab === "banners" && (
        <div className="grid md:grid-cols-2 gap-6">
          {BANNERS.map((banner) => (
            <Card key={banner.id} className="hover-scale">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{banner.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{banner.description}</p>
                  </div>
                  <Badge variant="outline">{banner.size}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg mb-4 text-center">
                  <div className="bg-white/80 p-4 rounded border-2 border-dashed border-blue-300">
                    <ImageIcon className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-700">Banner Preview</p>
                    <p className="text-xs text-blue-500">{banner.size}px</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadAsset(banner.url, `circle-banner-${banner.size}.png`)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(generateAffiliateLink(), "Affiliate link")}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "emails" && (
        <div className="grid gap-6">
          {EMAIL_TEMPLATES.map((template) => (
            <Card key={template.id} className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {template.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject Line:</Label>
                  <div className="bg-muted/50 p-2 rounded text-sm mt-1">
                    {template.subject}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Email Body:</Label>
                  <div className="bg-muted/50 p-3 rounded text-sm mt-1 whitespace-pre-wrap font-mono">
                    {template.body}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => copyToClipboard(template.body, "Email template")}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Template
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(template.subject, "Subject line")}
                  >
                    Copy Subject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "widgets" && (
        <div className="grid gap-6">
          {HTML_WIDGETS.map((widget) => (
            <Card key={widget.id} className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  {widget.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{widget.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded border mt-1">
                    <div dangerouslySetInnerHTML={{ 
                      __html: widget.code.replace(/\[AFFILIATE_LINK\]/g, generateAffiliateLink()) 
                    }} />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">HTML Code:</Label>
                  <div className="bg-black text-green-400 p-3 rounded text-sm mt-1 font-mono overflow-x-auto">
                    {widget.code.replace(/\[AFFILIATE_LINK\]/g, generateAffiliateLink())}
                  </div>
                </div>
                
                <Button 
                  onClick={() => copyToClipboard(widget.code, "HTML widget")}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy HTML Code
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Palette className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Need Custom Assets?</h3>
              <p className="text-blue-700 text-sm mb-3">
                Contact our team to create custom banners, landing pages, or marketing materials that match your brand.
              </p>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Request Custom Assets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};