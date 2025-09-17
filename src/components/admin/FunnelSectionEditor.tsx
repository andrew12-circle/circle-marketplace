import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FunnelSectionEditorProps {
  data: any;
  onChange: (data: any) => void;
  onPricingChange?: (field: string, value: string | number | null) => void;
}

export const FunnelSectionEditor = ({ data, onChange, onPricingChange }: FunnelSectionEditorProps) => {
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
            <Select value={data.duration || ""} onValueChange={(value) => {
              handleBasicInfoChange('duration', value);
              // Also update it in funnel_content for consistency
              if (onPricingChange) {
                onPricingChange('duration', value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
                <SelectItem value="TBD">TBD</SelectItem>
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
            <Select value={data.setup_time || ""} onValueChange={(value) => {
              handleBasicInfoChange('setup_time', value);
              // Also update it via pricing change handler for consistency
              if (onPricingChange) {
                onPricingChange('setup_time', value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select setup time" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
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
        <CardContent className="space-y-6">
          {/* Main Image Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Main Service Image</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={data.image_url || ""}
                  onChange={(e) => handleBasicInfoChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="image_upload">Or Upload Image</Label>
                <Input
                  id="image_upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Create a preview URL and handle upload
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        handleBasicInfoChange('image_url', result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {/* Image Preview */}
            {data.image_url && (
              <div className="mt-3">
                <Label className="text-sm text-muted-foreground">Preview:</Label>
                <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                  <img 
                    src={data.image_url} 
                    alt="Service preview" 
                    className="max-w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Logo Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Company Logo</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={data.logo_url || ""}
                  onChange={(e) => handleBasicInfoChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.jpg"
                />
              </div>
              <div>
                <Label htmlFor="logo_upload">Or Upload Logo</Label>
                <Input
                  id="logo_upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Create a preview URL and handle upload
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        handleBasicInfoChange('logo_url', result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {/* Logo Preview */}
            {data.logo_url && (
              <div className="mt-3">
                <Label className="text-sm text-muted-foreground">Preview:</Label>
                <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                  <img 
                    src={data.logo_url} 
                    alt="Logo preview" 
                    className="max-w-full h-16 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Image Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Profile Image</Label>
            <p className="text-sm text-muted-foreground">Small circular image shown on service cards (appears next to service title)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile_image_url">Profile Image URL</Label>
                <Input
                  id="profile_image_url"
                  value={data.profile_image_url || ""}
                  onChange={(e) => handleBasicInfoChange('profile_image_url', e.target.value)}
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
              <div>
                <Label htmlFor="profile_upload">Or Upload Profile Image</Label>
                <Input
                  id="profile_upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Create a preview URL and handle upload
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        handleBasicInfoChange('profile_image_url', result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {/* Profile Image Preview */}
            {data.profile_image_url && (
              <div className="mt-3">
                <Label className="text-sm text-muted-foreground">Preview (as it appears on service cards):</Label>
                <div className="mt-2 border rounded-lg p-2 bg-gray-50 flex items-center gap-3">
                  <img 
                    src={data.profile_image_url} 
                    alt="Profile preview" 
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-sm text-gray-600">This appears on service cards</span>
                </div>
              </div>
            )}
          </div>
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
              value={data.subHeadline || data.subheadline || ""}
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