import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Star, TrendingUp, Verified } from "lucide-react";

interface ProofTestimonial {
  id: string;
  name: string;
  company: string;
  content: string;
  rating: number;
}

interface ProofCaseStudy {
  beforeValue: number;
  afterValue: number;
  beforeLabel: string;
  afterLabel: string;
  percentageIncrease: number;
  timeframe: string;
  description: string;
}

interface ProofVendorVerification {
  badges: string[];
  description: string;
}

interface ProofItWorksData {
  introText?: string;
  testimonials: {
    enabled: boolean;
    items: ProofTestimonial[];
  };
  caseStudy: {
    enabled: boolean;
    data: ProofCaseStudy;
  };
  vendorVerification: {
    enabled: boolean;
    data: ProofVendorVerification;
  };
}

interface FunnelProofEditorProps {
  proofData: ProofItWorksData;
  onChange: (data: ProofItWorksData) => void;
}

export const FunnelProofEditor = ({ proofData, onChange }: FunnelProofEditorProps) => {
  const [data, setData] = useState<ProofItWorksData>(proofData);

  useEffect(() => {
    setData(proofData);
  }, [proofData]);

  const updateData = (section: keyof Omit<ProofItWorksData, 'introText'>, updates: any) => {
    const newData = {
      ...data,
      [section]: {
        ...data[section],
        ...updates
      }
    };
    setData(newData);
    onChange(newData);
  };

  const addTestimonial = () => {
    const newTestimonial: ProofTestimonial = {
      id: Date.now().toString(),
      name: "",
      company: "",
      content: "",
      rating: 5
    };
    updateData('testimonials', {
      items: [...data.testimonials.items, newTestimonial]
    });
  };

  const updateTestimonial = (id: string, field: keyof ProofTestimonial, value: any) => {
    const updatedItems = data.testimonials.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData('testimonials', { items: updatedItems });
  };

  const removeTestimonial = (id: string) => {
    const updatedItems = data.testimonials.items.filter(item => item.id !== id);
    updateData('testimonials', { items: updatedItems });
  };

  const updateCaseStudy = (field: keyof ProofCaseStudy, value: any) => {
    updateData('caseStudy', {
      data: { ...data.caseStudy.data, [field]: value }
    });
  };

  const updateVendorVerification = (field: keyof ProofVendorVerification, value: any) => {
    updateData('vendorVerification', {
      data: { ...data.vendorVerification.data, [field]: value }
    });
  };

  const addBadge = () => {
    const newBadges = [...data.vendorVerification.data.badges, ""];
    updateVendorVerification('badges', newBadges);
  };

  const updateBadge = (index: number, value: string) => {
    const updatedBadges = data.vendorVerification.data.badges.map((badge, i) =>
      i === index ? value : badge
    );
    updateVendorVerification('badges', updatedBadges);
  };

  const removeBadge = (index: number) => {
    const updatedBadges = data.vendorVerification.data.badges.filter((_, i) => i !== index);
    updateVendorVerification('badges', updatedBadges);
  };

  const renderStars = (rating: number, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Verified className="w-5 h-5" />
            Proof It Works Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intro Text Section */}
          <div className="space-y-4">
            <Label htmlFor="intro-text" className="text-base font-medium">
              Introduction Text (Optional)
            </Label>
            <Textarea
              id="intro-text"
              value={data.introText || ''}
              onChange={(e) => {
                const newData = { ...data, introText: e.target.value };
                setData(newData);
                onChange(newData);
              }}
              placeholder="Add explanatory text that appears before testimonials, case studies, etc..."
              rows={3}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              This text will appear at the top of the "Proof It Works" section to provide context or explanation.
            </p>
          </div>

          <Separator />

          {/* Testimonials Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <Label htmlFor="testimonials-enabled" className="text-base font-medium">
                  Agent Reviews
                </Label>
              </div>
              <Switch
                id="testimonials-enabled"
                checked={data.testimonials.enabled}
                onCheckedChange={(enabled) => updateData('testimonials', { enabled })}
              />
            </div>

            {data.testimonials.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-yellow-200">
                <Button
                  type="button"
                  onClick={addTestimonial}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Testimonial
                </Button>

                {data.testimonials.items.map((testimonial) => (
                  <Card key={testimonial.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {renderStars(testimonial.rating, (rating) => 
                            updateTestimonial(testimonial.id, 'rating', rating)
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeTestimonial(testimonial.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Name</Label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) => updateTestimonial(testimonial.id, 'name', e.target.value)}
                            placeholder="e.g., Sarah M."
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Company</Label>
                          <Input
                            value={testimonial.company}
                            onChange={(e) => updateTestimonial(testimonial.id, 'company', e.target.value)}
                            placeholder="e.g., Keller Williams"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Testimonial Content</Label>
                        <Textarea
                          value={testimonial.content}
                          onChange={(e) => updateTestimonial(testimonial.id, 'content', e.target.value)}
                          placeholder="Share the testimonial content..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Case Study Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <Label htmlFor="case-study-enabled" className="text-base font-medium">
                  Case Study Results
                </Label>
              </div>
              <Switch
                id="case-study-enabled"
                checked={data.caseStudy.enabled}
                onCheckedChange={(enabled) => updateData('caseStudy', { enabled })}
              />
            </div>

            {data.caseStudy.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-green-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Before Value</Label>
                    <Input
                      type="number"
                      value={data.caseStudy.data.beforeValue}
                      onChange={(e) => updateCaseStudy('beforeValue', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">After Value</Label>
                    <Input
                      type="number"
                      value={data.caseStudy.data.afterValue}
                      onChange={(e) => updateCaseStudy('afterValue', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Before Label</Label>
                    <Input
                      value={data.caseStudy.data.beforeLabel}
                      onChange={(e) => updateCaseStudy('beforeLabel', e.target.value)}
                      placeholder="e.g., leads/month"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">After Label</Label>
                    <Input
                      value={data.caseStudy.data.afterLabel}
                      onChange={(e) => updateCaseStudy('afterLabel', e.target.value)}
                      placeholder="e.g., leads/month"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Percentage Increase</Label>
                    <Input
                      type="number"
                      value={data.caseStudy.data.percentageIncrease}
                      onChange={(e) => updateCaseStudy('percentageIncrease', parseInt(e.target.value) || 0)}
                      placeholder="608"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Timeframe</Label>
                    <Input
                      value={data.caseStudy.data.timeframe}
                      onChange={(e) => updateCaseStudy('timeframe', e.target.value)}
                      placeholder="e.g., 90 Days"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Description</Label>
                  <Input
                    value={data.caseStudy.data.description}
                    onChange={(e) => updateCaseStudy('description', e.target.value)}
                    placeholder="e.g., Real agent results from Q3 2024"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Vendor Verification Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Verified className="w-5 h-5 text-emerald-500" />
                <Label htmlFor="vendor-verification-enabled" className="text-base font-medium">
                  Vendor Verification
                </Label>
              </div>
              <Switch
                id="vendor-verification-enabled"
                checked={data.vendorVerification.enabled}
                onCheckedChange={(enabled) => updateData('vendorVerification', { enabled })}
              />
            </div>

            {data.vendorVerification.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-emerald-200">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Verification Badges</Label>
                    <Button
                      type="button"
                      onClick={addBadge}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {data.vendorVerification.data.badges.map((badge, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={badge}
                          onChange={(e) => updateBadge(index, e.target.value)}
                          placeholder="e.g., Background checked"
                        />
                        <Button
                          type="button"
                          onClick={() => removeBadge(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    value={data.vendorVerification.data.description}
                    onChange={(e) => updateVendorVerification('description', e.target.value)}
                    placeholder="This vendor has been vetted and meets our quality standards."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};