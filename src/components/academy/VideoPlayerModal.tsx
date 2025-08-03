import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Clock, User, X } from "lucide-react";

interface Video {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  category: string;
  rating?: number;
  isPro?: boolean;
  views?: string;
  description?: string;
  uploadDate?: string;
  tags?: string[];
  difficulty?: string;
}

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

export const VideoPlayerModal = ({ video, isOpen, onClose, videoUrl }: VideoPlayerModalProps) => {
  if (!video || !videoUrl) return null;

  // Extract video ID from YouTube URL for embedding
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : '';
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-left">{video.title}</DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {video.creator}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {video.duration}
                  </div>
                  {video.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {video.rating}
                    </div>
                  )}
                  {video.views && (
                    <span>{video.views} views</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{video.category}</Badge>
                  {video.isPro && <Badge variant="default">PRO</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Video Player */}
          <div className="flex-1 bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={video.title}
                className="w-full h-[500px]"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-white">
                <p>Unable to load video</p>
              </div>
            )}
          </div>

          {/* Description - YouTube Style */}
          <div className="px-6 py-4 border-t bg-muted/50">
            <div className="space-y-3">
              {/* Video Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {video.views && <span>{video.views} views</span>}
                {video.uploadDate && <span>•</span>}
                {video.uploadDate && <span>{video.uploadDate}</span>}
                {video.difficulty && <span>•</span>}
                {video.difficulty && <Badge variant="outline" className="text-xs">{video.difficulty}</Badge>}
              </div>
              
              {/* Description */}
              {video.description && (
                <div>
                  <ScrollArea className="h-24">
                    <p className="text-sm leading-relaxed pr-4">{video.description}</p>
                  </ScrollArea>
                </div>
              )}
              
              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};