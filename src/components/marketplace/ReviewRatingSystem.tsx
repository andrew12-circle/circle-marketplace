import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, Flag, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  service_id: string;
  review_source: 'agent' | 'vendor_provided' | 'google_external' | 'admin_assigned';
  verified: boolean;
  source_url?: string;
  admin_notes?: string;
  user_display_name?: string;
  user_avatar_url?: string;
}

interface ReviewRatingSystemProps {
  serviceId: string;
  vendorId?: string;
  averageRating?: number;
  totalReviews?: number;
  onRatingUpdate?: (newRating: number, newCount: number) => void;
}

export const ReviewRatingSystem = ({
  serviceId,
  vendorId,
  averageRating = 0,
  totalReviews = 0,
  onRatingUpdate
}: ReviewRatingSystemProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // New review form
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState("");
  const [editingReview, setEditingReview] = useState<string | null>(null);

  // Calculate average and total from loaded reviews
  const [calculatedRating, setCalculatedRating] = useState(averageRating);
  const [calculatedTotal, setCalculatedTotal] = useState(totalReviews);

  useEffect(() => {
    loadReviews();
  }, [serviceId]);

  const loadReviews = async () => {
    try {
      // Load reviews using raw query to avoid type issues
      const { data: reviewsData, error } = await supabase
        .from('service_reviews')
        .select('*, review_source, verified, source_url, admin_notes')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Reviews table may not exist yet:', error);
        setReviews([]);
        setLoading(false);
        return;
      }

      // Load user profile data separately
      const userIds = reviewsData?.map(r => r.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Combine reviews with user data
      const reviewsWithUsers = (reviewsData || []).map(review => {
        const userProfile = profilesData?.find(p => p.user_id === review.user_id);
        return {
          ...review,
          review_source: review.review_source as 'agent' | 'vendor_provided' | 'google_external' | 'admin_assigned',
          user_display_name: userProfile?.display_name || 'Anonymous User',
          user_avatar_url: userProfile?.avatar_url
        } as Review;
      });

      setReviews(reviewsWithUsers);

      // Calculate rating stats
      if (reviewsWithUsers.length > 0) {
        const avgRating = reviewsWithUsers.reduce((sum, r) => sum + r.rating, 0) / reviewsWithUsers.length;
        setCalculatedRating(avgRating);
        setCalculatedTotal(reviewsWithUsers.length);
      }

      // Check if current user has already reviewed
      const currentUserReview = reviewsWithUsers.find(review => review.user_id === user?.id);
      setUserReview(currentUserReview || null);
      
      if (currentUserReview) {
        setNewRating(currentUserReview.rating);
        setNewReviewText(currentUserReview.review || "");
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review.",
        variant: "destructive"
      });
      return;
    }

    if (newRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        service_id: serviceId,
        user_id: user.id,
        rating: newRating,
        review: newReviewText.trim() || null,
        review_source: 'agent' as const,
        verified: false
      };

      let result;
      if (userReview) {
        // Update existing review
        result = await supabase
          .from('service_reviews')
          .update(reviewData)
          .eq('id', userReview.id)
          .select();
      } else {
        // Create new review
        result = await supabase
          .from('service_reviews')
          .insert(reviewData)
          .select();
      }

      if (result.error) throw result.error;

      // Refresh reviews
      await loadReviews();

      // Notify parent component
      if (onRatingUpdate) {
        onRatingUpdate(calculatedRating, calculatedTotal);
      }

      toast({
        title: userReview ? "Review Updated" : "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Reset form if this was a new review
      if (!userReview) {
        setNewRating(0);
        setNewReviewText("");
      }
      setEditingReview(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('service_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      await loadReviews();
      setUserReview(null);
      setNewRating(0);
      setNewReviewText("");

      toast({
        title: "Review Deleted",
        description: "Your review has been removed.",
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper component for review source badge
  const ReviewSourceBadge = ({ review }: { review: Review }) => {
    const getSourceInfo = () => {
      switch (review.review_source) {
        case 'agent':
          return { label: 'Agent Review', color: 'bg-primary text-primary-foreground', icon: '👤' };
        case 'vendor_provided':
          return { label: 'Vendor Review', color: 'bg-secondary text-secondary-foreground', icon: '🏢' };
        case 'google_external':
          return { label: 'Google Review', color: 'bg-blue-500 text-white', icon: '🌐' };
        case 'admin_assigned':
          return { label: 'Verified Review', color: 'bg-green-500 text-white', icon: '✓' };
        default:
          return { label: 'Review', color: 'bg-muted text-muted-foreground', icon: '📝' };
      }
    };

    const sourceInfo = getSourceInfo();

    return (
      <div className="flex items-center gap-1">
        <span className={`text-xs px-2 py-1 rounded-full ${sourceInfo.color}`}>
          {sourceInfo.icon} {sourceInfo.label}
        </span>
        {review.verified && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
            ✓ Verified
          </span>
        )}
      </div>
    );
  };

  const StarRating = ({ rating, interactive = false, onRatingChange }: {
    rating: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            onClick={() => interactive && onRatingChange?.(star)}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{calculatedRating.toFixed(1)}</div>
              <StarRating rating={calculatedRating} />
              <div className="text-sm text-muted-foreground">{calculatedTotal} reviews</div>
            </div>
          </div>

          {/* Write/Edit Review Form */}
          {user && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">
                {userReview ? (editingReview ? 'Edit Your Review' : 'Your Review') : 'Write a Review'}
              </h3>
              
              {(!userReview || editingReview) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <StarRating
                      rating={newRating}
                      interactive
                      onRatingChange={setNewRating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Review (Optional)</label>
                    <Textarea
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Share your experience with this service..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={submitReview}
                      disabled={submitting || newRating === 0}
                    >
                      {submitting ? "Submitting..." : (userReview ? "Update Review" : "Submit Review")}
                    </Button>
                    
                    {editingReview && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingReview(null);
                          setNewRating(userReview?.rating || 0);
                          setNewReviewText(userReview?.review || "");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Display existing user review */}
              {userReview && !editingReview && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <StarRating rating={userReview.rating} />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingReview(userReview.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReview(userReview.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {userReview.review && (
                      <p className="text-sm">{userReview.review}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(userReview.created_at), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.filter(review => review.id !== userReview?.id).map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={review.user_avatar_url} />
                  <AvatarFallback>
                    {review.user_display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm">{review.user_display_name}</div>
                        <ReviewSourceBadge review={review} />
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {review.review && (
                    <p className="text-sm mb-3">{review.review}</p>
                  )}
                  
                  {review.source_url && (
                    <a 
                      href={review.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View original review
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {reviews.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-muted-foreground">
                No reviews yet. Be the first to review this service!
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};