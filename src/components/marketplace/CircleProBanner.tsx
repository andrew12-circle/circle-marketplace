import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";

export const CircleProBanner = () => {
  return (
    <div className="my-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 p-4 sm:p-6">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="relative flex flex-col sm:flex-row items-center justify-between text-white gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Crown className="w-5 h-5 text-yellow-300" />
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold leading-tight">
                Unlock up to 80% off. Build real partnerships. Discover what's actually working.
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                Circle Pro: Exclusive pricing + earn points on every campaign
              </p>
            </div>
          </div>
          
          <Button 
            asChild 
            variant="secondary" 
            className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-4 py-2 h-auto text-sm whitespace-nowrap"
          >
            <Link to="/pricing">
              Start Free Trial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};