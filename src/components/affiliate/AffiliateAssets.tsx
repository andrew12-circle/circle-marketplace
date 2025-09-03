import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Download, 
  Image, 
  FileText, 
  Copy, 
  Mail,
  MessageSquare,
  ExternalLink,
  Palette
} from "lucide-react";

export const AffiliateAssets = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadAsset = (assetName: string) => {
    // In a real implementation, this would trigger a download
    toast.success(`${assetName} download started`);
  };

  const banners = [
    {
      name: "Circle Pro Hero Banner",
      size: "728x90",
      type: "Pro Membership",
      description: "Main promotional banner for Circle Pro"
    },
    {
      name: "Marketplace Square",
      size: "300x300", 
      type: "Marketplace",
      description: "Square banner for social media"
    },
    {
      name: "Mobile Banner",
      size: "320x50",
      type: "General",
      description: "Mobile-optimized banner"
    }
  ];

  const copyTemplates = [
    {
      title: "Circle Pro Email Template",
      type: "Email",
      content: `Subject: The tool that's transforming real estate careers

Hi [Name],

I wanted to share something that's been a game-changer for the top agents I work with - Circle Pro.

It's a $97/month platform that gives agents everything they need to build a $100K+ business:
• Curated marketplace of vetted tools
• ROI tracking on every purchase
• Exclusive academy content
• Direct access to industry experts

What I love most is that every tool is pre-screened for results. No more wasting money on software that doesn't deliver.

Want to see what 2,500+ top agents use daily?

[Your affiliate link here]

Best,
[Your name]`
    },
    {
      title: "Social Media Post",
      type: "Social",
      content: `🏠 Real estate agents: Stop wasting money on tools that don't work.

Circle Pro gives you ONLY the vetted, ROI-proven tools that top agents actually use to build $100K+ businesses.

✅ Pre-screened marketplace
✅ Academy training
✅ ROI tracking
✅ Expert access

$97/month. Zero guesswork.

See what 2,500+ agents use daily: [Your link]

#RealEstate #CirclePro #AgentTools`
    },
    {
      title: "LinkedIn Message",
      type: "LinkedIn",
      content: `Hi [Name],

I noticed you're focused on growing your real estate business. I wanted to share Circle Pro - it's what the top 1% of agents use to find and track ROI-proven tools.

Instead of guessing which software works, Circle Pro gives you access to a curated marketplace where everything's already been tested by successful agents.

Worth checking out if you're serious about scaling: [Your link]

Would love to hear what you think!`
    }
  ];

  const utmBuilder = {
    source: "",
    medium: "",
    campaign: "",
    term: "",
    content: ""
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Marketing Assets</h2>
        <p className="text-muted-foreground">
          Ready-made banners, copy, and campaigns that convert.
        </p>
      </div>

      {/* Banners Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Banners & Graphics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-24 rounded mb-3 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">{banner.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{banner.size}</Badge>
                  <Badge variant="secondary">{banner.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {banner.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => downloadAsset(banner.name)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Copy Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Copy Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {copyTemplates.map((template, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.title}</h3>
                    <Badge variant="outline">
                      {template.type === 'Email' && <Mail className="w-3 h-3 mr-1" />}
                      {template.type === 'Social' && <MessageSquare className="w-3 h-3 mr-1" />}
                      {template.type === 'LinkedIn' && <ExternalLink className="w-3 h-3 mr-1" />}
                      {template.type}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(template.content)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="bg-muted/50 p-3 rounded text-sm whitespace-pre-line max-h-40 overflow-y-auto">
                  {template.content}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* UTM Builder */}
      <Card>
        <CardHeader>
          <CardTitle>UTM Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add UTM parameters to track which campaigns perform best.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="utm_source">Source</Label>
              <Input 
                id="utm_source"
                placeholder="e.g. facebook, email, linkedin"
              />
            </div>
            <div>
              <Label htmlFor="utm_medium">Medium</Label>
              <Input 
                id="utm_medium"
                placeholder="e.g. post, story, newsletter"
              />
            </div>
            <div>
              <Label htmlFor="utm_campaign">Campaign</Label>
              <Input 
                id="utm_campaign"
                placeholder="e.g. q1_promo, webinar_follow"
              />
            </div>
            <div>
              <Label htmlFor="utm_content">Content</Label>
              <Input 
                id="utm_content"
                placeholder="e.g. banner_a, text_link"
              />
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded font-mono text-sm">
            https://circle.example.com/pro?aff=yourcode&utm_source=&utm_medium=&utm_campaign=&utm_content=
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="font-semibold">Focus on ROI stories</p>
                <p className="text-sm text-muted-foreground">
                  Agents care about tools that make them money. Lead with results.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="font-semibold">Use social proof</p>
                <p className="text-sm text-muted-foreground">
                  Mention that 2,500+ agents already use Circle Pro.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="font-semibold">Address the pain point</p>
                <p className="text-sm text-muted-foreground">
                  Agents waste money on tools that don't work. Circle solves that.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};