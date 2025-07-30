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
  Eye
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
}

interface ServiceFunnelEditorProps {
  funnelContent: FunnelContent;
  onChange: (content: FunnelContent) => void;
}

export const ServiceFunnelEditor = ({ funnelContent, onChange }: ServiceFunnelEditorProps) => {
  const [activeTab, setActiveTab] = useState('hero');
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

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

  const addPackage = () => {
    const newPackage: Package = {
      id: Date.now().toString(),
      name: 'New Package',
      description: 'Package description',
      price: 299,
      features: ['Feature 1', 'Feature 2'],
      popular: false
    };
    
    updateContent('packages', [...funnelContent.packages, newPackage]);
  };

  const updatePackage = (index: number, field: keyof Package, value: any) => {
    const newPackages = [...funnelContent.packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    updateContent('packages', newPackages);
  };

  const removePackage = (index: number) => {
    const newPackages = funnelContent.packages.filter((_, i) => i !== index);
    updateContent('packages', newPackages);
  };

  const addBenefit = () => {
    const newBenefit = {
      icon: 'Zap',
      title: 'New Benefit',
      description: 'Benefit description'
    };
    updateContent('whyChooseUs.benefits', [...funnelContent.whyChooseUs.benefits, newBenefit]);
  };

  const addTestimonial = () => {
    const newTestimonial = {
      id: Date.now().toString(),
      name: 'Happy Customer',
      role: 'Real Estate Agent',
      content: 'This service transformed my business!',
      rating: 5
    };
    updateContent('socialProof.testimonials', [...funnelContent.socialProof.testimonials, newTestimonial]);
  };

  const addStat = () => {
    const newStat = {
      label: 'New Metric',
      value: '100+'
    };
    updateContent('socialProof.stats', [...funnelContent.socialProof.stats, newStat]);
  };

  const renderPreviewContent = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary-foreground to-secondary p-8 rounded-lg text-white">
        <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold">{funnelContent.headline}</h1>
          <p className="text-xl opacity-90">{funnelContent.subheadline}</p>
          <p className="opacity-80">{funnelContent.heroDescription}</p>
          
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{funnelContent.estimatedRoi}x</div>
              <div className="text-sm opacity-80">ROI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{funnelContent.duration}</div>
              <div className="text-sm opacity-80">Timeline</div>
            </div>
          </div>
          
          <Button size="lg" className="mt-4">
            <ShoppingCart className="w-5 h-5 mr-2" />
            {funnelContent.callToAction.primaryButtonText}
          </Button>
        </div>
      </div>

      {/* Benefits Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">{funnelContent.whyChooseUs.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {funnelContent.whyChooseUs.benefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Packages Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {funnelContent.packages.map((pkg) => (
            <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary border-2' : ''}`}>
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle>{pkg.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  {pkg.originalPrice && (
                    <div className="text-lg text-muted-foreground line-through">
                      ${pkg.originalPrice}
                    </div>
                  )}
                  {pkg.savings && (
                    <Badge variant="secondary">{pkg.savings}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">{pkg.description}</p>
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full">
                  Choose {pkg.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      {funnelContent.socialProof.testimonials.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {funnelContent.socialProof.testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Final CTA */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{funnelContent.callToAction.primaryHeadline}</h2>
          <p className="mb-6 opacity-90">{funnelContent.callToAction.primaryDescription}</p>
          <Button size="lg" variant="secondary">
            {funnelContent.callToAction.primaryButtonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (previewFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0">
          <h3 className="text-lg font-semibold">Agent Preview - Full Screen</h3>
          <Button
            variant="outline"
            onClick={() => setPreviewFullscreen(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>
        <div className="p-6">
          {renderPreviewContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Service Funnel</h2>
        <p className="text-muted-foreground">Design what agents see when they click your service</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Editor Panel - Scrollable */}
        <div className="space-y-6 overflow-y-auto pr-4 max-h-[calc(100vh-12rem)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="social">Social Proof</TabsTrigger>
              <TabsTrigger value="cta">CTA & Trust</TabsTrigger>
            </TabsList>

            {/* Hero Section Editor */}
            <TabsContent value="hero" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Hero Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="headline">Main Headline</Label>
                    <Input
                      id="headline"
                      value={funnelContent.headline}
                      onChange={(e) => updateContent('headline', e.target.value)}
                      placeholder="Your compelling main headline"
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
                      placeholder="Detailed description of your service"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roi">Estimated ROI (multiplier)</Label>
                      <Input
                        id="roi"
                        type="number"
                        min="1"
                        step="0.1"
                        value={funnelContent.estimatedRoi}
                        onChange={(e) => updateContent('estimatedRoi', parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duration/Timeline</Label>
                      <Input
                        id="duration"
                        value={funnelContent.duration}
                        onChange={(e) => updateContent('duration', e.target.value)}
                        placeholder="e.g., 30 days, 3 months"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benefits Editor */}
            <TabsContent value="benefits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Benefits Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="benefitsTitle">Section Title</Label>
                    <Input
                      id="benefitsTitle"
                      value={funnelContent.whyChooseUs.title}
                      onChange={(e) => updateContent('whyChooseUs.title', e.target.value)}
                      placeholder="Why choose your service?"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Benefits</h4>
                      <Button onClick={addBenefit} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Benefit
                      </Button>
                    </div>

                    {funnelContent.whyChooseUs.benefits.map((benefit, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <Label>Benefit Title</Label>
                              <Input
                                value={benefit.title}
                                onChange={(e) => {
                                  const newBenefits = [...funnelContent.whyChooseUs.benefits];
                                  newBenefits[index].title = e.target.value;
                                  updateContent('whyChooseUs.benefits', newBenefits);
                                }}
                                placeholder="e.g., Increased Lead Generation"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={benefit.description}
                                onChange={(e) => {
                                  const newBenefits = [...funnelContent.whyChooseUs.benefits];
                                  newBenefits[index].description = e.target.value;
                                  updateContent('whyChooseUs.benefits', newBenefits);
                                }}
                                placeholder="Explain how this benefit helps agents..."
                                rows={2}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newBenefits = funnelContent.whyChooseUs.benefits.filter((_, i) => i !== index);
                                updateContent('whyChooseUs.benefits', newBenefits);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packages Editor */}
            <TabsContent value="packages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing Packages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Create pricing tiers for your service</p>
                    <Button onClick={addPackage}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Package
                    </Button>
                  </div>

                  {funnelContent.packages.map((pkg, index) => (
                    <Card key={pkg.id} className={`border-l-4 ${pkg.popular ? 'border-l-yellow-500' : 'border-l-gray-300'}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            {pkg.popular && <Badge variant="secondary">Popular</Badge>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePackage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Package Name</Label>
                            <Input
                              value={pkg.name}
                              onChange={(e) => updatePackage(index, 'name', e.target.value)}
                              placeholder="e.g., Starter Package"
                            />
                          </div>
                          <div>
                            <Label>Price ($)</Label>
                            <Input
                              type="number"
                              value={pkg.price}
                              onChange={(e) => updatePackage(index, 'price', parseFloat(e.target.value))}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={pkg.description}
                            onChange={(e) => updatePackage(index, 'description', e.target.value)}
                            placeholder="Brief description of what's included..."
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label>Features (one per line)</Label>
                          <Textarea
                            value={pkg.features.join('\n')}
                            onChange={(e) => updatePackage(index, 'features', e.target.value.split('\n').filter(f => f.trim()))}
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            rows={4}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.popular}
                            onCheckedChange={(checked) => updatePackage(index, 'popular', checked)}
                          />
                          <Label>Mark as Popular</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Proof Editor */}
            <TabsContent value="social" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Testimonials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Add customer testimonials to build trust</p>
                    <Button onClick={addTestimonial} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>

                  {funnelContent.socialProof.testimonials.map((testimonial, index) => (
                    <Card key={testimonial.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Customer Name</Label>
                            <Input
                              placeholder="John Smith"
                              value={testimonial.name}
                              onChange={(e) => {
                                const newTestimonials = [...funnelContent.socialProof.testimonials];
                                newTestimonials[index].name = e.target.value;
                                updateContent('socialProof.testimonials', newTestimonials);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Role/Company</Label>
                            <Input
                              placeholder="Real Estate Agent, ABC Realty"
                              value={testimonial.role}
                              onChange={(e) => {
                                const newTestimonials = [...funnelContent.socialProof.testimonials];
                                newTestimonials[index].role = e.target.value;
                                updateContent('socialProof.testimonials', newTestimonials);
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Testimonial Content</Label>
                          <Textarea
                            placeholder="This service completely transformed my business..."
                            value={testimonial.content}
                            onChange={(e) => {
                              const newTestimonials = [...funnelContent.socialProof.testimonials];
                              newTestimonials[index].content = e.target.value;
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 cursor-pointer ${
                                  star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                                onClick={() => {
                                  const newTestimonials = [...funnelContent.socialProof.testimonials];
                                  newTestimonials[index].rating = star;
                                  updateContent('socialProof.testimonials', newTestimonials);
                                }}
                              />
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newTestimonials = funnelContent.socialProof.testimonials.filter((_, i) => i !== index);
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CTA & Trust Editor */}
            <TabsContent value="cta" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Call to Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Primary CTA Headline</Label>
                    <Input
                      value={funnelContent.callToAction.primaryHeadline}
                      onChange={(e) => updateContent('callToAction.primaryHeadline', e.target.value)}
                      placeholder="Ready to boost your business?"
                    />
                  </div>
                  <div>
                    <Label>Primary CTA Description</Label>
                    <Textarea
                      value={funnelContent.callToAction.primaryDescription}
                      onChange={(e) => updateContent('callToAction.primaryDescription', e.target.value)}
                      placeholder="Take the next step towards success..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Primary Button Text</Label>
                    <Input
                      value={funnelContent.callToAction.primaryButtonText}
                      onChange={(e) => updateContent('callToAction.primaryButtonText', e.target.value)}
                      placeholder="Get Started Now"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel - Also Scrollable */}
        <div className="space-y-6 overflow-y-auto pl-4 max-h-[calc(100vh-12rem)] border-l">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Preview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewFullscreen(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View as Agent
            </Button>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg">
            {renderPreviewContent()}
          </div>
        </div>
      </div>
    </div>
  );
};