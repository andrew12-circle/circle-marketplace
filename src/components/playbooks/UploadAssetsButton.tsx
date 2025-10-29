import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { uploadPlaybookAssets } from '@/utils/uploadPlaybookAssets';
import { useToast } from '@/hooks/use-toast';

export function UploadAssetsButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const { toast } = useToast();

  const handleUpload = async () => {
    setIsUploading(true);
    
    try {
      const results = await uploadPlaybookAssets((current, total, message) => {
        setProgress({ current, total, message });
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      toast({
        title: 'Upload Complete',
        description: `${successCount} playbooks updated successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
        variant: successCount > 0 ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        onClick={handleUpload}
        disabled={isUploading}
        size="lg"
        className="shadow-lg"
      >
        <Upload className="mr-2 h-5 w-5" />
        {isUploading ? (
          <span>
            Uploading... {progress.current}/{progress.total}
          </span>
        ) : (
          'Upload Playbook Assets'
        )}
      </Button>
      {isUploading && progress.message && (
        <p className="mt-2 text-xs text-muted-foreground text-right">
          {progress.message}
        </p>
      )}
    </div>
  );
}
