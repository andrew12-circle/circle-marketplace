import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoInteractions {
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
  isSubscribed: boolean;
}

export const useVideoInteractions = (contentId: string, channelId?: string) => {
  const [interactions, setInteractions] = useState<VideoInteractions>({
    likes: 0,
    dislikes: 0,
    isLiked: false,
    isDisliked: false,
    isSaved: false,
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (contentId) {
      fetchInteractions();
    }
  }, [contentId]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      
      // Get interaction counts
      const { data: interactionCounts, error: countsError } = await supabase
        .from('content_interactions')
        .select('interaction_type')
        .eq('content_id', contentId);

      if (countsError) throw countsError;

      // Count likes and dislikes
      const likes = interactionCounts?.filter(i => i.interaction_type === 'like').length || 0;
      const dislikes = interactionCounts?.filter(i => i.interaction_type === 'dislike').length || 0;

      // Get current user's interactions
      const { data: { user } } = await supabase.auth.getUser();
      let userInteractions = { isLiked: false, isDisliked: false, isSaved: false, isSubscribed: false };

      if (user) {
        const { data: userInteractionData } = await supabase
          .from('content_interactions')
          .select('interaction_type')
          .eq('content_id', contentId)
          .eq('user_id', user.id);

        userInteractions.isLiked = userInteractionData?.some(i => i.interaction_type === 'like') || false;
        userInteractions.isDisliked = userInteractionData?.some(i => i.interaction_type === 'dislike') || false;
        userInteractions.isSaved = userInteractionData?.some(i => i.interaction_type === 'save') || false;

        // Check subscription status
        if (channelId) {
          const { data: subscriptionData } = await supabase
            .from('channel_subscriptions')
            .select('id')
            .eq('channel_id', channelId)
            .eq('user_id', user.id)
            .single();

          userInteractions.isSubscribed = !!subscriptionData;
        }
      }

      setInteractions({
        likes,
        dislikes,
        ...userInteractions,
      });
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to like videos", variant: "destructive" });
      return;
    }

    try {
      if (interactions.isLiked) {
        // Remove like
        await supabase
          .from('content_interactions')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');
        
        setInteractions(prev => ({
          ...prev,
          isLiked: false,
          likes: prev.likes - 1,
        }));
      } else {
        // Remove dislike if exists and add like
        if (interactions.isDisliked) {
          await supabase
            .from('content_interactions')
            .delete()
            .eq('content_id', contentId)
            .eq('user_id', user.id)
            .eq('interaction_type', 'dislike');
        }

        await supabase
          .from('content_interactions')
          .insert({
            content_id: contentId,
            user_id: user.id,
            interaction_type: 'like',
          });

        setInteractions(prev => ({
          ...prev,
          isLiked: true,
          isDisliked: false,
          likes: prev.likes + 1,
          dislikes: prev.isDisliked ? prev.dislikes - 1 : prev.dislikes,
        }));
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({ title: "Error updating like", variant: "destructive" });
    }
  };

  const handleDislike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to dislike videos", variant: "destructive" });
      return;
    }

    try {
      if (interactions.isDisliked) {
        // Remove dislike
        await supabase
          .from('content_interactions')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'dislike');
        
        setInteractions(prev => ({
          ...prev,
          isDisliked: false,
          dislikes: prev.dislikes - 1,
        }));
      } else {
        // Remove like if exists and add dislike
        if (interactions.isLiked) {
          await supabase
            .from('content_interactions')
            .delete()
            .eq('content_id', contentId)
            .eq('user_id', user.id)
            .eq('interaction_type', 'like');
        }

        await supabase
          .from('content_interactions')
          .insert({
            content_id: contentId,
            user_id: user.id,
            interaction_type: 'dislike',
          });

        setInteractions(prev => ({
          ...prev,
          isDisliked: true,
          isLiked: false,
          dislikes: prev.dislikes + 1,
          likes: prev.isLiked ? prev.likes - 1 : prev.likes,
        }));
      }
    } catch (error) {
      console.error('Error handling dislike:', error);
      toast({ title: "Error updating dislike", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to save videos", variant: "destructive" });
      return;
    }

    try {
      if (interactions.isSaved) {
        await supabase
          .from('content_interactions')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'save');
        
        setInteractions(prev => ({ ...prev, isSaved: false }));
        toast({ title: "Removed from saved videos" });
      } else {
        await supabase
          .from('content_interactions')
          .insert({
            content_id: contentId,
            user_id: user.id,
            interaction_type: 'save',
          });

        setInteractions(prev => ({ ...prev, isSaved: true }));
        toast({ title: "Added to saved videos" });
      }
    } catch (error) {
      console.error('Error handling save:', error);
      toast({ title: "Error updating save status", variant: "destructive" });
    }
  };

  const handleSubscribe = async () => {
    if (!channelId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to subscribe", variant: "destructive" });
      return;
    }

    try {
      if (interactions.isSubscribed) {
        await supabase
          .from('channel_subscriptions')
          .delete()
          .eq('channel_id', channelId)
          .eq('user_id', user.id);
        
        setInteractions(prev => ({ ...prev, isSubscribed: false }));
        toast({ title: "Unsubscribed from channel" });
      } else {
        await supabase
          .from('channel_subscriptions')
          .insert({
            channel_id: channelId,
            user_id: user.id,
          });

        setInteractions(prev => ({ ...prev, isSubscribed: true }));
        toast({ title: "Subscribed to channel" });
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
      toast({ title: "Error updating subscription", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this video',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({ title: "Error sharing video", variant: "destructive" });
    }
  };

  return {
    interactions,
    loading,
    handleLike,
    handleDislike,
    handleSave,
    handleSubscribe,
    handleShare,
    refetch: fetchInteractions,
  };
};