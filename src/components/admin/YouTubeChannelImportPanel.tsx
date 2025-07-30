import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Youtube, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  channelName?: string;
  videosImported?: number;
  totalVideos?: number;
  error?: string;
}

export const YouTubeChannelImportPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [maxVideos, setMaxVideos] = useState('50');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const validateChannelUrl = (url: string): boolean => {
    const patterns = [
      /youtube\.com\/channel\/[a-zA-Z0-9_-]+/,
      /youtube\.com\/c\/[a-zA-Z0-9_-]+/,
      /youtube\.com\/user\/[a-zA-Z0-9_-]+/,
      /youtube\.com\/@[a-zA-Z0-9_-]+/
    ];

    return patterns.some(pattern => pattern.test(url));
  };

  const handleImport = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a YouTube channel URL',
        variant: 'destructive',
      });
      return;
    }

    if (!validateChannelUrl(channelUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube channel URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Must be logged in to import channels');
      }

      const { data, error } = await supabase.functions.invoke('import-youtube-channel', {
        body: {
          channelUrl: channelUrl.trim(),
          maxVideos: parseInt(maxVideos),
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setImportResult(data);
        toast({
          title: 'Import Successful!',
          description: `Imported ${data.videosImported} videos from ${data.channelName}`,
        });
        
        // Reset form
        setChannelUrl('');
        setMaxVideos('50');
      } else {
        throw new Error(data.error || 'Import failed');
      }

    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during import';
      
      setImportResult({
        success: false,
        error: errorMessage
      });

      toast({
        title: 'Import Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          Import YouTube Channel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import an entire YouTube channel including all videos and metadata
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="channel-url">YouTube Channel URL</Label>
          <Input
            id="channel-url"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@channelname or https://www.youtube.com/channel/UC..."
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Supports: @username, /channel/, /c/, and /user/ URLs
          </p>
        </div>

        {/* Max Videos Selection */}
        <div className="space-y-2">
          <Label htmlFor="max-videos">Maximum Videos to Import</Label>
          <Select value={maxVideos} onValueChange={setMaxVideos} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 videos</SelectItem>
              <SelectItem value="25">25 videos</SelectItem>
              <SelectItem value="50">50 videos (recommended)</SelectItem>
              <SelectItem value="100">100 videos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Import Button */}
        <Button 
          onClick={handleImport} 
          disabled={loading || !channelUrl.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import Channel
            </>
          )}
        </Button>

        {/* Loading Progress */}
        {loading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Fetching channel data and importing videos...
            </p>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className={`p-4 rounded-lg border ${
            importResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                {importResult.success ? (
                  <>
                    <h4 className="font-medium text-green-900">
                      Import Completed Successfully!
                    </h4>
                    <div className="mt-2 text-sm text-green-800">
                      <p><strong>Channel:</strong> {importResult.channelName}</p>
                      <p><strong>Videos Imported:</strong> {importResult.videosImported} out of {importResult.totalVideos} found</p>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-red-900">Import Failed</h4>
                    <p className="mt-1 text-sm text-red-800">{importResult.error}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Note:</strong> This will:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Create a channel record in your database</li>
            <li>Import the most popular/relevant videos from the channel</li>
            <li>Automatically categorize videos based on content</li>
            <li>Skip videos that have already been imported</li>
            <li>Preserve original YouTube URLs for playback</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};