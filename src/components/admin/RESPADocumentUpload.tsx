import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Download } from 'lucide-react';

interface DocumentInfo {
  name: string;
  path: string;
  size: number;
  uploadedAt: string;
}

interface RESPADocumentUploadProps {
  serviceId: string;
  serviceTitle: string;
  documents: DocumentInfo[];
  onDocumentsUpdate: (documents: DocumentInfo[]) => void;
}

const RESPADocumentUpload: React.FC<RESPADocumentUploadProps> = ({
  serviceId,
  serviceTitle,
  documents,
  onDocumentsUpdate
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('respa-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const newDocument: DocumentInfo = {
        name: file.name,
        path: fileName,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocuments = [...documents, newDocument];
      
      // Update the service record with new document list
      const { error: updateError } = await supabase
        .from('services')
        .update({ supporting_documents: updatedDocuments as any })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      onDocumentsUpdate(updatedDocuments);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully`,
      });

      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: DocumentInfo) => {
    try {
      const { data, error } = await supabase.storage
        .from('respa-documents')
        .download(document.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download failed",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentToDelete: DocumentInfo) => {
    try {
      const { error: deleteError } = await supabase.storage
        .from('respa-documents')
        .remove([documentToDelete.path]);

      if (deleteError) throw deleteError;

      const updatedDocuments = documents.filter(doc => doc.path !== documentToDelete.path);
      
      const { error: updateError } = await supabase
        .from('services')
        .update({ supporting_documents: updatedDocuments as any })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      onDocumentsUpdate(updatedDocuments);
      
      toast({
        title: "Document deleted",
        description: `${documentToDelete.name} has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">Supporting Documents</span>
        <Badge variant="secondary">{documents.length}</Badge>
      </div>
      
      <div className="space-y-2">
        {documents.map((document, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded bg-muted/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{document.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(document.size)} • {new Date(document.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload(document)}
                className="h-8 w-8 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(document)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          disabled={uploading}
          className="text-sm"
        />
        <Button size="sm" disabled={uploading} variant="outline">
          <Upload className="w-4 h-4 mr-1" />
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Accepted: PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
      </div>
    </div>
  );
};

export default RESPADocumentUpload;