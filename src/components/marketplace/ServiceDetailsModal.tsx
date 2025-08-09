import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  CheckCircle, 
  Crown, 
  ExternalLink, 
  ShoppingCart, 
  MessageCircle,
  TrendingUp,
  Users,
  Award,
  Zap,
  Shield,
  Clock,
  Phone,
  Mail
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ReviewRatingSystem } from "./ReviewRatingSystem";
import { useServiceRatings } from "@/hooks/useServiceRatings";
import { getClickTrackingUrl } from "@/utils/tracking";

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
  funnel_content?: {
    headline: string;
    subheadline: string;
    heroDescription: string;
    estimatedRoi: number;
    duration: string;
    whyChooseUs: {
      title: string;
      benefits: {
        icon: string;
        title: string;
        description: string;
      }[];
    };
    media: any[];
    packages: {
      id: string;
      name: string;
      description: string;
      price: number;
      originalPrice?: number;
      features: string[];
      popular: boolean;
      proOnly?: boolean;
      savings?: string;
    }[];
    socialProof: {
      testimonials: {
        id: string;
        name: string;
        role: string;
        content: string;
        rating: number;
      }[];
      stats: {
        label: string;
        value: string;
      }[];
    };
    trustIndicators: {
      guarantee: string;
      cancellation: string;
      certification: string;
    };
    callToAction: {
      primaryHeadline: string;
      primaryDescription: string;
      primaryButtonText: string;
      secondaryHeadline: string;
      secondaryDescription: string;
      contactInfo: {
        phone: string;
        email: string;
        website: string;
      };
    };
  };
  vendor: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  };
}

interface ServiceDetailsModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDetailsModal = ({ service, isOpen, onClose }: ServiceDetailsModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState("pro");
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isProMember = profile?.is_pro_member || false;

  if (!service) return null;

  const handleAddToCart = (packageType: string) => {
    let price = 0;
    if (packageType === "retail" && service.retail_price) {
      price = parseFloat(service.retail_price.replace(/[^\d.]/g, ""));
    } else if (packageType === "pro" && service.pro_price) {
      price = parseFloat(service.pro_price.replace(/[^\d.]/g, ""));
    } else if (packageType === "copay" && service.co_pay_price) {
      price = parseFloat(service.co_pay_price.replace(/[^\d.]/g, ""));
    }

    addToCart({
      id: service.id,
      title: `${service.title} - ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package`,
      price,
      vendor: service.vendor.name,
      image_url: service.image_url,
      requiresQuote: service.requires_quote,
      type: 'service'
    });

    toast({
      title: "Added to Cart",
      description: `${service.title} has been added to your cart`,
    });
  };

  const features = [
    "Advanced Lead Generation System",
    "Automated Follow-up Campaigns", 
    "CRM Integration & Management",
    "Website & Landing Pages",
    "Social Media Marketing Tools",
    "Analytics & Reporting Dashboard",
    "24/7 Customer Support",
    "Mobile App Access"
  ];

  const packages = [
    {
      id: "retail",
      name: "Standard",
      price: service.retail_price || "100",
      description: "Perfect for individual agents",
      features: features.slice(0, 4),
      popular: false
    },
    {
      id: "pro",
      name: "Circle Pro",
      price: service.pro_price || "100",
      originalPrice: service.retail_price,
      description: "Best value for serious agents",
      features: features.slice(0, 6),
      popular: true,
      proOnly: true
    },
    {
      id: "copay",
      name: "Co-Pay",
      price: service.co_pay_price,
      originalPrice: service.retail_price,
      description: "Maximum savings with Circle benefits",
      features: features,
      popular: false,
      proOnly: true,
      savings: service.discount_percentage
    }
  ].filter(pkg => pkg.price);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-circle-primary to-circle-primary/80 text-white p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-white rounded-xl p-4 flex-shrink-0">
              <img
                src={service.funnel_content?.media?.[0]?.url || service.image_url || "/placeholder.svg"}
                alt={service.funnel_content?.headline || service.title}
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-bold">{service.funnel_content?.headline || service.title}</h2>
                {service.vendor.is_verified && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <p className="text-lg text-white/90 mb-4">{service.funnel_content?.heroDescription || service.description}</p>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{service.vendor.rating} ({service.vendor.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{service.funnel_content?.estimatedRoi || 3}x ROI</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.funnel_content?.duration || "30 days"}</span>
                </div>
              </div>
            </div>
          </div>

          {service.is_featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-white text-circle-primary font-medium">
                <Award className="w-3 h-3 mr-1" />
                Featured Service
              </Badge>
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Key Benefits */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">{service.funnel_content?.whyChooseUs?.title || `Why ${service.title}?`}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {service.funnel_content?.whyChooseUs?.benefits?.length > 0 ? (
                service.funnel_content.whyChooseUs.benefits.slice(0, 3).map((benefit, index) => {
                  const icons = [Zap, Users, TrendingUp];
                  const IconComponent = icons[index % icons.length];
                  
                  return (
                    <Card key={index}>
                      <CardContent className="p-4 text-center">
                        <IconComponent className="w-8 h-8 text-circle-primary mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                // Fallback benefits if no funnel_content
                <>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Zap className="w-8 h-8 text-circle-primary mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Boost Lead Generation</h4>
                      <p className="text-sm text-muted-foreground">Generate 3x more qualified leads</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 text-circle-primary mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Trusted by 10,000+ Agents</h4>
                      <p className="text-sm text-muted-foreground">Join successful real estate professionals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-circle-primary mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">{service.estimated_roi}x ROI Guaranteed</h4>
                      <p className="text-sm text-muted-foreground">See results within {service.duration}</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Pricing Packages */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Choose Your Package</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {(service.funnel_content?.packages?.length > 0 ? service.funnel_content.packages : packages).map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`relative transition-all duration-200 ${
                    pkg.popular ? 'ring-2 ring-circle-primary scale-105' : ''
                  } ${selectedPackage === pkg.id ? 'border-circle-primary' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-circle-primary text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h4 className="text-xl font-bold">{pkg.name}</h4>
                        {(pkg.proOnly || service.funnel_content?.packages) && <Crown className="w-5 h-5 text-circle-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    </div>

                    <div className="text-center mb-4">
                      {(pkg.originalPrice || pkg.originalPrice) && (
                        <div className="text-sm text-muted-foreground line-through">
                          ${pkg.originalPrice}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-circle-primary">
                        ${pkg.price}
                      </div>
                      {pkg.savings && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs mt-1">
                          {pkg.savings} OFF
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-6">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {(pkg.proOnly && !isProMember) ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open('/pricing', '_blank')}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Access
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        variant={pkg.popular ? "default" : "outline"}
                        onClick={() => handleAddToCart(typeof pkg.id === 'string' ? pkg.id : 'default')}
                      >
                        {service.requires_quote ? (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Request Quote
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Service Reviews */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>
            <ReviewRatingSystem serviceId={service.id} />
          </div>

          <Separator className="my-8" />

          {/* Call to Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-r from-circle-primary/5 to-circle-primary/10 border-circle-primary/20">
              <CardContent className="p-6 text-center">
                <h4 className="text-xl font-bold mb-2">{service.funnel_content?.callToAction?.primaryHeadline || "Need More Information?"}</h4>
                <p className="text-muted-foreground mb-4">
                  {service.funnel_content?.callToAction?.primaryDescription || `Visit the official ${service.vendor.name} website for detailed documentation and resources.`}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const dest = service.funnel_content?.callToAction?.contactInfo?.website || `https://${service.vendor.name.toLowerCase().replace(' ', '')}.com`;
                    const url = getClickTrackingUrl(service.id, dest);
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {service.funnel_content?.callToAction?.primaryButtonText || "Visit Official Website"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <h4 className="text-xl font-bold mb-2">{service.funnel_content?.callToAction?.secondaryHeadline || "Questions? We're Here to Help!"}</h4>
                <p className="text-muted-foreground mb-4">
                  {service.funnel_content?.callToAction?.secondaryDescription || "Speak with our experts to find the perfect package for your business."}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Us
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span>{service.funnel_content?.trustIndicators?.guarantee || "30-Day Money Back Guarantee"}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{service.funnel_content?.trustIndicators?.cancellation || "Cancel Anytime"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>{service.funnel_content?.trustIndicators?.certification || "Industry Leader"}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};