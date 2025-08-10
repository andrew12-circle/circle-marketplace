import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Play, PhoneCall, ShoppingCart, CheckCircle2, X, ExternalLink } from "lucide-react";

interface RebuiltFunnelTopProps {
  service: any;
  vendor: any;
  selectedPackage: any;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onAddToCart: () => void;
  onScheduleConsultation: () => void;
  onClose?: () => void;
}

export const RebuiltFunnelTop: React.FC<RebuiltFunnelTopProps> = ({
  service,
  vendor,
  selectedPackage,
  quantity,
  onQuantityChange,
  onAddToCart,
  onScheduleConsultation,
  onClose,
}) => {
  const fc = service?.funnel_content || {};

  // HERO DATA
  const heroTitle = fc.hero?.title ?? service?.title ?? "";
  const heroSubtitle = fc.hero?.subtitle ?? vendor?.value_statement ?? service?.subtitle ?? "";
  const heroTags: Array<{ text: string; color?: string }> = fc.hero?.tags ?? [];
  const rating = fc.hero?.rating ?? service?.avg_rating ?? undefined;
  const reviewCount = fc.hero?.reviewCount ?? service?.review_count ?? undefined;
  const benefitsTitle = fc.hero?.benefits?.title ?? "Why Choose This Service?";
  const benefitsItems: Array<{ text: string }> = fc.hero?.benefits?.items ?? [];

  // MEDIA
  const mainMedia = fc.media?.main ?? service?.image_url ?? "";
  const mediaSpots = fc.media?.spots ?? [];
  const showPlayOverlay = fc.media?.showPlayButton ?? false;

  // TESTIMONIALS
  const testimonialsTitle = fc.testimonials?.title ?? "Recent Success Stories";
  const testimonialsItems: Array<{ quote: string; author?: string; company?: string; date?: string }> =
    fc.testimonials?.items ?? [];

  // VALUE PROPS
  const valueTitle = fc.valueProps?.title ?? "What You'll Get";
  const valueItems: Array<{ title: string; description?: string }> = fc.valueProps?.items ?? [];

  // ROI
  const roi = fc.roi ?? { title: "Potential ROI Calculator", currentClosings: 3, avgCommission: 8500, increasePercent: 150 };
  const newDeals = useMemo(() => roi.currentClosings * (1 + (roi.increasePercent || 0) / 100), [roi]);
  const additionalIncome = useMemo(() => (newDeals - roi.currentClosings) * (roi.avgCommission || 0), [newDeals, roi]);
  const annualIncrease = useMemo(() => additionalIncome * 12, [additionalIncome]);

  // CTA
  const ctaTitle = fc.cta?.title ?? "Ready to Transform Your Business?";
  const ctaSubtitle = fc.cta?.subtitle ?? (selectedPackage ? `${selectedPackage?.name} • ${selectedPackage?.price}` : "Custom pricing based on your needs");
  const ctaButtons: Array<{ text: string; primary?: boolean; action?: "consult" | "cart" | "website" }> =
    (fc.cta?.buttons || []).map((b: any) => ({ text: b.text, primary: b.primary, action: b.action }))
    || [];
  const ctaNote = fc.cta?.note ?? "Free consultation • No obligation • Fast response";

  // TRUST
  const trustTitle = fc.trustSignals?.title ?? "Why Agents Trust Us";
  const trustItems: string[] = fc.trustSignals?.items ?? [];

  const [activeMedia, setActiveMedia] = useState<string>(mainMedia);

  const handleCtaClick = (btn: { text: string; primary?: boolean; action?: "consult" | "cart" | "website" }) => {
    if (btn.action === "cart") return onAddToCart();
    if (btn.action === "website" && vendor?.website) {
      return window.open(vendor.website, '_blank', 'noopener,noreferrer');
    }
    // default to consultation
    return onScheduleConsultation();
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 md:p-8 rounded-b-xl">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-background/30 backdrop-blur hover:bg-background/50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {heroTags?.map((tag, i) => (
                <span key={i} className="bg-background/20 text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {tag.text}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{heroTitle}</h1>
            {heroSubtitle && <p className="text-base md:text-lg text-primary-foreground/90">{heroSubtitle}</p>}
            {(rating || reviewCount) && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center">
                  {Array.from({ length: Math.round(rating || 0) }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-sm md:text-base font-semibold">
                  {rating ? `${rating.toFixed ? rating.toFixed(1) : rating}` : ""}
                  {reviewCount ? ` (${reviewCount} reviews)` : ""}
                </span>
              </div>
            )}
          </div>
          <div className="bg-background/10 backdrop-blur-sm rounded-lg p-5 border border-primary/20">
            <h3 className="text-xl md:text-2xl font-bold mb-3">{benefitsTitle}</h3>
            <div className="space-y-3">
              {benefitsItems?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base md:text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 p-6 md:p-8">
        {/* Left Column - Media + Social Proof */}
        <div className="lg:col-span-5 space-y-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
            {activeMedia?.endsWith(".mp4") ? (
              <video src={activeMedia} controls className="w-full h-full object-cover" />
            ) : (
              <img src={activeMedia} alt={service?.title ?? "Service media"} className="w-full h-full object-contain" />
            )}
            {showPlayOverlay && !activeMedia?.endsWith(".mp4") && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/10">
                <div className="h-16 w-16 rounded-full bg-background/40 backdrop-blur flex items-center justify-center">
                  <Play className="h-8 w-8 text-foreground" />
                </div>
              </div>
            )}
          </div>
          
          {/* Media Spots - 4 specific spots that can be conditionally shown */}
          <div className="grid grid-cols-4 gap-3">
            {/* Demo Spot */}
            {mediaSpots.find((spot: any) => spot.type === 'demo') && (
              <button
                onClick={() => setActiveMedia(mediaSpots.find((spot: any) => spot.type === 'demo').src)}
                className={`aspect-video rounded-lg border-2 overflow-hidden transition-all ${
                  activeMedia === mediaSpots.find((spot: any) => spot.type === 'demo').src ? "border-primary shadow-md" : "border-muted hover:border-primary/50"
                }`}
                aria-label="View Demo"
              >
                <div className="relative w-full h-full bg-muted flex items-center justify-center">
                  {mediaSpots.find((spot: any) => spot.type === 'demo').src?.endsWith('.mp4') ? (
                    <video src={mediaSpots.find((spot: any) => spot.type === 'demo').src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaSpots.find((spot: any) => spot.type === 'demo').src} alt="Demo" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="bg-background/80 rounded px-2 py-1">
                      <span className="text-xs font-medium text-foreground">Demo</span>
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            {/* Case Study Spot */}
            {mediaSpots.find((spot: any) => spot.type === 'case-study') && (
              <button
                onClick={() => setActiveMedia(mediaSpots.find((spot: any) => spot.type === 'case-study').src)}
                className={`aspect-video rounded-lg border-2 overflow-hidden transition-all ${
                  activeMedia === mediaSpots.find((spot: any) => spot.type === 'case-study').src ? "border-primary shadow-md" : "border-muted hover:border-primary/50"
                }`}
                aria-label="View Case Study"
              >
                <div className="relative w-full h-full bg-muted flex items-center justify-center">
                  {mediaSpots.find((spot: any) => spot.type === 'case-study').src?.endsWith('.mp4') ? (
                    <video src={mediaSpots.find((spot: any) => spot.type === 'case-study').src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaSpots.find((spot: any) => spot.type === 'case-study').src} alt="Case Study" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="bg-background/80 rounded px-2 py-1">
                      <span className="text-xs font-medium text-foreground">Case Study</span>
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            {/* Features Spot */}
            {mediaSpots.find((spot: any) => spot.type === 'features') && (
              <button
                onClick={() => setActiveMedia(mediaSpots.find((spot: any) => spot.type === 'features').src)}
                className={`aspect-video rounded-lg border-2 overflow-hidden transition-all ${
                  activeMedia === mediaSpots.find((spot: any) => spot.type === 'features').src ? "border-primary shadow-md" : "border-muted hover:border-primary/50"
                }`}
                aria-label="View Features"
              >
                <div className="relative w-full h-full bg-muted flex items-center justify-center">
                  {mediaSpots.find((spot: any) => spot.type === 'features').src?.endsWith('.mp4') ? (
                    <video src={mediaSpots.find((spot: any) => spot.type === 'features').src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaSpots.find((spot: any) => spot.type === 'features').src} alt="Features" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="bg-background/80 rounded px-2 py-1">
                      <span className="text-xs font-medium text-foreground">Features</span>
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            {/* Results Spot */}
            {mediaSpots.find((spot: any) => spot.type === 'results') && (
              <button
                onClick={() => setActiveMedia(mediaSpots.find((spot: any) => spot.type === 'results').src)}
                className={`aspect-video rounded-lg border-2 overflow-hidden transition-all ${
                  activeMedia === mediaSpots.find((spot: any) => spot.type === 'results').src ? "border-primary shadow-md" : "border-muted hover:border-primary/50"
                }`}
                aria-label="View Results"
              >
                <div className="relative w-full h-full bg-muted flex items-center justify-center">
                  {mediaSpots.find((spot: any) => spot.type === 'results').src?.endsWith('.mp4') ? (
                    <video src={mediaSpots.find((spot: any) => spot.type === 'results').src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaSpots.find((spot: any) => spot.type === 'results').src} alt="Results" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="bg-background/80 rounded px-2 py-1">
                      <span className="text-xs font-medium text-foreground">Results</span>
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {!!testimonialsItems?.length && (
            <div className="space-y-3">
              <h3 className="font-bold text-base md:text-lg">{testimonialsTitle}</h3>
              <div className="space-y-3">
                {testimonialsItems.map((t, i) => (
                  <div key={i} className="p-4 border-l-4 border-green-500 bg-muted rounded-r-lg">
                    <p className="font-medium">“{t.quote}”</p>
                    {(t.author || t.company || t.date) && (
                      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{[t.author, t.company].filter(Boolean).join(" – ")}</span>
                        <span>{t.date}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Value + ROI */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-3">{valueTitle}</h2>
            <div className="space-y-4">
              {valueItems?.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{v.title}</h3>
                    {v.description && <p className="text-sm text-muted-foreground">{v.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg border border-border">
            <h3 className="font-bold text-base md:text-lg mb-3">{roi.title}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current monthly closings</span>
                <span className="font-medium">{roi.currentClosings} deals</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average commission</span>
                <span className="font-medium">${roi.avgCommission?.toLocaleString?.("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }) || `$${roi.avgCommission}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">With our system ({roi.increasePercent}% increase)</span>
                <span className="font-semibold text-green-600">{newDeals.toFixed(1)} deals</span>
              </div>
              <hr className="my-2 border-border" />
              <div className="flex justify-between text-base font-bold">
                <span>Additional monthly income</span>
                <span className="text-green-600">+
                  {additionalIncome.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual increase</span>
                <span className="text-green-600 font-semibold">+
                  {annualIncrease.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sticky CTA */}
        <div className="lg:col-span-3">
          <div className="sticky top-8 space-y-4">
            <div className="p-5 space-y-4 border border-primary/40 bg-card rounded-lg shadow">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold">{ctaTitle}</h3>
                {ctaSubtitle && <p className="text-sm text-muted-foreground">{ctaSubtitle}</p>}
              </div>
              <div className="space-y-3">
                {(ctaButtons?.length ? ctaButtons : [
                  { text: "Free Consultation", primary: true, action: "consult" as const },
                  { text: "Add to Cart", primary: false, action: "cart" as const },
                  { text: "Website", primary: false, action: "website" as const },
                ]).map((btn, i) => (
                  <Button
                    key={i}
                    onClick={() => handleCtaClick(btn)}
                    variant={btn.primary ? "default" : "outline"}
                    className="w-full"
                  >
                    {btn.action === "cart" ? (
                      <ShoppingCart className="h-5 w-5 mr-2" />
                    ) : btn.action === "website" ? (
                      <ExternalLink className="h-5 w-5 mr-2" />
                    ) : (
                      <PhoneCall className="h-5 w-5 mr-2" />
                    )}
                    {btn.text}
                  </Button>
                ))}
                {vendor?.website && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => window.open(vendor.website, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View Actual Website
                  </Button>
                )}
                <div className="text-center pt-1">
                  <p className="text-xs text-muted-foreground">{ctaNote}</p>
                </div>
              </div>
              {!!trustItems?.length && (
                <div>
                  <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide">{trustTitle}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {trustItems.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebuiltFunnelTop;
