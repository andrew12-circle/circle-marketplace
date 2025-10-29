import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Percent, DollarSign, ArrowRight, Clock, Star } from "lucide-react";
import circlePitchDeck from "@/assets/circle-pitch-deck.png";
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
  return <section className="relative bg-background py-12 sm:py-20 px-4 sm:px-6 overflow-hidden w-full">

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Three Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-center mb-16">
          
          {/* Left Column - Text Content */}
          <motion.div 
            className="text-left space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-3">
                Tools for your real estate business
              </h1>
              <p className="text-sm sm:text-base text-foreground/90 mb-3">
                The one-stop marketplace for agents to find the tools top producers actually use — at wholesale prices.
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleCreateAccount} 
                size="default"
                className="text-sm px-6 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all group"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Takes less than 60 seconds</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Column - Visual Mockup */}
          <motion.div 
            className="relative lg:col-span-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative mx-auto w-full">
              {/* Laptop with Brain Image */}
              <motion.div 
                className="relative scale-125 lg:scale-150"
                whileHover={{ 
                  scale: 1.3,
                  transition: { duration: 0.3 }
                }}
              >
                <img 
                  src={circlePitchDeck} 
                  alt="Circle Marketplace with AI Intelligence" 
                  className="w-full h-auto object-contain" 
                  loading="lazy"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Benefits with Enhanced Design */}
          <motion.div 
            className="relative space-y-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-2">
              <h2 className="text-lg sm:text-xl font-bold mb-0.5">AI Marketplace</h2>
              <p className="text-[10px] sm:text-xs text-foreground/80">
                Predictive Pathways, driven by AI Intelligence data, on how to close the gap of your competitors
              </p>
            </div>
            
            <div className="relative flex gap-2 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-sm group-hover:blur-md transition-all" />
                <div className="relative text-lg font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  01
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium">Save up to 20-80% on everything to power your business</p>
              </div>
            </div>
            <div className="relative flex gap-2 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-sm group-hover:blur-md transition-all" />
                <div className="relative text-lg font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  02
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium">
                  Agent advice backed by nationwide data on what top realtors use
                </p>
              </div>
            </div>
            <div className="relative flex gap-2 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-sm group-hover:blur-md transition-all" />
                <div className="relative text-lg font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  03
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium">Trusted vendors are ready — lenders, title, insurance, and more — or add your own partner with one click.</p>
              </div>
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