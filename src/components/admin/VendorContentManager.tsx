import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ServiceConsultationEmails } from "./ServiceConsultationEmails";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Youtube, 
  Video, 
  Image, 
  FileText,
  Eye,
  EyeOff,
  Star,
  ArrowUp,
  ArrowDown,
  Mail
} from "lucide-react";

type ContentType = 'video_youtube' | 'video_vimeo' | 'image' | 'document';

interface VendorContent {
  id: string;
  vendor_id: string;
  content_type: 'video_youtube' | 'video_vimeo' | 'image' | 'document';
  title: string;
  description?: string;
  content_url: string;
  thumbnail_url?: string;
  file_size?: number;
  mime_type?: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  title: string;
  vendor_id: string;
}

interface VendorContentManagerProps {
  vendorId: string;
  vendorName: string;
}

export const VendorContentManager = ({ vendorId, vendorName }: VendorContentManagerProps) => {
  const [content, setContent] = useState<VendorContent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContent, setEditingContent] = useState<VendorContent | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    content_type: ContentType;
    title: string;
    description: string;
    content_url: string;
    is_featured: boolean;
    is_active: boolean;
  }>({
    content_type: 'video_youtube',
    title: '',
    description: '',
    content_url: '',
    is_featured: false,
    is_active: true
  });

  useEffect(() => {
    loadContent();
    loadServices();
  }, [vendorId]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_content')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setContent((data || []) as any);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load vendor content');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, vendor_id')
        .eq('vendor_id', vendorId)
        .order('title');

      if (error) throw error;
      setServices((data || []) as Service[]);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load vendor services');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vendor-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('vendor-content')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        content_url: data.publicUrl
      }));

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getVimeoVideoId = (url: string) => {
    const regex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const generateThumbnail = (contentType: string, url: string) => {
    if (contentType === 'video_youtube') {
      const videoId = getYouTubeVideoId(url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined;
    }
    if (contentType === 'video_vimeo') {
      const videoId = getVimeoVideoId(url);
      return videoId ? `https://vumbnail.com/${videoId}.jpg` : undefined;
    }
    return undefined;
  };

  const handleSave = async () => {
    try {
      const thumbnail_url = generateThumbnail(formData.content_type, formData.content_url);
      
      const contentData = {
        vendor_id: vendorId,
        ...formData,
        thumbnail_url,
        display_order: content.length
      };

      if (editingContent) {
        const { error } = await (supabase
          .from('vendor_content')
          .update as any)(contentData)
          .eq('id' as any, editingContent.id as any);
        
        if (error) throw error;
        toast.success('Content updated successfully');
      } else {
        const { error } = await (supabase
          .from('vendor_content')
          .insert as any)(contentData);
        
        if (error) throw error;
        toast.success('Content added successfully');
      }

      setShowAddModal(false);
      setEditingContent(null);
      setFormData({
        content_type: 'video_youtube',
        title: '',
        description: '',
        content_url: '',
        is_featured: false,
        is_active: true
      });
      loadContent();
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('vendor_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Content deleted successfully');
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await (supabase
        .from('vendor_content')
        .update as any)({ is_active: !isActive })
        .eq('id' as any, id as any);

      if (error) throw error;
      toast.success(`Content ${!isActive ? 'activated' : 'deactivated'}`);
      loadContent();
    } catch (error) {
      console.error('Error toggling content status:', error);
      toast.error('Failed to update content status');
    }
  };

  const updateDisplayOrder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = content.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= content.length) return;

    try {
      const item1 = content[currentIndex];
      const item2 = content[newIndex];

      await (supabase
        .from('vendor_content')
        .update as any)({ display_order: item2.display_order })
        .eq('id' as any, item1.id as any);

      await (supabase
        .from('vendor_content')
        .update as any)({ display_order: item1.display_order })
        .eq('id' as any, item2.id as any);

      toast.success('Display order updated');
      loadContent();
    } catch (error) {
      console.error('Error updating display order:', error);
      toast.error('Failed to update display order');
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video_youtube': return <Youtube className="w-4 h-4" />;
      case 'video_vimeo': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const openModal = (contentItem?: VendorContent) => {
    if (contentItem) {
      setEditingContent(contentItem);
      setFormData({
        content_type: contentItem.content_type,
        title: contentItem.title,
        description: contentItem.description || '',
        content_url: contentItem.content_url,
        is_featured: contentItem.is_featured,
        is_active: contentItem.is_active
      });
    }
    setShowAddModal(true);
  };

  if (loading || servicesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management - {vendorName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content Manager</TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Service Notifications
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Library</h3>
                <Button onClick={() => openModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </div>

              {content.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No content added yet. Click "Add Content" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {content.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.thumbnail_url ? (
                              <img 
                                src={item.thumbnail_url} 
                                alt={item.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              getContentIcon(item.content_type)
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{item.title}</h4>
                              {item.is_featured && <Star className="w-4 h-4 text-yellow-500" />}
                              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">
                                {item.content_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            )}
                            <p className="text-xs text-gray-500 truncate">{item.content_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDisplayOrder(item.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDisplayOrder(item.id, 'down')}
                            disabled={index === content.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(item.id, item.is_active)}
                          >
                            {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Service Consultation Notifications</h3>
                  <p className="text-sm text-blue-800">
                    Configure email alerts for each service when agents book consultations. 
                    This ensures you never miss a booking opportunity.
                  </p>
                </div>

                {services.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="font-semibold text-gray-600 mb-2">No Services Found</h3>
                      <p className="text-sm text-gray-500">
                        This vendor doesn't have any services yet. Services need to be created before you can configure consultation notifications.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {services.map((service) => (
                      <ServiceConsultationEmails
                        key={service.id}
                        serviceId={service.id}
                        serviceName={service.title}
                        initialEmails={(service as any).consultation_emails || []}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Content Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setEditingContent(null);
          setFormData({
            content_type: 'video_youtube',
            title: '',
            description: '',
            content_url: '',
            is_featured: false,
            is_active: true
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? 'Edit Content' : 'Add New Content'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content_type">Content Type</Label>
              <Select 
                value={formData.content_type} 
                onValueChange={(value: ContentType) => setFormData(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video_youtube">YouTube Video</SelectItem>
                  <SelectItem value="video_vimeo">Vimeo Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document/Brochure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter content description"
              />
            </div>

            {(formData.content_type === 'video_youtube' || formData.content_type === 'video_vimeo') && (
              <div>
                <Label htmlFor="content_url">Video URL</Label>
                <Input
                  id="content_url"
                  value={formData.content_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                  placeholder={
                    formData.content_type === 'video_youtube' 
                      ? "https://www.youtube.com/watch?v=..." 
                      : "https://vimeo.com/..."
                  }
                />
              </div>
            )}

            {(formData.content_type === 'image' || formData.content_type === 'document') && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content_url">URL (Optional)</Label>
                  <Input
                    id="content_url"
                    value={formData.content_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                    placeholder={
                      formData.content_type === 'image' 
                        ? "https://example.com/image.jpg" 
                        : "https://example.com/document.pdf"
                    }
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or upload file</span>
                  </div>
                </div>

                <div>
                  <Label>Upload File</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept={formData.content_type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload {formData.content_type === 'image' ? 'an image' : 'a document'}
                      </p>
                    </label>
                    {formData.content_url && formData.content_url.startsWith('https://ihzyuyfawapweamqzzlj.supabase.co') && (
                      <p className="text-sm text-green-600 mt-2">File uploaded successfully</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                />
                <span className="text-sm">Featured Content</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.title || !formData.content_url || uploading}
              >
                {uploading ? 'Uploading...' : (editingContent ? 'Update' : 'Add')} Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
