import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Star } from 'lucide-react';

interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
  html?: string;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  features: PricingFeature[];
  popular: boolean;
  badge?: string;
  request_pricing: boolean;
  position: number;
}

interface ServicePricingEditorProps {
  pricingTiers: PricingTier[];
  onPricingTiersChange: (tiers: PricingTier[]) => void;
}

export const ServicePricingEditor: React.FC<ServicePricingEditorProps> = ({
  pricingTiers,
  onPricingTiersChange
}) => {
  const [selectedTier, setSelectedTier] = useState<string | null>(
    pricingTiers.length > 0 ? pricingTiers[0].id : null
  );

  const addTier = useCallback(() => {
    const newTier: PricingTier = {
      id: `tier-${Date.now()}`,
      name: 'New Package',
      description: '',
      price: '0',
      duration: 'monthly',
      features: [],
      popular: false,
      request_pricing: false,
      position: pricingTiers.length
    };
    
    const updatedTiers = [...pricingTiers, newTier];
    onPricingTiersChange(updatedTiers);
    setSelectedTier(newTier.id);
  }, [pricingTiers, onPricingTiersChange]);

  const removeTier = useCallback((tierId: string) => {
    const updatedTiers = pricingTiers.filter(tier => tier.id !== tierId);
    onPricingTiersChange(updatedTiers);
    
    if (selectedTier === tierId) {
      setSelectedTier(updatedTiers.length > 0 ? updatedTiers[0].id : null);
    }
  }, [pricingTiers, selectedTier, onPricingTiersChange]);

  const updateTier = useCallback((tierId: string, updates: Partial<PricingTier>) => {
    const updatedTiers = pricingTiers.map(tier =>
      tier.id === tierId ? { ...tier, ...updates } : tier
    );
    onPricingTiersChange(updatedTiers);
  }, [pricingTiers, onPricingTiersChange]);

  const addFeature = useCallback((tierId: string) => {
    const newFeature: PricingFeature = {
      id: `feature-${Date.now()}`,
      text: 'New feature',
      included: true
    };
    
    updateTier(tierId, {
      features: [...(pricingTiers.find(t => t.id === tierId)?.features || []), newFeature]
    });
  }, [pricingTiers, updateTier]);

  const updateFeature = useCallback((tierId: string, featureId: string, updates: Partial<PricingFeature>) => {
    const tier = pricingTiers.find(t => t.id === tierId);
    if (!tier) return;

    const updatedFeatures = tier.features.map(feature =>
      feature.id === featureId ? { ...feature, ...updates } : feature
    );
    
    updateTier(tierId, { features: updatedFeatures });
  }, [pricingTiers, updateTier]);

  const removeFeature = useCallback((tierId: string, featureId: string) => {
    const tier = pricingTiers.find(t => t.id === tierId);
    if (!tier) return;

    const updatedFeatures = tier.features.filter(feature => feature.id !== featureId);
    updateTier(tierId, { features: updatedFeatures });
  }, [pricingTiers, updateTier]);

  const selectedTierData = pricingTiers.find(tier => tier.id === selectedTier);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pricing Packages</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage pricing tiers for your service
          </p>
        </div>
        <Button onClick={addTier} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Package
        </Button>
      </div>

      {pricingTiers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h4 className="text-lg font-medium mb-2">No pricing packages yet</h4>
              <p className="text-muted-foreground mb-4">
                Create your first pricing package to get started
              </p>
              <Button onClick={addTier}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Package
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tier Selection Sidebar */}
          <div className="space-y-3">
            <h4 className="font-medium">Packages</h4>
            {pricingTiers.map((tier) => (
              <Card
                key={tier.id}
                className={`cursor-pointer transition-colors ${
                  selectedTier === tier.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium truncate">{tier.name}</h5>
                        {tier.popular && <Star className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tier.request_pricing ? 'Custom pricing' : `$${tier.price}/${tier.duration}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTier(tier.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tier Editor */}
          {selectedTierData && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Package Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tier-name">Package Name</Label>
                    <Input
                      id="tier-name"
                      value={selectedTierData.name}
                      onChange={(e) => updateTier(selectedTier!, { name: e.target.value })}
                      placeholder="e.g., Basic Plan, Pro Plan, Enterprise"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tier-description">Description</Label>
                    <Textarea
                      id="tier-description"
                      value={selectedTierData.description}
                      onChange={(e) => updateTier(selectedTier!, { description: e.target.value })}
                      placeholder="Brief description of what's included in this package"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tier-price">Price</Label>
                      <Input
                        id="tier-price"
                        type="number"
                        value={selectedTierData.price}
                        onChange={(e) => updateTier(selectedTier!, { price: e.target.value })}
                        placeholder="0"
                        disabled={selectedTierData.request_pricing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tier-duration">Duration</Label>
                      <Select
                        value={selectedTierData.duration}
                        onValueChange={(value) => updateTier(selectedTier!, { duration: value })}
                        disabled={selectedTierData.request_pricing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">One-time</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tier-badge">Badge Text (Optional)</Label>
                    <Input
                      id="tier-badge"
                      value={selectedTierData.badge || ''}
                      onChange={(e) => updateTier(selectedTier!, { badge: e.target.value })}
                      placeholder="e.g., Most Popular, Best Value"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tier-popular"
                        checked={selectedTierData.popular}
                        onCheckedChange={(checked) => updateTier(selectedTier!, { popular: checked })}
                      />
                      <Label htmlFor="tier-popular">Mark as Popular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tier-request-pricing"
                        checked={selectedTierData.request_pricing}
                        onCheckedChange={(checked) => updateTier(selectedTier!, { request_pricing: checked })}
                      />
                      <Label htmlFor="tier-request-pricing">Request Pricing</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Features</CardTitle>
                    <Button size="sm" onClick={() => addFeature(selectedTier!)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedTierData.features.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No features added yet</p>
                      <Button size="sm" onClick={() => addFeature(selectedTier!)}>
                        Add Your First Feature
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTierData.features.map((feature) => (
                        <div key={feature.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 space-y-2">
                            <Input
                              value={feature.text}
                              onChange={(e) => updateFeature(selectedTier!, feature.id, { text: e.target.value })}
                              placeholder="Feature description"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={feature.included}
                              onCheckedChange={(checked) => updateFeature(selectedTier!, feature.id, { included: checked })}
                            />
                            <Badge variant={feature.included ? 'default' : 'secondary'}>
                              {feature.included ? 'Included' : 'Not included'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFeature(selectedTier!, feature.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};