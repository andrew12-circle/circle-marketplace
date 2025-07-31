import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedPackage, setSelectedPackage] = useState("standard");
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
  
  // Use funnel content packages if available, otherwise fallback to default packages
  const packages = service.funnel_content?.packages?.length ? 
    service.funnel_content.packages : [
      {
        id: "basic",
        name: "Basic Package",
        price: parseFloat(service.retail_price || "100") * 0.75,
        originalPrice: parseFloat(service.retail_price || "100"),
        description: "Essential service features for getting started",
        features: ["Core service delivery", "Email support", "Basic reporting"]
      },
      {
        id: "standard",
        name: "Standard Package", 
        price: parseFloat(service.retail_price || "100"),
        originalPrice: parseFloat(service.retail_price || "100") * 1.33,
        description: "Complete solution for most needs",
        features: ["Everything in Basic", "Priority support", "Advanced reporting", "Custom consultation"],
        popular: true
      },
      {
        id: "premium",
        name: "Premium Package",
        price: parseFloat(service.retail_price || "100") * 1.5,
        originalPrice: parseFloat(service.retail_price || "100") * 2,
        description: "Full-service solution with dedicated support",
        features: ["Everything in Standard", "Dedicated account manager", "24/7 support", "Custom integrations"]
      }
    ];

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage) || packages[1];

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

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      author: "Jennifer Martinez",
      title: "Top Producer, Realty One Group",
      rating: 5,
      date: "January 15, 2025",
      verified: true,
      review: "This service completely transformed my marketing approach. Saw a 150% increase in qualified leads within the first month. The team was professional and delivered exactly what they promised.",
      helpful: 28,
      comments: [
        { author: "Mike R.", text: "What was your favorite feature of the service?" },
        { author: "Jennifer Martinez", text: "The automated lead nurturing system was a game-changer for my workflow." }
      ]
    },
    {
      id: 2,
      author: "Robert Chen",
      title: "Century 21 Elite",
      rating: 5,
      date: "December 22, 2024",
      verified: true,
      review: "Outstanding ROI and excellent customer service. The implementation was smooth and the results exceeded my expectations. Highly recommend for any serious real estate professional.",
      helpful: 19,
      comments: [
        { author: "Sarah K.", text: "How long did implementation take?" },
        { author: "Robert Chen", text: "About 2 weeks from start to full deployment. Very smooth process." }
      ]
    },
    {
      id: 3,
      author: "Amanda Thompson",
      title: "Keller Williams Premier",
      rating: 4,
      date: "November 30, 2024",
      verified: true,
      review: "Great service overall with solid results. The only minor issue was initial setup took longer than expected, but support was very helpful throughout.",
      helpful: 15,
      comments: [
        { author: "Tom W.", text: "Would you purchase again?" },
        { author: "Amanda Thompson", text: "Absolutely! Already planning to upgrade to the premium package." }
      ]
    }
  ];

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                {service.funnel_content?.subHeadline || "Transform your real estate business with our proven system"}
              </p>
              {service.vendor && (
                <div className="flex items-center gap-4">
                  {renderStarRating(service.vendor.rating, "lg")}
                  <span className="text-lg">
                    {service.vendor.rating} ({service.vendor.review_count}+ reviews)
                  </span>
                </div>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-2xl font-bold mb-4">Why Choose {service.vendor?.name || 'This Service'}?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 rounded-full p-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-lg">Average 250% ROI increase</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 rounded-full p-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-lg">500+ successful implementations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 rounded-full p-1">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-lg">Setup in 7 days or less</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column - Media and Social Proof */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Image/Video */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
              {(service.funnel_content?.media?.[0]?.url || service.image_url) ? (
                <img 
                  src={service.funnel_content?.media?.[0]?.url || service.image_url} 
                  alt={service.funnel_content?.headline || service.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                  <Building className="w-24 h-24 text-blue-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
                </Button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Demo Video", icon: "video" },
                { label: "Case Study", icon: "chart" },
                { label: "Training", icon: "book" },
                { label: "Results", icon: "trophy" }
              ].map((item, i) => (
                <div key={i} className="aspect-square bg-muted rounded border-2 border-transparent hover:border-primary cursor-pointer relative overflow-hidden">
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

            {/* Social Proof Cards */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Recent Success Stories</h3>
              <div className="space-y-3">
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Sarah M. - Keller Williams</p>
                      <p className="text-sm text-muted-foreground">"Increased my closing rate by 180% in just 3 months!"</p>
                      <div className="flex items-center gap-1 mt-1">
                        {renderStarRating(5)}
                        <span className="text-xs text-muted-foreground ml-2">2 days ago</span>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Mike R. - RE/MAX</p>
                      <p className="text-sm text-muted-foreground">"ROI was 320% in the first quarter alone."</p>
                      <div className="flex items-center gap-1 mt-1">
                        {renderStarRating(5)}
                        <span className="text-xs text-muted-foreground ml-2">1 week ago</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Middle Column - Value Proposition */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">What You'll Get</h2>
              <div className="space-y-4">
                {service.funnel_content?.benefits?.length ? 
                  service.funnel_content.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-2 mt-1">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  )) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-2 mt-1">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Proven Lead Generation System</h3>
                        <p className="text-sm text-muted-foreground">Our proprietary system that's generated over $50M in commissions for our clients</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2 mt-1">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Complete Setup & Training</h3>
                        <p className="text-sm text-muted-foreground">White-glove implementation with 1-on-1 training sessions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 rounded-full p-2 mt-1">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Ongoing Support & Optimization</h3>
                        <p className="text-sm text-muted-foreground">Dedicated account manager and monthly strategy calls</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* ROI Calculator */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
              <h3 className="font-bold text-lg mb-3">ROI Calculator</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Current monthly closings:</span>
                  <span className="font-medium">3 deals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average commission:</span>
                  <span className="font-medium">$8,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">With our system (150% increase):</span>
                  <span className="font-medium text-green-600">7.5 deals</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Additional monthly income:</span>
                  <span className="text-green-600">+$38,250</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Annual increase:</span>
                  <span className="text-green-600 font-semibold">+$459,000</span>
                </div>
              </div>
            </div>

            {/* Time Investment */}
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

            {/* Urgency */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-red-700">Limited Availability</span>
              </div>
              <p className="text-sm text-red-600">
                We only take on 5 new clients per month to ensure quality service. 
                <span className="font-semibold"> 2 spots remaining this month.</span>
              </p>
            </div>
          </div>

          {/* Right Column - CTA and Contact */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <Card className="p-6 space-y-4 border-2 border-primary">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Ready to Transform Your Business?</h3>
                  <p className="text-sm text-muted-foreground">Custom pricing based on your specific needs</p>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold" 
                    size="lg"
                    onClick={() => setIsConsultationFlowOpen(true)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Free Consultation
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
                </div>
              </Card>

              {/* Save/Share */}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Heart className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Tabs */}
        <div className="border-t bg-muted/20">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Service Details</TabsTrigger>
                <TabsTrigger value="reviews">Customer Reviews</TabsTrigger>
                <TabsTrigger value="agent-reviews">Agent Reviews</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="related">Related Services</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Service Benefits</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Professional implementation</li>
                      <li>• Dedicated support team</li>
                      <li>• Custom configuration</li>
                      <li>• Performance monitoring</li>
                      <li>• Regular optimization</li>
                    </ul>
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
                            {review.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.author}</span>
                              {review.verified && (
                                <Badge variant="outline" className="text-xs">
                                  ✓ Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {renderStarRating(review.rating)}
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <p className="text-sm mb-3">{review.review}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsUp className="w-3 h-3" />
                                Helpful ({review.helpful})
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsDown className="w-3 h-3" />
                                Not helpful
                              </button>
                              <button className="hover:text-foreground">
                                Comment
                              </button>
                            </div>
                            
                            {/* Comments Section */}
                            <div className="mt-3 ml-4 space-y-2">
                              {review.comments.map((comment, i) => (
                                <div key={i} className="text-xs bg-muted/50 p-2 rounded">
                                  <span className="font-medium">{comment.author}</span> replied: "{comment.text}"
                                </div>
                              ))}
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
                              {agentReview.comments.map((comment, i) => (
                                <div key={i} className="bg-muted/30 p-3 rounded-lg text-sm">
                                  <span className="font-medium text-primary">{comment.author}:</span>
                                  <span className="ml-2">{comment.text}</span>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" className="text-xs">
                                Add a comment
                              </Button>
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