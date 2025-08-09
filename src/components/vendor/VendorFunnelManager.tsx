import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Eye, Save, Palette, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VendorFunnelManagerProps {
  vendorId: string;
}

export const VendorFunnelManager = ({ vendorId }: VendorFunnelManagerProps) => {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const [funnelSettings, setFunnelSettings] = useState({
    funnel_enabled: false,
    brand_colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#06b6d4"
    },
    hero_banner_url: "",
    value_statement: "",
    custom_cta_text: "Get Started"
  });

  useEffect(() => {
    fetchVendorData();
  }, [vendorId]);

  const fetchVendorData = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      setVendor(data);
      setFunnelSettings({
        funnel_enabled: (data as any).funnel_enabled || false,
        brand_colors: (data as any).brand_colors || {
          primary: "#3b82f6",
          secondary: "#64748b",
          accent: "#06b6d4"
        },
        hero_banner_url: (data as any).hero_banner_url || "",
        value_statement: (data as any).value_statement || "",
        custom_cta_text: (data as any).custom_cta_text || "Get Started"
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFunnelSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update(funnelSettings as any)
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your funnel customizations have been saved successfully."
      });

      fetchVendorData();
    } catch (error) {
      console.error('Error saving funnel settings:', error);
      toast({
        title: "Error",
        description: "Failed to save funnel settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (colorType: string, value: string) => {
    setFunnelSettings(prev => ({
      ...prev,
      brand_colors: {
        ...prev.brand_colors,
        [colorType]: value
      }
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-banner-${vendorId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vendor-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('vendor-assets')
        .getPublicUrl(fileName);

      setFunnelSettings(prev => ({
        ...prev,
        hero_banner_url: data.publicUrl
      }));

      toast({
        title: "Image uploaded",
        description: "Hero banner has been uploaded successfully."
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload hero banner image",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Service Funnel Customization
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? "Exit Preview" : "Preview"}
              </Button>
              <Button
                onClick={handleSaveFunnelSettings}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Custom Funnel</h3>
                <p className="text-sm text-muted-foreground">
                  Enable custom branding for your service pages
                </p>
              </div>
              <Switch
                checked={funnelSettings.funnel_enabled}
                onCheckedChange={(checked) =>
                  setFunnelSettings(prev => ({ ...prev, funnel_enabled: checked }))
                }
              />
            </div>

            {funnelSettings.funnel_enabled && (
              <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-6">
                  {/* Brand Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Brand Colors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="primary-color">Primary Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="primary-color"
                              type="color"
                              value={funnelSettings.brand_colors.primary}
                              onChange={(e) => handleColorChange('primary', e.target.value)}
                              className="w-16 h-10 p-1"
                            />
                            <Input
                              value={funnelSettings.brand_colors.primary}
                              onChange={(e) => handleColorChange('primary', e.target.value)}
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="secondary-color">Secondary Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="secondary-color"
                              type="color"
                              value={funnelSettings.brand_colors.secondary}
                              onChange={(e) => handleColorChange('secondary', e.target.value)}
                              className="w-16 h-10 p-1"
                            />
                            <Input
                              value={funnelSettings.brand_colors.secondary}
                              onChange={(e) => handleColorChange('secondary', e.target.value)}
                              placeholder="#64748b"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="accent-color">Accent Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="accent-color"
                              type="color"
                              value={funnelSettings.brand_colors.accent}
                              onChange={(e) => handleColorChange('accent', e.target.value)}
                              className="w-16 h-10 p-1"
                            />
                            <Input
                              value={funnelSettings.brand_colors.accent}
                              onChange={(e) => handleColorChange('accent', e.target.value)}
                              placeholder="#06b6d4"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hero Banner */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hero Banner</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="hero-banner">Upload Hero Banner</Label>
                        <div className="mt-2">
                          <Input
                            id="hero-banner"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('hero-banner')?.click()}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Image
                          </Button>
                        </div>
                        {funnelSettings.hero_banner_url && (
                          <div className="mt-4">
                            <img
                              src={funnelSettings.hero_banner_url}
                              alt="Hero banner preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content" className="space-y-6">
                  {/* Content Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Content Customization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="value-statement">Value Statement</Label>
                        <Textarea
                          id="value-statement"
                          value={funnelSettings.value_statement}
                          onChange={(e) =>
                            setFunnelSettings(prev => ({ ...prev, value_statement: e.target.value }))
                          }
                          placeholder="Enter your unique value proposition..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cta-text">Call-to-Action Text</Label>
                        <Input
                          id="cta-text"
                          value={funnelSettings.custom_cta_text}
                          onChange={(e) =>
                            setFunnelSettings(prev => ({ ...prev, custom_cta_text: e.target.value }))
                          }
                          placeholder="Get Started"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                  {/* Preview Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Funnel Preview</CardTitle>
                      <Badge variant="secondary">Live Preview</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg p-4 bg-muted/20">
                        <div 
                          className="relative overflow-hidden rounded-lg p-6"
                          style={{
                            background: `linear-gradient(135deg, ${funnelSettings.brand_colors.primary}15, ${funnelSettings.brand_colors.accent}15)`
                          }}
                        >
                          {funnelSettings.hero_banner_url && (
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-20"
                              style={{ backgroundImage: `url(${funnelSettings.hero_banner_url})` }}
                            />
                          )}
                          <div className="relative">
                            <h2 className="text-2xl font-bold mb-2">Your Service Title</h2>
                            <p className="text-muted-foreground mb-4">
                              {funnelSettings.value_statement || "Your unique value proposition will appear here"}
                            </p>
                            <Button 
                              style={{ backgroundColor: funnelSettings.brand_colors.primary }}
                              className="text-white"
                            >
                              {funnelSettings.custom_cta_text}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};