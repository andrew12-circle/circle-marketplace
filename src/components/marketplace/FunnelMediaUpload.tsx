import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, Image, Video, File, Eye, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MediaFile {
  id: string;
  file: File;
  url?: string;
  type: 'image' | 'video' | 'document';
  uploadProgress: number;
  uploaded: boolean;
}

interface FunnelMediaUploadProps {
  onMediaUploaded: (mediaUrls: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const FunnelMediaUpload: React.FC<FunnelMediaUploadProps> = ({
  onMediaUploaded,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
  className = ''
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const generateUniqueFileName = (file: File, userId: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    return `${userId}/${timestamp}-${randomId}.${fileExtension}`;
  };

  const uploadFile = async (mediaFile: MediaFile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileName = generateUniqueFileName(mediaFile.file, user.id);
      
      const { data, error } = await supabase.storage
        .from('funnel-media')
        .upload(fileName, mediaFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('funnel-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFiles = (newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const mediaFiles: MediaFile[] = fileArray.map(file => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      type: getFileType(file),
      uploadProgress: 0,
      uploaded: false
    }));

    setFiles(prev => [...prev, ...mediaFiles]);

    // Start uploading each file
    mediaFiles.forEach(async (mediaFile) => {
      try {
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploadProgress: 10 }
            : f
        ));

        const url = await uploadFile(mediaFile);

        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, url, uploadProgress: 100, uploaded: true }
            : f
        ));

        toast.success(`${mediaFile.file.name} uploaded successfully`);
      } catch (error) {
        console.error('Failed to upload file:', error);
        toast.error(`Failed to upload ${mediaFile.file.name}`);
        setFiles(prev => prev.filter(f => f.id !== mediaFile.id));
      }
    });
  };

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.url) {
      // Optionally delete from storage
      const fileName = fileToRemove.url.split('/').pop();
      if (fileName) {
        supabase.storage.from('funnel-media').remove([fileName]);
      }
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const getFileIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
        return <File className="w-4 h-4" />;
    }
  };

  const handleUseFiles = () => {
    const uploadedUrls = files
      .filter(f => f.uploaded && f.url)
      .map(f => f.url!);
    
    onMediaUploaded(uploadedUrls);
    toast.success(`${uploadedUrls.length} media files ready for use`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Upload Media Files</h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          Max {maxFiles} files. Supports images, videos, and documents.
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          {files.map((file) => (
            <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {!file.uploaded && (
                  <Progress value={file.uploadProgress} className="mt-1" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                {file.uploaded && file.url && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = file.url!;
                        a.download = file.file.name;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {files.some(f => f.uploaded) && (
            <Button onClick={handleUseFiles} className="w-full mt-4">
              Use Selected Media ({files.filter(f => f.uploaded).length} files)
            </Button>
          )}
        </div>
      )}
    </div>
  );
};