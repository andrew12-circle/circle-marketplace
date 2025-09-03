import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Copy,
  ExternalLink,
  TrendingUp
} from "lucide-react";

interface SocialSharingToolsProps {
  affiliateCode: string;
  baseUrls?: {
    pro: string;
    marketplace: string;
    academy: string;
  };
}

export const SocialSharingTools = ({ 
  affiliateCode, 
  baseUrls = {
    pro: "https://circle.realestate/pro",
    marketplace: "https://circle.realestate/marketplace", 
    academy: "https://circle.realestate/academy"
  }
}: SocialSharingToolsProps) => {
  const [customMessage, setCustomMessage] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
  const { toast } = useToast();

  const socialTemplates = {
    facebook: {
      icon: Facebook,
      name: "Facebook",
      template: "🏠 Real estate agents: Stop wasting money on tools that don't work!\n\nCircle Pro gives you ONLY the vetted, ROI-proven tools that top agents use to build $100K+ businesses.\n\n✅ Pre-screened marketplace\n✅ Academy training  \n✅ ROI tracking\n✅ Expert access\n\n$97/month. Zero guesswork.\n\nSee what 2,500+ agents use daily: [LINK]\n\n#RealEstate #CirclePro #AgentTools",
      shareUrl: (url: string, text: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    },
    twitter: {
      icon: Twitter,
      name: "Twitter/X",
      template: "🏠 Stop wasting money on real estate tools that don't work!\n\nCircle Pro = Only vetted, ROI-proven tools used by 2,500+ top agents.\n\n$97/month. No guesswork. Just results.\n\n[LINK]\n\n#RealEstate #Productivity",
      shareUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    },
    linkedin: {
      icon: Linkedin,
      name: "LinkedIn",
      template: "Fellow real estate professionals,\n\nI wanted to share something that's been transforming how top agents build their businesses - Circle Pro.\n\nInstead of guessing which tools work, Circle Pro gives you access to a curated marketplace where everything's already been tested by successful agents.\n\nYou get:\n• ROI tracking on every tool\n• Academy training from 7-figure agents\n• Direct access to industry experts\n• Community of 2,500+ top performers\n\n$97/month vs. the thousands we used to waste on tools that didn't work.\n\nWorth checking out if you're serious about scaling: [LINK]\n\n#RealEstate #PropTech #AgentSuccess",
      shareUrl: (url: string, text: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`
    },
    instagram: {
      icon: Instagram,
      name: "Instagram",
      template: "🏠 REAL ESTATE AGENTS 🏠\n\nTired of buying tools that promise everything but deliver nothing?\n\nCircle Pro = Only vetted tools that actually work ✅\n\n2,500+ top agents can't be wrong 📈\n\n$97/month | Zero guesswork | Real results\n\nLink in bio 👆\n\n#RealEstate #AgentLife #PropTech #Productivity #Success",
      shareUrl: (url: string, text: string) => `https://www.instagram.com/` // Instagram doesn't support direct sharing
    },
    whatsapp: {
      icon: MessageCircle,
      name: "WhatsApp",
      template: "Hey! 👋\n\nI found something that's been a game-changer for real estate agents.\n\nCircle Pro gives you access to ONLY the tools that actually work - everything's pre-screened by successful agents.\n\nNo more wasting money on software that promises the world but delivers nothing.\n\nCheck it out: [LINK]\n\nWorth a look if you're serious about growing your business! 🚀",
      shareUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text.replace('[LINK]', url))}`
    },
    email: {
      icon: Mail,
      name: "Email",
      template: "Subject: The tool that's transforming real estate careers\n\nHi [Name],\n\nI wanted to share something that's been a game-changer for the top agents I work with - Circle Pro.\n\nIt's a $97/month platform that gives agents everything they need to build a $100K+ business:\n\n• Curated marketplace of vetted tools\n• ROI tracking on every purchase\n• Exclusive academy content\n• Direct access to industry experts\n\nWhat I love most is that every tool is pre-screened for results. No more wasting money on software that doesn't deliver.\n\nWant to see what 2,500+ top agents use daily?\n\n[LINK]\n\nBest,\n[Your name]",
      shareUrl: (url: string, text: string) => `mailto:?subject=${encodeURIComponent('The tool that\'s transforming real estate careers')}&body=${encodeURIComponent(text.replace('[LINK]', url))}`
    }
  };

  const generateTrackingUrl = (destination: keyof typeof baseUrls, platform: string, contentType: string = 'social_post') => {
    const url = new URL(baseUrls[destination]);
    url.searchParams.set('aff', affiliateCode);
    url.searchParams.set('utm_source', platform);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'affiliate_share');
    url.searchParams.set('utm_content', contentType);
    return url.toString();
  };

  const shareToSocial = async (platform: string, destination: keyof typeof baseUrls = 'pro') => {
    const template = socialTemplates[platform as keyof typeof socialTemplates];
    if (!template) return;

    const trackingUrl = generateTrackingUrl(destination, platform);
    const message = customMessage || template.template;
    const finalMessage = message.replace('[LINK]', trackingUrl);

    // Log the share attempt
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (affiliate) {
          await supabase.from('affiliate_social_shares').insert({
            affiliate_id: affiliate.id,
            platform,
            content_type: 'social_post',
            share_url: trackingUrl,
            tracking_parameters: {
              utm_source: platform,
              utm_medium: 'social',
              utm_campaign: 'affiliate_share',
              destination
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to log social share:', error);
    }

    // Open share URL
    if (template.shareUrl) {
      const shareUrl = template.shareUrl(trackingUrl, finalMessage);
      window.open(shareUrl, '_blank', 'width=600,height=400');
    } else {
      // For platforms without direct sharing (like Instagram), copy to clipboard
      navigator.clipboard.writeText(finalMessage);
      toast({
        title: "Content Copied!",
        description: `${platform} post copied to clipboard. Paste it in your ${platform} app.`,
      });
    }
  };

  const copyMessage = (platform: string) => {
    const template = socialTemplates[platform as keyof typeof socialTemplates];
    const trackingUrl = generateTrackingUrl('pro', platform);
    const message = template.template.replace('[LINK]', trackingUrl);
    
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied!",
      description: `${platform} template copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Social Media Sharing Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Platform Selection */}
            <div>
              <Label className="text-base font-semibold">Choose Platform</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                {Object.entries(socialTemplates).map(([key, platform]) => {
                  const IconComponent = platform.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedPlatform === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPlatform(key)}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs">{platform.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <Label className="text-base font-semibold">Message Preview</Label>
              <div className="mt-2 p-4 bg-muted/50 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">
                    {socialTemplates[selectedPlatform as keyof typeof socialTemplates]?.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyMessage(selectedPlatform)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-line max-h-40 overflow-y-auto">
                  {(customMessage || socialTemplates[selectedPlatform as keyof typeof socialTemplates]?.template || "")
                    .replace('[LINK]', generateTrackingUrl('pro', selectedPlatform))}
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <Label htmlFor="custom-message" className="text-base font-semibold">
                Custom Message (Optional)
              </Label>
              <textarea
                id="custom-message"
                placeholder="Leave blank to use the default template, or customize your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full mt-2 p-3 border rounded-md resize-none"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use [LINK] in your message where you want the tracking link to appear
              </p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => shareToSocial(selectedPlatform, 'pro')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Share Circle Pro
              </Button>
              <Button 
                variant="outline"
                onClick={() => shareToSocial(selectedPlatform, 'marketplace')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Share Marketplace
              </Button>
              <Button 
                variant="outline"
                onClick={() => shareToSocial(selectedPlatform, 'academy')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Share Academy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Share Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {(['pro', 'marketplace', 'academy'] as const).map((destination) => {
              const url = generateTrackingUrl(destination, 'direct_share', 'quick_link');
              return (
                <div key={destination} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium capitalize">{destination} Link</p>
                    <p className="text-sm text-muted-foreground break-all">{url}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast({ title: "Copied!", description: `${destination} link copied to clipboard` });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};