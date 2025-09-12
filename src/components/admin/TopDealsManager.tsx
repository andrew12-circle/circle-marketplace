import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Settings, TrendingUp, Star, Eye, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';

interface TopDealsConfig {
  discountWeight: number;
  ratingWeight: number;
  featuredBonus: number;
  copayBonus: number;
  brandBonus: number;
  sponsoredBonus: number;
  brandNames: string[];
  enabled: boolean;
  maxDeals: number;
}

interface ServiceScore {
  id: string;
  title: string;
  vendorName: string;
  score: number;
  breakdown: {
    discount: number;
    rating: number;
    featured: number;
    copay: number;
    brand: number;
    sponsored: number;
  };
  reasons: string[];
}

const DEFAULT_CONFIG: TopDealsConfig = {
  discountWeight: 0.3,
  ratingWeight: 10,
  featuredBonus: 20,
  copayBonus: 15,
  brandBonus: 0.1,
  sponsoredBonus: 5,
  brandNames: ['hubspot', 'salesforce', 'mailchimp', 'canva', 'zoom'],
  enabled: true,
  maxDeals: 10
};

export const TopDealsManager = () => {
  const [config, setConfig] = useState<TopDealsConfig>(DEFAULT_CONFIG);
  const [previewScores, setPreviewScores] = useState<ServiceScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  
  const { toast } = useToast();
  const { data: marketplaceData } = useMarketplaceData();
  const services = marketplaceData?.services || [];

  // Load config from app_config table
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('top_deals_enabled')
        .single();

      if (error) throw error;

      if (data?.top_deals_enabled !== undefined) {
        setConfig({ ...DEFAULT_CONFIG, enabled: data.top_deals_enabled });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      // Don't show error toast for missing config, just use defaults
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_config')
        .upsert({ 
          id: '00000000-0000-0000-0000-000000000001',
          top_deals_enabled: config.enabled 
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Top Deals configuration saved successfully',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate service scores using current config
  const calculateServiceScore = (service: any): ServiceScore => {
    let score = 0;
    const breakdown = {
      discount: 0,
      rating: 0,
      featured: 0,
      copay: 0,
      brand: 0,
      sponsored: 0
    };
    const reasons: string[] = [];

    // Discount calculation
    const retail = parseFloat(service.retail_price || '0');
    const pro = parseFloat(service.pro_price || '0');
    const copay = parseFloat(service.co_pay_price || '0');
    
    const discount = retail > 0 && pro > 0 ? ((retail - pro) / retail) * 100 : 0;
    if (discount > 0) {
      breakdown.discount = discount * config.discountWeight;
      score += breakdown.discount;
      reasons.push(`${discount.toFixed(1)}% discount`);
    }

    // Rating calculation (mock data for now)
    const rating = 4.2; // TODO: Get from actual ratings
    breakdown.rating = rating * config.ratingWeight;
    score += breakdown.rating;
    reasons.push(`${rating}/5 rating`);

    // Featured bonus
    if (service.is_featured) {
      breakdown.featured = config.featuredBonus;
      score += breakdown.featured;
      reasons.push('Featured service');
    }

    // Co-pay bonus
    if (service.copay_allowed) {
      breakdown.copay = config.copayBonus;
      score += breakdown.copay;
      reasons.push('Co-pay available');
    }

    // Brand boost
    const vendorName = (service.vendor?.name || '').toLowerCase();
    const brandBoost = config.brandNames.some(brand => vendorName.includes(brand));
    if (brandBoost) {
      breakdown.brand = config.brandBonus * 10;
      score += breakdown.brand;
      reasons.push('Recognized brand');
    }

    // Sponsored boost
    if ((service as any).is_sponsored) {
      breakdown.sponsored = config.sponsoredBonus;
      score += breakdown.sponsored;
      reasons.push('Sponsored placement');
    }

    return {
      id: service.id,
      title: service.title,
      vendorName: service.vendor?.name || 'Unknown',
      score: Math.round(score * 100) / 100,
      breakdown,
      reasons
    };
  };

  // Generate preview scores
  const generatePreview = () => {
    setLoading(true);
    try {
      const scores = services
        .filter(service => {
          // Only include eligible services
          const retail = parseFloat(service.retail_price || '0');
          const pro = parseFloat(service.pro_price || '0');
          const copay = parseFloat(service.co_pay_price || '0');
          
          return (
            service.is_featured ||
            copay > 0 ||
            (service.vendor?.is_verified && pro > 0 && pro < retail)
          );
        })
        .map(calculateServiceScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, config.maxDeals);

      setPreviewScores(scores);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addBrandName = () => {
    if (newBrandName.trim() && !config.brandNames.includes(newBrandName.trim().toLowerCase())) {
      setConfig(prev => ({
        ...prev,
        brandNames: [...prev.brandNames, newBrandName.trim().toLowerCase()]
      }));
      setNewBrandName('');
    }
  };

  const removeBrandName = (brand: string) => {
    setConfig(prev => ({
      ...prev,
      brandNames: prev.brandNames.filter(b => b !== brand)
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Deals Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weights" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weights">Scoring Weights</TabsTrigger>
              <TabsTrigger value="brands">Brand Management</TabsTrigger>
              <TabsTrigger value="preview">Preview & Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="weights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled">Enable Top Deals</Label>
                    <Switch
                      id="enabled"
                      checked={config.enabled}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDeals">Maximum Deals to Show</Label>
                    <Input
                      id="maxDeals"
                      type="number"
                      value={config.maxDeals}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, maxDeals: parseInt(e.target.value) || 10 }))
                      }
                      min="1"
                      max="20"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="discountWeight">Discount Weight</Label>
                    <Input
                      id="discountWeight"
                      type="number"
                      step="0.1"
                      value={config.discountWeight}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, discountWeight: parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Multiplier for discount percentage (e.g., 0.3 = 30% discount gives 9 points)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ratingWeight">Rating Weight</Label>
                    <Input
                      id="ratingWeight"
                      type="number"
                      step="1"
                      value={config.ratingWeight}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, ratingWeight: parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Multiplier for star rating (e.g., 10 = 4.5 stars gives 45 points)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="featuredBonus">Featured Service Bonus</Label>
                    <Input
                      id="featuredBonus"
                      type="number"
                      value={config.featuredBonus}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, featuredBonus: parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">Flat bonus points for featured services</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="copayBonus">Co-pay Bonus</Label>
                    <Input
                      id="copayBonus"
                      type="number"
                      value={config.copayBonus}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, copayBonus: parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">Flat bonus points for co-pay eligible services</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandBonus">Brand Boost</Label>
                    <Input
                      id="brandBonus"
                      type="number"
                      step="0.1"
                      value={config.brandBonus}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, brandBonus: parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Multiplier for recognized brands (applied as bonus * 10)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sponsoredBonus">Sponsored Bonus</Label>
                    <Input
                      id="sponsoredBonus"
                      type="number"
                      value={config.sponsoredBonus}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, sponsoredBonus: parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">Flat bonus points for sponsored services</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button variant="outline" onClick={generatePreview} disabled={loading}>
                  <Eye className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Preview Changes'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="brands" className="space-y-4">
              <div className="space-y-2">
                <Label>Recognized Brand Names</Label>
                <p className="text-sm text-muted-foreground">
                  Services from these brands will receive a scoring boost. Brand matching is case-insensitive and partial.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter brand name (e.g., hubspot)"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBrandName()}
                />
                <Button onClick={addBrandName} disabled={!newBrandName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.brandNames.map((brand) => (
                  <Badge key={brand} variant="secondary" className="flex items-center gap-2">
                    {brand}
                    <button
                      onClick={() => removeBrandName(brand)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {config.brandNames.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No brand names configured. Add some to enable brand scoring boosts.
                </p>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Score Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview how services will be scored and ranked with current settings
                  </p>
                </div>
                <Button onClick={generatePreview} disabled={loading}>
                  <Eye className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Refresh Preview'}
                </Button>
              </div>

              {previewScores.length > 0 ? (
                <div className="space-y-3">
                  {previewScores.map((service, index) => (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <h4 className="font-medium">{service.title}</h4>
                              <Badge variant="secondary">{service.score} pts</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{service.vendorName}</p>
                            <div className="flex flex-wrap gap-1">
                              {service.reasons.map((reason, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground space-y-1">
                            {service.breakdown.discount > 0 && <div>Discount: {service.breakdown.discount.toFixed(1)}</div>}
                            {service.breakdown.rating > 0 && <div>Rating: {service.breakdown.rating.toFixed(1)}</div>}
                            {service.breakdown.featured > 0 && <div>Featured: {service.breakdown.featured}</div>}
                            {service.breakdown.copay > 0 && <div>Co-pay: {service.breakdown.copay}</div>}
                            {service.breakdown.brand > 0 && <div>Brand: {service.breakdown.brand.toFixed(1)}</div>}
                            {service.breakdown.sponsored > 0 && <div>Sponsored: {service.breakdown.sponsored}</div>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Refresh Preview" to see how services will be ranked</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};