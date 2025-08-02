import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Plus, AlertTriangle, CreditCard } from 'lucide-react';

interface ContentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType?: string;
  onUploadComplete: () => void;
}

export const ContentUploadModal = ({ 
  isOpen, 
  onClose, 
  contentType = 'video',
  onUploadComplete 
}: ContentUploadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    price: '0.00',
    duration: '',
    page_count: 0,
    lesson_count: 0,
  });
  
  const [files, setFiles] = useState({
    content: null as File | null,
    cover: null as File | null,
    preview: null as File | null,
  });
  
  const [newTag, setNewTag] = useState('');

  // Check payment setup on modal open
  useEffect(() => {
    if (isOpen && user) {
      checkPaymentSetup();
    }
  }, [isOpen, user]);

  const checkPaymentSetup = async () => {
    if (!user) return;

    setCheckingPayment(true);
    try {
      const { data, error } = await supabase
        .from('creator_payment_info')
        .select('stripe_onboarding_completed, verified, tax_form_completed')
        .eq('creator_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        setPaymentSetupComplete(false);
        return;
      }

      const isComplete = data && 
        data.stripe_onboarding_completed && 
        data.verified && 
        data.tax_form_completed;

      setPaymentSetupComplete(!!isComplete);
    } catch (error) {
      console.error('Error checking payment setup:', error);
      setPaymentSetupComplete(false);
    } finally {
      setCheckingPayment(false);
    }
  };

  const categories = [
    'Marketing', 'Sales', 'Technology', 'Finance', 'Real Estate',
    'Business Development', 'Leadership', 'Training', 'Education'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (type: 'content' | 'cover' | 'preview', file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !files.content) return;

    // Check payment setup before allowing upload
    if (!paymentSetupComplete) {
      toast({
        title: 'Payment Setup Required',
        description: 'Complete your payment setup before uploading content.',
        variant: 'destructive'
      });
      onClose();
      window.location.href = '/creator-payment-setup';
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Generate unique file names
      const timestamp = Date.now();
      const contentFileName = `${user.id}/${timestamp}-${files.content.name}`;
      const coverFileName = files.cover ? `${user.id}/${timestamp}-cover-${files.cover.name}` : null;
      const previewFileName = files.preview ? `${user.id}/${timestamp}-preview-${files.preview.name}` : null;

      // Determine storage buckets based on content type
      const bucketMap = {
        video: 'videos',
        podcast: 'podcasts',
        book: 'books',
        course: 'courses',
        playbook: 'playbooks'
      };

      const contentBucket = bucketMap[contentType as keyof typeof bucketMap] || 'videos';
      
      setUploadProgress(25);

      // Upload main content file
      const contentUrl = await uploadFile(files.content, contentBucket, contentFileName);
      
      setUploadProgress(50);

      // Upload cover image if provided
      let coverUrl = null;
      if (files.cover) {
        coverUrl = await uploadFile(files.cover, 'content-covers', coverFileName!);
      }
      
      setUploadProgress(75);

      // Upload preview file if provided
      let previewUrl = null;
      if (files.preview) {
        previewUrl = await uploadFile(files.preview, contentBucket, previewFileName!);
      }

      setUploadProgress(90);

      // Create content record
      const contentData = {
        creator_id: user.id,
        title: formData.title,
        description: formData.description,
        content_type: contentType as 'video' | 'podcast' | 'book' | 'course' | 'playbook',
        category: formData.category,
        tags: formData.tags,
        content_url: contentUrl,
        cover_image_url: coverUrl,
        preview_url: previewUrl,
        duration: formData.duration || null,
        page_count: contentType === 'book' || contentType === 'playbook' ? formData.page_count : null,
        lesson_count: contentType === 'course' ? formData.lesson_count : null,
        is_pro: false, // Only admins can set this
        is_featured: false, // Only admins can set this
        price: parseFloat(formData.price),
        is_published: true,
        published_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('content')
        .insert([contentData]);

      if (insertError) throw insertError;

      setUploadProgress(100);

      toast({
        title: 'Success!',
        description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} uploaded successfully`,
      });

      onUploadComplete();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: [],
        price: '0.00',
        duration: '',
        page_count: 0,
        lesson_count: 0,
      });
      setFiles({
        content: null,
        cover: null,
        preview: null,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getFileAcceptTypes = () => {
    switch (contentType) {
      case 'video':
        return 'video/*';
      case 'podcast':
        return 'audio/*';
      case 'book':
      case 'playbook':
        return '.pdf,.epub,.mobi';
      case 'course':
        return '.zip,.pdf';
      default:
        return '*/*';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Upload {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        {checkingPayment ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking payment setup...</p>
            </div>
          </div>
        ) : !paymentSetupComplete ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Payment Setup Required</h3>
            <p className="text-muted-foreground mb-6">
              You must complete your payment setup before uploading content. This ensures you can receive earnings from your content sales.
            </p>
            <Button 
              onClick={() => {
                onClose();
                window.location.href = '/creator-payment-setup';
              }}
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Complete Payment Setup
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter content title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your content"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Content-specific fields */}
          <div className="grid grid-cols-2 gap-4">
            {(contentType === 'video' || contentType === 'podcast') && (
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g., 15:30"
                />
              </div>
            )}

            {(contentType === 'book' || contentType === 'playbook') && (
              <div>
                <Label htmlFor="page_count">Page Count</Label>
                <Input
                  id="page_count"
                  type="number"
                  value={formData.page_count}
                  onChange={(e) => handleInputChange('page_count', parseInt(e.target.value) || 0)}
                  placeholder="Number of pages"
                />
              </div>
            )}

            {contentType === 'course' && (
              <div>
                <Label htmlFor="lesson_count">Lesson Count</Label>
                <Input
                  id="lesson_count"
                  type="number"
                  value={formData.lesson_count}
                  onChange={(e) => handleInputChange('lesson_count', parseInt(e.target.value) || 0)}
                  placeholder="Number of lessons"
                />
              </div>
            )}

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-file">Content File *</Label>
              <Input
                id="content-file"
                type="file"
                accept={getFileAcceptTypes()}
                onChange={(e) => handleFileChange('content', e.target.files?.[0] || null)}
                required
              />
            </div>

            <div>
              <Label htmlFor="cover-file">Cover Image</Label>
              <Input
                id="cover-file"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('cover', e.target.files?.[0] || null)}
              />
            </div>

            {contentType === 'video' && (
              <div>
                <Label htmlFor="preview-file">Preview/Trailer</Label>
                <Input
                  id="preview-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange('preview', e.target.files?.[0] || null)}
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.category || !files.content}>
              {loading ? 'Uploading...' : 'Upload Content'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};