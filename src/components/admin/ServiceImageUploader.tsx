import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ImageCropper } from '@/components/ui/image-cropper';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting the same file again
    event.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Check if image is square - if not, show cropper
    const img = new Image();
    img.onload = () => {
      if (Math.abs(img.width - img.height) > img.width * 0.1) {
        // Image is not square (allow 10% tolerance), show cropper
        setSelectedFile(file);
        setShowCropper(true);
      } else {
        // Image is already square, upload directly
        uploadImage(file);
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const handleCroppedImage = (croppedFile: File) => {
    setShowCropper(false);
    setSelectedFile(null);
    uploadImage(croppedFile);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `services/${serviceId}/profile-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the service record
      const { error: updateError } = await supabase
        .from('services')
        .update({ profile_image_url: publicUrl })
        .eq('id', serviceId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Update local state with cache buster
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      setImageUrl(cacheBustedUrl);
      onImageUpdated?.(publicUrl);

      toast({
        title: "Service image updated",
        description: `Successfully updated the profile image for ${serviceName}`,
      });
    } catch (error: any) {
      console.error('Error uploading service image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not update service image. Please try again.",
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
        <div className="space-y-3">
          <div className="w-full h-20 bg-muted rounded-lg overflow-hidden border">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={serviceName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                  <p className="text-xs">No image uploaded</p>
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{serviceName}</h3>
            <p className="text-sm text-muted-foreground">
              {imageUrl ? 'Custom service image' : 'Upload an image to preview it here'}
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
              onChange={handleFileSelect}
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

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Image Guidelines:</p>
              <ul className="space-y-1">
                <li>• Square images (1:1 ratio) work best</li>
                <li>• Non-square images will show a cropping tool</li>
                <li>• Minimum 512x512px recommended</li>
                <li>• Supports JPG, PNG, GIF, WebP</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Image Cropper Dialog */}
      {selectedFile && (
        <ImageCropper
          imageFile={selectedFile}
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
          onCrop={handleCroppedImage}
          aspectRatio={1}
        />
      )}
    </Card>
  );
};