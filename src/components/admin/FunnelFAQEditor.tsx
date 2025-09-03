import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, HelpCircle } from "lucide-react";

interface FAQSection {
  id: string;
  title: string;
  content: string;
  color?: string;
}

interface CallToAction {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: string;
}

interface FunnelFAQEditorProps {
  faqSections: FAQSection[];
  callToAction: CallToAction;
  onChange: (type: 'faqSections' | 'callToAction', data: FAQSection[] | CallToAction) => void;
}

const FAQ_COLORS = [
  { value: 'blue', label: 'Blue', class: 'border-l-blue-500' },
  { value: 'purple', label: 'Purple', class: 'border-l-purple-500' },
  { value: 'orange', label: 'Orange', class: 'border-l-orange-500' },
  { value: 'red', label: 'Red', class: 'border-l-red-500' },
  { value: 'emerald', label: 'Emerald', class: 'border-l-emerald-500' },
  { value: 'pink', label: 'Pink', class: 'border-l-pink-500' },
  { value: 'violet', label: 'Violet', class: 'border-l-violet-500' },
  { value: 'teal', label: 'Teal', class: 'border-l-teal-500' }
];

const DEFAULT_FAQ_SECTIONS = [
  {
    id: "question-1",
    title: "Why Should I Care?",
    content: "All-in-one real estate lead generation & CRM platform designed to turn online leads into closings faster",
    color: "blue"
  },
  {
    id: "question-2",
    title: "What's My ROI Potential?",
    content: "600% average return on investment with proper implementation",
    color: "purple"
  },
  {
    id: "question-3", 
    title: "How Soon Will I See Results?",
    content: "Most clients see initial results within 24-48 hours for setup, first leads in 1-2 weeks, and closings within 30-90 days",
    color: "orange"
  },
  {
    id: "question-4",
    title: "What's Included?",
    content: "Complete system with IDX website, CRM with auto-drip, Facebook & Google ad integration, text & email automation, and lead routing",
    color: "red"
  },
  {
    id: "question-5",
    title: "Proof It Works",
    content: "Over 1000+ successful implementations with verified case studies and testimonials",
    color: "emerald"
  }
];

export const FunnelFAQEditor = ({ faqSections, callToAction, onChange }: FunnelFAQEditorProps) => {
  const [faqData, setFaqData] = useState<FAQSection[]>(faqSections?.length ? faqSections : DEFAULT_FAQ_SECTIONS);
  const [ctaData, setCtaData] = useState<CallToAction>(callToAction || {
    title: "Ready to Transform Your Business?",
    description: "Join thousands of agents who've already made the switch",
    buttonText: "Book Your Free Demo",
    buttonVariant: "default"
  });

  const addFAQSection = () => {
    const newSection: FAQSection = {
      id: `question-${faqData.length + 1}`,
      title: "New Question",
      content: "Answer content goes here...",
      color: FAQ_COLORS[faqData.length % FAQ_COLORS.length].value
    };
    const updated = [...faqData, newSection];
    setFaqData(updated);
    onChange('faqSections', updated);
  };

  const updateFAQSection = (index: number, field: keyof FAQSection, value: string) => {
    const updated = [...faqData];
    updated[index] = { ...updated[index], [field]: value };
    setFaqData(updated);
    onChange('faqSections', updated);
  };

  const removeFAQSection = (index: number) => {
    const updated = faqData.filter((_, i) => i !== index);
    setFaqData(updated);
    onChange('faqSections', updated);
  };

  const moveFAQSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= faqData.length) return;

    const updated = [...faqData];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFaqData(updated);
    onChange('faqSections', updated);
  };

  const updateCTA = (field: keyof CallToAction, value: string) => {
    const updated = { ...ctaData, [field]: value };
    setCtaData(updated);
    onChange('callToAction', updated);
  };


  return (
    <div className="space-y-6">
      {/* FAQ Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>FAQ Sections</CardTitle>
            <Button onClick={addFAQSection} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqData.map((section, index) => {
            const colorOption = FAQ_COLORS.find(c => c.value === section.color);
            return (
              <div key={section.id} className={`p-4 border rounded-lg bg-gray-50 ${colorOption?.class} border-l-4`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <Badge variant="outline">Section {index + 1}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveFAQSection(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveFAQSection(index, 'down')}
                          disabled={index === faqData.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFAQSection(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Question Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateFAQSection(index, 'title', e.target.value)}
                        placeholder="Why Should I Care?"
                      />
                    </div>
                    <div>
                      <Label>Color Theme</Label>
                      <Select
                        value={section.color || 'blue'}
                        onValueChange={(value) => updateFAQSection(index, 'color', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FAQ_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 border-2 ${color.class}`}></div>
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Answer Content</Label>
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateFAQSection(index, 'content', e.target.value)}
                      placeholder="Provide a detailed answer to this question..."
                      rows={4}
                    />
                  </div>

                  {/* Preview */}
                  <div className="p-3 bg-white rounded border">
                    <div className="font-semibold text-gray-900 mb-2">{section.title}</div>
                    <div className="text-gray-600 text-sm">{section.content}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {faqData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No FAQ sections yet. Click "Add Section" to get started.</p>
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
            <Label>CTA Title</Label>
            <Input
              value={ctaData.title}
              onChange={(e) => updateCTA('title', e.target.value)}
              placeholder="Ready to Transform Your Business?"
            />
          </div>

          <div>
            <Label>CTA Description</Label>
            <Textarea
              value={ctaData.description}
              onChange={(e) => updateCTA('description', e.target.value)}
              placeholder="Join thousands of agents who've already made the switch"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Button Text</Label>
              <Input
                value={ctaData.buttonText}
                onChange={(e) => updateCTA('buttonText', e.target.value)}
                placeholder="Book Your Free Demo"
              />
            </div>
            <div>
              <Label>Button Style</Label>
              <Select
                value={ctaData.buttonVariant || 'default'}
                onValueChange={(value) => updateCTA('buttonVariant', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CTA Preview */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900 mb-2">{ctaData.title}</h4>
              <p className="text-gray-600 mb-4">{ctaData.description}</p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {ctaData.buttonText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};