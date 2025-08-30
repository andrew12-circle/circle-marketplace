import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Link2, FileText, Globe, Zap } from "lucide-react";

interface CourseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const platforms = [
  { id: 'skool', name: 'Skool', icon: Globe },
  { id: 'kajabi', name: 'Kajabi', icon: Globe },
  { id: 'ghl', name: 'Go High Level', icon: Zap },
  { id: 'thinkific', name: 'Thinkific', icon: Globe },
  { id: 'teachable', name: 'Teachable', icon: Globe },
  { id: 'clickfunnels', name: 'ClickFunnels', icon: Globe },
  { id: 'circle', name: 'Circle Community', icon: Globe },
  { id: 'mighty', name: 'Mighty Networks', icon: Globe },
  { id: 'custom', name: 'Custom URL', icon: Link2 }
];

const categories = [
  'Lead Generation', 'Marketing', 'Sales', 'Social Media', 'Mindset', 
  'Technology', 'Market Analysis', 'Communication', 'Negotiation', 
  'Listing Presentation', 'Buyer Consultation', 'Closing'
];

export const CourseImportModal = ({ isOpen, onClose, onSuccess }: CourseImportModalProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [importType, setImportType] = useState<'url' | 'embed' | 'api'>('url');
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    category: '',
    lessonCount: '',
    duration: '',
    tags: '',
    isPro: false,
    price: '',
    embedCode: '',
    apiKey: '',
    courseId: ''
  });
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const { toast } = useToast();

  const handlePreview = async () => {
    if (!formData.url && !formData.embedCode) {
      toast({
        title: "Missing Information",
        description: "Please provide a URL or embed code to preview",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      // Basic URL parsing for preview
      if (formData.url) {
        const urlObj = new URL(formData.url);
        setPreviewData({
          title: formData.title || `Course from ${urlObj.hostname}`,
          platform: selectedPlatform || 'custom',
          url: formData.url,
          domain: urlObj.hostname
        });
      }
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please check the URL format",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const contentData = {
        creator_id: user.id,
        content_type: 'course' as const,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        lesson_count: formData.lessonCount ? parseInt(formData.lessonCount) : null,
        duration: formData.duration || null,
        content_url: formData.url,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        is_pro: formData.isPro,
        price: formData.price ? parseFloat(formData.price) : 0,
        is_published: true,
        published_at: new Date().toISOString(),
        metadata: {
          import_source: selectedPlatform || 'custom',
          import_type: importType,
          original_url: formData.url,
          embed_code: formData.embedCode || null,
          imported_at: new Date().toISOString()
        }
      };

      const { error: insertError } = await supabase
        .from('content')
        .insert(contentData as any);

      if (insertError) throw insertError;

      toast({
        title: "Course Imported Successfully!",
        description: `Your course from ${selectedPlatform || 'external platform'} has been added to your academy`,
      });

      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import course",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedPlatform('');
    setImportType('url');
    setFormData({
      url: '',
      title: '',
      description: '',
      category: '',
      lessonCount: '',
      duration: '',
      tags: '',
      isPro: false,
      price: '',
      embedCode: '',
      apiKey: '',
      courseId: ''
    });
    setPreviewData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Import Course from Platform
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Selection */}
          <div>
            <Label>Select Platform</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedPlatform === platform.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-medium">{platform.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Tabs value={importType} onValueChange={(value) => setImportType(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url">URL Import</TabsTrigger>
              <TabsTrigger value="embed">Embed Code</TabsTrigger>
              <TabsTrigger value="api">API Connection</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="url">Course URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/course"
                />
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4">
              <div>
                <Label htmlFor="embedCode">Embed Code</Label>
                <Textarea
                  id="embedCode"
                  value={formData.embedCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, embedCode: e.target.value }))}
                  placeholder="<iframe src='...' width='100%' height='400'></iframe>"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your platform API key"
                  />
                </div>
                <div>
                  <Label htmlFor="courseId">Course ID</Label>
                  <Input
                    id="courseId"
                    value={formData.courseId}
                    onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                    placeholder="Course ID from platform"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview Section */}
          {previewData && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{previewData.platform}</Badge>
                <span className="text-sm text-muted-foreground">{previewData.domain}</span>
              </div>
              <p className="text-sm">{previewData.title}</p>
            </div>
          )}

          {/* Course Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your course"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="lessonCount">Number of Lessons</Label>
              <Input
                id="lessonCount"
                type="number"
                value={formData.lessonCount}
                onChange={(e) => setFormData(prev => ({ ...prev, lessonCount: e.target.value }))}
                placeholder="e.g., 12"
              />
            </div>
            <div>
              <Label htmlFor="duration">Total Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 2h 30m"
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="real estate, marketing, sales"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPro"
              checked={formData.isPro}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPro: checked }))}
            />
            <Label htmlFor="isPro">Pro Content (requires subscription)</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePreview}
              disabled={importing || (!formData.url && !formData.embedCode)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={importing || !formData.title || !formData.category}
              >
                {importing ? 'Importing...' : 'Import Course'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};