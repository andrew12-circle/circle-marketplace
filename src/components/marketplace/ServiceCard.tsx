import { useState, useEffect } from "react";
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
import { useServiceRatings } from "@/hooks/useServiceRatings";
import { extractAndValidatePrice, validateCartPricing, safeFormatPrice } from "@/utils/priceValidation";
import { supabase } from "@/integrations/supabase/client";
import { ConsultationFlow } from "./ConsultationFlow";
import { ServiceFunnelModal } from "./ServiceFunnelModal";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { PricingChoiceModal } from "./PricingChoiceModal";
import { DirectPurchaseModal } from "./DirectPurchaseModal";
import { Service } from "@/hooks/useMarketplaceData";

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
  const [disclaimerContent, setDisclaimerContent] = useState<any>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { profile, user } = useAuth();
  const { trackServiceView } = useServiceAnalytics();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const isProMember = profile?.is_pro_member || false;
  const { averageRating, totalReviews, loading: ratingsLoading } = useServiceRatings(service.id);

  // Fetch service-specific disclaimer or fallback to default
  useEffect(() => {
    const fetchDisclaimerContent = async () => {
      try {
        // First try to get service-specific disclaimer
        const { data: serviceData } = await supabase
          .from('services')
          .select(`
            disclaimer_id,
            respa_disclaimers (
              id,
              title,
              content,
              button_text,
              button_url,
              is_active
            )
          `)
          .eq('id', service.id)
          .maybeSingle();

        if (serviceData?.respa_disclaimers?.is_active) {
          setDisclaimerContent(serviceData.respa_disclaimers);
          return;
        }

        // Fallback to default disclaimer if no service-specific one
        const { data: defaultData } = await supabase
          .from('respa_disclaimers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (defaultData) {
          setDisclaimerContent(defaultData);
        }
      } catch (error) {
        console.error('Error fetching disclaimer:', error);
      }
    };

    fetchDisclaimerContent();
  }, [service.id]);

  // Safe price extraction with validation
  const extractNumericPrice = (priceString: string): number => {
    const validation = extractAndValidatePrice(priceString, 'retail');
    if (!validation.isValid || validation.sanitizedPrice === null) {
      console.error('Price validation failed:', priceString, validation.errors);
      return 0;
    }
    return validation.sanitizedPrice;
  };

  // Calculate dynamic discount percentage
  const calculateDiscountPercentage = (): number | null => {
    if (!service.retail_price) return null;
    
    const retailPrice = extractNumericPrice(service.retail_price);
    
    // Unverified: discount equals RESPA split limit off retail
    if (!service.is_verified && service.respa_split_limit) {
      return service.respa_split_limit;
    }
    
    // Verified: prefer potential co-pay discount if available
    if (service.copay_allowed && service.respa_split_limit) {
      if (service.pro_price) {
        const potential = extractNumericPrice(service.pro_price) * (1 - (service.respa_split_limit / 100));
        const percentage = Math.round((potential / retailPrice) * 100);
        return 100 - percentage;
      } else if (service.co_pay_price) {
        const coPayPrice = extractNumericPrice(service.co_pay_price);
        const percentage = Math.round((coPayPrice / retailPrice) * 100);
        return 100 - percentage;
      }
    }
    
    // Fallback: show Circle Pro discount only when verified
    if (service.pro_price && service.is_verified) {
      const proPrice = extractNumericPrice(service.pro_price);
      const percentage = Math.round((proPrice / retailPrice) * 100);
      return 100 - percentage;
    }
    
    return null;
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
    if (isProMember && service.is_verified && service.copay_allowed && service.retail_price && service.respa_split_limit && service.pro_price) {
      setIsPricingChoiceModalOpen(true);
      return;
    }
    
    // Otherwise proceed with direct add to cart
    addDirectlyToCart();
  };

  const addDirectlyToCart = async () => {
    // Determine price based on user's membership and available pricing
    let finalPrice = 0;
    
    if (isProMember && service.is_verified && service.pro_price) {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (disclaimerContent?.button_url) {
      navigate(disclaimerContent.button_url);
    }
  };

  return (
    <TooltipProvider>
      <div className="relative">
        <Card 
          className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border border-border/50 h-full flex flex-col cursor-pointer mobile-card touch-friendly"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleViewDetails}
        >
          {/* Top Badges */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            {service.is_verified && (
              <Badge className="bg-green-600 text-white text-xs font-medium">
                Verified
              </Badge>
            )}
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
            </div>

            {/* Service Rating - Updated to use service-specific ratings */}
            {!ratingsLoading && (
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => {
                  const isFullStar = i < Math.floor(averageRating);
                  const isPartialStar = i === Math.floor(averageRating) && averageRating % 1 !== 0;
                  const fillPercentage = isPartialStar ? (averageRating % 1) * 100 : 0;
                  
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
                  {averageRating > 0 ? `${averageRating.toFixed(1)} (${totalReviews})` : "No reviews yet"}
                </span>
                {totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    • Mixed sources
                  </span>
                )}
              </div>
            )}

            {/* Description - Fixed height */}
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-3 cursor-help">
                  {service.description}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] sm:max-w-xs md:max-w-sm p-3 text-sm bg-popover border border-border rounded-lg shadow-lg z-[60]">
                <p className="text-popover-foreground break-words">{service.description}</p>
              </TooltipContent>
            </Tooltip>

            {/* Tags - Fixed height */}
            <div className="h-8 mb-3">
              {service.tags && service.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {service.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={`${service.id}-tag-${index}`} variant="outline" className="text-xs">
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
                  {/* Pro Member View: Show retail with line-through only if verified, pro price as main */}
                  {service.retail_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Retail Price:</span>
                      <span className={`text-sm text-muted-foreground ${service.is_verified ? 'line-through' : ''}`}>
                        {formatPrice(extractNumericPrice(service.retail_price), service.price_duration || 'mo')}
                      </span>
                    </div>
                  )}
                  
                  {service.is_verified && service.pro_price && (
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
                  
                   {service.copay_allowed && service.respa_split_limit && ((service.is_verified && service.pro_price) || (!service.is_verified && service.retail_price)) && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-green-600">Potential Co-Pay:</span>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <button 
                                className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center cursor-help hover:bg-green-700 transition-colors"
                                onMouseEnter={() => setShowOverlay(true)}
                                onMouseLeave={() => setShowOverlay(false)}
                              >
                                <span className="text-xs text-white">i</span>
                              </button>
                            </TooltipTrigger>
                          </Tooltip>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(
                            (service.is_verified 
                              ? extractNumericPrice(service.pro_price!) 
                              : extractNumericPrice(service.retail_price!)
                            ) * (1 - (service.respa_split_limit / 100)), 
                            service.price_duration || 'mo'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-end">
                         <Badge className="bg-green-600 text-white text-xs">
                           {service.respa_split_limit}% vendor support
                         </Badge>
                      </div>
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
                  
                  {service.is_verified && service.pro_price && (
                    <div className="space-y-1">
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
                        <TooltipContent className="w-40 sm:w-48 p-3 cursor-pointer" onClick={handleUpgradeClick}>
                          <p className="text-sm leading-relaxed">Join Circle Pro membership to unlock this price</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to upgrade →</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  
                   {service.copay_allowed && service.respa_split_limit && ((service.is_verified && service.pro_price) || (!service.is_verified && service.retail_price)) && (
                    <div className="space-y-1">
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200 opacity-75 cursor-pointer hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Potential Co-Pay:</span>
                              <button 
                                className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center cursor-help hover:bg-green-700 transition-colors"
                                onMouseEnter={() => setShowOverlay(true)}
                                onMouseLeave={() => setShowOverlay(false)}
                              >
                                <span className="text-xs text-white">i</span>
                              </button>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              {formatPrice(
                                (service.is_verified 
                                  ? extractNumericPrice(service.pro_price!) 
                                  : extractNumericPrice(service.retail_price!)
                                ) * (1 - (service.respa_split_limit / 100)), 
                                service.price_duration || 'mo'
                              )}
                            </span>
                          </div>
                        </TooltipTrigger>
                      </Tooltip>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Single discount badge for both Pro and Non-Pro views */}
            {calculateDiscountPercentage() && (
              <div className="flex justify-end mb-3">
                <Badge className="bg-destructive text-destructive-foreground text-xs hover:bg-green-600 hover:text-white transition-colors">
                  {calculateDiscountPercentage()}% OFF
                </Badge>
              </div>
            )}

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
          
          {/* Full Card Overlay for Disclaimer */}
          {showOverlay && disclaimerContent && (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg shadow-xl z-50 flex flex-col p-4 cursor-pointer"
              onClick={handleOverlayClick}
              onMouseEnter={() => setShowOverlay(true)}
              onMouseLeave={() => setShowOverlay(false)}
            >
              {/* Card design elements */}
              <div className="absolute top-3 left-3 w-6 h-6 border border-yellow-700/30 rounded-sm"></div>
              <div className="absolute top-3 right-3 text-yellow-800 font-bold text-lg">PRO</div>
              
              {/* Main content */}
              <div className="flex-1 flex flex-col justify-center mt-8">
                <h3 className="text-yellow-900 font-bold text-xl mb-2">{disclaimerContent.title}</h3>
                <p className="text-yellow-900 text-sm leading-relaxed mb-4 flex-1 overflow-y-auto">
                  {disclaimerContent.content}
                </p>
                
                <button className="text-yellow-800 text-sm font-medium hover:text-yellow-900 underline self-start">
                  {disclaimerContent.button_text}
                </button>
              </div>
            </div>
          )}
        </Card>
        
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
            id: service.id,
            title: service.title,
            co_pay_price: service.co_pay_price,
            respa_split_limit: service.respa_split_limit,
          }}
        />

        <PricingChoiceModal
          isOpen={isPricingChoiceModalOpen}
          onClose={() => setIsPricingChoiceModalOpen(false)}
          service={{
            id: service.id,
            title: service.title,
            pro_price: service.pro_price,
            retail_price: service.retail_price,
            respa_split_limit: service.respa_split_limit || 0,
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
          onChooseAgentPoints={async () => {
            setIsPricingChoiceModalOpen(false);
            
            try {
              // Call the agent points purchase edge function
              const { data, error } = await supabase.functions.invoke('process-agent-points-purchase', {
                body: {
                  service_id: service.id,
                  agent_id: user?.id,
                  vendor_id: service.vendor?.id,
                  total_amount: parseFloat(service.pro_price?.replace(/[^\d.]/g, '') || '0')
                }
              });

              if (error) {
                throw error;
              }

              if (data.success) {
                toast({
                  title: "Purchase Successful! 🎉",
                  description: `Purchased ${service.title} using ${data.respa_compliance.respa_points_used + data.respa_compliance.non_respa_points_used} agent points`,
                });
                
                // Show RESPA compliance details if relevant
                if (data.respa_compliance.respa_points_used > 0) {
                  toast({
                    title: "RESPA Compliance Applied",
                    description: `RESPA points: ${data.respa_compliance.respa_points_used}, Non-RESPA: ${data.respa_compliance.non_respa_points_used}`,
                    variant: "default",
                  });
                }
              } else {
                throw new Error(data.error || 'Purchase failed');
              }
            } catch (error) {
              console.error('Agent points purchase error:', error);
              toast({
                title: "Purchase Failed",
                description: error.message || "Failed to complete purchase with agent points",
                variant: "destructive",
              });
              
              // Fallback: add to cart for manual processing
              addToCart({
                id: service.id,
                title: service.title,
                price: parseFloat(service.pro_price?.replace(/[^\d.]/g, '') || '0'),
                image_url: service.image_url,
                vendor: service.vendor?.name || 'Unknown Vendor',
                type: 'service',
                description: `Agent points purchase failed - ${error.message}`,
              });
            }
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
      </div>
    </TooltipProvider>
  );
};
