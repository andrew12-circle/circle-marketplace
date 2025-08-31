import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ServiceImageUploaderProps {
  serviceId: string;
  serviceName: string;
  currentImageUrl?: string;
  onImageUpdated?: (newImageUrl: string) => void;
}

export const ServiceImageUploader = ({ 
  serviceId, 
  serviceName, 
  currentImageUrl,
  onImageUpdated 
}: ServiceImageUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `services/${serviceId}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the service record
      const { error: updateError } = await supabase
        .from('services')
        .update({ profile_image_url: publicUrl })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      // Update local state
      setImageUrl(publicUrl);
      onImageUpdated?.(publicUrl);

      toast({
        title: "Service image updated",
        description: `Successfully updated the profile image for ${serviceName}`,
      });
    } catch (error) {
      console.error('Error uploading service image:', error);
      toast({
        title: "Upload failed",
        description: "Could not update service image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      // Update the service record to remove image
      const { error } = await supabase
        .from('services')
        .update({ profile_image_url: null })
        .eq('id', serviceId);

      if (error) throw error;

      setImageUrl('');
      onImageUpdated?.('');

      toast({
        title: "Service image removed",
        description: `Removed the profile image for ${serviceName}`,
      });
    } catch (error) {
      console.error('Error removing service image:', error);
      toast({
        title: "Remove failed",
        description: "Could not remove service image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Service Profile Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="text-lg">
              {serviceName?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{serviceName}</h3>
            <p className="text-sm text-muted-foreground">
              {imageUrl ? 'Custom service image' : 'Using default letter avatar'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="service-image-upload" className="cursor-pointer">
              <Button
                variant="outline"
                disabled={uploading}
                className="w-full"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload service image"}
                </span>
              </Button>
            </Label>
            <input
              id="service-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>

          {imageUrl && (
            <Button
              variant="outline"
              onClick={removeImage}
              className="w-full"
              disabled={uploading}
            >
              Remove current image
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Recommended: Square image (1:1 ratio), 512x512px or larger. 
            Supports JPG, PNG, GIF, WebP. Max size: 5MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};