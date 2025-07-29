import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, ArrowRight, ShoppingCart, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  contribution_amount: number;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean; // New field to indicate if item needs custom quote
  vendor: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  };
}

interface ServiceCardProps {
  service: Service;
  onSave?: (serviceId: string) => void;
  onViewDetails?: (serviceId: string) => void;
  isSaved?: boolean;
}

export const ServiceCard = ({ service, onSave, onViewDetails, isSaved = false }: ServiceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleSave = () => {
    onSave?.(service.id);
    toast({
      title: isSaved ? "Removed from saved" : "Saved to favorites",
      description: isSaved ? "Service removed from your saved list" : "Service added to your saved list",
    });
  };

  const handleViewDetails = () => {
    onViewDetails?.(service.id);
  };

  const handleAddToCart = () => {
    addToCart({
      serviceId: service.id,
      title: service.title,
      price: service.price,
      vendor: service.vendor.name,
      image_url: service.image_url,
      requiresQuote: service.requires_quote,
    });
  };

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {service.is_featured && (
          <Badge className="bg-circle-primary text-primary-foreground text-xs font-medium">
            Featured
          </Badge>
        )}
        {service.is_top_pick && (
          <Badge className="bg-circle-accent text-foreground text-xs font-medium">
            Top Pick
          </Badge>
        )}
      </div>

      {/* Save Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
        onClick={handleSave}
      >
        <Heart 
          className={`h-4 w-4 transition-colors ${
            isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }`} 
        />
      </Button>

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={service.image_url || "/public/placeholder.svg"}
          alt={service.title}
          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        />
        {service.discount_percentage && (
          <Badge className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground">
            {service.discount_percentage}% OFF
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Vendor Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{service.vendor.name}</span>
          {service.vendor.is_verified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">
              {service.vendor.rating} ({service.vendor.review_count})
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {service.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{service.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and Details */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-circle-primary">
              ${service.price}
            </span>
            {service.original_price && service.original_price > service.price && (
              <span className="text-sm text-muted-foreground line-through">
                ${service.original_price}
              </span>
            )}
          </div>
          {service.contribution_amount > 0 && (
            <Badge variant="secondary" className="text-xs">
              +${service.contribution_amount} contribution
            </Badge>
          )}
        </div>

        {/* ROI and Duration */}
        {(service.estimated_roi || service.duration) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {service.estimated_roi && (
              <span>Est. ROI: {service.estimated_roi}x</span>
            )}
            {service.duration && (
              <span>{service.duration}</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {service.requires_quote ? (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Request Quote
            </Button>
          ) : (
            <Button 
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={handleViewDetails}
          >
            <ArrowRight className={`h-4 w-4 transition-transform ${
              isHovered ? "translate-x-1" : ""
            }`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};