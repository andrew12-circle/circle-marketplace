import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Star, TrendingUp, Users, DollarSign, Clock, Trophy } from "lucide-react";

interface Testimonial {
  name: string;
  title?: string;
  content: string;
  rating: number;
  image?: string;
}

interface Stat {
  value: string;
  label: string;
  icon?: string;
}

interface FunnelTestimonialsEditorProps {
  testimonials: Testimonial[];
  stats: Stat[];
  onChange: (type: 'testimonials' | 'stats', data: Testimonial[] | Stat[]) => void;
}

const ICON_OPTIONS = [
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'DollarSign', label: 'Dollar Sign', icon: DollarSign },
  { value: 'Clock', label: 'Clock', icon: Clock },
  { value: 'Trophy', label: 'Trophy', icon: Trophy },
  { value: 'Star', label: 'Star', icon: Star }
];

export const FunnelTestimonialsEditor = ({ testimonials, stats, onChange }: FunnelTestimonialsEditorProps) => {
  const [testimonialsData, setTestimonialsData] = useState<Testimonial[]>(testimonials || []);
  const [statsData, setStatsData] = useState<Stat[]>(stats || []);

  // Testimonials handlers
  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      name: "Customer Name",
      title: "Company/Title",
      content: "Amazing service! This really helped transform my business.",
      rating: 5
    };
    const updated = [...testimonialsData, newTestimonial];
    setTestimonialsData(updated);
    onChange('testimonials', updated);
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: any) => {
    const updated = [...testimonialsData];
    updated[index] = { ...updated[index], [field]: value };
    setTestimonialsData(updated);
    onChange('testimonials', updated);
  };

  const removeTestimonial = (index: number) => {
    const updated = testimonialsData.filter((_, i) => i !== index);
    setTestimonialsData(updated);
    onChange('testimonials', updated);
  };

  // Stats handlers
  const addStat = () => {
    const newStat: Stat = {
      value: "100%",
      label: "Success Rate",
      icon: "TrendingUp"
    };
    const updated = [...statsData, newStat];
    setStatsData(updated);
    onChange('stats', updated);
  };

  const updateStat = (index: number, field: keyof Stat, value: any) => {
    const updated = [...statsData];
    updated[index] = { ...updated[index], [field]: value };
    setStatsData(updated);
    onChange('stats', updated);
  };

  const removeStat = (index: number) => {
    const updated = statsData.filter((_, i) => i !== index);
    setStatsData(updated);
    onChange('stats', updated);
  };

  const renderStars = (rating: number, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
            onClick={() => onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    return iconOption?.icon || TrendingUp;
  };

  return (
    <div className="space-y-6">
      {/* Testimonials Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Testimonials</CardTitle>
            <Button onClick={addTestimonial} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Testimonial
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {testimonialsData.map((testimonial, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Testimonial {index + 1}</Badge>
                    {renderStars(testimonial.rating, (rating) => 
                      updateTestimonial(index, 'rating', rating)
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTestimonial(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={testimonial.name}
                      onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Title/Company (Optional)</Label>
                    <Input
                      value={testimonial.title || ""}
                      onChange={(e) => updateTestimonial(index, 'title', e.target.value)}
                      placeholder="CEO, Company Name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Image URL (Optional)</Label>
                  <Input
                    value={testimonial.image || ""}
                    onChange={(e) => updateTestimonial(index, 'image', e.target.value)}
                    placeholder="https://example.com/customer-photo.jpg"
                  />
                </div>

                <div>
                  <Label>Testimonial Content</Label>
                  <Textarea
                    value={testimonial.content}
                    onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                    placeholder="Share what the customer said about your service..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}

          {testimonialsData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No testimonials added yet. Click "Add Testimonial" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Stats</CardTitle>
            <Button onClick={addStat} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Stat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {statsData.map((stat, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Stat {index + 1}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeStat(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Value</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStat(index, 'value', e.target.value)}
                    placeholder="600%, $10K, 24/7..."
                  />
                </div>
                <div>
                  <Label>Label</Label>
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStat(index, 'label', e.target.value)}
                    placeholder="ROI, Revenue, Support..."
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={stat.icon || 'TrendingUp'}
                    onValueChange={(value) => updateStat(index, 'icon', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {React.createElement(getIconComponent(stat.icon || 'TrendingUp'), {
                      className: "w-5 h-5 text-blue-600"
                    })}
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}

          {statsData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No stats added yet. Click "Add Stat" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};