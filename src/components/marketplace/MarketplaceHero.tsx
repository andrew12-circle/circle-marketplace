import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Percent, DollarSign, ArrowRight, Clock, Star } from "lucide-react";
import marketplacePreview from "@/assets/marketplace-preview.png";
import { motion } from "framer-motion";
interface MarketplaceHeroProps {
  onExploreClick?: () => void;
}
export default function MarketplaceHero({
  onExploreClick
}: MarketplaceHeroProps) {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();

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
        servicesGrid.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };
  const handleCreateAccount = () => {
    navigate('/pricing');
  };
  return <section className="relative bg-background py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Three Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-center mb-16">
          
          {/* Left Column - Text Content */}
          <motion.div 
            className="text-left space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4 lg:text-3xl">
                Find the <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">perfect tool</span> for your <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">real estate</span> business
              </h1>
              <p className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                The one-stop marketplace for agents to find the tools top producers actually use — at wholesale prices.
              </p>
              <p className="text-muted-foreground text-base sm:text-lg">
                Every tool you need—faster, cheaper, without the awkward sales calls.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleCreateAccount} 
                size="lg" 
                className="text-base px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all group"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Takes less than 60 seconds</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Column - Visual Mockup with Enhanced Card */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Floating Shadow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg blur-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Laptop Frame with Hover Effect */}
              <motion.div 
                className="relative rounded-lg border-4 border-border bg-background shadow-2xl overflow-hidden"
                whileHover={{ 
                  scale: 1.02,
                  rotateY: 2,
                  rotateX: -2,
                  transition: { duration: 0.3 }
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <img src={marketplacePreview} alt="Circle Marketplace Preview showing vendor cards" className="w-full h-auto object-cover" loading="lazy" />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Benefits with Enhanced Design */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:blur-lg transition-all" />
                <div className="relative text-4xl font-bold text-primary flex-shrink-0 w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  01
                </div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium">Save up to 20-80% on everything to power your business</p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:blur-lg transition-all" />
                <div className="relative text-4xl font-bold text-primary flex-shrink-0 w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  02
                </div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium">
                  Agent advice backed by nationwide data on what top realtors use
                </p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:blur-lg transition-all" />
                <div className="relative text-4xl font-bold text-primary flex-shrink-0 w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  03
                </div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium">Vendors lined up ready to build new relationships & reduce your costs</p>
              </div>
            </div>

            {/* Duplicate CTA */}
            <div className="pt-4 space-y-3">
              <Button 
                onClick={handleCreateAccount} 
                size="lg" 
                className="w-full text-base px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all group"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">Join 700+ agents already saving</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Enhanced Trust Bar */}
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Testimonial */}
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                </div>
                <p className="text-base sm:text-lg italic text-foreground mb-3">
                  "Finally, a platform that saves me money and time. The wholesale pricing is incredible!"
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  — Jessica P., REALTOR®
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Social Proof */}
          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground font-medium mb-4">
              As featured in
            </p>
            <div className="flex justify-center">
              <img 
                src="https://storage.googleapis.com/msgsndr/UjxJODh2Df0UKjTnKpcP/media/6879b4f857dd60a40d8545af.png" 
                alt="As Seen On Media Bar" 
                className="max-h-[60px] w-auto opacity-80 hover:opacity-100 transition-opacity" 
                loading="lazy" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Trusted by 700+ agents nationwide
            </p>
          </div>

          {/* Scroll Down Arrow */}
          <motion.button 
            onClick={handleExploreClick} 
            className="mx-auto w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-all group" 
            aria-label="Scroll to marketplace"
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-primary text-2xl group-hover:translate-y-0.5 transition-transform">↓</span>
          </motion.button>
        </motion.div>
      </div>
    </section>;
}