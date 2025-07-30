import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Youtube, Plus, X } from 'lucide-react';

interface YouTubeVideoData {
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  videoId: string;
  channelTitle: string;
}

export const YouTubeImportPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoData, setVideoData] = useState<YouTubeVideoData | null>(null);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const categories = [
    'Marketing', 'Sales', 'Technology', 'Finance', 'Real Estate',
    'Business Development', 'Leadership', 'Training', 'Education'
  ];

  // Extract YouTube video ID from various URL formats
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchVideoMetadata = async (videoId: string): Promise<YouTubeVideoData | null> => {
    try {
      // For demonstration, we'll create mock data
      // In production, you'd use YouTube Data API v3
      const mockData: YouTubeVideoData = {
        title: `YouTube Video ${videoId}`,
        description: 'Imported from YouTube - please update description',
        duration: '10:30',
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId,
        channelTitle: 'YouTube Channel'
      };
      
      return mockData;
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      return null;
    }
  };

  const handleUrlSubmit = async () => {
    if (!videoUrl.trim()) return;
    
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const metadata = await fetchVideoMetadata(videoId);
      if (metadata) {
        setVideoData(metadata);
        // Auto-detect category and tags from title/description
        const title = metadata.title.toLowerCase();
        if (title.includes('real estate')) setCategory('Real Estate');
        else if (title.includes('marketing')) setCategory('Marketing');
        else if (title.includes('sales')) setCategory('Sales');
        else if (title.includes('leadership')) setCategory('Leadership');
      } else {
        toast({
          title: 'Error',
          description: 'Could not fetch video metadata',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process YouTube URL',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const importVideo = async () => {
    if (!videoData || !category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use the current admin user as the creator for YouTube imports
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Must be logged in to import videos');
      }
      
      const contentData = {
        creator_id: user.id,
        title: videoData.title,
        description: videoData.description,
        content_type: 'video' as const,
        category,
        tags,
        content_url: `https://www.youtube.com/watch?v=${videoData.videoId}`,
        cover_image_url: videoData.thumbnailUrl,
        duration: videoData.duration,
        is_pro: false,
        is_featured: false,
        price: 0,
        is_published: true,
        published_at: new Date().toISOString(),
        metadata: {
          source: 'youtube',
          video_id: videoData.videoId,
          channel_title: videoData.channelTitle,
          imported_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('content')
        .insert([contentData]);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'YouTube video imported successfully',
      });

      // Reset form
      setVideoUrl('');
      setVideoData(null);
      setCategory('');
      setTags([]);
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An error occurred during import',
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
          Import YouTube Videos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Preload your platform with educational content from YouTube
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="youtube-url">YouTube URL</Label>
          <div className="flex gap-2">
            <Input
              id="youtube-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1"
            />
            <Button 
              onClick={handleUrlSubmit} 
              disabled={loading || !videoUrl.trim()}
            >
              {loading ? 'Loading...' : 'Fetch'}
            </Button>
          </div>
        </div>

        {/* Video Preview */}
        {videoData && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex gap-4">
              <img 
                src={videoData.thumbnailUrl} 
                alt={videoData.title}
                className="w-32 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium">{videoData.title}</h4>
                <p className="text-sm text-muted-foreground">{videoData.channelTitle}</p>
                <p className="text-sm text-muted-foreground">Duration: {videoData.duration}</p>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Import Button */}
            <Button 
              onClick={importVideo} 
              disabled={loading || !category}
              className="w-full"
            >
              {loading ? 'Importing...' : 'Import Video'}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>Note:</strong> Make sure you have permission to use the content. 
          Imported videos will link to the original YouTube content.
        </div>
      </CardContent>
    </Card>
  );
};