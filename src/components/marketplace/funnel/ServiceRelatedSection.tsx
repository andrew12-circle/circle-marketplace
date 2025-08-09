import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight } from "lucide-react";

interface ServiceRelatedSectionProps {
  vendor: any;
  currentServiceId: string;
}

export const ServiceRelatedSection = ({ vendor, currentServiceId }: ServiceRelatedSectionProps) => {
  // Mock related services data - this would come from the database
  const relatedServices = [
    {
      id: "service-2",
      title: "Advanced Marketing Analytics",
      description: "Comprehensive analytics and reporting for your marketing campaigns",
      price: "$299",
      rating: 4.9,
      reviews: 45,
      category: "Marketing",
      is_featured: true
    },
    {
      id: "service-3",
      title: "Social Media Management",
      description: "Full-service social media strategy and content creation",
      price: "$199",
      rating: 4.7,
      reviews: 32,
      category: "Social Media",
      is_featured: false
    },
    {
      id: "service-4",
      title: "Website Optimization",
      description: "Improve your website's performance and conversion rates",
      price: "$399",
      rating: 4.8,
      reviews: 28,
      category: "Web Development",
      is_featured: true
    }
  ];

  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  // Filter out current service
  const filteredServices = relatedServices.filter(service => service.id !== currentServiceId);

  if (filteredServices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            More Services from {vendor?.business_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Service Header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant={service.is_featured ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {service.category}
                        </Badge>
                        {service.is_featured && (
                          <Badge variant="destructive" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStarRating(service.rating)}
                      </div>
                      <span className="text-sm font-medium">{service.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({service.reviews} reviews)
                      </span>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-foreground">
                          {service.price}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          per service
                        </span>
                      </div>
                      <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View All Services Button */}
          <div className="mt-6 text-center">
            <Button variant="outline" className="gap-2">
              View All Services from {vendor?.business_name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Contact Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {vendor?.logo_url && (
              <img 
                src={vendor.logo_url} 
                alt={vendor.business_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{vendor?.business_name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {vendor?.business_description || "Professional service provider with years of experience"}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {vendor?.location || "Multiple Locations"}
                </Badge>
                {vendor?.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified Provider
                  </Badge>
                )}
              </div>
            </div>
            <Button>
              Contact Vendor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};