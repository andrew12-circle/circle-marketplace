import { useState } from 'react';
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
  Code
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
            <CardContent className="flex-1">
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
            <CardContent className="flex-1">
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
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Visual Editor</h3>
          <p className="text-muted-foreground mb-4">
            The visual editor is currently being updated to work with the new pricing tiers system.
          </p>
          <p className="text-sm text-muted-foreground">
            For now, use the HTML Editor to create your custom funnel pages with complete control.
          </p>
        </div>
      )}
    </div>
  );
};