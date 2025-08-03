import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Star, Clock, User, X, ThumbsUp, ThumbsDown, Heart, MessageCircle, Share, Bell, BellRing, Pin, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnhancedCreatorInfo } from "@/hooks/useEnhancedCreatorInfo";
import { useVideoInteractions } from "@/hooks/useVideoInteractions";
import { useVideoComments } from "@/hooks/useVideoComments";

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
  const { creatorInfo, loading: creatorLoading } = useEnhancedCreatorInfo(video?.id);
  
  // Find the channel ID from creator info for subscription functionality
  const channelId = creatorInfo?.youtube_channel_id || video?.creator_id;
  
  const { 
    interactions, 
    loading: interactionsLoading, 
    handleLike, 
    handleDislike, 
    handleSave, 
    handleSubscribe, 
    handleShare 
  } = useVideoInteractions(video?.id || '', channelId);
  
  const { 
    comments, 
    loading: commentsLoading, 
    newComment, 
    setNewComment, 
    isSubmitting, 
    submitComment, 
    likeComment 
  } = useVideoComments(video?.id || '');
  
  if (!video || !videoUrl) return null;

  // Create enhanced channel data using either platform user info or fallback
  const enhancedChannel: Channel = {
    id: video.creator_id || 'unknown',
    name: creatorInfo?.display_name || video.metadata?.channel_title || video.creator || 'Unknown Creator',
    avatar: creatorInfo?.display_avatar || undefined,
    subscribers: creatorInfo?.display_subscribers || video.metadata?.subscriber_count || 12500,
    isSubscribed: interactions.isSubscribed
  };

  // Create enhanced video object with real interaction data
  const enhancedVideo = {
    ...video,
    channel: enhancedChannel,
    likes: interactions.likes,
    dislikes: interactions.dislikes,
    isLiked: interactions.isLiked,
    isDisliked: interactions.isDisliked,
    isSaved: interactions.isSaved,
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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="h-[90vh]">
          <div className="flex flex-col">
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
                     onClick={handleLike}
                     disabled={interactionsLoading}
                     className={`rounded-l-full ${enhancedVideo.isLiked ? 'text-blue-600' : ''}`}
                   >
                     <ThumbsUp className="w-4 h-4 mr-1" />
                     {formatLikeCount(enhancedVideo.likes)}
                   </Button>
                   <div className="w-px h-6 bg-border" />
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={handleDislike}
                     disabled={interactionsLoading}
                     className={`rounded-r-full ${enhancedVideo.isDisliked ? 'text-red-600' : ''}`}
                   >
                     <ThumbsDown className="w-4 h-4 mr-1" />
                     {formatLikeCount(enhancedVideo.dislikes)}
                   </Button>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleShare}
                   className="rounded-full"
                 >
                   <Share className="w-4 h-4 mr-1" />
                   Share
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleSave}
                   disabled={interactionsLoading}
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{enhancedVideo.channel.name}</h4>
                    <TooltipProvider>
                      {creatorInfo?.creator_type === 'platform_user' && (
                        <Tooltip>
                          <TooltipTrigger>
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Verified Platform Creator</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {creatorInfo?.creator_type === 'claimed_channel' && (
                        <Tooltip>
                          <TooltipTrigger>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Claimed Channel</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatSubscriberCount(enhancedVideo.channel.subscribers)} subscribers
                    {creatorInfo?.creator_type === 'youtube_import' && (
                      <span className="ml-1 text-xs">(YouTube Import)</span>
                    )}
                  </p>
                  {creatorInfo?.platform_bio && (
                    <p className="text-xs text-muted-foreground mt-1">{creatorInfo.platform_bio}</p>
                  )}
                </div>
              </div>
               <Button 
                 variant={enhancedVideo.channel.isSubscribed ? "outline" : "default"}
                 size="sm"
                 onClick={handleSubscribe}
                 disabled={interactionsLoading}
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
           <div className="px-6 py-4 flex-1 min-h-0 overflow-hidden">
             <div className="space-y-4 h-full">
               <div className="flex items-center gap-2">
                 <MessageCircle className="w-5 h-5" />
                 <h3 className="font-medium">
                   {commentsLoading ? 'Loading...' : `${comments.length} Comments`}
                 </h3>
               </div>

               {/* Comments List with Add Comment inside ScrollArea */}
               <ScrollArea className="h-[calc(100%-2rem)]">
                 <div className="space-y-4 pr-4">
                   {/* Add Comment */}
                   <div className="flex gap-3 pb-4 border-b">
                     <Avatar className="w-8 h-8">
                       <AvatarFallback>U</AvatarFallback>
                     </Avatar>
                     <div className="flex-1">
                       <Textarea 
                         placeholder="Add a comment..." 
                         value={newComment}
                         onChange={(e) => setNewComment(e.target.value)}
                         className="min-h-[80px] resize-none"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => setNewComment('')}
                         >
                           Cancel
                         </Button>
                         <Button 
                           size="sm"
                           onClick={() => submitComment()}
                           disabled={isSubmitting || !newComment.trim()}
                         >
                           {isSubmitting ? 'Posting...' : 'Comment'}
                         </Button>
                       </div>
                     </div>
                   </div>

                   {/* Comments */}
                   {comments.map((comment) => (
                     <div key={comment.id} className="space-y-2">
                       <div className="flex gap-3">
                         <Avatar className="w-8 h-8">
                           <AvatarImage src={comment.author.avatar_url} />
                           <AvatarFallback>{comment.author.display_name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 space-y-1">
                           <div className="flex items-center gap-2">
                             <span className="font-medium text-sm">{comment.author.display_name}</span>
                             <span className="text-xs text-muted-foreground">
                               {new Date(comment.created_at).toLocaleDateString()}
                             </span>
                           </div>
                           <p className="text-sm">{comment.content}</p>
                           <div className="flex items-center gap-4 text-xs">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => likeComment(comment.id)}
                               className={`h-auto p-1 ${comment.isLiked ? 'text-blue-600' : ''}`}
                             >
                               <ThumbsUp className="w-3 h-3 mr-1" />
                               {comment.likes_count}
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
                                     <AvatarImage src={reply.author.avatar_url} />
                                     <AvatarFallback>{reply.author.display_name.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <div className="flex-1 space-y-1">
                                     <div className="flex items-center gap-2">
                                       <span className="font-medium text-sm">{reply.author.display_name}</span>
                                       <span className="text-xs text-muted-foreground">
                                         {new Date(reply.created_at).toLocaleDateString()}
                                       </span>
                                     </div>
                                     <p className="text-sm">{reply.content}</p>
                                     <div className="flex items-center gap-4 text-xs">
                                       <Button 
                                         variant="ghost" 
                                         size="sm" 
                                         onClick={() => likeComment(reply.id)}
                                         className={`h-auto p-1 ${reply.isLiked ? 'text-blue-600' : ''}`}
                                       >
                                         <ThumbsUp className="w-3 h-3 mr-1" />
                                         {reply.likes_count}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};