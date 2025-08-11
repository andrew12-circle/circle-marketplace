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
  X,
  Play
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
    logo_url?: string;
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
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
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
                  {service.vendor?.is_verified && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
                      <Verified className="w-3 h-3 mr-1" />
                      Verified Pro
                    </Badge>
                  )}
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                    <Trophy className="w-3 h-3 mr-1" />
                    Premium Provider
                  </Badge>
                  {service.estimated_roi && (
                    <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 backdrop-blur-sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {service.estimated_roi}% ROI
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

                    {service.vendor && (
                      <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                        <div className="flex items-center gap-2">
                          {renderStarRating(service.vendor.rating, "lg")}
                          <span className="text-lg font-medium">
                            {service.vendor.rating}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-6 bg-white/30" />
                        <span className="text-sm text-blue-200">
                          {service.vendor.review_count}+ reviews
                        </span>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-2xl font-bold">600%</div>
                        <div className="text-xs text-blue-200">Avg ROI</div>
                      </div>
                      <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-2xl font-bold">30</div>
                        <div className="text-xs text-blue-200">Days Setup</div>
                      </div>
                      <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-2xl font-bold">24/7</div>
                        <div className="text-xs text-blue-200">Support</div>
                      </div>
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
                      <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 cursor-pointer hover-scale">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                          <Play className="w-8 h-8 text-white/60" />
                        </div>
                      </div>
                      <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 cursor-pointer hover-scale">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                          <TrendingUp className="w-8 h-8 text-white/60" />
                        </div>
                      </div>
                      <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 cursor-pointer hover-scale">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-600/20 to-blue-600/20">
                          <Users className="w-8 h-8 text-white/60" />
                        </div>
                      </div>
                      <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 cursor-pointer hover-scale">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-600/20 to-red-600/20">
                          <Trophy className="w-8 h-8 text-white/60" />
                        </div>
                      </div>
                    </div>

                    {/* Vendor Logo */}
                    {service.vendor?.logo_url && (
                      <div className="absolute -bottom-6 left-6">
                        <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                          <img
                            src={service.vendor.logo_url}
                            alt={`${service.vendor?.name || 'Vendor'} logo`}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="bg-gray-50/50 py-12">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left Column - Key Questions */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-6">
                    {/* Question 1 */}
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                          What is this and why should I care?
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {fc?.heroDescription || service.description || "All-in-one real estate lead generation & CRM platform designed to turn online leads into closings faster"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Question 2 */}
                    <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                          How much will this cost me?
                        </h3>
                        <div className="space-y-3">
                          {selectedPkg ? (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{selectedPkg.name}:</span>
                                <span className="text-2xl font-bold text-green-600">${selectedPkg.price}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{selectedPkg.description}</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">Contact for custom pricing</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Question 3 - ROI */}
                    <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                          What's My ROI Potential?
                        </h3>
                        
                        {/* ROI Calculator Integration */}
                        {(service.funnel_content as any)?.roiCalculator?.enabled ? (
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                            <h4 className="font-bold text-lg mb-4 text-purple-900">
                              {(service.funnel_content as any).roiCalculator.title || 'Personal ROI Calculator'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Current monthly closings:</span>
                                  <span className="font-medium">{(service.funnel_content as any).roiCalculator.currentMonthlyClosings || 3} deals</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Average commission:</span>
                                  <span className="font-medium">${((service.funnel_content as any).roiCalculator.averageCommission || 8500).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">With our system:</span>
                                  <span className="font-medium text-green-600">
                                    {(((service.funnel_content as any).roiCalculator.currentMonthlyClosings || 3) * ((service.funnel_content as any).roiCalculator.increasePercentage || 150) / 100 + ((service.funnel_content as any).roiCalculator.currentMonthlyClosings || 3)).toFixed(1)} deals
                                  </span>
                                </div>
                              </div>
                              <div className="bg-white/70 p-4 rounded-lg border">
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-green-600">
                                    +${((service.funnel_content as any).roiCalculator.calculatedAdditionalIncome || 38250).toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">Additional Monthly Income</div>
                                  <div className="text-lg font-semibold text-green-600 mt-2">
                                    +${((service.funnel_content as any).roiCalculator.calculatedAnnualIncrease || 459000).toLocaleString()}/year
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-green-600 mb-2">600% ROI</div>
                              <div className="text-gray-600 mb-4">Average return on investment</div>
                              <div className="bg-white/70 p-4 rounded-lg">
                                <div className="text-lg font-semibold">Investment: $1,600 → Returns: $9,600+</div>
                                <div className="text-sm text-gray-600 mt-1">1 extra closing per month covers your cost 5x over</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Media Gallery */}
                        {(service.funnel_content as any)?.thumbnailGallery?.enabled && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3 text-gray-900">See It In Action</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {(service.funnel_content as any).thumbnailGallery.items?.map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="aspect-video bg-gray-100 rounded-lg overflow-hidden border cursor-pointer hover:border-purple-400 transition-all hover-scale"
                                  onClick={() => setActiveMediaUrl(item.url)}
                                >
                                  {(() => {
                                    const thumb = item.thumbnail || item.url;
                                    const ytId = thumb ? getYouTubeId(thumb) : null;
                                    const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                                    return ytThumb || thumb ? (
                                      <div className="relative w-full h-full">
                                        <img
                                          src={ytThumb || thumb}
                                          alt={item.label ? `${item.label} thumbnail` : 'Media thumbnail'}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                        {ytId && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                                              <Play className="w-4 h-4 text-white ml-0.5" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                                        {item.icon === 'video' && <Play className="w-8 h-8 text-red-500" />}
                                        {item.icon === 'chart' && <TrendingUp className="w-8 h-8 text-green-500" />}
                                        {item.icon === 'book' && <Building className="w-8 h-8 text-blue-500" />}
                                        {item.icon === 'trophy' && <Trophy className="w-8 h-8 text-yellow-500" />}
                                        <span className="text-xs text-center mt-2 px-2 text-gray-600">{item.label}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Question 4 */}
                    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">4</div>
                          How Soon Will I See Results?
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">Setup: 24-48 hours</div>
                              <div className="text-sm text-gray-600">Complete onboarding and configuration</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">First leads: 1-2 weeks</div>
                              <div className="text-sm text-gray-600">Initial lead generation begins</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium">Closings: 30-90 days</div>
                              <div className="text-sm text-gray-600">First conversions to closed deals</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Question 5 - What's Included */}
                    <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">5</div>
                          What's Included?
                        </h3>
                        
                        <div className="space-y-6">
                          {/* Core Features */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Core Features</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                                <span className="text-gray-700">IDX website</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                                <span className="text-gray-700">CRM with auto-drip</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                                <span className="text-gray-700">Facebook & Google ad integration</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                                <span className="text-gray-700">Text & email automation</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
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
                      </CardContent>
                    </Card>

                    {/* Question 6 - Proof It Works */}
                    <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">6</div>
                          Proof It Works
                        </h3>
                        
                        <div className="space-y-6">
                          {/* Agent Reviews */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500" />
                              Agent Reviews
                            </h4>
                            <div className="space-y-3">
                              <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-3 mb-2">
                                  {renderStarRating(5)}
                                  <span className="font-medium text-gray-900">Sarah M., Keller Williams</span>
                                </div>
                                <p className="text-gray-700 italic">"Doubled my leads in 60 days. The automation saves me 15 hours per week!"</p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-3 mb-2">
                                  {renderStarRating(5)}
                                  <span className="font-medium text-gray-900">Mike R., RE/MAX</span>
                                </div>
                                <p className="text-gray-700 italic">"ROI was 400% in the first quarter. Game changer for my business."</p>
                              </div>
                            </div>
                          </div>

                          {/* Case Study Snapshot */}
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

                          {/* Vendor Verification */}
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
                        </div>
                      </CardContent>
                    </Card>

                    {/* Question 7 - How to Get Started */}
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">7</div>
                          How Do I Get Started?
                        </h3>
                        
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
                              onClick={handleAddToCart}
                              className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-2 rounded-lg"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                         </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Column - Simple Pricing */}
                <div className="space-y-6">
                  {/* Pricing Section */}
                  <Card className="sticky top-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 animate-fade-in">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Pricing</h3>
                      
                      {/* Main Price Display */}
                      <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-gray-900 mb-1">
                          ${service.retail_price || '999'}
                        </div>
                        <div className="text-sm text-gray-600">One-time setup fee</div>
                        {service.discount_percentage && (
                          <Badge className="mt-2 bg-green-500">
                            {service.discount_percentage}% Off
                          </Badge>
                        )}
                      </div>

                      {/* Key Features */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">Complete setup & training</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">24/7 support included</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">30-day money back guarantee</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setIsConsultationFlowOpen(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                          Get Started Now
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleAddToCart}
                          className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl font-semibold"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Testimonials */}
                  {(service.funnel_content as any)?.testimonialCards?.enabled && (
                    <Card className="shadow-lg animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">
                          {(service.funnel_content as any).testimonialCards.title || 'Success Stories'}
                        </h3>
                        <div className="space-y-4">
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
                            <div key={card.id} className="p-4 bg-gray-50 rounded-xl border">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {card.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{card.name}</div>
                                  <div className="text-sm text-gray-600">{card.role}</div>
                                  <p className="text-sm text-gray-700 mt-2 italic">"{card.content}"</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {renderStarRating(card.rating)}
                                    <span className="text-xs text-gray-500">{card.timeAgo}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Section 8 - Full Width Pricing */}
              <div className="mt-12">
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">8</div>
                      Choose Your Package
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {packages.slice(0, 4).map((pkg, index) => (
                        <div
                          key={pkg.id}
                          className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover-scale ${
                            selectedPackage === pkg.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${pkg.popular ? 'ring-2 ring-blue-200' : ''}`}
                          onClick={() => setSelectedPackage(pkg.id)}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
                            </div>
                          )}
                          
                          <div className="text-center mb-4">
                            <h4 className="font-bold text-lg text-gray-900 mb-2">{pkg.name}</h4>
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              ${pkg.requestPricing ? 'Quote' : pkg.price}
                            </div>
                            {pkg.originalPrice && !pkg.requestPricing && (
                              <div className="text-sm text-gray-500 line-through">
                                was ${pkg.originalPrice}
                              </div>
                            )}
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
                            className={`w-full ${
                              selectedPackage === pkg.id 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPackage(pkg.id);
                            }}
                          >
                            {selectedPackage === pkg.id ? 'Selected' : 'Select Package'}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4 justify-center">
                      <Button 
                        onClick={() => setIsConsultationFlowOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        Get Started with {selectedPkg?.name || 'Selected Package'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleAddToCart}
                        className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-xl font-semibold"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart - ${selectedPkg?.price || '0'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
                </div>

                {/* Right Column - Package Selection & Testimonials */}
                <div className="space-y-6">
                  {/* Pricing Section */}
                  <Card className="sticky top-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 animate-fade-in">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Pricing</h3>
                      
                      {/* Main Price Display */}
                      <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-gray-900 mb-1">
                          ${service.retail_price || '999'}
                        </div>
                        <div className="text-sm text-gray-600">One-time setup fee</div>
                        {service.discount_percentage && (
                          <Badge className="mt-2 bg-green-500">
                            {service.discount_percentage}% Off
                          </Badge>
                        )}
                      </div>

                      {/* Key Features */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">Complete setup & training</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">24/7 support included</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">30-day money back guarantee</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setIsConsultationFlowOpen(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                          Get Started Now
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleAddToCart}
                          className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl font-semibold"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Testimonials */}
                  {(service.funnel_content as any)?.testimonialCards?.enabled && (
                    <Card className="shadow-lg animate-fade-in">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">
                          {(service.funnel_content as any).testimonialCards.title || 'Success Stories'}
                        </h3>
                        <div className="space-y-4">
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
                            <div key={card.id} className="p-4 bg-gray-50 rounded-xl border">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {card.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{card.name}</div>
                                  <div className="text-sm text-gray-600">{card.role}</div>
                                  <p className="text-sm text-gray-700 mt-2 italic">"{card.content}"</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {renderStarRating(card.rating)}
                                    <span className="text-xs text-gray-500">{card.timeAgo}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                  </Card>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation Flow Modal */}
        {isConsultationFlowOpen && (
          <ConsultationFlow
            isOpen={isConsultationFlowOpen}
            onClose={() => setIsConsultationFlowOpen(false)}
            service={service}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};