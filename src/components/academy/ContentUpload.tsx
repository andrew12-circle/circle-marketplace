import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SecureForm } from "@/components/common/SecureForm";
import { Upload, X, Image as ImageIcon, ExternalLink } from "lucide-react";
import { CourseImportModal } from "./CourseImportModal";

interface ContentUploadProps {
  contentType: 'video' | 'podcast' | 'book' | 'course' | 'playbook';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ContentUpload = ({ contentType, onSuccess, onCancel }: ContentUploadProps) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    pageCount: '',
    lessonCount: '',
    tags: '',
    isPro: false,
    price: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Lead Generation', 'Marketing', 'Sales', 'Social Media', 'Mindset', 
    'Technology', 'Market Analysis', 'Communication', 'Negotiation', 
    'Listing Presentation', 'Buyer Consultation', 'Closing'
  ];

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleContentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setContentFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (data: Record<string, string>) => {
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let coverUrl = '';
      let contentUrl = '';

      // Upload cover image
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}-cover-${coverFile.name}`;
        await uploadFile(coverFile, 'content-covers', coverPath);
        const { data: coverUrlData } = supabase.storage.from('content-covers').getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      // Upload content file
      if (contentFile) {
        const bucketMap = {
          video: 'videos',
          podcast: 'podcasts',
          book: 'books',
          course: 'courses',
          playbook: 'playbooks'
        };
        
        const bucket = bucketMap[contentType];
        const contentPath = `${user.id}/${Date.now()}-${contentFile.name}`;
        await uploadFile(contentFile, bucket, contentPath);
        const { data: contentUrlData } = supabase.storage.from(bucket).getPublicUrl(contentPath);
        contentUrl = contentUrlData.publicUrl;
      }

      // Create content record using validated and sanitized data
      const contentData = {
        creator_id: user.id,
        content_type: contentType,
        title: data.title || formData.title,
        description: data.description || formData.description,
        category: data.category || formData.category,
        duration: formData.duration || null,
        page_count: formData.pageCount ? parseInt(formData.pageCount) : null,
        lesson_count: formData.lessonCount ? parseInt(formData.lessonCount) : null,
        cover_image_url: coverUrl || null,
        content_url: contentUrl || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        is_pro: formData.isPro,
        price: data.price ? parseFloat(data.price) : (formData.price ? parseFloat(formData.price) : 0),
        is_published: true,
        published_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('content')
        .insert(contentData);

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} uploaded successfully`,
      });

      onSuccess?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload content",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileAccept = () => {
    switch (contentType) {
      case 'video': return 'video/*';
      case 'podcast': return 'audio/*';
      case 'book':
      case 'course':
      case 'playbook': return '.pdf,.epub,.mobi';
      default: return '*/*';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Upload {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          <div className="flex items-center gap-2">
            {contentType === 'course' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(true)}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Import
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SecureForm 
          onSubmit={handleSubmit} 
          validationRules={{
            title: { required: true, minLength: 3, maxLength: 200 },
            description: { required: true, minLength: 10, maxLength: 2000 },
            category: { required: true },
            price: { pattern: /^\d+(\.\d{2})?$/ }
          }}
          className="space-y-6"
        >
          {/* Cover Image Upload */}
          <div>
            <Label>Cover Image</Label>
            <div className="mt-2">
              {coverPreview ? (
                <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                  <img 
                    src={coverPreview} 
                    alt="Cover preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/10">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload Cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Content File Upload */}
          <div>
            <Label>Content File</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/10">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {contentFile ? contentFile.name : `Upload ${contentType} file`}
                </span>
                <input
                  type="file"
                  accept={getFileAccept()}
                  onChange={handleContentUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                required
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
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
              placeholder="Describe your content"
              rows={3}
            />
          </div>

          {/* Content-specific fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(contentType === 'video' || contentType === 'podcast') && (
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 12:34"
                />
              </div>
            )}
            
            {(contentType === 'book' || contentType === 'playbook') && (
              <div>
                <Label htmlFor="pageCount">Page Count</Label>
                <Input
                  id="pageCount"
                  type="number"
                  value={formData.pageCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, pageCount: e.target.value }))}
                  placeholder="Number of pages"
                />
              </div>
            )}
            
            {contentType === 'course' && (
              <div>
                <Label htmlFor="lessonCount">Lesson Count</Label>
                <Input
                  id="lessonCount"
                  type="number"
                  value={formData.lessonCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, lessonCount: e.target.value }))}
                  placeholder="Number of lessons"
                />
              </div>
            )}

            <div>
              <Label htmlFor="price">Price (optional)</Label>
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
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Pro Content Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPro"
              checked={formData.isPro}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPro: checked }))}
            />
            <Label htmlFor="isPro">Pro Content (requires subscription)</Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Content'}
            </Button>
          </div>
        </SecureForm>
      </CardContent>
      
      {/* Course Import Modal */}
      {contentType === 'course' && (
        <CourseImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            onSuccess?.();
          }}
        />
      )}
    </Card>
  );
};