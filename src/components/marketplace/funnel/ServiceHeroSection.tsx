import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Award } from "lucide-react";

interface ServiceHeroSectionProps {
  service: any;
  vendor: any;
  selectedPackage: any;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onScheduleConsultation: () => void;
}

export const ServiceHeroSection = ({
  service,
  vendor,
  selectedPackage,
  quantity,
  onQuantityChange,
  onAddToCart,
  onScheduleConsultation
}: ServiceHeroSectionProps) => {
  const heroBannerUrl = vendor?.hero_banner_url;
  const brandColors = vendor?.brand_colors || { primary: "#3b82f6", secondary: "#64748b", accent: "#06b6d4" };
  const valueStatement = vendor?.value_statement || "Professional service delivery";
  const customCTA = vendor?.custom_cta_text || "Get Started";

  return (
    <div className="relative overflow-hidden">
      {/* Hero Banner Background */}
      {heroBannerUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBannerUrl})` }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r opacity-90"
        style={{ 
          background: `linear-gradient(135deg, ${brandColors.primary}15, ${brandColors.accent}15)` 
        }}
      />
      
      <div className="relative px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Service Info */}
          <div className="space-y-6">
            {/* Vendor Badge */}
            <div className="flex items-center gap-3">
              {vendor?.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.business_name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-foreground">{vendor?.business_name}</h3>
                <div className="flex items-center gap-2">
                  {vendor?.is_verified && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">4.8</span>
                    <span className="text-sm text-muted-foreground">(127 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{service.title}</h1>
              <p className="text-lg text-muted-foreground">{valueStatement}</p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Expert Service</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Guaranteed Results</span>
              </div>
            </div>

            {/* Price Display */}
            {selectedPackage && (
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    ${selectedPackage.price}
                  </span>
                  <span className="text-muted-foreground">per service</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPackage.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Action Panel */}
          <div className="bg-card rounded-xl p-6 border shadow-lg">
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuantityChange(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={onAddToCart}
                  style={{ backgroundColor: brandColors.primary }}
                >
                  {customCTA}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onScheduleConsultation}
                >
                  Schedule Consultation
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Industry certified professionals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};