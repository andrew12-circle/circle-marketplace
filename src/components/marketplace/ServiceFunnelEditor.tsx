import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ServiceImageUpload } from './ServiceImageUpload';
import { FunnelMediaUpload } from './FunnelMediaUpload';
import { 
  Star, 
  TrendingUp, 
  Users, 
  Target,
  Zap,
  Trophy,
  Building,
  Plus,
  X,
  Upload,
  Video,
  Image as ImageIcon,
  FileText,
  Monitor,
  Smartphone,
  DollarSign,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Grip,
  Shield,
  Award,
  Phone,
  Mail,
  Globe,
  Clock,
  Crown,
  ExternalLink,
  ShoppingCart,
  Eye,
  Code,
  Verified,
  Maximize2
} from 'lucide-react';
import { ServiceFunnelModal } from './ServiceFunnelModal';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  popular: boolean;
  proOnly?: boolean;
  savings?: string;
}

interface ThumbnailItem {
  id: string;
  label: string;
  icon: string;
  mediaUrl?: string;
  description?: string;
}

interface FunnelContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  estimatedRoi: number;
  duration: string;
  
  whyChooseUs: {
    title: string;
    benefits: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  
  media: MediaItem[];
  
  packages: Package[];

  thumbnailGallery: {
    enabled: boolean;
    title: string;
    items: ThumbnailItem[];
  };

  roiCalculator: {
    enabled: boolean;
    title: string;
    currentMonthlyClosings: number;
    averageCommission: number;
    increasePercentage: number;
    calculatedAdditionalIncome: number;
    calculatedAnnualIncrease: number;
  };

  testimonialCards: {
    enabled: boolean;
    title: string;
    cards: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
      timeAgo: string;
      borderColor: string;
      iconColor: string;
      icon: string;
    }[];
  };

  urgencySection: {
    enabled: boolean;
    title: string;
    message: string;
    spotsRemaining: number;
    totalSpots: number;
  };
  
  socialProof: {
    testimonials: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
    }[];
    stats: {
      label: string;
      value: string;
    }[];
  };

  trustIndicators: {
    guarantee: string;
    cancellation: string;
    certification: string;
  };

  callToAction: {
    primaryHeadline: string;
    primaryDescription: string;
    primaryButtonText: string;
    secondaryHeadline: string;
    secondaryDescription: string;
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
  };

  urgency: {
    enabled: boolean;
    message: string;
  };

  customHtml?: string;
  useCustomHtml?: boolean;
}

interface ServiceFunnelEditorProps {
  funnelContent: FunnelContent;
  onChange: (content: FunnelContent) => void;
}

export const ServiceFunnelEditor = ({ funnelContent, onChange }: ServiceFunnelEditorProps) => {
  const [activeTab, setActiveTab] = useState('hero');
  const [showAgentView, setShowAgentView] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'html'>('visual');
  const [customHtml, setCustomHtml] = useState(funnelContent.customHtml || '');
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);

  const updateContent = (path: string, value: any) => {
    const keys = path.split('.');
    const newContent = { ...funnelContent };
    let current: any = newContent;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onChange(newContent);
  };

  const handleMediaUploaded = (mediaUrls: string[]) => {
    setUploadedMediaUrls(mediaUrls);
    const mediaItems: MediaItem[] = mediaUrls.map((url, index) => ({
      id: `media-${Date.now()}-${index}`,
      type: url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm') ? 'video' : 'image',
      url,
      title: `Media ${index + 1}`,
      description: ''
    }));
    updateContent('media', [...funnelContent.media, ...mediaItems]);
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const enterFullscreen = () => {
    const el: any = previewRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const defaultHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Service Funnel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
        }
        .hero { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 80px 20px; 
            text-align: center; 
        }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
        .hero p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .pricing { padding: 80px 20px; background: #f8fafc; }
        .pricing h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
        .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .tier { 
            background: white; 
            border: 2px solid #e5e7eb; 
            border-radius: 12px; 
            padding: 2rem; 
            text-align: center;
            position: relative;
            transition: transform 0.3s ease;
        }
        .tier:hover { transform: translateY(-5px); }
        .tier.popular { 
            border-color: #3b82f6; 
            transform: scale(1.05); 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .tier.popular::before {
            content: 'Most Popular';
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: #3b82f6;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .tier h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .tier .price { font-size: 3rem; font-weight: 700; color: #3b82f6; margin: 1rem 0; }
        .tier .price small { font-size: 1rem; color: #6b7280; }
        .tier ul { list-style: none; margin: 2rem 0; text-align: left; }
        .tier li { padding: 0.5rem 0; display: flex; align-items: center; }
        .tier li::before { 
            content: '✓'; 
            color: #10b981; 
            font-weight: bold; 
            margin-right: 0.5rem; 
        }
        .cta-button { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 1rem 2rem; 
            border-radius: 8px; 
            font-size: 1.1rem; 
            font-weight: 600; 
            cursor: pointer; 
            width: 100%;
            transition: background 0.3s ease;
        }
        .cta-button:hover { background: #2563eb; }
        .tier.popular .cta-button { background: #1d4ed8; }
        .features { padding: 80px 20px; }
        .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
        .feature { text-align: center; padding: 2rem; }
        .feature-icon { 
            width: 60px; 
            height: 60px; 
            background: #3b82f6; 
            border-radius: 50%; 
            margin: 0 auto 1rem; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 1.5rem; 
            color: white; 
        }
        .testimonials { padding: 80px 20px; background: #1f2937; color: white; }
        .testimonials h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
        .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .testimonial { 
            background: #374151; 
            padding: 2rem; 
            border-radius: 12px; 
        }
        .testimonial-content { font-style: italic; margin-bottom: 1rem; }
        .testimonial-author { font-weight: 600; }
        .stars { color: #fbbf24; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Transform Your Business Today</h1>
            <p>Professional service that delivers real results for your success</p>
            <button class="cta-button" style="max-width: 300px;">Get Started Now</button>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features">
        <div class="container">
            <h2>Why Choose Our Service</h2>
            <div class="feature-grid">
                <div class="feature">
                    <div class="feature-icon">🚀</div>
                    <h3>Fast Results</h3>
                    <p>See improvements in your business within 30 days</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">💡</div>
                    <h3>Expert Guidance</h3>
                    <p>Work with industry professionals who know what works</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📈</div>
                    <h3>Proven ROI</h3>
                    <p>Average 3x return on investment for our clients</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section class="pricing">
        <div class="container">
            <h2>Choose Your Plan</h2>
            <div class="tiers">
                <div class="tier">
                    <h3>Basic</h3>
                    <div class="price">$99<small>/mo</small></div>
                    <ul>
                        <li>Core Features</li>
                        <li>Email Support</li>
                        <li>Basic Analytics</li>
                        <li>30-Day Trial</li>
                    </ul>
                    <button class="cta-button">Get Started</button>
                </div>
                
                <div class="tier popular">
                    <h3>Professional</h3>
                    <div class="price">$199<small>/mo</small></div>
                    <ul>
                        <li>All Basic Features</li>
                        <li>Priority Support</li>
                        <li>Advanced Analytics</li>
                        <li>Custom Integrations</li>
                        <li>Dedicated Account Manager</li>
                    </ul>
                    <button class="cta-button">Choose Professional</button>
                </div>
                
                <div class="tier">
                    <h3>Enterprise</h3>
                    <div class="price">$399<small>/mo</small></div>
                    <ul>
                        <li>All Professional Features</li>
                        <li>24/7 Phone Support</li>
                        <li>Custom Development</li>
                        <li>White-label Options</li>
                        <li>SLA Guarantee</li>
                    </ul>
                    <button class="cta-button">Contact Sales</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials">
        <div class="container">
            <h2>What Our Clients Say</h2>
            <div class="testimonial-grid">
                <div class="testimonial">
                    <div class="stars">★★★★★</div>
                    <div class="testimonial-content">
                        "This service completely transformed how we operate. The results were immediate and impressive."
                    </div>
                    <div class="testimonial-author">Sarah Johnson, CEO at TechCorp</div>
                </div>
                <div class="testimonial">
                    <div class="stars">★★★★★</div>
                    <div class="testimonial-content">
                        "Professional, reliable, and effective. Couldn't ask for better service and support."
                    </div>
                    <div class="testimonial-author">Mike Chen, Founder at StartupXYZ</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Final CTA -->
    <section class="hero" style="padding: 60px 20px;">
        <div class="container">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of satisfied customers who transformed their business</p>
            <button class="cta-button" style="max-width: 400px; margin-top: 1rem;">Start Your Journey Today</button>
        </div>
    </section>
</body>
</html>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Service Funnel</h2>
          <p className="text-muted-foreground">Design what agents see when they click your service</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={editMode === 'visual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('visual')}
            >
              Visual Editor
            </Button>
            <Button
              variant={editMode === 'html' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('html')}
            >
              <Code className="w-4 h-4 mr-2" />
              HTML Editor
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAgentView(!showAgentView)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showAgentView ? 'Edit Mode' : 'Preview'}
          </Button>
        </div>
      </div>

      {editMode === 'html' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* HTML Editor */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Custom HTML Editor
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create your complete funnel page with HTML, CSS, and inline styles
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={funnelContent.useCustomHtml || false}
                      onCheckedChange={(checked) => {
                        updateContent('useCustomHtml', checked);
                        if (!checked) {
                          updateContent('customHtml', '');
                          setCustomHtml('');
                        } else if (!customHtml) {
                          setCustomHtml(defaultHtmlTemplate);
                          updateContent('customHtml', defaultHtmlTemplate);
                        }
                      }}
                    />
                    <Label>Use custom HTML instead of visual editor</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomHtml(defaultHtmlTemplate);
                      updateContent('customHtml', defaultHtmlTemplate);
                    }}
                  >
                    Load Template
                  </Button>
                </div>
                
                {(funnelContent.useCustomHtml || false) && (
                  <div className="space-y-2">
                    <Label>Custom HTML Code</Label>
                    <Textarea
                      value={customHtml}
                      onChange={(e) => {
                        setCustomHtml(e.target.value);
                        updateContent('customHtml', e.target.value);
                      }}
                      placeholder="Paste your HTML code here..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                        💡 Pro Tips:
                      </p>
                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Include complete HTML with head and body tags</li>
                        <li>• Use inline CSS or style tags for styling</li>
                        <li>• Make it responsive with mobile-first design</li>
                        <li>• Include clear call-to-action buttons</li>
                        <li>• Add your pricing tiers and features</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* HTML Preview */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={showAgentView ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setShowAgentView(false)}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={showAgentView ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAgentView(true)}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
              {(funnelContent.useCustomHtml && customHtml) ? (
                <div className={`border rounded-lg overflow-hidden bg-white ${showAgentView ? 'max-w-sm mx-auto' : ''}`}>
                  <iframe
                    srcDoc={customHtml}
                    className={`border-0 ${showAgentView ? 'w-full h-[600px]' : 'w-full h-[800px]'}`}
                    title="HTML Preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Enable custom HTML to see preview</p>
                    <p className="text-sm text-muted-foreground">Toggle the switch above to start editing</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Editor */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Visual Editor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit your funnel content with an intuitive visual interface
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden max-h-[calc(100vh-240px)]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex">
                {/* Vertical Navigation Sidebar */}
                <div className="w-48 border-r border-border pr-4 mr-4 overflow-y-auto">
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveTab('hero')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'hero' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Crown className="w-4 h-4" />
                      Hero Section
                    </button>
                    <button
                      onClick={() => setActiveTab('benefits')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'benefits' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      Benefits
                    </button>
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'pricing' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Pricing
                    </button>
                    <button
                      onClick={() => setActiveTab('social')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'social' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Social Proof
                    </button>
                    <button
                      onClick={() => setActiveTab('trust')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'trust' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      Trust & Contact
                    </button>
                    <button
                      onClick={() => setActiveTab('cta')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'cta' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      Call to Action
                    </button>
                    <button
                      onClick={() => setActiveTab('thumbnails')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'thumbnails' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Thumbnails
                    </button>
                    <button
                      onClick={() => setActiveTab('roi')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'roi' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      ROI Calculator
                    </button>
                    <button
                      onClick={() => setActiveTab('testimonials')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'testimonials' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      Testimonials
                    </button>
                    <button
                      onClick={() => setActiveTab('media')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'media' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Media
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-300px)] scrollbar-thin scrollbar-thumb-muted scrollbar-track-background">
                
                <TabsContent value="hero" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={funnelContent.headline}
                        onChange={(e) => updateContent('headline', e.target.value)}
                        placeholder="Your compelling headline"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subheadline">Subheadline</Label>
                      <Input
                        id="subheadline"
                        value={funnelContent.subheadline}
                        onChange={(e) => updateContent('subheadline', e.target.value)}
                        placeholder="Supporting subheadline"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heroDescription">Description</Label>
                      <Textarea
                        id="heroDescription"
                        value={funnelContent.heroDescription}
                        onChange={(e) => updateContent('heroDescription', e.target.value)}
                        placeholder="Describe your service value proposition"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="estimatedRoi">Estimated ROI (%)</Label>
                        <Input
                          id="estimatedRoi"
                          type="number"
                          value={funnelContent.estimatedRoi}
                          onChange={(e) => updateContent('estimatedRoi', parseInt(e.target.value) || 0)}
                          placeholder="300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          value={funnelContent.duration}
                          onChange={(e) => updateContent('duration', e.target.value)}
                          placeholder="30 days"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="benefits" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="whyChooseTitle">Section Title</Label>
                    <Input
                      id="whyChooseTitle"
                      value={funnelContent.whyChooseUs.title}
                      onChange={(e) => updateContent('whyChooseUs.title', e.target.value)}
                      placeholder="Why Choose Us"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Benefits</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newBenefit = {
                            icon: 'Star',
                            title: 'New Benefit',
                            description: 'Benefit description'
                          };
                          updateContent('whyChooseUs.benefits', [...funnelContent.whyChooseUs.benefits, newBenefit]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Benefit
                      </Button>
                    </div>
                    {funnelContent.whyChooseUs.benefits.map((benefit, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Benefit {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newBenefits = funnelContent.whyChooseUs.benefits.filter((_, i) => i !== index);
                                updateContent('whyChooseUs.benefits', newBenefits);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            value={benefit.title}
                            onChange={(e) => {
                              const newBenefits = [...funnelContent.whyChooseUs.benefits];
                              newBenefits[index].title = e.target.value;
                              updateContent('whyChooseUs.benefits', newBenefits);
                            }}
                            placeholder="Benefit title"
                          />
                          <Textarea
                            value={benefit.description}
                            onChange={(e) => {
                              const newBenefits = [...funnelContent.whyChooseUs.benefits];
                              newBenefits[index].description = e.target.value;
                              updateContent('whyChooseUs.benefits', newBenefits);
                            }}
                            placeholder="Benefit description"
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Pricing Packages</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPackage: Package = {
                            id: `package-${Date.now()}`,
                            name: 'New Package',
                            description: 'Package description',
                            price: 99,
                            features: ['Feature 1', 'Feature 2'],
                            popular: false
                          };
                          updateContent('packages', [...funnelContent.packages, newPackage]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Package
                      </Button>
                    </div>
                    {funnelContent.packages.map((pkg, index) => (
                      <Card key={pkg.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Package {index + 1}</Label>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={pkg.popular}
                                  onCheckedChange={(checked) => {
                                    const newPackages = [...funnelContent.packages];
                                    newPackages[index].popular = checked;
                                    updateContent('packages', newPackages);
                                  }}
                                />
                                <Label className="text-sm">Popular</Label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newPackages = funnelContent.packages.filter((_, i) => i !== index);
                                  updateContent('packages', newPackages);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={pkg.name}
                              onChange={(e) => {
                                const newPackages = [...funnelContent.packages];
                                newPackages[index].name = e.target.value;
                                updateContent('packages', newPackages);
                              }}
                              placeholder="Package name"
                            />
                            <Input
                              type="number"
                              value={pkg.price}
                              onChange={(e) => {
                                const newPackages = [...funnelContent.packages];
                                newPackages[index].price = parseFloat(e.target.value) || 0;
                                updateContent('packages', newPackages);
                              }}
                              placeholder="Price"
                            />
                          </div>
                          <Textarea
                            value={pkg.description}
                            onChange={(e) => {
                              const newPackages = [...funnelContent.packages];
                              newPackages[index].description = e.target.value;
                              updateContent('packages', newPackages);
                            }}
                            placeholder="Package description"
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Testimonials</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Customer Reviews</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newTestimonial = {
                                id: `testimonial-${Date.now()}`,
                                name: 'John Doe',
                                role: 'Business Owner',
                                content: 'Great service!',
                                rating: 5
                              };
                              updateContent('socialProof.testimonials', [...funnelContent.socialProof.testimonials, newTestimonial]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Testimonial
                          </Button>
                        </div>
                        {funnelContent.socialProof.testimonials.map((testimonial, index) => (
                          <Card key={testimonial.id} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Testimonial {index + 1}</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newTestimonials = funnelContent.socialProof.testimonials.filter((_, i) => i !== index);
                                    updateContent('socialProof.testimonials', newTestimonials);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={testimonial.name}
                                  onChange={(e) => {
                                    const newTestimonials = [...funnelContent.socialProof.testimonials];
                                    newTestimonials[index].name = e.target.value;
                                    updateContent('socialProof.testimonials', newTestimonials);
                                  }}
                                  placeholder="Customer name"
                                />
                                <Input
                                  value={testimonial.role}
                                  onChange={(e) => {
                                    const newTestimonials = [...funnelContent.socialProof.testimonials];
                                    newTestimonials[index].role = e.target.value;
                                    updateContent('socialProof.testimonials', newTestimonials);
                                  }}
                                  placeholder="Customer role/title"
                                />
                              </div>
                              <Textarea
                                value={testimonial.content}
                                onChange={(e) => {
                                  const newTestimonials = [...funnelContent.socialProof.testimonials];
                                  newTestimonials[index].content = e.target.value;
                                  updateContent('socialProof.testimonials', newTestimonials);
                                }}
                                placeholder="Testimonial content"
                                rows={2}
                              />
                              <Input
                                type="number"
                                min="1"
                                max="5"
                                value={testimonial.rating}
                                onChange={(e) => {
                                  const newTestimonials = [...funnelContent.socialProof.testimonials];
                                  newTestimonials[index].rating = parseInt(e.target.value) || 5;
                                  updateContent('socialProof.testimonials', newTestimonials);
                                }}
                                placeholder="Rating (1-5)"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label>Statistics</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Success Stats</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newStat = {
                                label: 'New Stat',
                                value: '100+'
                              };
                              updateContent('socialProof.stats', [...funnelContent.socialProof.stats, newStat]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Stat
                          </Button>
                        </div>
                        {funnelContent.socialProof.stats.map((stat, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Stat {index + 1}</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newStats = funnelContent.socialProof.stats.filter((_, i) => i !== index);
                                    updateContent('socialProof.stats', newStats);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={stat.label}
                                  onChange={(e) => {
                                    const newStats = [...funnelContent.socialProof.stats];
                                    newStats[index].label = e.target.value;
                                    updateContent('socialProof.stats', newStats);
                                  }}
                                  placeholder="Stat label"
                                />
                                <Input
                                  value={stat.value}
                                  onChange={(e) => {
                                    const newStats = [...funnelContent.socialProof.stats];
                                    newStats[index].value = e.target.value;
                                    updateContent('socialProof.stats', newStats);
                                  }}
                                  placeholder="Stat value"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trust" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Trust Indicators</Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="guarantee">Money-Back Guarantee</Label>
                          <Input
                            id="guarantee"
                            value={funnelContent.trustIndicators.guarantee}
                            onChange={(e) => updateContent('trustIndicators.guarantee', e.target.value)}
                            placeholder="30-day money-back guarantee"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cancellation">Cancellation Policy</Label>
                          <Input
                            id="cancellation"
                            value={funnelContent.trustIndicators.cancellation}
                            onChange={(e) => updateContent('trustIndicators.cancellation', e.target.value)}
                            placeholder="Cancel anytime, no questions asked"
                          />
                        </div>
                        <div>
                          <Label htmlFor="certification">Certifications</Label>
                          <Input
                            id="certification"
                            value={funnelContent.trustIndicators.certification}
                            onChange={(e) => updateContent('trustIndicators.certification', e.target.value)}
                            placeholder="Certified by industry leaders"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label>Contact Information</Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={funnelContent.callToAction.contactInfo.phone}
                            onChange={(e) => updateContent('callToAction.contactInfo.phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            value={funnelContent.callToAction.contactInfo.email}
                            onChange={(e) => updateContent('callToAction.contactInfo.email', e.target.value)}
                            placeholder="contact@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={funnelContent.callToAction.contactInfo.website}
                            onChange={(e) => updateContent('callToAction.contactInfo.website', e.target.value)}
                            placeholder="www.example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cta" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="primaryHeadline">Primary CTA Headline</Label>
                      <Input
                        id="primaryHeadline"
                        value={funnelContent.callToAction.primaryHeadline}
                        onChange={(e) => updateContent('callToAction.primaryHeadline', e.target.value)}
                        placeholder="Ready to get started?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryDescription">Primary CTA Description</Label>
                      <Textarea
                        id="primaryDescription"
                        value={funnelContent.callToAction.primaryDescription}
                        onChange={(e) => updateContent('callToAction.primaryDescription', e.target.value)}
                        placeholder="Join thousands of satisfied customers"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryButtonText">Button Text</Label>
                      <Input
                        id="primaryButtonText"
                        value={funnelContent.callToAction.primaryButtonText}
                        onChange={(e) => updateContent('callToAction.primaryButtonText', e.target.value)}
                        placeholder="Get Started Now"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={funnelContent.urgency.enabled}
                          onCheckedChange={(checked) => updateContent('urgency.enabled', checked)}
                        />
                        <Label>Enable Urgency Message</Label>
                      </div>
                      {funnelContent.urgency.enabled && (
                        <Input
                          value={funnelContent.urgency.message}
                          onChange={(e) => updateContent('urgency.message', e.target.value)}
                          placeholder="Limited time offer - Act now!"
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="thumbnails" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Thumbnail Gallery</h3>
                        <p className="text-sm text-muted-foreground">Configure the thumbnail gallery section</p>
                      </div>
                      <Switch
                        checked={funnelContent.thumbnailGallery.enabled}
                        onCheckedChange={(checked) => updateContent('thumbnailGallery.enabled', checked)}
                      />
                    </div>

                    {funnelContent.thumbnailGallery.enabled && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="gallery-title">Section Title</Label>
                          <Input
                            id="gallery-title"
                            value={funnelContent.thumbnailGallery.title}
                            onChange={(e) => updateContent('thumbnailGallery.title', e.target.value)}
                            placeholder="What You'll Get"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Thumbnail Items</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItem = {
                                  id: Date.now().toString(),
                                  label: '',
                                  icon: 'star',
                                  mediaUrl: '',
                                  description: ''
                                };
                                updateContent('thumbnailGallery.items', [...funnelContent.thumbnailGallery.items, newItem]);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Item
                            </Button>
                          </div>

                          {funnelContent.thumbnailGallery.items.map((item, index) => (
                            <Card key={item.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Item {index + 1}</h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newItems = funnelContent.thumbnailGallery.items.filter((_, i) => i !== index);
                                      updateContent('thumbnailGallery.items', newItems);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>Label</Label>
                                    <Input
                                      value={item.label}
                                      onChange={(e) => {
                                        const newItems = [...funnelContent.thumbnailGallery.items];
                                        newItems[index] = { ...item, label: e.target.value };
                                        updateContent('thumbnailGallery.items', newItems);
                                      }}
                                      placeholder="Demo Video"
                                    />
                                  </div>
                                  <div>
                                    <Label>Icon</Label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      value={item.icon}
                                      onChange={(e) => {
                                        const newItems = [...funnelContent.thumbnailGallery.items];
                                        newItems[index] = { ...item, icon: e.target.value };
                                        updateContent('thumbnailGallery.items', newItems);
                                      }}
                                    >
                                      <option value="video">Video</option>
                                      <option value="chart">Chart</option>
                                      <option value="book">Book</option>
                                      <option value="trophy">Trophy</option>
                                      <option value="star">Star</option>
                                      <option value="target">Target</option>
                                      <option value="zap">Lightning</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <Label>Media URL (optional)</Label>
                                  <Input
                                    value={item.mediaUrl || ''}
                                    onChange={(e) => {
                                      const newItems = [...funnelContent.thumbnailGallery.items];
                                      newItems[index] = { ...item, mediaUrl: e.target.value };
                                      updateContent('thumbnailGallery.items', newItems);
                                    }}
                                    placeholder="https://..."
                                  />
                                </div>

                                <div>
                                  <Label>Description (optional)</Label>
                                  <Textarea
                                    value={item.description || ''}
                                    onChange={(e) => {
                                      const newItems = [...funnelContent.thumbnailGallery.items];
                                      newItems[index] = { ...item, description: e.target.value };
                                      updateContent('thumbnailGallery.items', newItems);
                                    }}
                                    placeholder="Brief description..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="roi" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">ROI Calculator</h3>
                        <p className="text-sm text-muted-foreground">Configure the ROI calculator section</p>
                      </div>
                      <Switch
                        checked={funnelContent.roiCalculator.enabled}
                        onCheckedChange={(checked) => updateContent('roiCalculator.enabled', checked)}
                      />
                    </div>

                    {funnelContent.roiCalculator.enabled && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="roi-title">Section Title</Label>
                          <Input
                            id="roi-title"
                            value={funnelContent.roiCalculator.title}
                            onChange={(e) => updateContent('roiCalculator.title', e.target.value)}
                            placeholder="ROI Calculator"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Current Monthly Closings</Label>
                            <Input
                              type="number"
                              value={funnelContent.roiCalculator.currentMonthlyClosings}
                              onChange={(e) => updateContent('roiCalculator.currentMonthlyClosings', Number(e.target.value))}
                              placeholder="3"
                            />
                          </div>
                          <div>
                            <Label>Average Commission ($)</Label>
                            <Input
                              type="number"
                              value={funnelContent.roiCalculator.averageCommission}
                              onChange={(e) => updateContent('roiCalculator.averageCommission', Number(e.target.value))}
                              placeholder="8500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Increase Percentage (%)</Label>
                            <Input
                              type="number"
                              value={funnelContent.roiCalculator.increasePercentage}
                              onChange={(e) => updateContent('roiCalculator.increasePercentage', Number(e.target.value))}
                              placeholder="150"
                            />
                          </div>
                          <div>
                            <Label>Additional Monthly Income ($)</Label>
                            <Input
                              type="number"
                              value={funnelContent.roiCalculator.calculatedAdditionalIncome}
                              onChange={(e) => updateContent('roiCalculator.calculatedAdditionalIncome', Number(e.target.value))}
                              placeholder="38250"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Annual Increase ($)</Label>
                          <Input
                            type="number"
                            value={funnelContent.roiCalculator.calculatedAnnualIncrease}
                            onChange={(e) => updateContent('roiCalculator.calculatedAnnualIncrease', Number(e.target.value))}
                            placeholder="459000"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="testimonials" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Testimonial Cards</h3>
                        <p className="text-sm text-muted-foreground">Configure the testimonial cards section</p>
                      </div>
                      <Switch
                        checked={funnelContent.testimonialCards.enabled}
                        onCheckedChange={(checked) => updateContent('testimonialCards.enabled', checked)}
                      />
                    </div>

                    {funnelContent.testimonialCards.enabled && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="testimonials-title">Section Title</Label>
                          <Input
                            id="testimonials-title"
                            value={funnelContent.testimonialCards.title}
                            onChange={(e) => updateContent('testimonialCards.title', e.target.value)}
                            placeholder="Recent Success Stories"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Testimonial Cards</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newCard = {
                                  id: Date.now().toString(),
                                  name: '',
                                  role: '',
                                  content: '',
                                  rating: 5,
                                  timeAgo: '1 week ago',
                                  borderColor: 'green',
                                  iconColor: 'green',
                                  icon: 'trending'
                                };
                                updateContent('testimonialCards.cards', [...funnelContent.testimonialCards.cards, newCard]);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Card
                            </Button>
                          </div>

                          {funnelContent.testimonialCards.cards.map((card, index) => (
                            <Card key={card.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Card {index + 1}</h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newCards = funnelContent.testimonialCards.cards.filter((_, i) => i !== index);
                                      updateContent('testimonialCards.cards', newCards);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>Name</Label>
                                    <Input
                                      value={card.name}
                                      onChange={(e) => {
                                        const newCards = [...funnelContent.testimonialCards.cards];
                                        newCards[index] = { ...card, name: e.target.value };
                                        updateContent('testimonialCards.cards', newCards);
                                      }}
                                      placeholder="John D."
                                    />
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <Input
                                      value={card.role}
                                      onChange={(e) => {
                                        const newCards = [...funnelContent.testimonialCards.cards];
                                        newCards[index] = { ...card, role: e.target.value };
                                        updateContent('testimonialCards.cards', newCards);
                                      }}
                                      placeholder="Keller Williams"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label>Content</Label>
                                  <Textarea
                                    value={card.content}
                                    onChange={(e) => {
                                      const newCards = [...funnelContent.testimonialCards.cards];
                                      newCards[index] = { ...card, content: e.target.value };
                                      updateContent('testimonialCards.cards', newCards);
                                    }}
                                    placeholder="Testimonial content..."
                                    rows={3}
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label>Rating</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="5"
                                      value={card.rating}
                                      onChange={(e) => {
                                        const newCards = [...funnelContent.testimonialCards.cards];
                                        newCards[index] = { ...card, rating: Number(e.target.value) };
                                        updateContent('testimonialCards.cards', newCards);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label>Time Ago</Label>
                                    <Input
                                      value={card.timeAgo}
                                      onChange={(e) => {
                                        const newCards = [...funnelContent.testimonialCards.cards];
                                        newCards[index] = { ...card, timeAgo: e.target.value };
                                        updateContent('testimonialCards.cards', newCards);
                                      }}
                                      placeholder="1 week ago"
                                    />
                                  </div>
                                  <div>
                                    <Label>Border Color</Label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      value={card.borderColor}
                                      onChange={(e) => {
                                        const newCards = [...funnelContent.testimonialCards.cards];
                                        newCards[index] = { ...card, borderColor: e.target.value };
                                        updateContent('testimonialCards.cards', newCards);
                                      }}
                                    >
                                      <option value="green">Green</option>
                                      <option value="blue">Blue</option>
                                      <option value="purple">Purple</option>
                                      <option value="orange">Orange</option>
                                      <option value="red">Red</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Urgency Section</h3>
                        <p className="text-sm text-muted-foreground">Configure the urgency section</p>
                      </div>
                      <Switch
                        checked={funnelContent.urgencySection.enabled}
                        onCheckedChange={(checked) => updateContent('urgencySection.enabled', checked)}
                      />
                    </div>

                    {funnelContent.urgencySection.enabled && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="urgency-title">Section Title</Label>
                          <Input
                            id="urgency-title"
                            value={funnelContent.urgencySection.title}
                            onChange={(e) => updateContent('urgencySection.title', e.target.value)}
                            placeholder="Limited Availability"
                          />
                        </div>

                        <div>
                          <Label>Message</Label>
                          <Textarea
                            value={funnelContent.urgencySection.message}
                            onChange={(e) => updateContent('urgencySection.message', e.target.value)}
                            placeholder="We only take on 5 new clients per month to ensure quality service."
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Spots Remaining</Label>
                            <Input
                              type="number"
                              value={funnelContent.urgencySection.spotsRemaining}
                              onChange={(e) => updateContent('urgencySection.spotsRemaining', Number(e.target.value))}
                              placeholder="2"
                            />
                          </div>
                          <div>
                            <Label>Total Spots</Label>
                            <Input
                              type="number"
                              value={funnelContent.urgencySection.totalSpots}
                              onChange={(e) => updateContent('urgencySection.totalSpots', Number(e.target.value))}
                              placeholder="5"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Media Library</h3>
                        <p className="text-sm text-muted-foreground">Upload images and videos for your funnel</p>
                      </div>
                    </div>
                    
                    <FunnelMediaUpload
                      onMediaUploaded={handleMediaUploaded}
                      maxFiles={10}
                      acceptedTypes={['image/*', 'video/*']}
                    />
                    
                    {funnelContent.media.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Uploaded Media</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {funnelContent.media.map((item) => (
                            <Card key={item.id} className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {item.type === 'video' ? (
                                    <Video className="w-4 h-4" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4" />
                                  )}
                                  <span className="text-sm font-medium truncate">{item.title}</span>
                                </div>
                                {item.type === 'video' ? (
                                  <video 
                                    src={item.url} 
                                    className="w-full h-20 object-cover rounded"
                                    controls={false}
                                  />
                                ) : (
                                  <img 
                                    src={item.url} 
                                    alt={item.title}
                                    className="w-full h-20 object-cover rounded"
                                  />
                                )}
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => window.open(item.url, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      const newMedia = funnelContent.media.filter(m => m.id !== item.id);
                                      updateContent('media', newMedia);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={!showAgentView ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAgentView(false)}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={showAgentView ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAgentView(true)}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile
                </Button>
                <Button variant="outline" size="sm" onClick={enterFullscreen}>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Full screen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)]">
              <div ref={previewRef} className={`border rounded-lg overflow-hidden bg-background ${showAgentView ? 'max-w-sm mx-auto' : ''}`}>
                {/* Hero Section - Full Width */}
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-500 text-white">
                        <Verified className="w-3 h-3 mr-1" />
                        Top Rated Pro
                      </Badge>
                      <Badge className="bg-orange-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        Premium Provider
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-bold leading-tight">
                      {funnelContent.headline || 'Transform Your Business Today'}
                    </h1>
                    <p className="text-lg text-blue-100">
                      {funnelContent.subheadline || 'Professional service that delivers real results'}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm">4.9 (150+ reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">
                  {/* Benefits Section */}
                  {funnelContent.whyChooseUs.benefits.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Why Choose Us?</h2>
                      <div className="space-y-3">
                        {funnelContent.whyChooseUs.benefits.slice(0, 3).map((benefit, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="bg-green-500 rounded-full p-1">
                              <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="font-medium">{benefit.title}</span>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Packages */}
                  {funnelContent.packages.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Choose Your Package</h2>
                      <div className="grid gap-4">
                        {funnelContent.packages.map((pkg) => (
                          <Card key={pkg.id} className={`p-4 relative ${pkg.popular ? 'border-primary shadow-lg' : ''}`}>
                            {pkg.popular && (
                              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                                Most Popular
                              </Badge>
                            )}
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold">${pkg.price}</div>
                                  {pkg.originalPrice && (
                                    <div className="text-sm text-muted-foreground line-through">${pkg.originalPrice}</div>
                                  )}
                                </div>
                              </div>
                              <ul className="space-y-1">
                                {pkg.features.slice(0, 3).map((feature, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              <Button 
                                className={`w-full ${pkg.popular ? 'bg-primary hover:bg-primary/90' : 'variant-outline'}`}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Get Started
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Testimonials Section */}
                  {funnelContent.socialProof.testimonials.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">What Our Clients Say</h2>
                      <div className="space-y-3">
                        {funnelContent.socialProof.testimonials.slice(0, 2).map((testimonial) => (
                          <Card key={testimonial.id} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <p className="text-sm italic">"{testimonial.content}"</p>
                              <div className="text-sm">
                                <span className="font-medium">{testimonial.name}</span>
                                <span className="text-muted-foreground">, {testimonial.role}</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Stats */}
                  {funnelContent.socialProof.stats.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Proven Results</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {funnelContent.socialProof.stats.slice(0, 4).map((stat, index) => (
                          <div key={index} className="text-center p-3 bg-primary/5 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Gallery */}
                  {funnelContent.thumbnailGallery.enabled && funnelContent.thumbnailGallery.items.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Our Work</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {funnelContent.thumbnailGallery.items.slice(0, 6).map((thumbnail, index) => (
                          <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                              <img
                                src={thumbnail.mediaUrl || '/placeholder.svg'}
                                alt={thumbnail.label ? `${thumbnail.label} thumbnail` : 'Service media thumbnail'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                              />
                              {!thumbnail.mediaUrl && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="inline-flex items-center justify-center rounded-full bg-background/70 backdrop-blur px-3 py-2 text-xs font-medium">
                                    <Video className="w-4 h-4 mr-1 text-primary" />
                                    <span>Video</span>
                                  </div>
                                </div>
                              )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-white text-xs font-medium">{thumbnail.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ROI Calculator */}
                  {funnelContent.roiCalculator.enabled && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">ROI Calculator</h2>
                      <Card className="p-4">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">Calculate your potential return on investment</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Current Monthly Closings</label>
                              <div className="mt-1 p-2 border rounded text-sm bg-muted">{funnelContent.roiCalculator.currentMonthlyClosings}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Estimated Improvement</label>
                              <div className="mt-1 p-2 border rounded text-sm bg-primary/10">+{funnelContent.roiCalculator.increasePercentage}%</div>
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                              Additional Monthly Income: ${funnelContent.roiCalculator.calculatedAdditionalIncome.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                              Annual Increase: ${funnelContent.roiCalculator.calculatedAnnualIncrease.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Testimonial Cards */}
                  {funnelContent.testimonialCards.enabled && funnelContent.testimonialCards.cards.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Success Stories</h2>
                      <div className="space-y-3">
                        {funnelContent.testimonialCards.cards.slice(0, 3).map((testimonial, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <p className="text-sm italic">"{testimonial.content}"</p>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{testimonial.name}</div>
                                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media Section */}
                  {funnelContent.media.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Media Gallery</h2>
                      <div className="grid grid-cols-1 gap-3">
                        {funnelContent.media.slice(0, 3).map((media, index) => (
                          <div key={index} className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">{media.title || `Media ${index + 1}`}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgency Section */}
                  {funnelContent.urgencySection.enabled && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-destructive" />
                        <span className="font-semibold text-destructive">Limited Time Offer</span>
                      </div>
                      <p className="text-sm text-destructive/80">
                        Only {funnelContent.urgencySection.spotsRemaining} spots remaining this month!
                      </p>
                    </div>
                  )}

                  {/* Trust Indicators */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Our Guarantee</h2>
                    <div className="space-y-3">
                      {funnelContent.trustIndicators.guarantee && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <Shield className="w-5 h-5 text-green-600" />
                          <span className="text-sm">{funnelContent.trustIndicators.guarantee}</span>
                        </div>
                      )}
                      {funnelContent.trustIndicators.cancellation && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="text-sm">{funnelContent.trustIndicators.cancellation}</span>
                        </div>
                      )}
                      {funnelContent.trustIndicators.certification && (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <Award className="w-5 h-5 text-purple-600" />
                          <span className="text-sm">{funnelContent.trustIndicators.certification}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  {(funnelContent.callToAction.contactInfo.phone || funnelContent.callToAction.contactInfo.email || funnelContent.callToAction.contactInfo.website) && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Get In Touch</h2>
                      <div className="space-y-2">
                        {funnelContent.callToAction.contactInfo.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{funnelContent.callToAction.contactInfo.phone}</span>
                          </div>
                        )}
                        {funnelContent.callToAction.contactInfo.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{funnelContent.callToAction.contactInfo.email}</span>
                          </div>
                        )}
                        {funnelContent.callToAction.contactInfo.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{funnelContent.callToAction.contactInfo.website}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Final CTA */}
                  <div className="text-center space-y-4 bg-primary/5 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold">{funnelContent.callToAction.primaryHeadline || 'Ready to Get Started?'}</h2>
                    <p className="text-muted-foreground">{funnelContent.callToAction.primaryDescription || 'Join thousands of satisfied customers'}</p>
                    <Button size="lg" className="w-full">
                      {funnelContent.callToAction.primaryButtonText || 'Start Your Journey Today'}
                    </Button>
                    {funnelContent.urgency.enabled && (
                      <p className="text-sm text-destructive font-medium">{funnelContent.urgency.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};