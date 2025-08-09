import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface ServiceReviewsSectionProps {
  service: any;
}

export const ServiceReviewsSection = ({ service }: ServiceReviewsSectionProps) => {
  // Mock agent reviews data - this would come from the database
  const agentReviews = [
    {
      id: 1,
      agent_name: "Sarah Johnson",
      agent_title: "Senior Real Estate Agent",
      agent_location: "Austin, TX",
      rating: 5,
      review: "Outstanding service delivery. The team was professional, met all deadlines, and exceeded our expectations. Highly recommend for any serious project.",
      date: "2024-01-15",
      verified: true,
      transaction_volume: "$2.5M annually"
    },
    {
      id: 2,
      agent_name: "Michael Chen",
      agent_title: "Broker Associate",
      agent_location: "Denver, CO",
      rating: 5,
      review: "Exceptional quality and attention to detail. The communication throughout the project was excellent, and the final results were exactly what we needed.",
      date: "2024-01-10",
      verified: true,
      transaction_volume: "$3.2M annually"
    },
    {
      id: 3,
      agent_name: "Lisa Rodriguez",
      agent_title: "Team Lead",
      agent_location: "Phoenix, AZ",
      rating: 4,
      review: "Great experience working with this vendor. Professional approach and solid results. Would definitely use again for future projects.",
      date: "2024-01-05",
      verified: true,
      transaction_volume: "$1.8M annually"
    }
  ];

  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const averageRating = agentReviews.reduce((sum, review) => sum + review.rating, 0) / agentReviews.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Agent Reviews
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {renderStarRating(Math.round(averageRating))}
              <span className="ml-2 font-semibold">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">
              ({agentReviews.length} verified reviews)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {agentReviews.map((review) => (
              <div key={review.id} className="border-b border-border last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{review.agent_name}</h4>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Agent
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>{review.agent_title}</span>
                      <span>•</span>
                      <span>{review.agent_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{review.transaction_volume}</span>
                      <span>•</span>
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStarRating(review.rating)}
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">{review.review}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Review Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = agentReviews.filter(r => r.rating === rating).length;
              const percentage = (count / agentReviews.length) * 100;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};