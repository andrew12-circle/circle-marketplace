import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export const ServiceImageUpload = ({ value, onChange }: ServiceImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (!file.type.includes('svg')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an SVG file only.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = 'svg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className="space-y-4">
      <Label>Service Image</Label>
      
      {/* Guidelines */}
      <Alert>
        <Image className="h-4 w-4" />
        <AlertDescription>
          <strong>Perfect Service Card Image Guidelines:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Use SVG format for crisp, scalable graphics</li>
            <li>Recommended size: 400x300 pixels (4:3 aspect ratio)</li>
            <li>Keep file size under 500KB for fast loading</li>
            <li>Use clear, professional icons or illustrations</li>
            <li>Avoid text in images - use the title and description instead</li>
            <li>Use brand colors that match your service</li>
            <li>Ensure good contrast for both light and dark themes</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      {!value ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Upload Service Image</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop your SVG file here, or click to browse
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        /* Image Preview */
        <div className="relative">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Image uploaded successfully</p>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {value.split('/').pop()}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Image Preview */}
            <div className="mt-4 p-4 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20">
              <img 
                src={value} 
                alt="Service preview" 
                className="max-w-full h-32 object-contain mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Best Practices Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>💡 Pro Tips:</strong></p>
        <p>• Use tools like Figma, Adobe Illustrator, or free options like Canva to create SVG graphics</p>
        <p>• Test your image on both light and dark backgrounds</p>
        <p>• Simple, clean designs perform better than cluttered ones</p>
      </div>
    </div>
  );
};