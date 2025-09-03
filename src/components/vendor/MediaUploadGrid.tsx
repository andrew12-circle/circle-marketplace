import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Play, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  name: string;
}

interface MediaUploadGridProps {
  mediaItems: MediaItem[];
  onMediaChange: (items: MediaItem[]) => void;
  maxItems?: number;
  bucketName: string;
  folderPath: string;
}

export const MediaUploadGrid: React.FC<MediaUploadGridProps> = ({
  mediaItems,
  onMediaChange,
  maxItems = 4,
  bucketName,
  folderPath
}) => {
  const [uploading, setUploading] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File, index: number) => {
    if (!file) return;

    setUploading(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folderPath}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const newItem: MediaItem = {
        url: data.publicUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name
      };

      const newItems = [...mediaItems];
      newItems[index] = newItem;
      onMediaChange(newItems);

      toast({
        title: "Media uploaded successfully",
        description: `${file.name} has been uploaded.`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your media.",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  }, [mediaItems, onMediaChange, bucketName, folderPath, toast]);

  const removeMedia = useCallback((index: number) => {
    const newItems = [...mediaItems];
    newItems.splice(index, 1);
    onMediaChange(newItems);
  }, [mediaItems, onMediaChange]);

  const renderMediaSlot = (index: number) => {
    const item = mediaItems[index];
    const isUploading = uploading === index;

    return (
      <Card key={index} className="relative aspect-video">
        {item ? (
          <div className="relative w-full h-full">
            {item.type === 'video' ? (
              <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <video
                  src={item.url}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                />
                <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  Video
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Image
                </div>
              </div>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => removeMedia(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Upload media</p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, index);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: maxItems }, (_, index) => renderMediaSlot(index))}
      </div>
      <p className="text-sm text-muted-foreground">
        Upload up to {maxItems} images or videos to showcase your service. Supported formats: JPG, PNG, WebP, GIF, MP4, WebM. Max size: 50MB each.
      </p>
    </div>
  );
};