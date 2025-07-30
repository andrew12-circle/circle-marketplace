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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Service Funnel</h2>
        <p className="text-muted-foreground">Design what agents see when they click your service</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Grip className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Drag to reorder</span>
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
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Media Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add images, videos, or documents to showcase your work
                  </p>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    {funnelContent.media.map((item, index) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          {item.type === 'video' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Success Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Show impressive numbers to build credibility</p>
                    <Button onClick={addStat} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Stat
                    </Button>
                  </div>

                  {funnelContent.socialProof.stats.map((stat, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Statistic Value</Label>
                            <Input
                              placeholder="500+"
                              value={stat.value}
                              onChange={(e) => {
                                const newStats = [...funnelContent.socialProof.stats];
                                newStats[index].value = e.target.value;
                                updateContent('socialProof.stats', newStats);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Label</Label>
                            <Input
                              placeholder="Happy Clients"
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...funnelContent.socialProof.stats];
                                newStats[index].label = e.target.value;
                                updateContent('socialProof.stats', newStats);
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const newStats = funnelContent.socialProof.stats.filter((_, i) => i !== index);
                            updateContent('socialProof.stats', newStats);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
                  <div className="space-y-3">
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
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label>Secondary CTA Headline</Label>
                      <Input
                        value={funnelContent.callToAction.secondaryHeadline}
                        onChange={(e) => updateContent('callToAction.secondaryHeadline', e.target.value)}
                        placeholder="Have questions? Let's talk!"
                      />
                    </div>
                    <div>
                      <Label>Secondary CTA Description</Label>
                      <Textarea
                        value={funnelContent.callToAction.secondaryDescription}
                        onChange={(e) => updateContent('callToAction.secondaryDescription', e.target.value)}
                        placeholder="Schedule a free consultation..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Contact Information</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={funnelContent.callToAction.contactInfo.phone}
                          onChange={(e) => updateContent('callToAction.contactInfo.phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={funnelContent.callToAction.contactInfo.email}
                          onChange={(e) => updateContent('callToAction.contactInfo.email', e.target.value)}
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div>
                        <Label>Website</Label>
                        <Input
                          value={funnelContent.callToAction.contactInfo.website}
                          onChange={(e) => updateContent('callToAction.contactInfo.website', e.target.value)}
                          placeholder="www.company.com"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Trust Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Guarantee Message</Label>
                    <Input
                      value={funnelContent.trustIndicators.guarantee}
                      onChange={(e) => updateContent('trustIndicators.guarantee', e.target.value)}
                      placeholder="100% satisfaction guarantee"
                    />
                  </div>
                  <div>
                    <Label>Cancellation Policy</Label>
                    <Input
                      value={funnelContent.trustIndicators.cancellation}
                      onChange={(e) => updateContent('trustIndicators.cancellation', e.target.value)}
                      placeholder="Cancel anytime with 24hr notice"
                    />
                  </div>
                  <div>
                    <Label>Certification/Credentials</Label>
                    <Input
                      value={funnelContent.trustIndicators.certification}
                      onChange={(e) => updateContent('trustIndicators.certification', e.target.value)}
                      placeholder="Licensed & Insured Professional"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Urgency & Scarcity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={funnelContent.urgency.enabled}
                      onCheckedChange={(checked) => updateContent('urgency.enabled', checked)}
                    />
                    <Label>Enable urgency messaging</Label>
                  </div>
                  {funnelContent.urgency.enabled && (
                    <div>
                      <Label>Urgency Message</Label>
                      <Input
                        value={funnelContent.urgency.message}
                        onChange={(e) => updateContent('urgency.message', e.target.value)}
                        placeholder="Limited time offer - Act now!"
                      />
                    </div>
                  )}
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (index > 0) {
                                  const newPackages = [...funnelContent.packages];
                                  [newPackages[index], newPackages[index - 1]] = [newPackages[index - 1], newPackages[index]];
                                  updateContent('packages', newPackages);
                                }
                              }}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (index < funnelContent.packages.length - 1) {
                                  const newPackages = [...funnelContent.packages];
                                  [newPackages[index], newPackages[index + 1]] = [newPackages[index + 1], newPackages[index]];
                                  updateContent('packages', newPackages);
                                }
                              }}
                              disabled={index === funnelContent.packages.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePackage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
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

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Original Price (for discounts)</Label>
                            <Input
                              type="number"
                              value={pkg.originalPrice || ''}
                              onChange={(e) => updatePackage(index, 'originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <Label>Savings Text</Label>
                            <Input
                              value={pkg.savings || ''}
                              onChange={(e) => updatePackage(index, 'savings', e.target.value)}
                              placeholder="e.g., Save $100"
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

                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.popular}
                              onCheckedChange={(checked) => updatePackage(index, 'popular', checked)}
                            />
                            <Label>Mark as Popular</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.proOnly || false}
                              onCheckedChange={(checked) => updatePackage(index, 'proOnly', checked)}
                            />
                            <Label>Pro Members Only</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel - Full ServiceFunnelModal View */}
        <div className="space-y-6">
          <div className="max-w-4xl max-h-[80vh] overflow-y-auto border rounded-lg bg-background">
            <h3 className="font-semibold p-4 border-b flex items-center gap-2">
              <Eye className="w-4 h-4" />
              What Realtors See (Live Preview)
            </h3>
            
            {/* Full Funnel Modal Preview */}
            <div className="p-0">
              {/* Hero Section */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Top Rated Pro
                      </Badge>
                      <Badge className="bg-orange-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        Premium Provider
                      </Badge>
                    </div>
                    <h1 className="text-4xl font-bold leading-tight">
                      {funnelContent.headline || 'Transform Your Real Estate Business'}
                    </h1>
                    <p className="text-xl text-blue-100">
                      {funnelContent.subheadline || 'Proven system used by top performers'}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-lg">5.0 (150+ reviews)</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <h3 className="text-2xl font-bold mb-4">Why Choose This Service?</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 rounded-full p-1">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-lg">Average {funnelContent.estimatedRoi}x ROI increase</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 rounded-full p-1">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-lg">500+ successful implementations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 rounded-full p-1">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-lg">Setup in {funnelContent.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                {/* Left Column - Media and Social Proof */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Main Image/Video */}
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                      <Building className="w-24 h-24 text-blue-400" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4">
                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
                      </Button>
                    </div>
                  </div>

                  {/* Thumbnail Gallery */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Demo Video", icon: "video" },
                      { label: "Case Study", icon: "chart" },
                      { label: "Training", icon: "book" },
                      { label: "Results", icon: "trophy" }
                    ].map((item, i) => (
                      <div key={i} className="aspect-square bg-muted rounded border-2 border-transparent hover:border-primary cursor-pointer relative overflow-hidden">
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                          {item.icon === "video" && <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-0.5"></div></div>}
                          {item.icon === "chart" && <TrendingUp className="w-8 h-8 text-green-500" />}
                          {item.icon === "book" && <Building className="w-8 h-8 text-blue-500" />}
                          {item.icon === "trophy" && <Trophy className="w-8 h-8 text-yellow-500" />}
                          <span className="text-xs text-center mt-1 px-1">{item.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Success Stories */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Recent Success Stories</h3>
                    {funnelContent.socialProof.testimonials.slice(0, 2).map((testimonial, index) => (
                      <Card key={testimonial.id} className="p-4 border-l-4 border-l-green-500">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-full p-2">
                            <Star className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">"{testimonial.content}"</p>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="text-xs text-muted-foreground ml-2">2 days ago</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Middle Column - Value Proposition */}
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">{funnelContent.whyChooseUs.title}</h2>
                    <div className="space-y-4">
                      {funnelContent.whyChooseUs.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-full p-2 mt-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Packages Preview */}
                  {funnelContent.packages.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Choose Your Package</h2>
                      <div className="space-y-3">
                        {funnelContent.packages.map((pkg, index) => (
                          <Card key={pkg.id} className={`relative cursor-pointer transition-all hover:shadow-lg ${pkg.popular ? 'border-primary shadow-md' : ''}`}>
                            {pkg.popular && (
                              <Badge className="absolute -top-2 left-4 bg-primary">
                                Most Popular
                              </Badge>
                            )}
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">{pkg.name}</h3>
                                <div className="text-right">
                                  <span className="text-2xl font-bold text-primary">${pkg.price}</span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                              <div className="space-y-1 mb-4">
                                {pkg.features?.slice(0, 3).map((feature, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                              <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                                Select {pkg.name}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Order Summary & CTA */}
                <div className="lg:col-span-3 space-y-6">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle>Get Started Today</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">$299</div>
                        <div className="text-sm text-muted-foreground">Starting price</div>
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {funnelContent.callToAction.primaryButtonText || 'Book Demo'}
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <Phone className="w-4 h-4 mr-2" />
                        Schedule Call
                      </Button>

                      <div className="text-center text-sm text-muted-foreground">
                        <p>✓ 30-day money back guarantee</p>
                        <p>✓ Cancel anytime</p>
                        <p>✓ Industry certified</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};