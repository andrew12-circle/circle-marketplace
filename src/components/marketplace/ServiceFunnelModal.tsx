import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServiceReviews } from "@/hooks/useServiceReviews";
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
  X
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConsultationFlow } from "./ConsultationFlow";
import { EnhancedProviderIntegration } from "./EnhancedProviderIntegration";
import { useProviderTracking } from "@/hooks/useProviderTracking";
import { supabase } from "@/integrations/supabase/client";
import { ReviewRatingSystem } from "@/components/marketplace/ReviewRatingSystem";
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
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    website_url?: string;
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
  const [vendorAvailability, setVendorAvailability] = useState<{
    is_available_now: boolean;
    availability_message?: string;
    next_available_slot?: string;
  } | null>(null);
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const isProMember = profile?.is_pro_member || false;
  const riskLevel = determineServiceRisk(service.title, service.description);
  const { trackBooking, trackPurchase, trackOutboundClick } = useProviderTracking(service.id, isOpen);
  
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
        features: ["Everything in Standard", "Dedicated account manager", "24/7 support", "Custom integrations"],
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

  // Fetch vendor availability on component mount
  useEffect(() => {
    const fetchVendorAvailability = async () => {
      if (!service.vendor?.name) {
        setVendorAvailability({ is_available_now: false });
        return;
      }

      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('name', service.vendor.name)
          .single();

        if (vendor) {
          const { data: availability } = await supabase
            .from('vendor_availability')
            .select('is_available_now, availability_message, next_available_slot')
            .eq('vendor_id', vendor.id)
            .single();

          setVendorAvailability(availability || { is_available_now: false });
        }
      } catch (error) {
        console.error('Error fetching vendor availability:', error);
        setVendorAvailability({ is_available_now: false });
      }
    };

    if (isOpen) {
      fetchVendorAvailability();
    }
  }, [isOpen, service.vendor?.name]);

  // Helper function to format review dates
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to get reviewer title
  const getReviewerTitle = (review: any) => {
    if (review.author_company) {
      const specialtyMap: Record<string, string> = {
        'realtor': 'Real Estate Agent',
        'mortgage': 'Mortgage Professional',
        'insurance': 'Insurance Agent',
        'marketing': 'Marketing Specialist',
        'commercial': 'Commercial Agent',
        'luxury': 'Luxury Specialist',
        'investment': 'Investment Specialist'
      };
      
      const primarySpecialty = review.author_specialties?.[0];
      const titlePrefix = primarySpecialty ? specialtyMap[primarySpecialty] || 'Professional' : 'Professional';
      return `${titlePrefix}, ${review.author_company}`;
    }
    return review.author_specialties?.[0] ? 
      review.author_specialties[0].charAt(0).toUpperCase() + review.author_specialties[0].slice(1) + ' Professional' : 
      'Verified User';
  };

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

  const hasBenefits = Array.isArray(fc?.benefits) && fc.benefits.length > 0;
  const showThumbnailGallery = !!fc?.thumbnailGallery?.enabled;
  const showTestimonialCards = !!fc?.testimonialCards?.enabled;
  const showROI = !!fc?.roiCalculator?.enabled;
  const showStats = Array.isArray(fc?.socialProof?.stats) && fc.socialProof.stats.length > 0;
  const showTestimonials = Array.isArray(fc?.socialProof?.testimonials) && fc.socialProof.testimonials.length > 0;
  const showPackagesSection = Array.isArray(service.pricing_tiers) && service.pricing_tiers.length > 0;
  const showUrgency = !!fc?.urgencySection?.enabled;
  const showTimeInvestment = !!(fc?.timeInvestment?.enabled || fc?.showTimeInvestment);
  const showMiddle = hasBenefits || showROI || showStats || showTestimonials || showUrgency || showTimeInvestment;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <span>Service Details</span>
        </DialogHeader>
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                {service.vendor?.is_verified && (
                  <Badge className="bg-green-500 text-white">
                    <Verified className="w-3 h-3 mr-1" />
                    Top Rated Pro
                  </Badge>
                )}
                <Badge className="bg-orange-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  Premium Provider
                </Badge>
              </div>
              <h1 className="text-4xl font-bold leading-tight">
                {service.funnel_content?.headline || service.title}
              </h1>
              <p className="text-xl text-blue-100">
                {subHeadline || "Transform your real estate business with our proven system"}
              </p>
              {fc?.heroDescription && (
                <p className="text-base text-blue-100/90">{fc.heroDescription}</p>
              )}
              {service.vendor && (
                <div className="flex items-center gap-4">
                  {renderStarRating(service.vendor.rating, "lg")}
                  <span className="text-lg">
                    {service.vendor.rating} ({service.vendor.review_count}+ reviews)
                  </span>
                </div>
              )}
            </div>
            {/* Conditional Benefits Section */}
            {hasBenefits && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-2xl font-bold mb-4">
                  Why Choose {service.vendor?.name || 'This Service'}?
                </h3>
                <div className="space-y-3">
                  {fc.benefits.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="bg-green-500 rounded-full p-1">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-lg">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column - Media and Social Proof */}
          <div className={`${showMiddle ? 'lg:col-span-5' : 'lg:col-span-8'} space-y-6`}>
            {/* Main Image/Video */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
              {(service.funnel_content?.media?.[0]?.url || service.image_url) ? (
                (() => {
                  const mediaItem = service.funnel_content?.media?.[0];
                  const mediaUrl = mediaItem?.url || service.image_url;
                  const yt = getYouTubeEmbedUrl(mediaUrl);
                  const isVideo = mediaItem?.type === 'video' || !!yt || (mediaUrl ? /\.(mp4|webm|ogg)$/i.test(mediaUrl) : false);
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
                        src={mediaUrl}
                      />
                    );
                  }
                  return (
                    <img
                      src={mediaUrl!}
                      alt={service.funnel_content?.headline || service.title}
                      className="w-full h-auto object-contain"
                    />
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                  <Building className="w-24 h-24 text-blue-400" />
                </div>
              )}
            </div>

            {(fc?.heroDescription || service.description) && (
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-base font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {fc?.heroDescription || service.description}
                </p>
              </div>
            )}

            {/* Thumbnail Gallery */}
            {(service.funnel_content as any)?.thumbnailGallery?.enabled && (
              <>
                {(service.funnel_content as any).thumbnailGallery.title && (
                  <h3 className="font-bold text-lg mb-3">{(service.funnel_content as any).thumbnailGallery.title}</h3>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {((service.funnel_content as any).thumbnailGallery.items?.length > 0 
                    ? (service.funnel_content as any).thumbnailGallery.items 
                    : [
                        { id: '1', label: "Demo Video", icon: "video" },
                        { id: '2', label: "Case Study", icon: "chart" },
                        { id: '3', label: "Training", icon: "book" },
                        { id: '4', label: "Results", icon: "trophy" }
                      ]
                  ).map((item: any, i: number) => (
                    <div key={item.id || i} className="aspect-square bg-muted rounded border-2 border-transparent hover:border-primary cursor-pointer relative overflow-hidden">
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                        {item.icon === "video" && <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-0.5"></div></div>}
                        {item.icon === "chart" && <TrendingUp className="w-8 h-8 text-green-500" />}
                        {item.icon === "book" && <Building className="w-8 h-8 text-blue-500" />}
                        {item.icon === "trophy" && <Trophy className="w-8 h-8 text-yellow-500" />}
                        <span className="text-xs text-center mt-1 px-1">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Social Proof Cards */}
            {(service.funnel_content as any)?.testimonialCards?.enabled && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">
                  {(service.funnel_content as any).testimonialCards.title || 'Recent Success Stories'}
                </h3>
                <div className="space-y-3">
                  {((service.funnel_content as any).testimonialCards.cards?.length > 0 
                    ? (service.funnel_content as any).testimonialCards.cards 
                    : [
                        {
                          id: '1',
                          name: 'Sarah T.',
                          role: 'Keller Williams',
                          content: 'Increased my closings by 200% in just 3 months!',
                          rating: 5,
                          timeAgo: '2 weeks ago',
                          borderColor: 'green'
                        },
                        {
                          id: '2',
                          name: 'Mike R.',
                          role: 'RE/MAX',
                          content: 'ROI was 320% in the first quarter alone.',
                          rating: 5,
                          timeAgo: '1 week ago',
                          borderColor: 'blue'
                        }
                      ]
                  ).map((card: any) => (
                    <Card key={card.id} className={`p-4 border-l-4 border-l-${card.borderColor}-500`}>
                      <div className="flex items-start gap-3">
                        <div className={`bg-${card.borderColor}-100 rounded-full p-2`}>
                          {card.borderColor === 'green' && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {card.borderColor === 'blue' && <DollarSign className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{card.name} - {card.role}</p>
                          <p className="text-sm text-muted-foreground">"{card.content}"</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(card.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-xs text-muted-foreground ml-2">{card.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Value Proposition */}
          {showMiddle && (
          <div className="lg:col-span-4 space-y-6">
            {hasBenefits && (
              <div>
                <h2 className="text-2xl font-bold mb-4">What You'll Get</h2>
                <div className="space-y-4">
                  {fc.benefits.map((benefit: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-2 mt-1">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{benefit.title}</h3>
                        {benefit.description && (
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* ROI Calculator */}
            {(service.funnel_content as any)?.roiCalculator?.enabled && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-3">
                  {(service.funnel_content as any).roiCalculator.title || 'ROI Calculator'}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Current monthly closings:</span>
                    <span className="font-medium">{(service.funnel_content as any).roiCalculator.currentMonthlyClosings || 3} deals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average commission:</span>
                    <span className="font-medium">${((service.funnel_content as any).roiCalculator.averageCommission || 8500).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">With our system ({(service.funnel_content as any).roiCalculator.increasePercentage || 150}% increase):</span>
                    <span className="font-medium text-green-600">
                      {(((service.funnel_content as any).roiCalculator.currentMonthlyClosings || 3) * ((service.funnel_content as any).roiCalculator.increasePercentage || 150) / 100 + ((service.funnel_content as any).roiCalculator.currentMonthlyClosings || 3)).toFixed(1)} deals
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Additional monthly income:</span>
                    <span className="text-green-600">+${((service.funnel_content as any).roiCalculator.calculatedAdditionalIncome || 38250).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Annual increase:</span>
                    <span className="text-green-600 font-semibold">+${((service.funnel_content as any).roiCalculator.calculatedAnnualIncrease || 459000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {fc?.socialProof?.stats?.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-3">Proven Results</h3>
                <div className="grid grid-cols-2 gap-3">
                  {fc.socialProof.stats.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="secondary">{s.value}</Badge>
                      <span className="text-sm">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fc?.socialProof?.testimonials?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">What clients say</h3>
                {fc.socialProof.testimonials.slice(0, 2).map((t: any, i: number) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {renderStarRating(t.rating)}
                      <span className="text-xs text-muted-foreground">{t.role}</span>
                    </div>
                    <p className="text-sm">"{t.content}"</p>
                    <p className="text-xs text-muted-foreground mt-1">— {t.name}</p>
                  </Card>
                ))}
              </div>
            )}

            {showTimeInvestment && (
              <div className="bg-blue-50 p-4 rounded-lg border">
                <h3 className="font-bold mb-3">Time Investment</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Setup: 2-3 hours over 1 week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Daily maintenance: 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Results visible: Within 30 days</span>
                  </div>
                </div>
              </div>
            )}

            </div>
          )}

          {/* Right Column - Choose Your Package (Widened) */}
          <div className="lg:col-span-4 lg:order-3">
            <div className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="space-y-3">
                  {/* Show Add to Cart for services with pricing tiers that don't require pricing requests */}
                  {service.pricing_tiers?.length > 0 && !service.requires_quote && !selectedPkg?.requestPricing ? (
                    <>
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">Qty: {quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold" 
                        size="lg"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart - ${(selectedPkg?.price || 0) * quantity}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="lg"
                        onClick={() => setIsConsultationFlowOpen(true)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {scheduleText}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold" 
                        size="lg"
                        onClick={() => setIsConsultationFlowOpen(true)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {scheduleText}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="lg"
                        onClick={() => setIsConsultationFlowOpen(true)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Get Custom Quote
                      </Button>
                    </>
                  )}
                  
                  {service.website_url && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="lg"
                      onClick={() => window.open(service.website_url, '_blank')}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Visit Service Website
                    </Button>
                  )}
                  
                  
                  {service.vendor?.website_url && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="lg"
                      onClick={() => window.open(service.vendor.website_url, '_blank')}
                    >
                      <Building className="w-4 h-4 mr-2" />
                      Visit {service.vendor.name} Website
                    </Button>
                  )}

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Free consultation</span> • No obligation • Response within 2 hours
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">What happens next?</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs">1</span>
                      </div>
                      <span>15-min discovery call to understand your goals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs">2</span>
                      </div>
                      <span>Custom proposal with ROI projections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs">3</span>
                      </div>
                      <span>Implementation starts within 48 hours</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      vendorAvailability?.is_available_now ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      vendorAvailability?.is_available_now ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {vendorAvailability?.is_available_now ? 'Available Now' : 'Available Soon'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vendorAvailability?.availability_message || 
                     (vendorAvailability?.is_available_now ? 
                      'Typically responds within 1 hour' : 
                      'Will respond within 24 hours')}
                  </p>
                  {vendorAvailability?.next_available_slot && (
                    <p className="text-xs text-muted-foreground">
                      Next available: {new Date(vendorAvailability.next_available_slot).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>

              {/* Trust Signals */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-sm">Why Agents Trust Us</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {fc?.trustIndicators && (fc.trustIndicators.guarantee || fc.trustIndicators.cancellation || fc.trustIndicators.certification) ? (
                    <>
                      {fc.trustIndicators.guarantee && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{fc.trustIndicators.guarantee}</span>
                        </div>
                      )}
                      {fc.trustIndicators.cancellation && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{fc.trustIndicators.cancellation}</span>
                        </div>
                      )}
                      {fc.trustIndicators.certification && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{fc.trustIndicators.certification}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>500+ successful implementations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>99% client satisfaction rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>RESPA compliant & fully insured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Money-back guarantee</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Save/Share */}
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    // Add to saved items logic here
                    toast.success("Service saved to your favorites!");
                  }}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: service?.title || 'Check out this service',
                        text: service?.description || 'I found this great service on the marketplace',
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Choose Your Package Section - Full Width */}
        {showPackagesSection && (
          <div className="border-t bg-muted/20 p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Choose Your Package</h2>
              <p className="text-lg text-muted-foreground">Select the perfect plan for your business needs</p>
            </div>
            
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
              role="radiogroup"
              aria-label="Choose your package"
            >
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  role="radio"
                  aria-checked={selectedPackage === pkg.id}
                  tabIndex={0}
                  className={`relative p-6 cursor-pointer transition-all hover:shadow-lg h-full flex flex-col ${
                    selectedPackage === pkg.id ? 'ring-2 ring-primary border-primary shadow-md' : ''
                  } ${pkg.popular ? 'border-primary/50 shadow-sm' : ''}`}
                  onClick={() => setSelectedPackage(pkg.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPackage(pkg.id);
                    }
                  }}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {selectedPackage === pkg.id && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border bg-background/80 backdrop-blur px-2 py-1 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      <span>Selected</span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    
                    <div className="mb-4">
                      {pkg.requestPricing ? (
                        <div className="text-2xl font-bold text-primary">Contact for Pricing</div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-3xl font-bold text-primary">${pkg.price}</div>
                          {pkg.originalPrice && pkg.originalPrice !== pkg.price && (
                            <div className="text-sm text-muted-foreground line-through">
                              ${pkg.originalPrice}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6 flex-1">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      selectedPackage === pkg.id 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackage(pkg.id);
                    }}
                  >
                    {selectedPackage === pkg.id ? 'Selected' : 'Select Package'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Section - Tabs */}
        <div className="border-t bg-muted/20">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 md:gap-2 h-auto p-1">
                <TabsTrigger value="details" className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4 py-2">
                  Service Details
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4 py-2">
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="agent-reviews" className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4 py-2">
                  Agent Reviews
                </TabsTrigger>
                <TabsTrigger value="qa" className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4 py-2">
                  Q&A
                </TabsTrigger>
                <TabsTrigger value="related" className="text-xs md:text-sm whitespace-nowrap px-2 md:px-4 py-2">
                  Related
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Service Benefits</h3>
                    <div className="space-y-2 text-sm">
                      {benefits?.length ? (
                        benefits.map((b: any, i: number) => (
                          <div key={i}>• {b.title}</div>
                        ))
                      ) : fc?.heroDescription ? (
                        <p>{fc.heroDescription}</p>
                      ) : (
                        <>
                          <div>• Professional implementation</div>
                          <div>• Dedicated support team</div>
                          <div>• Custom configuration</div>
                          <div>• Performance monitoring</div>
                          <div>• Regular optimization</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Service Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Category:</strong> {service.category}</p>
                      <p><strong>Duration:</strong> {service.duration || "Flexible"}</p>
                      <div className="flex items-center justify-between">
                        <p><strong>Provider:</strong> {service.vendor?.name || 'Direct Service'}</p>
                        {service.vendor?.website_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(service.vendor.website_url, '_blank')}
                            className="ml-2"
                          >
                            Visit Website
                          </Button>
                        )}
                      </div>
                      {service.estimated_roi && (
                        <p><strong>Est. ROI:</strong> {service.estimated_roi}x</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                  {service.vendor ? (
                    <div className="text-center">
                      <div className="text-3xl font-bold">{service.vendor.rating}</div>
                      {renderStarRating(service.vendor.rating, "lg")}
                      <p className="text-sm text-muted-foreground">{service.vendor.review_count} global ratings</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-lg text-muted-foreground">Direct Service</div>
                      <p className="text-sm text-muted-foreground">No vendor ratings available</p>
                    </div>
                  )}
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2 text-sm">
                          <span>{stars} star</span>
                          <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400" 
                              style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : 5}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground">{stars === 5 ? '70' : stars === 4 ? '20' : '5'}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                            {review.author_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.author_name}</span>
                              {review.verified && (
                                <Badge variant="outline" className="text-xs">
                                  ✓ Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {renderStarRating(review.rating)}
                              <span className="text-sm text-muted-foreground">{formatReviewDate(review.created_at)}</span>
                            </div>
                            <p className="text-sm mb-3">{review.review}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsUp className="w-3 h-3" />
                                Helpful ({review.helpful_count || 0})
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsDown className="w-3 h-3" />
                                Not helpful
                              </button>
                              <button className="hover:text-foreground">
                                Comment
                              </button>
                            </div>
                            
                            {/* Comments Section - Feature coming soon */}
                            <div className="mt-3 ml-4 space-y-2">
                              {/* Comments will be added as a separate feature */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="agent-reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Real Estate Agent Reviews</h3>
                    <Button size="sm">Write Agent Review</Button>
                  </div>
                  
                  {/* Agent Reviews */}
                  <div className="space-y-6">
                    {[
                      {
                        id: 1,
                        agentName: "Patricia Williams",
                        agentTitle: "Senior Agent, Coldwell Banker",
                        license: "FL RE #BK3456789",
                        yearsExperience: 10,
                        rating: 5,
                        date: "January 12, 2025",
                        review: "This service revolutionized my client presentation process. The quality of deliverables is outstanding and it's helped me close 3 additional deals this quarter.",
                        helpful: 18,
                        comments: [
                          { author: "Mark T.", text: "How easy was the setup process?" },
                          { author: "Patricia Williams", text: "Very straightforward! The onboarding team walked me through everything step by step." }
                        ]
                      },
                      {
                        id: 2,
                        agentName: "Carlos Rodriguez",
                        agentTitle: "Top Producer, RE/MAX Excellence",
                        license: "TX RE #123456789",
                        yearsExperience: 7,
                        rating: 5,
                        date: "December 30, 2024",
                        review: "Incredible value for the investment. My clients are impressed with the professional quality and it's definitely given me a competitive edge in listings.",
                        helpful: 25,
                        comments: [
                          { author: "Lisa K.", text: "Would you recommend the premium package?" },
                          { author: "Carlos Rodriguez", text: "Absolutely! The premium features are worth every penny for serious agents." }
                        ]
                      }
                    ].map((agentReview) => (
                      <div key={agentReview.id} className="border rounded-lg p-4 bg-background">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {agentReview.agentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{agentReview.agentName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    ✓ Verified Agent
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{agentReview.agentTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                  License: {agentReview.license} • {agentReview.yearsExperience} years experience
                                </p>
                              </div>
                              <div className="text-right">
                                {renderStarRating(agentReview.rating)}
                                <p className="text-xs text-muted-foreground mt-1">{agentReview.date}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm mb-3">{agentReview.review}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsUp className="w-3 h-3" />
                                Helpful ({agentReview.helpful})
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsDown className="w-3 h-3" />
                                Not helpful
                              </button>
                              <button className="hover:text-foreground">
                                Comment
                              </button>
                            </div>
                            
                            {/* Agent Comments */}
                            <div className="space-y-2">
                              {/* Comments feature will be added later */}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <p className="text-muted-foreground">Questions & Answers section coming soon...</p>
              </TabsContent>
              
              <TabsContent value="related" className="mt-6">
                <div className="space-y-6">
                  {/* More Services Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Related Services from {service.vendor?.name || 'This Provider'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                          <div className="aspect-square bg-muted rounded mb-3">
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="w-12 h-12 text-muted-foreground" />
                            </div>
                          </div>
                          <h4 className="font-medium mb-2">{service.category} Solution {i}</h4>
                          <p className="text-sm text-muted-foreground mb-2">Complementary service for your needs</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">${(parseFloat(service.retail_price || "100") * (0.8 + i * 0.3)).toFixed(0)}</span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Service Videos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="p-4">
                          <div className="aspect-video bg-muted rounded mb-3 relative cursor-pointer hover:bg-muted/80 transition-colors">
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {i + 2}:1{i}
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">How {service.category} Works - Part {i}</h4>
                          <p className="text-sm text-muted-foreground">Learn about our service process</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
      
      {/* Consultation Flow Modal */}
      <ConsultationFlow
        isOpen={isConsultationFlowOpen}
        onClose={() => setIsConsultationFlowOpen(false)}
        service={service}
      />
    </Dialog>
  );
};