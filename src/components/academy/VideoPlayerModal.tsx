import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Star, Clock, User, X, ThumbsUp, ThumbsDown, Heart, MessageCircle, Share, Bell, BellRing, Pin } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  avatar?: string;
  subscribers: number;
  isSubscribed: boolean;
}

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isPinned?: boolean;
  replies?: Comment[];
}

interface Video {
  id: string;
  title: string;
  creator: string;
  thumbnail?: string;
  duration: string;
  category: string;
  rating?: number;
  isPro?: boolean;
  views?: string;
  description?: string;
  uploadDate?: string;
  tags?: string[];
  difficulty?: string;
  // Database fields
  creator_id?: string;
  metadata?: any;
  published_at?: string;
  total_plays?: number;
  // Social features (will be enhanced in component)
  channel?: Channel;
  likes?: number;
  dislikes?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isSaved?: boolean;
  comments?: Comment[];
}

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

export const VideoPlayerModal = ({ video, isOpen, onClose, videoUrl }: VideoPlayerModalProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  if (!video || !videoUrl) return null;

  // Create mock data for features not yet in database
  const mockChannel: Channel = {
    id: video.creator_id || 'unknown',
    name: video.metadata?.channel_title || video.creator || 'Unknown Channel',
    subscribers: 12500,
    isSubscribed: false,
    avatar: undefined
  };

  const mockComments: Comment[] = [
    {
      id: '1',
      author: 'John Doe',
      content: 'Great insights! This really helped me understand the market better.',
      timestamp: '2 days ago',
      likes: 24,
      isLiked: false,
      isPinned: true
    },
    {
      id: '2', 
      author: 'Sarah Chen',
      content: 'Thank you for breaking down the complex topics into easy-to-understand concepts.',
      timestamp: '1 day ago',
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: '2a',
          author: video.metadata?.channel_title || video.creator || 'Creator',
          content: 'Thanks for watching! Glad it was helpful.',
          timestamp: '1 day ago',
          likes: 5,
          isLiked: false
        }
      ]
    }
  ];

  // Enhance video object with mock social features
  const enhancedVideo = {
    ...video,
    channel: mockChannel,
    likes: video.metadata?.like_count || 150,
    dislikes: 12,
    isLiked: false,
    isDisliked: false,
    isSaved: false,
    comments: mockComments,
    uploadDate: video.published_at ? new Date(video.published_at).toLocaleDateString() : 'Unknown',
    views: `${video.total_plays?.toLocaleString() || '0'} views`
  };

  // Extract video ID from YouTube URL for embedding
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : '';
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatLikeCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-left">{enhancedVideo.title}</DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {enhancedVideo.views && <span>{enhancedVideo.views}</span>}
                  {enhancedVideo.uploadDate && <span>•</span>}
                  {enhancedVideo.uploadDate && <span>{enhancedVideo.uploadDate}</span>}
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
                title={enhancedVideo.title}
                className="w-full h-[400px]"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-white">
                <p>Unable to load video</p>
              </div>
            )}
          </div>

          {/* Video Actions */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{enhancedVideo.category}</Badge>
                {enhancedVideo.isPro && <Badge variant="default">PRO</Badge>}
                {enhancedVideo.difficulty && <Badge variant="outline">{enhancedVideo.difficulty}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted rounded-full">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`rounded-l-full ${enhancedVideo.isLiked ? 'text-blue-600' : ''}`}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {formatLikeCount(enhancedVideo.likes)}
                  </Button>
                  <div className="w-px h-6 bg-border" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`rounded-r-full ${enhancedVideo.isDisliked ? 'text-red-600' : ''}`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {formatLikeCount(enhancedVideo.dislikes)}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`rounded-full ${enhancedVideo.isSaved ? 'text-blue-600' : ''}`}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  {enhancedVideo.isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </div>

          {/* Channel Info */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={enhancedVideo.channel.avatar} />
                  <AvatarFallback>{enhancedVideo.channel.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{enhancedVideo.channel.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatSubscriberCount(enhancedVideo.channel.subscribers)} subscribers
                  </p>
                </div>
              </div>
              <Button 
                variant={enhancedVideo.channel.isSubscribed ? "outline" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                {enhancedVideo.channel.isSubscribed ? (
                  <>
                    <BellRing className="w-4 h-4" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="space-y-3">
              {enhancedVideo.description && (
                <div className="space-y-2">
                  <div className={`text-sm leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                    {enhancedVideo.description}
                  </div>
                  {enhancedVideo.description.length > 150 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                </div>
              )}
              
              {enhancedVideo.tags && enhancedVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {enhancedVideo.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-4 flex-1">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-medium">{enhancedVideo.comments.length} Comments</h3>
              </div>

              {/* Comments List with Add Comment inside ScrollArea */}
              <ScrollArea className="h-64">
                <div className="space-y-4 pr-4">
                  {/* Add Comment */}
                  <div className="flex gap-3 pb-4 border-b">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea 
                        placeholder="Add a comment..." 
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="sm">Cancel</Button>
                        <Button size="sm">Comment</Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {enhancedVideo.comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      {comment.isPinned && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Pin className="w-3 h-3" />
                          Pinned by {enhancedVideo.channel.name}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.avatar} />
                          <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-auto p-1 ${comment.isLiked ? 'text-blue-600' : ''}`}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {comment.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              Reply
                            </Button>
                          </div>
                          
                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-6 mt-3 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={reply.avatar} />
                                    <AvatarFallback>{reply.author.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{reply.author}</span>
                                      <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={`h-auto p-1 ${reply.isLiked ? 'text-blue-600' : ''}`}
                                      >
                                        <ThumbsUp className="w-3 h-3 mr-1" />
                                        {reply.likes}
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-auto p-1">
                                        <ThumbsDown className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};