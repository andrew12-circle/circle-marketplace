import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { AnswerDropdown } from "./AnswerDropdown";
import { PricingChoiceModal } from "./PricingChoiceModal";
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Target,
  Zap,
  Trophy,
  ArrowRight,
  Building,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Verified,
  Crown,
  X,
  Play,
  Shield
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConsultationFlow } from "./ConsultationFlow";
import { EnhancedProviderIntegration } from "./EnhancedProviderIntegration";
import { useProviderTracking } from "@/hooks/useProviderTracking";
import { supabase } from "@/integrations/supabase/client";
import { ReviewRatingSystem } from "@/components/marketplace/ReviewRatingSystem";
import { CustomersAlsoViewed } from "@/components/marketplace/CustomersAlsoViewed";
import { SafeHTML } from "@/utils/htmlSanitizer";

// Helper: detect and embed YouTube videos
const getYouTubeId = (url: string): string | null => {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./, '');
    if (host.includes("youtu.be")) return u.pathname.slice(1);
    if (host.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
  } catch {}
  return null;
};

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
};

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  is_verified?: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  website_url?: string;
  pricing_tiers?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    originalPrice?: string;
    duration: string;
    features: Array<{
      id: string;
      text: string;
      included: boolean;
      isHtml?: boolean;
    }>;
    isPopular: boolean;
    buttonText: string;
    badge?: string;
    position: number;
    requestPricing?: boolean;
  }>;
  vendor: {
    id?: string;
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    is_premium_provider?: boolean;
    website_url?: string;
    logo_url?: string;
    support_hours?: string;
  } | null;
  funnel_content?: {
    headline?: string;
    subHeadline?: string;
    media?: Array<{
      url: string;
      type: 'image' | 'video';
      title?: string;
      description?: string;
    }>;
    benefits?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
    packages?: Array<{
      id: string;
      name: string;
      price: number;
      originalPrice?: number;
      features: string[];
      description: string;
      popular?: boolean;
      proOnly?: boolean;
    }>;
    testimonials?: Array<{
      name: string;
      title?: string;
      content: string;
      rating: number;
      image?: string;
    }>;
    stats?: Array<{
      value: string;
      label: string;
      icon?: string;
    }>;
    estimatedRoi?: number;
    duration?: string;
    callToAction?: {
      title: string;
      description: string;
      buttonText: string;
      buttonVariant?: 'default' | 'secondary' | 'outline';
    };
    proofItWorks?: {
      testimonials?: {
        enabled: boolean;
        items: {
          id: string;
          name: string;
          company: string;
          content: string;
          rating: number;
        }[];
      };
      caseStudy?: {
        enabled: boolean;
        data: {
          beforeValue: number;
          afterValue: number;
          beforeLabel: string;
          afterLabel: string;
          percentageIncrease: number;
          timeframe: string;
          description: string;
        };
      };
      vendorVerification?: {
        enabled: boolean;
        data: {
          badges: string[];
          description: string;
        };
      };
    };
  };
}

interface ServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export const ServiceFunnelModal = ({ 
  isOpen, 
  onClose, 
  service
}: ServiceFunnelModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isConsultationFlowOpen, setIsConsultationFlowOpen] = useState(false);
  const [isPricingChoiceOpen, setIsPricingChoiceOpen] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  // Get support stats visibility from service funnel content
  const showSupportStats = service.funnel_content && typeof service.funnel_content === 'object' && 'showSupportStats' in service.funnel_content 
    ? service.funnel_content.showSupportStats 
    : false;
  const [vendorAvailability, setVendorAvailability] = useState<{
    is_available_now: boolean;
    availability_message?: string;
    next_available_slot?: string;
  } | null>(null);
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const isProMember = profile?.is_pro_member || false;
  const riskLevel = determineServiceRisk(service.title, service.description);
  const { trackBooking, trackPurchase, trackOutboundClick, trackEvent, trackWebsiteClick } = useProviderTracking(service.id, isOpen);
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  
  // Use service verification status from database  
  const isVerified = service.is_verified;
  
  // Fetch real reviews for this service
  const { reviews, loading: reviewsLoading, error: reviewsError } = useServiceReviews(service.id);

  // Normalize funnel content variants
  const subHeadline = (service.funnel_content as any)?.subHeadline || (service.funnel_content as any)?.subheadline;
  const benefits = (service.funnel_content as any)?.benefits || (service.funnel_content as any)?.whyChooseUs?.benefits || [];
  const customSections = (service.funnel_content as any)?.customSections || [];
  const fc = service.funnel_content as any;
  const ctaTitle = fc?.callToAction?.title || fc?.callToAction?.primaryHeadline || 'Ready to Transform Your Business?';
  const ctaDescription = fc?.callToAction?.description || fc?.callToAction?.primaryDescription || '';
  const scheduleText = fc?.callToAction?.primaryButtonText || 'Schedule Consultation';
  const faqSections: Array<{ id: string; title: string; content: string }> = (fc?.faqSections as any) || [];

  // Use pricing tiers if available, otherwise fallback to default packages
  const packages = service.pricing_tiers?.length ? 
    service.pricing_tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.requestPricing ? 0 : parseFloat(tier.price || "100"),
      originalPrice: tier.originalPrice ? parseFloat(tier.originalPrice) : undefined,
      description: tier.description,
      features: tier.features?.map(f => f.text) || [],
      popular: tier.isPopular,
      requestPricing: tier.requestPricing
    })) : [
      {
        id: "basic",
        name: "Basic Package",
        price: parseFloat(service.retail_price || "100") * 0.75,
        originalPrice: parseFloat(service.retail_price || "100"),
        description: "Essential service features for getting started",
        features: ["Core service delivery", "Email support", "Basic reporting"],
        requestPricing: false
      },
      {
        id: "standard",
        name: "Standard Package", 
        price: parseFloat(service.retail_price || "100"),
        originalPrice: parseFloat(service.retail_price || "100") * 1.33,
        description: "Complete solution for most needs",
        features: ["Everything in Basic", "Priority support", "Advanced reporting", "Custom consultation"],
        popular: true,
        requestPricing: false
      },
      {
        id: "premium",
        name: "Premium Package",
        price: parseFloat(service.retail_price || "100") * 1.5,
        originalPrice: parseFloat(service.retail_price || "100") * 2,
        description: "Full-service solution with dedicated support",
        features: ["Everything in Standard", "Dedicated account manager", `${service.vendor?.support_hours || 'Business Hours'} support`, "Custom integrations"], // Dynamic support hours
        requestPricing: false
      }
    ];

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage) || packages[1];

  // Initialize selected package on component mount or when packages change
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      // Find popular package first, otherwise use the first one
      const popularPackage = packages.find(pkg => pkg.popular);
      setSelectedPackage(popularPackage?.id || packages[0].id);
    }
  }, [packages, selectedPackage]);

  const handleAddToCart = () => {
    addToCart({
      id: service.id,
      title: `${service.title} - ${selectedPkg.name}`,
      price: selectedPkg.price * quantity,
      vendor: service.vendor?.name || 'Direct Service',
      image_url: service.image_url,
      requiresQuote: service.requires_quote,
      type: 'service'
    });
    
    // Track the purchase action
    trackPurchase({
      id: service.id,
      package_type: selectedPkg.name,
      amount: selectedPkg.price * quantity,
      payment_method: 'cart'
    });
    
    onClose();
  };

  const handleChooseProPrice = () => {
    setIsPricingChoiceOpen(false);
    handleAddToCart();
  };

  const handleChooseCoPay = () => {
    setIsPricingChoiceOpen(false);
    // Handle copay request flow here
    toast("Co-pay request initiated! You'll be connected with a vendor partner.", {
      description: "Check your notifications for updates on your co-pay request."
    });
    onClose();
  };

  const handleChooseAgentPoints = () => {
    setIsPricingChoiceOpen(false);
    // Handle agent points payment here
    toast("Processing payment with agent points...", {
      description: "Your points will be deducted upon successful processing."
    });
    onClose();
  };

  const renderStarRating = (rating: number, size = "sm") => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => {
          const isFullStar = i < Math.floor(rating);
          const isPartialStar = i === Math.floor(rating) && rating % 1 !== 0;
          const fillPercentage = isPartialStar ? (rating <= 4.9 ? 50 : (rating % 1) * 100) : 0;
          
          return (
            <div key={i} className={`relative ${size === "lg" ? "h-5 w-5" : "h-4 w-4"}`}>
              <Star className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} text-gray-300 absolute`} />
              {isFullStar && (
                <Star className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill-yellow-400 text-yellow-400 absolute`} />
              )}
              {isPartialStar && (
                <div 
                  className="overflow-hidden absolute"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill-yellow-400 text-yellow-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-hidden p-0 animate-scale-in">
        <DialogHeader className="sr-only">
          <span>Service Details</span>
        </DialogHeader>
        
        {/* Close Button - Fixed Position */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg border border-white/20"
          onClick={onClose}
        >
          <X className="h-4 w-4 text-gray-700" />
        </Button>


        <div className="overflow-y-auto max-h-[90vh]">
          {/* Modern Hero Section */}
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%223%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            
            <div className="relative p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
                  {isVerified ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
                      <Verified className="w-3 h-3 mr-1" />
                      Verified Pro
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                      <X className="w-3 h-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                  {service.vendor?.is_premium_provider && (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                      <Trophy className="w-3 h-3 mr-1" />
                      Premium Provider
                    </Badge>
                  )}
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left Content */}
                  <div className="space-y-6 animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold leading-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      {service.funnel_content?.headline || service.title}
                    </h1>
                    
                    <p className="text-base lg:text-lg text-blue-100 leading-relaxed">
                      {subHeadline || "Transform your real estate business with our proven system"}
                    </p>

                    {(reviews.length > 0) && (
                      <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                        <div className="flex items-center gap-2">
                          {renderStarRating(service.vendor?.rating || 0, "lg")}
                          <span className="text-lg font-medium">
                            {service.vendor?.rating}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-6 bg-white/30" />
                        <span className="text-sm text-blue-200">
                          {reviews.length} reviews
                        </span>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className={`grid ${showSupportStats ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                       <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                         <div className="text-2xl font-bold">{isVerified && service.estimated_roi ? `${service.estimated_roi}%` : 'TBD'}</div>
                         <div className="text-xs text-blue-200">Avg ROI</div>
                       </div>
                       <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                         <div className="text-2xl font-bold">{isVerified ? '30' : 'TBD'}</div>
                         <div className="text-xs text-blue-200">Days Setup</div>
                       </div>
                      {showSupportStats && (
                        <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                          <div className="text-2xl font-bold">{service.vendor?.support_hours || 'Business Hours'}</div>
                          <div className="text-xs text-blue-200">Support</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Media */}
                  <div className="relative animate-fade-in">
                    <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                      {(service.funnel_content?.media?.[0]?.url || service.image_url) ? (
                        (() => {
                          const baseMediaItem = service.funnel_content?.media?.[0];
                          const baseUrl = baseMediaItem?.url || service.image_url;
                          const currentUrl = activeMediaUrl || baseUrl;
                          const yt = getYouTubeEmbedUrl(currentUrl || undefined);
                          const isVideo = !!yt || (currentUrl ? /\.(mp4|webm|ogg)$/i.test(currentUrl) : false);
                          
                          if (isVideo) {
                            return yt ? (
                              <iframe
                                src={yt}
                                title={service.funnel_content?.headline || service.title}
                                className="w-full h-full"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                controls
                                className="w-full h-full object-cover"
                                src={currentUrl || undefined}
                              />
                            );
                          } else {
                            return (
                              <img
                                src={currentUrl || undefined}
                                alt={service.funnel_content?.headline || service.title}
                                className="w-full h-full object-contain hover-scale bg-white p-5"
                              />
                            );
                          }
                        })()
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                          <Play className="w-16 h-16 text-white/60" />
                        </div>
                      )}
                    </div>

                    {/* Additional Media Grid */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {(() => {
                        const media: Array<{ url: string; type: 'image' | 'video'; title?: string }> = Array.isArray(fc?.media) ? fc.media : [];
                        const thumbs = media.slice(1, 5); // show next up to 4 items (first is in the main player)
                        if (!thumbs.length) return null;
                        return thumbs.map((m, idx) => {
                          const youTubeId = getYouTubeId(m.url);
                          const isVideo = m.type === 'video' || !!youTubeId || /\.(mp4|webm|ogg)$/i.test(m.url || '');
                          const thumbUrl = youTubeId
                            ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg`
                            : m.url;
                          return (
                            <button
                              key={`${m.url}-${idx}`}
                              type="button"
                              onClick={() => setActiveMediaUrl(m.url)}
                              className="relative aspect-video bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 cursor-pointer hover-scale"
                              aria-label={m.title || (isVideo ? 'Play video' : 'View image')}
                            >
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={m.title || (isVideo ? 'Video thumbnail' : 'Image thumbnail')}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                                  <Play className="w-8 h-8 text-white/60" />
                                </div>
                              )}
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                                  <Play className="w-7 h-7 text-white drop-shadow" />
                                </div>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="bg-gray-50/50 py-12">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left Column - Collapsible Questions */}
                <div className="lg:col-span-2">
                  <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="space-y-4">
                    {/* Question 1 */}
                    <AccordionItem value="question-1">
                      <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-blue-500 pl-4 bg-white rounded-t-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                          Why Should I Care?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-4 border-l-blue-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0">
                        <div className="p-6 pt-0">
                          <p className="text-gray-600 leading-relaxed pt-[5px]">
                            {(
                              (Array.isArray((fc as any)?.faqSections) &&
                                (((fc as any).faqSections.find((s: any) => s?.id === 'question-1') || (fc as any).faqSections[0])?.content))
                              ) || fc?.heroDescription || service.description ||
                              "All-in-one real estate lead generation & CRM platform designed to turn online leads into closings faster"
                            }
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Question 2 - ROI */}
                    <AccordionItem value="question-2">
                      <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-purple-500 pl-4 bg-white rounded-t-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">2</div>
                          What's My ROI Potential?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-4 border-l-purple-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0">
                          <div className="p-6 pt-[5px]">
                            {(() => {
                              const sections = Array.isArray((fc as any)?.faqSections) ? (fc as any).faqSections : [];
                              const byId = sections.find((s: any) => s?.id === 'question-2');
                              const byTitle = sections.find((s: any) => typeof s?.title === 'string' && s.title.toLowerCase().includes('roi'));
                              const roi = byId?.content || byTitle?.content || 
                                (isVerified && typeof fc?.estimatedRoi === 'number'
                                  ? `Based on similar deployments, average ROI is ~${fc.estimatedRoi}% within ${fc?.duration || '30 days'}.`
                                  : isVerified 
                                    ? '600% average return on investment with proper implementation'
                                    : 'ROI data is not available for non-verified vendors. Contact the vendor directly for performance information.');
                              return <SafeHTML html={roi} />;
                            })()}
                          </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Question 3 */}
                    <AccordionItem value="question-3">
                      <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-orange-500 pl-4 bg-white rounded-t-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">3</div>
                          How Soon Will I See Results?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-4 border-l-orange-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0">
                        <div className="p-6 pt-[5px]">
                          {(() => {
                            const sections = Array.isArray((fc as any)?.faqSections) ? (fc as any).faqSections : [];
                            const byId = sections.find((s: any) => s?.id === 'question-3');
                            const byTitle = sections.find((s: any) => typeof s?.title === 'string' && s.title.toLowerCase().includes('soon'));
                            const answer = byId?.content || byTitle?.content;
                            if (answer) {
                              return <SafeHTML html={answer} />;
                            }
                            return (
                              <div className="space-y-6">
                                {/* Time Investment Overview */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Your Time Investment
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600">2-3 hrs</div>
                                      <div className="text-sm text-blue-700">Initial Setup</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600">15 min</div>
                                      <div className="text-sm text-blue-700">Daily Maintenance</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Timeline with Energy Requirements */}
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">Setup: 24-48 hours</div>
                                      <div className="text-sm text-gray-600">2-3 hours of your time + our team handles the rest</div>
                                    </div>
                                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Low Effort</div>
                                  </div>
                                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                      <TrendingUp className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">First leads: 1-2 weeks</div>
                                      <div className="text-sm text-gray-600">15 minutes daily lead follow-up</div>
                                    </div>
                                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Low Effort</div>
                                  </div>
                                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                      <Trophy className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">Closings: 30-90 days</div>
                                      <div className="text-sm text-gray-600">Normal sales process - no extra work</div>
                                    </div>
                                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">No Extra Effort</div>
                                  </div>
                                </div>

                                {/* Energy Breakdown */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <h4 className="font-semibold text-green-900 mb-3">What You Actually Do:</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>Answer phone calls from qualified leads</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>Review system-generated follow-ups (5 min/day)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>Close deals (what you already do best!)</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-sm text-green-700 font-medium">
                                    ✅ The system handles: ads, landing pages, lead nurturing, appointment booking
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Question 4 - What's Included */}
                    <AccordionItem value="question-4">
                      <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-red-500 pl-4 bg-white rounded-t-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">4</div>
                          What's Included?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-4 border-l-red-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0">
                        <div className="p-6 pt-[5px]">
                          {(() => {
                            const sections = Array.isArray((fc as any)?.faqSections) ? (fc as any).faqSections : [];
                            const byId = sections.find((s: any) => s?.id === 'question-4');
                            const byTitle = sections.find(
                              (s: any) => typeof s?.title === 'string' && s.title.toLowerCase().includes('included')
                            );
                            const included = byId?.content || byTitle?.content;
                            if (included) {
                              return <SafeHTML html={included} />;
                            }
                            return (
                              <div className="space-y-6">
                                {/* Core Features */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">Core Features</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="w-5 h-5 text-red-500" />
                                      <span className="text-gray-700">IDX website</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="w-5 h-5 text-red-500" />
                                      <span className="text-gray-700">CRM with auto-drip</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="w-5 h-5 text-red-500" />
                                      <span className="text-gray-700">Facebook & Google ad integration</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="w-5 h-5 text-red-500" />
                                      <span className="text-gray-700">Text & email automation</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="w-5 h-5 text-red-500" />
                                      <span className="text-gray-700">Lead routing</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Optional Add-ons */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">Optional Add-ons or Upgrades</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <Plus className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-600">Advanced analytics dashboard</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Plus className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-600">Custom branding package</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Plus className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-600">Dedicated account manager</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Plus className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-600">Enhanced lead scoring</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Question 5 - Proof It Works */}
                    <AccordionItem value="question-5">
                      <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-emerald-500 pl-4 bg-white rounded-t-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">5</div>
                          Proof It Works
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-4 border-l-emerald-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0">
                         <div className="p-6 pt-0">
                           <div className="space-y-6">
                             {/* Agent Reviews */}
                             {service.funnel_content?.proofItWorks?.testimonials?.enabled && service.funnel_content.proofItWorks.testimonials.items.length > 0 && reviews.length > 0 && (
                               <div>
                                 <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                   <Star className="w-5 h-5 text-yellow-500" />
                                   Agent Reviews
                                 </h4>
                                 <div className="space-y-3">
                                   {service.funnel_content.proofItWorks.testimonials.items.map((testimonial) => (
                                     <div key={testimonial.id} className="bg-gray-50 p-4 rounded-lg border">
                                       <div className="flex items-center gap-3 mb-2">
                                         {renderStarRating(testimonial.rating)}
                                         <span className="font-medium text-gray-900">{testimonial.name}, {testimonial.company}</span>
                                       </div>
                                       <p className="text-gray-700 italic">"{testimonial.content}"</p>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}

                             {/* Case Study Snapshot */}
                             {service.funnel_content?.proofItWorks?.caseStudy?.enabled && (
                               <div>
                                 <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                   <TrendingUp className="w-5 h-5 text-green-500" />
                                   Case Study Results
                                 </h4>
                                 <div className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border">
                                   <div className="grid grid-cols-2 gap-4">
                                     <div className="text-center">
                                       <div className="text-sm text-gray-600 mb-1">Before</div>
                                       <div className="text-2xl font-bold text-red-600">{service.funnel_content.proofItWorks.caseStudy.data.beforeValue}</div>
                                       <div className="text-xs text-gray-500">{service.funnel_content.proofItWorks.caseStudy.data.beforeLabel}</div>
                                     </div>
                                     <div className="text-center">
                                       <div className="text-sm text-gray-600 mb-1">After {service.funnel_content.proofItWorks.caseStudy.data.timeframe}</div>
                                       <div className="text-2xl font-bold text-green-600">{service.funnel_content.proofItWorks.caseStudy.data.afterValue}</div>
                                       <div className="text-xs text-gray-500">{service.funnel_content.proofItWorks.caseStudy.data.afterLabel}</div>
                                     </div>
                                   </div>
                                   <div className="text-center mt-3">
                                     <div className="text-lg font-semibold text-emerald-600">+{service.funnel_content.proofItWorks.caseStudy.data.percentageIncrease}% Lead Increase</div>
                                     <div className="text-sm text-gray-600">{service.funnel_content.proofItWorks.caseStudy.data.description}</div>
                                   </div>
                                 </div>
                               </div>
                             )}

                             {/* Vendor Verification */}
                             {service.funnel_content?.proofItWorks?.vendorVerification?.enabled && service.vendor?.is_verified && (
                               <div>
                                 <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                   <Verified className="w-5 h-5 text-emerald-500" />
                                   Vendor Verification
                                 </h4>
                                 <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                   <div className="flex items-center gap-3 flex-wrap">
                                     <Badge className="bg-emerald-500/20 text-emerald-700 border border-emerald-400/30">
                                       <Verified className="w-3 h-3 mr-1" />
                                       Verified Provider
                                     </Badge>
                                     {service.funnel_content.proofItWorks.vendorVerification.data.badges.map((badge, index) => (
                                       <span key={index} className="text-emerald-700 font-medium">✓ {badge}</span>
                                     ))}
                                   </div>
                                   <p className="text-emerald-600 text-sm mt-2">{service.funnel_content.proofItWorks.vendorVerification.data.description}</p>
                                 </div>
                               </div>
                             )}

                             {/* Fallback for services without proof data */}
                             {(!service.funnel_content?.proofItWorks?.testimonials?.enabled && 
                               !service.funnel_content?.proofItWorks?.caseStudy?.enabled && 
                               !service.funnel_content?.proofItWorks?.vendorVerification?.enabled) && (
                               <>

                                 {/* Default Case Study */}
                                 <div>
                                   <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                     <TrendingUp className="w-5 h-5 text-green-500" />
                                     Case Study Results
                                   </h4>
                                   <div className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border">
                                     <div className="grid grid-cols-2 gap-4">
                                       <div className="text-center">
                                         <div className="text-sm text-gray-600 mb-1">Before</div>
                                         <div className="text-2xl font-bold text-red-600">12</div>
                                         <div className="text-xs text-gray-500">leads/month</div>
                                       </div>
                                       <div className="text-center">
                                         <div className="text-sm text-gray-600 mb-1">After 90 Days</div>
                                         <div className="text-2xl font-bold text-green-600">85</div>
                                         <div className="text-xs text-gray-500">leads/month</div>
                                       </div>
                                     </div>
                                     <div className="text-center mt-3">
                                       <div className="text-lg font-semibold text-emerald-600">+608% Lead Increase</div>
                                       <div className="text-sm text-gray-600">Real agent results from Q3 2024</div>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Default Vendor Verification */}
                                 {service.vendor?.is_verified && (
                                   <div>
                                     <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                       <Verified className="w-5 h-5 text-emerald-500" />
                                       Vendor Verification
                                     </h4>
                                     <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                       <div className="flex items-center gap-3">
                                         <Badge className="bg-emerald-500/20 text-emerald-700 border border-emerald-400/30">
                                           <Verified className="w-3 h-3 mr-1" />
                                           Verified Provider
                                         </Badge>
                                         <span className="text-emerald-700 font-medium">✓ Background checked</span>
                                         <span className="text-emerald-700 font-medium">✓ Performance verified</span>
                                       </div>
                                       <p className="text-emerald-600 text-sm mt-2">This vendor has been vetted and meets our quality standards.</p>
                                     </div>
                                   </div>
                                 )}
                               </>
                             )}
                           </div>
                         </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Question 6 - How to Get Started */}
                    <AccordionItem value="question-6">
                      <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-pink-500 pl-4 bg-white rounded-t-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm">6</div>
                          How Do I Get Started?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-l-4 border-l-pink-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0">
                        <div className="p-6 pt-0">
                          <div className="space-y-6">
                            {/* Main CTA */}
                            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                              <h4 className="text-2xl font-bold text-gray-900 mb-2">Ready to Transform Your Business?</h4>
                              <p className="text-gray-600 mb-4">Join thousands of agents who've already made the switch</p>
                              
                              <Button 
                                onClick={() => setIsConsultationFlowOpen(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover-scale"
                              >
                                Book Your Free Demo
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </Button>
                            </div>

                            {/* Quick Steps */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Getting started is easy:</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                                  <div>
                                    <div className="font-medium">Book a 15-minute demo</div>
                                    <div className="text-sm text-gray-600">See the platform in action</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                                  <div>
                                    <div className="font-medium">Choose your package</div>
                                    <div className="text-sm text-gray-600">Select the plan that fits your needs</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                                  <div>
                                    <div className="font-medium">Go live in 24-48 hours</div>
                                    <div className="text-sm text-gray-600">We handle the setup for you</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Alternative Actions */}
                            <div className="flex gap-3">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  if (service.vendor?.website_url) {
                                    trackOutboundClick(service.vendor.website_url, 'vendor_website');
                                    window.open(service.vendor.website_url, '_blank');
                                  }
                                }}
                                className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-2 rounded-lg"
                              >
                                <Building className="w-4 h-4 mr-2" />
                                Visit Vendor Site
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsPricingChoiceOpen(true)}
                                className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-2 rounded-lg"
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                  </Accordion>
                </div>

                {/* Right Column - Simple Pricing */}
                <div className="space-y-6">
                  {/* Pricing Section */}
                  <Card className="sticky top-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 animate-fade-in">
                     <CardContent className="p-6">
                       <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                       
                       {/* Action Buttons */}
                       <div className="space-y-3">
                         <Button 
                           onClick={() => setIsConsultationFlowOpen(true)}
                           className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                         >
                           <Calendar className="w-5 h-5 mr-2" />
                           Book Consultation
                         </Button>
                         
                           <Button 
                             variant="outline" 
                             onClick={() => {
                               const rawUrl = service.website_url || service.vendor?.website_url;
                               if (rawUrl) {
                                 trackWebsiteClick(rawUrl, service.vendor?.id, 'vendor_website');
                               }
                             }}
                             disabled={!service.website_url && !service.vendor?.website_url}
                             className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <Building className="w-5 h-5 mr-2" />
                              {(service.website_url || service.vendor?.website_url) ? 'View Website' : 'Website Not Available'}
                            </Button>
                         
                          
                              <Button 
                               variant="outline" 
                                onClick={() => {
                                  // Scroll to the pricing section
                                  const pricingSection = document.querySelector('[data-section="pricing-packages"]');
                                  if (pricingSection) {
                                    pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                  trackEvent({ event_type: 'click', event_data: { context: 'pricing', section: 'pricing-packages' } } as any);
                                }}
                             className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl font-semibold"
                           >
                             <DollarSign className="w-5 h-5 mr-2" />
                             Pricing
                           </Button>
                       </div>
                     </CardContent>
                  </Card>
                </div>
              </div>

            </div>
          </div>

          {/* Pricing Packages Section - Only show if pricing tiers are configured */}
          {service.pricing_tiers?.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12" data-section="pricing-packages">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Package</h2>
                <p className="text-lg text-gray-600">Select the perfect solution for your business needs</p>
              </div>
              
              <div className={`grid gap-6 ${
                packages.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                packages.length === 2 ? 'grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto' :
                packages.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto'
              }`}>
                {packages.slice(0, 4).map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
                      selectedPackage === pkg.id
                        ? 'border-blue-500 bg-white shadow-xl ring-4 ring-blue-100'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-lg'
                    } ${pkg.popular ? 'ring-2 ring-blue-200' : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 text-sm font-semibold shadow-lg border-0 rounded-full whitespace-nowrap">
                          ⭐ Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-xl text-gray-900 mb-2">{pkg.name}</h4>
                      
                      {/* Pricing Tiers */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Retail:</span>
                          <span className="font-medium text-gray-800">
                            ${pkg.requestPricing ? 'Quote' : (pkg.originalPrice || pkg.price)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-600">Pro Member:</span>
                          <span className="font-medium text-blue-600">
                            ${pkg.requestPricing ? 'Quote' : Math.round(pkg.price * 0.85)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                          <span className="text-green-700 font-medium">Co-Pay:</span>
                          <span className="font-bold text-green-700 text-lg">
                            ${pkg.requestPricing ? 'Quote' : Math.round(pkg.price * 0.15)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-3">{pkg.description}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {pkg.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                      {pkg.features.length > 4 && (
                        <div className="text-sm text-gray-500 text-center">
                          +{pkg.features.length - 4} more features
                        </div>
                      )}
                    </div>

                    <Button 
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        selectedPackage === pkg.id 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPackage(pkg.id);
                      }}
                    >
                      {selectedPackage === pkg.id ? '✓ Selected' : 'Select Package'}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
                <Button 
                  onClick={() => setIsConsultationFlowOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex-1"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Get Started with {selectedPkg?.name || 'Selected Package'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsPricingChoiceOpen(true)}
                  className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 rounded-xl font-semibold text-lg flex-1"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart - ${selectedPkg?.price || '0'}
                </Button>
              </div>
            </div>
          </div>
          )}

          {/* Customers Also Viewed Section */}
          <div className="max-w-6xl mx-auto px-6 py-8">
            <CustomersAlsoViewed currentService={service} maxSuggestions={6} />
          </div>

          {/* Disclaimer Section for Non-Verified Services */}
          {!isVerified && (
            <div className="bg-amber-50 border-l-4 border-amber-400 py-6">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">
                      Circle Marketplace Disclaimer
                    </h3>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      This service listing represents Circle Marketplace's opinion based on publicly available data. 
                      We do not endorse or have independently verified the pricing, service details, or company capabilities listed. 
                      All information and recommendations are derived from our analysis and should be independently verified. 
                      Circle Marketplace bears no responsibility for the accuracy of vendor claims or service delivery quality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verified Service Disclaimer */}
          {isVerified && (
            <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 mt-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Verified Pricing Disclaimer
                    </h4>
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
                    <p>
                      This service has verified pricing through our verification process. However, pricing is subject to change 
                      and vendors may not have updated their information since changes occurred.
                    </p>
                    <p>
                      Circle Marketplace cannot guarantee service quality, satisfaction, or discounts as we are a marketplace 
                      platform that represents other companies to make shopping easier. Please verify all details directly with the vendor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Consultation Flow Modal */}
        {isConsultationFlowOpen && (
          <ConsultationFlow
            isOpen={isConsultationFlowOpen}
            onClose={() => setIsConsultationFlowOpen(false)}
            service={service}
          />
        )}

        {/* Pricing Choice Modal */}
        {isPricingChoiceOpen && (
          <PricingChoiceModal
            isOpen={isPricingChoiceOpen}
            onClose={() => setIsPricingChoiceOpen(false)}
            service={{
              id: service.id,
              title: `${service.title} - ${selectedPkg?.name || 'Selected Package'}`,
              pro_price: selectedPkg?.price?.toString() || '0',
              retail_price: selectedPkg?.originalPrice?.toString() || selectedPkg?.price?.toString() || '0',
              respa_split_limit: 50, // Default 50% split limit
              price_duration: service.duration,
              requires_quote: selectedPkg?.requestPricing || service.requires_quote
            }}
            onChooseProPrice={handleChooseProPrice}
            onChooseCoPay={handleChooseCoPay}
            onChooseAgentPoints={handleChooseAgentPoints}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
