import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Percent, DollarSign } from "lucide-react"

interface MarketplaceHeroProps {
  onExploreClick?: () => void;
}

export default function MarketplaceHero({ onExploreClick }: MarketplaceHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Don't show hero section if user is logged in
  if (user) {
    return null;
  }
  
  const handleExploreClick = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      // Default scroll behavior if no callback provided
      const servicesGrid = document.getElementById('services-grid');
      if (servicesGrid) {
        servicesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleCreateAccount = () => {
    navigate('/pricing');
  };

  return (
    <section className="bg-background py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Three Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center mb-16">
          
          {/* Left Column - Text Content */}
          <div className="text-left space-y-6">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
                Find the perfect service for your real estate business
              </h1>
              <p className="text-lg sm:text-xl text-primary font-semibold mb-2">
                Wholesale discounts
              </p>
              <p className="text-muted-foreground text-base sm:text-lg">
                Every tool you need—faster, cheaper, without the awkward sales calls.
              </p>
            </div>
            <Button
              onClick={handleCreateAccount}
              size="lg"
              className="text-base px-8 py-6"
            >
              Create Free Account
            </Button>
          </div>

          {/* Center Column - Visual Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Laptop Frame */}
              <div className="relative rounded-lg border-4 border-border bg-muted/20 shadow-2xl overflow-hidden aspect-[4/3]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Marketplace Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="text-4xl font-bold text-primary flex-shrink-0">01</div>
              <div>
                <p className="text-sm sm:text-base">
                  Save up to 80% on everything to power your business
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-4xl font-bold text-primary flex-shrink-0">02</div>
              <div>
                <p className="text-sm sm:text-base">
                  Agent advice backed by nationwide data on what top realtors use
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-4xl font-bold text-primary flex-shrink-0">03</div>
              <div>
                <p className="text-sm sm:text-base">
                  Vendors lined up ready to help cover up to 50% of your costs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Trust Bar */}
        <div className="text-center space-y-6">
          <p className="text-sm text-muted-foreground font-medium">
            Interviewed 700+ agents and counting
          </p>
          
          {/* Media Logos */}
          <div className="flex justify-center">
            <img 
              src="https://storage.googleapis.com/msgsndr/UjxJODh2Df0UKjTnKpcP/media/6879b4f857dd60a40d8545af.png" 
              alt="As Seen On Media Bar" 
              className="max-h-[60px] w-auto opacity-60"
              loading="lazy"
            />
          </div>

          {/* Scroll Down Arrow */}
          <button
            onClick={handleExploreClick}
            className="mx-auto w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center hover:bg-primary/5 transition-colors"
            aria-label="Scroll to marketplace"
          >
            <span className="text-primary text-xl">↓</span>
          </button>
        </div>
      </div>
    </section>
  )
}