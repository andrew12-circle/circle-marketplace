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
  ShoppingCart
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="social">Social Proof</TabsTrigger>
          <TabsTrigger value="cta">Call to Action</TabsTrigger>
        </TabsList>

        {/* Hero Section Editor */}
        <TabsContent value="hero" className="space-y-6">
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

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">{funnelContent.headline || 'Your Headline'}</h3>
                <p className="text-lg mb-4">{funnelContent.subheadline || 'Your subheadline'}</p>
                <p className="mb-4">{funnelContent.heroDescription || 'Your description'}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {funnelContent.estimatedRoi}x ROI
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {funnelContent.duration}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Section Editor */}
        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Why Choose Your Service
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
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Icon</Label>
                          <Input
                            value={benefit.icon}
                            onChange={(e) => {
                              const newBenefits = [...funnelContent.whyChooseUs.benefits];
                              newBenefits[index].icon = e.target.value;
                              updateContent('whyChooseUs.benefits', newBenefits);
                            }}
                            placeholder="Icon name"
                          />
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={benefit.title}
                            onChange={(e) => {
                              const newBenefits = [...funnelContent.whyChooseUs.benefits];
                              newBenefits[index].title = e.target.value;
                              updateContent('whyChooseUs.benefits', newBenefits);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={benefit.description}
                            onChange={(e) => {
                              const newBenefits = [...funnelContent.whyChooseUs.benefits];
                              newBenefits[index].description = e.target.value;
                              updateContent('whyChooseUs.benefits', newBenefits);
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const newBenefits = funnelContent.whyChooseUs.benefits.filter((_, i) => i !== index);
                          updateContent('whyChooseUs.benefits', newBenefits);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Section Editor */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Media Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceImageUpload
                value=""
                onChange={(url) => {
                  const newMedia: MediaItem = {
                    id: Date.now().toString(),
                    type: 'image',
                    url,
                    title: 'Uploaded Image'
                  };
                  updateContent('media', [...funnelContent.media, newMedia]);
                }}
              />
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                {funnelContent.media.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{item.type}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMedia = funnelContent.media.filter((_, i) => i !== index);
                            updateContent('media', newMedia);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newMedia = [...funnelContent.media];
                          newMedia[index].title = e.target.value;
                          updateContent('media', newMedia);
                        }}
                        placeholder="Media title"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Section Editor */}
        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing Packages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={addPackage} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>

              {funnelContent.packages.map((pkg, index) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
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
                      <Input
                        value={pkg.description}
                        onChange={(e) => updatePackage(index, 'description', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Original Price (optional)</Label>
                      <Input
                        type="number"
                        value={pkg.originalPrice || ''}
                        onChange={(e) => updatePackage(index, 'originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>

                    <div>
                      <Label>Savings Text (optional)</Label>
                      <Input
                        value={pkg.savings || ''}
                        onChange={(e) => updatePackage(index, 'savings', e.target.value)}
                        placeholder="e.g., 50% OFF"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pkg.popular}
                          onCheckedChange={(checked) => updatePackage(index, 'popular', checked)}
                        />
                        <Label>Most Popular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pkg.proOnly || false}
                          onCheckedChange={(checked) => updatePackage(index, 'proOnly', checked)}
                        />
                        <Label>Pro Members Only</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Features (one per line)</Label>
                      <Textarea
                        value={pkg.features.join('\n')}
                        onChange={(e) => updatePackage(index, 'features', e.target.value.split('\n').filter(f => f.trim()))}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Proof Section Editor */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Social Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Testimonials */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Customer Testimonials</h4>
                  <Button onClick={addTestimonial} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Testimonial
                  </Button>
                </div>

                {funnelContent.socialProof.testimonials.map((testimonial, index) => (
                  <Card key={testimonial.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Customer Name</Label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) => {
                              const newTestimonials = [...funnelContent.socialProof.testimonials];
                              newTestimonials[index].name = e.target.value;
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Role/Title</Label>
                          <Input
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
                        <div>
                          <Label>Rating (1-5)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={testimonial.rating}
                            onChange={(e) => {
                              const newTestimonials = [...funnelContent.socialProof.testimonials];
                              newTestimonials[index].rating = parseInt(e.target.value);
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                          />
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
              </div>

              <Separator />

              {/* Stats */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Success Statistics</h4>
                  <Button onClick={addStat} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stat
                  </Button>
                </div>

                {funnelContent.socialProof.stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Label</Label>
                          <Input
                            value={stat.label}
                            onChange={(e) => {
                              const newStats = [...funnelContent.socialProof.stats];
                              newStats[index].label = e.target.value;
                              updateContent('socialProof.stats', newStats);
                            }}
                            placeholder="e.g., Satisfied Customers"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Value</Label>
                            <Input
                              value={stat.value}
                              onChange={(e) => {
                                const newStats = [...funnelContent.socialProof.stats];
                                newStats[index].value = e.target.value;
                                updateContent('socialProof.stats', newStats);
                              }}
                              placeholder="e.g., 10,000+"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newStats = funnelContent.socialProof.stats.filter((_, i) => i !== index);
                              updateContent('socialProof.stats', newStats);
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
        </TabsContent>

        {/* Call to Action Section Editor */}
        <TabsContent value="cta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Call to Action & Trust
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trust Indicators */}
              <div>
                <h4 className="font-semibold mb-4">Trust Indicators</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Money Back Guarantee</Label>
                    <Input
                      value={funnelContent.trustIndicators.guarantee}
                      onChange={(e) => updateContent('trustIndicators.guarantee', e.target.value)}
                      placeholder="e.g., 30-Day Money Back Guarantee"
                    />
                  </div>
                  <div>
                    <Label>Cancellation Policy</Label>
                    <Input
                      value={funnelContent.trustIndicators.cancellation}
                      onChange={(e) => updateContent('trustIndicators.cancellation', e.target.value)}
                      placeholder="e.g., Cancel Anytime"
                    />
                  </div>
                  <div>
                    <Label>Certification/Award</Label>
                    <Input
                      value={funnelContent.trustIndicators.certification}
                      onChange={(e) => updateContent('trustIndicators.certification', e.target.value)}
                      placeholder="e.g., Industry Leader"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Call to Action Cards */}
              <div>
                <h4 className="font-semibold mb-4">Call to Action Cards</h4>
                <div className="space-y-6">
                  {/* Primary CTA */}
                  <div>
                    <h5 className="font-medium mb-3">Primary CTA Card</h5>
                    <div className="space-y-3">
                      <div>
                        <Label>Headline</Label>
                        <Input
                          value={funnelContent.callToAction.primaryHeadline}
                          onChange={(e) => updateContent('callToAction.primaryHeadline', e.target.value)}
                          placeholder="Need More Information?"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={funnelContent.callToAction.primaryDescription}
                          onChange={(e) => updateContent('callToAction.primaryDescription', e.target.value)}
                          placeholder="Visit our website for detailed documentation and resources."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={funnelContent.callToAction.primaryButtonText}
                          onChange={(e) => updateContent('callToAction.primaryButtonText', e.target.value)}
                          placeholder="Visit Official Website"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary CTA */}
                  <div>
                    <h5 className="font-medium mb-3">Secondary CTA Card</h5>
                    <div className="space-y-3">
                      <div>
                        <Label>Headline</Label>
                        <Input
                          value={funnelContent.callToAction.secondaryHeadline}
                          onChange={(e) => updateContent('callToAction.secondaryHeadline', e.target.value)}
                          placeholder="Questions? We're Here to Help!"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={funnelContent.callToAction.secondaryDescription}
                          onChange={(e) => updateContent('callToAction.secondaryDescription', e.target.value)}
                          placeholder="Speak with our experts to find the perfect package for your business."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={funnelContent.callToAction.contactInfo.phone}
                      onChange={(e) => updateContent('callToAction.contactInfo.phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      value={funnelContent.callToAction.contactInfo.email}
                      onChange={(e) => updateContent('callToAction.contactInfo.email', e.target.value)}
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      value={funnelContent.callToAction.contactInfo.website}
                      onChange={(e) => updateContent('callToAction.contactInfo.website', e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Urgency Settings */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    checked={funnelContent.urgency.enabled}
                    onCheckedChange={(checked) => updateContent('urgency.enabled', checked)}
                  />
                  <Label>Enable Urgency Message</Label>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Live Preview - What Agents See</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto border rounded-lg bg-background">
                {/* Exact replica of ServiceDetailsModal layout */}
                
                {/* Hero Section */}
                <div className="relative bg-gradient-to-br from-circle-primary to-circle-primary/80 text-white p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-white rounded-xl p-4 flex-shrink-0">
                      {funnelContent.media[0] ? (
                        <img
                          src={funnelContent.media[0].url}
                          alt={funnelContent.headline}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-3xl font-bold">{funnelContent.headline || 'Your Headline'}</h2>
                        <Badge className="bg-white/20 text-white border-white/30">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                      
                      <p className="text-lg text-white/90 mb-4">{funnelContent.heroDescription || 'Your description'}</p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>5.0 (100+ reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{funnelContent.estimatedRoi}x ROI</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{funnelContent.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white text-circle-primary font-medium">
                      <Award className="w-3 h-3 mr-1" />
                      Featured Service
                    </Badge>
                  </div>
                </div>

                <div className="p-8">
                  {/* Key Benefits */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4">{funnelContent.whyChooseUs.title || `Why ${funnelContent.headline}?`}</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {funnelContent.whyChooseUs.benefits.slice(0, 3).map((benefit, index) => {
                        const icons = [Zap, Users, TrendingUp];
                        const IconComponent = icons[index % icons.length];
                        
                        return (
                          <Card key={index}>
                            <CardContent className="p-4 text-center">
                              <IconComponent className="w-8 h-8 text-circle-primary mx-auto mb-2" />
                              <h4 className="font-semibold mb-1">{benefit.title}</h4>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Pricing Packages */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-6 text-center">Choose Your Package</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {funnelContent.packages.map((pkg) => (
                        <Card 
                          key={pkg.id} 
                          className={`relative transition-all duration-200 ${
                            pkg.popular ? 'ring-2 ring-circle-primary scale-105' : ''
                          }`}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-circle-primary text-white px-4 py-1">
                                Most Popular
                              </Badge>
                            </div>
                          )}
                          
                          <CardContent className="p-6">
                            <div className="text-center mb-4">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <h4 className="text-xl font-bold">{pkg.name}</h4>
                                {pkg.proOnly && <Crown className="w-5 h-5 text-circle-primary" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{pkg.description}</p>
                            </div>

                            <div className="text-center mb-4">
                              {pkg.originalPrice && (
                                <div className="text-sm text-muted-foreground line-through">
                                  ${pkg.originalPrice}
                                </div>
                              )}
                              <div className="text-3xl font-bold text-circle-primary">
                                ${pkg.price}
                              </div>
                              {pkg.savings && (
                                <Badge className="bg-destructive text-destructive-foreground text-xs mt-1">
                                  {pkg.savings} OFF
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2 mb-6">
                              {pkg.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              className="w-full"
                              variant={pkg.popular ? "default" : "outline"}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Call to Actions */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-r from-circle-primary/5 to-circle-primary/10 border-circle-primary/20">
                      <CardContent className="p-6 text-center">
                        <h4 className="text-xl font-bold mb-2">{funnelContent.callToAction.primaryHeadline || "Need More Information?"}</h4>
                        <p className="text-muted-foreground mb-4">
                          {funnelContent.callToAction.primaryDescription || "Visit our website for detailed documentation and resources."}
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {funnelContent.callToAction.primaryButtonText || "Visit Official Website"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-6 text-center">
                        <h4 className="text-xl font-bold mb-2">{funnelContent.callToAction.secondaryHeadline || "Questions? We're Here to Help!"}</h4>
                        <p className="text-muted-foreground mb-4">
                          {funnelContent.callToAction.secondaryDescription || "Speak with our experts to find the perfect package for your business."}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" size="sm">
                            <Phone className="w-4 h-4 mr-2" />
                            Call Us
                          </Button>
                          <Button variant="outline" className="flex-1" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trust Indicators */}
                  <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span>{funnelContent.trustIndicators.guarantee || "30-Day Money Back Guarantee"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{funnelContent.trustIndicators.cancellation || "Cancel Anytime"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span>{funnelContent.trustIndicators.certification || "Industry Leader"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};