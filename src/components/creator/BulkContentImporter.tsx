import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Youtube, 
  Music, 
  Podcast, 
  BookOpen,
  GraduationCap,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export const BulkContentImporter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [importType, setImportType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // YouTube Channel Import
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [maxVideos, setMaxVideos] = useState('50');
  
  // Playlist Import
  const [playlistData, setPlaylistData] = useState('');
  
  // Bulk URL Import
  const [urlList, setUrlList] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('');

  const categories = [
    'Marketing', 'Sales', 'Technology', 'Finance', 'Real Estate',
    'Business Development', 'Leadership', 'Training', 'Education'
  ];

  const handleYouTubeImport = async () => {
    if (!youtubeUrl.trim() || !user) return;

    setLoading(true);
    setProgress(0);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-youtube-channel', {
        body: {
          channelUrl: youtubeUrl.trim(),
          maxVideos: parseInt(maxVideos),
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          success: true,
          total: data.totalVideos || 0,
          imported: data.videosImported || 0,
          skipped: (data.totalVideos || 0) - (data.videosImported || 0),
          errors: []
        });
        
        toast({
          title: 'Import Successful!',
          description: `Imported ${data.videosImported} videos from ${data.channelName}`,
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('YouTube import error:', error);
      setResult({
        success: false,
        total: 0,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
      
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An error occurred during import',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleBulkUrlImport = async () => {
    if (!urlList.trim() || !defaultCategory || !user) return;

    setLoading(true);
    setProgress(0);
    
    const urls = urlList.split('\n').filter(url => url.trim());
    const imported: number[] = [];
    const errors: string[] = [];
    
    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim();
        setProgress((i / urls.length) * 100);
        
        try {
          // Determine content type from URL
          let contentType: 'video' | 'podcast' | 'book' | 'course' | 'playbook' = 'video';
          if (url.includes('spotify.com') || url.includes('anchor.fm') || url.includes('podcast')) {
            contentType = 'podcast';
          } else if (url.includes('book') || url.includes('.pdf') || url.includes('.epub')) {
            contentType = 'book';
          } else if (url.includes('course') || url.includes('lesson')) {
            contentType = 'course';
          }

          // Create basic content record
          const { error } = await supabase
            .from('content')
            .insert({
              creator_id: user.id,
              title: `Imported ${contentType} ${i + 1}`,
              description: `Imported from URL: ${url}`,
              content_type: contentType,
              category: defaultCategory,
              content_url: url,
              is_published: false, // Needs manual review
              created_at: new Date().toISOString()
            });

          if (error) {
            errors.push(`Failed to import ${url}: ${error.message}`);
          } else {
            imported.push(i);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          errors.push(`Failed to process ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setResult({
        success: imported.length > 0,
        total: urls.length,
        imported: imported.length,
        skipped: 0,
        errors
      });

      if (imported.length > 0) {
        toast({
          title: 'Bulk Import Complete',
          description: `Successfully imported ${imported.length} out of ${urls.length} items`,
        });
      }
      
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Bulk import failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handlePlaylistImport = async () => {
    if (!playlistData.trim() || !user) return;

    setLoading(true);
    setProgress(0);
    
    try {
      // Parse playlist data (could be CSV, JSON, or text format)
      const lines = playlistData.split('\n').filter(line => line.trim());
      const imported: number[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        setProgress((i / lines.length) * 100);
        
        try {
          // Assume format: "Title | Description | URL | Category"
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 3) {
            const [title, description, url, category] = parts;
            
            const { error } = await supabase
              .from('content')
              .insert({
                creator_id: user.id,
                title: title || `Playlist Item ${i + 1}`,
                description: description || '',
                content_type: 'video',
                category: category || defaultCategory || 'Education',
                content_url: url,
                is_published: false,
                created_at: new Date().toISOString()
              });

            if (error) {
              errors.push(`Line ${i + 1}: ${error.message}`);
            } else {
              imported.push(i);
            }
          } else {
            errors.push(`Line ${i + 1}: Invalid format (expected: Title | Description | URL | Category)`);
          }
          
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setResult({
        success: imported.length > 0,
        total: lines.length,
        imported: imported.length,
        skipped: 0,
        errors
      });

      if (imported.length > 0) {
        toast({
          title: 'Playlist Import Complete',
          description: `Successfully imported ${imported.length} out of ${lines.length} items`,
        });
      }
      
    } catch (error) {
      console.error('Playlist import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Playlist import failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const resetImport = () => {
    setResult(null);
    setProgress(0);
    setYoutubeUrl('');
    setPlaylistData('');
    setUrlList('');
    setImportType('');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Content Importer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import multiple pieces of content at once to quickly populate your library
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result && (
          <>
            {/* Import Type Selection */}
            <div>
              <Label>Import Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <Button
                  variant={importType === 'youtube' ? 'default' : 'outline'}
                  onClick={() => setImportType('youtube')}
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Youtube className="w-6 h-6" />
                  <span className="text-xs">YouTube Channel</span>
                </Button>
                <Button
                  variant={importType === 'playlist' ? 'default' : 'outline'}
                  onClick={() => setImportType('playlist')}
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Music className="w-6 h-6" />
                  <span className="text-xs">Playlist Data</span>
                </Button>
                <Button
                  variant={importType === 'bulk-urls' ? 'default' : 'outline'}
                  onClick={() => setImportType('bulk-urls')}
                  className="flex flex-col items-center gap-2 h-20"
                >
                  <Download className="w-6 h-6" />
                  <span className="text-xs">Bulk URLs</span>
                </Button>
                <Button
                  variant={importType === 'podcasts' ? 'default' : 'outline'}
                  onClick={() => setImportType('podcasts')}
                  className="flex flex-col items-center gap-2 h-20"
                  disabled
                >
                  <Podcast className="w-6 h-6" />
                  <span className="text-xs">Podcasts (Soon)</span>
                </Button>
              </div>
            </div>

            {/* YouTube Channel Import */}
            {importType === 'youtube' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">YouTube Channel Import</h4>
                <div>
                  <Label htmlFor="youtube-url">YouTube Channel URL</Label>
                  <Input
                    id="youtube-url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/@channelname"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="max-videos">Maximum Videos to Import</Label>
                  <Select value={maxVideos} onValueChange={setMaxVideos}>
                    <SelectTrigger className="mt-1">
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
                <Button 
                  onClick={handleYouTubeImport} 
                  disabled={!youtubeUrl.trim() || loading}
                  className="w-full"
                >
                  {loading ? 'Importing...' : 'Import YouTube Channel'}
                </Button>
              </div>
            )}

            {/* Bulk URLs Import */}
            {importType === 'bulk-urls' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Bulk URL Import</h4>
                <div>
                  <Label htmlFor="default-category">Default Category</Label>
                  <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select default category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="url-list">URLs (one per line)</Label>
                  <Textarea
                    id="url-list"
                    value={urlList}
                    onChange={(e) => setUrlList(e.target.value)}
                    placeholder="https://example.com/video1&#10;https://example.com/video2&#10;https://example.com/podcast1"
                    rows={8}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleBulkUrlImport} 
                  disabled={!urlList.trim() || !defaultCategory || loading}
                  className="w-full"
                >
                  {loading ? 'Importing...' : 'Import URLs'}
                </Button>
              </div>
            )}

            {/* Playlist Data Import */}
            {importType === 'playlist' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Playlist Data Import</h4>
                <p className="text-sm text-muted-foreground">
                  Format: Title | Description | URL | Category (one per line)
                </p>
                <div>
                  <Label htmlFor="playlist-data">Playlist Data</Label>
                  <Textarea
                    id="playlist-data"
                    value={playlistData}
                    onChange={(e) => setPlaylistData(e.target.value)}
                    placeholder="Video Title | Video Description | https://example.com/video | Marketing&#10;Another Video | Another Description | https://example.com/video2 | Sales"
                    rows={8}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handlePlaylistImport} 
                  disabled={!playlistData.trim() || loading}
                  className="w-full"
                >
                  {loading ? 'Importing...' : 'Import Playlist'}
                </Button>
              </div>
            )}

            {/* Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing content...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? 'Import Completed' : 'Import Failed'}
                  </h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-4 text-sm">
                      <Badge variant="secondary">Total: {result.total}</Badge>
                      <Badge variant="default">Imported: {result.imported}</Badge>
                      {result.skipped > 0 && (
                        <Badge variant="outline">Skipped: {result.skipped}</Badge>
                      )}
                    </div>
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-800">Errors:</p>
                        <ul className="text-sm text-red-700 list-disc list-inside">
                          {result.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>... and {result.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={resetImport} variant="outline" className="flex-1">
                Import More Content
              </Button>
              <Button 
                onClick={() => window.location.href = '/creator-dashboard'} 
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};