import React, { memo, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, ArrowRight, ShoppingCart, MessageCircle, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  avg_rating: number;
  total_reviews: number;
  category: string;
  tags: string[];
  vendor_id: string;
  is_featured: boolean;
  image_url?: string;
}

interface Vendor {
  id: string;
  business_name: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
}

interface OptimizedServiceCardProps {
  service: Service;
  vendor?: Vendor;
  isSaved?: boolean;
  onSave?: (serviceId: string) => void;
  onUnsave?: (serviceId: string) => void;
  onQuickView?: (service: Service) => void;
  onAddToCart?: (service: Service) => void;
  onBookConsultation?: (service: Service) => void;
}

const OptimizedServiceCard = memo(({
  service,
  vendor,
  isSaved = false,
  onSave,
  onUnsave,
  onQuickView,
  onAddToCart,
  onBookConsultation
}: OptimizedServiceCardProps) => {
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Memoize expensive calculations
  const ratingDisplay = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(service.avg_rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  }, [service.avg_rating]);

  const priceDisplay = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(service.price);
  }, [service.price]);

  const handleSaveToggle = () => {
    if (isSaved && onUnsave) {
      onUnsave(service.id);
    } else if (!isSaved && onSave) {
      onSave(service.id);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(service);
    } else {
      addToCart({
        id: service.id,
        title: service.title,
        price: service.price,
        type: 'service'
      });
      toast({
        title: "Added to Cart",
        description: `${service.title} has been added to your cart.`
      });
    }
  };

  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView(service);
    }
  };

  const handleBookConsultation = () => {
    if (onBookConsultation) {
      onBookConsultation(service);
    }
  };

  return (
    <Card className="group h-full hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="relative">
        {service.image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={service.image_url}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
        )}
        
        {service.is_featured && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={handleSaveToggle}
        >
          <Heart 
            className={`h-4 w-4 ${
              isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
            }`} 
          />
        </Button>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {service.title}
            </h3>
            <span className="text-lg font-bold text-primary ml-2 shrink-0">
              {priceDisplay}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>

          {vendor && (
            <div className="flex items-center gap-2 mb-3">
              {vendor.avatar_url && (
                <img
                  src={vendor.avatar_url}
                  alt={vendor.business_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium">
                {vendor.business_name || vendor.display_name}
              </span>
              {vendor.is_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              {ratingDisplay}
              <span className="text-sm text-muted-foreground ml-1">
                ({service.total_reviews})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {service.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleQuickView}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBookConsultation}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedServiceCard.displayName = 'OptimizedServiceCard';

export default OptimizedServiceCard;