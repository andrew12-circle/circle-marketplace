import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Benefit {
  title: string;
  description: string;
  icon?: string;
}

interface FunnelSectionEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const FunnelSectionEditor = ({ data, onChange }: FunnelSectionEditorProps) => {
  const [benefits, setBenefits] = useState<Benefit[]>(data.benefits || []);

  const handleBasicInfoChange = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleBenefitChange = (index: number, field: string, value: string) => {
    const updatedBenefits = [...benefits];
    updatedBenefits[index] = {
      ...updatedBenefits[index],
      [field]: value
    };
    setBenefits(updatedBenefits);
    onChange({
      ...data,
      benefits: updatedBenefits
    });
  };

  const addBenefit = () => {
    const newBenefit = {
      title: "New Benefit",
      description: "Describe the benefit here",
      icon: "CheckCircle"
    };
    const updatedBenefits = [...benefits, newBenefit];
    setBenefits(updatedBenefits);
    onChange({
      ...data,
      benefits: updatedBenefits
    });
  };

  const removeBenefit = (index: number) => {
    const updatedBenefits = benefits.filter((_, i) => i !== index);
    setBenefits(updatedBenefits);
    onChange({
      ...data,
      benefits: updatedBenefits
    });
  };

  return (
    <div className="space-y-6">
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

      {/* Benefits Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>Benefits & Features</CardTitle>
          <Button onClick={addBenefit} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Benefit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={benefit.title}
                      onChange={(e) => handleBenefitChange(index, 'title', e.target.value)}
                      placeholder="Benefit title..."
                      className="font-medium"
                    />
                    <Badge variant="outline">{benefit.icon || 'CheckCircle'}</Badge>
                  </div>
                  <Textarea
                    value={benefit.description}
                    onChange={(e) => handleBenefitChange(index, 'description', e.target.value)}
                    placeholder="Benefit description..."
                    rows={2}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeBenefit(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {benefits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No benefits added yet. Click "Add Benefit" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle>Call to Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ctaTitle">CTA Title</Label>
            <Input
              id="ctaTitle"
              value={data.callToAction?.title || ""}
              onChange={(e) => handleBasicInfoChange('callToAction', {
                ...data.callToAction,
                title: e.target.value
              })}
              placeholder="Ready to Transform Your Business?"
            />
          </div>
          <div>
            <Label htmlFor="ctaDescription">CTA Description</Label>
            <Textarea
              id="ctaDescription"
              value={data.callToAction?.description || ""}
              onChange={(e) => handleBasicInfoChange('callToAction', {
                ...data.callToAction,
                description: e.target.value
              })}
              placeholder="Join thousands of agents who've already made the switch"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="ctaButtonText">Button Text</Label>
            <Input
              id="ctaButtonText"
              value={data.callToAction?.buttonText || ""}
              onChange={(e) => handleBasicInfoChange('callToAction', {
                ...data.callToAction,
                buttonText: e.target.value
              })}
              placeholder="Book Your Free Demo"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};