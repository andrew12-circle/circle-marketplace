import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  parent_comment_id?: string;
  isLiked: boolean;
  author: {
    display_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export const useVideoComments = (contentId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contentId) {
      fetchComments();
    }
  }, [contentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Get comments with user data - using manual join since direct relation may not exist
      const { data: commentsData, error } = await supabase
        .from('content_comments')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for comment authors
      let profilesData: any[] = [];
      if (commentsData && commentsData.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', commentsData.map(c => c.user_id));
        
        profilesData = profiles || [];
      }

      // Get current user's comment likes
      const { data: { user } } = await supabase.auth.getUser();
      let userLikes: string[] = [];
      
      if (user && commentsData) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentsData.map(c => c.id));
        
        userLikes = likesData?.map(l => l.comment_id) || [];
      }

      // Transform data and organize replies
      const transformedComments = commentsData?.map(comment => {
        const profile = profilesData.find(p => p.user_id === comment.user_id);
        return {
          id: comment.id,
          user_id: comment.user_id,
          content: comment.content,
          likes_count: comment.likes_count,
          created_at: comment.created_at,
          parent_comment_id: comment.parent_comment_id,
          isLiked: userLikes.includes(comment.id),
          author: {
            display_name: profile?.display_name || 'Anonymous',
            avatar_url: profile?.avatar_url,
          },
        };
      }) || [];

      // Organize comments and replies
      const topLevelComments = transformedComments
        .filter(comment => !comment.parent_comment_id)
        .map(comment => ({
          ...comment,
          replies: transformedComments.filter(reply => reply.parent_comment_id === comment.id),
        }));

      setComments(topLevelComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({ title: "Error loading comments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (parentCommentId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to comment", variant: "destructive" });
      return;
    }

    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('content_comments')
        .insert({
          content_id: contentId,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: parentCommentId,
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      toast({ title: "Comment posted successfully" });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({ title: "Error posting comment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const likeComment = async (commentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to like comments", variant: "destructive" });
      return;
    }

    try {
      const comment = comments.find(c => c.id === commentId) || 
                    comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
      
      if (!comment) return;

      if (comment.isLiked) {
        // Remove like
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Add like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
      }

      await fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({ title: "Error updating comment like", variant: "destructive" });
    }
  };

  return {
    comments,
    loading,
    newComment,
    setNewComment,
    isSubmitting,
    submitComment,
    likeComment,
    refetch: fetchComments,
  };
};