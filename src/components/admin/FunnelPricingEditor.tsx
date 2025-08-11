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
  originalPrice?: string;
  duration: string;
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  badge?: string;
  position: number;
  requestPricing?: boolean;
}

interface FunnelPricingEditorProps {
  pricingTiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
}

export const FunnelPricingEditor = ({ pricingTiers, onChange }: FunnelPricingEditorProps) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pricing Packages</CardTitle>
            <Button onClick={addTier} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {tiers.map((tier, tierIndex) => (
            <div key={tier.id} className="p-6 border rounded-lg bg-gray-50">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Package Name</Label>
                    <Input
                      value={tier.name}
                      onChange={(e) => updateTier(tierIndex, 'name', e.target.value)}
                      placeholder="Basic, Pro, Premium..."
                    />
                  </div>
                  <div>
                    <Label>Price</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <Input
                        value={tier.price}
                        onChange={(e) => updateTier(tierIndex, 'price', e.target.value)}
                        placeholder="99"
                        type="number"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Original Price (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <Input
                        value={tier.originalPrice || ""}
                        onChange={(e) => updateTier(tierIndex, 'originalPrice', e.target.value)}
                        placeholder="199"
                        type="number"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={tier.description}
                    onChange={(e) => updateTier(tierIndex, 'description', e.target.value)}
                    placeholder="Brief description of this package..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <Input
                      value={tier.duration}
                      onChange={(e) => updateTier(tierIndex, 'duration', e.target.value)}
                      placeholder="monthly, one-time, annual..."
                    />
                  </div>
                  <div>
                    <Label>Button Text</Label>
                    <Input
                      value={tier.buttonText}
                      onChange={(e) => updateTier(tierIndex, 'buttonText', e.target.value)}
                      placeholder="Get Started, Buy Now..."
                    />
                  </div>
                  <div>
                    <Label>Badge (Optional)</Label>
                    <Input
                      value={tier.badge || ""}
                      onChange={(e) => updateTier(tierIndex, 'badge', e.target.value)}
                      placeholder="Best Value, Most Popular..."
                    />
                  </div>
                </div>

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
                          value={feature.text}
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
          ))}

          {tiers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No pricing packages yet. Click "Add Package" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};