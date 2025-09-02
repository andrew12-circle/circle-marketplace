// @ts-nocheck
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Star, ArrowRight, ShoppingCart, MessageCircle, Lock, Crown, Calendar, Users, Share2, Info, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useServiceViewTracker } from "@/hooks/useServiceViewTracker";
import { useCurrency } from "@/hooks/useCurrency";
import { useServiceRatings } from "@/hooks/useServiceRatings";
import { useDemandSignals } from "@/hooks/useDemandSignals";
import { extractAndValidatePrice, validateCartPricing, safeFormatPrice } from "@/utils/priceValidation";
import { supabase } from "@/integrations/supabase/client";
import { ConsultationFlow } from "./ConsultationFlow";
import { ServiceFunnelModal } from "./ServiceFunnelModal";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { PaymentChoiceModal } from "./PaymentChoiceModal";
import { DirectPurchaseModal } from "./DirectPurchaseModal";
import { Service } from "@/hooks/useMarketplaceData";
import { useActiveDisclaimer } from "@/hooks/useActiveDisclaimer";
import { useServiceRatingFromBulk } from "@/hooks/useBulkServiceRatings";
import { useProviderTracking } from "@/hooks/useProviderTracking";
import { ToastAction } from "@/components/ui/toast";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useABTest } from "@/hooks/useABTest";
import { SponsoredLabel } from "./SponsoredLabel";
import { ServiceBadges } from "./ServiceBadges";
import { extractNumericPrice, computeDiscountPercentage, getDealDisplayPrice } from '@/utils/dealPricing';
import { useSponsoredTracking } from '@/hooks/useSponsoredTracking';

interface ServiceRatingStats {
  averageRating: number;
  totalReviews: number;
}

interface ServiceCardProps {
  service: Service;
  onSave?: (serviceId: string) => void;
  onViewDetails?: (serviceId: string) => void;
  isSaved?: boolean;
  bulkRatings?: Map<string, ServiceRatingStats>;
  variant?: 'default' | 'compact';
  onView?: () => void;
  showBundlePrice?: boolean;
}

export const ServiceCard = ({ 
  service, 
  onSave, 
  onViewDetails, 
  isSaved = false, 
  bulkRatings,
  variant = 'default',
  onView,
  showBundlePrice = true
}: ServiceCardProps) => {
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { profile, user } = useAuth();
  const { trackView } = useServiceViewTracker(service.id);
  const { trackEvent } = useProviderTracking(service.id, true, false);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const isProMember = profile?.is_pro_member || false;
  const { trackClick } = useSponsoredTracking();
  
  // Demand signals for discount interest
  const demandSignals = useDemandSignals(service.id);
  const showDiscountPending = !service.pro_price || !service.is_verified;
  
  // Sponsored placement features - enabled by default for Amazon-level experience
  const sponsoredEnabled = true;
  const sponsoredBadges = true;
  const showSponsored = sponsoredEnabled && sponsoredBadges;
  const isSponsored = showSponsored && (service as any).is_sponsored;
  
  // Use bulk ratings data if available, otherwise fallback to individual fetch
  const bulkRatingData = useServiceRatingFromBulk(service.id, bulkRatings);
  const { averageRating: individualRating, totalReviews: individualReviews, loading: ratingsLoading } = useServiceRatings(service.id);
  
  // Prefer bulk data when available
  const averageRating = bulkRatings ? bulkRatingData.averageRating : individualRating;
  const totalReviews = bulkRatings ? bulkRatingData.totalReviews : individualReviews;
  const shouldShowRating = !ratingsLoading || bulkRatings;
  
  const { disclaimer: activeDisclaimer } = useActiveDisclaimer();

  const ensureDisclaimerLoaded = async () => {
    if (disclaimerContent) return;

    try {
      // Try service-specific disclaimer first
      const { data: serviceData, error: svcErr } = await supabase
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

      if (!svcErr && serviceData?.respa_disclaimers?.is_active) {
        setDisclaimerContent(serviceData.respa_disclaimers);
        return;
      }

      // Fallback to the cached active disclaimer (shared)
      if (activeDisclaimer) {
        setDisclaimerContent(activeDisclaimer);
      }
    } catch (error) {
      console.error('Error loading disclaimer (lazy):', error);
    }
  };

  // Calculate dynamic discount percentage using shared logic
  const calculateDiscountPercentage = (): number | null => {
    return computeDiscountPercentage(service);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in to save",
        description: "Sign in or create a free account to save favorites.",
        action: (
          <ToastAction altText="Go to sign in" onClick={() => navigate('/auth')}>
            Sign in / Create account
          </ToastAction>
        ),
      });
      return;
    }

    onSave?.(service.id);
    toast({
      title: isSaved ? "Removed from saved" : "Saved to favorites",
      description: isSaved ? "Service removed from your saved list" : "Service added to your saved list",
    });
  };

  const handleViewDetails = () => {
    console.log('handleViewDetails called - modal states:', { isVendorSelectionModalOpen, isPricingChoiceModalOpen, isFunnelModalOpen, isClosingModal });
    // Don't open if other modals are already open OR if we're in the middle of closing
    if (isVendorSelectionModalOpen || isPricingChoiceModalOpen || isFunnelModalOpen || isClosingModal) {
      console.log('Blocked - modal already open or closing');
      return;
    }

    // Open immediately for snappy UX; do not block on analytics
    console.log('Setting funnel modal to true');
    setIsFunnelModalOpen(true);

    // Fire-and-forget tracking
    Promise.allSettled([
      trackEvent({
        event_type: 'click',
        event_data: { context: 'service_card', action: 'open_funnel' }
      } as any),
      trackView()
    ]).catch((err) => console.error('Non-blocking tracking error:', err));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Always show payment choice modal first - this is the unified flow
    setIsPricingChoiceModalOpen(true);
  };

  const addDirectlyToCart = async (coverageType?: 'pro' | 'copay', selectedVendor?: any) => {
    // Determine price based on coverage type and user's membership
    let finalPrice = 0;
    
    if (coverageType === 'copay' && service.co_pay_price) {
      finalPrice = extractNumericPrice(service.co_pay_price);
    } else if (isProMember && service.is_verified && service.pro_price) {
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

    // Track the service view and store in localStorage for Recently Viewed
    await trackView();
    
    // Store in localStorage for Recently Viewed component
    try {
      const recentlyViewed = JSON.parse(localStorage.getItem('circle-recently-viewed') || '[]');
      const viewData = {
        serviceId: service.id,
        viewedAt: Date.now(),
        title: service.title
      };
      
      // Remove duplicates and add to beginning
      const filtered = recentlyViewed.filter((item: any) => item.serviceId !== service.id);
      const updated = [viewData, ...filtered].slice(0, 20);
      
      localStorage.setItem('circle-recently-viewed', JSON.stringify(updated));
    } catch (error) {
      console.error('Error storing recently viewed:', error);
    }

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
      type: 'service',
      coverageType,
      selectedVendor,
      affiliateUrl: service.website_url,
      requiresConsultation: service.requires_quote,
      coverageStatus: 'pending-selection'
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

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!service.website_url) return;
    
    // Track sponsored click if applicable
    if (isSponsored) {
      await trackClick({
        serviceId: service.id,
        placement: 'search_grid',
        context: 'buy_now_button'
      });
    }
    
    // Add UTM parameters for tracking
    const url = new URL(service.website_url);
    url.searchParams.set('utm_source', 'circle_marketplace');
    url.searchParams.set('utm_medium', 'service_card');
    url.searchParams.set('utm_campaign', 'buy_now');
    url.searchParams.set('utm_content', service.id);
    
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  // Share functionality
  const buildShareUrl = () => {
    const baseUrl = window.location.origin;
    const url = new URL(`${baseUrl}/marketplace`);
    url.searchParams.set('service', service.id);
    url.searchParams.set('view', 'funnel');
    url.searchParams.set('utm_source', 'circle_marketplace');
    url.searchParams.set('utm_medium', 'share');
    url.searchParams.set('utm_campaign', 'deal_share');
    if (user?.id) {
      url.searchParams.set('ref', user.id);
    }
    return url.toString();
  };

  const buildShareMessage = () => {
    const dealInfo = getDealDisplayPrice(service);
    const shareUrl = buildShareUrl();
    
    return `Check out this deal: ${service.title} - ${formatPrice(dealInfo.price)} ${dealInfo.label}${service.description ? `\n\n${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}` : ''}\n\n${shareUrl}`;
  };

  const getSmsHref = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    // iOS uses different SMS URL format than Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS ? `sms:&body=${encodedMessage}` : `sms:?body=${encodedMessage}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = buildShareUrl();
    const shareMessage = buildShareMessage();
    
    // Track share event
    trackEvent({
      event_type: 'share',
      event_data: { 
        context: 'service_card', 
        service_id: service.id,
        method: 'button_click'
      }
    } as any);

    // Use native share if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Circle Marketplace - ${service.title}`,
          text: shareMessage,
          url: shareUrl,
        });
        
        trackEvent({
          event_type: 'share_completed',
          event_data: { 
            context: 'service_card', 
            service_id: service.id,
            method: 'native_share'
          }
        } as any);
        
        return;
      } catch (error) {
        // User cancelled or error occurred, fall through to manual options
      }
    }

    // Open popover for desktop share options
    setIsSharePopoverOpen(true);
  };

  const handleShareOption = async (method: 'sms' | 'email' | 'copy') => {
    const shareUrl = buildShareUrl();
    const shareMessage = buildShareMessage();
    
    trackEvent({
      event_type: 'share_completed',
      event_data: { 
        context: 'service_card', 
        service_id: service.id,
        method
      }
    } as any);

    switch (method) {
      case 'sms':
        window.open(getSmsHref(shareMessage), '_self');
        break;
      case 'email':
        const emailSubject = encodeURIComponent(`Circle Marketplace Deal: ${service.title}`);
        const emailBody = encodeURIComponent(shareMessage);
        window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_self');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copied!",
            description: "Deal link has been copied to your clipboard.",
          });
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          toast({
            title: "Link copied!",
            description: "Deal link has been copied to your clipboard.",
          });
        }
        break;
    }
    
    setIsSharePopoverOpen(false);
  };

  const discountPercentage = calculateDiscountPercentage();

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
            {/* Removed duplicate badges - ServiceBadges component will handle these */}
          </div>


          {/* Header with profile picture and title */}
          <div className="p-4 pb-2 flex items-start gap-2">
            {service.profile_image_url ? (
              <img 
                src={service.profile_image_url} 
                alt={service.vendor?.name || service.title}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">
                  {service.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground leading-tight text-base line-clamp-2 mb-1">
                {service.title.split(' - ').pop() || service.title.split(': ').pop() || service.title}
              </h3>
              {/* Sponsored label right underneath the name, like Facebook */}
              {isSponsored && (
                <div className="mb-1">
                  <SponsoredLabel variant="minimal" />
                </div>
              )}
            </div>
          </div>

          {/* Save and Share Buttons */}
          <div className="absolute top-3 right-3 z-10 flex gap-1">
            <Popover open={isSharePopoverOpen} onOpenChange={setIsSharePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShareOption('sms')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Text Message
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShareOption('email')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShareOption('copy')}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleSave}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`} 
              />
            </Button>
          </div>

          {/* Description with dynamic height for expansion */}
          <div className={`px-4 pt-1 pb-2 flex flex-col transition-all duration-300 ${isDescriptionExpanded ? 'h-auto' : 'h-20'}`}>
            <p className={`text-sm text-muted-foreground leading-tight transition-all duration-300 ${isDescriptionExpanded ? 'overflow-visible' : 'line-clamp-2 overflow-hidden'}`}>
              {service.description}
            </p>
            {service.description && service.description.length > 100 && (
              <button
                className="text-sm text-primary hover:text-primary/80 font-medium mt-1 transition-colors self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Expand button clicked, current state:', isDescriptionExpanded);
                  setIsDescriptionExpanded(!isDescriptionExpanded);
                }}
              >
                {isDescriptionExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>

          {/* Image - 2:1 Landscape */}
          <div className="relative aspect-[2/1] overflow-hidden bg-white flex-shrink-0 p-4">
            <img
              src={service.image_url || "/lovable-uploads/placeholder.svg"}
              alt={service.title}
              className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <CardContent className="p-4 flex flex-col justify-between h-full mobile-card-content">
            {/* Service Badges - Rich visual indicators */}
            <div className="h-8 mb-3">
              <ServiceBadges 
                service={service}
                variant="compact"
                maxBadges={2}
                className="mb-2"
              />
              
            </div>

            {/* Mobile-Optimized Pricing for Launch */}
            <div className="space-y-3 mb-3 mt-6">
              {isProMember ? (
                <>
                  {/* Pro Member View: Show pro price prominently or discount pending */}
                  {showDiscountPending ? (
                    <div className="text-center space-y-3">
                      {/* Discount Pending Status */}
                      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
                        <span>Discount Pending</span>
                      </div>
                      
                      {/* Interest CTA */}
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            demandSignals.likeService();
                          }}
                          disabled={demandSignals.hasLiked}
                        >
                          <ThumbsUp className={`w-4 h-4 mr-2 ${demandSignals.hasLiked ? 'fill-current' : ''}`} />
                          {demandSignals.hasLiked ? "Thanks! We'll keep you posted" : "I'd use this with a discount"}
                        </Button>
                        
                        {/* Social proof counter */}
                        {demandSignals.totalLikes > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {demandSignals.totalLikes} agent{demandSignals.totalLikes === 1 ? '' : 's'} interested
                          </div>
                        )}
                        
                        {/* Tooltip info */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="w-3 h-3" />
                              How this works
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="w-64 p-3">
                            <p className="text-sm leading-relaxed">
                              Vendors unlock Pro discounts when enough agents show interest. Every like notifies the vendor and increases the chance of Circle securing a discount.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Show retail price as fallback */}
                      {service.retail_price && (
                        <div className="text-xl font-bold text-foreground">
                          {formatPrice(extractNumericPrice(service.retail_price), service.price_duration || 'mo')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      {service.is_verified && service.pro_price ? (
                        <>
                          {service.retail_price && (
                            <div className="text-xs text-muted-foreground mb-1">
                              <span className="line-through">
                                Retail: {formatPrice(extractNumericPrice(service.retail_price), service.price_duration || 'mo')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-2 text-xl font-bold text-blue-600">
                            <Crown className="w-4 h-4" />
                            <span>{formatPrice(extractNumericPrice(service.pro_price), service.price_duration || 'mo')}</span>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Circle Pro Price</div>
                        </>
                      ) : (
                        <div className="text-xl font-bold text-foreground">
                          {formatPrice(extractNumericPrice(service.retail_price || '0'), service.price_duration || 'mo')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Co-Pay Section - Mobile Optimized */}
                  {service.copay_allowed && service.respa_split_limit && ((service.is_verified && service.pro_price) || (!service.is_verified && service.retail_price)) && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700 mb-1">
                          <span>Co-Pay Available</span>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <button 
                                className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center cursor-help hover:bg-green-700 transition-colors"
                                onMouseEnter={() => {
                                  setShowOverlay(true);
                                  ensureDisclaimerLoaded();
                                }}
                                onMouseLeave={() => setShowOverlay(false)}
                              >
                                <span className="text-xs text-white">i</span>
                              </button>
                            </TooltipTrigger>
                          </Tooltip>
                        </div>
                        <div className="text-green-600 font-medium text-lg">
                          Your cost: {formatPrice(
                            (service.is_verified 
                              ? extractNumericPrice(service.pro_price!) 
                              : extractNumericPrice(service.retail_price!)
                            ) * (1 - (service.respa_split_limit / 100)), 
                            service.price_duration || 'mo'
                          )}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Up to {service.respa_split_limit}% vendor contribution
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {service.is_verified && service.pro_price && service.retail_price && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                        <span>Save {formatPrice(extractNumericPrice(service.retail_price) - extractNumericPrice(service.pro_price), service.price_duration || 'mo')}</span>
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
                  
                  {showDiscountPending ? (
                    <div className="space-y-2">
                      {/* Show Circle Pro price only if service is verified and has pro price */}
                      {service.is_verified && service.pro_price ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Circle Pro:</span>
                          <span className="font-semibold text-primary">
                            {formatPrice(extractNumericPrice(service.pro_price), service.price_duration || 'mo')}
                          </span>
                        </div>
                      ) : (service.vendor?.contact_email && (
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-700">
                              Upvote if you'd buy at a discount
                            </span>
                            <div className="flex items-center gap-1">
                              {demandSignals.totalLikes > 0 && (
                                <span className="text-xs text-amber-700">
                                  {demandSignals.totalLikes}
                                </span>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      demandSignals.likeService();
                                    }}
                                    disabled={demandSignals.hasLiked}
                                    className={`p-1 rounded transition-colors ${
                                      demandSignals.hasLiked 
                                        ? 'bg-amber-200 text-amber-800' 
                                        : 'hover:bg-amber-100 text-amber-600'
                                    }`}
                                  >
                                    <ThumbsUp className={`w-4 h-4 ${demandSignals.hasLiked ? 'fill-current' : ''}`} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="w-64 p-3">
                                  <p className="text-sm leading-relaxed">
                                    {demandSignals.hasLiked 
                                      ? "Thanks for your interest! We'll notify vendors and work on securing a discount."
                                      : "Vendors unlock Pro discounts when enough agents show interest. Every upvote notifies the vendor and increases the chance of Circle securing a discount."
                                    }
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    service.is_verified && service.pro_price && (
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
                    )
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
                                 onMouseEnter={() => {
                                   setShowOverlay(true);
                                   ensureDisclaimerLoaded();
                                 }}
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
                       {discountPercentage && discountPercentage > 0 && (
                         <div className="flex justify-end">
                           <Badge className="bg-red-500 text-white text-xs font-medium">
                             {discountPercentage}% OFF
                           </Badge>
                         </div>
                       )}
                     </div>
                   )}
                </>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-2 mt-auto">
              {service.requires_quote ? (
                <Button
                  variant="outline" 
                  size="sm"
                  className="flex-1 h-9"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                </Button>
              ) : service.direct_purchase_enabled && service.website_url ? (
                <>
                  {/* Only Add to Cart Button - Buy Now will be handled in cart */}
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
                Learn more
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
        
        {isFunnelModalOpen && (
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
        )}
        
        
        {isVendorSelectionModalOpen && (
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
        )}

        <PaymentChoiceModal
          isOpen={isPricingChoiceModalOpen}
          onClose={() => setIsPricingChoiceModalOpen(false)}
          service={service}
          onProChoice={(service) => {
            addDirectlyToCart('pro');
            // Always open cart after adding an item
            setTimeout(() => {
              const cartEvent = new CustomEvent('openCart');
              window.dispatchEvent(cartEvent);
            }, 500);
          }}
          onPointsChoice={(service) => {
            addDirectlyToCart('pro'); // Handle points same as pro choice
            // Always open cart after adding an item
            setTimeout(() => {
              const cartEvent = new CustomEvent('openCart');
              window.dispatchEvent(cartEvent);
            }, 500);
          }}
          onCoPayChoice={(service, vendor) => {
            addDirectlyToCart('copay', vendor);
            // Always open cart after adding an item
            setTimeout(() => {
              const cartEvent = new CustomEvent('openCart');
              window.dispatchEvent(cartEvent);
            }, 500);
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
