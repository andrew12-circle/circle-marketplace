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
  return <section className="relative bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 py-12 sm:py-20 px-4 sm:px-6 overflow-hidden w-full">

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
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
                Tools for your real estate business
              </h1>
              <p className="text-base sm:text-lg text-foreground/90 mb-4">
                The one-stop marketplace for agents to find the tools top producers actually use — at wholesale prices.
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

          {/* Center Column - Visual Mockup */}
          <motion.div 
            className="relative lg:col-span-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative mx-auto w-full max-w-2xl">
              {/* Floating Shadow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg blur-3xl"
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
              
              {/* Laptop with Brain Image */}
              <motion.div 
                className="relative scale-110"
                whileHover={{ 
                  scale: 1.15,
                  transition: { duration: 0.3 }
                }}
              >
                <img src={circlePitchDeck} alt="Circle Marketplace with AI Intelligence" className="w-full h-auto object-contain drop-shadow-2xl" loading="lazy" />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Benefits with Enhanced Design */}
          <motion.div 
            className="relative space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">AI Marketplace</h2>
              <p className="text-sm sm:text-base text-foreground/80">
                Predictive Pathways, driven by AI Intelligence data, on how to close the gap of your competitors
              </p>
            </div>
            
            <div className="relative flex gap-4 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md group-hover:blur-lg transition-all" />
                <div className="relative text-4xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                  01
                </div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium">Save up to 20-80% on everything to power your business</p>
              </div>
            </div>
            <div className="relative flex gap-4 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md group-hover:blur-lg transition-all" />
                <div className="relative text-4xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                  02
                </div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium">
                  Agent advice backed by nationwide data on what top realtors use
                </p>
              </div>
            </div>
            <div className="relative flex gap-4 group z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md group-hover:blur-lg transition-all" />
                <div className="relative text-4xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                  03
                </div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium">Trusted vendors are ready — lenders, title, insurance, and more — or add your own partner with one click.</p>
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