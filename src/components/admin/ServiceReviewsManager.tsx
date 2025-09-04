import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  Search, 
  Filter, 
  Trash2, 
  Flag, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ServiceReview {
  id: string;
  service_id: string;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  review_source: 'agent' | 'vendor_provided' | 'google_external' | 'admin_assigned';
  verified: boolean;
  source_url?: string;
  admin_notes?: string;
  service_title?: string;
  user_display_name?: string;
  user_avatar_url?: string;
}

interface ServiceReviewsStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export const ServiceReviewsManager = () => {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [stats, setStats] = useState<ServiceReviewsStats>({ 
    totalReviews: 0, 
    averageRating: 0, 
    ratingDistribution: {} 
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [services, setServices] = useState<Array<{ id: string; title: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setServices((data as any) || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('service_reviews')
        .select(`
          *,
          review_source,
          verified,
          source_url,
          admin_notes,
          services!service_reviews_service_id_fkey(title),
          profiles!service_reviews_user_id_fkey(display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      const formattedReviews = reviewsData?.map((review: any) => ({
        ...review,
        review_source: review.review_source as 'agent' | 'vendor_provided' | 'google_external' | 'admin_assigned',
        service_title: review.services?.title,
        user_display_name: review.profiles?.display_name,
        user_avatar_url: review.profiles?.avatar_url
      })) || [];

      setReviews(formattedReviews);

      // Calculate stats
      const totalReviews = formattedReviews.length;
      const averageRating = totalReviews > 0 
        ? formattedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      
      const ratingDistribution = formattedReviews.reduce((acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      }, {} as { [key: number]: number });

      setStats({ totalReviews, averageRating, ratingDistribution });

    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error loading reviews",
        description: "Failed to load service reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('service_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "The review has been successfully deleted",
      });

      fetchReviews(); // Refresh the list
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error deleting review",
        description: "Failed to delete the review",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchQuery || 
      review.review.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user_display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRating = filterRating === "all" || review.rating.toString() === filterRating;
    const matchesService = filterService === "all" || review.service_id === filterService;
    const matchesSource = filterSource === "all" || review.review_source === filterSource;
    
    return matchesSearch && matchesRating && matchesService && matchesSource;
  });

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalReviews}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center space-x-2 text-sm">
                  <span>{rating}★</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ 
                        width: `${((stats.ratingDistribution[rating] || 0) / stats.totalReviews) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground">
                    {stats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Service Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reviews, services, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} Star{rating !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="agent">Agent Reviews</SelectItem>
                <SelectItem value="vendor_provided">Vendor Reviews</SelectItem>
                <SelectItem value="google_external">Google Reviews</SelectItem>
                <SelectItem value="admin_assigned">Admin Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No reviews found matching your criteria
              </p>
            ) : (
              filteredReviews.map((review) => (
                <Card key={review.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar>
                          <AvatarImage 
                            src={review.user_avatar_url} 
                            onError={(e) => {
                              // Handle broken image URLs by removing the src
                              const target = e.target as HTMLImageElement;
                              target.src = '';
                            }}
                          />
                          <AvatarFallback>
                            {review.user_display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{review.user_display_name || 'Anonymous'}</p>
                                <Badge variant={review.review_source === 'agent' ? 'default' : 'secondary'}>
                                  {review.review_source === 'agent' && '👤 Agent'}
                                  {review.review_source === 'vendor_provided' && '🏢 Vendor'}
                                  {review.review_source === 'google_external' && '🌐 Google'}
                                  {review.review_source === 'admin_assigned' && '✓ Admin'}
                                </Badge>
                                {review.verified && (
                                  <Badge variant="outline" className="text-green-600">
                                    ✓ Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {review.service_title}
                              </p>
                            </div>
                            <div className="text-right">
                              <StarRating rating={review.rating} />
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm leading-relaxed">{review.review}</p>
                          
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
                          
                          {review.admin_notes && (
                            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                              <strong>Admin Notes:</strong> {review.admin_notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReview(review.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};