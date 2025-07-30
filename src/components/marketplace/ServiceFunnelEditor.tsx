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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hero">Hero & Basics</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
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

            {/* Content Editor */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Benefits & Social Proof
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="benefitsTitle">Benefits Section Title</Label>
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
                          <div className="grid grid-cols-2 gap-4">
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

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Testimonials</h4>
                      <Button onClick={addTestimonial} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Testimonial
                      </Button>
                    </div>

                    {funnelContent.socialProof.testimonials.map((testimonial, index) => (
                      <Card key={testimonial.id}>
                        <CardContent className="p-4 space-y-2">
                          <Input
                            placeholder="Customer name"
                            value={testimonial.name}
                            onChange={(e) => {
                              const newTestimonials = [...funnelContent.socialProof.testimonials];
                              newTestimonials[index].name = e.target.value;
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                          />
                          <Input
                            placeholder="Role/Title"
                            value={testimonial.role}
                            onChange={(e) => {
                              const newTestimonials = [...funnelContent.socialProof.testimonials];
                              newTestimonials[index].role = e.target.value;
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                          />
                          <Textarea
                            placeholder="Testimonial content"
                            value={testimonial.content}
                            onChange={(e) => {
                              const newTestimonials = [...funnelContent.socialProof.testimonials];
                              newTestimonials[index].content = e.target.value;
                              updateContent('socialProof.testimonials', newTestimonials);
                            }}
                          />
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
                          <Textarea
                            value={pkg.description}
                            onChange={(e) => updatePackage(index, 'description', e.target.value)}
                            rows={2}
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