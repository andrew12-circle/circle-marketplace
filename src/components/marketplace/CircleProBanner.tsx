import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";

export const CircleProBanner = () => {
  return (
    <div className="my-6 sm:my-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 via-blue-500/30 to-purple-500/40 backdrop-blur-xl border border-white/30 p-6 sm:p-8 shadow-[0_8px_32px_rgba(31,38,135,0.37)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent before:rounded-2xl after:absolute after:inset-0 after:bg-gradient-to-tl after:from-transparent after:via-white/5 after:to-white/20 after:rounded-2xl animate-[liquid_6s_ease-in-out_infinite] transform-gpu perspective-1000 hover:scale-[1.02] transition-all duration-500">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        
        <div className="relative text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-yellow-300" />
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold mb-2">
            Unlock Your Full Potential with Circle Pro
          </h3>
          
          <p className="text-sm sm:text-base text-white/90 mb-6 max-w-2xl mx-auto">
            Get exclusive member pricing, earn Circle Points™ on every campaign, and access 
            powerful marketing tools to grow your business.
          </p>
          
          <Button 
            asChild 
            variant="secondary" 
            className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-6 py-2.5 h-auto"
          >
            <Link to="/pricing">
              Start Your Free Trial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};