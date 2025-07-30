import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Star, ArrowRight, ShoppingCart, MessageCircle, Lock, Crown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ConsultationFlow } from "./ConsultationFlow";
import { ServiceFunnelModal } from "./ServiceFunnelModal";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  original_price?: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  contribution_amount: string;
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
  const [isConsultationFlowOpen, setIsConsultationFlowOpen] = useState(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isProMember = profile?.is_pro_member || false;

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(service.id);
    toast({
      title: isSaved ? "Removed from saved" : "Saved to favorites",
      description: isSaved ? "Service removed from your saved list" : "Service added to your saved list",
    });
  };

  const handleViewDetails = () => {
    setIsFunnelModalOpen(true);
    onViewDetails?.(service.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: service.id,
      title: service.title,
      price: parseFloat(service.price) || 0,
      vendor: service.vendor.name,
      image_url: service.image_url,
      requiresQuote: service.requires_quote,
      type: 'service'
    });
  };

  const handleViewDetailsButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleViewDetails();
  };

  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  return (
    <TooltipProvider>
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50 h-full flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
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

      {/* Image - Fixed height */}
      <div className="relative h-48 overflow-hidden bg-muted flex-shrink-0">
        <img
          src={service.image_url || "/public/placeholder.svg"}
          alt={service.title}
          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        {/* Title and Vendor Info - Fixed height */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground h-6 mb-3">
          <h3 className="font-semibold text-foreground leading-tight">
            {service.title.split(' - ').pop() || service.title.split(': ').pop() || service.title}
          </h3>
          {service.vendor.is_verified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>

        {/* Rating - moved above pricing */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => {
            const rating = service.vendor.rating;
            const isFullStar = i < Math.floor(rating);
            const isPartialStar = i === Math.floor(rating) && rating % 1 !== 0;
            const fillPercentage = isPartialStar ? (rating <= 4.9 ? 50 : (rating % 1) * 100) : 0;
            
            return (
              <div key={i} className="relative h-4 w-4">
                <Star className="h-4 w-4 text-gray-300 absolute" />
                {isFullStar && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 absolute" />
                )}
                {isPartialStar && (
                  <div 
                    className="overflow-hidden absolute"
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
              </div>
            );
          })}
          <span className="text-sm text-muted-foreground ml-1">
            {service.vendor.rating} ({service.vendor.review_count})
          </span>
        </div>

        {/* Description - Fixed height */}
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-3 cursor-help">
              {service.description}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3 text-sm z-50">
            <p>{service.description}</p>
          </TooltipContent>
        </Tooltip>

        {/* Tags - Fixed height */}
        <div className="h-8 mb-3">
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
        </div>

        {/* Pricing Structure - Flexible but consistent */}
        <div className="space-y-2 mb-3 flex-grow">
          {isProMember ? (
            <>
              {/* Pro Member View: Show retail with line-through, pro price as main */}
              {service.retail_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Retail Price:</span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${service.retail_price}
                  </span>
                </div>
              )}
              
              {service.pro_price && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-circle-primary">Circle Pro Price:</span>
                    <Crown className="w-4 h-4 text-circle-primary" />
                  </div>
                  <span className="text-xl font-bold text-circle-primary">
                    ${service.pro_price}
                  </span>
                </div>
              )}
              
              {service.co_pay_price && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-green-600">Your Co-Pay:</span>
                      <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center">
                        <span className="text-xs text-white">i</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${service.co_pay_price}
                    </span>
                  </div>
                  {service.discount_percentage && (
                    <div className="flex justify-end">
                      <Badge className="bg-destructive text-destructive-foreground text-xs hover:bg-green-600 hover:text-white transition-colors">
                        {service.discount_percentage}% OFF
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Non-Pro Member View: Show retail as main price, others as incentives */}
              {service.retail_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">List Price:</span>
                  <span className="text-xl font-bold text-foreground">
                    ${service.retail_price}
                  </span>
                </div>
              )}
              
              {service.pro_price && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between p-2 bg-circle-primary/5 rounded-lg border border-circle-primary/20 opacity-75 cursor-pointer">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-circle-primary" />
                        <span className="text-sm font-medium text-circle-primary">Circle Pro Price:</span>
                        <Crown className="w-4 h-4 text-circle-primary" />
                      </div>
                      <span className="text-lg font-bold text-circle-primary">
                        ${service.pro_price}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-48 p-3 cursor-pointer" onClick={handleUpgradeClick}>
                    <p className="text-sm leading-relaxed">Join Circle Pro membership to unlock this price</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to upgrade →</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {service.co_pay_price && (
                <div className="space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200 opacity-75 cursor-pointer">
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Your Co-Pay:</span>
                          <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center">
                            <span className="text-xs text-white">i</span>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          ${service.co_pay_price}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-48 p-3 cursor-pointer" onClick={handleUpgradeClick}>
                      <p className="text-sm leading-relaxed">Join Circle Pro membership to unlock this price</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to upgrade →</p>
                    </TooltipContent>
                  </Tooltip>
                  {service.discount_percentage && (
                    <div className="flex justify-end">
                      <Badge className="bg-destructive text-destructive-foreground text-xs hover:bg-green-600 hover:text-white transition-colors">
                        {service.discount_percentage}% OFF
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ROI and Duration - Fixed height */}
        <div className="h-4 mb-4">
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
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-2 mt-auto">
          <Button 
            className="flex-1"
            onClick={handleAddToCart}
          >
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleViewDetailsButton}
          >
            <ArrowRight className={`h-4 w-4 transition-transform ${
              isHovered ? "translate-x-1" : ""
            }`} />
          </Button>
        </div>
      </CardContent>
      
      
      <ServiceFunnelModal
        isOpen={isFunnelModalOpen}
        onClose={() => setIsFunnelModalOpen(false)}
        service={service}
      />
    </Card>
    </TooltipProvider>
  );
};