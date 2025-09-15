import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FunnelSectionEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const FunnelSectionEditor = ({ data, onChange }: FunnelSectionEditorProps) => {
  const handleBasicInfoChange = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              value={data.title || ""}
              onChange={(e) => handleBasicInfoChange('title', e.target.value)}
              placeholder="Enter service title..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description || ""}
              onChange={(e) => handleBasicInfoChange('description', e.target.value)}
              placeholder="Enter service description..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              value={data.website_url || ""}
              onChange={(e) => handleBasicInfoChange('website_url', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Time to Results</Label>
            <Select value={data.duration || ""} onValueChange={(value) => handleBasicInfoChange('duration', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="1-7 days">1-7 days</SelectItem>
                <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                <SelectItem value="1-3 months">1-3 months</SelectItem>
                <SelectItem value="3+ months">3+ months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup_time">Setup Time</Label>
            <Select value={data.setup_time || ""} onValueChange={(value) => handleBasicInfoChange('setup_time', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select setup time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="1-7 days">1-7 days</SelectItem>
                <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                <SelectItem value="1-3 months">1-3 months</SelectItem>
                <SelectItem value="3+ months">3+ months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Service Images */}
      <Card>
        <CardHeader>
          <CardTitle>Service Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image_url">Main Image URL</Label>
            <Input
              id="image_url"
              value={data.image_url || ""}
              onChange={(e) => handleBasicInfoChange('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={data.logo_url || ""}
              onChange={(e) => handleBasicInfoChange('logo_url', e.target.value)}
              placeholder="https://example.com/logo.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="retail_price">List Price</Label>
            <Input
              id="retail_price"
              value={data.retail_price || ""}
              onChange={(e) => handleBasicInfoChange('retail_price', e.target.value)}
              placeholder="$99/month"
            />
          </div>

          <div>
            <Label htmlFor="pro_price">Pro Price</Label>
            <Input
              id="pro_price"
              value={data.pro_price || ""}
              onChange={(e) => handleBasicInfoChange('pro_price', e.target.value)}
              placeholder="$89/month"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_duration">Price Duration</Label>
            <Select value={data.price_duration || ""} onValueChange={(value) => handleBasicInfoChange('price_duration', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="per-use">Per-use</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing_mode">Pricing Mode</Label>
            <Select value={data.pricing_mode || "auto"} onValueChange={(value) => handleBasicInfoChange('pricing_mode', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pricing mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="fixed">Fixed Pricing</SelectItem>
                <SelectItem value="features_only">Features Only</SelectItem>
                <SelectItem value="custom_quote">Custom Quote</SelectItem>
                <SelectItem value="external_link">External Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Tiers */}
          {data.pricing_tiers && data.pricing_tiers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pricing Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.pricing_tiers.map((tier: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-medium">Tier {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newTiers = [...(data.pricing_tiers || [])];
                          newTiers.splice(index, 1);
                          handleBasicInfoChange('pricing_tiers', newTiers);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={tier.name || ""}
                          onChange={(e) => {
                            const newTiers = [...(data.pricing_tiers || [])];
                            newTiers[index] = { ...tier, name: e.target.value };
                            handleBasicInfoChange('pricing_tiers', newTiers);
                          }}
                          placeholder="Basic, Pro, etc."
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          value={tier.price || ""}
                          onChange={(e) => {
                            const newTiers = [...(data.pricing_tiers || [])];
                            newTiers[index] = { ...tier, price: e.target.value };
                            handleBasicInfoChange('pricing_tiers', newTiers);
                          }}
                          placeholder="$99"
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTiers = [...(data.pricing_tiers || [])];
                    newTiers.push({ name: "", price: "", features: [] });
                    handleBasicInfoChange('pricing_tiers', newTiers);
                  }}
                  className="w-full"
                >
                  + Add Tier
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="headline">Main Headline</Label>
            <Input
              id="headline"
              value={data.headline || ""}
              onChange={(e) => handleBasicInfoChange('headline', e.target.value)}
              placeholder="Enter compelling headline..."
            />
          </div>
          <div>
            <Label htmlFor="subHeadline">Sub-headline</Label>
            <Textarea
              id="subHeadline"
              value={data.subHeadline || ""}
              onChange={(e) => handleBasicInfoChange('subHeadline', e.target.value)}
              placeholder="Supporting description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};