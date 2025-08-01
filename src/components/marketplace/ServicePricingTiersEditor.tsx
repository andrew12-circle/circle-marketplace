import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  X, 
  DollarSign, 
  Star, 
  Crown, 
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
  Eye,
  Code
} from 'lucide-react';

interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
  isHtml?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  duration: string; // 'mo', 'yr', 'one-time'
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  badge?: string;
  position: number;
}

interface ServicePricingTiersEditorProps {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
}

export const ServicePricingTiersEditor = ({ tiers, onChange }: ServicePricingTiersEditorProps) => {
  const [selectedTier, setSelectedTier] = useState<string>(tiers[0]?.id || '');
  const [previewMode, setPreviewMode] = useState(false);

  const addTier = () => {
    if (tiers.length >= 4) return;
    
    const newTier: PricingTier = {
      id: Date.now().toString(),
      name: `Tier ${tiers.length + 1}`,
      description: 'Perfect for getting started',
      price: '99',
      duration: 'mo',
      features: [
        { id: '1', text: 'Feature 1', included: true },
        { id: '2', text: 'Feature 2', included: true },
        { id: '3', text: 'Feature 3', included: false }
      ],
      isPopular: false,
      buttonText: 'Get Started',
      position: tiers.length
    };
    
    onChange([...tiers, newTier]);
    setSelectedTier(newTier.id);
  };

  const removeTier = (tierId: string) => {
    const newTiers = tiers.filter(tier => tier.id !== tierId);
    onChange(newTiers);
    if (selectedTier === tierId && newTiers.length > 0) {
      setSelectedTier(newTiers[0].id);
    }
  };

  const updateTier = (tierId: string, field: keyof PricingTier, value: any) => {
    const newTiers = tiers.map(tier =>
      tier.id === tierId ? { ...tier, [field]: value } : tier
    );
    onChange(newTiers);
  };

  const addFeature = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const newFeature: PricingFeature = {
      id: Date.now().toString(),
      text: 'New feature',
      included: true
    };

    updateTier(tierId, 'features', [...tier.features, newFeature]);
  };

  const updateFeature = (tierId: string, featureId: string, field: keyof PricingFeature, value: any) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const newFeatures = tier.features.map(feature =>
      feature.id === featureId ? { ...feature, [field]: value } : feature
    );

    updateTier(tierId, 'features', newFeatures);
  };

  const removeFeature = (tierId: string, featureId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const newFeatures = tier.features.filter(f => f.id !== featureId);
    updateTier(tierId, 'features', newFeatures);
  };

  const moveFeature = (tierId: string, featureId: string, direction: 'up' | 'down') => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const features = [...tier.features];
    const index = features.findIndex(f => f.id === featureId);
    
    if (direction === 'up' && index > 0) {
      [features[index], features[index - 1]] = [features[index - 1], features[index]];
    } else if (direction === 'down' && index < features.length - 1) {
      [features[index], features[index + 1]] = [features[index + 1], features[index]];
    }

    updateTier(tierId, 'features', features);
  };

  const getCurrentTier = () => tiers.find(t => t.id === selectedTier);
  const currentTier = getCurrentTier();

  const PricingPreview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier) => (
        <Card 
          key={tier.id} 
          className={`relative border-2 transition-all duration-300 ${
            tier.isPopular 
              ? 'border-primary shadow-xl scale-105' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          {tier.isPopular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          )}
          
          {tier.badge && (
            <div className="absolute -top-2 -right-2">
              <Badge variant="secondary" className="text-xs">
                {tier.badge}
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">${tier.price}</span>
                <span className="text-muted-foreground">
                  /{tier.duration === 'mo' ? 'month' : tier.duration === 'yr' ? 'year' : 'one-time'}
                </span>
              </div>
              {tier.originalPrice && (
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="line-through">${tier.originalPrice}</span>
                  <span className="text-green-600 ml-2">
                    Save ${Number(tier.originalPrice) - Number(tier.price)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {tier.features.map((feature) => (
                <li key={feature.id} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  {feature.isHtml ? (
                    <div 
                      className="text-sm flex-1"
                      dangerouslySetInnerHTML={{ __html: feature.text }}
                    />
                  ) : (
                    <span className={`text-sm flex-1 ${!feature.included ? 'text-muted-foreground' : ''}`}>
                      {feature.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            
            <Button 
              className={`w-full mt-4 ${tier.isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
              variant={tier.isPopular ? 'default' : 'outline'}
            >
              {tier.buttonText}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pricing Tiers</h3>
          <p className="text-sm text-muted-foreground">
            Create up to 4 pricing tiers with custom features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          {!previewMode && tiers.length < 4 && (
            <Button onClick={addTier} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          )}
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <PricingPreview />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tier Selection Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Pricing Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTier === tier.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${tier.price}/{tier.duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {tier.isPopular && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTier(tier.id);
                        }}
                        className="w-6 h-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tier Editor */}
          {currentTier && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Edit {currentTier.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tier Name</Label>
                        <Input
                          value={currentTier.name}
                          onChange={(e) => updateTier(currentTier.id, 'name', e.target.value)}
                          placeholder="e.g., Basic, Pro, Enterprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Button Text</Label>
                        <Input
                          value={currentTier.buttonText}
                          onChange={(e) => updateTier(currentTier.id, 'buttonText', e.target.value)}
                          placeholder="e.g., Get Started, Choose Plan"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={currentTier.description}
                        onChange={(e) => updateTier(currentTier.id, 'description', e.target.value)}
                        placeholder="Brief description of this tier"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={currentTier.price}
                            onChange={(e) => updateTier(currentTier.id, 'price', e.target.value)}
                            className="pl-9"
                            placeholder="99"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Original Price (optional)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={currentTier.originalPrice || ''}
                            onChange={(e) => updateTier(currentTier.id, 'originalPrice', e.target.value || undefined)}
                            className="pl-9"
                            placeholder="149"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <select
                          value={currentTier.duration}
                          onChange={(e) => updateTier(currentTier.id, 'duration', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="mo">Per Month</option>
                          <option value="yr">Per Year</option>
                          <option value="one-time">One Time</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentTier.isPopular}
                          onCheckedChange={(checked) => updateTier(currentTier.id, 'isPopular', checked)}
                        />
                        <Label>Mark as Popular</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Badge Text (optional)</Label>
                      <Input
                        value={currentTier.badge || ''}
                        onChange={(e) => updateTier(currentTier.id, 'badge', e.target.value || undefined)}
                        placeholder="e.g., Best Value, Limited Time"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Features List</Label>
                      <Button
                        onClick={() => addFeature(currentTier.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {currentTier.features.map((feature, index) => (
                        <Card key={feature.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={feature.included}
                                  onCheckedChange={(checked) => 
                                    updateFeature(currentTier.id, feature.id, 'included', checked)
                                  }
                                />
                                <Label>Included in this tier</Label>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveFeature(currentTier.id, feature.id, 'up')}
                                  disabled={index === 0}
                                  className="w-8 h-8 p-0"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveFeature(currentTier.id, feature.id, 'down')}
                                  disabled={index === currentTier.features.length - 1}
                                  className="w-8 h-8 p-0"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeature(currentTier.id, feature.id)}
                                  className="w-8 h-8 p-0 text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={feature.isHtml || false}
                                onCheckedChange={(checked) => 
                                  updateFeature(currentTier.id, feature.id, 'isHtml', checked)
                                }
                              />
                              <Label>Use HTML</Label>
                              <Code className="w-4 h-4 text-muted-foreground" />
                            </div>
                            
                            {feature.isHtml ? (
                              <Textarea
                                value={feature.text}
                                onChange={(e) => 
                                  updateFeature(currentTier.id, feature.id, 'text', e.target.value)
                                }
                                placeholder="<strong>Premium Support</strong> with <em>24/7 availability</em>"
                                rows={3}
                                className="font-mono text-sm"
                              />
                            ) : (
                              <Input
                                value={feature.text}
                                onChange={(e) => 
                                  updateFeature(currentTier.id, feature.id, 'text', e.target.value)
                                }
                                placeholder="e.g., 24/7 Support, Unlimited Access, Custom Branding"
                              />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};