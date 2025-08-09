import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Code,
  Monitor,
  Smartphone,
  Eye,
  ExternalLink,
  X
} from 'lucide-react';

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
  // Rendering options
  renderMode?: 'safe_html' | 'sandboxed_html' | 'external_iframe' | 'live_fetch';
  externalUrl?: string;
  allowSameOrigin?: boolean;
}

interface ServiceFunnelEditorProps {
  funnelContent: FunnelContent;
  onChange: (content: FunnelContent) => void;
}

export const ServiceFunnelEditor = ({ funnelContent, onChange }: ServiceFunnelEditorProps) => {
  const [showAgentView, setShowAgentView] = useState(false);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  const [customHtml, setCustomHtml] = useState(funnelContent.customHtml || '');

  // Initialize custom HTML mode and load default template
  useEffect(() => {
    const shouldInitialize = !funnelContent.useCustomHtml || (!customHtml && !funnelContent.customHtml);
    
    if (shouldInitialize) {
      const newContent = { ...funnelContent };
      newContent.useCustomHtml = true;
      
      if (!newContent.customHtml) {
        newContent.customHtml = defaultHtmlTemplate;
        setCustomHtml(defaultHtmlTemplate);
      } else {
        setCustomHtml(newContent.customHtml);
      }
      
      onChange(newContent);
    }
  }, []);

  // Keep local customHtml state in sync with funnelContent only when prop changes
  useEffect(() => {
    if (funnelContent.customHtml !== customHtml) {
      setCustomHtml(funnelContent.customHtml || '');
    }
  }, [funnelContent.customHtml]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullScreenPreview) {
        setShowFullScreenPreview(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFullScreenPreview]);

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

  const renderPreview = () => {
    // Show preview if we have any HTML content
    const htmlToRender = customHtml || funnelContent.customHtml;
    
    if (htmlToRender) {
      return (
        <div className="w-full h-full bg-white">
          <iframe
            srcDoc={htmlToRender}
            className="w-full h-full border-0"
            title="HTML Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
        <div className="text-center">
          <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No HTML content to preview</p>
          <p className="text-sm text-muted-foreground">Add your HTML code to see the preview</p>
        </div>
      </div>
    );
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
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .pricing h2, .features h2, .testimonials h2 { font-size: 2rem; }
            .tiers { grid-template-columns: 1fr; }
            .feature-grid { grid-template-columns: 1fr; }
            .testimonial-grid { grid-template-columns: 1fr; }
        }
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
    <>
      {/* Full Screen Preview Overlay */}
      {showFullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAgentView(!showAgentView)}
            >
              {showAgentView ? (
                <>
                  <Monitor className="w-4 h-4 mr-2" />
                  Desktop View
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile View
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullScreenPreview(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Exit Full Screen
            </Button>
          </div>
          <div className="h-full w-full overflow-auto pt-16">
            <div className={`mx-auto transition-all duration-300 ${showAgentView ? 'max-w-sm' : 'w-full'}`}>
              {renderPreview()}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">HTML Funnel Editor</h2>
            <p className="text-muted-foreground">Create custom HTML funnels with live preview</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullScreenPreview(true)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Full Screen Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAgentView(!showAgentView)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showAgentView ? 'Desktop View' : 'Mobile View'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
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
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-4 mb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="min-w-[200px]">
                      <Label className="text-xs">Render Mode</Label>
                      <Select
                        value={funnelContent.renderMode || 'sandboxed_html'}
                        onValueChange={(v) => updateContent('renderMode', v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="safe_html">Safe HTML (sanitized)</SelectItem>
                          <SelectItem value="sandboxed_html">Sandboxed HTML (iframe)</SelectItem>
                          <SelectItem value="external_iframe">External Iframe (URL)</SelectItem>
                          <SelectItem value="live_fetch">Live Fetch via Proxy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(funnelContent.renderMode === 'external_iframe' || funnelContent.renderMode === 'live_fetch') && (
                      <div className="min-w-[280px]">
                        <Label className="text-xs">External URL</Label>
                        <Input
                          value={funnelContent.externalUrl || ''}
                          onChange={(e) => updateContent('externalUrl', e.target.value)}
                          placeholder="https://example.com/funnel"
                        />
                      </div>
                    )}
                    {funnelContent.renderMode === 'external_iframe' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={!!funnelContent.allowSameOrigin}
                          onCheckedChange={(checked) => updateContent('allowSameOrigin', checked)}
                        />
                        <Label className="whitespace-nowrap">Allow same-origin</Label>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomHtml(defaultHtmlTemplate);
                        updateContent('customHtml', defaultHtmlTemplate);
                        updateContent('useCustomHtml', true);
                        updateContent('renderMode', 'sandboxed_html');
                      }}
                    >
                      Load Template
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label>Custom HTML Code</Label>
                  <Textarea
                    value={customHtml}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setCustomHtml(newValue);
                      updateContent('customHtml', newValue);
                      updateContent('useCustomHtml', true);
                    }}
                    placeholder="Paste your HTML code here..."
                    className="font-mono text-sm min-h-[400px] flex-1 resize-none"
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
            <CardContent className="flex-1 p-2">
              <div className={`border rounded-lg overflow-hidden bg-white h-full ${showAgentView ? 'max-w-sm mx-auto' : ''}`}>
                {renderPreview()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
