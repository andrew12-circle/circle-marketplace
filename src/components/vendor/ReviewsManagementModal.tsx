import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Reply, Flag, TrendingUp, MessageSquare, ThumbsUp, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  service_id: string;
  service_title: string;
  rating: number;
  review_text: string;
  reviewer_name: string;
  reviewer_email?: string;
  created_at: string;
  response?: string;
  response_date?: string;
  is_flagged: boolean;
  is_verified: boolean;
}

interface ReviewsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
}

export const ReviewsManagementModal = ({ isOpen, onClose, vendorId }: ReviewsManagementModalProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    pending_responses: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
    }
  }, [isOpen, vendorId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - would be replaced with actual Supabase query
      const mockReviews: Review[] = [
        {
          id: "1",
          service_id: "service-1",
          service_title: "Lead Generation System",
          rating: 5,
          review_text: "Outstanding service! Increased our leads by 300% in just 2 months. The team was professional and delivered exactly what they promised.",
          reviewer_name: "Sarah Johnson",
          reviewer_email: "sarah@example.com",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          is_flagged: false,
          is_verified: true
        },
        {
          id: "2",
          service_id: "service-1",
          service_title: "Lead Generation System",
          rating: 4,
          review_text: "Great results overall. Setup took longer than expected but worth the wait. Customer support was responsive.",
          reviewer_name: "Mike Chen",
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          response: "Thank you for your feedback, Mike! We're working on streamlining our setup process. We're thrilled you're seeing great results!",
          response_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          is_flagged: false,
          is_verified: true
        },
        {
          id: "3",
          service_id: "service-2",
          service_title: "Marketing Automation",
          rating: 3,
          review_text: "Good service but had some technical issues initially. Support helped resolve them.",
          reviewer_name: "Jennifer Davis",
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_flagged: false,
          is_verified: true
        },
        {
          id: "4",
          service_id: "service-1",
          service_title: "Lead Generation System",
          rating: 2,
          review_text: "Service didn't meet expectations. Multiple delays and poor communication.",
          reviewer_name: "Robert Kim",
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          is_flagged: true,
          is_verified: false
        }
      ];

      setReviews(mockReviews);
      
      // Calculate stats
      const total = mockReviews.length;
      const average = mockReviews.reduce((sum, r) => sum + r.rating, 0) / total;
      const distribution = mockReviews.reduce((acc, r) => {
        acc[r.rating as keyof typeof acc]++;
        return acc;
      }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      const pending_responses = mockReviews.filter(r => !r.response).length;

      setStats({ total, average, distribution, pending_responses });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;

    setSubmittingResponse(true);
    try {
      // Mock response submission - would be replaced with actual Supabase update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              response: responseText,
              response_date: new Date().toISOString()
            }
          : review
      ));
      
      setResponseText("");
      setSelectedReview(null);
      
      toast({
        title: "Success",
        description: "Your response has been posted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post response",
        variant: "destructive",
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleFlag = async (reviewId: string) => {
    try {
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, is_flagged: !review.is_flagged }
          : review
      ));
      
      toast({
        title: "Success",
        description: "Review flagged for moderation",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to flag review",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = filterRating 
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Reviews Management</DialogTitle>
          <p className="text-muted-foreground">
            Manage customer reviews, respond to feedback, and track your reputation
          </p>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">All Reviews ({stats.total})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{stats.average.toFixed(1)}</span>
                    <div className="flex">
                      {renderStars(Math.round(stats.average))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">From {stats.total} reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.pending_responses}</div>
                  <p className="text-sm text-muted-foreground">Reviews awaiting response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(((stats.total - stats.pending_responses) / stats.total) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Reviews with responses</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats.distribution[rating as keyof typeof stats.distribution];
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm">{rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={filterRating === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(null)}
                >
                  All Reviews
                </Button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <Button
                    key={rating}
                    variant={filterRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRating(rating)}
                  >
                    {rating} ⭐
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id} className={review.is_flagged ? "border-red-200" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{review.reviewer_name}</div>
                          <div className="text-sm text-muted-foreground">{review.service_title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                        {review.is_flagged && (
                          <Badge variant="destructive" className="text-xs">Flagged</Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{review.review_text}</p>

                    {review.response ? (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Reply className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Your Response</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.response_date!), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-blue-700">{review.response}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          Respond
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlag(review.id)}
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          {review.is_flagged ? 'Unflag' : 'Flag'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>This Month</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">+23%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Response Time</span>
                      <span className="font-medium">1.2 days avg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium">94%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Services by Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Lead Generation System</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(4.5, "w-3 h-3")}</div>
                        <span className="text-sm">12 reviews</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Marketing Automation</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(4.2, "w-3 h-3")}</div>
                        <span className="text-sm">8 reviews</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Response Modal */}
        {selectedReview && (
          <Dialog open={true} onOpenChange={() => setSelectedReview(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Respond to Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{renderStars(selectedReview.rating)}</div>
                    <span className="font-medium">{selectedReview.reviewer_name}</span>
                  </div>
                  <p className="text-sm">{selectedReview.review_text}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Your Response</label>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write a professional response..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedReview(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleResponse(selectedReview.id)}
                    disabled={!responseText.trim() || submittingResponse}
                  >
                    {submittingResponse ? "Posting..." : "Post Response"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};