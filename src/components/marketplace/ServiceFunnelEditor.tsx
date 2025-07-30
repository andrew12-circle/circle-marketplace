import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Grip
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
  popular?: boolean;
}

interface SocialProofItem {
  id: string;
  authorName: string;
  authorTitle: string;
  text: string;
  rating: number;
  date: string;
}

interface FunnelContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  whyChooseUs: {
    title: string;
    benefits: Array<{
      icon: string;
      text: string;
    }>;
  };
  valueProposition: {
    title: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  packages: Package[];
  socialProof: SocialProofItem[];
  mediaGallery: MediaItem[];
  callToAction: string;
  guarantees: string[];
  urgency?: {
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const updateContent = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newContent = { ...funnelContent };
    let current: any = newContent;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      if (typeof current[pathArray[i]] === 'undefined') {
        current[pathArray[i]] = {};
      }
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    onChange(newContent);
  };

  const addPackage = () => {
    const newPackage: Package = {
      id: Date.now().toString(),
      name: 'New Package',
      description: 'Package description',
      price: 299,
      features: ['Feature 1', 'Feature 2']
    };
    
    updateContent('packages', [...funnelContent.packages, newPackage]);
  };

  const updatePackage = (index: number, field: string, value: any) => {
    const packages = [...funnelContent.packages];
    packages[index] = { ...packages[index], [field]: value };
    updateContent('packages', packages);
  };

  const removePackage = (index: number) => {
    const packages = funnelContent.packages.filter((_, i) => i !== index);
    updateContent('packages', packages);
  };

  const addSocialProof = () => {
    const newProof: SocialProofItem = {
      id: Date.now().toString(),
      authorName: 'Customer Name',
      authorTitle: 'Company/Role',
      text: 'This service transformed my business...',
      rating: 5,
      date: new Date().toLocaleDateString()
    };
    
    updateContent('socialProof', [...funnelContent.socialProof, newProof]);
  };

  const updateSocialProof = (index: number, field: string, value: any) => {
    const socialProof = [...funnelContent.socialProof];
    socialProof[index] = { ...socialProof[index], [field]: value };
    updateContent('socialProof', socialProof);
  };

  const removeSocialProof = (index: number) => {
    const socialProof = funnelContent.socialProof.filter((_, i) => i !== index);
    updateContent('socialProof', socialProof);
  };

  const addMediaItem = (type: 'image' | 'video' | 'document') => {
    const newMedia: MediaItem = {
      id: Date.now().toString(),
      type,
      url: '',
      title: `New ${type}`,
      description: ''
    };
    
    updateContent('mediaGallery', [...funnelContent.mediaGallery, newMedia]);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const PreviewContent = () => (
    <div className={`${previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'} bg-background border rounded-lg overflow-hidden`}>
      {/* Hero Section Preview */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-green-500 text-white">
              <Trophy className="w-3 h-3 mr-1" />
              Premium Provider
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{funnelContent.headline || 'Your Service Title'}</h1>
          <p className="text-lg text-blue-100">{funnelContent.subheadline || 'Your compelling subheadline'}</p>
          <div className="flex items-center gap-2">
            {renderStarRating(5)}
            <span>5.0 (50+ reviews)</span>
          </div>
        </div>
        
        {funnelContent.whyChooseUs.benefits.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4 border border-white/20">
            <h3 className="font-bold mb-3">{funnelContent.whyChooseUs.title}</h3>
            <div className="space-y-2">
              {funnelContent.whyChooseUs.benefits.slice(0, 3).map((benefit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media Gallery Preview */}
      {funnelContent.mediaGallery.length > 0 && (
        <div className="p-4">
          <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
            <Video className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {funnelContent.mediaGallery.slice(0, 4).map((media, i) => (
              <div key={i} className="aspect-square bg-muted rounded border flex items-center justify-center">
                {media.type === 'video' && <Video className="w-4 h-4" />}
                {media.type === 'image' && <ImageIcon className="w-4 h-4" />}
                {media.type === 'document' && <FileText className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value Proposition Preview */}
      {funnelContent.valueProposition.items.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{funnelContent.valueProposition.title}</h2>
          <div className="space-y-3">
            {funnelContent.valueProposition.items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 mt-1">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages Preview */}
      {funnelContent.packages.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Choose Your Package</h2>
          <div className="space-y-3">
            {funnelContent.packages.map((pkg, i) => (
              <Card key={i} className={`${pkg.popular ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{pkg.name}</h3>
                    {pkg.popular && <Badge>Popular</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold">${pkg.price}</span>
                    {pkg.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">${pkg.originalPrice}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Social Proof Preview */}
      {funnelContent.socialProof.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">What Customers Say</h2>
          <div className="space-y-3">
            {funnelContent.socialProof.slice(0, 2).map((proof, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm mb-2">"{proof.text}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{proof.authorName}</p>
                        <p className="text-xs text-muted-foreground">{proof.authorTitle}</p>
                      </div>
                      {renderStarRating(proof.rating)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="p-4 bg-secondary/20">
        <Button className="w-full bg-gradient-to-r from-primary to-accent text-white">
          {funnelContent.callToAction || 'Get Started Today'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
      {/* Editor Panel */}
      <div className="space-y-4 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="value">Value</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="social">Social Proof</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Main Headline</Label>
                  <Input
                    value={funnelContent.headline}
                    onChange={(e) => updateContent('headline', e.target.value)}
                    placeholder="Your compelling headline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subheadline</Label>
                  <Input
                    value={funnelContent.subheadline}
                    onChange={(e) => updateContent('subheadline', e.target.value)}
                    placeholder="Supporting text that explains the value"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={funnelContent.heroDescription}
                    onChange={(e) => updateContent('heroDescription', e.target.value)}
                    placeholder="Detailed description of your service"
                    rows={3}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Why Choose Us - Section Title</Label>
                    <Input
                      value={funnelContent.whyChooseUs.title}
                      onChange={(e) => updateContent('whyChooseUs.title', e.target.value)}
                      placeholder="Why Choose [Your Company]?"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Benefits</Label>
                    {funnelContent.whyChooseUs.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={benefit.text}
                          onChange={(e) => {
                            const benefits = [...funnelContent.whyChooseUs.benefits];
                            benefits[index] = { ...benefit, text: e.target.value };
                            updateContent('whyChooseUs.benefits', benefits);
                          }}
                          placeholder="Benefit description"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const benefits = funnelContent.whyChooseUs.benefits.filter((_, i) => i !== index);
                            updateContent('whyChooseUs.benefits', benefits);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const benefits = [...funnelContent.whyChooseUs.benefits, { icon: 'check', text: '' }];
                        updateContent('whyChooseUs.benefits', benefits);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Benefit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => addMediaItem('video')} variant="outline" size="sm">
                    <Video className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                  <Button onClick={() => addMediaItem('image')} variant="outline" size="sm">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                  <Button onClick={() => addMediaItem('document')} variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {funnelContent.mediaGallery.map((media, index) => (
                    <Card key={media.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {media.type === 'video' && <Video className="w-4 h-4" />}
                            {media.type === 'image' && <ImageIcon className="w-4 h-4" />}
                            {media.type === 'document' && <FileText className="w-4 h-4" />}
                            <span className="font-medium">{media.type.charAt(0).toUpperCase() + media.type.slice(1)}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const gallery = funnelContent.mediaGallery.filter((_, i) => i !== index);
                              updateContent('mediaGallery', gallery);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={media.title}
                            onChange={(e) => {
                              const gallery = [...funnelContent.mediaGallery];
                              gallery[index] = { ...media, title: e.target.value };
                              updateContent('mediaGallery', gallery);
                            }}
                            placeholder="Media title"
                          />
                          {media.type === 'image' ? (
                            <ServiceImageUpload
                              value={media.url}
                              onChange={(url) => {
                                const gallery = [...funnelContent.mediaGallery];
                                gallery[index] = { ...media, url };
                                updateContent('mediaGallery', gallery);
                              }}
                            />
                          ) : (
                            <Input
                              value={media.url}
                              onChange={(e) => {
                                const gallery = [...funnelContent.mediaGallery];
                                gallery[index] = { ...media, url: e.target.value };
                                updateContent('mediaGallery', gallery);
                              }}
                              placeholder={`${media.type.charAt(0).toUpperCase() + media.type.slice(1)} URL`}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="value" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Value Proposition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={funnelContent.valueProposition.title}
                    onChange={(e) => updateContent('valueProposition.title', e.target.value)}
                    placeholder="What You'll Get"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Value Items</Label>
                  {funnelContent.valueProposition.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Item {index + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const items = funnelContent.valueProposition.items.filter((_, i) => i !== index);
                              updateContent('valueProposition.items', items);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const items = [...funnelContent.valueProposition.items];
                              items[index] = { ...item, title: e.target.value };
                              updateContent('valueProposition.items', items);
                            }}
                            placeholder="Value item title"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) => {
                              const items = [...funnelContent.valueProposition.items];
                              items[index] = { ...item, description: e.target.value };
                              updateContent('valueProposition.items', items);
                            }}
                            placeholder="Description of this value item"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const items = [...funnelContent.valueProposition.items, {
                        icon: 'target',
                        title: '',
                        description: ''
                      }];
                      updateContent('valueProposition.items', items);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Value Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {funnelContent.packages.map((pkg, index) => (
                    <Card key={pkg.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Package {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePackage(index, 'popular', !pkg.popular)}
                            >
                              {pkg.popular ? 'Remove Popular' : 'Mark Popular'}
                            </Button>
                            {funnelContent.packages.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removePackage(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <Input
                            value={pkg.name}
                            onChange={(e) => updatePackage(index, 'name', e.target.value)}
                            placeholder="Package name"
                          />
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => updatePackage(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Price"
                          />
                        </div>
                        <Textarea
                          value={pkg.description}
                          onChange={(e) => updatePackage(index, 'description', e.target.value)}
                          placeholder="Package description"
                          rows={2}
                          className="mb-3"
                        />
                        <div className="space-y-2">
                          <Label>Features</Label>
                          {pkg.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center space-x-2">
                              <Input
                                value={feature}
                                onChange={(e) => {
                                  const features = [...pkg.features];
                                  features[featureIndex] = e.target.value;
                                  updatePackage(index, 'features', features);
                                }}
                                placeholder="Feature description"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const features = pkg.features.filter((_, i) => i !== featureIndex);
                                  updatePackage(index, 'features', features);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const features = [...pkg.features, ''];
                              updatePackage(index, 'features', features);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feature
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button onClick={addPackage} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Proof & Testimonials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {funnelContent.socialProof.map((proof, index) => (
                    <Card key={proof.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Testimonial {index + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSocialProof(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <Input
                            value={proof.authorName}
                            onChange={(e) => updateSocialProof(index, 'authorName', e.target.value)}
                            placeholder="Customer name"
                          />
                          <Input
                            value={proof.authorTitle}
                            onChange={(e) => updateSocialProof(index, 'authorTitle', e.target.value)}
                            placeholder="Title/Company"
                          />
                        </div>
                        <Textarea
                          value={proof.text}
                          onChange={(e) => updateSocialProof(index, 'text', e.target.value)}
                          placeholder="Testimonial text"
                          rows={3}
                          className="mb-3"
                        />
                        <div className="flex items-center gap-3">
                          <Label>Rating:</Label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Button
                                key={star}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={() => updateSocialProof(index, 'rating', star)}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= proof.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button onClick={addSocialProof} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-muted/30 overflow-y-auto max-h-[60vh]">
          <PreviewContent />
        </div>
      </div>
    </div>
  );
};