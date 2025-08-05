import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Facebook,
  Mail,
  Link,
  Smartphone,
  FileText,
  Zap
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export const BulkContentImporter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [importType, setImportType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // YouTube Channel Import
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [maxVideos, setMaxVideos] = useState('50');
  
  // Facebook Import
  const [facebookUrls, setFacebookUrls] = useState('');
  
  // Email Content Import
  const [emailContent, setEmailContent] = useState('');
  
  // Cold Call Scripts Import
  const [callScripts, setCallScripts] = useState('');
  
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

  const handleFacebookImport = async () => {
    if (!facebookUrls.trim() || !user) return;

    setLoading(true);
    setProgress(0);
    
    const urls = facebookUrls.split('\n').filter(url => url.trim());
    const imported: number[] = [];
    const errors: string[] = [];
    
    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim();
        setProgress((i / urls.length) * 100);
        
        try {
          // Extract basic info from Facebook URL
          let title = `Facebook Video ${i + 1}`;
          let description = `Imported Facebook content from: ${url}`;
          
          // Try to extract video ID or post info from URL
          if (url.includes('/videos/')) {
            const videoMatch = url.match(/\/videos\/(\d+)/);
            if (videoMatch) {
              title = `Facebook Video - ${videoMatch[1]}`;
            }
          } else if (url.includes('/posts/')) {
            title = `Facebook Post ${i + 1}`;
            description = `Imported Facebook post from: ${url}`;
          }

          const { error } = await supabase
            .from('content')
            .insert({
              creator_id: user.id,
              title,
              description,
              content_type: 'video',
              category: defaultCategory || 'Social Media',
              content_url: url,
              is_published: false, // Needs manual review
              metadata: { source: 'facebook', originalUrl: url },
              created_at: new Date().toISOString()
            });

          if (error) {
            errors.push(`Failed to import ${url}: ${error.message}`);
          } else {
            imported.push(i);
          }
          
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
          title: 'Facebook Import Complete',
          description: `Successfully imported ${imported.length} out of ${urls.length} Facebook items`,
        });
      }
      
    } catch (error) {
      console.error('Facebook import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Facebook import failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleEmailContentImport = async () => {
    if (!emailContent.trim() || !user) return;

    setLoading(true);
    setProgress(0);
    
    try {
      // Split email content by common delimiters
      const emailBodies = emailContent.split(/\n\s*---\s*\n|\n\s*===\s*\n|\n\s*###\s*\n/)
        .filter(content => content.trim().length > 100); // Only meaningful content
      
      const imported: number[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < emailBodies.length; i++) {
        const content = emailBodies[i].trim();
        setProgress((i / emailBodies.length) * 100);
        
        try {
          // Extract subject line if present
          const lines = content.split('\n');
          let title = `Email Content ${i + 1}`;
          let description = content;
          
          // Look for subject line patterns
          const subjectMatch = lines.find(line => 
            line.toLowerCase().includes('subject:') || 
            line.toLowerCase().includes('re:') ||
            line.toLowerCase().includes('fwd:')
          );
          
          if (subjectMatch) {
            title = subjectMatch.replace(/^(subject:|re:|fwd:)/i, '').trim();
            description = lines.slice(lines.indexOf(subjectMatch) + 1).join('\n').trim();
          } else if (lines[0] && lines[0].length < 100) {
            // Use first line as title if it's reasonably short
            title = lines[0];
            description = lines.slice(1).join('\n').trim();
          }

          const { error } = await supabase
            .from('content')
            .insert({
              creator_id: user.id,
              title: title.substring(0, 200), // Limit title length
              description: description.substring(0, 2000), // Limit description
              content_type: 'playbook', // Email content works well as playbooks
              category: defaultCategory || 'Marketing',
              is_published: false,
              metadata: { 
                source: 'email',
                originalLength: content.length,
                wordCount: content.split(/\s+/).length
              },
              created_at: new Date().toISOString()
            });

          if (error) {
            errors.push(`Failed to import email ${i + 1}: ${error.message}`);
          } else {
            imported.push(i);
          }
          
        } catch (error) {
          errors.push(`Failed to process email ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setResult({
        success: imported.length > 0,
        total: emailBodies.length,
        imported: imported.length,
        skipped: 0,
        errors
      });

      if (imported.length > 0) {
        toast({
          title: 'Email Import Complete',
          description: `Successfully converted ${imported.length} emails into playbook content`,
        });
      }
      
    } catch (error) {
      console.error('Email import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Email import failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleCallScriptsImport = async () => {
    if (!callScripts.trim() || !user) return;

    setLoading(true);
    setProgress(0);
    
    try {
      // Split scripts by common separators
      const scripts = callScripts.split(/\n\s*---\s*\n|\n\s*Script \d+:|\n\s*SCRIPT \d+:/)
        .filter(script => script.trim().length > 50);
      
      const imported: number[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i].trim();
        setProgress((i / scripts.length) * 100);
        
        try {
          const lines = script.split('\n');
          let title = `Cold Call Script ${i + 1}`;
          let description = script;
          
          // Look for title patterns
          const titleMatch = lines.find(line => 
            line.toLowerCase().includes('title:') ||
            line.toLowerCase().includes('script:') ||
            line.toLowerCase().includes('objective:')
          );
          
          if (titleMatch) {
            title = titleMatch.replace(/^(title:|script:|objective:)/i, '').trim();
            description = lines.slice(lines.indexOf(titleMatch) + 1).join('\n').trim();
          } else if (lines[0] && lines[0].length < 100) {
            title = lines[0];
            description = lines.slice(1).join('\n').trim();
          }

          const { error } = await supabase
            .from('content')
            .insert({
              creator_id: user.id,
              title: title.substring(0, 200),
              description: description.substring(0, 2000),
              content_type: 'playbook', // Scripts work well as playbooks
              category: 'Sales',
              is_published: false,
              metadata: { 
                source: 'cold_call_script',
                scriptLength: script.length,
                estimatedDuration: `${Math.ceil(script.split(/\s+/).length / 150)} minutes`
              },
              created_at: new Date().toISOString()
            });

          if (error) {
            errors.push(`Failed to import script ${i + 1}: ${error.message}`);
          } else {
            imported.push(i);
          }
          
        } catch (error) {
          errors.push(`Failed to process script ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setResult({
        success: imported.length > 0,
        total: scripts.length,
        imported: imported.length,
        skipped: 0,
        errors
      });

      if (imported.length > 0) {
        toast({
          title: 'Scripts Import Complete',
          description: `Successfully converted ${imported.length} call scripts into playbook content`,
        });
      }
      
    } catch (error) {
      console.error('Scripts import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Scripts import failed. Please try again.',
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
    setFacebookUrls('');
    setEmailContent('');
    setCallScripts('');
    setPlaylistData('');
    setUrlList('');
    setImportType('');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          One-Click Content Import
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import your existing content from YouTube, Facebook, emails, and more - no need to change your workflow!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result && (
          <>
            {/* Import Type Selection */}
            <div>
              <Label className="text-base font-medium">Choose Your Content Source</Label>
              <p className="text-sm text-muted-foreground mb-4">Select where your content is currently living</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Button
                  variant={importType === 'youtube' ? 'default' : 'outline'}
                  onClick={() => setImportType('youtube')}
                  className="flex flex-col items-center gap-2 h-24 hover:scale-105 transition-transform"
                >
                  <Youtube className="w-8 h-8 text-red-600" />
                  <span className="text-xs font-medium">YouTube</span>
                  <span className="text-xs text-muted-foreground">Channels & Videos</span>
                </Button>
                
                <Button
                  variant={importType === 'facebook' ? 'default' : 'outline'}
                  onClick={() => setImportType('facebook')}
                  className="flex flex-col items-center gap-2 h-24 hover:scale-105 transition-transform"
                >
                  <Facebook className="w-8 h-8 text-blue-600" />
                  <span className="text-xs font-medium">Facebook</span>
                  <span className="text-xs text-muted-foreground">Videos & Lives</span>
                </Button>
                
                <Button
                  variant={importType === 'email-content' ? 'default' : 'outline'}
                  onClick={() => setImportType('email-content')}
                  className="flex flex-col items-center gap-2 h-24 hover:scale-105 transition-transform"
                >
                  <Mail className="w-8 h-8 text-green-600" />
                  <span className="text-xs font-medium">Email Content</span>
                  <span className="text-xs text-muted-foreground">Convert to Playbooks</span>
                </Button>
                
                <Button
                  variant={importType === 'call-scripts' ? 'default' : 'outline'}
                  onClick={() => setImportType('call-scripts')}
                  className="flex flex-col items-center gap-2 h-24 hover:scale-105 transition-transform"
                >
                  <Smartphone className="w-8 h-8 text-purple-600" />
                  <span className="text-xs font-medium">Call Scripts</span>
                  <span className="text-xs text-muted-foreground">Cold Call Material</span>
                </Button>
                
                <Button
                  variant={importType === 'bulk-urls' ? 'default' : 'outline'}
                  onClick={() => setImportType('bulk-urls')}
                  className="flex flex-col items-center gap-2 h-24 hover:scale-105 transition-transform"
                >
                  <Link className="w-8 h-8 text-orange-600" />
                  <span className="text-xs font-medium">Any URLs</span>
                  <span className="text-xs text-muted-foreground">Bulk Import</span>
                </Button>
                
                <Button
                  variant={importType === 'playlist' ? 'default' : 'outline'}
                  onClick={() => setImportType('playlist')}
                  className="flex flex-col items-center gap-2 h-24 hover:scale-105 transition-transform"
                >
                  <FileText className="w-8 h-8 text-indigo-600" />
                  <span className="text-xs font-medium">Structured Data</span>
                  <span className="text-xs text-muted-foreground">CSV/List Format</span>
                </Button>
                
                <Button
                  variant="outline"
                  disabled
                  className="flex flex-col items-center gap-2 h-24 opacity-50"
                >
                  <Podcast className="w-8 h-8 text-cyan-600" />
                  <span className="text-xs font-medium">Podcasts</span>
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </Button>
                
                <Button
                  variant="outline"
                  disabled
                  className="flex flex-col items-center gap-2 h-24 opacity-50"
                >
                  <Plus className="w-8 h-8 text-gray-600" />
                  <span className="text-xs font-medium">More Sources</span>
                  <span className="text-xs text-muted-foreground">Request Feature</span>
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

            {/* Facebook Import */}
            {importType === 'facebook' && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                <div className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">Facebook Content Import</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Paste Facebook video URLs or live stream links. We'll import them as video content for your platform.
                </p>
                <div>
                  <Label htmlFor="default-category">Category for Facebook Content</Label>
                  <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="facebook-urls">Facebook URLs (one per line)</Label>
                  <Textarea
                    id="facebook-urls"
                    value={facebookUrls}
                    onChange={(e) => setFacebookUrls(e.target.value)}
                    placeholder="https://www.facebook.com/watch?v=123456789&#10;https://www.facebook.com/your.page/videos/987654321&#10;https://www.facebook.com/your.page/posts/456789123"
                    rows={8}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleFacebookImport} 
                  disabled={!facebookUrls.trim() || !defaultCategory || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Importing Facebook Content...' : 'Import from Facebook'}
                </Button>
              </div>
            )}

            {/* Email Content Import */}
            {importType === 'email-content' && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium">Email Content to Playbooks</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Convert your email blasts, newsletters, and outreach templates into valuable playbook content. 
                  Separate multiple emails with --- on a new line.
                </p>
                <div>
                  <Label htmlFor="default-category">Category for Email Content</Label>
                  <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Subject: Your first email subject line&#10;Email body content goes here...&#10;&#10;---&#10;&#10;Subject: Your second email subject line&#10;Second email content goes here..."
                    rows={12}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleEmailContentImport} 
                  disabled={!emailContent.trim() || !defaultCategory || loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Converting Emails...' : 'Convert Emails to Playbooks'}
                </Button>
              </div>
            )}

            {/* Call Scripts Import */}
            {importType === 'call-scripts' && (
              <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium">Cold Call Scripts to Playbooks</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Transform your cold calling scripts into structured playbook content that others can learn from. 
                  Separate multiple scripts with --- on a new line.
                </p>
                <div>
                  <Label htmlFor="call-scripts">Call Scripts</Label>
                  <Textarea
                    id="call-scripts"
                    value={callScripts}
                    onChange={(e) => setCallScripts(e.target.value)}
                    placeholder="Script 1: Introduction Call&#10;Hi [Name], this is [Your Name] from [Company]...&#10;&#10;---&#10;&#10;Script 2: Follow-up Call&#10;Hi [Name], I'm following up on our conversation..."
                    rows={12}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleCallScriptsImport} 
                  disabled={!callScripts.trim() || loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Converting Scripts...' : 'Convert Scripts to Playbooks'}
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
                onClick={() => navigate('/creator-dashboard')} 
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