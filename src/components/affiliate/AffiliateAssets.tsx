import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Download, 
  Image, 
  FileText, 
  Copy, 
  Mail,
  MessageSquare,
  ExternalLink,
  Palette,
  Link,
  Video,
  Target,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";

export const AffiliateAssets = () => {
  const [utmParams, setUtmParams] = useState({
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: ""
  });
  
  const [baseUrl, setBaseUrl] = useState("https://circle.realestate/pro");
  const [affiliateCode] = useState("YOURCODE"); // This would come from user's profile

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadAsset = (assetName: string, assetUrl: string) => {
    // Create download link
    const link = document.createElement('a');
    link.href = assetUrl;
    link.download = assetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${assetName} download started`);
  };

  const generateTrackingUrl = () => {
    const url = new URL(baseUrl);
    url.searchParams.set('aff', affiliateCode);
    
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value.trim()) {
        url.searchParams.set(`utm_${key}`, value.trim());
      }
    });
    
    return url.toString();
  };

  const banners = [
    {
      name: "Circle Pro Hero Banner",
      size: "728x90",
      type: "Pro Membership",
      description: "Main promotional banner for Circle Pro",
      url: "/api/placeholder/728/90",
      format: "PNG"
    },
    {
      name: "Circle Pro Square",
      size: "400x400", 
      type: "Social Media",
      description: "Perfect for Instagram and Facebook posts",
      url: "/api/placeholder/400/400",
      format: "PNG"
    },
    {
      name: "Mobile Banner",
      size: "320x50",
      type: "Mobile",
      description: "Mobile-optimized banner for apps",
      url: "/api/placeholder/320/50",
      format: "PNG"
    },
    {
      name: "Leaderboard",
      size: "728x250",
      type: "Website",
      description: "Large banner for website headers",
      url: "/api/placeholder/728/250",
      format: "PNG"
    },
    {
      name: "Story Template",
      size: "1080x1920",
      type: "Stories",
      description: "Instagram/Facebook Stories template",
      url: "/api/placeholder/1080/1920",
      format: "PNG"
    },
    {
      name: "LinkedIn Cover",
      size: "1584x396",
      type: "LinkedIn",
      description: "LinkedIn company page cover",
      url: "/api/placeholder/1584/396",
      format: "PNG"
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
      title: "Social Media Post - ROI Focus",
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
      title: "LinkedIn Personal Message",
      type: "LinkedIn",
      content: `Hi [Name],

I noticed you're focused on growing your real estate business. I wanted to share Circle Pro - it's what the top 1% of agents use to find and track ROI-proven tools.

Instead of guessing which software works, Circle Pro gives you access to a curated marketplace where everything's already been tested by successful agents.

Worth checking out if you're serious about scaling: [Your link]

Would love to hear what you think!`
    },
    {
      title: "Short Social Post",
      type: "Social",
      content: `Tired of buying real estate tools that don't work? 

Circle Pro = Only vetted, ROI-proven tools used by 2,500+ top agents.

$97/month. No guesswork. Just results.

[Your link]

#RealEstate #Productivity`
    },
    {
      title: "Facebook Group Post",
      type: "Facebook",
      content: `Hey everyone! 👋

Been getting lots of DMs about which tools actually work for scaling a real estate business.

Here's what I've learned: Most agents waste thousands on software that promises the world but delivers nothing.

Circle Pro solved this for me. It's a curated marketplace where every tool is pre-screened by successful agents. Plus you get:

• ROI tracking on everything
• Academy training from 7-figure agents  
• Direct access to industry experts
• Community of 2,500+ top performers

$97/month vs. the thousands I used to waste on tools that didn't work.

Check it out: [Your link]

What tools have you had success with?`
    },
    {
      title: "Video Script",
      type: "Video",
      content: `HOOK: "I wasted $50,000 on real estate tools before I found this..."

Hey agents, if you're tired of buying software that promises to transform your business but just drains your bank account, this video is for you.

I used to be that agent buying every new tool, course, and system that came out. CRMs, lead gen tools, marketing software - you name it, I bought it.

The problem? 90% of them didn't work. Or worse, they worked for someone else but not for my market, my clients, or my business model.

Then I discovered Circle Pro. Here's what makes it different:

Every single tool in their marketplace has been vetted by successful agents. Not just any agents - agents doing $100K, $200K, even $500K+ in commission annually.

You get ROI tracking on everything, so you know exactly what's working and what's not.

Plus academy training from the agents who actually use these tools successfully.

It's $97 a month, which sounds like a lot until you realize it'll save you thousands on tools that don't work.

2,500+ agents are already using it. Link in my bio if you want to check it out.

What's the worst tool purchase you've ever made? Let me know in the comments.`
    }
  ];

  const emailSequences = [
    {
      title: "5-Day Welcome Series",
      description: "Nurture new leads with value-first approach",
      emails: [
        "Day 1: Welcome + First Quick Win",
        "Day 2: ROI Calculator Tool",
        "Day 3: Case Study - Agent Success Story", 
        "Day 4: Common Mistakes to Avoid",
        "Day 5: Special Offer + Social Proof"
      ]
    },
    {
      title: "Objection Handler Sequence",
      description: "Address common concerns about Circle Pro",
      emails: [
        "Too Expensive? Here's the ROI Breakdown",
        "Don't Have Time? Here's How to Get Started in 15 Minutes",
        "Already Have Tools? Here's Why You Still Need This"
      ]
    }
  ];

  const socialProofElements = [
    {
      metric: "2,500+",
      label: "Active Members",
      description: "Top-performing agents using Circle Pro daily"
    },
    {
      metric: "127%",
      label: "Average ROI",
      description: "Members see positive returns within 90 days"
    },
    {
      metric: "$50K+",
      label: "Avg Commission Increase",
      description: "Annual increase for active Circle Pro users"
    },
    {
      metric: "4.9/5",
      label: "Member Rating",
      description: "Based on 500+ member reviews"
    }
  ];


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
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-32 rounded mb-3 flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={banner.url} 
                    alt={banner.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const fallback = img.nextElementSibling as HTMLElement;
                      img.style.display = 'none';
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" style={{display: 'none'}}>
                    <Palette className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{banner.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{banner.size}</Badge>
                  <Badge variant="secondary">{banner.type}</Badge>
                  <Badge variant="outline" className="text-xs">{banner.format}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {banner.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => downloadAsset(banner.name, banner.url)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {banner.format}
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
                      {template.type === 'Facebook' && <Users className="w-3 h-3 mr-1" />}
                      {template.type === 'Video' && <Video className="w-3 h-3 mr-1" />}
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

      {/* Email Sequences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Sequences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {emailSequences.map((sequence, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{sequence.title}</h3>
                    <p className="text-sm text-muted-foreground">{sequence.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(sequence.emails.join('\n\n'))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All
                  </Button>
                </div>
                <div className="space-y-2">
                  {sequence.emails.map((email, emailIndex) => (
                    <div key={emailIndex} className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm">
                      <span>{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(email)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Proof Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Social Proof Elements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use these verified stats and testimonials in your marketing.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {socialProofElements.map((element, index) => (
              <div key={index} className="border rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{element.metric}</div>
                <div className="font-semibold mb-2">{element.label}</div>
                <div className="text-sm text-muted-foreground">{element.description}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(`${element.metric} ${element.label} - ${element.description}`)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h4 className="font-semibold">Ready-to-Use Testimonials</h4>
            <div className="space-y-3">
              {[
                '"Circle Pro saved me $15K in the first 6 months by helping me avoid tools that don\'t work." - Sarah M., Top 1% Agent',
                '"I went from $80K to $200K annual commission using the vetted tools in Circle Pro." - Mike R., Team Leader',
                '"Finally, a marketplace where every tool actually delivers ROI. Game changer." - Lisa P., Million Dollar Producer'
              ].map((testimonial, index) => (
                <div key={index} className="flex items-start justify-between bg-muted/30 p-3 rounded">
                  <p className="text-sm italic flex-1">{testimonial}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(testimonial)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UTM Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            UTM Link Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Build trackable links to measure campaign performance and optimize your marketing.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input 
                id="base_url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://circle.realestate/pro"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="utm_source">Source *</Label>
                <Input 
                  id="utm_source"
                  value={utmParams.source}
                  onChange={(e) => setUtmParams({...utmParams, source: e.target.value})}
                  placeholder="facebook, email, linkedin, youtube"
                />
                <p className="text-xs text-muted-foreground mt-1">Where traffic originates</p>
              </div>
              <div>
                <Label htmlFor="utm_medium">Medium *</Label>
                <Input 
                  id="utm_medium"
                  value={utmParams.medium}
                  onChange={(e) => setUtmParams({...utmParams, medium: e.target.value})}
                  placeholder="post, story, newsletter, video"
                />
                <p className="text-xs text-muted-foreground mt-1">Marketing medium</p>
              </div>
              <div>
                <Label htmlFor="utm_campaign">Campaign</Label>
                <Input 
                  id="utm_campaign"
                  value={utmParams.campaign}
                  onChange={(e) => setUtmParams({...utmParams, campaign: e.target.value})}
                  placeholder="q1_promo, webinar_follow, new_launch"
                />
                <p className="text-xs text-muted-foreground mt-1">Specific campaign name</p>
              </div>
              <div>
                <Label htmlFor="utm_content">Content</Label>
                <Input 
                  id="utm_content"
                  value={utmParams.content}
                  onChange={(e) => setUtmParams({...utmParams, content: e.target.value})}
                  placeholder="banner_a, text_link, cta_button"
                />
                <p className="text-xs text-muted-foreground mt-1">Specific ad/content</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="utm_term">Term (Optional)</Label>
                <Input 
                  id="utm_term"
                  value={utmParams.term}
                  onChange={(e) => setUtmParams({...utmParams, term: e.target.value})}
                  placeholder="real estate tools, agent software"
                />
                <p className="text-xs text-muted-foreground mt-1">Keywords for paid search</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Generated Tracking URL</Label>
            <div className="bg-muted/50 p-3 rounded border">
              <code className="text-sm break-all">{generateTrackingUrl()}</code>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateTrackingUrl())}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  setUtmParams({source: "", medium: "", campaign: "", content: "", term: ""});
                  toast.success("UTM fields cleared");
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="font-semibold mb-3">Quick UTM Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                {label: "Facebook Post", source: "facebook", medium: "post"},
                {label: "Instagram Story", source: "instagram", medium: "story"},
                {label: "LinkedIn Article", source: "linkedin", medium: "article"},
                {label: "Email Newsletter", source: "email", medium: "newsletter"},
                {label: "YouTube Video", source: "youtube", medium: "video"},
                {label: "Twitter Tweet", source: "twitter", medium: "tweet"},
                {label: "Blog Post", source: "blog", medium: "referral"},
                {label: "Podcast Mention", source: "podcast", medium: "audio"}
              ].map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setUtmParams({
                    ...utmParams,
                    source: preset.source,
                    medium: preset.medium
                  })}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Tips & Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Marketing Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Conversion Tips
              </h4>
              <div className="space-y-3">
                {[
                  {
                    title: "Lead with ROI, not features",
                    tip: "Agents care about tools that make them money. Start with '$50K commission increase' not 'CRM features'."
                  },
                  {
                    title: "Use specific success stories",
                    tip: "Instead of 'helps agents succeed', use 'Sarah went from $80K to $200K annual commission'."
                  },
                  {
                    title: "Address the pain point first",
                    tip: "Start with 'Tired of wasting money on tools that don't work?' before introducing Circle Pro."
                  },
                  {
                    title: "Include social proof early",
                    tip: "Mention '2,500+ agents' and specific metrics within the first few sentences."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Platform-Specific Strategies
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    platform: "Facebook Groups",
                    strategy: "Share personal stories, ask questions to engage community, provide value first"
                  },
                  {
                    platform: "LinkedIn",
                    strategy: "Professional tone, industry insights, connect with agents personally before pitching"
                  },
                  {
                    platform: "Instagram",
                    strategy: "Visual content, behind-the-scenes, Stories for quick tips, Reels for reach"
                  },
                  {
                    platform: "Email",
                    strategy: "Value-first sequences, segment by experience level, include clear CTAs"
                  },
                  {
                    platform: "YouTube",
                    strategy: "Tutorial content, tool reviews, agent interviews, optimize for search"
                  },
                  {
                    platform: "TikTok",
                    strategy: "Quick tips, day-in-the-life content, trending sounds, authentic approach"
                  }
                ].map((item, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-2">{item.platform}</h5>
                    <p className="text-xs text-muted-foreground">{item.strategy}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Quick Copy Templates</h4>
              <div className="space-y-2">
                {[
                  "Stop wasting money on [tool category] that doesn't work",
                  "What [successful metric] agents do differently", 
                  "The [number] tools every top agent uses",
                  "How to [achieve result] without [common pain point]",
                  "Why [number]% of agents fail at [common goal]"
                ].map((template, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm">
                    <span className="italic">{template}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(template)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};