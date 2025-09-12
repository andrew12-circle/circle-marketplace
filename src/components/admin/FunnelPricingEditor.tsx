import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Star, DollarSign } from "lucide-react";

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
  pro_price?: string;
  originalPrice?: string;
  yearlyPrice?: string;
  yearlyOriginalPrice?: string;
  duration: string;
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  badge?: string;
  position: number;
  requestPricing?: boolean;
}

interface PricingModeEditorProps {
  pricingTiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  pricingMode?: string;
  pricingExternalUrl?: string;
  pricingCtaLabel?: string;
  pricingCtaType?: string;
  pricingNote?: string;
  onPricingModeChange?: (mode: string) => void;
  onPricingFieldChange?: (field: string, value: string) => void;
  service?: any;
}

export const FunnelPricingEditor = ({ 
  pricingTiers, 
  onChange, 
  pricingMode = 'auto',
  pricingExternalUrl = '',
  pricingCtaLabel = 'Get a custom quote',
  pricingCtaType = 'quote',
  pricingNote = '',
  onPricingModeChange,
  onPricingFieldChange,
  service
}: PricingModeEditorProps) => {
  const [tiers, setTiers] = useState<PricingTier[]>(pricingTiers || []);

  const addTier = () => {
    const newTier: PricingTier = {
      id: `tier-${Date.now()}`,
      name: "New Package",
      description: "Package description",
      price: "99",
      duration: "one-time",
      features: [
        { id: "f1", text: "Feature 1", included: true },
        { id: "f2", text: "Feature 2", included: true },
        { id: "f3", text: "Feature 3", included: true }
      ],
      isPopular: false,
      buttonText: "Get Started",
      position: tiers.length,
      requestPricing: false
    };
    const updatedTiers = [...tiers, newTier];
    setTiers(updatedTiers);
    onChange(updatedTiers);
  };

  const updateTier = (index: number, field: keyof PricingTier, value: any) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      [field]: value
    };
    setTiers(updatedTiers);
    onChange(updatedTiers);
  };

  const removeTier = (index: number) => {
    const updatedTiers = tiers.filter((_, i) => i !== index);
    setTiers(updatedTiers);
    onChange(updatedTiers);
  };

  const addFeature = (tierIndex: number) => {
    const updatedTiers = [...tiers];
    const newFeature: PricingFeature = {
      id: `f-${Date.now()}`,
      text: "New feature",
      included: true
    };
    updatedTiers[tierIndex].features.push(newFeature);
    setTiers(updatedTiers);
    onChange(updatedTiers);
  };

  const updateFeature = (tierIndex: number, featureIndex: number, field: keyof PricingFeature, value: any) => {
    const updatedTiers = [...tiers];
    updatedTiers[tierIndex].features[featureIndex] = {
      ...updatedTiers[tierIndex].features[featureIndex],
      [field]: value
    };
    setTiers(updatedTiers);
    onChange(updatedTiers);
  };

  const removeFeature = (tierIndex: number, featureIndex: number) => {
    const updatedTiers = [...tiers];
    updatedTiers[tierIndex].features = updatedTiers[tierIndex].features.filter((_, i) => i !== featureIndex);
    setTiers(updatedTiers);
    onChange(updatedTiers);
  };

  const handleModeChange = (value: string) => {
    onPricingModeChange?.(value);
  };

  const handleFieldChange = (field: string, value: string) => {
    onPricingFieldChange?.(field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Pricing Fields - Always show when service and callback are provided */}
        {service && onPricingFieldChange && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold">Core Pricing Fields</h4>
            <p className="text-sm text-muted-foreground">
              These are the main pricing fields used throughout the application. Changes here update immediately.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="retail_price">Retail Price ($)</Label>
                <input
                  id="retail_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={service.retail_price ? parseFloat(service.retail_price.replace(/[^\d.]/g, '')) || '' : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    console.log('[FunnelPricingEditor] Retail price changed:', value);
                    onPricingFieldChange('retail_price', value === null ? null : value.toString());
                  }}
                  placeholder="199.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="pro_price">Pro Member Price ($)</Label>
                <input
                  id="pro_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={service.pro_price ? parseFloat(service.pro_price.replace(/[^\d.]/g, '')) || '' : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    console.log('[FunnelPricingEditor] Pro price changed:', value);
                    onPricingFieldChange('pro_price', value === null ? null : value.toString());
                  }}
                  placeholder="149.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="co_pay_price">Co-Pay Price ($)</Label>
                <input
                  id="co_pay_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={service.co_pay_price ? parseFloat(service.co_pay_price.replace(/[^\d.]/g, '')) || '' : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    console.log('[FunnelPricingEditor] Co-pay price changed:', value);
                    onPricingFieldChange('co_pay_price', value === null ? null : value.toString());
                  }}
                  placeholder="99.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Pricing Mode Selector */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pricing-mode">Pricing Mode</Label>
            <select
              id="pricing-mode"
              value={pricingMode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Auto - Let AI detect best mode</option>
              <option value="fixed">Fixed - Show pricing cards with amounts</option>
              <option value="features_only">Features Only - Show cards without prices</option>
              <option value="custom_quote">Custom Quote - Single quote panel</option>
              <option value="external_link">External Link - Redirect to vendor site</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {pricingMode === 'auto' && 'AI will choose the best mode based on available pricing data'}
              {pricingMode === 'fixed' && 'Display up to 4 pricing cards with prices and features'}
              {pricingMode === 'features_only' && 'Show feature comparison without prices, ideal for consultation-based services'}
              {pricingMode === 'custom_quote' && 'Single panel for custom pricing or complex services'}
              {pricingMode === 'external_link' && 'Direct users to vendor website for pricing'}
            </p>
          </div>

          {/* External Link Mode Fields */}
          {pricingMode === 'external_link' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="external-url">External Pricing URL *</Label>
                <Input
                  id="external-url"
                  type="url"
                  value={pricingExternalUrl || ""}
                  onChange={(e) => handleFieldChange('pricing_external_url', e.target.value)}
                  placeholder="https://vendor.com/pricing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external-cta">Button Label</Label>
                <Input
                  id="external-cta"
                  value={pricingCtaLabel || ""}
                  onChange={(e) => handleFieldChange('pricing_cta_label', e.target.value)}
                  placeholder="See Pricing"
                />
              </div>
              {pricingExternalUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pricingExternalUrl, '_blank')}
                >
                  Preview Link
                </Button>
              )}
            </div>
          )}

          {/* Custom Quote Mode Fields */}
          {pricingMode === 'custom_quote' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="quote-note">Custom Pricing Description</Label>
                <Textarea
                  id="quote-note"
                  value={pricingNote}
                  onChange={(e) => handleFieldChange('pricing_note', e.target.value)}
                  placeholder="Describe your custom pricing approach..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quote-cta-label">CTA Button Text</Label>
                  <Input
                    id="quote-cta-label"
                    value={pricingCtaLabel}
                    onChange={(e) => handleFieldChange('pricing_cta_label', e.target.value)}
                    placeholder="Get a custom quote"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-cta-type">CTA Type</Label>
                  <select
                    id="quote-cta-type"
                    value={pricingCtaType || "quote"}
                    onChange={(e) => handleFieldChange('pricing_cta_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="quote">Request Quote</option>
                    <option value="consult">Book Consultation</option>
                    <option value="external">External Link</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Show pricing cards editor only for fixed and features_only modes */}
        {(pricingMode === 'fixed' || pricingMode === 'features_only' || pricingMode === 'auto') && (
          <>
            <div className="mb-4">
              <Button onClick={addTier} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Pricing Package
              </Button>
            </div>
            
            {tiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pricing packages added yet.</p>
                <p className="text-sm">Click "Add Pricing Package" to get started.</p>
              </div>
            ) : (
              tiers.map((tier, tierIndex) => (
                <div key={tier.id} className="p-6 border rounded-lg bg-gray-50 mb-6">
                  <div className="space-y-4">
                    {/* Tier Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold">{tier.name}</h3>
                        {tier.isPopular && (
                          <Badge className="bg-blue-500 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTier(tierIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${tierIndex}`}>Package Name</Label>
                        <Input
                          id={`name-${tierIndex}`}
                          value={tier.name || ""}
                          onChange={(e) => updateTier(tierIndex, 'name', e.target.value)}
                          placeholder="Basic, Pro, Premium..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`description-${tierIndex}`}>Description</Label>
                        <Textarea
                          id={`description-${tierIndex}`}
                          value={tier.description || ""}
                          onChange={(e) => updateTier(tierIndex, 'description', e.target.value)}
                          placeholder="Brief description of this package..."
                          rows={2}
                        />
                      </div>
                    </div>

                     {/* Only show price fields in fixed mode */}
                     {pricingMode !== 'features_only' && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                           <Label htmlFor={`price-${tierIndex}`}>Retail Price ($)</Label>
                           <Input
                             id={`price-${tierIndex}`}
                             type="number"
                             value={tier.price || ""}
                             onChange={(e) => updateTier(tierIndex, 'price', e.target.value)}
                             placeholder="0"
                             min="0"
                             step="0.01"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`pro-price-${tierIndex}`}>Circle Pro Price ($)</Label>
                           <Input
                             id={`pro-price-${tierIndex}`}
                             type="number"
                             value={tier.pro_price || ""}
                             onChange={(e) => updateTier(tierIndex, 'pro_price', e.target.value)}
                             placeholder="0"
                             min="0"
                             step="0.01"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`duration-${tierIndex}`}>Duration</Label>
                           <select
                             id={`duration-${tierIndex}`}
                             value={tier.duration || "monthly"}
                             onChange={(e) => updateTier(tierIndex, 'duration', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           >
                             <option value="monthly">Monthly</option>
                             <option value="yearly">Yearly</option>
                             <option value="one-time">One-time</option>
                             <option value="per-file">Per-file</option>
                             <option value="per-user">Per-user</option>
                             <option value="per-transaction">Per-transaction</option>
                             <option value="per-listing">Per-listing</option>
                             <option value="hourly">Hourly</option>
                             <option value="weekly">Weekly</option>
                             <option value="quarterly">Quarterly</option>
                           </select>
                         </div>
                       </div>
                     )}

                    {/* Options */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`popular-${tierIndex}`}
                          checked={tier.isPopular}
                          onCheckedChange={(checked) => updateTier(tierIndex, 'isPopular', checked)}
                        />
                        <Label htmlFor={`popular-${tierIndex}`}>Mark as Popular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`request-pricing-${tierIndex}`}
                          checked={tier.requestPricing || false}
                          onCheckedChange={(checked) => updateTier(tierIndex, 'requestPricing', checked)}
                        />
                        <Label htmlFor={`request-pricing-${tierIndex}`}>Request Pricing</Label>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Features</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addFeature(tierIndex)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Feature
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {tier.features.map((feature, featureIndex) => (
                          <div key={feature.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <Switch
                              checked={feature.included}
                              onCheckedChange={(checked) => 
                                updateFeature(tierIndex, featureIndex, 'included', checked)
                              }
                            />
                            <Input
                              value={feature.text || ""}
                              onChange={(e) => 
                                updateFeature(tierIndex, featureIndex, 'text', e.target.value)
                              }
                              placeholder="Feature description..."
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFeature(tierIndex, featureIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
        
        {/* Show message for external_link and custom_quote modes */}
        {(pricingMode === 'external_link' || pricingMode === 'custom_quote') && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Pricing cards are not needed for {pricingMode === 'external_link' ? 'external link' : 'custom quote'} mode.</p>
            <p className="text-sm">Configure the settings above to customize the user experience.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};