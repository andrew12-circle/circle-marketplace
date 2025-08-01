import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FunnelMediaUpload } from './FunnelMediaUpload';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Eye,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Star,
  Quote,
  TrendingUp,
  Award,
  Shield,
  Phone,
  Mail,
  Globe,
  Play,
  Image,
  FileText,
  Zap,
  Target,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface FunnelContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  estimatedRoi: number;
  duration: string;
  whyChooseUs: {
    title: string;
    benefits: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  media: Array<{
    id: string;
    type: 'image' | 'video' | 'document';
    url: string;
    title: string;
    description?: string;
  }>;
  packages: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[];
    popular: boolean;
    proOnly?: boolean;
    savings?: string;
  }>;
  socialProof: {
    testimonials: Array<{
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
    }>;
    stats: Array<{
      label: string;
      value: string;
    }>;
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

interface VendorFunnelEditorProps {
  vendorId: string;
  initialContent?: FunnelContent;
  onSave: (content: FunnelContent) => void;
  onCancel: () => void;
}

const BENEFIT_ICONS = [
  { value: 'check', label: 'Checkmark', icon: CheckCircle },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'zap', label: 'Lightning', icon: Zap },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'dollar', label: 'Dollar', icon: DollarSign },
  { value: 'trend', label: 'Trending', icon: TrendingUp },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'clock', label: 'Clock', icon: Clock }
];

export const VendorFunnelEditor = ({ vendorId, initialContent, onSave, onCancel }: VendorFunnelEditorProps) => {
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);
  const [content, setContent] = useState<FunnelContent>(initialContent || {
    headline: '',
    subheadline: '',
    heroDescription: '',
    estimatedRoi: 3,
    duration: '30 days',
    whyChooseUs: {
      title: 'Why Choose Our Service?',
      benefits: [
        { icon: 'check', title: 'Proven Results', description: 'Get measurable results fast' },
        { icon: 'check', title: 'Expert Support', description: '24/7 professional assistance' },
        { icon: 'check', title: 'Fast Implementation', description: 'Up and running in minutes' }
      ]
    },
    media: [],
    packages: [
      {
        id: '1',
        name: 'Standard Package',
        description: 'Perfect for most businesses',
        price: 299,
        features: ['Core features', 'Email support', 'Monthly updates'],
        popular: true
      }
    ],
    socialProof: {
      testimonials: [
        {
          id: '1',
          name: 'John Smith',
          role: 'Real Estate Agent',
          content: 'This service transformed my business...',
          rating: 5
        }
      ],
      stats: [
        { label: 'Happy Customers', value: '1000+' },
        { label: 'Success Rate', value: '98%' }
      ]
    },
    trustIndicators: {
      guarantee: '30-day money back guarantee',
      cancellation: 'Cancel anytime',
      certification: 'Industry certified'
    },
    callToAction: {
      primaryHeadline: 'Ready to Transform Your Business?',
      primaryDescription: 'Join thousands of successful professionals who trust our services.',
      primaryButtonText: 'Get Started Today',
      secondaryHeadline: 'Questions? We\'re Here to Help!',
      secondaryDescription: 'Speak with our experts to find the perfect solution for your business.',
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      }
    },
    urgency: {
      enabled: false,
      message: 'Limited time offer - 20% off this month!'
    }
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateContent = (path: string, value: any) => {
    setContent(prev => {
      const newContent = { ...prev };
      const pathArray = path.split('.');
      let current: any = newContent;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      current[pathArray[pathArray.length - 1]] = value;
      return newContent;
    });
  };

  const addBenefit = () => {
    setContent(prev => ({
      ...prev,
      whyChooseUs: {
        ...prev.whyChooseUs,
        benefits: [
          ...prev.whyChooseUs.benefits,
          { icon: 'check', title: 'New Benefit', description: 'Benefit description' }
        ]
      }
    }));
  };

  const removeBenefit = (index: number) => {
    setContent(prev => ({
      ...prev,
      whyChooseUs: {
        ...prev.whyChooseUs,
        benefits: prev.whyChooseUs.benefits.filter((_, i) => i !== index)
      }
    }));
  };

  const addPackage = () => {
    const newPackage = {
      id: Date.now().toString(),
      name: 'New Package',
      description: 'Package description',
      price: 299,
      features: ['Feature 1', 'Feature 2'],
      popular: false
    };
    
    setContent(prev => ({
      ...prev,
      packages: [...prev.packages, newPackage]
    }));
  };

  const removePackage = (id: string) => {
    setContent(prev => ({
      ...prev,
      packages: prev.packages.filter(pkg => pkg.id !== id)
    }));
  };

  const addTestimonial = () => {
    const newTestimonial = {
      id: Date.now().toString(),
      name: 'Customer Name',
      role: 'Title/Company',
      content: 'Testimonial content...',
      rating: 5
    };
    
    setContent(prev => ({
      ...prev,
      socialProof: {
        ...prev.socialProof,
        testimonials: [...prev.socialProof.testimonials, newTestimonial]
      }
    }));
  };

  const removeTestimonial = (id: string) => {
    setContent(prev => ({
      ...prev,
      socialProof: {
        ...prev.socialProof,
        testimonials: prev.socialProof.testimonials.filter(t => t.id !== id)
      }
    }));
  };

  const addStat = () => {
    setContent(prev => ({
      ...prev,
      socialProof: {
        ...prev.socialProof,
        stats: [...prev.socialProof.stats, { label: 'New Stat', value: '100+' }]
      }
    }));
  };

  const removeStat = (index: number) => {
    setContent(prev => ({
      ...prev,
      socialProof: {
        ...prev.socialProof,
        stats: prev.socialProof.stats.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Include uploaded media URLs in the content
      const finalContent = {
        ...content,
        mediaUrls: uploadedMediaUrls
      };
      onSave(finalContent);
      toast.success('Funnel page saved successfully');
    } catch (error) {
      console.error('Error saving funnel:', error);
      toast.error('Failed to save funnel page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMediaUploaded = (mediaUrls: string[]) => {
    setUploadedMediaUrls(prev => [...prev, ...mediaUrls]);
    toast.success(`${mediaUrls.length} media file(s) uploaded successfully`);
  };

  const getIconComponent = (iconName: string) => {
    const iconData = BENEFIT_ICONS.find(icon => icon.value === iconName);
    return iconData ? iconData.icon : CheckCircle;
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 border rounded-lg">
        <h2 className="text-xl font-semibold">Edit Funnel Page</h2>
        <div className="flex space-x-3">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Funnel Page Preview</DialogTitle>
              </DialogHeader>
              {/* Preview content would go here */}
              <div className="space-y-6">
                <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h1 className="text-3xl font-bold mb-2">{content.headline || 'Your Headline'}</h1>
                  <p className="text-xl text-gray-600 mb-4">{content.subheadline || 'Your Subheadline'}</p>
                  <p className="text-gray-700">{content.heroDescription || 'Your description'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">This is a simplified preview. The actual funnel page will have full styling and interactivity.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Funnel'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="social">Social Proof</TabsTrigger>
          <TabsTrigger value="trust">Trust & CTA</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <p className="text-sm text-gray-600">The first thing visitors see on your funnel page</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headline">Main Headline *</Label>
                <Input
                  id="headline"
                  value={content.headline}
                  onChange={(e) => updateContent('headline', e.target.value)}
                  placeholder="Transform Your Real Estate Business Today"
                />
              </div>
              
              <div>
                <Label htmlFor="subheadline">Subheadline</Label>
                <Input
                  id="subheadline"
                  value={content.subheadline}
                  onChange={(e) => updateContent('subheadline', e.target.value)}
                  placeholder="Join thousands of successful agents who trust our services"
                />
              </div>

              <div>
                <Label htmlFor="heroDescription">Hero Description</Label>
                <Textarea
                  id="heroDescription"
                  value={content.heroDescription}
                  onChange={(e) => updateContent('heroDescription', e.target.value)}
                  placeholder="Explain the main value proposition and what makes your service special"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedRoi">Estimated ROI (x multiple)</Label>
                  <Input
                    id="estimatedRoi"
                    type="number"
                    value={content.estimatedRoi}
                    onChange={(e) => updateContent('estimatedRoi', parseFloat(e.target.value) || 0)}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Timeline</Label>
                  <Input
                    id="duration"
                    value={content.duration}
                    onChange={(e) => updateContent('duration', e.target.value)}
                    placeholder="30 days"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Section */}
        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Why Choose Us Section</CardTitle>
              <p className="text-sm text-gray-600">Highlight your key benefits and value propositions</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="benefitsTitle">Section Title</Label>
                <Input
                  id="benefitsTitle"
                  value={content.whyChooseUs.title}
                  onChange={(e) => updateContent('whyChooseUs.title', e.target.value)}
                  placeholder="Why Choose Our Service?"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Benefits</Label>
                  <Button onClick={addBenefit} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Benefit
                  </Button>
                </div>

                {content.whyChooseUs.benefits.map((benefit, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div>
                        <Label>Icon</Label>
                        <Select 
                          value={benefit.icon} 
                          onValueChange={(value) => {
                            const newBenefits = [...content.whyChooseUs.benefits];
                            newBenefits[index].icon = value;
                            updateContent('whyChooseUs.benefits', newBenefits);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BENEFIT_ICONS.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                <div className="flex items-center">
                                  <icon.icon className="w-4 h-4 mr-2" />
                                  {icon.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={benefit.title}
                          onChange={(e) => {
                            const newBenefits = [...content.whyChooseUs.benefits];
                            newBenefits[index].title = e.target.value;
                            updateContent('whyChooseUs.benefits', newBenefits);
                          }}
                          placeholder="Benefit title"
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={benefit.description}
                          onChange={(e) => {
                            const newBenefits = [...content.whyChooseUs.benefits];
                            newBenefits[index].description = e.target.value;
                            updateContent('whyChooseUs.benefits', newBenefits);
                          }}
                          placeholder="Benefit description"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Section */}
        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Packages & Pricing</CardTitle>
              <p className="text-sm text-gray-600">Define your service packages and pricing options</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Packages</Label>
                <Button onClick={addPackage} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Package
                </Button>
              </div>

              {content.packages.map((pkg, index) => (
                <Card key={pkg.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div>
                          <Label>Package Name</Label>
                          <Input
                            value={pkg.name}
                            onChange={(e) => {
                              const newPackages = [...content.packages];
                              newPackages[index].name = e.target.value;
                              updateContent('packages', newPackages);
                            }}
                            placeholder="Package name"
                          />
                        </div>
                        
                        <div>
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => {
                              const newPackages = [...content.packages];
                              newPackages[index].price = parseFloat(e.target.value) || 0;
                              updateContent('packages', newPackages);
                            }}
                            placeholder="299"
                          />
                        </div>

                        <div>
                          <Label>Original Price (optional)</Label>
                          <Input
                            type="number"
                            value={pkg.originalPrice || ''}
                            onChange={(e) => {
                              const newPackages = [...content.packages];
                              newPackages[index].originalPrice = parseFloat(e.target.value) || undefined;
                              updateContent('packages', newPackages);
                            }}
                            placeholder="399"
                          />
                        </div>
                      </div>

                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removePackage(pkg.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => {
                          const newPackages = [...content.packages];
                          newPackages[index].description = e.target.value;
                          updateContent('packages', newPackages);
                        }}
                        placeholder="Package description"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Features (one per line)</Label>
                      <Textarea
                        value={pkg.features.join('\n')}
                        onChange={(e) => {
                          const newPackages = [...content.packages];
                          newPackages[index].features = e.target.value.split('\n').filter(f => f.trim());
                          updateContent('packages', newPackages);
                        }}
                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={pkg.popular}
                        onCheckedChange={(checked) => {
                          const newPackages = [...content.packages];
                          newPackages[index].popular = checked;
                          updateContent('packages', newPackages);
                        }}
                      />
                      <Label>Mark as Popular</Label>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Proof Section */}
        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle>Testimonials</CardTitle>
                <p className="text-sm text-gray-600">Customer reviews and feedback</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Customer Testimonials</Label>
                  <Button onClick={addTestimonial} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Testimonial
                  </Button>
                </div>

                {content.socialProof.testimonials.map((testimonial, index) => (
                  <Card key={testimonial.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={testimonial.name}
                              onChange={(e) => {
                                const newTestimonials = [...content.socialProof.testimonials];
                                newTestimonials[index].name = e.target.value;
                                updateContent('socialProof.testimonials', newTestimonials);
                              }}
                              placeholder="Customer name"
                            />
                          </div>
                          <div>
                            <Label>Role/Company</Label>
                            <Input
                              value={testimonial.role}
                              onChange={(e) => {
                                const newTestimonials = [...content.socialProof.testimonials];
                                newTestimonials[index].role = e.target.value;
                                updateContent('socialProof.testimonials', newTestimonials);
                              }}
                              placeholder="Real Estate Agent"
                            />
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeTestimonial(testimonial.id)}
                          className="ml-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div>
                        <Label>Testimonial</Label>
                        <Textarea
                          value={testimonial.content}
                          onChange={(e) => {
                            const newTestimonials = [...content.socialProof.testimonials];
                            newTestimonials[index].content = e.target.value;
                            updateContent('socialProof.testimonials', newTestimonials);
                          }}
                          placeholder="Customer testimonial..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Rating</Label>
                        <Select 
                          value={testimonial.rating.toString()} 
                          onValueChange={(value) => {
                            const newTestimonials = [...content.socialProof.testimonials];
                            newTestimonials[index].rating = parseInt(value);
                            updateContent('socialProof.testimonials', newTestimonials);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 4, 3, 2, 1].map((rating) => (
                              <SelectItem key={rating} value={rating.toString()}>
                                <div className="flex items-center">
                                  {Array.from({ length: rating }, (_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                  <span className="ml-2">{rating} stars</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <p className="text-sm text-gray-600">Key performance numbers</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Statistics</Label>
                  <Button onClick={addStat} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Stat
                  </Button>
                </div>

                {content.socialProof.stats.map((stat, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Label</Label>
                        <Input
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...content.socialProof.stats];
                            newStats[index].label = e.target.value;
                            updateContent('socialProof.stats', newStats);
                          }}
                          placeholder="Happy Customers"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Value</Label>
                        <Input
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...content.socialProof.stats];
                            newStats[index].value = e.target.value;
                            updateContent('socialProof.stats', newStats);
                          }}
                          placeholder="1000+"
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeStat(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trust & CTA Section */}
        <TabsContent value="trust" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Trust Indicators</CardTitle>
                <p className="text-sm text-gray-600">Build trust with guarantees and certifications</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Money Back Guarantee</Label>
                  <Input
                    value={content.trustIndicators.guarantee}
                    onChange={(e) => updateContent('trustIndicators.guarantee', e.target.value)}
                    placeholder="30-day money back guarantee"
                  />
                </div>
                
                <div>
                  <Label>Cancellation Policy</Label>
                  <Input
                    value={content.trustIndicators.cancellation}
                    onChange={(e) => updateContent('trustIndicators.cancellation', e.target.value)}
                    placeholder="Cancel anytime"
                  />
                </div>

                <div>
                  <Label>Certification/Credentials</Label>
                  <Input
                    value={content.trustIndicators.certification}
                    onChange={(e) => updateContent('trustIndicators.certification', e.target.value)}
                    placeholder="Industry certified"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card>
              <CardHeader>
                <CardTitle>Call to Action</CardTitle>
                <p className="text-sm text-gray-600">Final push to convert visitors</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Headline</Label>
                  <Input
                    value={content.callToAction.primaryHeadline}
                    onChange={(e) => updateContent('callToAction.primaryHeadline', e.target.value)}
                    placeholder="Ready to Transform Your Business?"
                  />
                </div>

                <div>
                  <Label>Primary Description</Label>
                  <Textarea
                    value={content.callToAction.primaryDescription}
                    onChange={(e) => updateContent('callToAction.primaryDescription', e.target.value)}
                    placeholder="Join thousands of successful professionals..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Primary Button Text</Label>
                  <Input
                    value={content.callToAction.primaryButtonText}
                    onChange={(e) => updateContent('callToAction.primaryButtonText', e.target.value)}
                    placeholder="Get Started Today"
                  />
                </div>

                <Separator />

                <div>
                  <Label>Secondary Headline</Label>
                  <Input
                    value={content.callToAction.secondaryHeadline}
                    onChange={(e) => updateContent('callToAction.secondaryHeadline', e.target.value)}
                    placeholder="Questions? We're Here to Help!"
                  />
                </div>

                <div>
                  <Label>Secondary Description</Label>
                  <Textarea
                    value={content.callToAction.secondaryDescription}
                    onChange={(e) => updateContent('callToAction.secondaryDescription', e.target.value)}
                    placeholder="Speak with our experts..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <p className="text-sm text-gray-600">How prospects can reach you</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={content.callToAction.contactInfo.phone}
                    onChange={(e) => updateContent('callToAction.contactInfo.phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={content.callToAction.contactInfo.email}
                    onChange={(e) => updateContent('callToAction.contactInfo.email', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <Label>Website URL</Label>
                  <Input
                    value={content.callToAction.contactInfo.website}
                    onChange={(e) => updateContent('callToAction.contactInfo.website', e.target.value)}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgency */}
          <Card>
            <CardHeader>
              <CardTitle>Urgency & Scarcity</CardTitle>
              <p className="text-sm text-gray-600">Create urgency to encourage action</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={content.urgency.enabled}
                  onCheckedChange={(checked) => updateContent('urgency.enabled', checked)}
                />
                <Label>Enable urgency message</Label>
              </div>

              {content.urgency.enabled && (
                <div>
                  <Label>Urgency Message</Label>
                  <Input
                    value={content.urgency.message}
                    onChange={(e) => updateContent('urgency.message', e.target.value)}
                    placeholder="Limited time offer - 20% off this month!"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Section */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Gallery</CardTitle>
              <p className="text-sm text-gray-600">Upload images, videos, and documents to showcase your work</p>
            </CardHeader>
            <CardContent>
              <FunnelMediaUpload
                onMediaUploaded={handleMediaUploaded}
                maxFiles={20}
                acceptedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx', '.ppt', '.pptx']}
              />
              
              {uploadedMediaUrls.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Uploaded Media ({uploadedMediaUrls.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedMediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                          <img 
                            src={url} 
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                    <div class="text-center">
                                      <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                      <p class="text-xs text-gray-500">File ${index + 1}</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setUploadedMediaUrls(prev => prev.filter((_, i) => i !== index));
                            toast.success('Media file removed');
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <div className="absolute bottom-2 left-2 right-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};