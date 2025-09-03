import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Image, Video, ExternalLink, FileText } from "lucide-react";

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'document';
  title?: string;
  description?: string;
}

interface FunnelMediaEditorProps {
  media: MediaItem[];
  serviceImageUrl?: string;
  onChange: (media: MediaItem[]) => void;
}

export const FunnelMediaEditor = ({ media, serviceImageUrl, onChange }: FunnelMediaEditorProps) => {
  // Initialize media items with service image as first item if it exists
  const initializeMediaItems = () => {
    const existingMedia = media || [];
    
    // If there's a service image and no existing media, add it as the first item
    if (serviceImageUrl && existingMedia.length === 0) {
      return [{
        url: serviceImageUrl,
        type: 'image' as const,
        title: 'Service Main Image',
        description: 'Primary service image from marketplace'
      }];
    }
    
    // If there's a service image and existing media doesn't start with it, prepend it
    if (serviceImageUrl && existingMedia.length > 0) {
      const firstItem = existingMedia[0];
      if (firstItem?.url !== serviceImageUrl) {
        return [
          {
            url: serviceImageUrl,
            type: 'image' as const,
            title: 'Service Main Image',
            description: 'Primary service image from marketplace'
          },
          ...existingMedia
        ];
      }
    }
    
    return existingMedia;
  };

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initializeMediaItems);

  const addMediaItem = () => {
    const newItem: MediaItem = {
      url: "",
      type: "image",
      title: "",
      description: ""
    };
    const updatedMedia = [...mediaItems, newItem];
    setMediaItems(updatedMedia);
    onChange(updatedMedia);
  };

  const updateMediaItem = (index: number, field: keyof MediaItem, value: string) => {
    const updatedMedia = [...mediaItems];
    updatedMedia[index] = {
      ...updatedMedia[index],
      [field]: value
    };
    setMediaItems(updatedMedia);
    onChange(updatedMedia);
  };

  const removeMediaItem = (index: number) => {
    const itemToRemove = mediaItems[index];
    
    // If this is the service main image (first item with service URL), show confirmation
    if (index === 0 && serviceImageUrl && itemToRemove?.url === serviceImageUrl) {
      if (!confirm("This will remove the main service image from the funnel. Are you sure?")) {
        return;
      }
    }
    
    const updatedMedia = mediaItems.filter((_, i) => i !== index);
    setMediaItems(updatedMedia);
    onChange(updatedMedia);
  };

  const getMediaPreview = (item: MediaItem) => {
    if (!item.url) return null;
    
    if (item.type === 'image') {
      return (
        <img 
          src={item.url} 
          alt={item.title || 'Media preview'} 
          className="w-full h-32 object-cover rounded"
        />
      );
    } else if (item.type === 'video') {
      // Check if it's a YouTube URL
      const youtubeMatch = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return (
          <img 
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={item.title || 'Video preview'}
            className="w-full h-32 object-cover rounded"
          />
        );
      }
      return (
        <video 
          src={item.url} 
          className="w-full h-32 object-cover rounded"
          controls={false}
        />
      );
    } else if (item.type === 'document') {
      return (
        <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300">
          <FileText className="w-8 h-8 text-blue-500 mb-2" />
          <span className="text-sm text-gray-600 font-medium">
            {item.title || 'Document'}
          </span>
          <span className="text-xs text-gray-500">
            {item.url.split('.').pop()?.toUpperCase() || 'PDF/DOC'}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Media Gallery</CardTitle>
            <Button onClick={addMediaItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Media
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceImageUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Image className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Service Main Image</span>
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                  From Marketplace
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                Your service's main image will automatically appear first in the funnel. Add more media below or replace the main image by editing the first item.
              </p>
            </div>
          )}
          
          {mediaItems.map((item, index) => {
            const isServiceMainImage = index === 0 && serviceImageUrl && item.url === serviceImageUrl;
            
            return (
              <div key={index} className={`p-4 border rounded-lg ${isServiceMainImage ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Preview</Label>
                      {isServiceMainImage && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          Main Image
                        </Badge>
                      )}
                    </div>
                    <div className="border rounded-lg overflow-hidden bg-white">
                      {getMediaPreview(item) || (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                          {item.type === 'image' ? (
                            <Image className="w-8 h-8 text-gray-400" />
                          ) : item.type === 'video' ? (
                            <Video className="w-8 h-8 text-gray-400" />
                          ) : (
                            <FileText className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>Media Type</Label>
                        <Select
                          value={item.type}
                          onValueChange={(value: 'image' | 'video' | 'document') => 
                            updateMediaItem(index, 'type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMediaItem(index)}
                        className={`mt-6 ${isServiceMainImage ? "text-blue-600 hover:text-blue-700" : "text-red-600 hover:text-red-700"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={item.url}
                          onChange={(e) => updateMediaItem(index, 'url', e.target.value)}
                          placeholder={
                            item.type === 'document' 
                              ? "https://example.com/document.pdf or Google Drive link"
                              : "https://example.com/media.jpg or YouTube URL"
                          }
                        />
                        {item.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Title (Optional)</Label>
                      <Input
                        value={item.title || ""}
                        onChange={(e) => updateMediaItem(index, 'title', e.target.value)}
                        placeholder="Media title..."
                      />
                    </div>

                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={item.description || ""}
                        onChange={(e) => updateMediaItem(index, 'description', e.target.value)}
                        placeholder="Media description..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {mediaItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <Image className="w-12 h-12 text-gray-300" />
                <p>No media added yet. Click "Add Media" to get started.</p>
                <p className="text-sm">Supports images, videos, documents, and YouTube links.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Media Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Images</Badge>
            <span className="text-sm text-gray-600">JPG, PNG, WebP - Recommended: 1920x1080 or higher</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Videos</Badge>
            <span className="text-sm text-gray-600">YouTube links, MP4, WebM - Keep under 2 minutes for best engagement</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Documents</Badge>
            <span className="text-sm text-gray-600">PDFs, Word docs, Google Drive links - Useful for guides, contracts, and resources</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">YouTube</Badge>
            <span className="text-sm text-gray-600">Paste full YouTube URL - thumbnails will be auto-generated</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};