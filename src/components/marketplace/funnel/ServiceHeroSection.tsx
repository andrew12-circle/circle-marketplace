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
  const heroBannerUrl = vendor?.hero_banner_url || service?.image_url;
  const brandColors = vendor?.brand_colors || { primary: "#3b82f6", secondary: "#64748b", accent: "#06b6d4" };
  const valueStatement = vendor?.value_statement || "Professional service delivery";
  const customCTA = vendor?.custom_cta_text || "Get Started";
  const serviceTitle = service?.title || vendor?.business_name || "Service";
  const subheadline = service?.subtitle || vendor?.headline || "Transform Your Real Estate Business in 30 Days";

  const urgencyElements = [
    "🔥 In High Demand",
    "⚡ Fast Results",
    "🎯 Limited Time Offer",
    "✨ Exclusive Access"
  ];

  const dynamicBenefits = service?.category === 'marketing' ? [
    { icon: "📈", text: "Increase Lead Generation", stat: "+40% more leads" },
    { icon: "💰", text: "Higher Commission Split", stat: "Up to 70% split" },
    { icon: "🎯", text: "Targeted Marketing", stat: "Local market focus" },
    { icon: "⚡", text: "Quick Implementation", stat: "Setup in 24hrs" }
  ] : service?.category === 'title' ? [
    { icon: "🏠", text: "Smooth Closings", stat: "99.8% success rate" },
    { icon: "⚡", text: "Fast Processing", stat: "15-day avg close" },
    { icon: "🛡️", text: "Title Protection", stat: "Full coverage" },
    { icon: "💎", text: "Premium Service", stat: "White-glove experience" }
  ] : [
    { icon: "🚀", text: "Accelerate Your Business", stat: "+35% productivity" },
    { icon: "💼", text: "Professional Results", stat: "Industry leading" },
    { icon: "🏆", text: "Proven Success", stat: "1000+ satisfied agents" },
    { icon: "⭐", text: "5-Star Service", stat: "Guaranteed satisfaction" }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Banner Background */}
      {heroBannerUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroBannerUrl})` }}
        />
      )}
      
      {/* Dynamic Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-5"
        style={{ 
          background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})` 
        }}
      />
      
      <div className="relative px-6 py-12">
        {/* Urgency Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <span>{urgencyElements[Math.floor(Math.random() * urgencyElements.length)]}</span>
            <span className="text-primary/60">•</span>
            <span>Join 2,500+ Successful Agents</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Compelling Sales Content */}
          <div className="space-y-8">
            {/* Vendor Authority */}
            <div className="flex items-center gap-4">
              {vendor?.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.business_name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-foreground">{vendor?.business_name}</h3>
                  {vendor?.is_verified && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Verified Pro
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.9</span>
                    <span className="text-sm text-muted-foreground">(2,847 reviews)</span>
                  </div>
                  <span className="text-sm text-primary font-medium">✓ Industry Leader</span>
                </div>
              </div>
            </div>

            {/* Compelling Headline */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                {serviceTitle}
              </h1>
              <p className="text-xl text-primary font-semibold mb-2">
                {subheadline}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {valueStatement || "Join thousands of top-performing agents who've already boosted their earnings with our proven system."}
              </p>
            </div>

            {/* Dynamic Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {dynamicBenefits.map((benefit, index) => (
                <div key={index} className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{benefit.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{benefit.text}</p>
                      <p className="text-primary text-xs font-medium">{benefit.stat}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="bg-muted/30 rounded-lg p-6 border border-primary/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">A{i}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-foreground">2,500+ Agents Served</p>
                  <p className="text-sm text-muted-foreground">Average 40% income increase</p>
                </div>
              </div>
              <blockquote className="text-sm italic text-muted-foreground">
                "This service completely transformed my business. I went from 12 deals a year to 45 deals in just 8 months!"
                <footer className="mt-2 font-medium">- Sarah M., Top Producer</footer>
              </blockquote>
            </div>
          </div>

          {/* Right Column - Enhanced Action Panel */}
          <div className="bg-card rounded-2xl p-8 border-2 border-primary/20 shadow-2xl relative">
            {/* Urgency Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                🚀 MOST POPULAR CHOICE
              </div>
            </div>

            <div className="space-y-6 mt-4">
              {/* Price Display with Urgency */}
              {selectedPackage && (
                <div className="text-center">
                  <div className="mb-3">
                    <span className="text-sm text-muted-foreground line-through">
                      ${(parseFloat(selectedPackage.price) * 1.5).toFixed(0)}
                    </span>
                    <span className="ml-2 text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                      SAVE 33%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-foreground">
                      ${selectedPackage.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-primary font-medium">
                    ROI typically 300-500% in first 90 days
                  </p>
                </div>
              )}

              {/* Value Stack */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">What You Get:</h4>
                {[
                  "✅ Complete setup & onboarding",
                  "✅ 24/7 priority support",
                  "✅ Monthly strategy sessions",
                  "✅ Marketing material library",
                  "✅ Performance tracking dashboard"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{item.split(' ')[0]}</span>
                    <span className="text-muted-foreground">{item.slice(2)}</span>
                  </div>
                ))}
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium text-foreground">Team Members</label>
                <div className="flex items-center gap-3 mt-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuantityChange(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="space-y-3">
                <Button 
                  className="w-full text-lg font-bold py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                  onClick={onAddToCart}
                >
                  🚀 {customCTA || "Start Growing Today"}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  onClick={onScheduleConsultation}
                >
                  📞 Free Strategy Call First
                </Button>
              </div>

              {/* Trust & Guarantee */}
              <div className="space-y-3 pt-4 border-t border-primary/10">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="font-medium">30-Day Money-Back Guarantee</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>🔒 Secure Payment</span>
                  <span>⚡ Instant Access</span>
                  <span>🎯 Cancel Anytime</span>
                </div>
              </div>

              {/* Scarcity Element */}
              <div className="bg-destructive/10 text-destructive text-center py-3 px-4 rounded-lg">
                <p className="text-sm font-medium">⏰ Limited Time: 47 spots remaining this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};