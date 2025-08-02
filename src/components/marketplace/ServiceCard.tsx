import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Star, ArrowRight, ShoppingCart, MessageCircle, Lock, Crown, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useServiceAnalytics } from "@/hooks/useServiceAnalytics";
import { useCurrency } from "@/hooks/useCurrency";
import { extractAndValidatePrice, validateCartPricing, safeFormatPrice } from "@/utils/priceValidation";
import { ConsultationFlow } from "./ConsultationFlow";
import { ServiceFunnelModal } from "./ServiceFunnelModal";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { PricingChoiceModal } from "./PricingChoiceModal";
import { DirectPurchaseModal } from "./DirectPurchaseModal";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  price_duration?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  // Direct purchase feature - vendor controlled
  direct_purchase_enabled?: boolean;
  // Co-pay related fields
  co_pay_allowed?: boolean;
  max_vendor_split_percentage?: number;
  estimated_agent_split_percentage?: number;
  respa_category?: string;
  respa_notes?: string;
  vendor: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  } | null;
}

interface ServiceCardProps {
  service: Service;
  onSave?: (serviceId: string) => void;
  onViewDetails?: (serviceId: string) => void;
  isSaved?: boolean;
}

export const ServiceCard = ({ service, onSave, onViewDetails, isSaved = false }: ServiceCardProps) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isConsultationFlowOpen, setIsConsultationFlowOpen] = useState(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [isVendorSelectionModalOpen, setIsVendorSelectionModalOpen] = useState(false);
  const [isPricingChoiceModalOpen, setIsPricingChoiceModalOpen] = useState(false);
  const [isDirectPurchaseModalOpen, setIsDirectPurchaseModalOpen] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const { trackServiceView } = useServiceAnalytics();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const isProMember = profile?.is_pro_member || false;

  // Safe price extraction with validation
  const extractNumericPrice = (priceString: string): number => {
    const validation = extractAndValidatePrice(priceString, 'retail');
    if (!validation.isValid || validation.sanitizedPrice === null) {
      console.error('Price validation failed:', priceString, validation.errors);
      return 0;
    }
    return validation.sanitizedPrice;
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(service.id);
    toast({
      title: isSaved ? "Removed from saved" : "Saved to favorites",
      description: isSaved ? "Service removed from your saved list" : "Service added to your saved list",
    });
  };

  const handleViewDetails = async () => {
    console.log('handleViewDetails called - modal states:', { isVendorSelectionModalOpen, isPricingChoiceModalOpen, isFunnelModalOpen, isClosingModal });
    // Don't open if other modals are already open OR if we're in the middle of closing
    if (isVendorSelectionModalOpen || isPricingChoiceModalOpen || isFunnelModalOpen || isClosingModal) {
      console.log('Blocked - modal already open or closing');
      return;
    }
    // Track the service view
    await trackServiceView(service.id);
    console.log('Setting funnel modal to true');
    setIsFunnelModalOpen(true);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If pro member and co-pay is available, show choice modal
    if (isProMember && service.co_pay_allowed && service.retail_price && service.max_vendor_split_percentage && service.pro_price) {
      setIsPricingChoiceModalOpen(true);
      return;
    }
    
    // Otherwise proceed with direct add to cart
    addDirectlyToCart();
  };

  const addDirectlyToCart = async () => {
    // Determine price based on user's membership and available pricing
    let finalPrice = 0;
    
    if (isProMember && service.pro_price) {
      finalPrice = extractNumericPrice(service.pro_price);
    } else if (service.retail_price) {
      finalPrice = extractNumericPrice(service.retail_price);
    }
    
    // Critical: Validate pricing integrity before adding to cart
    if (finalPrice === 0) {
      toast({
        title: "Pricing Error",
        description: "Unable to determine valid price. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Track the service view
    await trackServiceView(service.id);

    // Server-side price validation
    const isPriceValid = await validateCartPricing(service.id, finalPrice);
    if (!isPriceValid) {
      toast({
        title: "Price Validation Failed",
        description: "Price mismatch detected. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    addToCart({
      id: service.id,
      title: service.title,
      price: finalPrice,
      vendor: service.vendor?.name || 'Unknown Vendor',
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
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50 h-full flex flex-col cursor-pointer mobile-card touch-friendly"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {service.is_featured && (
          <Badge className="bg-circle-primary text-primary-foreground text-xs font-medium">
            {t('featured')}
          </Badge>
        )}
        {service.is_top_pick && (
          <Badge className="bg-circle-accent text-foreground text-xs font-medium">
            {t('topPick')}
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
      <div className="relative h-48 overflow-hidden bg-white flex-shrink-0 p-4">
        <img
          src={service.image_url || "/public/placeholder.svg"}
          alt={service.title}
          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-4 flex flex-col flex-grow mobile-card-content">
        {/* Title and Vendor Info - Fixed height */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground h-6 mb-3">
          <h3 className="font-semibold text-foreground leading-tight mobile-title">
            {service.title.split(' - ').pop() || service.title.split(': ').pop() || service.title}
          </h3>
          {service.vendor?.is_verified && (
            <Badge variant="secondary" className="text-xs">
              {t('verified')}
            </Badge>
          )}
        </div>

        {/* Rating - moved above pricing */}
        {service.vendor && (
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
        )}

        {/* Description - Fixed height */}
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-3 cursor-help">
              {service.description}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3 text-sm bg-popover border border-border rounded-lg shadow-lg z-[60]">
            <p className="text-popover-foreground">{service.description}</p>
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
                    {formatPrice(extractNumericPrice(service.retail_price), service.price_duration || 'mo')}
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
                    {formatPrice(extractNumericPrice(service.pro_price), service.price_duration || 'mo')}
                  </span>
                </div>
              )}
              
              {service.co_pay_allowed && service.retail_price && service.max_vendor_split_percentage && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-green-600">Your Co-Pay:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center cursor-help">
                            <span className="text-xs text-white">i</span>
                          </div>
                        </TooltipTrigger>
                         <TooltipContent className="w-80 p-0 border-0 bg-transparent cursor-pointer" onClick={handleUpgradeClick}>
                           <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg p-4 shadow-lg">
                             {/* Card design elements */}
                             <div className="absolute top-2 left-2 w-6 h-6 border border-yellow-700/30 rounded-sm"></div>
                             <div className="absolute top-2 right-2 text-yellow-800 font-bold text-lg">PRO</div>
                             
                             {/* Main content */}
                             <div className="mt-6">
                               <h3 className="text-yellow-900 font-bold text-lg mb-1">Circle COVERAGE</h3>
                               <h4 className="text-yellow-800 font-semibold text-base mb-3">Compliant Advertising Partnerships</h4>
                               <p className="text-yellow-900 text-sm leading-relaxed mb-3">
                                 Find lenders and title companies & more interested in sharing the cost of public advertising campaigns. Each party pays their proportional share and receives proportional benefit in all advertising materials.
                               </p>
                               
                               <p className="text-yellow-900 text-xs leading-relaxed mb-3">
                                 This feature facilitates introductions for RESPA-compliant marketing partnerships only. Federal law prohibits cost-sharing arrangements for lead generation tools or business platforms.
                               </p>
                               
                               <button className="text-yellow-800 text-sm font-medium hover:text-yellow-900 underline">
                                 Learn more
                               </button>
                             </div>
                           </div>
                         </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(
                        extractNumericPrice(service.retail_price) * (1 - (service.max_vendor_split_percentage / 100)), 
                        service.price_duration || 'mo'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-end">
                     <Badge className="bg-green-600 text-white text-xs">
                       {service.max_vendor_split_percentage}% vendor support
                     </Badge>
                  </div>
                </div>
              )}
              
              {/* Show discount badge for pro members */}
              {service.discount_percentage && (
                <div className="flex justify-end">
                   <Badge className="bg-destructive text-destructive-foreground text-xs hover:bg-green-600 hover:text-white transition-colors">
                     {service.discount_percentage?.replace('%', '')}% OFF
                   </Badge>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Non-Pro Member View: Show retail as main price, others as incentives */}
              {service.retail_price && (
        <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">List Price:</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(extractNumericPrice(service.retail_price), service.price_duration || 'mo')}
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
                        {formatPrice(extractNumericPrice(service.pro_price), service.price_duration || 'mo')}
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
                          {formatPrice(extractNumericPrice(service.co_pay_price), service.price_duration || 'mo')}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-80 p-0 border-0 bg-transparent cursor-pointer" onClick={handleUpgradeClick}>
                      <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg p-4 shadow-lg">
                        {/* Card design elements */}
                        <div className="absolute top-2 left-2 w-6 h-6 border border-yellow-700/30 rounded-sm"></div>
                        <div className="absolute top-2 right-2 text-yellow-800 font-bold text-lg">PRO</div>
                        
                        {/* Main content */}
                        <div className="mt-6">
                          <h3 className="text-yellow-900 font-bold text-lg mb-1">Circle COVERAGE</h3>
                          <h4 className="text-yellow-800 font-semibold text-base mb-3">Compliant Advertising Partnerships</h4>
                          <p className="text-yellow-900 text-sm leading-relaxed mb-3">
                            Find lenders and title companies & more interested in sharing the cost of public advertising campaigns. Each party pays their proportional share and receives proportional benefit in all advertising materials.
                          </p>
                          
                          <p className="text-yellow-900 text-xs leading-relaxed mb-3">
                            This feature facilitates introductions for RESPA-compliant marketing partnerships only. Federal law prohibits cost-sharing arrangements for lead generation tools or business platforms.
                          </p>
                          
                          <button className="text-yellow-800 text-sm font-medium hover:text-yellow-900 underline">
                            Learn more
                          </button>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  {service.discount_percentage && (
                    <div className="flex justify-end">
                       <Badge className="bg-destructive text-destructive-foreground text-xs hover:bg-green-600 hover:text-white transition-colors">
                         {service.discount_percentage?.replace('%', '')}% OFF
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
          {service.requires_quote ? (
            <Button
              variant="outline" 
              size="sm"
              className="flex-1 h-9"
              onClick={(e) => {
                e.stopPropagation();
                setIsConsultationFlowOpen(true);
              }}
            >
              <Calendar className="w-4 h-4 mr-1" />
              {t('bookConsultation')}
            </Button>
          ) : (
            <>
              {/* Primary action - Consultation (traditional flow) */}
              <Button
                size="sm"
                className="flex-1 h-9"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConsultationFlowOpen(true);
                }}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Book Consultation
              </Button>
              
              {/* Add to Cart Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add to Cart
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-3"
            onClick={handleViewDetailsButton}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
      
      
      <ServiceFunnelModal
        isOpen={isFunnelModalOpen}
        onClose={() => {
          console.log('ServiceFunnelModal onClose called');
          setIsClosingModal(true);
          setIsFunnelModalOpen(false);
          // Clear the closing flag after a brief delay to prevent immediate reopening
          setTimeout(() => setIsClosingModal(false), 100);
        }}
        service={service}
      />
      
      <VendorSelectionModal
        isOpen={isVendorSelectionModalOpen}
        onClose={() => setIsVendorSelectionModalOpen(false)}
        onVendorSelect={(vendor) => {
          // Handle vendor selection logic here
          console.log('Selected vendor:', vendor);
        }}
        service={{
          title: service.title,
          co_pay_price: service.co_pay_price,
          max_vendor_split_percentage: service.max_vendor_split_percentage,
        }}
      />

      <PricingChoiceModal
        isOpen={isPricingChoiceModalOpen}
        onClose={() => setIsPricingChoiceModalOpen(false)}
        service={{
          title: service.title,
          pro_price: service.pro_price,
          retail_price: service.retail_price,
          max_vendor_split_percentage: service.max_vendor_split_percentage,
          price_duration: service.price_duration,
          requires_quote: service.requires_quote,
        }}
        onChooseProPrice={() => {
          setIsPricingChoiceModalOpen(false);
          addDirectlyToCart();
        }}
        onChooseCoPay={() => {
          setIsPricingChoiceModalOpen(false);
          setIsVendorSelectionModalOpen(true);
        }}
      />

      <DirectPurchaseModal
        isOpen={isDirectPurchaseModalOpen}
        onClose={() => setIsDirectPurchaseModalOpen(false)}
        service={service}
        onPurchaseComplete={() => {
          // After successful purchase, redirect to onboarding booking
          toast({
            title: "Purchase successful!",
            description: "You'll now be redirected to book your onboarding session.",
          });
          // Optional: Open consultation flow for onboarding booking
          setIsConsultationFlowOpen(true);
        }}
      />

      <ConsultationFlow
        isOpen={isConsultationFlowOpen}
        onClose={() => setIsConsultationFlowOpen(false)}
        service={service}
      />
    </Card>
    </TooltipProvider>
  );
};